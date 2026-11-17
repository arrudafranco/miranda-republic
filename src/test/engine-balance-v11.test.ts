/**
 * v1.1 balance patch: slow polarization dynamics, structural inflation pressures,
 * temporary depolarization policies, and external price shock events.
 */
import { describe, it, expect } from 'vitest';
import { createInitialState, resolveAction, processFullTurnImpl } from '../engine/gameState';
import {
  processPolarizationTurn,
  getMobilizedBaseLoyalty,
  getEliteFavourGap,
  CALM_STREAK_REQUIRED,
} from '../engine/polarization';
import { processInflationTurn } from '../engine/inflation';
import { generateBriefingItems } from '../engine/briefing';
import { POLICIES } from '../data/policies';
import { EVENT_POOL } from '../data/events';
import type { GameState } from '../types/game';
import { seedRng } from '../utils/helpers';

/** A state with no slow pressures active: neutral loyalties, mild inflation, modest legitimacy. */
function neutralState(): GameState {
  seedRng(1100);
  const s = createInitialState();
  for (const id of Object.keys(s.blocs) as (keyof typeof s.blocs)[]) s.blocs[id].loyalty = 50;
  s.resources.polarization = 50;
  s.resources.inflation = 8;
  s.resources.legitimacy = 50;
  s.previousResources = { ...s.resources };
  s.turn = 1;
  return s;
}

describe('Polarization cooling', () => {
  it('does nothing in a neutral state', () => {
    const s = neutralState();
    expect(processPolarizationTurn(s)).toEqual([]);
    expect(s.resources.polarization).toBe(50);
  });

  it('cools slowly under a trusted government after consecutive calm turns', () => {
    const s = neutralState();
    s.resources.legitimacy = 70;
    for (let i = 0; i < 6; i++) {
      s.previousResources = { ...s.resources };
      processPolarizationTurn(s);
    }
    // Calm turns 2, 4 and 6 each remove one point
    expect(s.polarizationCalmStreak).toBe(6);
    expect(s.resources.polarization).toBe(47);
    expect(s.polarizationPressures).toContain('cooling');
  });

  it('does not cool on the first calm turn', () => {
    const s = neutralState();
    s.resources.legitimacy = 70;
    processPolarizationTurn(s);
    expect(s.polarizationCalmStreak).toBe(CALM_STREAK_REQUIRED - 1);
    expect(s.resources.polarization).toBe(50);
  });

  it('resets the calm streak when polarization rose this turn', () => {
    const s = neutralState();
    s.resources.legitimacy = 70;
    s.polarizationCalmStreak = 5;
    s.previousResources = { ...s.resources, polarization: 45 };
    processPolarizationTurn(s);
    expect(s.polarizationCalmStreak).toBe(0);
    expect(s.resources.polarization).toBe(50);
  });

  it('does not cool when legitimacy is low', () => {
    const s = neutralState();
    s.resources.legitimacy = 55;
    for (let i = 0; i < 4; i++) processPolarizationTurn(s);
    expect(s.resources.polarization).toBe(50);
  });

  it('accepts lower legitimacy when the cost of living is under control', () => {
    const s = neutralState();
    s.resources.legitimacy = 50;
    s.resources.inflation = 5;
    for (let i = 0; i < 2; i++) processPolarizationTurn(s);
    expect(s.resources.polarization).toBe(49);
  });
});

describe('Polarization heating', () => {
  it('rises every turn when inflation is severe', () => {
    const s = neutralState();
    s.resources.inflation = 15;
    expect(processPolarizationTurn(s)).toEqual(['cost_of_living']);
    expect(s.resources.polarization).toBe(51);
  });

  it('rises when the mobilized base is abandoned', () => {
    const s = neutralState();
    s.blocs.labor.loyalty = 20;
    s.blocs.academy.loyalty = 30;
    s.blocs.artists.loyalty = 30;
    expect(getMobilizedBaseLoyalty(s)).toBeLessThan(30);
    expect(processPolarizationTurn(s)).toContain('abandoned_base');
    expect(s.resources.polarization).toBe(51);
  });

  it('rises every other turn when elites are favoured far above working blocs', () => {
    const s = neutralState();
    s.blocs.finance.loyalty = 85;
    s.blocs.industry.loyalty = 80;
    s.blocs.agri.loyalty = 80;
    s.blocs.labor.loyalty = 45;
    s.blocs.mainStreet.loyalty = 45;
    expect(getEliteFavourGap(s)).toBeGreaterThanOrEqual(30);
    s.turn = 1;
    processPolarizationTurn(s);
    expect(s.resources.polarization).toBe(50);
    s.turn = 2;
    s.previousResources = { ...s.resources };
    processPolarizationTurn(s);
    expect(s.resources.polarization).toBe(51);
    expect(s.polarizationPressures).toContain('two_mirandas');
  });

  it('reports a pressure as an onset only on the turn it starts', () => {
    const s = neutralState();
    s.resources.inflation = 16;
    processPolarizationTurn(s);
    expect(s.polarizationPressureOnsets).toEqual(['cost_of_living']);
    s.previousResources = { ...s.resources };
    processPolarizationTurn(s);
    expect(s.polarizationPressureOnsets).toEqual([]);
    expect(s.polarizationPressures).toEqual(['cost_of_living']);
  });

  it('stays within bounds at the extremes', () => {
    const s = neutralState();
    s.resources.polarization = 100;
    s.resources.inflation = 30;
    processPolarizationTurn(s);
    expect(s.resources.polarization).toBe(100);

    const c = neutralState();
    c.resources.polarization = 0;
    c.resources.legitimacy = 90;
    c.previousResources = { ...c.resources };
    for (let i = 0; i < 4; i++) processPolarizationTurn(c);
    expect(c.resources.polarization).toBe(0);
  });

  it('surfaces a briefing line when a pressure starts', () => {
    const s = neutralState();
    s.previousResources = { ...s.resources };
    s.polarizationPressureOnsets = ['abandoned_base'];
    const { items } = generateBriefingItems(s);
    expect(items.some(i => i.text.includes('Unions') || i.text.includes('base'))).toBe(true);
  });
});

describe('Structural inflation pressures', () => {
  it('imports price rises on a slow clock when trade dependent', () => {
    const s = neutralState();
    s.colossus.tradeDependency = 40;
    s.turn = 11;
    expect(processInflationTurn(s)).toEqual([]);
    s.turn = 12;
    expect(processInflationTurn(s)).toEqual(['imported']);
    expect(s.resources.inflation).toBe(9);
  });

  it('does not import inflation when trade dependency is low', () => {
    const s = neutralState();
    s.colossus.tradeDependency = 20;
    s.turn = 12;
    expect(processInflationTurn(s)).toEqual([]);
    expect(s.resources.inflation).toBe(8);
  });

  it('adds crisis markups only while a crisis is active', () => {
    const s = neutralState();
    s.colossus.tradeDependency = 0;
    s.turn = 3;
    expect(processInflationTurn(s)).toEqual([]);
    s.activeCrises.push({ ...({} as GameState['activeCrises'][number]), chainId: 'banking_crisis' });
    expect(processInflationTurn(s)).toEqual(['crisis_markup']);
    expect(s.resources.inflation).toBe(9);
  });

  it('never exceeds the inflation cap', () => {
    const s = neutralState();
    s.resources.inflation = 30;
    s.turn = 12;
    processInflationTurn(s);
    expect(s.resources.inflation).toBe(30);
  });
});

describe('Temporary depolarization policies', () => {
  const ids = ['gentlemens_accord', 'pulpit_and_plaza', 'bread_first'];

  it('exist, are locked at the start, and have unlock hints', () => {
    const s = createInitialState();
    for (const id of ids) {
      const p = POLICIES.find(x => x.id === id);
      expect(p, id).toBeDefined();
      expect(p!.unlockCondition?.hint.length).toBeGreaterThan(0);
      expect(s.unlockedPolicyIds).not.toContain(id);
      // Not centrist, so they stay affordable when polarization is high
      expect(p!.centrist).toBe(false);
    }
  });

  it('The Gentlemen\'s Accord lowers polarization now and gives most of it back', () => {
    const s = neutralState();
    s.resources.capital = 200;
    s.resources.polarization = 60;
    const narrativeBefore = s.resources.narrative;
    seedRng(7);
    resolveAction(s, { policyId: 'gentlemens_accord' });
    expect(s.resources.polarization).toBe(52);
    const rebound = s.delayedEffects.find(d => d.sourcePolicyId === 'gentlemens_accord');
    expect(rebound).toBeDefined();
    expect(rebound!.turnsRemaining * (rebound!.perTurn.polarization ?? 0)).toBe(6);
    // It costs narrative, and shifts loyalty from workers to owners
    expect(s.resources.narrative).toBeLessThan(narrativeBefore);
    expect(s.blocs.finance.loyalty).toBeGreaterThan(50);
    expect(s.blocs.labor.loyalty).toBeLessThan(50);
  });

  it('The Gentlemen\'s Accord can be exposed, which raises polarization', () => {
    const p = POLICIES.find(x => x.id === 'gentlemens_accord')!;
    expect(p.effects.discovery).toBeDefined();
    expect(p.effects.discovery!.effects.resources!.polarization).toBeGreaterThan(0);
  });

  it('Pulpit and Plaza pleases the Clergy and alienates the cultural base', () => {
    const s = neutralState();
    s.resources.capital = 200;
    resolveAction(s, { policyId: 'pulpit_and_plaza' });
    expect(s.resources.polarization).toBe(45);
    expect(s.blocs.clergy.loyalty).toBeGreaterThan(50);
    expect(s.blocs.artists.loyalty).toBeLessThan(50);
    expect(s.blocs.academy.loyalty).toBeLessThan(50);
    expect(s.delayedEffects.some(d => d.sourcePolicyId === 'pulpit_and_plaza')).toBe(true);
  });

  it('Bread First works when prices are under control and backfires when they are not', () => {
    const low = neutralState();
    low.resources.capital = 200;
    low.resources.inflation = 6;
    resolveAction(low, { policyId: 'bread_first' });
    expect(low.resources.polarization).toBe(45);

    const mid = neutralState();
    mid.resources.capital = 200;
    mid.resources.inflation = 12;
    resolveAction(mid, { policyId: 'bread_first' });
    expect(mid.resources.polarization).toBe(48);

    const high = neutralState();
    high.resources.capital = 200;
    high.resources.inflation = 16;
    const legitBefore = high.resources.legitimacy;
    resolveAction(high, { policyId: 'bread_first' });
    expect(high.resources.polarization).toBe(50);
    expect(high.resources.legitimacy).toBeLessThan(legitBefore);
  });
});

describe('v1.1 events', () => {
  it('external shocks raise inflation whichever choice is made', () => {
    for (const id of ['colossus_foreign_war', 'heat_dome']) {
      const e = EVENT_POOL.find(x => x.id === id);
      expect(e, id).toBeDefined();
      for (const c of e!.choices!) {
        expect(c.effects.resources?.inflation ?? 0, `${id}/${c.id}`).toBeGreaterThan(0);
        expect(c.outcomeText?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('the benefit cliff can move polarization in either direction', () => {
    const e = EVENT_POOL.find(x => x.id === 'benefit_cliff')!;
    const deltas = e.choices!.map(c => c.effects.resources?.polarization ?? 0);
    expect(Math.min(...deltas)).toBeLessThan(0);
    expect(Math.max(...deltas)).toBeGreaterThan(0);
  });

  it('new player-facing copy avoids em-dashes and colons', () => {
    const newEvents = EVENT_POOL.filter(e => ['colossus_foreign_war', 'heat_dome', 'benefit_cliff'].includes(e.id));
    const newPolicies = POLICIES.filter(p => ['gentlemens_accord', 'pulpit_and_plaza', 'bread_first'].includes(p.id));
    const copy = [
      ...newEvents.flatMap(e => [e.name, e.description, ...e.choices!.flatMap(c => [c.label, c.tooltip, c.outcomeText ?? ''])]),
      ...newPolicies.flatMap(p => [p.name, p.tooltip, p.unlockCondition!.hint]),
    ];
    for (const text of copy) {
      expect(text, text).not.toMatch(/[—:]/);
    }
  });
});

describe('v1.1 full-turn integration', () => {
  it('a calm, trusted government sees polarization fall over a year with no actions', () => {
    const s = neutralState();
    seedRng(4242);
    s.resources.legitimacy = 90;
    const start = s.resources.polarization;
    let lowest = start;
    for (let t = 0; t < 12 && !s.gameOver; t++) {
      processFullTurnImpl(s, []);
      lowest = Math.min(lowest, s.resources.polarization);
    }
    expect(lowest).toBeLessThan(start);
  });

  it('tolerates old saves that lack the new fields', () => {
    const s = neutralState();
    const legacy = s as Partial<GameState>;
    delete legacy.polarizationCalmStreak;
    delete legacy.polarizationPressures;
    delete legacy.polarizationPressureOnsets;
    expect(() => processPolarizationTurn(s)).not.toThrow();
    expect(s.polarizationCalmStreak).toBeGreaterThanOrEqual(0);
  });
});
