import type { GameState } from '../types/game';
import type { GameEvent } from '../types/events';
import { CRISIS_CHAINS } from '../data/crisisChains';
import { EVENT_POOL } from '../data/events';
import { resolveEvent } from './events';

/**
 * Process crisis chains each turn.
 * - Checks if any new chain should trigger
 * - Advances existing chains to next stage
 * - Events WITH choices are queued for the player (shown next turn via news phase)
 * - Events WITHOUT choices auto-resolve immediately
 */
export function processCrisisTick(state: GameState): void {
  // Advance existing crises
  const remaining = [];
  for (const active of state.activeCrises) {
    const chain = CRISIS_CHAINS.find(c => c.id === active.chainId);
    if (!chain) continue;

    const nextIndex = active.stageIndex + 1;
    if (nextIndex < chain.stages.length) {
      const eventId = chain.stages[nextIndex];
      const event = EVENT_POOL.find(e => e.id === eventId);
      if (event) {
        fireCrisisEvent(state, event);
      }
      remaining.push({ chainId: active.chainId, stageIndex: nextIndex });
    }
    // If no more stages, chain completes and drops off
  }

  // Check for new chain triggers
  for (const chain of CRISIS_CHAINS) {
    // Skip if already active
    if (remaining.some(a => a.chainId === chain.id)) continue;
    if (state.activeCrises.some(a => a.chainId === chain.id)) continue;

    // Skip if first stage already fired (one-shot chains)
    if (state.firedEventIds.includes(chain.stages[0])) continue;

    if (chain.trigger(state)) {
      const firstEventId = chain.stages[0];
      const event = EVENT_POOL.find(e => e.id === firstEventId);
      if (event) {
        fireCrisisEvent(state, event);
      }
      remaining.push({ chainId: chain.id, stageIndex: 0 });
    }
  }

  state.activeCrises = remaining;
}

function fireCrisisEvent(state: GameState, event: GameEvent): void {
  if (!event.choices) {
    // No choices: auto-resolve immediately
    state.newsLog.push({ turn: state.turn, headline: event.name });
    resolveEvent(state, event);
  } else {
    // Has choices: queue for player to see in next turn's news phase
    state.crisisEventQueue.push(event.id);
  }

  if (event.oneShot && !state.firedEventIds.includes(event.id)) {
    state.firedEventIds.push(event.id);
  }
}
