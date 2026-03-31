/**
 * 玩家操作 Hook
 * 封装玩家出牌、立直、鸣牌等操作
 */
import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Tile, Action } from '../engine/types';
import { isTenpai } from '../engine/tenpai';

/**
 * 玩家操作封装
 */
export function usePlayerAction() {
  const gameState = useGameStore((s) => s.gameState);
  const playerDiscard = useGameStore((s) => s.playerDiscard);
  const playerAction = useGameStore((s) => s.playerAction);

  /**
   * 玩家出牌
   */
  const handleDiscard = useCallback(
    (tile: Tile) => {
      if (!gameState) return;
      if (gameState.phase !== 'playerTurn') return;
      if (gameState.currentPlayer !== 0) return;
      playerDiscard(tile);
    },
    [gameState, playerDiscard]
  );

  /**
   * 玩家执行操作
   */
  const handleAction = useCallback(
    (action: Action) => {
      if (!gameState) return;
      playerAction(action);
    },
    [gameState, playerAction]
  );

  /**
   * 检查玩家是否可以立直
   */
  const canRiichi = useCallback(() => {
    if (!gameState) return false;
    const player = gameState.players[0];
    if (player.isRiichi) return false;
    if (player.melds.length > 0) return false;
    if (player.score < 1000) return false;
    return isTenpai(player.hand);
  }, [gameState]);

  /**
   * 检查玩家是否可以自摸
   */
  const canTsumo = useCallback(() => {
    if (!gameState) return false;
    if (gameState.phase !== 'playerTurn') return false;
    if (gameState.currentPlayer !== 0) return false;
    const player = gameState.players[0];
    return player.hand.length === 14;
  }, [gameState]);

  return { handleDiscard, handleAction, canRiichi, canTsumo };
}
