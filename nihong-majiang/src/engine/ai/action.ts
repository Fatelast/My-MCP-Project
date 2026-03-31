/**
 * AI 鸣牌/和牌决策
 */
import type { Tile, Player, GameState, Action } from '../types';
import { canWin, isTenpai } from '../tenpai';
import { canPon, getChiCandidates, canMinkan } from './utils';

/**
 * AI 决定是否响应别家打出的牌（荣/碰/杠/吃）
 * @param player AI玩家
 * @param discardedTile 打出的牌
 * @param discardedBy 打出牌的玩家索引
 * @returns 选择的操作，null=不响应
 */
export function decideAction(
  player: Player,
  discardedTile: Tile,
  discardedBy: number,
  _state: GameState
): Action | null {
  const hand = player.hand;

  // 1. 优先检查能否荣和
  const canRon = canWin([...hand, discardedTile]) && !player.isFuriten;
  if (canRon) {
    return { type: 'ron', tiles: [discardedTile], playerIndex: player.id };
  }

  // 2. 检查能否碰（简单策略：50%概率碰）
  if (canPon(hand, discardedTile) && Math.random() > 0.5) {
    return { type: 'pon', tiles: [discardedTile], playerIndex: player.id };
  }

  // 3. 检查能否明杠（简单策略：30%概率杠）
  if (canMinkan(hand, discardedTile) && Math.random() > 0.7) {
    return { type: 'kan', tiles: [discardedTile], playerIndex: player.id };
  }

  // 4. 吃牌（仅上家可吃）
  const isKamicha = (discardedBy + 1) % 4 === player.id;
  if (isKamicha && player.melds.length === 0) {
    const chiOptions = getChiCandidates(hand, discardedTile);
    if (chiOptions.length > 0 && Math.random() > 0.6) {
      return { type: 'chi', tiles: chiOptions[0], playerIndex: player.id };
    }
  }

  return null;
}

/**
 * AI 决定是否自摸和牌
 */
export function decideTsumo(player: Player): boolean {
  return canWin([...player.hand]);
}

/**
 * AI 决定是否宣告立直
 */
export function decideRiichi(player: Player, _state: GameState): boolean {
  if (player.melds.length > 0) return false;
  if (player.score < 1000) return false;
  if (!isTenpai(player.hand)) return false;
  return true;
}
