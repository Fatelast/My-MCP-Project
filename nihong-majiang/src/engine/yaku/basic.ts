/**
 * 基础役种判定函数
 * 每个函数接收和牌上下文，返回该役是否成立及番数
 */
import type { Tile, GameState, YakuResult, WinPattern, Player } from '../types';
import { isYaochuTile, isSangenpai, isKazepai, honorValueToWind } from '../tiles';

/** 和牌上下文 */
export interface WinContext {
  player: Player;
  state: GameState;
  winTile: Tile;
  isTsumo: boolean;
  /** 最佳和牌型（由 index.ts 传入） */
  pattern?: WinPattern;
  /** 所有合法和牌型 */
  patterns: WinPattern[];
}

/**
 * 立直
 * 门清手牌宣告立直后和牌
 */
export function checkRiichi(ctx: WinContext): YakuResult | null {
  if (!ctx.player.isRiichi) return null;
  return { name: '立直', han: 1 };
}

/**
 * 一发
 * 立直后第一巡内和牌（无人鸣牌）
 */
export function checkIppatsu(ctx: WinContext): YakuResult | null {
  if (!ctx.player.isRiichi) return null;
  if (ctx.player.riichiTurnCount === 0) {
    return { name: '一发', han: 1 };
  }
  return null;
}

/**
 * 门清自摸
 * 门清状态下自摸和牌
 */
export function checkMenzenTsumo(ctx: WinContext): YakuResult | null {
  if (!ctx.isTsumo) return null;
  if (ctx.player.melds.length > 0) return null;
  return { name: '门清自摸', han: 1 };
}

/**
 * 断幺九
 * 手牌和副露中没有幺九牌
 */
export function checkTanyao(ctx: WinContext): YakuResult | null {
  const allTiles = [
    ...ctx.player.hand,
    ...ctx.player.melds.flatMap((m) => m.tiles),
  ];
  if (allTiles.some(isYaochuTile)) return null;
  return { name: '断幺九', han: 1, hanOpen: 1 };
}

/**
 * 平和
 * 门清、4顺子、两面待、非役牌雀头
 */
export function checkPinfu(ctx: WinContext): YakuResult | null {
  if (ctx.player.melds.length > 0) return null;
  const { patterns, winTile, state, player } = ctx;

  for (const pattern of patterns) {
    const { mentsuList, jantou } = pattern;
    // 全顺子
    if (!mentsuList.every((m) => m.type === 'shuntsu')) continue;
    // 非役牌雀头
    const jHead = jantou[0];
    if (isSangenpai(jHead)) continue;
    if (isKazepai(jHead)) {
      const headWind = honorValueToWind(jHead.value);
      if (headWind === state.roundWind || headWind === player.wind) continue;
    }
    // 两面待：和牌张是某顺子的两端
    const isRyanmen = mentsuList.some((m) => {
      if (m.type !== 'shuntsu') return false;
      const vals = m.tiles.map((t) => t.value).sort((a, b) => a - b);
      const [min, , max] = vals;
      const wv = winTile.value;
      const ws = winTile.suit;
      if (m.tiles[0].suit !== ws) return false;
      return (wv === min && min > 1) || (wv === max && max < 9);
    });
    if (isRyanmen) return { name: '平和', han: 1 };
  }
  return null;
}

/**
 * 一盃口
 * 门清，两组完全相同的顺子
 */
export function checkIipeiko(ctx: WinContext): YakuResult | null {
  if (ctx.player.melds.length > 0) return null;
  for (const pattern of ctx.patterns) {
    const shuntsus = pattern.mentsuList.filter((m) => m.type === 'shuntsu');
    for (let i = 0; i < shuntsus.length; i++) {
      for (let j = i + 1; j < shuntsus.length; j++) {
        const a = shuntsus[i].tiles.map((t) => `${t.suit}-${t.value}`).sort().join(',');
        const b = shuntsus[j].tiles.map((t) => `${t.suit}-${t.value}`).sort().join(',');
        if (a === b) return { name: '一盃口', han: 1 };
      }
    }
  }
  return null;
}

/**
 * 役牌（三元牌/场风/自风）
 */
export function checkYakuhai(ctx: WinContext): YakuResult[] {
  const results: YakuResult[] = [];
  // 检查刻子/杠子（三元牌和风牌)
  for (const pattern of ctx.patterns) {
    for (const mentsu of [...pattern.mentsuList, ...ctx.player.melds.map(m => ({ type: 'koutsu' as const, tiles: m.tiles, isOpen: true }))]  ) {
      if (mentsu.type !== 'koutsu' && mentsu.type !== 'kantsu') continue;
      const t = mentsu.tiles[0];
      if (isSangenpai(t)) {
        const names: Record<number, string> = { 5: '白', 6: '發', 7: '中' };
        results.push({ name: `役牌·${names[t.value] ?? ''}`, han: 1, hanOpen: 1 });
      } else if (isKazepai(t)) {
        const tWind = honorValueToWind(t.value);
        if (tWind === ctx.state.roundWind) {
          const windNames: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };
          results.push({ name: `场风·${windNames[tWind]}`, han: 1, hanOpen: 1 });
        }
        if (tWind === ctx.player.wind) {
          const windNames: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };
          results.push({ name: `自风·${windNames[tWind]}`, han: 1, hanOpen: 1 });
        }
      }
    }
    break; // 只检查第一个pattern的暗刻，副露已单独处理
  }
  return results;
}

/**
 * 一气通贯
 * 同花色 1-2-3, 4-5-6, 7-8-9
 */
export function checkIttsu(ctx: WinContext): YakuResult | null {
  const allMentsu = [
    ...(ctx.patterns[0]?.mentsuList ?? []),
    ...ctx.player.melds.map((m) => ({ type: 'shuntsu' as const, tiles: m.tiles, isOpen: true })),
  ];

  for (const suit of ['man', 'pin', 'sou'] as const) {
    const has123 = allMentsu.some(
      (m) => m.type === 'shuntsu' &&
        m.tiles[0].suit === suit &&
        m.tiles.map((t) => t.value).sort().join('') === '123'
    );
    const has456 = allMentsu.some(
      (m) => m.type === 'shuntsu' &&
        m.tiles[0].suit === suit &&
        m.tiles.map((t) => t.value).sort().join('') === '456'
    );
    const has789 = allMentsu.some(
      (m) => m.type === 'shuntsu' &&
        m.tiles[0].suit === suit &&
        m.tiles.map((t) => t.value).sort().join('') === '789'
    );
    if (has123 && has456 && has789) {
      return { name: '一气通贯', han: 2, hanOpen: 1 };
    }
  }
  return null;
}

/**
 * 三色同顺
 * 万/饼/索三种花色各有相同序号的顺子
 */
export function checkSanshokuDoujun(ctx: WinContext): YakuResult | null {
  for (const pattern of ctx.patterns) {
    const shuntsus = [
      ...pattern.mentsuList.filter((m) => m.type === 'shuntsu'),
      ...ctx.player.melds.map((m) => ({ type: 'shuntsu' as const, tiles: m.tiles, isOpen: true })),
    ];
    const manSeqs = shuntsus.filter((m) => m.tiles[0].suit === 'man').map((m) => m.tiles.map((t) => t.value).sort().join(''));
    const pinSeqs = shuntsus.filter((m) => m.tiles[0].suit === 'pin').map((m) => m.tiles.map((t) => t.value).sort().join(''));
    const souSeqs = shuntsus.filter((m) => m.tiles[0].suit === 'sou').map((m) => m.tiles.map((t) => t.value).sort().join(''));
    for (const seq of manSeqs) {
      if (pinSeqs.includes(seq) && souSeqs.includes(seq)) {
        return { name: '三色同顺', han: 2, hanOpen: 1 };
      }
    }
  }
  return null;
}

/**
 * 混全带幺九
 * 所有面子和雀头都含有幺九牌，且含有顺子
 */
export function checkChanta(ctx: WinContext): YakuResult | null {
  for (const pattern of ctx.patterns) {
    const allM = [
      ...pattern.mentsuList,
      ...ctx.player.melds.map((m) => ({ type: 'koutsu' as const, tiles: m.tiles, isOpen: true })),
    ];
    const hasShuntsu = allM.some((m) => m.type === 'shuntsu');
    if (!hasShuntsu) continue;
    const allYaochu = allM.every((m) => m.tiles.some(isYaochuTile));
    const jantouYaochu = pattern.jantou.some(isYaochuTile);
    if (allYaochu && jantouYaochu) {
      return { name: '混全带幺九', han: 2, hanOpen: 1 };
    }
  }
  return null;
}

/**
 * 对对和
 * 全部面子为刻子/杠子
 */
export function checkToitoi(ctx: WinContext): YakuResult | null {
  for (const pattern of ctx.patterns) {
    const allM = [
      ...pattern.mentsuList,
      ...ctx.player.melds.map((m) => ({ type: m.type === 'chi' ? 'shuntsu' : 'koutsu' as const, tiles: m.tiles, isOpen: true })),
    ];
    if (allM.every((m) => m.type === 'koutsu' || m.type === 'kantsu')) {
      return { name: '对对和', han: 2, hanOpen: 2 };
    }
  }
  return null;
}

/**
 * 混一色
 * 只使用一种数牌 + 字牌
 */
export function checkHonitsu(ctx: WinContext): YakuResult | null {
  const allTiles = [
    ...ctx.player.hand,
    ...ctx.player.melds.flatMap((m) => m.tiles),
  ];
  const suits = new Set(allTiles.filter((t) => t.suit !== 'honor').map((t) => t.suit));
  if (suits.size === 1 && allTiles.some((t) => t.suit === 'honor')) {
    return { name: '混一色', han: 3, hanOpen: 2 };
  }
  return null;
}

/**
 * 清一色
 * 只使用一种数牌
 */
export function checkChinitsu(ctx: WinContext): YakuResult | null {
  const allTiles = [
    ...ctx.player.hand,
    ...ctx.player.melds.flatMap((m) => m.tiles),
  ];
  if (allTiles.some((t) => t.suit === 'honor')) return null;
  const suits = new Set(allTiles.map((t) => t.suit));
  if (suits.size === 1) {
    return { name: '清一色', han: 6, hanOpen: 5 };
  }
  return null;
}

/**
 * 小三元
 * 三元牌中两组刻子+一组雀头
 */
export function checkShousangen(ctx: WinContext): YakuResult | null {
  for (const pattern of ctx.patterns) {
    const allM = [
      ...pattern.mentsuList,
      ...ctx.player.melds.map((m) => ({ type: 'koutsu' as const, tiles: m.tiles, isOpen: true })),
    ];
    const sangenpaiKoutsu = allM.filter(
      (m) => (m.type === 'koutsu' || m.type === 'kantsu') && isSangenpai(m.tiles[0])
    );
    const jantouSangenpai = isSangenpai(pattern.jantou[0]);
    if (sangenpaiKoutsu.length === 2 && jantouSangenpai) {
      return { name: '小三元', han: 2, hanOpen: 2 };
    }
  }
  return null;
}

/**
 * 混老头
 * 全部由幺九牌构成（含字牌），且有顺子（否则为对对和）
 */
export function checkHonroutou(ctx: WinContext): YakuResult | null {
  const allTiles = [
    ...ctx.player.hand,
    ...ctx.player.melds.flatMap((m) => m.tiles),
  ];
  if (!allTiles.every(isYaochuTile)) return null;
  return { name: '混老头', han: 2, hanOpen: 2 };
}

/**
 * 海底摸月
 * 摸最后一张牌自摸
 */
export function checkHaitei(ctx: WinContext): YakuResult | null {
  if (!ctx.isTsumo || !ctx.state.isHaitei) return null;
  return { name: '海底摸月', han: 1 };
}

/**
 * 河底捞鱼
 * 荣和最后一张打出的牌
 */
export function checkHoutei(ctx: WinContext): YakuResult | null {
  if (ctx.isTsumo || !ctx.state.isHaitei) return null;
  return { name: '河底捞鱼', han: 1 };
}

/**
 * 岭上开花
 * 杠后摸到的岭上牌自摸和
 */
export function checkRinshan(_ctx: WinContext): YakuResult | null {
  // 由游戏流程控制层标记 isRinshan
  return null; // 由 game.ts 在杠后摸牌时传入特殊标记
}

/**
 * 抢杠
 * 别家加杠时荣和
 */
export function checkChankan(_ctx: WinContext): YakuResult | null {
  // 由游戏流程控制层标记 isChankan
  return null; // 由 game.ts 在加杠时传入特殊标记
}
