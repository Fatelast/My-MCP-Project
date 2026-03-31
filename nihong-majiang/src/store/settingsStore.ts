/**
 * 游戏设置状态管理
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameSettings } from '../engine/types';

export interface SettingsStore {
  settings: GameSettings;
  setDifficulty: (d: GameSettings['aiDifficulty']) => void;
  setGameType: (t: GameSettings['gameType']) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  immer((set) => ({
    settings: {
      gameType: 'tonpuusen',
      aiDifficulty: 'normal',
      initialScore: 25000,
      useAka: true,
    },
    setDifficulty: (d) => {
      set((s) => { s.settings.aiDifficulty = d; });
    },
    setGameType: (t) => {
      set((s) => { s.settings.gameType = t; });
    },
  }))
);
