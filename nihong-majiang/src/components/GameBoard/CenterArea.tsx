/**
 * 中央信息区组件
 * 显示场风、局数、本场、宝牌指示牌、剩余牌数
 */
import React from 'react';
import type { GameState } from '../../engine/types';
import { TileComponent } from '../Tile';

interface CenterAreaProps {
  gameState: GameState;
}

const WIND_LABEL: Record<string, string> = {
  east: '東', south: '南', west: '西', north: '北',
};

/**
 * 牌桌中央信息区
 */
export const CenterArea: React.FC<CenterAreaProps> = ({ gameState }) => {
  const {
    roundWind,
    roundNumber,
    honba,
    riichiSticks,
    doraTiles,
    wall,
  } = gameState;

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4 bg-black/20 rounded-xl min-w-[160px] min-h-[160px]">
      {/* 场风 + 局数 */}
      <div className="flex items-center gap-2 text-white">
        <span className="text-2xl font-bold text-gold">{WIND_LABEL[roundWind]}</span>
        <span className="text-lg font-semibold">{roundNumber}局</span>
        {honba > 0 && (
          <span className="text-sm text-gray-300">{honba}本场</span>
        )}
      </div>

      {/* 立直棒 */}
      {riichiSticks > 0 && (
        <div className="flex items-center gap-1 text-gold text-sm">
          <span>🀄</span>
          <span>×{riichiSticks}</span>
          <span className="text-xs text-gray-400">立直棒</span>
        </div>
      )}

      {/* 宝牌指示牌 */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-400">宝牌指示</span>
        <div className="flex gap-1">
          {doraTiles.map((tile, i) => (
            <TileComponent key={i} tile={tile} size="sm" />
          ))}
        </div>
      </div>

      {/* 剩余牌数 */}
      <div className="flex items-center gap-1 text-gray-300 text-sm">
        <span className="text-gray-400">剩余</span>
        <span className="text-white font-bold text-lg">{wall.length}</span>
        <span className="text-gray-400">张</span>
      </div>
    </div>
  );
};

export default CenterArea;
