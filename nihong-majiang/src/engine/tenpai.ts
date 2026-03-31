/**
 * 听牌检测与和牌型枚举
 * 核心算法：递归拆分面子+雀头
 */
import type { Tile, Mentsu, WinPattern } from './types';
import { sameTile, sortTiles } from './tiles';

/**
 * 判断一组牌是否能组成 N 个面子（无雀头版）
 */
function decomposeMentsu(
  tiles: Tile[],
  required: number
): Mentsu[][] {
  if (required === 0 && tiles.length === 0) return [[]];
  if (tiles.length < required * 3) return [];

  const sorted = sortTiles(tiles);
  const results: Mentsu[][] = [];
  const first = sorted[0];

  // 尝试以第一张牌组成刻子
  const koutsuMatches = sorted.filter((t) => sameTile(t, first));
  if (koutsuMatches.length >= 3) {
    const rest = removeN(sorted, first, 3);
    const subs = decomposeMentsu(rest, required - 1);
    for (const sub of subs) {
      results.push([
        { type: 'koutsu', tiles: koutsuMatches.slice(0, 3), isOpen: false },
        ...sub,
      ]);
    }
  }

  // 尝试以第一张牌组成顺子（仅数牌）
  if (first.suit !== 'honor') {
    const t2 = sorted.find((t) => t.suit === first.suit && t.value === first.value + 1);
    const t3 = sorted.find((t) => t.suit === first.suit && t.value === first.value + 2);
    if (t2 && t3) {
      const rest = removeOne(removeOne(removeOne(sorted, first), t2), t3);
      const subs = decomposeMentsu(rest, required - 1);
      for (const sub of subs) {
        results.push([
          { type: 'shuntsu', tiles: [first, t2, t3], isOpen: false },
          ...sub,
        ]);
      }
    }
  }

  return results;
}

/** 从数组中移除一个元素（按 id） */
function removeOne(tiles: Tile[], target: Tile): Tile[] {
  const idx = tiles.findIndex((t) => t.id === target.id);
  if (idx === -1) return tiles;
  return [...tiles.slice(0, idx), ...tiles.slice(idx + 1)];
}

/** 从数组中移除 N 张相同的牌（按 suit+value） */
function removeN(tiles: Tile[], target: Tile, n: number): Tile[] {
  let removed = 0;
  return tiles.filter((t) => {
    if (removed < n && sameTile(t, target)) {
      removed++;
      return false;
    }
    return true;
  });
}

/**
 * 枚举14张手牌的所有合法和牌型（4面子+1雀头）
 * @param hand 14张手牌（含和牌张）
 * @returns 所有合法拆牌方式
 */
export function enumerateWinPatterns(hand: Tile[]): WinPattern[] {
  const sorted = sortTiles(hand);
  const patterns: WinPattern[] = [];
  const seen = new Set<string>();

  // 尝试每种牌作为雀头
  const jantouCandidates = new Set(
    sorted.map((t) => `${t.suit}-${t.value}`)
  );

  for (const key of jantouCandidates) {
    const [suit, value] = key.split('-');
    const jantouTiles = sorted.filter(
      (t) => t.suit === suit && String(t.value) === value
    );
    if (jantouTiles.length < 2) continue;

    const jantou = jantouTiles.slice(0, 2);
    // enumerate restTiles without the two jantou tiles
    // 实际上直接移除两张
    let restTiles = [...sorted];
    let removedCount = 0;
    restTiles = restTiles.filter((t) => {
      if (removedCount < 2 && sameTile(t, jantouTiles[0])) {
        removedCount++;
        return false;
      }
      return true;
    });

    const mentsuCombinations = decomposeMentsu(restTiles, 4);
    for (const mentsuList of mentsuCombinations) {
      const patternKey = JSON.stringify(
        [jantou.map((t) => t.id).sort(), mentsuList.map((m) => m.tiles.map((t) => t.id).sort())]
      );
      if (!seen.has(patternKey)) {
        seen.add(patternKey);
        patterns.push({ mentsuList, jantou });
      }
    }
  }

  return patterns;
}

/**
 * 判断14张手牌是否七对子
 */
export function isChiitoitsuWin(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  const counts = new Map<string, number>();
  for (const t of hand) {
    const key = `${t.suit}-${t.value}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const pairs = [...counts.values()].filter((c) => c >= 2);
  return pairs.length === 7;
}

/**
 * 判断14张手牌是否和牌
 */
export function canWin(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  if (isChiitoitsuWin(hand)) return true;
  return enumerateWinPatterns(hand).length > 0;
}

/**
 * 判断13张手牌是否听牌
 */
export function isTenpai(hand: Tile[]): boolean {
  return getWaitingTiles(hand).length > 0;
}

/**
 * 获取13张手牌的所有待牌
 * 遍历所有可能的牌（136张中去重后的34种），尝试加入后是否和牌
 */
export function getWaitingTiles(hand: Tile[]): Tile[] {
  const allPossible = generateAllUniqueTiles();
  return allPossible.filter((candidate) => canWin([...hand, candidate]));
}

/**
 * 生成34种不同的牌（用于待牌检测）
 */
function generateAllUniqueTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (const suit of ['man', 'pin', 'sou'] as const) {
    for (let v = 1; v <= 9; v++) {
      tiles.push({ suit, value: v as import('./types').TileValue, id: `check-${suit}-${v}` });
    }
  }
  for (let v = 1; v <= 7; v++) {
    tiles.push({ suit: 'honor', value: v as import('./types').TileValue, id: `check-honor-${v}` });
  }
  return tiles;
}

/**
 * 计算手牌向听数（-1=已和牌，0=听牌，N=距离听牌还需N步）
 * 简化版：遍历待牌判断
 */
export function calculateShanten(hand: Tile[]): number {
  if (hand.length === 14 && canWin(hand)) return -1;
  if (hand.length === 13 && isTenpai(hand)) return 0;
  // 简化：返回1（用于AI策略，不需要精确计算）
  return 1;
}
