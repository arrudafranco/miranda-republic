import type { GameState } from '../types/game';
import { clamp } from '../utils/helpers';

/**
 * Process labor cohesion changes at end of turn based on streaks.
 */
export function processLaborCohesionTurn(state: GameState): void {
  // Track union loyalty streak
  if (state.blocs.labor.loyalty > 70) {
    state.unionLoyaltyAbove70Streak++;
  } else {
    state.unionLoyaltyAbove70Streak = 0;
  }

  // Sustained trust builds organizational capacity: +2/turn after 3+ turns above 70
  if (state.unionLoyaltyAbove70Streak >= 3) {
    state.laborCohesion = clamp(state.laborCohesion + 2, 0, 100);
  }

  // Track high polarization streak
  if (state.resources.polarization > 60) {
    state.highPolarizationStreak++;
  } else {
    state.highPolarizationStreak = 0;
  }

  // Extended high polarization erodes cohesion: -2/turn after 4+ turns
  if (state.highPolarizationStreak >= 4) {
    state.laborCohesion = clamp(state.laborCohesion - 2, 0, 100);
  }
}

/**
 * Get effective labor power, modified by cohesion.
 * effectivePower = basePower * (0.5 + cohesion / 200)
 */
export function getEffectiveLaborPower(basePower: number, cohesion: number): number {
  return Math.round(basePower * (0.5 + cohesion / 200));
}
