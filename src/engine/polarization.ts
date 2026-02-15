import type { GameState } from '../types/game';
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
