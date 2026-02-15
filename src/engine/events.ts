import type { GameState } from '../types/game';
import type { GameEvent, EventChoice } from '../types/events';
import type { BlocId } from '../types/blocs';
import { EVENT_POOL } from '../data/events';
import { clamp, rollChance, randomChoice } from '../utils/helpers';

/**
 * Select a news event for this turn based on triggers and conditions.
 */
export function selectNewsEvent(state: GameState): GameEvent | null {
  const eligible: GameEvent[] = [];

  for (const event of EVENT_POOL) {
    // Skip fired one-shot events
    if (event.oneShot && state.firedEventIds.includes(event.id)) continue;

    // Check trigger
    const trigger = event.trigger;
    let triggered = false;

    switch (trigger.type) {
      case 'rival_threshold': {
        // Check if rival just crossed this threshold
        const justCrossed = state.rival.power >= trigger.powerLevel &&
          !state.firedEventIds.includes(event.id);
        triggered = justCrossed;
        break;
      }
      case 'loyalty_threshold': {
        const bloc = state.blocs[trigger.blocId];
        if (trigger.direction === 'below') {
          triggered = bloc.loyalty < trigger.threshold;
        } else {
          triggered = bloc.loyalty > trigger.threshold;
        }
        break;
      }
      case 'random': {
        triggered = rollChance(trigger.weight / 20); // weight/20 = probability
        break;
      }
      case 'resource_threshold': {
        const value = state.resources[trigger.resource];
        if (trigger.direction === 'below') {
          triggered = value < trigger.threshold;
        } else {
          triggered = value > trigger.threshold;
        }
        break;
      }
    }

    if (!triggered) continue;

    // Check additional condition
    if (event.condition && !event.condition(state)) continue;

    eligible.push(event);
  }

  if (eligible.length === 0) return null;

  // Priority: rival threshold events first, then loyalty thresholds, then random
  const rivalEvents = eligible.filter(e => e.trigger.type === 'rival_threshold');
  if (rivalEvents.length > 0) return rivalEvents[0];

  const loyaltyEvents = eligible.filter(e => e.trigger.type === 'loyalty_threshold');
  if (loyaltyEvents.length > 0) return loyaltyEvents[0];

  // Pick a random one from the random events
  const randomEvents = eligible.filter(e => e.trigger.type === 'random');
  if (randomEvents.length > 0) {
    return randomChoice(randomEvents);
  }

  return eligible[0];
}

/**
 * Resolve an event's effects (auto-effects or a chosen option).
 */
export function resolveEvent(
  state: GameState,
  event: GameEvent,
  choiceId?: string
): void {
  let effects: EventChoice['effects'] | undefined;

  if (choiceId && event.choices) {
    const choice = event.choices.find(c => c.id === choiceId);
    effects = choice?.effects;
  } else if (event.autoEffects) {
    effects = event.autoEffects;
  }

  if (!effects) return;

  // Apply bloc effects
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

  // Apply resource effects
  if (effects.resources) {
    for (const [key, delta] of Object.entries(effects.resources)) {
      if (delta === undefined) continue;
      const resKey = key as keyof typeof state.resources;
      const range = getResourceRange(resKey);
      (state.resources as Record<string, number>)[resKey] = clamp(
        state.resources[resKey] + delta,
        range.min,
        range.max
      );
    }
  }

  // Apply rival power
  if (effects.rivalPower) {
    state.rival.power = clamp(state.rival.power + effects.rivalPower, 0, 100);
  }

  // Apply labor cohesion
  if (effects.laborCohesion) {
    state.laborCohesion = clamp(state.laborCohesion + effects.laborCohesion, 0, 100);
  }

  // Mark as fired
  if (event.oneShot) {
    state.firedEventIds.push(event.id);
  }
}

function getResourceRange(key: string): { min: number; max: number } {
  const ranges: Record<string, { min: number; max: number }> = {
    legitimacy: { min: 0, max: 100 },
    narrative: { min: 0, max: 100 },
    capital: { min: 0, max: 999 },
    mobilization: { min: 0, max: 100 },
    polarization: { min: 0, max: 100 },
    inflation: { min: 0, max: 30 },
    dread: { min: 0, max: 100 },
    colossusAlignment: { min: 0, max: 100 },
  };
  return ranges[key] ?? { min: 0, max: 100 };
}

/**
 * Check for end-phase events triggered by loyalty thresholds.
 */
export function checkEndPhaseEvents(state: GameState): GameEvent | null {
  for (const event of EVENT_POOL) {
    if (event.trigger.type !== 'loyalty_threshold') continue;
    if (event.oneShot && state.firedEventIds.includes(event.id)) continue;

    const trigger = event.trigger;
    const bloc = state.blocs[trigger.blocId];
    const triggered = trigger.direction === 'below'
      ? bloc.loyalty < trigger.threshold
      : bloc.loyalty > trigger.threshold;

    if (triggered && (!event.condition || event.condition(state))) {
      return event;
    }
  }
  return null;
}
