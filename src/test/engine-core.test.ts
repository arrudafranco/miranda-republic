/**
 * Core engine tests: initialization, single turn, policy mechanics, win conditions.
 * Covers tests 1-6, 9-10 from the original harness.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, processFullTurnImpl, checkWinLossConditions, resolveAction } from '../engine/gameState';
import { getPolarizationCostMultiplier, getBacklashChance } from '../engine/polarization';
import { BLOC_DEFINITIONS } from '../data/blocs';
import { POLICIES } from '../data/policies';
import { ALL_BLOC_IDS } from '../types/blocs';
import type { ActionChoice } from '../types/actions';
import { deepClone, seedRng, randomChoice } from '../utils/helpers';
import { checkInvariants } from './helpers';

describe('Game Initialization', () => {
  it('creates valid initial state with standard difficulty', () => {
    const state = createInitialState();
    expect(state.turn).toBe(1);
    expect(state.maxTurns).toBe(48);
    expect(state.difficulty).toBe('standard');
    expect(state.resources.legitimacy).toBe(65);
    expect(state.resources.capital).toBe(200);
    expect(state.resources.polarization).toBe(25);
    expect(state.laborCohesion).toBe(40);
    expect(state.rival.power).toBe(15);
    expect(state.gameOver).toBe(false);
    expect(Array.isArray(state.crisisEventQueue)).toBe(true);
    expect(state.crisisEventQueue.length).toBe(0);
  });

  it('applies story difficulty modifiers', () => {
    const state = createInitialState('story');
    expect(state.difficulty).toBe('story');
    expect(state.resources.capital).toBe(280);
    expect(state.resources.legitimacy).toBe(85);
  });

  it('applies crisis difficulty modifiers', () => {
    const state = createInitialState('crisis');
    expect(state.difficulty).toBe('crisis');
    expect(state.resources.capital).toBe(170);
    expect(state.resources.legitimacy).toBe(55);
  });

  it('uses correct bloc names', () => {
    expect(BLOC_DEFINITIONS.syndicate.name).toBe('The Underworld');
  });

  it('has dual sensitivities for all blocs', () => {
    const state = createInitialState();
    expect(state.blocs.finance.sensitivities.material).toBe(85);
    expect(state.blocs.finance.sensitivities.narrative).toBe(35);
    expect(state.blocs.syndicate.sensitivities.material).toBe(90);
    expect(state.blocs.syndicate.sensitivities.narrative).toBe(10);
    expect(state.blocs.mainStreet.sensitivities.narrative).toBe(65);
  });

  it('initializes all 14 blocs', () => {
    const state = createInitialState();
    for (const id of ALL_BLOC_IDS) {
      expect(state.blocs[id]).toBeDefined();
    }
  });
});

describe('Single Turn (Austerity + Clean Sweep)', () => {
  it('applies policy effects correctly', () => {
    seedRng(200);
    const state = createInitialState();
    const before = deepClone(state);
    const actions: ActionChoice[] = [
      { policyId: 'austerity_budget' },
      { policyId: 'operation_clean_sweep' },
    ];
    processFullTurnImpl(state, actions);

    const financeDelta = state.blocs.finance.loyalty - before.blocs.finance.loyalty;
    expect(financeDelta).toBeGreaterThan(0);

    const laborDelta = state.blocs.labor.loyalty - before.blocs.labor.loyalty;
    expect(laborDelta).toBeLessThan(0);

    expect(state.resources.capital).toBeGreaterThan(before.resources.capital - 30);
    expect(state.turn).toBe(2);
  });
});

describe('Rhetoric Sensitivity', () => {
  it('applies narrative sensitivity multipliers', () => {
    seedRng(300);
    const state = createInitialState();
    state.resources.polarization = 45;
    const before = deepClone(state);
    processFullTurnImpl(state, [{ policyId: 'scapegoat_campaign' }]);

    const mainStreetDelta = state.blocs.mainStreet.loyalty - before.blocs.mainStreet.loyalty;
    expect(mainStreetDelta).toBeGreaterThan(10);

    const artistsDelta = state.blocs.artists.loyalty - before.blocs.artists.loyalty;
    expect(artistsDelta).toBeLessThan(-15);
  });
});

describe('Conditional Effects (Platform Worker Rights)', () => {
  it('gives +8 cohesion with high trust', () => {
    seedRng(400);
    const state = createInitialState();
    state.blocs.labor.loyalty = 70;
    state.resources.narrative = 60;
    const before = state.laborCohesion;
    resolveAction(state, { policyId: 'platform_worker_rights' });
    expect(state.laborCohesion - before).toBe(8);
  });

  it('gives +3 cohesion with medium trust', () => {
    seedRng(400);
    const state = createInitialState();
    state.blocs.labor.loyalty = 50;
    state.resources.narrative = 40;
    const before = state.laborCohesion;
    resolveAction(state, { policyId: 'platform_worker_rights' });
    expect(state.laborCohesion - before).toBe(3);
  });

  it('gives -3 cohesion with low trust', () => {
    seedRng(400);
    const state = createInitialState();
    state.blocs.labor.loyalty = 30;
    state.resources.narrative = 20;
    const before = state.laborCohesion;
    resolveAction(state, { policyId: 'platform_worker_rights' });
    expect(state.laborCohesion - before).toBe(-3);
  });
});

describe('Polarization Cost', () => {
  it('calculates correct cost multipliers for centrist policies', () => {
    expect(getPolarizationCostMultiplier(20, true)).toBe(1.0);
    expect(getPolarizationCostMultiplier(45, true)).toBe(1.25);
    expect(getPolarizationCostMultiplier(70, true)).toBe(1.5);
    expect(getPolarizationCostMultiplier(85, true)).toBe(2.0);
  });

  it('calculates correct backlash chances', () => {
    expect(getBacklashChance(20, true)).toBe(0);
    expect(getBacklashChance(70, true)).toBe(0.2);
    expect(getBacklashChance(85, true)).toBe(0.4);
  });

  it('gives discount to extreme policies at high polarization', () => {
    expect(getPolarizationCostMultiplier(70, false)).toBe(0.75);
    expect(getBacklashChance(70, false)).toBe(0);
  });

  it('applies polarization multiplier in resolveAction', () => {
    seedRng(500);
    const stateA = createInitialState();
    stateA.resources.polarization = 20;
    stateA.resources.capital = 500;
    resolveAction(stateA, { policyId: 'sovereignty_trade_package' });
    const spentA = 500 - stateA.resources.capital;

    seedRng(500);
    const stateB = createInitialState();
    stateB.resources.polarization = 70;
    stateB.resources.capital = 500;
    resolveAction(stateB, { policyId: 'sovereignty_trade_package' });
    const spentB = 500 - stateB.resources.capital;

    expect(spentA).toBe(23);
    expect(spentB).toBe(35);
  });
});

describe('Backroom Deal', () => {
  it('applies loyalty without sensitivity scaling', () => {
    seedRng(600);
    const state = createInitialState();
    state.resources.capital = 500;
    const beforeMilitary = state.blocs.military.loyalty;
    processFullTurnImpl(state, [{ policyId: 'backroom_deal', targetBlocId: 'military' }]);

    expect(state.blocs.military.loyalty - beforeMilitary).toBeGreaterThanOrEqual(10);
    expect(state.resources.legitimacy).toBeLessThan(65);
  });
});

describe('Win Conditions', () => {
  it('detects impeachment at legitimacy 0', () => {
    const s = createInitialState();
    s.resources.legitimacy = 0;
    expect(checkWinLossConditions(s)).toBe('impeached');
  });

  it('detects coup on standard difficulty', () => {
    const s = createInitialState();
    s.blocs.military.loyalty = 15;
    s.resources.dread = 75;
    expect(checkWinLossConditions(s)).toBe('coup');
  });

  it('uses correct coup threshold per difficulty', () => {
    const story = createInitialState('story');
    story.blocs.military.loyalty = 15;
    story.resources.dread = 80;
    expect(checkWinLossConditions(story)).toBeNull();
    story.resources.dread = 90;
    story.turn = 1;
    expect(checkWinLossConditions(story)).toBe('coup');

    const crisis = createInitialState('crisis');
    crisis.blocs.military.loyalty = 15;
    crisis.resources.dread = 65;
    expect(checkWinLossConditions(crisis)).toBe('coup');
  });

  it('detects rival victory', () => {
    const s = createInitialState();
    s.rival.power = 100;
    expect(checkWinLossConditions(s)).toBe('rival_wins');
  });

  it('detects New Compact (best ending)', () => {
    const s = createInitialState();
    s.turn = 48;
    s.laborCohesion = 85;
    s.rival.power = 20;
    s.resources.narrative = 75;
    expect(checkWinLossConditions(s)).toBe('new_compact');
  });

  it('detects Republic Endures (default survival)', () => {
    const s = createInitialState();
    s.turn = 48;
    s.resources.legitimacy = 50;
    expect(checkWinLossConditions(s)).toBe('republic_endures');
  });

  it('returns null mid-game', () => {
    const s = createInitialState();
    s.turn = 20;
    expect(checkWinLossConditions(s)).toBeNull();
  });
});

describe('Full 48-Turn Simulation', () => {
  it('completes a full game with valid ending', () => {
    seedRng(1000);
    const state = createInitialState();

    for (let i = 0; i < 48; i++) {
      if (state.gameOver) break;
      const available = POLICIES.filter(p =>
        state.resources.polarization >= p.minPolarization &&
        state.resources.polarization <= p.maxPolarization &&
        state.resources.capital >= p.capitalCost
      );
      const actions: ActionChoice[] = [];
      if (available.length > 0) {
        const pick1 = randomChoice(available);
        const action1: ActionChoice = { policyId: pick1.id };
        if (pick1.targetBloc) action1.targetBlocId = 'military';
        actions.push(action1);
        const remaining = available.filter(p => p.id !== pick1.id);
        if (remaining.length > 0) {
          const pick2 = randomChoice(remaining);
          const action2: ActionChoice = { policyId: pick2.id };
          if (pick2.targetBloc) action2.targetBlocId = 'finance';
          actions.push(action2);
        }
      }
      processFullTurnImpl(state, actions);
    }

    expect(state.gameOver).toBe(true);
    expect(state.ending).not.toBeNull();
    expect(checkInvariants(state)).toEqual([]);
  });
});
