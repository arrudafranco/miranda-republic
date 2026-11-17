import type { GameState } from '../types/game';
import { clamp } from '../utils/helpers';

// === Structural inflation pressures (v1.1) ===
// Inflation has several causes in Miranda. Central bank policy is one of them (see colossus.ts).
// These two are outside the president's direct control and sit alongside it.

/** Trade dependency at or above this level imports price rises from abroad. */
export const IMPORTED_INFLATION_DEPENDENCY = 40;
export const IMPORTED_INFLATION_INTERVAL = 12;
/** While any crisis chain is active, sellers pad their margins. */
export const CRISIS_MARKUP_INTERVAL = 3;

export type InflationPressure = 'imported' | 'crisis_markup';

export function processInflationTurn(state: GameState): InflationPressure[] {
  const applied: InflationPressure[] = [];
  let delta = 0;

  if (
    state.colossus.tradeDependency >= IMPORTED_INFLATION_DEPENDENCY &&
    state.turn % IMPORTED_INFLATION_INTERVAL === 0
  ) {
    delta += 1;
    applied.push('imported');
  }

  if (state.activeCrises.length > 0 && state.turn % CRISIS_MARKUP_INTERVAL === 0) {
    delta += 1;
    applied.push('crisis_markup');
  }

  state.resources.inflation = clamp(state.resources.inflation + delta, 0, 30);
  return applied;
}
