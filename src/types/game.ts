import type { BlocId, BlocState } from './blocs';
import type { ResourceState } from './resources';
import type { ColossusState } from './colossus';
import type { RivalState } from './rival';
import type { ActiveDelayedEffect, ActionChoice, DiscoveryEffect } from './actions';
import type { GameEvent } from './events';

export type Difficulty = 'story' | 'standard' | 'crisis';

export interface DifficultyConfig {
  rivalGrowthMultiplier: number;
  baseCapitalIncome: number;
  startingCapitalBonus: number;
  startingLegitimacyBonus: number;
  legitimacyDecayShield: number;
  coupDreadThreshold: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  story: {
    rivalGrowthMultiplier: 0.15,
    baseCapitalIncome: 10,
    startingCapitalBonus: 80,
    startingLegitimacyBonus: 20,
    legitimacyDecayShield: 3,
    coupDreadThreshold: 85,
  },
  standard: {
    rivalGrowthMultiplier: 1.0,
    baseCapitalIncome: 5,
    startingCapitalBonus: 0,
    startingLegitimacyBonus: 0,
    legitimacyDecayShield: 0,
    coupDreadThreshold: 70,
  },
  crisis: {
    rivalGrowthMultiplier: 1.5,
    baseCapitalIncome: 3,
    startingCapitalBonus: -30,
    startingLegitimacyBonus: -10,
    legitimacyDecayShield: 0,
    coupDreadThreshold: 60,
  },
};

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty];
}

export interface PendingDiscovery {
  turnsLeft: number;
  effect: DiscoveryEffect;
  sourcePolicyId: string;
}

export interface ActiveCrisis {
  chainId: string;
  stageIndex: number;
}

export interface NewsLogEntry {
  turn: number;
  headline: string;
}

export type TurnPhase =
  | 'news'
  | 'briefing'
  | 'action'
  | 'reaction'
  | 'congressional'
  | 'narrative'
  | 'end';

export type EndingId =
  | 'republic_endures'
  | 'a_new_story'
  | 'managers_victory'
  | 'hollow_republic'
  | 'protectorate'
  | 'shadow_republic'
  | 'impeached'
  | 'coup'
  | 'rival_wins'
  | 'new_compact';

export interface CongressState {
  seatShares: Record<BlocId, number>;  // Proportional to power
  pendingBill: string | null;
}

export interface GameState {
  // Difficulty
  difficulty: Difficulty;

  // Turn tracking
  turn: number;                         // 1-48
  phase: TurnPhase;
  maxTurns: number;

  // Core state
  blocs: Record<BlocId, BlocState>;
  resources: ResourceState;
  colossus: ColossusState;
  rival: RivalState;
  congress: CongressState;

  // Hidden mechanics
  laborCohesion: number;                // 0-100, starts at 40
  centralBankIndependence: number;      // 0-100, starts at 60

  // Streak trackers
  unionLoyaltyAbove70Streak: number;    // Consecutive turns with union loyalty > 70
  highPolarizationStreak: number;       // Consecutive turns with polarization > 60

  // Active effects
  delayedEffects: ActiveDelayedEffect[];
  pendingDiscoveries: PendingDiscovery[];
  activeCrises: ActiveCrisis[];
  crisisEventQueue: string[];           // Crisis event IDs queued for player choices

  // Events
  firedEventIds: string[];              // Events already triggered (for oneShot)
  currentEvent: GameEvent | null;
  pendingActions: ActionChoice[];

  // News log
  newsLog: NewsLogEntry[];

  // Game end
  ending: EndingId | null;
  gameOver: boolean;
}
