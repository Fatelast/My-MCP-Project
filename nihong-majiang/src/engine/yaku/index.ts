/**
 * 役种判定总入口
 * 聚合所有役种检测，返回成立的役种列表
 */
import type { Player, GameState, Tile, YakuResult } from '../types';
import type { WinContext } from './basic';
import {
  checkRiichi, checkIppatsu, checkMenzenTsumo, checkTanyao,
  checkPinfu, checkIipeiko, checkYakuhai, checkIttsu,
  checkSanshokuDoujun, checkChanta, checkToitoi,
  checkHonitsu, checkChinitsu, checkShousangen,
  checkHonroutou, checkHaitei, checkHoutei,
} from './basic';
import { checkChiitoitsu } from './special';
import { enumerateWinPatterns } from '../tenpai';
import { countDora } from '../wall';

export interface CalculateYakuOptions {
  player: Player;
  state: GameState;
  winTile: Tile;
  isTsumo: boolean;
  /** 是否岭上开花 */
  isRinshan?: boolean;
  /** 是否抢杠 */
  isChankan?: boolean;
}

/**
 * 计算和牌时成立的所有役种
 * @returns 役种列表（不含宝牌），若无役则返回空数组
 */
export function calculateYaku(opts: CalculateYakuOptions): YakuResult[] {
  const { player, state, winTile, isTsumo } = opts;

  // 构造14张和牌手牌
  const fullHand = isTsumo
    ? [...player.hand] // 自摸时手牌已含和牌张
    : [...player.hand, winTile]; // 荣和时加入和牌张

  const patterns = enumerateWinPatterns(fullHand);
  const ctx: WinContext = {
    player: { ...player, hand: fullHand },
    state,
    winTile,
    isTsumo,
    patterns,
    pattern: patterns[0],
  };

  const results: YakuResult[] = [];

  // 七对子单独判定
  const chiitoitsu = checkChiitoitsu(ctx);
  if (chiitoitsu) {
    results.push(chiitoitsu);
  } else {
    // 标准役种判定
    const checks = [
      checkRiichi(ctx),
      checkIppatsu(ctx),
      checkMenzenTsumo(ctx),
      checkTanyao(ctx),
      checkPinfu(ctx),
      checkIipeiko(ctx),
      checkIttsu(ctx),
      checkSanshokuDoujun(ctx),
      checkChanta(ctx),
      checkToitoi(ctx),
      checkHonitsu(ctx),
      checkChinitsu(ctx),
      checkShousangen(ctx),
      checkHonroutou(ctx),
      checkHaitei(ctx),
      checkHoutei(ctx),
    ];

    // 岭上开花
    if (opts.isRinshan) {
      results.push({ name: '岭上开花', han: 1 });
    }
    // 抢杠
    if (opts.isChankan) {
      results.push({ name: '抢杠', han: 1 });
    }

    for (const r of checks) {
      if (r) results.push(r);
    }

    // 役牌可能有多个
    const yakuhaiList = checkYakuhai(ctx);
    results.push(...yakuhaiList);
  }

  return results;
}

/**
 * 计算宝牌数量并追加到役种列表
 */
export function addDora(
  yakuList: YakuResult[],
  player: Player,
  doraTiles: Tile[],
  uraDoraTiles: Tile[],
  isRiichi: boolean
): YakuResult[] {
  const allTiles = [
    ...player.hand,
    ...player.melds.flatMap((m) => m.tiles),
  ];

  const doraCount = countDora(allTiles, doraTiles);
  const uraDoraCount = isRiichi ? countDora(allTiles, uraDoraTiles) : 0;

  const result = [...yakuList];
  if (doraCount > 0) {
    result.push({ name: `宝牌×${doraCount}`, han: doraCount });
  }
  if (uraDoraCount > 0) {
    result.push({ name: `里宝牌×${uraDoraCount}`, han: uraDoraCount });
  }
  return result;
}
