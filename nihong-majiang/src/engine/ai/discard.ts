/**
 * AI 出牌策略
 * 基础策略：优先打孤立牌，保留搭子和对子
 */
import type { Tile, Player } from '../types';
import { sortTiles, sameTile } from '../tiles';
import { getWaitingTiles, isTenpai } from '../tenpai';

/**
 * 计算手牌中每张牌的「有效牌数」（去掉该牌后听牌进张数变化）
 * 数值越小 → 越适合打出
 */
function getTileEfficiency(hand: Tile[], target: Tile): number {
  const withoutTile = hand.filter((t) => t.id !== target.id);
  if (withoutTile.length < 13) {
    // 补一张虚拟牌保持13张用于评估
    return getWaitingTiles(withoutTile).length;
  }
  return getWaitingTiles(withoutTile).length;
}

/**
 * 判断某张牌是否是孤立牌（无相邻搭子）
 */
function isIsolated(tile: Tile, hand: Tile[]): boolean {
  if (tile.suit === 'honor') {
    // 字牌：没有刻子搭子则孤立
    return hand.filter((t) => sameTile(t, tile)).length < 2;
  }
  const v = tile.value;
  const s = tile.suit;
  const hasNeighbor = hand.some(
    (t) =>
      t.id !== tile.id &&
      t.suit === s &&
      (t.value === v - 2 ||
        t.value === v - 1 ||
        t.value === v + 1 ||
        t.value === v + 2)
  );
  return !hasNeighbor;
}

/**
 * AI 出牌决策（14张手牌，选择打出哪张）
 * 优先级：
 * 1. 已听牌 → 打不影响听牌的牌
 * 2. 孤立字牌 → 优先打高价值字牌（三元>场风>自风>非场风）
 * 3. 孤立数牌 → 优先打边张（1、9）
 * 4. 效率最低的牌
 * @param hand 14张手牌
 * @param player 玩家信息（用于立直状态判断）
 * @returns 建议打出的牌
 */
export function chooseDiscard(hand: Tile[], player: Player): Tile {
  // 立直状态：只能打摸到的最后一张牌（手牌最后一张）
  if (player.isRiichi) {
    return hand[hand.length - 1];
  }

  const sorted = sortTiles(hand);

  // 已听牌：找打出后仍然听牌的牌
  if (hand.length === 14) {
    for (const tile of sorted) {
      const without = hand.filter((t) => t.id !== tile.id);
      if (isTenpai(without)) {
        return tile;
      }
    }
  }

  // 孤立字牌优先打出
  const isolatedHonors = sorted.filter(
    (t) => t.suit === 'honor' && isIsolated(t, hand)
  );
  if (isolatedHonors.length > 0) {
    // 字牌中优先打非三元非场风的
    const safeHonor = isolatedHonors.find((t) => t.value <= 4);
    return safeHonor ?? isolatedHonors[0];
  }

  // 孤立边张数牌
  const isolatedEdge = sorted.find(
    (t) =>
      t.suit !== 'honor' &&
      (t.value === 1 || t.value === 9) &&
      isIsolated(t, hand)
  );
  if (isolatedEdge) return isolatedEdge;

  // 其他孤立数牌
  const isolatedNumber = sorted.find(
    (t) => t.suit !== 'honor' && isIsolated(t, hand)
  );
  if (isolatedNumber) return isolatedNumber;

  // 按效率选：效率最低的打出
  let minEfficiency = Infinity;
  let bestDiscard = sorted[0];
  for (const tile of sorted) {
    const eff = getTileEfficiency(hand, tile);
    if (eff < minEfficiency) {
      minEfficiency = eff;
      bestDiscard = tile;
    }
  }

  return bestDiscard;
}
