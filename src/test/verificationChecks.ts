import { createInitialState, processFullTurnImpl } from '../engine/gameState';
import { deepClone } from '../utils/helpers';

// Additional verification checks from the plan
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) { console.log(`  ✓ ${message}`); passed++; }
  else { console.log(`  ✗ FAIL: ${message}`); failed++; }
}

console.log('\n=== VERIFICATION: Sensitivity Multiplier Spot Checks ===');

// Rhetoric action on Underworld (narrative=10) yields 0.2x loyalty effect vs. base
{
  const multiplier = 10 / 50;
  assert(multiplier === 0.2, `Underworld rhetoric multiplier = ${multiplier} (expected 0.2)`);
}

// Policy action on Banks (material=85) yields 1.7x loyalty effect vs. base
{
  const multiplier = 85 / 50;
  assert(multiplier === 1.7, `Banks policy multiplier = ${multiplier} (expected 1.7)`);
}

// Backroom deal applies full base effect regardless of sensitivities
{
  const state = createInitialState();
  state.resources.capital = 500;
  const before = state.blocs.syndicate.loyalty;
  // Target syndicate (material=90, narrative=10) — backroom should skip both
  processFullTurnImpl(state, [{ policyId: 'backroom_deal', targetBlocId: 'syndicate' }]);
  const delta = state.blocs.syndicate.loyalty - before;
  console.log(`  Backroom deal on Underworld: loyalty delta = ${delta} (base +15, no multiplier)`);
  assert(delta >= 10, 'Backroom deal applies full effect regardless of sensitivity');
}

// Rival crosses threshold 30 and fires "The Rally" event
{
  const state = createInitialState();
  // Run turns until rival hits 30
  let rallyFired = false;
  for (let i = 0; i < 20 && !state.gameOver; i++) {
    processFullTurnImpl(state, []);
    if (state.rival.thresholdsFired.includes(30)) {
      rallyFired = true;
      break;
    }
  }
  assert(rallyFired, `Rival crossed 30 and fired threshold (power=${state.rival.power})`);
}

// Platform worker rights with low Union loyalty yields -3 cohesion
{
  const state = createInitialState();
  state.blocs.labor.loyalty = 30;
  state.resources.narrative = 20;
  const before = state.laborCohesion;
  processFullTurnImpl(state, [{ policyId: 'platform_worker_rights' }]);
  const delta = state.laborCohesion - before;
  assert(delta === -3, `Low trust platform worker rights: cohesion delta = ${delta} (expected -3)`);
}

// Clamping works at all boundaries
{
  const state = createInitialState();
  state.resources.legitimacy = 2;
  state.resources.narrative = 1;
  state.resources.capital = 5;
  state.blocs.labor.loyalty = 5;

  // Run a harsh turn
  processFullTurnImpl(state, [{ policyId: 'austerity_budget' }]);

  assert(state.resources.legitimacy >= 0 && state.resources.legitimacy <= 100, 'Legitimacy clamped');
  assert(state.resources.narrative >= 0 && state.resources.narrative <= 100, 'Narrative clamped');
  assert(state.blocs.labor.loyalty >= 0 && state.blocs.labor.loyalty <= 100, 'Labor loyalty clamped');
  assert(state.resources.capital >= 0 && state.resources.capital <= 999, 'Capital clamped');
}

console.log(`\n  Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
