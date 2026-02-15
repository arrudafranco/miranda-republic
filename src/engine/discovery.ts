import type { GameState } from '../types/game';
import type { BlocId } from '../types/blocs';
import { clamp } from '../utils/helpers';

/**
 * Process pending discoveries each turn.
 * Decrements counters and applies effects when they expire.
 * Returns true if any discovery fired (for crisis chain triggers).
 */
export function processDiscoveryTick(state: GameState): boolean {
  let anyFired = false;
  const remaining = [];

  for (const pending of state.pendingDiscoveries) {
    pending.turnsLeft--;
    if (pending.turnsLeft <= 0) {
      // Discovery fires — apply effects
      applyDiscoveryEffects(state, pending.effect.effects);
      state.newsLog.push({
        turn: state.turn,
        headline: `Scandal exposed. A past deal involving ${pending.sourcePolicyId.replace(/_/g, ' ')} has come to light.`,
      });
      anyFired = true;
    } else {
      remaining.push(pending);
    }
  }

  state.pendingDiscoveries = remaining;
  return anyFired;
}

function applyDiscoveryEffects(
  state: GameState,
  effects: { blocs?: Record<string, { loyalty?: number; power?: number }>; resources?: Record<string, number>; rivalPower?: number }
): void {
  if (effects.blocs) {
    for (const [blocIdStr, effect] of Object.entries(effects.blocs)) {
      const blocId = blocIdStr as BlocId;
      const bloc = state.blocs[blocId];
      if (!bloc || !effect) continue;
      if (effect.loyalty) {
        bloc.loyalty = clamp(bloc.loyalty + effect.loyalty, 0, 100);
      }
      if (effect.power) {
        bloc.power = clamp(bloc.power + effect.power, 0, 100);
      }
    }
  }

  if (effects.resources) {
    for (const [key, delta] of Object.entries(effects.resources)) {
      if (delta === undefined) continue;
      const resKey = key as keyof typeof state.resources;
      const current = state.resources[resKey];
      if (typeof current === 'number') {
        (state.resources as Record<string, number>)[resKey] = clamp(current + delta, 0, key === 'capital' ? 999 : key === 'inflation' ? 30 : 100);
      }
    }
  }

  if (effects.rivalPower) {
    state.rival.power = clamp(state.rival.power + effects.rivalPower, 0, 100);
  }
}
