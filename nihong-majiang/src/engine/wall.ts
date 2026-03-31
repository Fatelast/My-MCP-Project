/**
 * 牌山管理：摸牌、王牌区、宝牌指示牌
 */
import type { Tile } from './types';
import { createFullDeck, shuffle } from './tiles';

/** 王牌区固定14张 */
export const DEAD_WALL_SIZE = 14;

export interface WallState {
  /** 摸牌区（剩余可摸的牌） */
  wall: Tile[];
  /** 王牌区（14张，含岭上牌和宝牌指示牌） */
  deadWall: Tile[];
  /** 已翻开的宝牌指示牌（初始翻1张） */
  doraTiles: Tile[];
  /** 里宝牌指示牌（立直和牌时翻开） */
  uraDoraTiles: Tile[];
  /** 已翻开的宝牌指示牌数量 */
  doraCount: number;
}

/**
 * 初始化牌山
 * @returns 洗牌后的牌山状态
 */
export function initWall(): WallState {
  const shuffled = shuffle(createFullDeck());

  // 后14张为王牌区
  const deadWall = shuffled.slice(shuffled.length - DEAD_WALL_SIZE);
  const wall = shuffled.slice(0, shuffled.length - DEAD_WALL_SIZE);

  // 王牌区布局：
  // deadWall[0-3]  = 岭上牌（从后往前摸）
  // deadWall[4-13] = 宝牌指示牌区域（偶数位为表宝牌，奇数位为里宝牌）
  const doraTiles = [deadWall[4]]; // 初始翻开第一张表宝牌指示牌
  const uraDoraTiles: Tile[] = []; // 里宝牌初始不翻开

  return {
    wall,
    deadWall,
    doraTiles,
    uraDoraTiles,
    doraCount: 1,
  };
}

/**
 * 从牌山摸一张牌
 * @returns [摸到的牌, 新牌山] 若牌山为空返回 null
 */
export function drawFromWall(wall: Tile[]): [Tile, Tile[]] | null {
  if (wall.length === 0) return null;
  const tile = wall[0];
  return [tile, wall.slice(1)];
}

/**
 * 从王牌区摸岭上牌（杠后摸）
 * 岭上牌位于 deadWall[3], [2], [1], [0]（最多4次杠）
 * @param deadWall 王牌区
 * @param kanCount 当前已杠次数（0-3）
 * @returns 岭上牌
 */
export function drawRinshanTile(deadWall: Tile[], kanCount: number): Tile {
  return deadWall[3 - kanCount];
}

/**
 * 翻开新宝牌指示牌（杠后操作）
 * @param state 当前牌山状态
 * @returns 新的牌山状态
 */
export function revealNewDora(state: WallState): WallState {
  const newDoraCount = state.doraCount + 1;
  // 表宝牌指示牌位于 deadWall[4], [6], [8], [10], [12]（偶数索引）
  const newDoraTile = state.deadWall[4 + (newDoraCount - 1) * 2];
  return {
    ...state,
    doraCount: newDoraCount,
    doraTiles: [...state.doraTiles, newDoraTile],
  };
}

/**
 * 翻开里宝牌指示牌（立直和牌时）
 * @param state 当前牌山状态
 * @returns 新的牌山状态（含里宝牌）
 */
export function revealUraDora(state: WallState): WallState {
  // 里宝牌指示牌位于 deadWall[5], [7], [9], [11], [13]（奇数索引）
  const uraDoras = Array.from(
    { length: state.doraCount },
    (_, i) => state.deadWall[5 + i * 2]
  );
  return { ...state, uraDoraTiles: uraDoras };
}

/**
 * 获取宝牌（宝牌指示牌的下一张）
 * @param indicator 宝牌指示牌
 * @returns 对应的宝牌
 */
export function getDoraFromIndicator(indicator: Tile): Tile {
  if (indicator.suit === 'honor') {
    // 风牌：東→南→西→北→東
    // 三元牌：白→發→中→白
    const nextValue =
      indicator.value <= 4
        ? ((indicator.value % 4) + 1) // 风牌循环
        : ((((indicator.value - 5) % 3) + 1) + 4); // 三元牌循环
    return { ...indicator, value: nextValue as import('./types').TileValue, id: `dora-${indicator.id}` };
  }
  // 数牌：9的下一张是1
  const nextValue = indicator.value === 9 ? 1 : indicator.value + 1;
  return { ...indicator, value: nextValue as import('./types').TileValue, id: `dora-${indicator.id}` };
}

/**
 * 统计手牌+副露中的宝牌数量
 */
export function countDora(tiles: Tile[], doraTiles: Tile[]): number {
  const doraList = doraTiles.map(getDoraFromIndicator);
  return tiles.reduce((count, tile) => {
    const isDora = doraList.some(
      (d) => d.suit === tile.suit && d.value === tile.value
    );
    return isDora ? count + 1 : count;
  }, 0);
}
