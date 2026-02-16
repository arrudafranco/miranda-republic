/**
 * Engine subsystem tests: rival, congress, crisis chains, discovery, delayed effects, CBI.
 * Covers tests 7-8, 12-14, 17-19 from the original harness.
 */
import { describe, it, expect } from 'vitest';
import { createInitialState, processFullTurnImpl, resolveAction } from '../engine/gameState';
import { calculateSeatShares, canPassBill, hasFriendlyMajority, getCongressCostMultiplier } from '../engine/congress';
import { getEffectiveLaborPower } from '../engine/laborCohesion';
import { calculateRivalPowerDelta, generateRivalAction } from '../engine/rival';
import { processDiscoveryTick } from '../engine/discovery';
import { processCrisisTick } from '../engine/crisisChains';
import { ALL_BLOC_IDS } from '../types/blocs';
import type { GameState } from '../types/game';
import { deepClone, seedRng } from '../utils/helpers';

describe('Rival Growth', () => {
  it('has low delta at starting state', () => {
    seedRng(700);
    const state = createInitialState();
    const delta = calculateRivalPowerDelta(state);
    expect(delta).toBeLessThanOrEqual(2);
  });

  it('grows fast under stress', () => {
    const state = createInitialState();
    state.resources.polarization = 60;
    state.resources.legitimacy = 30;
    state.resources.narrative = 25;
    state.laborCohesion = 20;
    const delta = calculateRivalPowerDelta(state);
    expect(delta).toBeGreaterThanOrEqual(5);
    expect(delta).toBeLessThanOrEqual(8);
  });

  it('grows over 10 turns from stressed start', () => {
    seedRng(700);
    const state = createInitialState();
    state.resources.polarization = 50;
    state.resources.legitimacy = 40;
    for (let i = 0; i < 10; i++) {
      if (state.gameOver) break;
      processFullTurnImpl(state, []);
    }
    expect(state.rival.power).toBeGreaterThan(15);
  });
});

describe('Congressional Seat Shares', () => {
  it('calculates valid seat shares that sum to 1', () => {
    const state = createInitialState();
    const shares = calculateSeatShares(state);
    let total = 0;
    for (const id of ALL_BLOC_IDS) {
      expect(shares[id]).toBeGreaterThanOrEqual(0);
      expect(shares[id]).toBeLessThanOrEqual(1);
      total += shares[id];
    }
    expect(Math.abs(total - 1.0)).toBeLessThan(0.001);
  });

  it('gives Banks more seats than Artists', () => {
    const state = createInitialState();
    const shares = calculateSeatShares(state);
    expect(shares.finance).toBeGreaterThan(shares.artists);
  });

  it('gives Underworld fewer seats than Labor', () => {
    const state = createInitialState();
    const shares = calculateSeatShares(state);
    expect(shares.syndicate).toBeLessThan(shares.labor);
  });

  it('passes bills with large coalition', () => {
    const state = createInitialState();
    const shares = calculateSeatShares(state);
    const big: typeof ALL_BLOC_IDS = ['finance', 'military', 'court', 'industry', 'tech', 'agri', 'enforcers'];
    expect(canPassBill(shares, big)).toBe(true);
    expect(canPassBill(shares, ['artists', 'academy'])).toBe(false);
  });
});

describe('Delayed Effects', () => {
  it('applies bloc, rival, and cohesion delayed effects', () => {
    seedRng(1200);
    const state = createInitialState();
    state.delayedEffects.push({
      turnsRemaining: 2,
      perTurn: { capital: +5 },
      sourcePolicyId: 'test_delayed',
      blocEffects: { finance: { loyalty: +3 } },
      rivalEffect: -1,
      cohesionEffect: +2,
    });
    const beforeCapital = state.resources.capital;
    processFullTurnImpl(state, []);
    expect(state.resources.capital).toBeGreaterThan(beforeCapital);
  });
});

describe('Discovery System', () => {
  it('fires after countdown reaches zero', () => {
    seedRng(1300);
    const state = createInitialState();
    state.pendingDiscoveries.push({
      turnsLeft: 2,
      effect: {
        chance: 1.0,
        effects: { resources: { legitimacy: -10 }, rivalPower: +5 },
      },
      sourcePolicyId: 'test_discovery',
    });

    expect(state.pendingDiscoveries.length).toBe(1);
    processDiscoveryTick(state);
    expect(state.pendingDiscoveries.length).toBe(1);
    expect(state.pendingDiscoveries[0].turnsLeft).toBe(1);

    const beforeLegit = state.resources.legitimacy;
    const beforeRival = state.rival.power;
    const fired = processDiscoveryTick(state);
    expect(fired).toBe(true);
    expect(state.pendingDiscoveries.length).toBe(0);
    expect(state.resources.legitimacy).toBe(beforeLegit - 10);
    expect(state.rival.power).toBe(beforeRival + 5);
  });
});

describe('Crisis Chains', () => {
  it('triggers and progresses military restlessness chain', () => {
    seedRng(1400);
    const state = createInitialState();
    state.blocs.military.loyalty = 20;

    expect(state.activeCrises.length).toBe(0);
    expect(state.crisisEventQueue.length).toBe(0);

    processCrisisTick(state);
    expect(state.activeCrises.length).toBe(1);
    expect(state.activeCrises[0].chainId).toBe('military_restlessness');
    expect(state.activeCrises[0].stageIndex).toBe(0);
    expect(state.crisisEventQueue.length).toBe(1);
    expect(state.crisisEventQueue[0]).toBe('crisis_barracks_rumors');

    processCrisisTick(state);
    expect(state.activeCrises[0].stageIndex).toBe(1);
    expect(state.crisisEventQueue.length).toBe(2);

    processCrisisTick(state);
    expect(state.activeCrises[0].stageIndex).toBe(2);
    expect(state.crisisEventQueue.length).toBe(3);

    processCrisisTick(state);
    expect(state.activeCrises.length).toBe(0);
    expect(state.crisisEventQueue.length).toBe(3);
  });
});

describe('Central Bank Independence', () => {
  it('affects finance loyalty based on CBI level', () => {
    seedRng(1700);
    const stateHigh = createInitialState();
    stateHigh.centralBankIndependence = 80;
    const beforeHigh = stateHigh.blocs.finance.loyalty;
    processFullTurnImpl(stateHigh, []);
    const deltaHigh = stateHigh.blocs.finance.loyalty - beforeHigh;

    seedRng(1701);
    const stateLow = createInitialState();
    stateLow.centralBankIndependence = 20;
    const beforeLow = stateLow.blocs.finance.loyalty;
    processFullTurnImpl(stateLow, []);
    const deltaLow = stateLow.blocs.finance.loyalty - beforeLow;

    expect(deltaHigh).toBeGreaterThanOrEqual(0);
    expect(deltaLow).toBeLessThan(deltaHigh);
  });

  it('changes CBI value from policy actions', () => {
    seedRng(1702);
    const state = createInitialState();
    expect(state.centralBankIndependence).toBe(60);

    resolveAction(state, { policyId: 'central_bank_autonomy' });
    expect(state.centralBankIndependence).toBe(75);

    resolveAction(state, { policyId: 'monetary_sovereignty_decree' });
    expect(state.centralBankIndependence).toBe(55);

    state.resources.polarization = 25;
    resolveAction(state, { policyId: 'interest_rate_override' });
    expect(state.centralBankIndependence).toBe(45);
  });
});

describe('Congressional Mechanics', () => {
  it('detects friendly majority from starting loyalties', () => {
    seedRng(1800);
    const state = createInitialState();
    state.congress.seatShares = calculateSeatShares(state);
    expect(hasFriendlyMajority(state)).toBe(true);
  });

  it('loses majority when all loyalties tanked', () => {
    const state = createInitialState();
    for (const id of ALL_BLOC_IDS) state.blocs[id].loyalty = 20;
    state.congress.seatShares = calculateSeatShares(state);
    expect(hasFriendlyMajority(state)).toBe(false);
  });

  it('returns correct cost multipliers', () => {
    expect(getCongressCostMultiplier(true, 'economic')).toBe(0.85);
    expect(getCongressCostMultiplier(false, 'economic')).toBe(1.15);
    expect(getCongressCostMultiplier(true, 'backroom')).toBe(1.0);
    expect(getCongressCostMultiplier(false, 'rhetoric')).toBe(1.0);
    expect(getCongressCostMultiplier(false, 'security')).toBe(1.15);
    expect(getCongressCostMultiplier(true, 'labor')).toBe(0.85);
  });

  it('applies cost modifier in resolveAction', () => {
    seedRng(1801);
    const stateWith = createInitialState();
    stateWith.congress.seatShares = calculateSeatShares(stateWith);
    stateWith.congress.friendlyMajority = true;
    stateWith.resources.capital = 500;
    stateWith.resources.polarization = 20;
    resolveAction(stateWith, { policyId: 'austerity_budget' });
    const beforeWith = stateWith.resources.capital;
    resolveAction(stateWith, { policyId: 'anti_money_laundering' });
    const spentWith = beforeWith - stateWith.resources.capital;

    seedRng(1801);
    const stateWithout = createInitialState();
    stateWithout.congress.seatShares = calculateSeatShares(stateWithout);
    stateWithout.congress.friendlyMajority = false;
    stateWithout.resources.capital = 500;
    stateWithout.resources.polarization = 20;
    resolveAction(stateWithout, { policyId: 'austerity_budget' });
    const beforeWithout = stateWithout.resources.capital;
    resolveAction(stateWithout, { policyId: 'anti_money_laundering' });
    const spentWithout = beforeWithout - stateWithout.resources.capital;

    expect(spentWith).toBe(13);
    expect(spentWithout).toBe(17);
  });

  it('blocks requiresMajority policies without majority', () => {
    seedRng(1802);
    const state = createInitialState();
    state.congress.seatShares = calculateSeatShares(state);
    state.congress.friendlyMajority = false;
    state.resources.capital = 500;
    const before = state.resources.capital;
    resolveAction(state, { policyId: 'constitutional_amendment' });
    expect(state.resources.capital).toBe(before);

    state.congress.friendlyMajority = true;
    resolveAction(state, { policyId: 'constitutional_amendment' });
    expect(state.resources.capital).toBeLessThan(before);
  });

  it('drains legitimacy without majority', () => {
    seedRng(1803);
    const state = createInitialState();
    for (const id of ALL_BLOC_IDS) state.blocs[id].loyalty = 20;
    const before = state.resources.legitimacy;
    processFullTurnImpl(state, []);
    expect(state.resources.legitimacy).toBeLessThan(before);
  });

  it('increases rival delta without majority', () => {
    seedRng(1804);
    const state = createInitialState();
    state.congress.seatShares = calculateSeatShares(state);
    state.congress.friendlyMajority = true;
    const deltaWith = calculateRivalPowerDelta(state);
    state.congress.friendlyMajority = false;
    const deltaWithout = calculateRivalPowerDelta(state);
    expect(deltaWithout).toBeGreaterThan(deltaWith);
  });
});

describe('Rival Action System', () => {
  const backgrounds = ['congressional_leader', 'regional_governor', 'retired_general', 'media_personality'] as const;

  it('generates actions for all backgrounds', () => {
    for (const bg of backgrounds) {
      seedRng(1900);
      const state = createInitialState();
      state.rival.background = bg;
      state.rival.power = 20;
      const action = generateRivalAction(state);
      expect(action).toBeTruthy();
      expect(action.length).toBeGreaterThan(0);
    }
  });

  it('produces valid text for different power tiers', () => {
    seedRng(1901);
    const low = createInitialState();
    low.rival.background = 'media_personality';
    low.rival.power = 10;
    const lowAction = generateRivalAction(low);

    seedRng(1901);
    const high = createInitialState();
    high.rival.background = 'media_personality';
    high.rival.power = 80;
    const highAction = generateRivalAction(high);

    expect(lowAction.length).toBeGreaterThan(0);
    expect(highAction.length).toBeGreaterThan(0);
  });

  it('targets weakness when legitimacy is low', () => {
    const keywords = ['confidence', 'legitimacy', 'accountability', 'audit', 'broken promises', 'failed'];
    let hits = 0;
    for (let seed = 0; seed < 50; seed++) {
      seedRng(seed + 2000);
      const state = createInitialState();
      state.rival.background = 'congressional_leader';
      state.rival.power = 50;
      state.resources.legitimacy = 25;
      const text = generateRivalAction(state).toLowerCase();
      if (keywords.some(kw => text.includes(kw))) hits++;
    }
    expect(hits).toBeGreaterThanOrEqual(5);
  });

  it('tracks powerDelta and lastAction after turn', () => {
    seedRng(1902);
    const state = createInitialState();
    processFullTurnImpl(state, []);
    expect(state.rival.powerDelta).toBeDefined();
    expect(typeof state.rival.powerDelta).toBe('number');
    expect(isNaN(state.rival.powerDelta!)).toBe(false);
    expect(typeof state.rival.lastAction).toBe('string');
    expect(state.rival.lastAction.length).toBeGreaterThan(0);
  });

  it('is deterministic with same seed', () => {
    seedRng(1903);
    const a = createInitialState();
    a.rival.background = 'retired_general';
    a.rival.power = 45;
    const actionA = generateRivalAction(a);

    seedRng(1903);
    const b = createInitialState();
    b.rival.background = 'retired_general';
    b.rival.power = 45;
    const actionB = generateRivalAction(b);

    expect(actionA).toBe(actionB);
  });
});
