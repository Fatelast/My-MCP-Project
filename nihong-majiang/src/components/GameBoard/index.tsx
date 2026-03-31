/**
 * 牌桌主组件
 * 组合四方向玩家区域 + 中央信息区 + 操作面板
 */
import React, { useState } from 'react';
import clsx from 'clsx';
import type { GameState, Tile, Action } from '../../engine/types';
import { PlayerArea } from './PlayerArea';
import { CenterArea } from './CenterArea';
import ActionPanel from '../ActionPanel';

interface GameBoardProps {
  gameState: GameState;
  onPlayerDiscard: (tile: Tile) => void;
  onPlayerAction: (action: Action) => void;
}

/**
 * 牌桌主界面
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onPlayerDiscard,
  onPlayerAction,
}) => {
  const [selectedTileId, setSelectedTileId] = useState<string | undefined>();

  const handleTileClick = (tile: Tile) => {
    if (gameState.phase !== 'playerTurn') return;
    if (selectedTileId === tile.id) {
      // 二次点击：出牌
      onPlayerDiscard(tile);
      setSelectedTileId(undefined);
    } else {
      setSelectedTileId(tile.id);
    }
  };

  const playerActions = gameState.availableActions.filter(
    (a) => a.playerIndex === 0 || a.playerIndex === undefined
  );

  return (
    <div
      className={clsx(
        'relative w-full h-full min-h-screen',
        'bg-table flex items-center justify-center',
        'p-2 md:p-4'
      )}
    >
      {/* 桌面端：Grid 布局 */}
      <div
        className={clsx(
          'grid w-full max-w-5xl',
          'grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto_auto]',
          'gap-2 md:gap-4'
        )}
      >
        {/* 上家（AI-2，索引2） */}
        <div className="col-span-3 flex justify-center">
          <PlayerArea
            player={gameState.players[2]}
            position="top"
            isCurrentTurn={gameState.currentPlayer === 2}
          />
        </div>

        {/* 左家（AI-3，索引3） */}
        <div className="flex items-center justify-end">
          <PlayerArea
            player={gameState.players[3]}
            position="left"
            isCurrentTurn={gameState.currentPlayer === 3}
          />
        </div>

        {/* 中央信息区 */}
        <div className="flex items-center justify-center">
          <CenterArea gameState={gameState} />
        </div>

        {/* 右家（AI-1，索引1） */}
        <div className="flex items-center justify-start">
          <PlayerArea
            player={gameState.players[1]}
            position="right"
            isCurrentTurn={gameState.currentPlayer === 1}
          />
        </div>

        {/* 下家（玩家本人，索引0） */}
        <div className="col-span-3 flex flex-col items-center gap-2">
          <PlayerArea
            player={gameState.players[0]}
            position="bottom"
            isCurrentTurn={gameState.currentPlayer === 0}
            selectedTile={selectedTileId}
            onTileClick={handleTileClick}
          />

          {/* 操作面板 */}
          {playerActions.length > 0 && (
            <ActionPanel
              availableActions={playerActions}
              onAction={onPlayerAction}
              timeoutSeconds={10}
            />
          )}

          {/* 出牌提示 */}
          {gameState.phase === 'playerTurn' &&
            gameState.currentPlayer === 0 &&
            playerActions.length === 0 && (
              <div className="text-gold text-sm animate-pulse-soft">
                {selectedTileId ? '再次点击打出，或选择其他牌' : '点击选择要打出的牌'}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
