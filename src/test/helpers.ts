/**
 * Shared test utilities for vitest engine tests.
 * Provides invariant checking and fuzz simulation helpers.
 */
import { createInitialState, processFullTurnImpl } from '../engine/gameState';
import { POLICIES } from '../data/policies';
import { ALL_BLOC_IDS } from '../types/blocs';
import type { GameState, Difficulty } from '../types/game';
import type { ActionChoice } from '../types/actions';
import { seedRng, randomChoice } from '../utils/helpers';

/** Check all state invariants hold. Returns list of violations. */
export function checkInvariants(state: GameState): string[] {
  const violations: string[] = [];

  function check(condition: boolean, msg: string) {
    if (!condition) violations.push(msg);
  }

  // Resource ranges
  check(!isNaN(state.resources.legitimacy) && state.resources.legitimacy >= 0 && state.resources.legitimacy <= 100,
    `legitimacy out of range: ${state.resources.legitimacy}`);
  check(!isNaN(state.resources.narrative) && state.resources.narrative >= 0 && state.resources.narrative <= 100,
    `narrative out of range: ${state.resources.narrative}`);
  check(!isNaN(state.resources.capital) && state.resources.capital >= 0 && state.resources.capital <= 999,
    `capital out of range: ${state.resources.capital}`);
  check(!isNaN(state.resources.mobilization) && state.resources.mobilization >= 0 && state.resources.mobilization <= 100,
    `mobilization out of range: ${state.resources.mobilization}`);
  check(!isNaN(state.resources.polarization) && state.resources.polarization >= 0 && state.resources.polarization <= 100,
    `polarization out of range: ${state.resources.polarization}`);
  check(!isNaN(state.resources.inflation) && state.resources.inflation >= 0 && state.resources.inflation <= 30,
    `inflation out of range: ${state.resources.inflation}`);
  check(!isNaN(state.resources.dread) && state.resources.dread >= 0 && state.resources.dread <= 100,
    `dread out of range: ${state.resources.dread}`);

  // Bloc ranges
  for (const id of ALL_BLOC_IDS) {
    const b = state.blocs[id];
    check(!isNaN(b.loyalty) && b.loyalty >= 0 && b.loyalty <= 100,
      `${id} loyalty out of range: ${b.loyalty}`);
    check(!isNaN(b.power) && b.power >= 0 && b.power <= 100,
      `${id} power out of range: ${b.power}`);
  }

  // Turn range
  check(state.turn >= 1 && state.turn <= state.maxTurns + 1,
    `turn out of range: ${state.turn}`);

  // Congressional state
  check(typeof state.congress.friendlyMajority === 'boolean',
    `friendlyMajority must be boolean, got: ${typeof state.congress.friendlyMajority}`);

  // Game over must have valid ending
  if (state.gameOver) {
    check(state.ending !== null, 'gameOver=true but ending is null');
  }

  return violations;
}

/** Run a full fuzz simulation for a given difficulty, return ending counts */
export function runFuzz(difficulty: Difficulty, seeds: number): {
  endingCounts: Record<string, number>;
  failedSeeds: { seed: number; violations: string[] }[];
  crashedSeeds: { seed: number; error: string }[];
} {
  const failedSeeds: { seed: number; violations: string[] }[] = [];
  const crashedSeeds: { seed: number; error: string }[] = [];
  const endingCounts: Record<string, number> = {};

  for (let seed = 0; seed < seeds; seed++) {
    try {
      seedRng(seed);
      const state = createInitialState(difficulty);

      for (let t = 0; t < 48; t++) {
        if (state.gameOver) break;

        const available = POLICIES.filter(p =>
          state.resources.polarization >= p.minPolarization &&
          state.resources.polarization <= p.maxPolarization &&
          state.resources.capital >= p.capitalCost
        );
        const actions: ActionChoice[] = [];
        if (available.length > 0) {
          const pick1 = randomChoice(available);
          const a1: ActionChoice = { policyId: pick1.id };
          if (pick1.targetBloc) {
            a1.targetBlocId = randomChoice(ALL_BLOC_IDS as unknown as string[]) as ActionChoice['targetBlocId'];
          }
          actions.push(a1);

          const rest = available.filter(p => p.id !== pick1.id);
          if (rest.length > 0) {
            const pick2 = randomChoice(rest);
            const a2: ActionChoice = { policyId: pick2.id };
            if (pick2.targetBloc) {
              a2.targetBlocId = randomChoice(ALL_BLOC_IDS as unknown as string[]) as ActionChoice['targetBlocId'];
            }
            actions.push(a2);
          }
        }

        processFullTurnImpl(state, actions);
        const violations = checkInvariants(state);
        if (violations.length > 0) {
          failedSeeds.push({ seed, violations });
          break;
        }
      }

      const ending = state.ending ?? 'no_ending';
      endingCounts[ending] = (endingCounts[ending] ?? 0) + 1;
    } catch (err) {
      crashedSeeds.push({ seed, error: String(err) });
    }
  }

  return { endingCounts, failedSeeds, crashedSeeds };
}
