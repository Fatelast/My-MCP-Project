/**
 * 游戏全局状态管理（Zustand）
 * 包装 engine/game.ts 的纯函数，提供 React 可用的 actions
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, Action, Tile, GameSettings, ScoreResult } from '../engine/types';
import {
  initGame,
  drawTile,
  discardTile,
  processAction,
  nextRound,
} from '../engine/game';
import { calculateScore } from '../engine/yaku/scoring';

export interface GameStore {
  /** 当前游戏状态 */
  gameState: GameState | null;
  /** 最近一次和牌结算结果 */
  lastScoreResult: ScoreResult | null;
  /** 是否显示结算弹窗 */
  showScoreModal: boolean;
  /** 和牌玩家索引 */
  winnerIndex: number | null;

  // Actions
  /** 开始新游戏 */
  startGame: (settings: GameSettings) => void;
  /** 玩家出牌 */
  playerDiscard: (tile: Tile) => void;
  /** 玩家执行操作（吃碰杠荣自摸立直跳过） */
  playerAction: (action: Action) => void;
  /** AI 摸牌（由 useGameLoop 调用） */
  aiDraw: (playerIndex: number) => void;
  /** AI 出牌（由 useGameLoop 调用） */
  aiDiscard: (playerIndex: number, tile: Tile) => void;
  /** AI 响应操作（由 useGameLoop 调用） */
  aiAction: (action: Action | null) => void;
  /** 关闭结算弹窗，进入下一局 */
  continueToNextRound: () => void;
  /** 重置游戏 */
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    gameState: null,
    lastScoreResult: null,
    showScoreModal: false,
    winnerIndex: null,

    startGame: (settings) => {
      set((state) => {
        state.gameState = initGame(settings);
        state.lastScoreResult = null;
        state.showScoreModal = false;
        state.winnerIndex = null;
      });
    },

    playerDiscard: (tile) => {
      set((state) => {
        if (!state.gameState) return;
        state.gameState = discardTile(state.gameState, 0, tile);
      });
    },

    playerAction: (action) => {
      set((state) => {
        if (!state.gameState) return;
        const gs = state.gameState;

        // 和牌：计算结算结果
        if (action.type === 'ron' || action.type === 'tsumo') {
          const player = gs.players[action.playerIndex ?? 0];
          const winTile = action.type === 'tsumo'
            ? player.hand[player.hand.length - 1]
            : gs.lastDiscard!;
          const result = calculateScore(
            player, gs, winTile,
            action.type === 'tsumo',
            action.playerIndex ?? 0,
            action.type === 'ron' ? (gs.lastDiscardPlayer ?? 0) : -1
          );
          state.lastScoreResult = result;
          state.winnerIndex = action.playerIndex ?? 0;
          state.showScoreModal = true;
        }

        state.gameState = processAction(state.gameState, action);
      });
    },

    aiDraw: (playerIndex) => {
      set((state) => {
        if (!state.gameState) return;
        state.gameState = drawTile(state.gameState, playerIndex);
      });
    },

    aiDiscard: (playerIndex, tile) => {
      set((state) => {
        if (!state.gameState) return;
        state.gameState = discardTile(state.gameState, playerIndex, tile);
      });
    },

    aiAction: (action) => {
      set((state) => {
        if (!state.gameState) return;
        if (!action) {
          // 跳过
          state.gameState = processAction(state.gameState, { type: 'skip' });
          return;
        }
        // AI 和牌
        if (action.type === 'ron' || action.type === 'tsumo') {
          const gs = state.gameState;
          const player = gs.players[action.playerIndex ?? 0];
          const winTile = action.type === 'tsumo'
            ? player.hand[player.hand.length - 1]
            : gs.lastDiscard!;
          const result = calculateScore(
            player, gs, winTile,
            action.type === 'tsumo',
            action.playerIndex ?? 0,
            action.type === 'ron' ? (gs.lastDiscardPlayer ?? 0) : -1
          );
          state.lastScoreResult = result;
          state.winnerIndex = action.playerIndex ?? 0;
          state.showScoreModal = true;
        }
        state.gameState = processAction(state.gameState, action);
      });
    },

    continueToNextRound: () => {
      set((state) => {
        if (!state.gameState) return;
        state.gameState = nextRound(state.gameState, state.winnerIndex);
        state.lastScoreResult = null;
        state.showScoreModal = false;
        state.winnerIndex = null;
      });
    },

    resetGame: () => {
      set((state) => {
        state.gameState = null;
        state.lastScoreResult = null;
        state.showScoreModal = false;
        state.winnerIndex = null;
      });
    },
  }))
);
