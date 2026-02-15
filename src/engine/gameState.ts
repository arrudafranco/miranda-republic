import { create } from 'zustand';
import type { GameState, EndingId, TurnPhase, NewsLogEntry, Difficulty } from '../types/game';
import { getDifficultyConfig } from '../types/game';
import type { BlocId, BlocEffectMap } from '../types/blocs';
import type { ActionChoice, Policy, ActiveDelayedEffect } from '../types/actions';
import type { ResourceState } from '../types/resources';
import { ALL_BLOC_IDS } from '../types/blocs';
import { STARTING_RESOURCES, RESOURCE_RANGES } from '../types/resources';
import { STARTING_COLOSSUS } from '../types/colossus';
import { STARTING_RIVAL } from '../types/rival';
import { createInitialBlocStates } from '../data/blocs';
import { POLICIES } from '../data/policies';
import { generateRivalIdentity, processRivalTurn } from './rival';
import { processColossusTurn, processCentralBankTurn, calculateTradeIncome } from './colossus';
import { calculateSeatShares, hasFriendlyMajority, getCongressCostMultiplier } from './congress';
import { applyNarrativePhase } from './narrative';
import { processLaborCohesionTurn, getEffectiveLaborPower } from './laborCohesion';
import { getPolarizationCostMultiplier, getBacklashChance, applyBacklash } from './polarization';
import { computeRippleEffects } from './interactionMatrix';
import { selectNewsEvent, resolveEvent, checkEndPhaseEvents } from './events';
import { EVENT_POOL } from '../data/events';
import { processDiscoveryTick } from './discovery';
import { processCrisisTick } from './crisisChains';
import { clamp, rollChance, deepClone } from '../utils/helpers';

const SAVE_KEY = 'miranda-save';

export interface GameStore extends GameState {
  initGame: (difficulty?: Difficulty) => void;
  processFullTurn: (actions: ActionChoice[]) => void;
  advancePhase: () => void;
  getState: () => GameState;
  startNewsPhase: () => void;
  resolveCurrentEvent: (choiceId?: string) => void;
  submitActions: (actions: ActionChoice[]) => void;
  saveGame: () => void;
  loadGame: () => boolean;
  hasSavedGame: () => boolean;
  deleteSave: () => void;
}

function createInitialState(difficulty: Difficulty = 'standard'): GameState {
  const rival = generateRivalIdentity();
  const config = getDifficultyConfig(difficulty);
  return {
    difficulty,
    turn: 1,
    phase: 'news',
    maxTurns: 48,
    blocs: createInitialBlocStates(),
    resources: {
      ...STARTING_RESOURCES,
      capital: STARTING_RESOURCES.capital + config.startingCapitalBonus,
      legitimacy: STARTING_RESOURCES.legitimacy + config.startingLegitimacyBonus,
    },
    colossus: { ...STARTING_COLOSSUS },
    rival: {
      ...STARTING_RIVAL,
      ...rival,
    },
    congress: {
      seatShares: {} as Record<BlocId, number>,
      friendlyMajority: false,
      pendingBill: null,
    },
    laborCohesion: 40,
    centralBankIndependence: 60,
    unionLoyaltyAbove70Streak: 0,
    highPolarizationStreak: 0,
    delayedEffects: [],
    pendingDiscoveries: [],
    activeCrises: [],
    crisisEventQueue: [],
    firedEventIds: [],
    currentEvent: null,
    pendingActions: [],
    newsLog: [],
    ending: null,
    gameOver: false,
  };
}

function getSensitivityMultiplier(
  blocId: BlocId,
  category: string,
  blocs: GameState['blocs']
): number {
  const bloc = blocs[blocId];
  if (category === 'backroom') return 1.0;
  if (category === 'rhetoric') return bloc.sensitivities.narrative / 50;
  // All other policy categories use material sensitivity
  return bloc.sensitivities.material / 50;
}

function applyResourceDeltas(
  resources: ResourceState,
  deltas: Partial<ResourceState>
): void {
  for (const [key, delta] of Object.entries(deltas)) {
    if (delta === undefined) continue;
    const resKey = key as keyof ResourceState;
    const range = RESOURCE_RANGES[resKey as keyof typeof RESOURCE_RANGES];
    if (range) {
      (resources as Record<string, number>)[resKey] = clamp(
        resources[resKey] + delta,
        range.min,
        range.max
      );
    }
  }
}

function applyBlocEffects(
  state: GameState,
  blocEffects: BlocEffectMap,
  sensitivityCategory?: string
): void {
  for (const [blocIdStr, effect] of Object.entries(blocEffects)) {
    const blocId = blocIdStr as BlocId;
    const bloc = state.blocs[blocId];
    if (!bloc || !effect) continue;

    const multiplier = sensitivityCategory
      ? getSensitivityMultiplier(blocId, sensitivityCategory, state.blocs)
      : 1.0;

    if (effect.loyalty) {
      const scaledDelta = Math.round(effect.loyalty * multiplier);
      bloc.loyalty = clamp(bloc.loyalty + scaledDelta, 0, 100);
    }
    if (effect.power) {
      bloc.power = clamp(bloc.power + effect.power, 0, 100);
    }
  }
}

function resolveAction(state: GameState, action: ActionChoice): void {
  const policy = POLICIES.find(p => p.id === action.policyId);
  if (!policy) return;

  // Check requirements
  if (policy.requiresSyndicateLoyalty !== undefined) {
    if (state.blocs.syndicate.loyalty < policy.requiresSyndicateLoyalty) return;
  }
  if (policy.requiresMajority && !state.congress.friendlyMajority) return;

  // Calculate actual capital cost with polarization modifier
  const costMultiplier = getPolarizationCostMultiplier(
    state.resources.polarization,
    policy.centrist
  );
  // Gridlock adds +20% cost
  const gridlockMultiplier = state.rival.gridlockCountdown > 0 ? 1.2 : 1.0;
  // Syndicate discount for backroom deals
  const syndicateDiscount = (
    policy.category === 'backroom' && state.blocs.syndicate.loyalty > 60
  ) ? 0.7 : 1.0;
  // Congressional majority modifier for legislative categories
  const congressMultiplier = getCongressCostMultiplier(
    state.congress.friendlyMajority, policy.category
  );

  const totalCost = Math.round(
    policy.capitalCost * costMultiplier * gridlockMultiplier * syndicateDiscount * congressMultiplier
  );
  if (state.resources.capital < totalCost) return;
  state.resources.capital = clamp(state.resources.capital - totalCost, 0, 999);

  // Check backlash for centrist policies at high polarization
  const backlashChance = getBacklashChance(state.resources.polarization, policy.centrist);
  if (backlashChance > 0 && rollChance(backlashChance)) {
    applyBacklash(state);
  }

  // Evaluate conditional effects BEFORE applying primary effects (Amendment 3)
  // so they see the pre-action state for their condition checks
  let conditional: Partial<typeof policy.effects> | undefined;
  if (policy.conditionalEffects) {
    conditional = policy.conditionalEffects(state);
  }

  // Apply bloc effects with sensitivity multiplier
  const primaryBlocEffects = { ...policy.effects.blocs };

  // Handle target bloc for backroom deals
  if (policy.targetBloc && action.targetBlocId) {
    const targetId = action.targetBlocId as BlocId;
    const loyaltyBonus = policy.id === 'informal_channels' ? 10 : 15;
    primaryBlocEffects[targetId] = {
      ...(primaryBlocEffects[targetId] || {}),
      loyalty: (primaryBlocEffects[targetId]?.loyalty ?? 0) + loyaltyBonus,
    };
  }

  applyBlocEffects(state, primaryBlocEffects, policy.category);

  // Compute and apply ripple effects (no sensitivity multiplier on ripples)
  const ripples = computeRippleEffects(primaryBlocEffects);
  applyBlocEffects(state, ripples);

  // Apply resource effects
  if (policy.effects.resources) {
    applyResourceDeltas(state.resources, policy.effects.resources);
  }

  // Apply labor cohesion: conditional overrides base if present
  if (conditional?.laborCohesion !== undefined) {
    // Conditional replaces base laborCohesion effect
    state.laborCohesion = clamp(
      state.laborCohesion + conditional.laborCohesion, 0, 100
    );
  } else if (policy.effects.laborCohesion) {
    state.laborCohesion = clamp(
      state.laborCohesion + policy.effects.laborCohesion, 0, 100
    );
  }

  // Apply central bank independence
  if (policy.effects.centralBankIndependence) {
    state.centralBankIndependence = clamp(
      state.centralBankIndependence + policy.effects.centralBankIndependence, 0, 100
    );
  }

  // Apply other conditional effects
  if (conditional) {
    if (conditional.blocs) {
      applyBlocEffects(state, conditional.blocs, policy.category);
    }
    if (conditional.resources) {
      applyResourceDeltas(state.resources, conditional.resources);
    }
  }

  // Apply rival power from policy
  if (policy.effects.rivalPower) {
    state.rival.power = clamp(
      state.rival.power + policy.effects.rivalPower, 0, 100
    );
  }

  // Discovery roll for backroom deals
  if (policy.effects.discovery) {
    let discoveryChance = policy.effects.discovery.chance;
    // Syndicate high loyalty reduces discovery chance by 50%
    if (policy.category === 'backroom' && state.blocs.syndicate.loyalty > 60) {
      discoveryChance *= 0.5;
    }
    if (rollChance(discoveryChance)) {
      const delay = policy.effects.discovery.delay ?? 0;
      if (delay > 0) {
        // Queue for delayed exposure
        state.pendingDiscoveries.push({
          turnsLeft: delay,
          effect: policy.effects.discovery,
          sourcePolicyId: policy.id,
        });
      } else {
        // Immediate exposure
        const disc = policy.effects.discovery.effects;
        if (disc.blocs) applyBlocEffects(state, disc.blocs);
        if (disc.resources) applyResourceDeltas(state.resources, disc.resources);
        if (disc.rivalPower) {
          state.rival.power = clamp(state.rival.power + disc.rivalPower, 0, 100);
        }
      }
    }
  }

  // Register delayed effects
  if (policy.effects.delayed) {
    state.delayedEffects.push({
      turnsRemaining: policy.effects.delayed.turns,
      perTurn: { ...policy.effects.delayed.perTurn },
      sourcePolicyId: policy.id,
      ...(policy.effects.delayed.blocEffects && { blocEffects: policy.effects.delayed.blocEffects }),
      ...(policy.effects.delayed.rivalEffect !== undefined && { rivalEffect: policy.effects.delayed.rivalEffect }),
      ...(policy.effects.delayed.cohesionEffect !== undefined && { cohesionEffect: policy.effects.delayed.cohesionEffect }),
    });
  }
}

function processDelayedEffects(state: GameState): void {
  const remaining: ActiveDelayedEffect[] = [];
  for (const effect of state.delayedEffects) {
    applyResourceDeltas(state.resources, effect.perTurn);

    // Apply bloc effects
    if (effect.blocEffects) {
      for (const [blocIdStr, blocEffect] of Object.entries(effect.blocEffects)) {
        const blocId = blocIdStr as BlocId;
        const bloc = state.blocs[blocId];
        if (!bloc || !blocEffect) continue;
        if (blocEffect.loyalty) {
          bloc.loyalty = clamp(bloc.loyalty + blocEffect.loyalty, 0, 100);
        }
        if (blocEffect.power) {
          bloc.power = clamp(bloc.power + blocEffect.power, 0, 100);
        }
      }
    }

    // Apply rival effect
    if (effect.rivalEffect) {
      state.rival.power = clamp(state.rival.power + effect.rivalEffect, 0, 100);
    }

    // Apply cohesion effect
    if (effect.cohesionEffect) {
      state.laborCohesion = clamp(state.laborCohesion + effect.cohesionEffect, 0, 100);
    }

    effect.turnsRemaining--;
    if (effect.turnsRemaining > 0) {
      remaining.push(effect);
    }
  }
  state.delayedEffects = remaining;
}

function checkWinLossConditions(state: GameState): EndingId | null {
  const config = getDifficultyConfig(state.difficulty);
  // Immediate loss conditions
  if (state.resources.legitimacy <= 0) return 'impeached';
  if (state.blocs.military.loyalty < 20 && state.resources.dread > config.coupDreadThreshold) return 'coup';
  if (state.rival.power >= 100) return 'rival_wins';

  // Only check win conditions at end of term
  if (state.turn < state.maxTurns) return null;

  // Secret best ending
  if (
    state.laborCohesion >= 80 &&
    state.rival.power < 30 &&
    state.resources.narrative > 70
  ) return 'new_compact';

  // Specific endings (checked in priority order)
  if (state.rival.power < 20 && state.resources.narrative > 60) return 'a_new_story';
  if (state.rival.power < 20 && state.laborCohesion < 25) return 'managers_victory';
  if (state.blocs.syndicate.loyalty > 80) return 'shadow_republic';
  if (state.resources.colossusAlignment > 85) return 'protectorate';
  if (state.resources.polarization > 80) return 'hollow_republic';

  // Default survival
  if (state.resources.legitimacy > 30) return 'republic_endures';

  return 'impeached';
}

function startNewsPhaseImpl(state: GameState): void {
  state.phase = 'news';

  // Crisis events with choices take priority
  if (state.crisisEventQueue.length > 0) {
    const crisisEventId = state.crisisEventQueue.shift()!;
    const crisisEvent = EVENT_POOL.find(e => e.id === crisisEventId) ?? null;
    state.currentEvent = crisisEvent;
    if (crisisEvent) {
      state.newsLog.push({ turn: state.turn, headline: crisisEvent.name });
    }
    return;
  }

  const newsEvent = selectNewsEvent(state);
  state.currentEvent = newsEvent;

  if (newsEvent) {
    state.newsLog.push({ turn: state.turn, headline: newsEvent.name });
  } else {
    state.newsLog.push({ turn: state.turn, headline: 'A quiet month in Miranda. Suspicious.' });
  }

  // Auto-resolve events without choices immediately
  if (newsEvent && !newsEvent.choices) {
    resolveEvent(state, newsEvent);
    if (newsEvent.oneShot && !state.firedEventIds.includes(newsEvent.id)) {
      state.firedEventIds.push(newsEvent.id);
    }
  }
}

function submitActionsImpl(state: GameState, actions: ActionChoice[]): void {
  const config = getDifficultyConfig(state.difficulty);
  const legitimacyAtTurnStart = state.resources.legitimacy;

  // Action phase
  state.phase = 'action';
  for (const action of actions) {
    resolveAction(state, action);
  }

  // Reaction phase
  state.phase = 'reaction';
  processRivalTurn(state);
  processColossusTurn(state);
  processCentralBankTurn(state);
  processDelayedEffects(state);
  processDiscoveryTick(state);
  processCrisisTick(state);
  const tradeIncome = calculateTradeIncome(state);
  state.resources.capital = clamp(state.resources.capital + tradeIncome, 0, 999);
  state.resources.capital = clamp(state.resources.capital + config.baseCapitalIncome, 0, 999);

  // Congressional phase
  state.phase = 'congressional';
  state.congress.seatShares = calculateSeatShares(state);
  state.congress.friendlyMajority = hasFriendlyMajority(state);

  // Narrative phase
  state.phase = 'narrative';
  applyNarrativePhase(state);

  // End phase
  state.phase = 'end';
  processLaborCohesionTurn(state);

  // Congressional legitimacy effect
  const hasSeats = ALL_BLOC_IDS.some(id => (state.congress.seatShares[id] ?? 0) > 0);
  if (hasSeats) {
    const legitDelta = state.congress.friendlyMajority ? 1 : -1;
    state.resources.legitimacy = clamp(state.resources.legitimacy + legitDelta, 0, 100);
  }

  const endEvent = checkEndPhaseEvents(state);
  if (endEvent) {
    state.newsLog.push({ turn: state.turn, headline: endEvent.name });
    if (!endEvent.choices) {
      resolveEvent(state, endEvent);
    }
  }

  // Legitimacy decay shield: reduce total turn legitimacy losses
  if (config.legitimacyDecayShield > 0) {
    const legitimacyLoss = legitimacyAtTurnStart - state.resources.legitimacy;
    if (legitimacyLoss > 0) {
      const restore = Math.min(legitimacyLoss, config.legitimacyDecayShield);
      state.resources.legitimacy = clamp(state.resources.legitimacy + restore, 0, 100);
    }
  }

  state.colossus.alignment = state.resources.colossusAlignment;

  const ending = checkWinLossConditions(state);
  if (ending) {
    state.ending = ending;
    state.gameOver = true;
    return;
  }

  // Advance to next turn's news phase
  state.turn++;
  startNewsPhaseImpl(state);
}

function processFullTurnImpl(state: GameState, actions: ActionChoice[]): void {
  const config = getDifficultyConfig(state.difficulty);
  const legitimacyAtTurnStart = state.resources.legitimacy;

  // Phase 1: NEWS — check crisis queue first, then normal events
  state.phase = 'news';
  let newsEvent;
  if (state.crisisEventQueue.length > 0) {
    const crisisEventId = state.crisisEventQueue.shift()!;
    newsEvent = EVENT_POOL.find(e => e.id === crisisEventId) ?? null;
  } else {
    newsEvent = selectNewsEvent(state);
  }
  state.currentEvent = newsEvent;

  if (newsEvent) {
    state.newsLog.push({ turn: state.turn, headline: newsEvent.name });
  } else {
    state.newsLog.push({ turn: state.turn, headline: 'A quiet month in Miranda. Suspicious.' });
  }

  // Auto-resolve events without choices for testing
  if (newsEvent) {
    if (!newsEvent.choices) {
      resolveEvent(state, newsEvent);
    } else {
      // For auto-play, pick first choice
      resolveEvent(state, newsEvent, newsEvent.choices[0].id);
    }
    if (newsEvent.oneShot && !state.firedEventIds.includes(newsEvent.id)) {
      state.firedEventIds.push(newsEvent.id);
    }
  }

  // Phase 2: BRIEFING (informational, no state changes)
  state.phase = 'briefing';

  // Phase 3: ACTION
  state.phase = 'action';
  for (const action of actions) {
    resolveAction(state, action);
  }

  // Phase 4: REACTION
  state.phase = 'reaction';
  processRivalTurn(state);
  processColossusTurn(state);
  processCentralBankTurn(state);
  processDelayedEffects(state);
  processDiscoveryTick(state);
  processCrisisTick(state);

  // Drain crisis event queue (auto-resolve with first choice for test harness)
  while (state.crisisEventQueue.length > 0) {
    const queuedId = state.crisisEventQueue.shift()!;
    const queuedEvent = EVENT_POOL.find(e => e.id === queuedId);
    if (queuedEvent) {
      if (queuedEvent.choices) {
        resolveEvent(state, queuedEvent, queuedEvent.choices[0].id);
      } else {
        resolveEvent(state, queuedEvent);
      }
      if (queuedEvent.oneShot && !state.firedEventIds.includes(queuedEvent.id)) {
        state.firedEventIds.push(queuedEvent.id);
      }
    }
  }

  // Trade income
  const tradeIncome = calculateTradeIncome(state);
  state.resources.capital = clamp(state.resources.capital + tradeIncome, 0, 999);

  // Base capital income
  state.resources.capital = clamp(state.resources.capital + config.baseCapitalIncome, 0, 999);

  // Phase 5: CONGRESSIONAL
  state.phase = 'congressional';
  state.congress.seatShares = calculateSeatShares(state);
  state.congress.friendlyMajority = hasFriendlyMajority(state);

  // Phase 6: NARRATIVE
  state.phase = 'narrative';
  applyNarrativePhase(state);

  // Phase 7: END
  state.phase = 'end';
  processLaborCohesionTurn(state);

  // Congressional legitimacy effect
  const hasSeats = ALL_BLOC_IDS.some(id => (state.congress.seatShares[id] ?? 0) > 0);
  if (hasSeats) {
    const legitDelta = state.congress.friendlyMajority ? 1 : -1;
    state.resources.legitimacy = clamp(state.resources.legitimacy + legitDelta, 0, 100);
  }

  // Check end-phase events (loyalty thresholds)
  const endEvent = checkEndPhaseEvents(state);
  if (endEvent) {
    state.newsLog.push({ turn: state.turn, headline: endEvent.name });
    if (!endEvent.choices) {
      resolveEvent(state, endEvent);
    }
  }

  // Legitimacy decay shield: reduce total turn legitimacy losses
  if (config.legitimacyDecayShield > 0) {
    const legitimacyLoss = legitimacyAtTurnStart - state.resources.legitimacy;
    if (legitimacyLoss > 0) {
      const restore = Math.min(legitimacyLoss, config.legitimacyDecayShield);
      state.resources.legitimacy = clamp(state.resources.legitimacy + restore, 0, 100);
    }
  }

  // Sync colossus alignment
  state.colossus.alignment = state.resources.colossusAlignment;

  // Check win/loss
  const ending = checkWinLossConditions(state);
  if (ending) {
    state.ending = ending;
    state.gameOver = true;
    return;
  }

  // Advance turn
  state.turn++;
  state.phase = 'news';
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  initGame: (difficulty: Difficulty = 'standard') => {
    const state = createInitialState(difficulty);
    state.congress.seatShares = calculateSeatShares(state);
    state.congress.friendlyMajority = hasFriendlyMajority(state);
    startNewsPhaseImpl(state);
    set(state);
  },

  processFullTurn: (actions: ActionChoice[]) => {
    const state = deepClone(get()) as GameState;
    processFullTurnImpl(state, actions);
    set(state);
  },

  startNewsPhase: () => {
    const state = deepClone(get()) as GameState;
    startNewsPhaseImpl(state);
    set(state);
  },

  resolveCurrentEvent: (choiceId?: string) => {
    const state = deepClone(get()) as GameState;
    if (state.currentEvent) {
      if (state.currentEvent.choices && choiceId) {
        resolveEvent(state, state.currentEvent, choiceId);
        if (state.currentEvent.oneShot && !state.firedEventIds.includes(state.currentEvent.id)) {
          state.firedEventIds.push(state.currentEvent.id);
        }
      }
      // Auto-resolved events were already resolved in startNewsPhase
    }
    state.currentEvent = null;
    state.phase = 'action';
    set(state);
  },

  submitActions: (actions: ActionChoice[]) => {
    const state = deepClone(get()) as GameState;
    submitActionsImpl(state, actions);
    set(state);
    // Auto-save after turn resolves
    if (!state.gameOver) {
      get().saveGame();
    } else {
      get().deleteSave();
    }
  },

  advancePhase: () => {
    // For future UI: advance one phase at a time
    const phases: TurnPhase[] = [
      'news', 'briefing', 'action', 'reaction', 'congressional', 'narrative', 'end',
    ];
    const currentIdx = phases.indexOf(get().phase);
    if (currentIdx < phases.length - 1) {
      set({ phase: phases[currentIdx + 1] });
    }
  },

  saveGame: () => {
    const { initGame, processFullTurn, advancePhase, getState, startNewsPhase, resolveCurrentEvent, submitActions, saveGame, loadGame, hasSavedGame, deleteSave, ...state } = get();
    // Replace currentEvent with its ID for serialization (condition functions aren't serializable)
    const serializable = {
      ...state,
      currentEvent: state.currentEvent ? state.currentEvent.id : null,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(serializable));
    } catch {
      // localStorage full or unavailable
    }
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      // Rehydrate currentEvent from EVENT_POOL by ID
      const eventId = saved.currentEvent;
      saved.currentEvent = eventId
        ? EVENT_POOL.find(e => e.id === eventId) ?? null
        : null;
      // Migrate old saves
      if (!saved.pendingDiscoveries) saved.pendingDiscoveries = [];
      if (!saved.activeCrises) saved.activeCrises = [];
      if (!saved.difficulty) saved.difficulty = 'standard';
      if (!saved.crisisEventQueue) saved.crisisEventQueue = [];
      if (saved.centralBankIndependence === undefined) saved.centralBankIndependence = 60;
      if (saved.unionLoyaltyAbove70Streak === undefined) saved.unionLoyaltyAbove70Streak = 0;
      if (saved.highPolarizationStreak === undefined) saved.highPolarizationStreak = 0;
      if (saved.congress && saved.congress.friendlyMajority === undefined) saved.congress.friendlyMajority = false;
      set(saved as GameState);
      return true;
    } catch {
      return false;
    }
  },

  hasSavedGame: () => {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  },

  deleteSave: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  },

  getState: () => {
    const { initGame, processFullTurn, advancePhase, getState, startNewsPhase, resolveCurrentEvent, submitActions, saveGame, loadGame, hasSavedGame, deleteSave, ...state } = get();
    return state as GameState;
  },
}));

// Export for testing
export { createInitialState, processFullTurnImpl, checkWinLossConditions, resolveAction };
