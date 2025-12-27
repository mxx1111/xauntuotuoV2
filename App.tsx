
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, PlayerId, GamePhase, GameState, Play, 
  RewardLevel 
} from './types';
import { 
  createDeck, INITIAL_STAR_COINS 
} from './constants';
import { 
  calculatePlayStrength, getValidPlays, getRewardInfo, 
  aiDecidePlay, aiEvaluateKouLe,
  checkNoXiang 
} from './gameLogic';
import PlayingCard from './components/PlayingCard';

const SoundEngine = {
  ctx: null as AudioContext | null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  },
  play(type: 'deal' | 'play' | 'win' | 'settle' | 'victory' | 'defeat') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const playTone = (freq: number, startTime: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    switch(type) {
      case 'deal': playTone(600, now, 0.1, 0.1); break;
      case 'play': playTone(150, now, 0.1, 0.1, 'square'); break;
      case 'win': playTone(800, now, 0.2, 0.1); break;
      case 'settle': playTone(400, now, 0.5, 0.1); break;
      case 'victory': 
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => playTone(f, now + i * 0.15, 0.4, 0.1, 'triangle'));
        break;
      case 'defeat':
        [349.23, 293.66, 261.63, 196.00].forEach((f, i) => playTone(f, now + i * 0.2, 0.6, 0.1, 'sawtooth'));
        break;
    }
  }
};

const AI_NAME_POOL = ['王铁柱', '李翠花', '赵大壮', '孙木耳', '钱多多', '周公瑾', '吴二娃', '郑牛牛'];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.WAITING,
    hands: { [PlayerId.PLAYER]: [], [PlayerId.AI_LEFT]: [], [PlayerId.AI_RIGHT]: [] },
    collected: { [PlayerId.PLAYER]: [], [PlayerId.AI_LEFT]: [], [PlayerId.AI_RIGHT]: [] },
    table: [],
    turn: PlayerId.PLAYER,
    starter: PlayerId.PLAYER,
    starCoins: { [PlayerId.PLAYER]: INITIAL_STAR_COINS, [PlayerId.AI_LEFT]: INITIAL_STAR_COINS, [PlayerId.AI_RIGHT]: INITIAL_STAR_COINS },
    kouLeInitiator: null,
    challengers: [],
    kouLeResponses: { [PlayerId.PLAYER]: null, [PlayerId.AI_LEFT]: null, [PlayerId.AI_RIGHT]: null },
    logs: ['欢迎来到宣坨坨！山西吕梁柳林传统扑克博弈。'],
    aiNames: { [PlayerId.AI_LEFT]: 'AI 左', [PlayerId.AI_RIGHT]: 'AI 右' },
    roundHistory: [],
    nextStarter: null
  });

  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setGameState(prev => ({ ...prev, logs: [msg, ...prev.logs].slice(0, 5) }));
  };

  const initGame = useCallback(() => {
    SoundEngine.init();
    SoundEngine.play('deal');
    const deck = createDeck().sort(() => Math.random() - 0.5);
    const hands = {
      [PlayerId.PLAYER]: deck.slice(0, 8),
      [PlayerId.AI_LEFT]: deck.slice(8, 16),
      [PlayerId.AI_RIGHT]: deck.slice(16, 24),
    };

    if (Object.values(hands).some(h => checkNoXiang(h))) {
      addLog("检测到有人无相，正在重新发牌...");
      setTimeout(initGame, 1000);
      return;
    }

    const shuffledNames = [...AI_NAME_POOL].sort(() => Math.random() - 0.5);
    const aiNames = { [PlayerId.AI_LEFT]: shuffledNames[0], [PlayerId.AI_RIGHT]: shuffledNames[1] };
    const randomStarter = [PlayerId.PLAYER, PlayerId.AI_LEFT, PlayerId.AI_RIGHT][Math.floor(Math.random() * 3)];

    setGameState(prev => ({
      ...prev, phase: GamePhase.PLAYING, hands,
      collected: { [PlayerId.PLAYER]: [], [PlayerId.AI_LEFT]: [], [PlayerId.AI_RIGHT]: [] },
      table: [], turn: randomStarter, starter: randomStarter, aiNames, roundHistory: [],
      kouLeInitiator: null, challengers: [], kouLeResponses: { [PlayerId.PLAYER]: null, [PlayerId.AI_LEFT]: null, [PlayerId.AI_RIGHT]: null },
      logs: [`本局开始！${randomStarter === PlayerId.PLAYER ? '您' : aiNames[randomStarter]} 首先出牌。`],
      nextStarter: null
    }));
  }, []);

  const resolveRound = useCallback(() => {
    setGameState(prev => {
      let winnerId = prev.table[0].playerId;
      let maxStr = prev.table[0].strength;
      prev.table.forEach(p => { if (p.strength > maxStr) { maxStr = p.strength; winnerId = p.playerId; } });
      const cardsOnTable = prev.table.reduce((acc: Card[], p) => acc.concat(p.cards), []);
      return {
        ...prev, phase: GamePhase.ROUND_OVER, roundHistory: [...prev.roundHistory, prev.table],
        collected: { ...prev.collected, [winnerId]: [...prev.collected[winnerId], ...cardsOnTable] },
        logs: [`${winnerId === PlayerId.PLAYER ? '您' : prev.aiNames[winnerId]} 赢得了本轮！`],
        nextStarter: winnerId
      };
    });

    setTimeout(() => {
      setGameState(prev => {
        const gameOver = Object.values(prev.hands).some(h => h.length === 0);
        const winnerId = prev.nextStarter || PlayerId.PLAYER;
        if (gameOver) return { ...prev, phase: GamePhase.SETTLEMENT };
        return { ...prev, phase: GamePhase.PLAYING, table: [], turn: winnerId, starter: winnerId, nextStarter: null };
      });
    }, 1500);
  }, []);

  const playCards = (playerId: PlayerId, cards: Card[], isDiscard: boolean = false) => {
    SoundEngine.play('play');
    setGameState(prev => {
      const { strength, type } = calculatePlayStrength(cards);
      const finalStrength = isDiscard ? -1 : strength;
      const newTable = [...prev.table, { playerId, cards, type: isDiscard ? 'discard' : type, strength: finalStrength }];
      if (newTable.length === 3) setTimeout(resolveRound, 800);
      return {
        ...prev,
        hands: { ...prev.hands, [playerId]: prev.hands[playerId].filter(c => !cards.some(sc => sc.id === c.id)) },
        table: newTable,
        turn: nextTurn(playerId)
      };
    });
  };

  const nextTurn = (current: PlayerId): PlayerId => {
    if (current === PlayerId.AI_LEFT) return PlayerId.PLAYER;
    if (current === PlayerId.PLAYER) return PlayerId.AI_RIGHT;
    return PlayerId.AI_LEFT;
  };

  useEffect(() => {
    if (gameState.phase === GamePhase.KOU_LE_DECISION) {
      const remainingResponders = ([PlayerId.PLAYER, PlayerId.AI_LEFT, PlayerId.AI_RIGHT] as PlayerId[]).filter(id => id !== gameState.kouLeInitiator && gameState.kouLeResponses[id] === null);
      
      if (remainingResponders.length === 0) {
        const challengers = Object.entries(gameState.kouLeResponses)
          .filter(([id, resp]) => resp === 'challenge')
          .map(([id]) => id as PlayerId);

        if (challengers.length === 0) {
          addLog("大家都同意扣了，本局提前结束。");
          setGameState(prev => ({ ...prev, phase: GamePhase.SETTLEMENT }));
        } else {
          addLog(`${challengers.map(id => id === PlayerId.PLAYER ? '您' : gameState.aiNames[id]).join(', ')} 选择了挑战！游戏继续。`);
          setGameState(prev => ({ ...prev, phase: GamePhase.PLAYING, challengers }));
        }
        return;
      }

      const nextAI = remainingResponders.find(id => id !== PlayerId.PLAYER);
      if (nextAI) {
        const timer = setTimeout(() => {
          const decision = aiEvaluateKouLe(gameState.hands[nextAI], gameState.collected[nextAI].length);
          setGameState(prev => ({
            ...prev,
            kouLeResponses: { ...prev.kouLeResponses, [nextAI]: decision }
          }));
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.phase, gameState.kouLeResponses, gameState.kouLeInitiator, gameState.hands, gameState.collected]);

  useEffect(() => {
    if (gameState.phase === GamePhase.PLAYING && gameState.turn !== PlayerId.PLAYER) {
      const timer = setTimeout(() => {
        const targetPlay = gameState.table.length > 0 ? gameState.table[0] : null;
        const currentMaxStr = gameState.table.length > 0 ? Math.max(...gameState.table.map(p => p.strength)) : -1;
        
        if (!targetPlay && Math.random() > 0.85) {
          handleInitiateKouLe(gameState.turn);
          return;
        }

        const toPlay = aiDecidePlay(gameState.hands[gameState.turn], targetPlay, currentMaxStr, gameState.collected[gameState.turn].length);
        const isDiscard = targetPlay && calculatePlayStrength(toPlay).strength <= currentMaxStr;
        playCards(gameState.turn, toPlay, isDiscard || false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.turn, gameState.table, gameState.hands, gameState.collected]);

  const handleInitiateKouLe = (pid: PlayerId) => {
    addLog(`${pid === PlayerId.PLAYER ? '您' : gameState.aiNames[pid]} 发起了“扣了”博弈。`);
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.KOU_LE_DECISION,
      kouLeInitiator: pid,
      kouLeResponses: { [PlayerId.PLAYER]: null, [PlayerId.AI_LEFT]: null, [PlayerId.AI_RIGHT]: null, [pid]: 'agree' }
    }));
  };

  const handleKouLeResponse = (resp: 'agree' | 'challenge') => {
    setGameState(prev => ({
      ...prev,
      kouLeResponses: { ...prev.kouLeResponses, [PlayerId.PLAYER]: resp }
    }));
  };

  const settlementData = useMemo(() => {
    if (gameState.phase !== GamePhase.SETTLEMENT) return [];
    const pIds = [PlayerId.PLAYER, PlayerId.AI_LEFT, PlayerId.AI_RIGHT];
    const rewards = pIds.map(id => ({ id, ...getRewardInfo(gameState.collected[id].length) }));
    
    const winners = rewards.filter(r => r.coins > 0);
    const losers = rewards.filter(r => r.coins === 0);

    let results = pIds.map(id => ({ id, netGain: 0, level: getRewardInfo(gameState.collected[id].length).level, cards: gameState.collected[id].length, isChallengerFailed: false }));

    losers.forEach(loser => {
      winners.forEach(winner => {
        let finalCoins = winner.coins;
        let failed = false;

        if (gameState.challengers.includes(loser.id)) {
          finalCoins = winner.coins * 2;
          failed = true;
        }

        const loserIdx = results.findIndex(r => r.id === loser.id);
        const winnerIdx = results.findIndex(r => r.id === winner.id);
        results[loserIdx].netGain -= finalCoins;
        results[winnerIdx].netGain += finalCoins;
        if (failed) results[loserIdx].isChallengerFailed = true;
      });
    });

    return results;
  }, [gameState.phase, gameState.collected, gameState.challengers]);

  useEffect(() => {
    if (gameState.phase === GamePhase.SETTLEMENT) {
      const playerRes = settlementData.find(r => r.id === PlayerId.PLAYER);
      if (playerRes && playerRes.netGain >= 0) SoundEngine.play('victory');
      else SoundEngine.play('defeat');
    }
  }, [gameState.phase, settlementData]);

  const currentMaxStr = useMemo(() => gameState.table.length > 0 ? Math.max(...gameState.table.map(p => p.strength)) : -1, [gameState.table]);
  const canPlayerWin = useMemo(() => {
    const targetPlay = gameState.table.length > 0 ? gameState.table[0] : null;
    if (!targetPlay) return true;
    return getValidPlays(gameState.hands[PlayerId.PLAYER], targetPlay, currentMaxStr).length > 0;
  }, [gameState.hands, gameState.table, currentMaxStr]);

  const handleAction = (isDiscard: boolean) => {
    const targetPlay = gameState.table.length > 0 ? gameState.table[0] : null;
    if (!targetPlay && isDiscard) return;
    if (isDiscard) {
      if (canPlayerWin) { addLog("有管上的大牌，必须出牌！"); return; }
      if (selectedCards.length !== (targetPlay?.cards.length || 0)) { addLog(`需扣 ${targetPlay?.cards.length} 张。`); return; }
      playCards(PlayerId.PLAYER, selectedCards, true);
    } else {
      const playInfo = calculatePlayStrength(selectedCards);
      if (targetPlay) {
        if (selectedCards.length !== targetPlay.cards.length) { addLog(`数量不符，需出 ${targetPlay.cards.length} 张。`); return; }
        if (playInfo.strength <= currentMaxStr) { addLog("牌力不足！"); return; }
      } else if (playInfo.type === 'discard') { addLog("牌型不合法。"); return; }
      playCards(PlayerId.PLAYER, selectedCards, false);
    }
    setSelectedCards([]);
  };

  const playerHandSorted = useMemo(() => {
    const others = gameState.hands[PlayerId.PLAYER].filter(c => c.name !== '大王' && c.name !== '小王');
    const kings = gameState.hands[PlayerId.PLAYER].filter(c => c.name === '大王' || c.name === '小王').sort((a,b) => a.strength - b.strength);
    const sortedOthers = others.sort((a,b) => a.strength - b.strength);
    const result = [...sortedOthers];
    const insertIdx = result.findIndex(c => c.strength >= 14);
    if (insertIdx === -1) result.push(...kings);
    else result.splice(insertIdx, 0, ...kings);
    return result;
  }, [gameState.hands]);

  // 固定席位渲染逻辑
  const renderTableSlot = (pid: PlayerId) => {
    const play = gameState.table.find(p => p.playerId === pid);
    if (!play) return <div className="w-20 md:w-24 opacity-0 pointer-events-none" />; // 占位符
    return (
      <div key={play.playerId} className={`flex flex-col items-center gap-2 animate-in zoom-in duration-300 ${play.playerId === PlayerId.PLAYER ? 'translate-y-12' : ''}`}>
        <div className="flex -space-x-12 md:-space-x-16">
          {play.cards.map((c, i) => <div key={c.id} style={{ zIndex: i }}><PlayingCard card={c} isBack={play.type === 'discard'} /></div>)}
        </div>
        <div className="px-3 py-1 bg-slate-900/80 rounded-full text-[10px] font-black border border-white/10 shadow-lg">
          {play.playerId === PlayerId.PLAYER ? '您' : gameState.aiNames[play.playerId]} · {play.type === 'discard' ? '扣牌' : (play.playerId === gameState.starter ? '出牌' : '跟进')}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative landscape:flex-row">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="flex-1 flex flex-col h-full relative">
        <div className="h-14 flex justify-between items-center px-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-50">
          <div className="flex flex-col">
            <span className="text-xl font-black text-emerald-500 chinese-font">宣坨坨</span>
            <span className="text-[8px] opacity-40 uppercase tracking-widest">Xuan Tuo Tuo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
               <span className="text-yellow-500 text-base">🪙</span>
               <span className="font-bold text-yellow-100">{gameState.starCoins[PlayerId.PLAYER]}</span>
            </div>
            <button onClick={() => setShowHistory(true)} className="w-10 h-10 bg-slate-800 rounded-xl hover:bg-slate-700 flex items-center justify-center border border-white/5 transition-all active:scale-90">📜</button>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center landscape:pb-12">
          {/* 头像区域保持不变 */}
          <div className="absolute top-6 left-6 flex flex-col items-center gap-2 z-30">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 bg-slate-900 flex items-center justify-center text-2xl md:text-3xl shadow-2xl transition-all duration-500 ${gameState.turn === PlayerId.AI_LEFT ? 'border-emerald-500 ring-4 ring-emerald-500/20 scale-110' : 'border-white/10'}`}>👴</div>
            <div className="flex flex-col items-center gap-0.5">
               <span className="text-[10px] md:text-[11px] font-black text-slate-300 chinese-font">{gameState.aiNames[PlayerId.AI_LEFT]} ({gameState.hands[PlayerId.AI_LEFT].length})</span>
               <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[8px] md:text-[9px] font-black">已收: {gameState.collected[PlayerId.AI_LEFT].length}</div>
            </div>
          </div>

          <div className="absolute top-6 right-6 flex flex-col items-center gap-2 z-30">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 bg-slate-900 flex items-center justify-center text-2xl md:text-3xl shadow-2xl transition-all duration-500 ${gameState.turn === PlayerId.AI_RIGHT ? 'border-emerald-500 ring-4 ring-emerald-500/20 scale-110' : 'border-white/10'}`}>🧔</div>
            <div className="flex flex-col items-center gap-0.5">
               <span className="text-[10px] md:text-[11px] font-black text-slate-300 chinese-font">{gameState.aiNames[PlayerId.AI_RIGHT]} ({gameState.hands[PlayerId.AI_RIGHT].length})</span>
               <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[8px] md:text-[9px] font-black">已收: {gameState.collected[PlayerId.AI_RIGHT].length}</div>
            </div>
          </div>

          {/* 重点修改：固定槽位排布 [左, 中, 右] */}
          <div className="flex items-center justify-center gap-8 md:gap-24 z-20 w-full max-w-5xl px-10 scale-90 md:scale-100">
            {renderTableSlot(PlayerId.AI_LEFT)}
            {renderTableSlot(PlayerId.PLAYER)}
            {renderTableSlot(PlayerId.AI_RIGHT)}
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
            <span className="text-[15rem] md:text-[28rem] font-black chinese-font">宣</span>
          </div>

          <div className="absolute left-6 bottom-4 space-y-2 z-40 max-w-[220px] hidden md:block">
             <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-black">收牌: {gameState.collected[PlayerId.PLAYER].length}</div>
             {gameState.logs.map((log, i) => <div key={i} className={`text-[10px] px-3 py-2 rounded-xl bg-slate-900/70 border border-white/5 backdrop-blur-md animate-in slide-in-from-left ${i === 0 ? 'text-emerald-400 border-emerald-500/20' : 'text-slate-500 opacity-60'}`}>{log}</div>)}
          </div>

          {gameState.phase === GamePhase.KOU_LE_DECISION && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-slate-900 border border-emerald-500/40 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                <div className="text-3xl mb-4">⚖️</div>
                <h3 className="text-xl font-black text-emerald-500 chinese-font mb-2">“扣了”博弈中</h3>
                <p className="text-sm text-slate-400 mb-6">
                  {gameState.kouLeInitiator === PlayerId.PLAYER ? '您发起了博弈，等待其他玩家响应...' : `${gameState.aiNames[gameState.kouLeInitiator!]} 发起了博弈，您是否挑战？`}
                </p>
                {gameState.kouLeInitiator !== PlayerId.PLAYER && gameState.kouLeResponses[PlayerId.PLAYER] === null && (
                  <div className="flex gap-4">
                    <button onClick={() => handleKouLeResponse('agree')} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-black transition-all">扣了(同意)</button>
                    <button onClick={() => handleKouLeResponse('challenge')} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black transition-all">宣(挑战)</button>
                  </div>
                )}
                {Object.entries(gameState.kouLeResponses).map(([id, resp]) => id !== gameState.kouLeInitiator && resp && (
                  <div key={id} className="text-xs text-emerald-400/60 mt-2">
                    {id === PlayerId.PLAYER ? '您' : gameState.aiNames[id]} 选择了：{resp === 'agree' ? '扣了' : '挑战'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-44 md:h-64 bg-slate-900/95 border-t border-white/5 p-4 flex items-end justify-center relative z-40 overflow-visible">
           {gameState.phase === GamePhase.WAITING && (
             <button onClick={initGame} className="px-16 py-6 bg-emerald-600 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all chinese-font">开 始 游 戏</button>
           )}
           
           {gameState.phase === GamePhase.PLAYING && gameState.turn === PlayerId.PLAYER && gameState.table.length === 0 && (
              <button onClick={() => handleInitiateKouLe(PlayerId.PLAYER)} className="absolute top-[-50px] left-1/2 -translate-x-1/2 px-8 py-2 bg-orange-900/40 border border-orange-500/30 rounded-full text-orange-400 text-xs font-black hover:bg-orange-800 transition-all z-50 backdrop-blur-md">发起“扣了”？</button>
           )}

           <div className="flex-1 flex gap-2 justify-center pb-4 px-10 overflow-visible max-w-7xl">
             {playerHandSorted.map((c, i) => {
               const isSel = selectedCards.some(sc => sc.id === c.id);
               const isHovered = hoveredCardId === c.id;
               const zIndex = isHovered ? 1000 : (isSel ? 500 + i : 10 + i);
               return (
                 <div key={c.id} onMouseEnter={() => setHoveredCardId(c.id)} onMouseLeave={() => setHoveredCardId(null)} onClick={() => setSelectedCards(prev => isSel ? prev.filter(sc => sc.id !== c.id) : [...prev, c])}
                   className={`transition-all duration-300 cursor-pointer relative ${isSel ? '-translate-y-12 scale-110' : 'hover:-translate-y-8 hover:scale-105'}`}
                   style={{ marginLeft: i === 0 ? 0 : '-2.5rem', zIndex }}>
                   <div className={`${isSel || isHovered ? 'drop-shadow-[0_0_25px_rgba(16,185,129,0.8)]' : 'drop-shadow-lg'} scale-90 md:scale-100`}>
                    <PlayingCard card={c} />
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      <div className="w-20 md:w-28 landscape:h-screen bg-slate-900 border-l border-white/10 flex flex-col items-center justify-center p-4 gap-4 md:gap-8 z-[100]">
        <button onClick={() => handleAction(false)} disabled={selectedCards.length === 0 || gameState.turn !== PlayerId.PLAYER}
          className={`w-full py-4 md:py-7 rounded-xl md:rounded-2xl font-black chinese-font transition-all text-base md:text-xl border border-white/5 ${selectedCards.length > 0 && gameState.turn === PlayerId.PLAYER ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-90' : 'bg-slate-800 text-slate-600 opacity-30 cursor-not-allowed'}`}>
          {gameState.table.length === 0 ? '出' : '跟'}<br/>{gameState.table.length === 0 ? '牌' : '进'}
        </button>
        <button onClick={() => handleAction(true)} disabled={selectedCards.length === 0 || gameState.turn !== PlayerId.PLAYER || !gameState.table.length}
          className={`w-full py-4 md:py-7 rounded-xl md:rounded-2xl font-black chinese-font transition-all text-base md:text-xl border border-white/5 ${selectedCards.length > 0 && gameState.turn === PlayerId.PLAYER && !canPlayerWin ? 'bg-orange-700 hover:bg-orange-600 active:scale-90' : 'bg-slate-800 text-slate-600 opacity-30 cursor-not-allowed'}`}>
          扣<br/>牌
        </button>
        <div className="h-px w-full bg-white/5"></div>
        <button onClick={() => setSelectedCards([])} className="w-full py-2 md:py-4 bg-slate-800 rounded-xl text-[10px] md:text-xs font-black text-slate-400 active:scale-90 transition-all">清 空</button>
      </div>

      {gameState.phase === GamePhase.SETTLEMENT && (
        <div className="absolute inset-0 z-[300] bg-slate-950/98 flex items-center justify-center p-4 backdrop-blur-3xl animate-in zoom-in">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 p-10 rounded-[40px] shadow-2xl">
            <h2 className="text-4xl font-black chinese-font text-emerald-500 text-center mb-10 tracking-widest">对局结算</h2>
            <div className="space-y-4 mb-10">
              {settlementData.map(res => (
                <div key={res.id} className={`flex justify-between items-center p-5 bg-white/5 rounded-2xl border ${res.isChallengerFailed ? 'border-orange-500/40' : 'border-white/5'}`}>
                  <span className="font-black text-lg chinese-font">{res.id === PlayerId.PLAYER ? '您自己' : gameState.aiNames[res.id]}</span>
                  <div className="flex flex-col items-end">
                     <span className={`font-black px-3 py-1 rounded-lg ${res.netGain >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{res.level} ({res.cards}张)</span>
                     <span className={`text-xs font-bold mt-1 ${res.netGain >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                       {res.netGain >= 0 ? `+${res.netGain}` : res.netGain} 星光币
                       {res.isChallengerFailed && <span className="ml-2 text-[8px] bg-red-900/40 px-1 rounded text-red-400">挑战失败 ×2</span>}
                     </span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setGameState(prev => ({...prev, phase: GamePhase.WAITING}))} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xl shadow-2xl transition-all chinese-font">整 顿 再 战</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
