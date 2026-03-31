/**
 * 游戏主循环 Hook
 * 监听 gamePhase，AI 回合自动触发决策（含延迟模拟思考）
 */
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { getAITurnAction, getAIResponseAction, getAIThinkingDelay } from '../engine/ai';
import { chooseDiscard } from '../engine/ai/discard';

/**
 * 游戏主循环
 * 自动处理 AI 摸牌、出牌、响应等操作
 */
export function useGameLoop() {
  const gameState = useGameStore((s) => s.gameState);
  const aiDraw = useGameStore((s) => s.aiDraw);
  const aiDiscard = useGameStore((s) => s.aiDiscard);
  const aiAction = useGameStore((s) => s.aiAction);
  const { settings } = useSettingsStore();

  // 防止重复触发
  const processingRef = useRef(false);

  useEffect(() => {
    if (!gameState || processingRef.current) return;
    const { phase, currentPlayer, players, availableActions } = gameState;

    // AI 回合：摸牌
    if (phase === 'aiTurn' && currentPlayer !== 0) {
      processingRef.current = true;
      const delay = getAIThinkingDelay(settings.aiDifficulty);

      const timer = setTimeout(async () => {
        try {
          // 1. AI 摸牌
          aiDraw(currentPlayer);

          // 2. 摸牌后决策（需要在下一个状态更新后执行）
          // 通过再次延迟来等待状态更新
          setTimeout(async () => {
            const updatedState = useGameStore.getState().gameState;
            if (!updatedState) return;
            const aiPlayer = updatedState.players[currentPlayer];

            const action = await getAITurnAction(aiPlayer, updatedState);

            if (action.type === 'tsumo') {
              aiAction({ type: 'tsumo', playerIndex: currentPlayer });
            } else if (action.type === 'riichi') {
              // 立直：选择出牌后立直
              const discardTile = chooseDiscard(aiPlayer.hand, aiPlayer);
              aiAction({ type: 'riichi', tiles: [discardTile], playerIndex: currentPlayer });
            } else {
              // 普通出牌
              const discardTile = action.tiles?.[0] ?? chooseDiscard(aiPlayer.hand, aiPlayer);
              aiDiscard(currentPlayer, discardTile);
            }
            processingRef.current = false;
          }, 200);
        } catch (e) {
          console.error('AI turn error:', e);
          processingRef.current = false;
        }
      }, delay);

      return () => clearTimeout(timer);
    }

    // action 阶段：处理 AI 玩家的响应
    if (phase === 'action') {
      const aiResponses = availableActions.filter(
        (a) => a.playerIndex !== 0 && a.playerIndex !== undefined
      );

      if (aiResponses.length === 0) return;

      processingRef.current = true;
      const timer = setTimeout(async () => {
        try {
          const discardedTile = gameState.lastDiscard!;
          const discardedBy = gameState.lastDiscardPlayer!;

          // 收集所有 AI 玩家的响应
          let bestAction = null;
          const aiPlayerIndices = [...new Set(aiResponses.map((a) => a.playerIndex!))];

          for (const idx of aiPlayerIndices) {
            const aiPlayer = players[idx];
            const response = await getAIResponseAction(
              aiPlayer,
              discardedTile,
              discardedBy,
              gameState
            );
            // 优先荣和
            if (response?.type === 'ron') {
              bestAction = response;
              break;
            }
            if (response && !bestAction) {
              bestAction = response;
            }
          }

          aiAction(bestAction); // null = 跳过
        } catch (e) {
          console.error('AI response error:', e);
          aiAction(null);
        } finally {
          processingRef.current = false;
        }
      }, 600);

      return () => clearTimeout(timer);
    }

    processingRef.current = false;
  }, [gameState?.phase, gameState?.currentPlayer, gameState?.turnCount]);
}
