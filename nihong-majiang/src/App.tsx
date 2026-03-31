/**
 * App 根组件
 * 根据游戏状态切换：开始界面 ↔ 游戏界面
 */
import React from 'react';
import { useGameStore } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { GameBoard } from './components/GameBoard';
import { ScoreModal } from './components/ScoreModal';
import { useGameLoop } from './hooks/useGameLoop';

/**
 * 开始界面
 */
const StartScreen: React.FC = () => {
  const startGame = useGameStore((s) => s.startGame);
  const { settings, setDifficulty, setGameType } = useSettingsStore();

  return (
    <div className="min-h-screen bg-table flex items-center justify-center">
      <div className="bg-gray-900/90 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🀄</div>
          <h1 className="text-3xl font-bold text-gold">日本麻将</h1>
          <p className="text-gray-400 text-sm mt-1">Riichi Mahjong</p>
        </div>

        {/* 设置 */}
        <div className="space-y-4 mb-8">
          {/* AI 难度 */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">AI 难度</label>
            <select
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
              value={settings.aiDifficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof settings.aiDifficulty)}
            >
              <option value="easy">简单</option>
              <option value="normal">普通</option>
              <option value="hard">困难</option>
            </select>
          </div>

          {/* 对局类型 */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">对局类型</label>
            <select
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
              value={settings.gameType}
              onChange={(e) => setGameType(e.target.value as typeof settings.gameType)}
            >
              <option value="tonpuusen">东风战（4局）</option>
              <option value="hanchan">东南战（8局）</option>
            </select>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          type="button"
          className="w-full py-3 bg-gold text-black font-bold text-lg rounded-xl hover:bg-gold-dark transition-colors active:scale-95"
          onClick={() => startGame(settings)}
        >
          开始游戏
        </button>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 nihong-majiang
        </p>
      </div>
    </div>
  );
};

/**
 * 游戏界面
 */
const GameScreen: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState)!;
  const showScoreModal = useGameStore((s) => s.showScoreModal);
  const lastScoreResult = useGameStore((s) => s.lastScoreResult);
  const winnerIndex = useGameStore((s) => s.winnerIndex);
  const continueToNextRound = useGameStore((s) => s.continueToNextRound);
  const playerDiscard = useGameStore((s) => s.playerDiscard);
  const playerAction = useGameStore((s) => s.playerAction);

  // 启动游戏主循环（AI 自动操作）
  useGameLoop();

  return (
    <div className="relative">
      <GameBoard
        gameState={gameState}
        onPlayerDiscard={playerDiscard}
        onPlayerAction={playerAction}
      />

      {/* 和牌结算弹窗 */}
      {showScoreModal && lastScoreResult && winnerIndex !== null && (
        <ScoreModal
          scoreResult={lastScoreResult}
          gameState={gameState}
          winnerIndex={winnerIndex}
          onContinue={continueToNextRound}
        />
      )}
    </div>
  );
};

/**
 * App 根组件
 */
export default function App() {
  const gameState = useGameStore((s) => s.gameState);

  return gameState ? <GameScreen /> : <StartScreen />;
}
