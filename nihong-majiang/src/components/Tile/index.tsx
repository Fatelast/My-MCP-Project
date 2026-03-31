/**
 * 麻将牌组件
 * 显示单张正面牌，支持选中/悬停/点击状态
 */
import React from 'react';
import clsx from 'clsx';
import type { Tile } from '../../engine/types';
import { getTileText, getTileColorClass, getTileAriaLabel } from '../../utils/tileRender';

export type TileSize = 'sm' | 'md' | 'lg';

export interface TileProps {
  tile: Tile;
  /** 是否处于选中状态（玩家选择打出） */
  selected?: boolean;
  /** 是否可点击 */
  onClick?: (tile: Tile) => void;
  /** 尺寸 */
  size?: TileSize;
  /** 是否禁用（立直后不可选） */
  disabled?: boolean;
  /** 是否高亮（和牌张） */
  highlight?: boolean;
  /** 自定义类名 */
  className?: string;
}

const SIZE_CLASSES: Record<TileSize, string> = {
  sm: 'w-7 h-9 text-sm',
  md: 'w-9 h-12 text-base',
  lg: 'w-10 h-14 text-lg',
};

/**
 * 单张麻将牌（正面）
 */
export const TileComponent: React.FC<TileProps> = ({
  tile,
  selected = false,
  onClick,
  size = 'md',
  disabled = false,
  highlight = false,
  className,
}) => {
  const isClickable = !!onClick && !disabled;

  const handleClick = () => {
    if (isClickable) onClick(tile);
  };

  return (
    <button
      type="button"
      className={clsx(
        // 基础样式
        'relative inline-flex items-center justify-center',
        'rounded-sm border select-none transition-all duration-150',
        'bg-tile-bg border-tile-border',
        'shadow-[2px_3px_4px_rgba(0,0,0,0.35)]',
        'font-bold leading-none',
        // 尺寸
        SIZE_CLASSES[size],
        // 颜色
        getTileColorClass(tile),
        // 交互状态
        isClickable && 'cursor-pointer hover:-translate-y-1',
        selected && '-translate-y-2 border-2 border-gold shadow-[0_0_8px_rgba(255,215,0,0.6)]',
        highlight && 'border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
        disabled && 'opacity-60 cursor-not-allowed',
        !isClickable && !disabled && 'cursor-default',
        className
      )}
      onClick={handleClick}
      aria-label={getTileAriaLabel(tile)}
      aria-pressed={selected}
      disabled={disabled && !isClickable}
    >
      <span className="font-bold">{getTileText(tile)}</span>
      {tile.isAka && (
        <span className="absolute top-0 right-0 text-[8px] text-aka leading-none">赤</span>
      )}
    </button>
  );
};

export default TileComponent;
