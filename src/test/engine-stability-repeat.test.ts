/**
 * v1.8: instability at extreme inflation and polarization, and policy repeat rules
 * (one time only, cooldown, any time).
 */
import { describe, it, expect } from 'vitest';
import { createInitialState, resolveAction } from '../engine/gameState';
import { processInstabilityTurn, isSiegePolitics } from '../engine/instability';
import {
  getRepeatBlock,
  getPolicyRepeatRule,
  canEnactAgain,
  describeRepeatRule,
  describeRepeatBlock,
} from '../engine/policyRepeat';
import { POLICY_REPEAT_RULES } from '../data/policyRepeat';
import { POLICIES } from '../data/policies';
import type { GameState } from '../types/game';
import { seedRng } from '../utils/helpers';

function calmState(): GameState {
  seedRng(1800);
  const s = createInitialState();
  s.resources.inflation = 8;
  s.resources.polarization = 40;
  s.resources.legitimacy = 60;
  s.resources.dread = 20;
  s.resources.capital = 500;
  s.resources.mobilization = 40;
  s.resources.narrative = 45;
  s.turn = 2;
  return s;
}

describe('Instability at the extremes', () => {
  it('does nothing in ordinary conditions', () => {
    const s = calmState();
    const before = JSON.stringify(s);
    expect(processInstabilityTurn(s)).toEqual([]);
    expect(JSON.stringify(s)).toBe(before);
  });

  it('high inflation grows Underworld power every other turn', () => {
    const s = calmState();
    s.resources.inflation = 16;
    const power = s.blocs.syndicate.power;
    s.turn = 3;
    expect(processInstabilityTurn(s)).toEqual(['price_crime']);
    expect(s.blocs.syndicate.power).toBe(power);
    s.turn = 4;
    processInstabilityTurn(s);
    expect(s.blocs.syndicate.power).toBe(power + 1);
    expect(s.resources.legitimacy).toBe(60);
  });

  it('extreme inflation drains legitimacy and grows crime every turn', () => {
    const s = calmState();
    s.resources.inflation = 22;
    const power = s.blocs.syndicate.power;
    s.turn = 3;
    expect(processInstabilityTurn(s)).toEqual(['price_collapse']);
    expect(s.resources.legitimacy).toBe(59);
    expect(s.blocs.syndicate.power).toBe(power + 1);
  });

  it('extreme polarization drains legitimacy, raises dread and unsettles the Generals', () => {
    const s = calmState();
    s.resources.polarization = 80;
    const loyalty = s.blocs.military.loyalty;
    expect(processInstabilityTurn(s)).toEqual(['fracture']);
    expect(s.resources.legitimacy).toBe(59);
    expect(s.resources.dread).toBe(21);
    expect(s.blocs.military.loyalty).toBe(loyalty - 1);
  });

  it('a ruler with an energized base and a dominant story keeps legitimacy under extreme polarization', () => {
    const s = calmState();
    s.resources.polarization = 85;
    s.resources.mobilization = 65;
    s.resources.narrative = 60;
    const loyalty = s.blocs.military.loyalty;
    expect(isSiegePolitics(s)).toBe(true);
    expect(processInstabilityTurn(s)).toEqual(['siege_politics']);
    expect(s.resources.legitimacy).toBe(60);
    expect(s.blocs.military.loyalty).toBe(loyalty);
    // The price is a regime that leans on fear
    expect(s.resources.dread).toBe(21);
  });

  it('siege politics needs both mobilization and narrative', () => {
    const s = calmState();
    s.resources.polarization = 85;
    s.resources.mobilization = 65;
    s.resources.narrative = 50;
    expect(processInstabilityTurn(s)).toEqual(['fracture']);
    expect(s.resources.legitimacy).toBe(59);
  });

  it('both extremes stack and move the state toward impeachment and coup', () => {
    const s = calmState();
    s.resources.inflation = 25;
    s.resources.polarization = 90;
    for (let i = 0; i < 10; i++) processInstabilityTurn(s);
    expect(s.resources.legitimacy).toBe(40);
    expect(s.resources.dread).toBe(30);
  });

  it('respects resource bounds', () => {
    const s = calmState();
    s.resources.inflation = 30;
    s.resources.polarization = 100;
    s.resources.legitimacy = 0;
    s.resources.dread = 100;
    s.blocs.military.loyalty = 0;
    s.blocs.syndicate.power = 100;
    processInstabilityTurn(s);
    expect(s.resources.legitimacy).toBe(0);
    expect(s.resources.dread).toBe(100);
    expect(s.blocs.military.loyalty).toBe(0);
    expect(s.blocs.syndicate.power).toBe(100);
  });
});

describe('Policy repeat rules', () => {
  it('every rule refers to a real policy', () => {
    const ids = new Set(POLICIES.map(p => p.id));
    for (const id of Object.keys(POLICY_REPEAT_RULES)) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it('covers all three kinds', () => {
    const rules = POLICIES.map(p => getPolicyRepeatRule(p.id));
    expect(rules.filter(r => r === 'once').length).toBeGreaterThanOrEqual(10);
    expect(rules.filter(r => typeof r === 'number').length).toBeGreaterThanOrEqual(20);
    expect(rules.filter(r => r === null).length).toBeGreaterThanOrEqual(8);
  });

  it('cooldowns are positive whole numbers', () => {
    for (const [id, rule] of Object.entries(POLICY_REPEAT_RULES)) {
      if (rule === 'once') continue;
      expect(Number.isInteger(rule) && rule > 0, id).toBe(true);
    }
  });

  it('a one-time policy can be enacted once and never again', () => {
    const s = calmState();
    s.congress.friendlyMajority = true;
    expect(canEnactAgain(s, 'electoral_reform')).toBe(true);
    resolveAction(s, { policyId: 'electoral_reform' });
    expect(s.policyLastEnacted.electoral_reform).toBe(2);
    const capital = s.resources.capital;
    const polarization = s.resources.polarization;
    s.turn = 40;
    expect(getRepeatBlock('electoral_reform', s.turn, s.policyLastEnacted)).toEqual({ kind: 'once' });
    resolveAction(s, { policyId: 'electoral_reform' });
    expect(s.resources.capital).toBe(capital);
    expect(s.resources.polarization).toBe(polarization);
  });

  it('a cooldown policy is blocked until enough turns pass', () => {
    const s = calmState();
    resolveAction(s, { policyId: 'public_reconciliation_forum' });
    expect(s.resources.polarization).toBe(35);

    s.turn = 4;
    expect(getRepeatBlock('public_reconciliation_forum', s.turn, s.policyLastEnacted)).toEqual({ kind: 'cooldown', turnsLeft: 1 });
    resolveAction(s, { policyId: 'public_reconciliation_forum' });
    expect(s.resources.polarization).toBe(35);

    s.turn = 5;
    expect(canEnactAgain(s, 'public_reconciliation_forum')).toBe(true);
    resolveAction(s, { policyId: 'public_reconciliation_forum' });
    expect(s.resources.polarization).toBe(30);
  });

  it('cannot be enacted twice in the same turn', () => {
    const s = calmState();
    resolveAction(s, { policyId: 'public_reconciliation_forum' });
    resolveAction(s, { policyId: 'public_reconciliation_forum' });
    expect(s.resources.polarization).toBe(35);
  });

  it('an any-time policy is never blocked', () => {
    const s = calmState();
    for (let t = 2; t < 6; t++) {
      s.turn = t;
      const before = s.policiesEnactedCount;
      resolveAction(s, { policyId: 'populist_pivot' });
      expect(s.policiesEnactedCount).toBe(before + 1);
    }
  });

  it('a blocked attempt does not count as an enacted policy', () => {
    const s = calmState();
    resolveAction(s, { policyId: 'public_reconciliation_forum' });
    const count = s.policiesEnactedCount;
    resolveAction(s, { policyId: 'public_reconciliation_forum' });
    expect(s.policiesEnactedCount).toBe(count);
  });

  it('a policy the player could not afford does not start its cooldown', () => {
    const s = calmState();
    s.resources.capital = 0;
    resolveAction(s, { policyId: 'green_industrial_policy' });
    expect(s.policyLastEnacted.green_industrial_policy).toBeUndefined();
  });

  it('tolerates saves without the tracking field', () => {
    expect(getRepeatBlock('electoral_reform', 5, undefined)).toBeNull();
  });

  it('describes rules and blocks without em-dashes or colons', () => {
    const texts = [
      describeRepeatRule('electoral_reform'),
      describeRepeatRule('public_reconciliation_forum'),
      describeRepeatRule('populist_pivot'),
      describeRepeatBlock({ kind: 'once' }),
      describeRepeatBlock({ kind: 'cooldown', turnsLeft: 1 }),
      describeRepeatBlock({ kind: 'cooldown', turnsLeft: 4 }),
    ];
    expect(texts).toEqual([
      'One time only',
      'Repeatable every 3 turns',
      'Repeatable any time',
      'Already enacted',
      'Ready next turn',
      'Ready in 4 turns',
    ]);
    for (const t of texts) expect(t).not.toMatch(/[—:]/);
  });

  it('The Gentlemen\'s Accord costs serious capital', () => {
    const accord = POLICIES.find(p => p.id === 'gentlemens_accord')!;
    const nonMilestone = POLICIES.filter(p => p.unlockCondition?.type !== 'milestone');
    expect(accord.capitalCost).toBe(Math.max(...nonMilestone.map(p => p.capitalCost)));
  });
});
