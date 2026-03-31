/**
 * 日本麻将核心类型定义
 * 所有游戏逻辑共享的基础类型
 */

/** 花色：万子/饼子/索子/字牌 */
export type Suit = 'man' | 'pin' | 'sou' | 'honor';

/** 数牌面值 1-9 */
export type NumberValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * 字牌面值：
 * 1=東 2=南 3=西 4=北（风牌）
 * 5=白 6=發 7=中（三元牌）
 */
export type HonorValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TileValue = NumberValue | HonorValue;

/** 场风/自风 */
export type Wind = 'east' | 'south' | 'west' | 'north';

/**
 * 麻将牌
 */
export interface Tile {
  /** 花色 */
  suit: Suit;
  /** 面值 */
  value: TileValue;
  /** 唯一ID（区分同种4张牌） */
  id: string;
  /** 是否赤五（赤宝牌） */
  isAka?: boolean;
}

/** 副露类型 */
export type MeldType = 'chi' | 'pon' | 'minkan' | 'ankan';

/**
 * 副露（吃/碰/明杠/暗杠）
 */
export interface Meld {
  type: MeldType;
  tiles: Tile[];
  /** 从哪位玩家处鸣牌（吃碰明杠用） */
  calledFrom?: number;
  /** 鸣牌时的牌（加杠时新加的牌） */
  calledTile?: Tile;
}

/**
 * 玩家状态
 */
export interface Player {
  /** 玩家索引 0-3 */
  id: number;
  /** 显示名称 */
  name: string;
  /** 是否为真人玩家 */
  isHuman: boolean;
  /** 座位风 */
  wind: Wind;
  /** 手牌（13或14张） */
  hand: Tile[];
  /** 河牌（已打出的牌） */
  discards: Tile[];
  /** 副露组 */
  melds: Meld[];
  /** 持有点数 */
  score: number;
  /** 是否已立直 */
  isRiichi: boolean;
  /** 立直时打出的那张牌 */
  riichiDiscard?: Tile;
  /** 立直后摸到的第一张牌索引（一发判定用） */
  riichiTurnCount: number;
  /** 是否振听 */
  isFuriten: boolean;
}

/** 游戏阶段状态机 */
export type GamePhase =
  | 'waiting'     // 等待开始
  | 'dealing'     // 发牌中
  | 'playerTurn'  // 玩家摸牌回合
  | 'aiTurn'      // AI回合
  | 'action'      // 等待玩家/AI响应（吃碰杠荣）
  | 'scoring'     // 和牌结算
  | 'roundEnd'    // 本局结束（流局/和牌后结算完毕）
  | 'gameEnd';    // 全局对局结束

/** 可选操作类型 */
export type ActionType = 'chi' | 'pon' | 'kan' | 'ron' | 'tsumo' | 'riichi' | 'skip' | 'ankan' | 'kakan';

/**
 * 玩家可选操作
 */
export interface Action {
  type: ActionType;
  /** 吃牌时选定的组合 */
  tiles?: Tile[];
  /** 操作的玩家索引 */
  playerIndex?: number;
}

/**
 * 全局游戏状态
 */
export interface GameState {
  phase: GamePhase;
  /** 场风（东风/南风） */
  roundWind: Wind;
  /** 局数（1-4） */
  roundNumber: number;
  /** 本场数（连庄数） */
  honba: number;
  /** 场上立直棒数量 */
  riichiSticks: number;
  /** 庄家索引 */
  dealer: number;
  /** 当前行动玩家索引 */
  currentPlayer: number;
  /** 4位玩家 */
  players: Player[];
  /** 牌山（剩余待摸牌） */
  wall: Tile[];
  /** 王牌区（14张，含岭上牌和宝牌指示牌） */
  deadWall: Tile[];
  /** 已翻开的宝牌指示牌 */
  doraTiles: Tile[];
  /** 里宝牌指示牌（立直和牌时翻开） */
  uraDoraTiles: Tile[];
  /** 最后打出的牌 */
  lastDiscard?: Tile;
  /** 最后打出牌的玩家索引 */
  lastDiscardPlayer?: number;
  /** 当前可选操作列表 */
  availableActions: Action[];
  /** 是否海底（最后一张牌） */
  isHaitei: boolean;
  /** 摸牌计数（用于一发判定） */
  turnCount: number;
}

/**
 * 役种结果
 */
export interface YakuResult {
  /** 役种名称（中文） */
  name: string;
  /** 番数（门清/副露） */
  han: number;
  /** 副露时番数（0表示副露不可用） */
  hanOpen?: number;
  /** 是否役满 */
  isYakuman?: boolean;
}

/**
 * 面子（顺子/刻子/杠子）
 */
export interface Mentsu {
  type: 'shuntsu' | 'koutsu' | 'kantsu';
  tiles: Tile[];
  /** 是否明牌（副露）*/
  isOpen: boolean;
}

/**
 * 和牌分析结果（一种拆牌方式）
 */
export interface WinPattern {
  mentsuList: Mentsu[];
  /** 雀头 */
  jantou: Tile[];
}

/**
 * 点数计算结果
 */
export interface ScoreResult {
  /** 役种列表 */
  yakuList: YakuResult[];
  /** 符数 */
  fu: number;
  /** 番数合计 */
  han: number;
  /** 基本点 */
  basePoints: number;
  /** 点数级别描述 */
  limit: 'normal' | 'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'yakuman';
  /** 荣和/自摸总点数 */
  totalPoints: number;
  /** 各家支付明细 [playerIndex]: 支付点数 */
  payments: Record<number, number>;
  /** 是否自摸 */
  isTsumo: boolean;
}

/**
 * 游戏设置
 */
export interface GameSettings {
  /** 对局类型：东风战/东南战 */
  gameType: 'tonpuusen' | 'hanchan';
  /** AI难度 */
  aiDifficulty: 'easy' | 'normal' | 'hard';
  /** 初始点数（默认25000） */
  initialScore: number;
  /** 是否使用赤宝牌（默认true） */
  useAka: boolean;
}
