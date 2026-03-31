/**
 * 手牌操作：排序、副露处理、立直、暗杠
 */
import type { Tile, Meld } from './types';
import { sortTiles, sameTile, countTile } from './tiles';

/**
 * 检查手牌中是否可以碰某张牌
 * @param hand 当前手牌（13张）
 * @param tile 别家打出的牌
 */
export function canPon(hand: Tile[], tile: Tile): boolean {
  return countTile(hand, tile) >= 2;
}

/**
 * 检查手牌中是否可以吃某张牌（仅上家打出时可吃）
 * @param hand 当前手牌
 * @param tile 上家打出的牌
 * @returns 所有合法的吃牌组合
 */
export function getChiCandidates(hand: Tile[], tile: Tile): Tile[][] {
  if (tile.suit === 'honor') return []; // 字牌不能吃
  const combinations: Tile[][] = [];

  // 找所有包含该牌的顺子组合
  // 组合1：tile-2, tile-1, tile（如：tile=3，找1,2）
  // 组合2：tile-1, tile, tile+1（如：tile=3，找2,4）
  // 组合3：tile, tile+1, tile+2（如：tile=3，找4,5）

  const v = tile.value;
  const s = tile.suit;

  const patterns: [number, number][] = [
    [v - 2, v - 1],
    [v - 1, v + 1],
    [v + 1, v + 2],
  ];

  for (const [a, b] of patterns) {
    if (a < 1 || b > 9) continue;
    const tileA = hand.find((t) => t.suit === s && t.value === a);
    const tileB = hand.find((t) => t.suit === s && t.value === b);
    if (tileA && tileB) {
      combinations.push(sortTiles([tileA, tileB, tile]));
    }
  }

  return combinations;
}

/**
 * 检查手牌中是否可以明杠某张牌
 */
export function canMinkan(hand: Tile[], tile: Tile): boolean {
  return countTile(hand, tile) >= 3;
}

/**
 * 检查手牌中是否可以暗杠
 * @returns 可暗杠的牌种列表
 */
export function getAnkanTiles(hand: Tile[]): Tile[] {
  const seen = new Set<string>();
  const result: Tile[] = [];
  for (const tile of hand) {
    const key = `${tile.suit}-${tile.value}`;
    if (!seen.has(key) && countTile(hand, tile) >= 4) {
      seen.add(key);
      result.push(tile);
    }
  }
  return result;
}

/**
 * 检查手牌中是否可以加杠（已碰的牌摸到第4张）
 * @param hand 手牌
 * @param melds 已有副露
 * @returns 可加杠的牌列表
 */
export function getKakanTiles(hand: Tile[], melds: Meld[]): Tile[] {
  return melds
    .filter((m) => m.type === 'pon')
    .flatMap((m) => {
      const ponTile = m.tiles[0];
      return hand.filter((t) => sameTile(t, ponTile));
    });
}

/**
 * 执行吃牌：从手牌移除两张，加入副露
 * @param hand 当前手牌
 * @param tiles 吃牌组合（含被吃的那张）
 * @param calledTile 被吃的那张
 * @param calledFrom 上家玩家索引
 * @returns [新手牌, 新副露]
 */
export function performChi(
  hand: Tile[],
  tiles: Tile[],
  calledTile: Tile,
  calledFrom: number
): [Tile[], Meld] {
  // 从手牌移除吃牌组合中的两张（不含别家打出的那张）
  let newHand = [...hand];
  for (const t of tiles) {
    if (sameTile(t, calledTile) && t.id === calledTile.id) continue;
    const idx = newHand.findIndex((h) => h.id === t.id);
    if (idx !== -1) newHand.splice(idx, 1);
  }
  const meld: Meld = {
    type: 'chi',
    tiles: sortTiles(tiles),
    calledFrom,
    calledTile,
  };
  return [newHand, meld];
}

/**
 * 执行碰牌：从手牌移除两张，加入副露
 */
export function performPon(
  hand: Tile[],
  tile: Tile,
  calledFrom: number
): [Tile[], Meld] {
  let newHand = [...hand];
  let removed = 0;
  newHand = newHand.filter((t) => {
    if (removed < 2 && sameTile(t, tile)) {
      removed++;
      return false;
    }
    return true;
  });
  const meld: Meld = {
    type: 'pon',
    tiles: [tile, tile, tile],
    calledFrom,
    calledTile: tile,
  };
  return [newHand, meld];
}

/**
 * 执行出牌：从手牌移除指定牌
 */
export function discard(hand: Tile[], tile: Tile): Tile[] {
  const idx = hand.findIndex((t) => t.id === tile.id);
  if (idx === -1) return hand;
  const newHand = [...hand];
  newHand.splice(idx, 1);
  return newHand;
}

/**
 * 立直时检查可否立直（门清+听牌）
 */
export function canRiichi(_hand: Tile[], melds: Meld[], isRiichi: boolean): boolean {
  if (isRiichi) return false; // 已经立直
  if (melds.length > 0) return false; // 有副露不能立直
  // 听牌检测由 tenpai.ts 负责
  return true;
}

/**
 * 检查振听：如果和牌张在自己的河牌中则振听
 */
export function checkFuriten(discards: Tile[], waitingTiles: Tile[]): boolean {
  return waitingTiles.some((wt) => discards.some((d) => sameTile(d, wt)));
}
