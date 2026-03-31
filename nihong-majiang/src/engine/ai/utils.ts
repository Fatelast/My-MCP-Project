/**
 * AI 辅助工具函数
 */
import type { Tile } from '../types';
import { countTile, sortTiles } from '../tiles';

/**
 * 检查手牌中是否可以碰某张牌
 */
export function canPon(hand: Tile[], tile: Tile): boolean {
  return countTile(hand, tile) >= 2;
}

/**
 * 检查手牌中是否可以明杠某张牌
 */
export function canMinkan(hand: Tile[], tile: Tile): boolean {
  return countTile(hand, tile) >= 3;
}

/**
 * 获取所有合法的吃牌组合
 */
export function getChiCandidates(hand: Tile[], tile: Tile): Tile[][] {
  if (tile.suit === 'honor') return [];
  const combinations: Tile[][] = [];
  const v = tile.value;
  const s = tile.suit;

  const patterns: [number, number][] = [
    [v - 2, v - 1],
    [v - 1, v + 1],
    [v + 1, v + 2],
  ];

  for (const [a, b] of patterns) {
    if (a < 1 || b > 9) continue;
    const tileA = hand.find((t) => t.suit === s && t.value === a);
    const tileB = hand.find((t) => t.suit === s && t.value === b);
    if (tileA && tileB) {
      combinations.push(sortTiles([tileA, tileB, tile]));
    }
  }

  return combinations;
}
