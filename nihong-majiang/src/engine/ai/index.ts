/**
 * AI 决策总入口
 * 带 2000ms 超时兜底，防止游戏卡死
 */
import type { Tile, Player, GameState, Action } from '../types';
import { chooseDiscard } from './discard';
import { decideAction, decideTsumo, decideRiichi } from './action';

const AI_TIMEOUT_MS = 2000;

/**
 * 带超时的 Promise 包装
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

/**
 * AI 摸牌后决策：出哪张牌 / 是否自摸 / 是否立直
 * @returns Action
 */
export async function getAITurnAction(
  player: Player,
  state: GameState
): Promise<Action> {
  const decisionPromise = new Promise<Action>((resolve) => {
    // 1. 检查自摸
    if (decideTsumo(player)) {
      resolve({ type: 'tsumo', playerIndex: player.id });
      return;
    }
    // 2. 检查暗杠（简化：不处理暗杠）
    // 3. 检查立直
    if (decideRiichi(player, state)) {
      resolve({ type: 'riichi', playerIndex: player.id });
      return;
    }
    // 4. 选择出牌
    const discardTile = chooseDiscard(player.hand, player);
    resolve({ type: 'skip', tiles: [discardTile], playerIndex: player.id });
  });

  // 默认兜底：打第一张牌
  const fallback: Action = {
    type: 'skip',
    tiles: [player.hand[0]],
    playerIndex: player.id,
  };

  return withTimeout(decisionPromise, AI_TIMEOUT_MS, fallback);
}

/**
 * AI 响应别家打牌：是否荣/碰/杠/吃
 * @param discardedTile 被打出的牌
 * @param discardedBy 打牌方玩家索引
 * @returns Action | null（null=跳过）
 */
export async function getAIResponseAction(
  player: Player,
  discardedTile: Tile,
  discardedBy: number,
  state: GameState
): Promise<Action | null> {
  const decisionPromise = new Promise<Action | null>((resolve) => {
    const action = decideAction(player, discardedTile, discardedBy, state);
    resolve(action);
  });

  return withTimeout(decisionPromise, AI_TIMEOUT_MS, null);
}

/**
 * 模拟 AI 思考延迟（拟人感）
 * @param difficulty 难度
 */
export function getAIThinkingDelay(difficulty: 'easy' | 'normal' | 'hard'): number {
  const ranges: Record<string, [number, number]> = {
    easy:   [1200, 2000],
    normal: [800,  1500],
    hard:   [400,  900],
  };
  const [min, max] = ranges[difficulty];
  return Math.floor(Math.random() * (max - min)) + min;
}
