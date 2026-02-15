import { createInitialState, processFullTurnImpl, checkWinLossConditions, resolveAction } from '../engine/gameState';
import { calculateSeatShares, canPassBill, hasFriendlyMajority, getCongressCostMultiplier } from '../engine/congress';
import { getEffectiveLaborPower } from '../engine/laborCohesion';
import { getPolarizationCostMultiplier, getBacklashChance } from '../engine/polarization';
import { calculateRivalPowerDelta } from '../engine/rival';
import { processDiscoveryTick } from '../engine/discovery';
import { processCrisisTick } from '../engine/crisisChains';
import { BLOC_DEFINITIONS } from '../data/blocs';
import { POLICIES } from '../data/policies';
import { ALL_BLOC_IDS } from '../types/blocs';
import type { GameState, Difficulty } from '../types/game';
import { getDifficultyConfig } from '../types/game';
import type { ActionChoice } from '../types/actions';
import { deepClone, seedRng, randomChoice } from '../utils/helpers';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertRange(value: number, min: number, max: number, label: string): void {
  assert(
    value >= min && value <= max && !isNaN(value),
    `${label} = ${value} (expected ${min}-${max})`
  );
}

/** Check all state invariants hold. Returns list of violations. */
function checkInvariants(state: GameState): string[] {
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
  check(!isNaN(state.resources.colossusAlignment) && state.resources.colossusAlignment >= 0 && state.resources.colossusAlignment <= 100,
    `colossusAlignment out of range: ${state.resources.colossusAlignment}`);

  // Hidden state ranges
  check(!isNaN(state.laborCohesion) && state.laborCohesion >= 0 && state.laborCohesion <= 100,
    `laborCohesion out of range: ${state.laborCohesion}`);
  check(!isNaN(state.centralBankIndependence) && state.centralBankIndependence >= 0 && state.centralBankIndependence <= 100,
    `centralBankIndependence out of range: ${state.centralBankIndependence}`);
  check(!isNaN(state.rival.power) && state.rival.power >= 0 && state.rival.power <= 100,
    `rival.power out of range: ${state.rival.power}`);
  check(!isNaN(state.colossus.alignment) && state.colossus.alignment >= 0 && state.colossus.alignment <= 100,
    `colossus.alignment out of range: ${state.colossus.alignment}`);
  check(!isNaN(state.colossus.patience) && state.colossus.patience >= 0 && state.colossus.patience <= 100,
    `colossus.patience out of range: ${state.colossus.patience}`);

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
function runFuzz(difficulty: Difficulty, seeds: number): { endingCounts: Record<string, number>; failedSeeds: { seed: number; violations: string[] }[]; crashedSeeds: { seed: number; error: string }[] } {
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
      }

      const violations = checkInvariants(state);
      if (violations.length > 0) {
        failedSeeds.push({ seed, violations });
      }

      const ending = state.ending ?? 'no_ending';
      endingCounts[ending] = (endingCounts[ending] ?? 0) + 1;
    } catch (err) {
      crashedSeeds.push({ seed, error: String(err) });
    }
  }

  return { endingCounts, failedSeeds, crashedSeeds };
}

// ============================
// TEST 1: Game Init
// ============================
function test1_GameInit(): void {
  console.log('\n=== TEST 1: Game Initialization ===');
  const state = createInitialState();

  assert(state.turn === 1, 'Turn starts at 1');
  assert(state.maxTurns === 48, 'Max turns = 48');
  assert(state.difficulty === 'standard', 'Default difficulty is standard');
  assert(state.resources.legitimacy === 65, 'Starting legitimacy = 65 (standard)');
  assert(state.resources.capital === 200, 'Starting capital = 200 (standard)');
  assert(state.resources.polarization === 25, 'Starting polarization = 25');
  assert(state.laborCohesion === 40, 'Starting labor cohesion = 40');
  assert(state.rival.power === 15, 'Rival starts at power 15');
  assert(state.gameOver === false, 'Game not over');
  assert(Array.isArray(state.crisisEventQueue), 'crisisEventQueue initialized');
  assert(state.crisisEventQueue.length === 0, 'crisisEventQueue starts empty');

  // Difficulty configs
  const storyState = createInitialState('story');
  assert(storyState.difficulty === 'story', 'Story difficulty set');
  assert(storyState.resources.capital === 280, 'Story starting capital = 280 (+80)');
  assert(storyState.resources.legitimacy === 85, 'Story starting legitimacy = 85 (+20)');

  const crisisState = createInitialState('crisis');
  assert(crisisState.difficulty === 'crisis', 'Crisis difficulty set');
  assert(crisisState.resources.capital === 170, 'Crisis starting capital = 170 (-30)');
  assert(crisisState.resources.legitimacy === 55, 'Crisis starting legitimacy = 55 (-10)');

  // Amendment 2: Underworld name
  assert(BLOC_DEFINITIONS.syndicate.name === 'The Underworld', 'Syndicate displays as "The Underworld"');

  // Amendment 4: Dual sensitivities
  assert(state.blocs.finance.sensitivities.material === 85, 'Banks material sensitivity = 85');
  assert(state.blocs.finance.sensitivities.narrative === 35, 'Banks narrative sensitivity = 35');
  assert(state.blocs.syndicate.sensitivities.material === 90, 'Underworld material sensitivity = 90');
  assert(state.blocs.syndicate.sensitivities.narrative === 10, 'Underworld narrative sensitivity = 10');
  assert(state.blocs.mainStreet.sensitivities.narrative === 65, 'Main Street narrative sensitivity = 65');

  // All blocs present
  for (const id of ALL_BLOC_IDS) {
    assert(state.blocs[id] !== undefined, `Bloc ${id} exists`);
  }
}

// ============================
// TEST 2: Single Turn (Austerity + Clean Sweep)
// ============================
function test2_SingleTurn(): void {
  console.log('\n=== TEST 2: Single Turn — Austerity + Clean Sweep ===');
  seedRng(200);
  const state = createInitialState();
  const before = deepClone(state);

  const actions: ActionChoice[] = [
    { policyId: 'austerity_budget' },
    { policyId: 'operation_clean_sweep' },
  ];

  processFullTurnImpl(state, actions);

  const financeLoyaltyDelta = state.blocs.finance.loyalty - before.blocs.finance.loyalty;
  console.log(`  Finance loyalty delta: ${financeLoyaltyDelta} (expected ~26 from austerity, plus clean sweep effects and other turn effects)`);
  assert(financeLoyaltyDelta > 0, 'Finance loyalty increased from austerity');

  const laborLoyaltyDelta = state.blocs.labor.loyalty - before.blocs.labor.loyalty;
  console.log(`  Labor loyalty delta: ${laborLoyaltyDelta}`);
  assert(laborLoyaltyDelta < 0, 'Labor loyalty decreased from austerity (net)');

  assert(state.resources.capital > before.resources.capital - 30, 'Capital changed from both policies');

  assert(state.turn === 2, 'Turn advanced to 2');
}

// ============================
// TEST 3: Rhetoric Action (Scapegoat Campaign)
// ============================
function test3_RhetoricSensitivity(): void {
  console.log('\n=== TEST 3: Rhetoric Sensitivity ===');
  seedRng(300);
  const state = createInitialState();
  // Set polarization high enough for scapegoat
  state.resources.polarization = 45;

  const before = deepClone(state);
  const actions: ActionChoice[] = [{ policyId: 'scapegoat_campaign' }];
  processFullTurnImpl(state, actions);

  const mainStreetDelta = state.blocs.mainStreet.loyalty - before.blocs.mainStreet.loyalty;
  console.log(`  Main Street loyalty delta: ${mainStreetDelta} (rhetoric, narrative=65, base +10)`);
  assert(mainStreetDelta > 10, 'Main Street boosted by narrative sensitivity > 1.0');

  const syndicateDelta = state.blocs.syndicate.loyalty - before.blocs.syndicate.loyalty;
  console.log(`  Underworld loyalty delta: ${syndicateDelta} (rhetoric sensitivity 10 = 0.2x)`);

  const artistsDelta = state.blocs.artists.loyalty - before.blocs.artists.loyalty;
  console.log(`  Artists loyalty delta: ${artistsDelta} (rhetoric, narrative=70, base -15)`);
  assert(artistsDelta < -15, 'Artists more affected due to high narrative sensitivity');
}

// ============================
// TEST 4: Platform Worker Rights Conditional Effects (ISOLATED)
// Uses resolveAction directly to avoid random event/turn noise
// ============================
function test4_ConditionalEffects(): void {
  console.log('\n=== TEST 4: Platform Worker Rights — Conditional Effects (isolated) ===');
  seedRng(400);

  // Case A: High union loyalty + high narrative → conditional returns +8 cohesion
  const stateA = createInitialState();
  stateA.blocs.labor.loyalty = 70;
  stateA.resources.narrative = 60;
  const beforeCohesionA = stateA.laborCohesion;
  resolveAction(stateA, { policyId: 'platform_worker_rights' });
  const cohesionDeltaA = stateA.laborCohesion - beforeCohesionA;
  console.log(`  Case A (high trust): cohesion delta = ${cohesionDeltaA} (expected +8)`);
  assert(cohesionDeltaA === 8, 'High trust → +8 cohesion (conditional override)');

  // Case B: Medium union loyalty → conditional returns +3 cohesion
  const stateB = createInitialState();
  stateB.blocs.labor.loyalty = 50;
  stateB.resources.narrative = 40;
  const beforeCohesionB = stateB.laborCohesion;
  resolveAction(stateB, { policyId: 'platform_worker_rights' });
  const cohesionDeltaB = stateB.laborCohesion - beforeCohesionB;
  console.log(`  Case B (medium trust): cohesion delta = ${cohesionDeltaB} (expected +3)`);
  assert(cohesionDeltaB === 3, 'Medium trust → +3 cohesion (conditional override)');

  // Case C: Low union loyalty → conditional returns -3 cohesion
  const stateC = createInitialState();
  stateC.blocs.labor.loyalty = 30;
  stateC.resources.narrative = 20;
  const beforeCohesionC = stateC.laborCohesion;
  resolveAction(stateC, { policyId: 'platform_worker_rights' });
  const cohesionDeltaC = stateC.laborCohesion - beforeCohesionC;
  console.log(`  Case C (low trust): cohesion delta = ${cohesionDeltaC} (expected -3)`);
  assert(cohesionDeltaC === -3, 'Low trust → -3 cohesion (conditional override)');
}

// ============================
// TEST 5: Centrist Policy at High Polarization (ISOLATED)
// Pure function tests + resolveAction for integration
// ============================
function test5_PolarizationCost(): void {
  console.log('\n=== TEST 5: Centrist Polarization Cost (isolated) ===');

  // Cost multiplier checks (pure functions, no randomness)
  assert(getPolarizationCostMultiplier(20, true) === 1.0, 'Low polarization: 1.0x cost');
  assert(getPolarizationCostMultiplier(45, true) === 1.25, 'Medium polarization: 1.25x cost');
  assert(getPolarizationCostMultiplier(70, true) === 1.5, 'High polarization: 1.5x cost');
  assert(getPolarizationCostMultiplier(85, true) === 2.0, 'Very high polarization: 2.0x cost');

  // Backlash chances (pure functions)
  assert(getBacklashChance(20, true) === 0, 'Low polarization: no backlash');
  assert(getBacklashChance(70, true) === 0.2, 'High polarization: 20% backlash');
  assert(getBacklashChance(85, true) === 0.4, 'Very high polarization: 40% backlash');

  // Non-centrist at high polarization gets discount
  assert(getPolarizationCostMultiplier(70, false) === 0.75, 'Extreme at high polarization: 0.75x cost');
  assert(getBacklashChance(70, false) === 0, 'Extreme: no backlash');

  // Integration test using resolveAction directly (avoids event/turn noise)
  // Sovereignty Trade Package: base cost 20, centrist=true, diplomatic (legislative)
  // Initial state has no majority → 1.15x congress multiplier
  seedRng(500); // seed to control backlash rolls
  const stateA = createInitialState();
  stateA.resources.polarization = 20; // Low: polarization 1.0x, congress 1.15x → cost = 23
  stateA.resources.capital = 500;
  resolveAction(stateA, { policyId: 'sovereignty_trade_package' });
  const spentA = 500 - stateA.resources.capital;

  seedRng(500); // same seed for fair comparison
  const stateB = createInitialState();
  stateB.resources.polarization = 70; // High: polarization 1.5x, congress 1.15x → cost = 35
  stateB.resources.capital = 500;
  resolveAction(stateB, { policyId: 'sovereignty_trade_package' });
  const spentB = 500 - stateB.resources.capital;

  console.log(`  Low polarization capital spent: ${spentA} (expected 23), High: ${spentB} (expected 35)`);
  assert(spentA === 23, 'Low polarization: cost is 20 * 1.0 * 1.15 = 23');
  assert(spentB === 35, 'High polarization: cost is 20 * 1.5 * 1.15 = 35');
}

// ============================
// TEST 6: Backroom Deal — No Sensitivity Multiplier
// ============================
function test6_BackroomDeal(): void {
  console.log('\n=== TEST 6: Backroom Deal — No Sensitivity ===');
  seedRng(600);
  const state = createInitialState();
  state.resources.capital = 500;

  const beforeMilitary = state.blocs.military.loyalty;
  const actions: ActionChoice[] = [
    { policyId: 'backroom_deal', targetBlocId: 'military' },
  ];

  processFullTurnImpl(state, actions);

  const militaryDelta = state.blocs.military.loyalty - beforeMilitary;
  console.log(`  Military loyalty delta: ${militaryDelta} (backroom +15, no sensitivity scaling)`);
  assert(militaryDelta >= 10, 'Backroom deal applied loyalty boost to target');
  assert(state.resources.legitimacy < 65, 'Legitimacy dropped from backroom deal');
}

// ============================
// TEST 7: 10-Turn Auto-Run — Rival Growth
// ============================
function test7_RivalGrowth(): void {
  console.log('\n=== TEST 7: Rival Growth (balanced) ===');
  seedRng(700);

  // Test 7a: At starting state, rival delta is low due to counters
  const fresh = createInitialState();
  const baseDelta = calculateRivalPowerDelta(fresh);
  console.log(`  Starting state rival delta: ${baseDelta}`);
  assert(baseDelta <= 2, `Rival delta at start is controlled (${baseDelta})`);

  // Test 7b: Under stress (high polarization, low legitimacy), rival grows fast
  const stressed = createInitialState();
  stressed.resources.polarization = 60;
  stressed.resources.legitimacy = 30;
  stressed.resources.narrative = 25;
  stressed.laborCohesion = 20;
  const stressDelta = calculateRivalPowerDelta(stressed);
  console.log(`  Stressed state rival delta: ${stressDelta}`);
  assert(stressDelta >= 5, `Rival grows strongly under stress (${stressDelta})`);
  assert(stressDelta <= 8, `Rival growth capped at 8 (${stressDelta})`);

  // Test 7c: 10-turn simulation with policies shows growth
  const state = createInitialState();
  state.resources.polarization = 50; // Start stressed
  state.resources.legitimacy = 40;
  const powerHistory: number[] = [state.rival.power];
  for (let i = 0; i < 10; i++) {
    if (state.gameOver) break;
    processFullTurnImpl(state, []);
    powerHistory.push(state.rival.power);
  }
  console.log(`  Rival power curve (stressed start): ${powerHistory.join(' → ')}`);
  assert(state.rival.power > 15, 'Rival power grew from starting 15 (stressed start)');
}

// ============================
// TEST 8: Congressional Seat Shares
// ============================
function test8_Congress(): void {
  console.log('\n=== TEST 8: Congressional Seat Shares ===');
  const state = createInitialState();
  const shares = calculateSeatShares(state);

  let total = 0;
  for (const id of ALL_BLOC_IDS) {
    total += shares[id];
    assert(shares[id] >= 0 && shares[id] <= 1, `${id} share: ${(shares[id] * 100).toFixed(1)}%`);
  }

  assert(Math.abs(total - 1.0) < 0.001, `Total seat share = ${total.toFixed(4)} (should be ~1.0)`);

  assert(shares.finance > shares.artists, 'Banks have more seats than Artists');

  const laborEffPower = getEffectiveLaborPower(45, 40);
  const syndicateEffPower = 40 * 0.3;
  assert(shares.syndicate < shares.labor, 'Underworld has fewer seats than Labor (0.3x multiplier)');
  console.log(`  Syndicate effective power: ${syndicateEffPower}, Labor effective: ${laborEffPower}`);

  const bigCoalition: typeof ALL_BLOC_IDS = ['finance', 'military', 'court', 'industry', 'tech', 'agri', 'enforcers'];
  assert(canPassBill(shares, bigCoalition), 'Large coalition can pass bills');
  assert(!canPassBill(shares, ['artists', 'academy']), 'Small coalition cannot pass bills');
}

// ============================
// TEST 9: Win Condition Detection
// ============================
function test9_WinConditions(): void {
  console.log('\n=== TEST 9: Win Condition Detection ===');

  const s1 = createInitialState();
  s1.resources.legitimacy = 0;
  assert(checkWinLossConditions(s1) === 'impeached', 'Legitimacy 0 → impeached');

  // Standard difficulty: coup at dread > 70
  const s2 = createInitialState();
  s2.blocs.military.loyalty = 15;
  s2.resources.dread = 75;
  assert(checkWinLossConditions(s2) === 'coup', 'Standard: Military < 20 + Dread > 70 → coup');

  // Story difficulty: coup threshold is 85
  const s2story = createInitialState('story');
  s2story.blocs.military.loyalty = 15;
  s2story.resources.dread = 80;
  assert(checkWinLossConditions(s2story) === null, 'Story: Dread 80 does NOT trigger coup (threshold 85)');
  s2story.resources.dread = 90;
  s2story.turn = 1; // ensure not at maxTurns
  assert(checkWinLossConditions(s2story) === 'coup', 'Story: Dread 90 triggers coup');

  // Crisis difficulty: coup threshold is 60
  const s2crisis = createInitialState('crisis');
  s2crisis.blocs.military.loyalty = 15;
  s2crisis.resources.dread = 65;
  assert(checkWinLossConditions(s2crisis) === 'coup', 'Crisis: Dread 65 triggers coup (threshold 60)');

  const s3 = createInitialState();
  s3.rival.power = 100;
  assert(checkWinLossConditions(s3) === 'rival_wins', 'Rival power 100 → rival wins');

  const s4 = createInitialState();
  s4.turn = 48;
  s4.laborCohesion = 85;
  s4.rival.power = 20;
  s4.resources.narrative = 75;
  assert(checkWinLossConditions(s4) === 'new_compact', 'Secret best ending: New Compact');

  const s5 = createInitialState();
  s5.turn = 48;
  s5.resources.legitimacy = 50;
  assert(checkWinLossConditions(s5) === 'republic_endures', 'Default survival: Republic Endures');

  const s6 = createInitialState();
  s6.turn = 20;
  assert(checkWinLossConditions(s6) === null, 'Mid-game: no ending yet');
}

// ============================
// TEST 10: Full 48-Turn Simulation (seeded)
// ============================
function test10_FullSimulation(): void {
  console.log('\n=== TEST 10: Full 48-Turn Simulation ===');
  seedRng(1000);
  const state = createInitialState();

  let turnsRun = 0;
  for (let i = 0; i < 48; i++) {
    if (state.gameOver) break;

    const actions: ActionChoice[] = [];
    const available = POLICIES.filter(p =>
      state.resources.polarization >= p.minPolarization &&
      state.resources.polarization <= p.maxPolarization &&
      state.resources.capital >= p.capitalCost
    );
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
    turnsRun++;
  }

  console.log(`  Turns run: ${turnsRun}`);
  console.log(`  Game over: ${state.gameOver}, Ending: ${state.ending}`);
  console.log(`  Final state: Turn=${state.turn}, Legitimacy=${state.resources.legitimacy}, Rival=${state.rival.power}`);
  console.log(`  Narrative=${state.resources.narrative}, Polarization=${state.resources.polarization}`);
  console.log(`  Capital=${state.resources.capital}, Inflation=${state.resources.inflation}`);
  console.log(`  Labor Cohesion=${state.laborCohesion}, Dread=${state.resources.dread}`);

  assert(state.gameOver, 'Game terminated');
  assert(state.ending !== null, `Valid ending: ${state.ending}`);

  const violations = checkInvariants(state);
  assert(violations.length === 0, 'All state values in valid range');
  for (const v of violations) {
    console.log(`    ✗ ${v}`);
  }
}

// ============================
// TEST 11: Fuzz Test — 500 seeds per difficulty, invariants only
// ============================
function test11_Fuzz(): void {
  console.log('\n=== TEST 11: Fuzz Test — 500 seeds x 3 difficulties ===');

  const difficulties: Difficulty[] = ['story', 'standard', 'crisis'];
  for (const diff of difficulties) {
    const { endingCounts, failedSeeds, crashedSeeds } = runFuzz(diff, 500);

    assert(crashedSeeds.length === 0, `[${diff}] No crashes across 500 seeds`);
    if (crashedSeeds.length > 0) {
      for (const c of crashedSeeds.slice(0, 3)) {
        console.log(`    Seed ${c.seed} crashed: ${c.error}`);
      }
    }

    assert(failedSeeds.length === 0, `[${diff}] No invariant violations across 500 seeds`);
    if (failedSeeds.length > 0) {
      for (const f of failedSeeds.slice(0, 3)) {
        console.log(`    Seed ${f.seed}: ${f.violations.join(', ')}`);
      }
    }

    const noEnding = endingCounts['no_ending'] ?? 0;
    assert(noEnding === 0, `[${diff}] All 500 games reached an ending`);

    console.log(`  [${diff}] Ending distribution:`);
    const sorted = Object.entries(endingCounts).sort((a, b) => b[1] - a[1]);
    for (const [ending, count] of sorted) {
      const pct = ((count / 500) * 100).toFixed(1);
      console.log(`    ${ending}: ${count} (${pct}%)`);
    }
  }
}

// ============================
// TEST 12: Delayed Effect Resolution (bloc/rival/cohesion)
// ============================
function test12_DelayedEffects(): void {
  console.log('\n=== TEST 12: Extended Delayed Effects ===');
  seedRng(1200);
  const state = createInitialState();

  // Manually add a delayed effect with bloc/rival/cohesion effects
  state.delayedEffects.push({
    turnsRemaining: 2,
    perTurn: { capital: +5 },
    sourcePolicyId: 'test_delayed',
    blocEffects: { finance: { loyalty: +3 } },
    rivalEffect: -1,
    cohesionEffect: +2,
  });

  const beforeFinance = state.blocs.finance.loyalty;
  const beforeRival = state.rival.power;
  const beforeCohesion = state.laborCohesion;
  const beforeCapital = state.resources.capital;

  // Simulate one turn to trigger delayed effects
  processFullTurnImpl(state, []);

  // Check that delayed effects applied
  assert(state.resources.capital > beforeCapital, 'Delayed capital effect applied');
  console.log(`  Finance loyalty: ${beforeFinance} → ${state.blocs.finance.loyalty}`);
  console.log(`  Rival power: ${beforeRival} → ${state.rival.power}`);
  console.log(`  Cohesion: ${beforeCohesion} → ${state.laborCohesion}`);
}

// ============================
// TEST 13: Pending Discovery System
// ============================
function test13_PendingDiscovery(): void {
  console.log('\n=== TEST 13: Pending Discovery System ===');
  seedRng(1300);
  const state = createInitialState();

  // Add a pending discovery that fires in 2 turns
  state.pendingDiscoveries.push({
    turnsLeft: 2,
    effect: {
      chance: 1.0,
      effects: {
        resources: { legitimacy: -10 },
        rivalPower: +5,
      },
    },
    sourcePolicyId: 'test_discovery',
  });

  assert(state.pendingDiscoveries.length === 1, 'One pending discovery queued');

  // After 1 tick, should still be pending
  processDiscoveryTick(state);
  assert(state.pendingDiscoveries.length === 1, 'Still pending after 1 tick');
  assert(state.pendingDiscoveries[0].turnsLeft === 1, 'TurnsLeft decremented to 1');

  // After 2nd tick, should fire
  const beforeLegitimacy = state.resources.legitimacy;
  const beforeRival = state.rival.power;
  const fired = processDiscoveryTick(state);
  assert(fired, 'Discovery fired');
  assert(state.pendingDiscoveries.length === 0, 'No more pending discoveries');
  assert(state.resources.legitimacy === beforeLegitimacy - 10, 'Legitimacy hit from discovery');
  assert(state.rival.power === beforeRival + 5, 'Rival power gained from discovery');
}

// ============================
// TEST 14: Crisis Chain System + Queue Behavior
// ============================
function test14_CrisisChains(): void {
  console.log('\n=== TEST 14: Crisis Chain System + Queue ===');
  seedRng(1400);
  const state = createInitialState();

  // Trigger military restlessness chain by setting military loyalty low
  state.blocs.military.loyalty = 20;
  assert(state.activeCrises.length === 0, 'No active crises initially');
  assert(state.crisisEventQueue.length === 0, 'Crisis event queue starts empty');

  // First tick: triggers chain, stage 0 event has choices, so it gets queued
  processCrisisTick(state);
  assert(state.activeCrises.length === 1, 'One crisis chain triggered');
  assert(state.activeCrises[0].chainId === 'military_restlessness', 'Military restlessness chain active');
  assert(state.activeCrises[0].stageIndex === 0, 'At stage 0');
  // crisis_barracks_rumors has choices, so it should be queued
  assert(state.crisisEventQueue.length === 1, 'Stage 0 event with choices queued');
  assert(state.crisisEventQueue[0] === 'crisis_barracks_rumors', 'Correct event queued');

  // Second tick: advances to stage 1 (crisis_officers_ultimatum, has choices)
  processCrisisTick(state);
  assert(state.activeCrises[0].stageIndex === 1, 'Advanced to stage 1');
  assert(state.crisisEventQueue.length === 2, 'Stage 1 event also queued');

  // Third tick: advances to stage 2 (crisis_loyalty_oath, has choices)
  processCrisisTick(state);
  assert(state.activeCrises[0].stageIndex === 2, 'Advanced to stage 2');
  assert(state.crisisEventQueue.length === 3, 'Stage 2 event also queued');

  // Fourth tick: chain completes
  processCrisisTick(state);
  assert(state.activeCrises.length === 0, 'Chain completed and removed');

  // Queue still has 3 events waiting for player
  assert(state.crisisEventQueue.length === 3, 'Queue retains events for player');
}

// ============================
// TEST 15: New Policy Validation
// ============================
function test15_PolicyValidation(): void {
  console.log('\n=== TEST 15: New Policy Validation ===');

  const policyIds = new Set<string>();
  for (const policy of POLICIES) {
    // No duplicate IDs
    assert(!policyIds.has(policy.id), `Unique policy ID: ${policy.id}`);
    policyIds.add(policy.id);

    // Cost is non-negative
    assert(policy.capitalCost >= 0, `${policy.id} has valid cost (${policy.capitalCost})`);

    // Polarization range is valid
    assert(policy.minPolarization <= policy.maxPolarization, `${policy.id} has valid polarization range`);
  }

  console.log(`  Total policies: ${POLICIES.length}`);
  assert(POLICIES.length >= 40, `At least 40 policies (have ${POLICIES.length})`);

  // Check that new counter policies exist
  const counterPolicies = ['public_reconciliation_forum', 'price_controls_decree', 'community_policing',
    'counter_propaganda_bureau', 'stimulus_package', 'national_unity_festival'];
  for (const id of counterPolicies) {
    assert(POLICIES.some(p => p.id === id), `Counter policy exists: ${id}`);
  }

  // Check central bank independence policies exist
  const cbiPolicies = ['central_bank_autonomy', 'monetary_sovereignty_decree', 'interest_rate_override'];
  for (const id of cbiPolicies) {
    assert(POLICIES.some(p => p.id === id), `CBI policy exists: ${id}`);
  }
}

// ============================
// TEST 16: Per-Difficulty Balance Verification
// ============================
function test16_BalanceVerification(): void {
  console.log('\n=== TEST 16: Per-Difficulty Balance Verification ===');

  const FUZZ_SEEDS = 500;

  // Story mode
  console.log('  --- Story ---');
  const story = runFuzz('story', FUZZ_SEEDS);
  const storyRival = (story.endingCounts['rival_wins'] ?? 0) / FUZZ_SEEDS * 100;
  const storyImpeached = (story.endingCounts['impeached'] ?? 0) / FUZZ_SEEDS * 100;
  console.log(`  rival_wins: ${storyRival.toFixed(1)}%, impeached: ${storyImpeached.toFixed(1)}%`);
  assert(storyRival < 15, `Story rival_wins < 15% (was ${storyRival.toFixed(1)}%)`);
  assert(storyImpeached < 50, `Story impeached < 50% (was ${storyImpeached.toFixed(1)}%)`);
  console.log('  Ending distribution:');
  for (const [ending, count] of Object.entries(story.endingCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${ending}: ${count} (${((count / FUZZ_SEEDS) * 100).toFixed(1)}%)`);
  }

  // Standard mode
  console.log('  --- Standard ---');
  const standard = runFuzz('standard', FUZZ_SEEDS);
  const stdRival = (standard.endingCounts['rival_wins'] ?? 0) / FUZZ_SEEDS * 100;
  const stdImpeached = (standard.endingCounts['impeached'] ?? 0) / FUZZ_SEEDS * 100;
  console.log(`  rival_wins: ${stdRival.toFixed(1)}%, impeached: ${stdImpeached.toFixed(1)}%`);
  assert(stdRival < 55, `Standard rival_wins < 55% (was ${stdRival.toFixed(1)}%)`);
  assert(stdImpeached < 80, `Standard impeached < 80% (was ${stdImpeached.toFixed(1)}%)`);
  console.log('  Ending distribution:');
  for (const [ending, count] of Object.entries(standard.endingCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${ending}: ${count} (${((count / FUZZ_SEEDS) * 100).toFixed(1)}%)`);
  }

  // Crisis mode — just verify no crashes
  console.log('  --- Crisis ---');
  const crisis = runFuzz('crisis', FUZZ_SEEDS);
  assert(crisis.crashedSeeds.length === 0, `Crisis: no crashes across ${FUZZ_SEEDS} seeds`);
  console.log('  Ending distribution:');
  for (const [ending, count] of Object.entries(crisis.endingCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${ending}: ${count} (${((count / FUZZ_SEEDS) * 100).toFixed(1)}%)`);
  }
}

// ============================
// TEST 17: Central Bank Independence Effects
// ============================
function test17_CentralBankIndependence(): void {
  console.log('\n=== TEST 17: Central Bank Independence Effects ===');
  seedRng(1700);

  // Test: High independence gives finance loyalty boost
  const stateHigh = createInitialState();
  stateHigh.centralBankIndependence = 80;
  const beforeFinanceHigh = stateHigh.blocs.finance.loyalty;
  const beforeLegitHigh = stateHigh.resources.legitimacy;
  // Run one turn with no actions
  processFullTurnImpl(stateHigh, []);
  const financeDeltaHigh = stateHigh.blocs.finance.loyalty - beforeFinanceHigh;
  const legitDeltaHigh = stateHigh.resources.legitimacy - beforeLegitHigh;
  console.log(`  High CBI: finance delta = ${financeDeltaHigh}, legit delta = ${legitDeltaHigh}`);
  // CBI contributes +1 finance, +1 legitimacy (other systems also affect these)
  // Just verify CBI contribution is net positive relative to baseline
  assert(financeDeltaHigh >= 0, 'High CBI: finance loyalty did not drop significantly');

  // Test: Low independence causes finance loyalty drop
  seedRng(1701);
  const stateLow = createInitialState();
  stateLow.centralBankIndependence = 20;
  const beforeFinanceLow = stateLow.blocs.finance.loyalty;
  processFullTurnImpl(stateLow, []);
  const financeDeltaLow = stateLow.blocs.finance.loyalty - beforeFinanceLow;
  console.log(`  Low CBI: finance delta = ${financeDeltaLow}`);
  assert(financeDeltaLow < financeDeltaHigh, 'Low CBI: finance loyalty worse than high CBI');

  // Test: Policy changes CBI value (isolated resolveAction)
  seedRng(1702);
  const statePolicy = createInitialState();
  assert(statePolicy.centralBankIndependence === 60, 'CBI starts at 60');
  resolveAction(statePolicy, { policyId: 'central_bank_autonomy' });
  assert(statePolicy.centralBankIndependence === 75, 'CBI +15 from Autonomy Act → 75');

  resolveAction(statePolicy, { policyId: 'monetary_sovereignty_decree' });
  assert(statePolicy.centralBankIndependence === 55, 'CBI -20 from Sovereignty Decree → 55');

  statePolicy.resources.polarization = 25; // meets minPolarization 20
  resolveAction(statePolicy, { policyId: 'interest_rate_override' });
  assert(statePolicy.centralBankIndependence === 45, 'CBI -10 from Interest Rate Override → 45');
}

// ============================
// TEST 18: Congressional Mechanics
// ============================
function test18_CongressionalMechanics(): void {
  console.log('\n=== TEST 18: Congressional Mechanics ===');
  seedRng(1800);

  // 1. hasFriendlyMajority: at game start most blocs have loyalty >= 50
  const state = createInitialState();
  state.congress.seatShares = calculateSeatShares(state);
  state.congress.friendlyMajority = hasFriendlyMajority(state);
  console.log(`  Initial friendlyMajority: ${state.congress.friendlyMajority}`);
  assert(state.congress.friendlyMajority === true, 'Starting state has friendly majority (most blocs loyal)');

  // 2. Tank loyalties below 50 for all blocs → lose majority
  const tanked = deepClone(state) as GameState;
  for (const id of ALL_BLOC_IDS) {
    tanked.blocs[id].loyalty = 20;
  }
  tanked.congress.seatShares = calculateSeatShares(tanked);
  assert(hasFriendlyMajority(tanked) === false, 'All loyalties tanked → no majority');

  // 3. getCongressCostMultiplier returns correct values
  assert(getCongressCostMultiplier(true, 'economic') === 0.85, 'Majority + legislative = 0.85x');
  assert(getCongressCostMultiplier(false, 'economic') === 1.15, 'No majority + legislative = 1.15x');
  assert(getCongressCostMultiplier(true, 'backroom') === 1.0, 'Majority + backroom = 1.0x (bypass)');
  assert(getCongressCostMultiplier(false, 'rhetoric') === 1.0, 'No majority + rhetoric = 1.0x (bypass)');
  assert(getCongressCostMultiplier(false, 'security') === 1.15, 'No majority + security = 1.15x');
  assert(getCongressCostMultiplier(true, 'labor') === 0.85, 'Majority + labor = 0.85x');

  // 4. Cost modifier applied in resolveAction
  seedRng(1801);
  const stateWith = createInitialState();
  stateWith.congress.seatShares = calculateSeatShares(stateWith);
  stateWith.congress.friendlyMajority = true;
  stateWith.resources.capital = 500;
  stateWith.resources.polarization = 20; // 1.0x polarization multiplier
  resolveAction(stateWith, { policyId: 'austerity_budget' }); // economic, cost 0
  // cost 0 means no difference, use a policy with actual cost
  // anti_money_laundering: institutional, cost 15
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

  console.log(`  With majority spent: ${spentWith} (15*0.85=13), Without: ${spentWithout} (15*1.15=17)`);
  assert(spentWith === 13, 'Majority reduces institutional cost: 15*0.85=13');
  assert(spentWithout === 17, 'No majority increases institutional cost: 15*1.15=17');

  // 5. requiresMajority blocks policy without majority
  seedRng(1802);
  const blocked = createInitialState();
  blocked.congress.seatShares = calculateSeatShares(blocked);
  blocked.congress.friendlyMajority = false;
  blocked.resources.capital = 500;
  const capitalBefore = blocked.resources.capital;
  resolveAction(blocked, { policyId: 'constitutional_amendment' });
  assert(blocked.resources.capital === capitalBefore, 'constitutional_amendment blocked without majority');

  // With majority, it goes through
  blocked.congress.friendlyMajority = true;
  resolveAction(blocked, { policyId: 'constitutional_amendment' });
  assert(blocked.resources.capital < capitalBefore, 'constitutional_amendment allowed with majority');

  // 6. Legitimacy drains without majority over multiple turns
  seedRng(1803);
  const legitState = createInitialState();
  // Tank loyalties to lose majority
  for (const id of ALL_BLOC_IDS) {
    legitState.blocs[id].loyalty = 20;
  }
  const legitBefore = legitState.resources.legitimacy;
  processFullTurnImpl(legitState, []);
  // Legitimacy should have taken at least -1 from congress (plus other sources)
  // We check the congress effect is present by verifying overall trend
  console.log(`  Legitimacy: ${legitBefore} → ${legitState.resources.legitimacy} (no majority, should drain)`);
  assert(legitState.resources.legitimacy < legitBefore, 'Legitimacy drained without majority');

  // 7. Rival delta +1 without majority
  seedRng(1804);
  const rivalState = createInitialState();
  rivalState.congress.seatShares = calculateSeatShares(rivalState);
  rivalState.congress.friendlyMajority = true;
  const deltaWith = calculateRivalPowerDelta(rivalState);
  rivalState.congress.friendlyMajority = false;
  const deltaWithout = calculateRivalPowerDelta(rivalState);
  console.log(`  Rival delta with majority: ${deltaWith}, without: ${deltaWithout}`);
  assert(deltaWithout > deltaWith, 'Rival grows faster without majority');
}

// ============================
// RUN ALL TESTS
// ============================
console.log('╔══════════════════════════════════════════╗');
console.log('║  MIRANDA REPUBLIC — Engine Test Harness  ║');
console.log('╚══════════════════════════════════════════╝');

test1_GameInit();
test2_SingleTurn();
test3_RhetoricSensitivity();
test4_ConditionalEffects();
test5_PolarizationCost();
test6_BackroomDeal();
test7_RivalGrowth();
test8_Congress();
test9_WinConditions();
test10_FullSimulation();
test11_Fuzz();
test12_DelayedEffects();
test13_PendingDiscovery();
test14_CrisisChains();
test15_PolicyValidation();
test16_BalanceVerification();
test17_CentralBankIndependence();
test18_CongressionalMechanics();

// Reset RNG to non-deterministic mode
seedRng();

console.log('\n════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
