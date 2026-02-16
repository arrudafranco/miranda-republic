/**
 * Fuzz tests and balance verification.
 * Covers tests 11 and 16 from the original harness.
 * Runs 500 seeds x 3 difficulties = 1,500 full-game simulations.
 */
import { describe, it, expect } from 'vitest';
import type { Difficulty } from '../types/game';
import { runFuzz } from './helpers';

describe('Fuzz Test (500 seeds x 3 difficulties)', () => {
  const difficulties: Difficulty[] = ['story', 'standard', 'crisis'];

  for (const diff of difficulties) {
    it(`[${diff}] has no crashes or invariant violations`, () => {
      const { failedSeeds, crashedSeeds, endingCounts } = runFuzz(diff, 500);

      expect(crashedSeeds.length).toBe(0);
      expect(failedSeeds.length).toBe(0);

      const noEnding = endingCounts['no_ending'] ?? 0;
      expect(noEnding).toBe(0);
    });
  }
});

describe('Balance Verification', () => {
  it('[story] rival_wins < 15%, impeached < 50%', () => {
    const { endingCounts } = runFuzz('story', 500);
    const rivalPct = (endingCounts['rival_wins'] ?? 0) / 500 * 100;
    const impeachedPct = (endingCounts['impeached'] ?? 0) / 500 * 100;
    expect(rivalPct).toBeLessThan(15);
    expect(impeachedPct).toBeLessThan(50);
  });

  it('[standard] rival_wins < 55%, impeached < 80%', () => {
    const { endingCounts } = runFuzz('standard', 500);
    const rivalPct = (endingCounts['rival_wins'] ?? 0) / 500 * 100;
    const impeachedPct = (endingCounts['impeached'] ?? 0) / 500 * 100;
    expect(rivalPct).toBeLessThan(55);
    expect(impeachedPct).toBeLessThan(80);
  });

  it('[crisis] no crashes', () => {
    const { crashedSeeds } = runFuzz('crisis', 500);
    expect(crashedSeeds.length).toBe(0);
  });
});
