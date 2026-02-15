import type { GameState } from '../types/game';
import { clamp } from '../utils/helpers';

// Cultural bloc weights for narrative calculation
const NARRATIVE_WEIGHTS: Record<string, number> = {
  media: 0.35,
  artists: 0.25,
  academy: 0.20,
  clergy: 0.20,
};

/**
 * Calculate narrative shift based on cultural bloc loyalties.
 * Slow to build (+1 to +3), fast to lose.
 */
export function calculateNarrativeShift(state: GameState): number {
  let weightedLoyalty = 0;

  for (const [blocId, weight] of Object.entries(NARRATIVE_WEIGHTS)) {
    const bloc = state.blocs[blocId as keyof typeof state.blocs];
    if (bloc) {
      weightedLoyalty += bloc.loyalty * weight;
    }
  }

  // weightedLoyalty is 0-100 (weighted average of cultural bloc loyalties)
  // Above 50 = narrative gains; below 50 = narrative losses
  const diff = weightedLoyalty - 50;

  if (diff > 0) {
    // Slow to build: +1 to +3
    return clamp(Math.round(diff / 15), 1, 3);
  } else if (diff < -10) {
    // Fast to lose: -2 to -8
    return clamp(Math.round(diff / 5), -8, -2);
  }

  return 0;
}

/**
 * Apply narrative shift during the narrative phase.
 */
export function applyNarrativePhase(state: GameState): void {
  const shift = calculateNarrativeShift(state);
  state.resources.narrative = clamp(state.resources.narrative + shift, 0, 100);
}
