/**
 * 和牌结算弹窗
 * 展示役种、符番、点数明细
 */
import React from 'react';
import clsx from 'clsx';
import type { ScoreResult, GameState } from '../../engine/types';
import { TileComponent } from '../Tile';

interface ScoreModalProps {
  scoreResult: ScoreResult;
  gameState: GameState;
  winnerIndex: number;
  onContinue: () => void;
}

const LIMIT_LABELS: Record<string, string> = {
  normal:     '',
  mangan:     '满贯',
  haneman:    '跳满',
  baiman:     '倍满',
  sanbaiman:  '三倍满',
  yakuman:    '役满',
};

/**
 * 和牌结算弹窗
 */
export const ScoreModal: React.FC<ScoreModalProps> = ({
  scoreResult,
  gameState,
  winnerIndex,
  onContinue,
}) => {
  const winner = gameState.players[winnerIndex];
  const { yakuList, fu, han, totalPoints, payments, isTsumo, limit } = scoreResult;
  const limitLabel = LIMIT_LABELS[limit];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className={clsx(
          'bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl',
          'w-full max-w-md mx-4 animate-bounce-in'
        )}
      >
        {/* 标题 */}
        <div className="text-center py-4 border-b border-gray-700">
          <div className="text-2xl font-bold text-gold">
            {isTsumo ? '自摸！' : '荣和！'}
          </div>
          <div className="text-white text-lg mt-1">
            {winner.name}
            <span className="text-gray-300 text-sm ml-2">
              ({['東', '南', '西', '北'][winnerIndex]}家)
            </span>
          </div>
        </div>

        {/* 手牌展示 */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="text-gray-400 text-xs mb-2">手牌</div>
          <div className="flex flex-wrap gap-1 justify-center">
            {winner.hand.map((tile, i) => (
              <TileComponent key={`${tile.id}-${i}`} tile={tile} size="sm" />
            ))}
          </div>
        </div>

        {/* 役种列表 */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="text-gray-400 text-xs mb-2">役种</div>
          <div className="space-y-1">
            {yakuList.map((yaku, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-white">{yaku.name}</span>
                <span className="text-gold font-bold">
                  {yaku.isYakuman ? '役满' : `${yaku.han}番`}
                </span>
              </div>
            ))}
          </div>
          {/* 合计 */}
          <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between">
            <span className="text-gray-300 text-sm">
              {limit === 'normal' ? `${fu}符 ${han}番` : limitLabel}
            </span>
            <span className="text-gold font-bold text-lg">
              {totalPoints.toLocaleString()}点
            </span>
          </div>
        </div>

        {/* 支付明细 */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="text-gray-400 text-xs mb-2">点数变化</div>
          <div className="space-y-1">
            {gameState.players.map((p, i) => {
              if (i === winnerIndex) return null;
              const paid = payments[i];
              if (!paid) return null;
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-300">{p.name}</span>
                  <span className="text-red-400 font-bold">-{paid.toLocaleString()}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-sm">
              <span className="text-white font-bold">{winner.name}</span>
              <span className="text-green-400 font-bold">+{totalPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="px-4 py-4 flex justify-center">
          <button
            type="button"
            className="px-8 py-2 bg-gold text-black font-bold rounded-lg hover:bg-gold-dark transition-colors"
            onClick={onContinue}
          >
            继续游戏
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreModal;
