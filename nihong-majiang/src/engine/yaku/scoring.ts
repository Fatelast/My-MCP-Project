/**
 * 符数 + 番数 + 点数计算
 * 严格按照日本麻将规则计算
 */
import type { Player, GameState, Tile, ScoreResult, WinPattern, Mentsu } from '../types';
import { isYaochuTile, isSangenpai, isKazepai, honorValueToWind } from '../tiles';
import { enumerateWinPatterns, isChiitoitsuWin } from '../tenpai';
import { calculateYaku, addDora } from './index';

/**
 * 计算符数
 */
export function calculateFu(
  player: Player,
  pattern: WinPattern | null,
  winTile: Tile,
  isTsumo: boolean,
  state: GameState
): number {
  // 七对子固定25符
  if (isChiitoitsuWin([...player.hand])) return 25;

  if (!pattern) return 30; // 默认30符

  let fu = 0;

  // 基本符
  if (isTsumo) {
    fu += 20; // 自摸基本符
  } else if (player.melds.length === 0) {
    fu += 30; // 门清荣和
  } else {
    fu += 20; // 副露荣和
  }

  // 雀头符
  const jantou = pattern.jantou[0];
  if (isSangenpai(jantou)) {
    fu += 2;
  } else if (isKazepai(jantou)) {
    const jWind = honorValueToWind(jantou.value);
    if (jWind === state.roundWind) fu += 2;
    if (jWind === player.wind) fu += 2;
  }

  // 面子符
  for (const mentsu of pattern.mentsuList) {
    fu += getMentsuFu(mentsu, false);
  }
  // 副露面子符
  for (const meld of player.melds) {
    const isKan = meld.type === 'minkan' || meld.type === 'ankan';
    const isAnkan = meld.type === 'ankan';
    const t = meld.tiles[0];
    const isYaochu = isYaochuTile(t);
    if (isKan) {
      fu += isAnkan
        ? (isYaochu ? 32 : 16)
        : (isYaochu ? 16 : 8);
    } else if (meld.type === 'pon') {
      fu += isYaochu ? 4 : 2;
    }
    // 吃不加符
  }

  // 和牌符（门清荣和已在基本符中计算，这里只加自摸/边张/嵌张/单钓）
  if (isTsumo) {
    fu += 2; // 自摸符
  } else {
    // 检查待牌形式
    fu += getWaitFu(pattern, winTile);
  }

  // 切上（10符进位）
  return Math.ceil(fu / 10) * 10;
}

/** 计算面子符 */
function getMentsuFu(mentsu: Mentsu, isOpen: boolean): number {
  if (mentsu.type === 'shuntsu') return 0;
  const t = mentsu.tiles[0];
  const isYaochu = isYaochuTile(t);
  if (mentsu.type === 'koutsu') {
    if (isOpen) return isYaochu ? 4 : 2;
    return isYaochu ? 8 : 4;
  }
  if (mentsu.type === 'kantsu') {
    // 暗杠
    return isYaochu ? 32 : 16;
  }
  return 0;
}

/** 计算待牌形式的符数 */
function getWaitFu(pattern: WinPattern, winTile: Tile): number {
  // 单钓（雀头待）
  if (pattern.jantou.some((t) => t.suit === winTile.suit && t.value === winTile.value)) {
    // 检查是否所有面子都已完整
    const isTanki = pattern.mentsuList.every((m) => m.tiles.length >= 3);
    if (isTanki) return 2;
  }
  // 检查每个面子的待牌形式
  for (const mentsu of pattern.mentsuList) {
    if (mentsu.type !== 'shuntsu') continue;
    const vals = mentsu.tiles.map((t) => t.value).sort((a, b) => a - b);
    const [min, mid, max] = vals;
    if (mentsu.tiles.some((t) => t.suit === winTile.suit && t.value === winTile.value)) {
      // 嵌张（中间张）
      if (winTile.value === mid) return 2;
      // 边张（1-2-3的3 或 7-8-9的7）
      if ((min === 1 && winTile.value === max) || (max === 9 && winTile.value === min)) return 2;
    }
  }
  return 0;
}

/** 番数对应点数（基本点 = 符 × 2^(番+2)） */
export function calculateBasePoints(fu: number, han: number): number {
  if (han >= 13) return 8000; // 役满
  if (han >= 11) return 6000; // 三倍满
  if (han >= 8) return 4000;  // 倍满
  if (han >= 6) return 3000;  // 跳满
  if (han >= 5) return 2000;  // 满贯
  const base = fu * Math.pow(2, han + 2);
  if (base >= 2000) return 2000; // 满贯封顶
  return base;
}

export type LimitType = 'normal' | 'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'yakuman';

export function getLimitType(han: number, fu: number): LimitType {
  if (han >= 13) return 'yakuman';
  if (han >= 11) return 'sanbaiman';
  if (han >= 8) return 'baiman';
  if (han >= 6) return 'haneman';
  if (han >= 5) return 'mangan';
  if (fu * Math.pow(2, han + 2) >= 2000) return 'mangan';
  return 'normal';
}

/**
 * 计算完整点数结算
 * @param winnerIndex 和牌玩家索引
 * @param loserIndex  放炮玩家索引（自摸时为-1）
 */
export function calculateScore(
  player: Player,
  state: GameState,
  winTile: Tile,
  isTsumo: boolean,
  winnerIndex: number,
  loserIndex: number,
  isRinshan = false,
  isChankan = false
): ScoreResult {
  const fullHand = [...player.hand];
  if (!isTsumo) fullHand.push(winTile);

  const patterns = enumerateWinPatterns(fullHand);
  const isChiitoitsu = isChiitoitsuWin(fullHand);

  // 计算役种
  let yakuList = calculateYaku({ player: { ...player, hand: fullHand }, state, winTile, isTsumo, isRinshan, isChankan });
  // 追加宝牌
  yakuList = addDora(yakuList, { ...player, hand: fullHand }, state.doraTiles, state.uraDoraTiles, player.isRiichi);

  // 符数
  const pattern = isChiitoitsu ? null : (patterns[0] ?? null);
  const fu = isChiitoitsu ? 25 : calculateFu(player, pattern, winTile, isTsumo, state);

  // 番数
  const han = yakuList.reduce((sum, y) => sum + y.han, 0);

  // 基本点
  const basePoints = calculateBasePoints(fu, han);
  const limit = getLimitType(han, fu);

  // 支付计算
  const payments: Record<number, number> = {};
  const isDealer = winnerIndex === state.dealer;
  const honbaBonus = state.honba * 300;

  let totalPoints = 0;

  if (isTsumo) {
    // 自摸：各家支付
    if (isDealer) {
      // 庄家自摸：子家各付 基本点×2 (切上)
      const pay = Math.ceil((basePoints * 2) / 100) * 100;
      for (let i = 0; i < 4; i++) {
        if (i !== winnerIndex) {
          payments[i] = pay + Math.floor(honbaBonus / 3);
          totalPoints += payments[i];
        }
      }
    } else {
      // 子家自摸：庄家付 基本点×2, 子家各付 基本点×1 (切上)
      const dealerPay = Math.ceil((basePoints * 2) / 100) * 100;
      const otherPay = Math.ceil(basePoints / 100) * 100;
      for (let i = 0; i < 4; i++) {
        if (i === winnerIndex) continue;
        if (i === state.dealer) {
          payments[i] = dealerPay + Math.floor(honbaBonus / 3);
        } else {
          payments[i] = otherPay + Math.floor(honbaBonus / 3);
        }
        totalPoints += payments[i];
      }
    }
    totalPoints += state.riichiSticks * 1000;
  } else {
    // 荣和：放炮方支付
    let pay: number;
    if (isDealer) {
      pay = Math.ceil((basePoints * 6) / 100) * 100;
    } else {
      pay = Math.ceil((basePoints * 4) / 100) * 100;
    }
    payments[loserIndex] = pay + honbaBonus;
    totalPoints = pay + honbaBonus + state.riichiSticks * 1000;
  }

  return {
    yakuList,
    fu,
    han,
    basePoints,
    limit,
    totalPoints,
    payments,
    isTsumo,
  };
}
