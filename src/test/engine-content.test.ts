/**
 * Content and data validation tests: policies, unlocks, briefing, content expansion.
 * Covers tests 15, 20-22 from the original harness.
 */
import { describe, it, expect } from 'vitest';
import { createInitialState, processFullTurnImpl } from '../engine/gameState';
import { getStartingPolicyIds, isPolicyUnlockMet, processUnlocks } from '../engine/unlocks';
import { generateBriefingItems } from '../engine/briefing';
import { RIVAL_ACTIONS, generateRivalAction } from '../engine/rival';
import { POLICIES } from '../data/policies';
import { ALL_BLOC_IDS } from '../types/blocs';
import type { BlocId } from '../types/blocs';
import { deepClone, seedRng } from '../utils/helpers';

describe('Policy Validation', () => {
  it('has no duplicate policy IDs', () => {
    const ids = new Set<string>();
    for (const p of POLICIES) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
    }
  });

  it('has valid costs and polarization ranges', () => {
    for (const p of POLICIES) {
      expect(p.capitalCost).toBeGreaterThanOrEqual(0);
      expect(p.minPolarization).toBeLessThanOrEqual(p.maxPolarization);
    }
  });

  it('has at least 40 policies', () => {
    expect(POLICIES.length).toBeGreaterThanOrEqual(40);
  });

  it('includes counter and CBI policies', () => {
    const counterIds = ['public_reconciliation_forum', 'price_controls_decree', 'community_policing',
      'counter_propaganda_bureau', 'stimulus_package', 'national_unity_festival'];
    for (const id of counterIds) {
      expect(POLICIES.some(p => p.id === id)).toBe(true);
    }

    const cbiIds = ['central_bank_autonomy', 'monetary_sovereignty_decree', 'interest_rate_override'];
    for (const id of cbiIds) {
      expect(POLICIES.some(p => p.id === id)).toBe(true);
    }
  });
});

describe('Policy Unlock System', () => {
  it('starts with ~18 policies unlocked', () => {
    const startingIds = getStartingPolicyIds();
    expect(startingIds.length).toBeGreaterThanOrEqual(15);
    expect(startingIds.length).toBeLessThanOrEqual(22);
  });

  it('has locked policies not in initial set', () => {
    seedRng(2001);
    const state = createInitialState();
    const locked = POLICIES.filter(p => p.unlockCondition && p.unlockCondition.type !== 'always');
    expect(locked.length).toBeGreaterThan(0);
    for (const p of locked) {
      expect(state.unlockedPolicyIds.includes(p.id)).toBe(false);
    }
  });

  it('unlocks turn-based policies at correct turn', () => {
    const turn4Policy = POLICIES.find(p =>
      p.unlockCondition?.type === 'turn' && p.unlockCondition.turn === 4);
    expect(turn4Policy).toBeDefined();
    if (turn4Policy) {
      const s = createInitialState();
      s.turn = 3;
      expect(isPolicyUnlockMet(turn4Policy, s)).toBe(false);
      s.turn = 4;
      expect(isPolicyUnlockMet(turn4Policy, s)).toBe(true);
    }
  });

  it('unlocks loyalty-based policies', () => {
    const p = POLICIES.find(p => p.id === 'right_to_strike');
    expect(p).toBeDefined();
    if (p) {
      const s = createInitialState();
      s.turn = 99;
      s.blocs.labor.loyalty = 40;
      expect(isPolicyUnlockMet(p, s)).toBe(false);
      s.blocs.labor.loyalty = 55;
      expect(isPolicyUnlockMet(p, s)).toBe(true);
    }
  });

  it('unlocks loyalty-max policies', () => {
    const p = POLICIES.find(p => p.id === 'monetary_sovereignty_decree');
    if (p) {
      const s = createInitialState();
      s.turn = 99;
      s.blocs.finance.loyalty = 50;
      expect(isPolicyUnlockMet(p, s)).toBe(false);
      s.blocs.finance.loyalty = 30;
      expect(isPolicyUnlockMet(p, s)).toBe(true);
    }
  });

  it('supports OR-chain unlocks', () => {
    const p = POLICIES.find(p => p.id === 'black_market_crackdown');
    expect(p).toBeDefined();
    if (p) {
      const s = createInitialState();
      s.turn = 99;
      s.blocs.military.loyalty = 30;
      s.resources.dread = 10;
      expect(isPolicyUnlockMet(p, s)).toBe(false);
      s.blocs.military.loyalty = 50;
      expect(isPolicyUnlockMet(p, s)).toBe(true);
      s.blocs.military.loyalty = 30;
      s.resources.dread = 40;
      expect(isPolicyUnlockMet(p, s)).toBe(true);
    }
  });

  it('tracks newly unlocked IDs and prevents re-unlock', () => {
    seedRng(2002);
    const s = createInitialState();
    s.turn = 4;
    const newly = processUnlocks(s);
    expect(newly.length).toBeGreaterThanOrEqual(3);
    for (const id of newly) {
      expect(s.unlockedPolicyIds.includes(id)).toBe(true);
    }
    expect(processUnlocks(s).length).toBe(0);
  });

  it('has non-empty hints for all locked policies', () => {
    for (const p of POLICIES) {
      if (p.unlockCondition && p.unlockCondition.type !== 'always') {
        expect(p.unlockCondition.hint).toBeTruthy();
        expect(p.unlockCondition.hint!.length).toBeGreaterThan(0);
      }
    }
  });

  it('unlocks most policies with favorable conditions at turn 20', () => {
    seedRng(2003);
    const s = createInitialState();
    for (const blocId of ALL_BLOC_IDS) s.blocs[blocId as BlocId].loyalty = 60;
    s.resources.narrative = 60;
    s.resources.polarization = 50;
    s.resources.dread = 45;
    s.turn = 20;
    processUnlocks(s);
    const stillLocked = POLICIES.filter(p => !s.unlockedPolicyIds.includes(p.id));
    expect(stillLocked.length).toBeLessThanOrEqual(5);
  });
});

describe('Briefing Generation', () => {
  it('returns empty without previousResources', () => {
    seedRng(2101);
    const s = createInitialState();
    s.previousResources = null;
    expect(generateBriefingItems(s).length).toBe(0);
  });

  it('returns at most 3 items', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.rival.lastAction = 'The Rival held a press conference.';
    s.rival.power = 80;
    s.rival.powerDelta = 10;
    s.activeCrises = [{ chainId: 'banking_crisis', stageIndex: 0, turnsAtStage: 0, resolved: false }];
    s.previousResources.legitimacy = s.resources.legitimacy + 20;
    s.resources.inflation = 10;
    s.previousResources.inflation = 5;
    s.resources.narrative = 25;
    s.previousResources.narrative = 35;
    s.resources.polarization = 65;
    s.previousResources.polarization = 55;
    s.resources.dread = 45;
    s.previousResources.dread = 30;
    s.resources.mobilization = 15;
    s.previousResources.mobilization = 25;

    const items = generateBriefingItems(s);
    expect(items.length).toBeLessThanOrEqual(3);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.text.length).toBeGreaterThan(0);
    }
  });

  it('prioritizes rival action', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.rival.lastAction = 'The Rival organized a rally.';
    const items = generateBriefingItems(s);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].type).toBe('rival');
  });

  it('generates crisis briefing items', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.activeCrises = [{ chainId: 'banking_crisis', stageIndex: 0, turnsAtStage: 0, resolved: false }];
    const items = generateBriefingItems(s);
    expect(items.some(i => i.type === 'crisis')).toBe(true);
  });

  it('generates discovery item on large legitimacy drop', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.previousResources.legitimacy = s.resources.legitimacy + 20;
    const items = generateBriefingItems(s);
    expect(items.some(i => i.type === 'discovery')).toBe(true);
  });

  it('generates resource item on inflation threshold crossing', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.resources.inflation = 10;
    s.previousResources.inflation = 8;
    expect(generateBriefingItems(s).some(i => i.type === 'resource')).toBe(true);
  });

  it('injects color vignette on quiet turn', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.rival.lastAction = '';
    const items = generateBriefingItems(s);
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('color');
  });

  it('generates bloc_shift on low loyalty', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.blocs.finance.loyalty = 22;
    expect(generateBriefingItems(s).some(i => i.type === 'bloc_shift')).toBe(true);
  });

  it('generates unlock item for newly unlocked policies', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.newlyUnlockedPolicyIds = ['some_policy'];
    expect(generateBriefingItems(s).some(i => i.type === 'unlock')).toBe(true);
  });

  it('generates item for low Colossus patience', () => {
    const s = createInitialState();
    s.previousResources = deepClone(s.resources);
    s.colossus.patience = 25;
    expect(generateBriefingItems(s).some(i => i.type === 'resource')).toBe(true);
  });

  it('integrates with processFullTurnImpl', () => {
    seedRng(2102);
    const state = createInitialState();
    processFullTurnImpl(state, []);
    expect(state.previousResources).not.toBeNull();
    expect(Array.isArray(state.briefingItems)).toBe(true);
  });
});

describe('Content Expansion', () => {
  const backgrounds = ['congressional_leader', 'regional_governor', 'retired_general', 'media_personality'] as const;

  it('has >= 240 total rival action lines with proper tier counts', () => {
    let total = 0;
    for (const bg of backgrounds) {
      const lines = RIVAL_ACTIONS[bg];
      expect(lines.filter(t => t.tier === 'low').length).toBeGreaterThanOrEqual(15);
      expect(lines.filter(t => t.tier === 'mid').length).toBeGreaterThanOrEqual(20);
      expect(lines.filter(t => t.tier === 'high').length).toBeGreaterThanOrEqual(25);
      total += lines.length;
    }
    expect(total).toBeGreaterThanOrEqual(240);
  });

  it('has weakness lines for each background/tier combo', () => {
    for (const bg of backgrounds) {
      for (const tier of ['low', 'mid', 'high'] as const) {
        const weak = RIVAL_ACTIONS[bg].filter(t => t.tier === tier && t.weakness);
        expect(weak.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('generates non-empty text for all background/power combos', () => {
    for (const bg of backgrounds) {
      for (const power of [10, 50, 80]) {
        seedRng(2200);
        const state = createInitialState();
        state.rival.background = bg;
        state.rival.power = power;
        const action = generateRivalAction(state);
        expect(action.length).toBeGreaterThan(0);
      }
    }
  });

  it('generates color vignettes on quiet turns', () => {
    seedRng(2201);
    const state = createInitialState();
    state.previousResources = deepClone(state.resources);
    state.rival.lastAction = '';
    const items = generateBriefingItems(state);
    const color = items.find(i => i.type === 'color');
    expect(color).toBeDefined();
    expect(color!.text.length).toBeGreaterThan(0);
  });

  it('sets showDayOneBriefing on init', () => {
    expect(createInitialState().showDayOneBriefing).toBe(true);
  });

  it('has no empty briefing texts across 100 seeds', () => {
    let empty = 0;
    for (let seed = 0; seed < 100; seed++) {
      seedRng(seed + 3000);
      const state = createInitialState();
      for (let t = 0; t < 5; t++) {
        if (state.gameOver) break;
        processFullTurnImpl(state, []);
      }
      for (const item of state.briefingItems) {
        if (!item.text || item.text.length === 0) empty++;
      }
    }
    expect(empty).toBe(0);
  });

  it('has no em-dashes or colons in rival action text', () => {
    let violations = 0;
    for (const bg of backgrounds) {
      for (const t of RIVAL_ACTIONS[bg]) {
        if (t.text.includes('—') || t.text.includes(':')) violations++;
      }
    }
    expect(violations).toBe(0);
  });
});
