
import React from 'react';
import { Card } from '../types';

interface PlayingCardProps {
  card: Card;
  isMini?: boolean;
  isBack?: boolean;
}

const PlayingCard: React.FC<PlayingCardProps> = ({ card, isMini = false, isBack = false }) => {
  const isRed = card.color === 'red' || (card.name === '大王');
  const getSuitColor = () => {
    if (card.name === '大王') return 'text-red-600';
    if (card.name === '小王') return 'text-slate-900';
    if (card.suit === '♥' || card.suit === '♦') return 'text-red-600';
    return 'text-slate-900';
  };

  const suitColor = getSuitColor();

  if (isBack) {
    return (
      <div className={`relative rounded-lg shadow-xl border-2 border-slate-700 bg-slate-800 flex flex-col items-center justify-center overflow-hidden transform transition-all duration-300 ${isMini ? 'w-10 h-14' : 'w-20 h-32 md:w-24 md:h-36'}`}>
        <div className="absolute inset-1 border border-slate-600 rounded-md"></div>
        <div className="text-2xl opacity-20 rotate-45">宣</div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700/50 via-transparent to-transparent"></div>
      </div>
    );
  }

  const baseClasses = `
    relative rounded-lg shadow-xl flex flex-col border border-slate-300
    bg-white select-none transition-all duration-300 transform
    ${isMini ? 'w-10 h-14' : 'w-20 h-32 md:w-24 md:h-36'}
  `;

  const cornerSize = isMini ? 'text-[7px]' : 'text-xs';
  const mainSize = isMini ? 'text-[12px]' : 'text-2xl md:text-3xl';
  const labelSize = isMini ? 'text-[8px]' : 'text-lg md:text-xl';

  return (
    <div className={baseClasses}>
      <div className={`absolute top-0.5 left-0.5 flex flex-col items-center leading-none ${suitColor} ${cornerSize} font-black`}>
        <span>{card.value === 'Joker' ? (card.name === '大王' ? 'RJ' : 'SJ') : card.value}</span>
        <span className="scale-75 origin-top">{card.suit}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className={`absolute inset-0 flex items-center justify-center opacity-5 ${suitColor} ${isMini ? 'scale-[1.5]' : 'scale-[2.5]'}`}>
           {card.suit}
        </div>
        <div className={`z-10 flex flex-col items-center ${suitColor} leading-tight`}>
           <span className={`chinese-font font-black ${labelSize}`}>{card.name}</span>
           <span className={`${mainSize} font-bold`}>{card.suit}</span>
        </div>
      </div>

      <div className={`absolute bottom-0.5 right-0.5 flex flex-col items-center rotate-180 leading-none ${suitColor} ${cornerSize} font-black`}>
        <span>{card.value === 'Joker' ? (card.name === '大王' ? 'RJ' : 'SJ') : card.value}</span>
        <span className="scale-75 origin-top">{card.suit}</span>
      </div>
      <div className="absolute inset-0 rounded-lg pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
    </div>
  );
};

export default PlayingCard;
