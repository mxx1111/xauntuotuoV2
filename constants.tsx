
import React from 'react';
import { Card, Color, CardName } from './types';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  
  // 卒 (7) - 红卒: 18; 黑卒: 17
  deck.push({ id: 'r_z1', name: '卒', color: 'red', value: '7', suit: '♥', strength: 18 });
  deck.push({ id: 'r_z2', name: '卒', color: 'red', value: '7', suit: '♦', strength: 18 });
  deck.push({ id: 'b_z1', name: '卒', color: 'black', value: '7', suit: '♠', strength: 17 });
  deck.push({ id: 'b_z2', name: '卒', color: 'black', value: '7', suit: '♣', strength: 17 });

  // 马 (8) - 红马: 20; 黑马: 19
  deck.push({ id: 'r_m1', name: '马', color: 'red', value: '8', suit: '♥', strength: 20 });
  deck.push({ id: 'r_m2', name: '马', color: 'red', value: '8', suit: '♦', strength: 20 });
  deck.push({ id: 'b_m1', name: '马', color: 'black', value: '8', suit: '♠', strength: 19 });
  deck.push({ id: 'b_m2', name: '马', color: 'black', value: '8', suit: '♣', strength: 19 });

  // 相 (9) - 红相: 22; 黑相: 21
  deck.push({ id: 'r_x1', name: '相', color: 'red', value: '9', suit: '♥', strength: 22 });
  deck.push({ id: 'r_x2', name: '相', color: 'red', value: '9', suit: '♦', strength: 22 });
  deck.push({ id: 'b_x1', name: '相', color: 'black', value: '9', suit: '♠', strength: 21 });
  deck.push({ id: 'b_x2', name: '相', color: 'black', value: '9', suit: '♣', strength: 21 });

  // 尔 (10) - 红尔: 24; 黑尔: 23
  deck.push({ id: 'r_e1', name: '尔', color: 'red', value: '10', suit: '♥', strength: 24 });
  deck.push({ id: 'r_e2', name: '尔', color: 'red', value: '10', suit: '♦', strength: 24 });
  deck.push({ id: 'b_e1', name: '尔', color: 'black', value: '10', suit: '♠', strength: 23 });
  deck.push({ id: 'b_e2', name: '尔', color: 'black', value: '10', suit: '♣', strength: 23 });

  // 大王 (16) - 与红曲曲相等
  deck.push({ id: 'bj', name: '大王', color: 'none', value: 'RJ', suit: '★', strength: 16 });

  // 红曲曲 (16)
  deck.push({ id: 'r_q1', name: '曲', color: 'red', value: 'J', suit: '♥', strength: 16 });
  deck.push({ id: 'r_q2', name: '曲', color: 'red', value: 'Q', suit: '♥', strength: 16 });
  deck.push({ id: 'r_q3', name: '曲', color: 'red', value: 'K', suit: '♥', strength: 16 });

  // 小王 (14) - 与黑曲曲相等
  deck.push({ id: 'sj', name: '小王', color: 'none', value: 'SJ', suit: '☆', strength: 14 });

  // 黑曲曲 (14)
  deck.push({ id: 'b_q1', name: '曲', color: 'black', value: 'J', suit: '♠', strength: 14 });
  deck.push({ id: 'b_q2', name: '曲', color: 'black', value: 'Q', suit: '♠', strength: 14 });
  deck.push({ id: 'b_q3', name: '曲', color: 'black', value: 'K', suit: '♠', strength: 14 });

  return deck;
};

export const INITIAL_STAR_COINS = 100;
