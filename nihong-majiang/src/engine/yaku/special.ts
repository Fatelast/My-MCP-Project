/**
 * 特殊役种判定：七对子
 */
import type { WinContext } from './basic';
import type { YakuResult } from '../types';

/**
 * 七对子
 * 7组不同的对子（25符固定，不计符数）
 */
export function checkChiitoitsu(ctx: WinContext): YakuResult | null {
  const { hand } = ctx.player;
  if (hand.length !== 14) return null;

  const counts = new Map<string, number>();
  for (const t of hand) {
    const key = `${t.suit}-${t.value}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const pairs = [...counts.values()].filter((c) => c >= 2);
  if (pairs.length === 7) {
    return { name: '七对子', han: 2 }; // 不可副露，固定25符
  }
  return null;
}
