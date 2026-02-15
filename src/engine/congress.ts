import type { BlocId } from '../types/blocs';
import type { GameState } from '../types/game';
import type { ActionCategory } from '../types/actions';
import { ALL_BLOC_IDS } from '../types/blocs';
import { getEffectiveLaborPower } from './laborCohesion';

const SYNDICATE_SEAT_MULTIPLIER = 0.3;

/** Policy categories whose costs are affected by congressional majority */
export const LEGISLATIVE_CATEGORIES: Set<ActionCategory> = new Set([
  'economic', 'labor', 'security', 'institutional', 'diplomatic',
]);

/**
 * Calculate seat shares proportional to Power.
 * Underworld at 0.3x, Labor uses effective power (cohesion-modified).
 */
export function calculateSeatShares(state: GameState): Record<BlocId, number> {
  const rawPower: Record<string, number> = {};
  let totalPower = 0;

  for (const id of ALL_BLOC_IDS) {
    let power = state.blocs[id].power;

    if (id === 'syndicate') {
      power = power * SYNDICATE_SEAT_MULTIPLIER;
    } else if (id === 'labor') {
      power = getEffectiveLaborPower(power, state.laborCohesion);
    }

    rawPower[id] = power;
    totalPower += power;
  }

  const shares = {} as Record<BlocId, number>;
  for (const id of ALL_BLOC_IDS) {
    shares[id] = totalPower > 0 ? rawPower[id] / totalPower : 0;
  }
  return shares;
}

/**
 * Check if a coalition can pass a bill (>50% seat share).
 */
export function canPassBill(
  seatShares: Record<BlocId, number>,
  coalition: BlocId[]
): boolean {
  const totalShare = coalition.reduce((sum, id) => sum + (seatShares[id] || 0), 0);
  return totalShare > 0.5;
}

/**
 * Determine if blocs with loyalty >= 50 hold >50% of congressional seats.
 */
export function hasFriendlyMajority(state: GameState): boolean {
  const shares = state.congress.seatShares;
  let friendlyPct = 0;
  for (const id of ALL_BLOC_IDS) {
    if (state.blocs[id].loyalty >= 50) {
      friendlyPct += shares[id] ?? 0;
    }
  }
  return friendlyPct > 0.5;
}

/**
 * Returns the cost multiplier for a policy based on congressional majority.
 * Legislative categories: 0.85x with majority, 1.15x without.
 * Bypass categories (backroom, rhetoric): always 1.0.
 */
export function getCongressCostMultiplier(
  friendlyMajority: boolean,
  category: ActionCategory
): number {
  if (!LEGISLATIVE_CATEGORIES.has(category)) return 1.0;
  return friendlyMajority ? 0.85 : 1.15;
}
