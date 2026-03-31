/**
 * 牌背组件（对手手牌显示）
 */
import React from 'react';
import clsx from 'clsx';
import type { TileSize } from './index';

interface TileBackProps {
  size?: TileSize;
  className?: string;
}

const SIZE_CLASSES: Record<TileSize, string> = {
  sm: 'w-6 h-8',
  md: 'w-8 h-11',
  lg: 'w-9 h-12',
};

/**
 * 牌背（用于显示对手手牌）
 */
export const TileBack: React.FC<TileBackProps> = ({ size = 'md', className }) => (
  <div
    className={clsx(
      'inline-block rounded-sm border border-gray-600',
      'bg-gradient-to-br from-gray-700 to-gray-900',
      'shadow-[2px_3px_4px_rgba(0,0,0,0.4)]',
      SIZE_CLASSES[size],
      className
    )}
    aria-hidden="true"
  >
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-gray-500 text-xs">🀫</span>
    </div>
  </div>
);

export default TileBack;
