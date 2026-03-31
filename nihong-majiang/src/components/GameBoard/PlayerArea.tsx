/**
 * 玩家区域组件
 * 显示单个玩家的手牌、河牌、副露和状态信息
 */
import React from 'react';
import clsx from 'clsx';
import type { Player } from '../../engine/types';
import { TileComponent } from '../Tile';
import TileBack from '../Tile/TileBack';


export type PlayerPosition = 'bottom' | 'top' | 'left' | 'right';

interface PlayerAreaProps {
  player: Player;
  position: PlayerPosition;
  isCurrentTurn: boolean;
  selectedTile?: string;
  onTileClick?: (tile: import('../../engine/types').Tile) => void;
}

const WIND_LABEL: Record<string, string> = {
  east: '東', south: '南', west: '西', north: '北',
};

/**
 * 玩家区域（四个方向）
 */
export const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  position,
  isCurrentTurn,
  selectedTile,
  onTileClick,
}) => {
  const isBottom = position === 'bottom';

  return (
    <div
      className={clsx(
        'flex flex-col gap-1',
        isCurrentTurn && 'ring-2 ring-gold ring-opacity-60 rounded-lg',
        position === 'top' && 'items-center',
        position === 'bottom' && 'items-center',
        position === 'left' && 'items-start',
        position === 'right' && 'items-end',
      )}
    >
      {/* 玩家信息条 */}
      <div className="flex items-center gap-2 px-2 py-1 bg-black/30 rounded text-xs text-white">
        <span className="font-bold text-gold">{WIND_LABEL[player.wind]}</span>
        <span>{player.name}</span>
        <span className="text-gray-300">{player.score.toLocaleString()}点</span>
        {player.isRiichi && (
          <span className="text-gold font-bold animate-pulse-soft">立直</span>
        )}
        {isCurrentTurn && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </div>

      {/* 副露区 */}
      {player.melds.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {player.melds.map((meld, mi) => (
            <div key={mi} className="flex gap-0.5">
              {meld.tiles.map((tile) => (
                <TileComponent key={tile.id} tile={tile} size="sm" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 手牌区 */}
      {isBottom ? (
        // 玩家本人：正面手牌，可点击
        <div className="flex gap-0.5 flex-wrap justify-center">
          {player.hand.map((tile) => (
            <TileComponent
              key={tile.id}
              tile={tile}
              size="md"
              selected={selectedTile === tile.id}
              onClick={onTileClick}
              disabled={player.isRiichi}
            />
          ))}
        </div>
      ) : (
        // 对手：背面手牌
        <div
          className={clsx(
            'flex gap-0.5',
            (position === 'left' || position === 'right') && 'flex-col'
          )}
        >
          {player.hand.map((_, i) => (
            <TileBack key={i} size="sm" />
          ))}
        </div>
      )}

      {/* 河牌区 */}
      {player.discards.length > 0 && (
        <div
          className={clsx(
            'flex flex-wrap gap-0.5',
            position === 'bottom' && 'justify-center max-w-xs',
            (position === 'left' || position === 'right') && 'max-w-[80px]',
          )}
        >
          {player.discards.map((tile, i) => (
            <TileComponent
              key={`${tile.id}-${i}`}
              tile={tile}
              size="sm"
              className={clsx(
                // 立直时的打出牌横向显示
                player.isRiichi &&
                  tile.id === player.riichiDiscard?.id &&
                  'rotate-90'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerArea;
