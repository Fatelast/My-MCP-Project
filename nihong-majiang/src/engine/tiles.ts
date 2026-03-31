/**
 * 牌山工具：生成136张完整牌组、洗牌、牌面常量
 */
import type { Tile, Suit, TileValue } from './types';

/** 数牌花色 */
const NUMBER_SUITS: Suit[] = ['man', 'pin', 'sou'];

/**
 * 生成完整的136张麻将牌（含1张赤五）
 * @returns 未洗牌的完整牌组
 */
export function createFullDeck(): Tile[] {
  const tiles: Tile[] = [];
  let idCounter = 0;

  // 数牌：万/饼/索，每种9张 × 4副 = 108张
  for (const suit of NUMBER_SUITS) {
    for (let value = 1; value <= 9; value++) {
      for (let copy = 0; copy < 4; copy++) {
        const isAka = value === 5 && copy === 0; // 每种花色各1张赤五
        tiles.push({
          suit,
          value: value as TileValue,
          id: `${suit}-${value}-${copy}`,
          isAka,
        });
        idCounter++;
      }
    }
  }

  // 字牌：风牌(1-4) + 三元牌(5-7)，每种 × 4副 = 28张
  for (let value = 1; value <= 7; value++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({
        suit: 'honor',
        value: value as TileValue,
        id: `honor-${value}-${copy}`,
      });
      idCounter++;
    }
  }

  return tiles;
}

/**
 * Fisher-Yates 洗牌算法
 * @param tiles 待洗牌组
 * @returns 洗牌后的新数组（不修改原数组）
 */
export function shuffle(tiles: Tile[]): Tile[] {
  const arr = [...tiles];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 判断是否为幺九牌（1、9、字牌）
 */
export function isYaochuTile(tile: Tile): boolean {
  if (tile.suit === 'honor') return true;
  return tile.value === 1 || tile.value === 9;
}

/**
 * 判断是否为数牌（非字牌）
 */
export function isNumberTile(tile: Tile): boolean {
  return tile.suit !== 'honor';
}

/**
 * 判断是否为三元牌（中/發/白）
 * 字牌 value: 5=白 6=發 7=中
 */
export function isSangenpai(tile: Tile): boolean {
  return tile.suit === 'honor' && tile.value >= 5;
}

/**
 * 判断是否为风牌
 */
export function isKazepai(tile: Tile): boolean {
  return tile.suit === 'honor' && tile.value <= 4;
}

/**
 * 获取风牌对应的 Wind 类型
 */
export function honorValueToWind(value: TileValue): import('./types').Wind {
  const map: Record<number, import('./types').Wind> = {
    1: 'east',
    2: 'south',
    3: 'west',
    4: 'north',
  };
  return map[value] ?? 'east';
}

/**
 * 判断两张牌是否相同（suit + value 相同，不区分id）
 */
export function sameTile(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value;
}

/**
 * 统计手牌中某张牌的数量
 */
export function countTile(tiles: Tile[], target: Tile): number {
  return tiles.filter((t) => sameTile(t, target)).length;
}

/**
 * 对手牌排序：万<饼<索<字牌，同花色按数值升序
 */
export function sortTiles(tiles: Tile[]): Tile[] {
  const suitOrder: Record<Suit, number> = { man: 0, pin: 1, sou: 2, honor: 3 };
  return [...tiles].sort((a, b) => {
    const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return a.value - b.value;
  });
}

/**
 * 字牌名称映射
 */
export const HONOR_NAMES: Record<number, string> = {
  1: '東',
  2: '南',
  3: '西',
  4: '北',
  5: '白',
  6: '發',
  7: '中',
};

/**
 * 获取牌的显示文字
 */
export function getTileDisplayText(tile: Tile): string {
  if (tile.suit === 'honor') {
    return HONOR_NAMES[tile.value] ?? '?';
  }
  const suitSuffix: Record<Suit, string> = {
    man: '万',
    pin: '饼',
    sou: '索',
    honor: '',
  };
  return `${tile.value}${suitSuffix[tile.suit]}`;
}
