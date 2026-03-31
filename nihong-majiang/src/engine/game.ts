/**
 * 游戏主流程控制
 * 管理对局状态机：发牌 → 轮流摸牌/出牌 → 鸣牌响应 → 和牌结算 → 换庄
 */
import type { GameState, GameSettings, Player, Tile, Action, Wind } from './types';
import { initWall, drawFromWall } from './wall';
import { sortTiles } from './tiles';
import { canWin, isTenpai, getWaitingTiles } from './tenpai';
import { canPon, canMinkan, discard, performPon, performChi, checkFuriten } from './hand';
import { getChiCandidates } from './ai/utils';
import { calculateScore } from './yaku/scoring';

const INITIAL_SCORE = 25000;
const PLAYER_NAMES = ['あなた', 'AI-南', 'AI-西', 'AI-北'];

/**
 * 风牌顺序
 */
const WIND_ORDER: Wind[] = ['east', 'south', 'west', 'north'];

/**
 * 初始化一局游戏
 */
export function initGame(_settings: GameSettings, prevScores?: number[]): GameState {
  const wallState = initWall();

  const players: Player[] = WIND_ORDER.map((wind, i) => ({
    id: i,
    name: PLAYER_NAMES[i],
    isHuman: i === 0,
    wind,
    hand: [],
    discards: [],
    melds: [],
    score: prevScores?.[i] ?? INITIAL_SCORE,
    isRiichi: false,
    riichiTurnCount: 0,
    isFuriten: false,
  }));

  // 发牌：每人13张
  let wall = wallState.wall;
  for (let i = 0; i < 13; i++) {
    for (let p = 0; p < 4; p++) {
      if (wall.length === 0) break;
      players[p].hand.push(wall[0]);
      wall = wall.slice(1);
    }
  }
  // 排序手牌
  players.forEach((p) => { p.hand = sortTiles(p.hand); });

  return {
    phase: 'playerTurn',
    roundWind: 'east',
    roundNumber: 1,
    honba: 0,
    riichiSticks: 0,
    dealer: 0,
    currentPlayer: 0,
    players,
    wall,
    deadWall: wallState.deadWall,
    doraTiles: wallState.doraTiles,
    uraDoraTiles: wallState.uraDoraTiles,
    lastDiscard: undefined,
    lastDiscardPlayer: undefined,
    availableActions: [],
    isHaitei: false,
    turnCount: 0,
  };
}

/**
 * 玩家/AI 摸牌
 * @returns 新游戏状态（含摸到的牌加入手牌）
 */
export function drawTile(state: GameState, playerIndex: number): GameState {
  const drawResult = drawFromWall(state.wall);
  if (!drawResult) {
    // 牌山摸完 → 流局
    return { ...state, phase: 'roundEnd', isHaitei: false };
  }
  const [tile, newWall] = drawResult;
  const isHaitei = newWall.length === 0;

  const newPlayers = state.players.map((p, i) => {
    if (i !== playerIndex) return p;
    return {
      ...p,
      hand: sortTiles([...p.hand, tile]),
      riichiTurnCount: p.isRiichi ? p.riichiTurnCount + 1 : 0,
    };
  });

  return {
    ...state,
    players: newPlayers,
    wall: newWall,
    isHaitei,
    phase: playerIndex === 0 ? 'playerTurn' : 'aiTurn',
    currentPlayer: playerIndex,
  };
}

/**
 * 玩家/AI 出牌
 * 出牌后计算其他玩家可选操作
 * @returns 新游戏状态
 */
export function discardTile(
  state: GameState,
  playerIndex: number,
  tile: Tile
): GameState {
  const player = state.players[playerIndex];
  const newHand = discard(player.hand, tile);

  const newPlayers = state.players.map((p, i) => {
    if (i !== playerIndex) return p;
    const newDiscards = [...p.discards, tile];
    // 更新振听状态
    const waitingTiles = isTenpai(newHand) ? getWaitingTiles(newHand) : [];
    const furiten = checkFuriten(newDiscards, waitingTiles);
    return { ...p, hand: newHand, discards: newDiscards, isFuriten: furiten };
  });

  // 计算其他玩家的可选操作
  const availableActions = computeAvailableActions(
    { ...state, players: newPlayers },
    playerIndex,
    tile
  );

  const hasResponse = availableActions.length > 0;

  return {
    ...state,
    players: newPlayers,
    lastDiscard: tile,
    lastDiscardPlayer: playerIndex,
    availableActions,
    phase: hasResponse ? 'action' : 'aiTurn',
    currentPlayer: hasResponse ? -1 : (playerIndex + 1) % 4,
    turnCount: state.turnCount + 1,
  };
}

/**
 * 计算打牌后其他玩家的可选操作
 */
function computeAvailableActions(
  state: GameState,
  discardedBy: number,
  tile: Tile
): Action[] {
  const actions: Action[] = [];

  for (let i = 0; i < 4; i++) {
    if (i === discardedBy) continue;
    const p = state.players[i];

    // 荣和
    if (!p.isFuriten && canWin([...p.hand, tile])) {
      actions.push({ type: 'ron', tiles: [tile], playerIndex: i });
    }
    // 碰
    if (canPon(p.hand, tile)) {
      actions.push({ type: 'pon', tiles: [tile], playerIndex: i });
    }
    // 明杠
    if (canMinkan(p.hand, tile)) {
      actions.push({ type: 'kan', tiles: [tile], playerIndex: i });
    }
    // 吃（仅上家）
    if ((discardedBy + 1) % 4 === i) {
      const chiOptions = getChiCandidates(p.hand, tile);
      for (const opt of chiOptions) {
        actions.push({ type: 'chi', tiles: opt, playerIndex: i });
      }
    }
  }

  return actions;
}

/**
 * 处理玩家操作（吃/碰/杠/荣/跳过）
 */
export function processAction(
  state: GameState,
  action: Action
): GameState {
  const { type, playerIndex = 0, tiles = [] } = action;
  const player = state.players[playerIndex ?? 0];

  switch (type) {
    case 'ron': {
      // 荣和结算
      const loserIndex = state.lastDiscardPlayer ?? 0;
      const scoreResult = calculateScore(
        player,
        state,
        state.lastDiscard!,
        false,
        playerIndex,
        loserIndex
      );
      const newPlayers = state.players.map((p, i) => {
        if (i === playerIndex) return { ...p, score: p.score + scoreResult.totalPoints };
        const paid = scoreResult.payments[i] ?? 0;
        return { ...p, score: p.score - paid };
      });
      return {
        ...state,
        players: newPlayers,
        phase: 'scoring',
      };
    }

    case 'tsumo': {
      // 自摸结算
      const scoreResult = calculateScore(
        player,
        state,
        player.hand[player.hand.length - 1],
        true,
        playerIndex,
        -1
      );
      const newPlayers = state.players.map((p, i) => {
        if (i === playerIndex) return { ...p, score: p.score + scoreResult.totalPoints };
        const paid = scoreResult.payments[i] ?? 0;
        return { ...p, score: p.score - paid };
      });
      return { ...state, players: newPlayers, phase: 'scoring' };
    }

    case 'riichi': {
      // 立直：扣1000点，放立直棒
      const discardTileForRiichi = tiles[0];
      const newHand = discard(player.hand, discardTileForRiichi);
      const newPlayers = state.players.map((p, i) => {
        if (i !== playerIndex) return p;
        return {
          ...p,
          hand: newHand,
          discards: [...p.discards, discardTileForRiichi],
          isRiichi: true,
          riichiDiscard: discardTileForRiichi,
          score: p.score - 1000,
        };
      });
      return {
        ...state,
        players: newPlayers,
        riichiSticks: state.riichiSticks + 1,
        phase: 'aiTurn',
        currentPlayer: (playerIndex + 1) % 4,
      };
    }

    case 'pon': {
      const calledTile = state.lastDiscard!;
      const [newHand, meld] = performPon(player.hand, calledTile, state.lastDiscardPlayer!);
      const newPlayers = state.players.map((p, i) => {
        if (i !== playerIndex) return p;
        return { ...p, hand: newHand, melds: [...p.melds, meld] };
      });
      return {
        ...state,
        players: newPlayers,
        phase: playerIndex === 0 ? 'playerTurn' : 'aiTurn',
        currentPlayer: playerIndex,
        availableActions: [],
      };
    }

    case 'chi': {
      const calledTile = state.lastDiscard!;
      const [newHand, meld] = performChi(player.hand, tiles, calledTile, state.lastDiscardPlayer!);
      const newPlayers = state.players.map((p, i) => {
        if (i !== playerIndex) return p;
        return { ...p, hand: newHand, melds: [...p.melds, meld] };
      });
      return {
        ...state,
        players: newPlayers,
        phase: playerIndex === 0 ? 'playerTurn' : 'aiTurn',
        currentPlayer: playerIndex,
        availableActions: [],
      };
    }

    case 'skip': {
      // 跳过：找下一个需要响应的玩家，或直接下家摸牌
      const remainingActions = state.availableActions.filter(
        (a) => a.playerIndex !== playerIndex
      );
      if (remainingActions.length === 0) {
        const nextPlayer = (state.lastDiscardPlayer! + 1) % 4;
        return {
          ...state,
          availableActions: [],
          phase: nextPlayer === 0 ? 'playerTurn' : 'aiTurn',
          currentPlayer: nextPlayer,
        };
      }
      return { ...state, availableActions: remainingActions };
    }

    default:
      return state;
  }
}

/**
 * 检查是否流局（牌山耗尽）
 */
export function checkRoundEnd(state: GameState): boolean {
  return state.wall.length === 0;
}

/**
 * 进入下一局（换庄或连庄）
 */
export function nextRound(
  state: GameState,
  winnerIndex: number | null
): GameState {
  const isDealer = winnerIndex === state.dealer;
  const newHonba = isDealer || winnerIndex === null ? state.honba + 1 : 0;
  const newDealer = isDealer || winnerIndex === null ? state.dealer : (state.dealer + 1) % 4;
  const newRiichiSticks = isDealer ? 0 : state.riichiSticks;

  // 重置玩家手牌/河牌/副露/立直状态
  const scores = state.players.map((p) => p.score);
  const newState = initGame(
    { gameType: 'tonpuusen', aiDifficulty: 'normal', initialScore: INITIAL_SCORE, useAka: true },
    scores
  );

  return {
    ...newState,
    dealer: newDealer,
    honba: newHonba,
    riichiSticks: newRiichiSticks,
    roundNumber: state.roundNumber,
    roundWind: state.roundWind,
  };
}
