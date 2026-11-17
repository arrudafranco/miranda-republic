import type { GameState, PolarizationPressure } from '../types/game';
import { clamp } from '../utils/helpers';

/**
 * Get capital cost multiplier for centrist policies based on polarization.
 * Non-centrist policies return 1.0 (extreme actions get discount at high polarization).
 */
export function getPolarizationCostMultiplier(polarization: number, isCentrist: boolean): number {
  if (!isCentrist) {
    // Extreme actions get cheaper at high polarization
    if (polarization >= 60) return 0.75;
    return 1.0;
  }

  // Centrist policies get more expensive
  if (polarization < 30) return 1.0;
  if (polarization < 60) return 1.25;
  if (polarization < 80) return 1.5;
  return 2.0;
}

/**
 * Get backlash chance for centrist policies at high polarization.
 */
export function getBacklashChance(polarization: number, isCentrist: boolean): number {
  if (!isCentrist) return 0;
  if (polarization < 60) return 0;
  if (polarization < 80) return 0.2;
  return 0.4;
}

/**
 * Apply backlash effects: Narrative -5, Mobilization -5
 */
export function applyBacklash(state: GameState): void {
  state.resources.narrative = clamp(state.resources.narrative - 5, 0, 100);
  state.resources.mobilization = clamp(state.resources.mobilization - 5, 0, 100);
}

// === Slow polarization dynamics (v1.1) ===
// Design intent: polarization is quick to rise and slow to fall, but never a one-way street.

/** Legitimacy needed for civic calm to count. Lower when the cost of living is under control. */
export const CALM_LEGITIMACY_THRESHOLD = 60;
export const CALM_LEGITIMACY_THRESHOLD_LOW_INFLATION = 45;
export const CALM_LOW_INFLATION = 5;
/** Calm turns needed before polarization starts cooling. */
export const CALM_STREAK_REQUIRED = 2;
/** Inflation at or above this level feeds polarization every turn. */
export const COST_OF_LIVING_ANGER = 15;
/** Average loyalty of the mobilized base (Unions, Scholars, Artists) below which the street turns. */
export const BASE_ABANDONED_LOYALTY = 30;
/** Loyalty gap between favoured elites and working blocs that reads as "two Mirandas". */
export const ELITE_FAVOUR_GAP = 30;

/** Average loyalty of the blocs that fill the streets for you. */
export function getMobilizedBaseLoyalty(state: GameState): number {
  const b = state.blocs;
  return (b.labor.loyalty + b.academy.loyalty + b.artists.loyalty) / 3;
}

/** How much better the government treats owners than workers, read through loyalty. */
export function getEliteFavourGap(state: GameState): number {
  const b = state.blocs;
  const elites = (b.finance.loyalty + b.industry.loyalty + b.agri.loyalty) / 3;
  const working = (b.labor.loyalty + b.mainStreet.loyalty) / 2;
  return elites - working;
}

/**
 * End-of-turn polarization drift. Returns the pressures that applied (for briefings and tests).
 *
 * Cooling (-1 every second calm turn): a legitimate government and consecutive turns in which
 * polarization did not rise. Heating (+1 per turn each): cost-of-living anger and an abandoned
 * activist base. Heating (+1 every other turn): a visible gap between how elites and working
 * blocs are treated.
 * Heating (+1 each): cost-of-living anger, an abandoned activist base, and (every other turn)
 * a visible gap between how elites and working blocs are treated.
 */
export function processPolarizationTurn(state: GameState): PolarizationPressure[] {
  const res = state.resources;
  const prev = state.previousResources;
  const applied: PolarizationPressure[] = [];

  // Calm streak: polarization did not rise this turn and the government is seen as legitimate
  const legitNeeded = res.inflation <= CALM_LOW_INFLATION
    ? CALM_LEGITIMACY_THRESHOLD_LOW_INFLATION
    : CALM_LEGITIMACY_THRESHOLD;
  const didNotRise = prev ? res.polarization <= prev.polarization : true;
  if (didNotRise && res.legitimacy >= legitNeeded) {
    state.polarizationCalmStreak = (state.polarizationCalmStreak ?? 0) + 1;
  } else {
    state.polarizationCalmStreak = 0;
  }

  let delta = 0;
  if (state.polarizationCalmStreak >= CALM_STREAK_REQUIRED) {
    // Slow by design: one point for every second calm turn
    if (state.polarizationCalmStreak % 2 === 0) delta -= 1;
    applied.push('cooling');
  }
  if (res.inflation >= COST_OF_LIVING_ANGER) {
    delta += 1;
    applied.push('cost_of_living');
  }
  if (getMobilizedBaseLoyalty(state) < BASE_ABANDONED_LOYALTY) {
    delta += 1;
    applied.push('abandoned_base');
  }
  if (getEliteFavourGap(state) >= ELITE_FAVOUR_GAP) {
    // Slower than the others: resentment over disparity builds every other turn
    if (state.turn % 2 === 0) delta += 1;
    applied.push('two_mirandas');
  }

  res.polarization = clamp(res.polarization + delta, 0, 100);
  const before = state.polarizationPressures ?? [];
  state.polarizationPressureOnsets = applied.filter(p => !before.includes(p));
  state.polarizationPressures = applied;
  return applied;
}
