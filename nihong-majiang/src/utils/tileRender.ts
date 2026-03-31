/**
 * 麻将牌面渲染工具
 * Unicode 字符映射 + CSS 颜色类名
 */
import type { Tile } from '../engine/types';

/** 饼子 Unicode 圆圈数字 */
const PIN_UNICODE: Record<number, string> = {
  1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤',
  6: '⑥', 7: '⑦', 8: '⑧', 9: '⑨',
};

/** 字牌显示文字 */
const HONOR_TEXT: Record<number, string> = {
  1: '東', 2: '南', 3: '西', 4: '北',
  5: '白', 6: '發', 7: '中',
};

/**
 * 获取牌面主显示文字
 */
export function getTileText(tile: Tile): string {
  if (tile.suit === 'honor') return HONOR_TEXT[tile.value] ?? '?';
  if (tile.suit === 'pin') return PIN_UNICODE[tile.value] ?? String(tile.value);
  if (tile.suit === 'man') return `${tile.value}万`;
  if (tile.suit === 'sou') return `${tile.value}索`;
  return '?';
}

/**
 * 获取牌面颜色 Tailwind 类名
 */
export function getTileColorClass(tile: Tile): string {
  if (tile.isAka) return 'text-aka';
  switch (tile.suit) {
    case 'man':   return 'text-man';
    case 'pin':   return 'text-pin';
    case 'sou':   return 'text-sou';
    case 'honor': {
      if (tile.value === 7) return 'text-red-600';   // 中
      if (tile.value === 6) return 'text-green-700'; // 發
      if (tile.value === 5) return 'text-gray-400';  // 白
      return 'text-honor'; // 风牌
    }
    default: return 'text-gray-800';
  }
}

/**
 * 牌面副标签（万/索显示花色符号，饼/字不需要）
 */
export function getTileSubText(tile: Tile): string {
  if (tile.suit === 'man' || tile.suit === 'sou') return '';
  return '';
}

/**
 * 获取牌的 aria-label（无障碍）
 */
export function getTileAriaLabel(tile: Tile): string {
  const suitName: Record<string, string> = {
    man: '万子', pin: '饼子', sou: '索子', honor: '字牌',
  };
  const honorName = HONOR_TEXT[tile.value];
  if (tile.suit === 'honor') return `${honorName}（字牌）`;
  return `${tile.value}${suitName[tile.suit]}`;
}
