import type { GameState } from '../types/game';
import { getDifficultyConfig } from '../types/game';
import type { RivalBackground } from '../types/rival';
import { clamp, randomChoice } from '../utils/helpers';

const RIVAL_NAMES: Record<RivalBackground, string[]> = {
  congressional_leader: ['Senator Vidal', 'Senator Correa', 'Speaker Moreno'],
  regional_governor:    ['Governor Torres', 'Governor Almeida', 'Governor Fuentes'],
  retired_general:      ['General Cardoso', 'General Montoya', 'General Braga'],
  media_personality:    ['Ricardo Vox', 'Diana Cruz', 'Marco Estrella'],
};

const RIVAL_TITLES: Record<RivalBackground, string> = {
  congressional_leader: 'Congressional Leader',
  regional_governor:    'Regional Governor',
  retired_general:      'Retired General',
  media_personality:    'Media Personality',
};

const BACKGROUNDS: RivalBackground[] = [
  'congressional_leader', 'regional_governor', 'retired_general', 'media_personality',
];

export function generateRivalIdentity() {
  const background = randomChoice(BACKGROUNDS);
  const name = randomChoice(RIVAL_NAMES[background]);
  return {
    name,
    title: RIVAL_TITLES[background],
    background,
  };
}

/**
 * Calculate Rival power delta per turn based on game state.
 */
export function calculateRivalPowerDelta(state: GameState): number {
  let delta = 1; // Base growth (discontent is structural)

  // Polarization above 30: +1 per 5 points
  if (state.resources.polarization > 30) {
    delta += Math.floor((state.resources.polarization - 30) / 5);
  }

  // Inflation above 10: +2 per 5 points
  if (state.resources.inflation > 10) {
    delta += Math.floor((state.resources.inflation - 10) / 5) * 2;
  }

  // Low legitimacy
  if (state.resources.legitimacy < 40) {
    delta += 3;
  }

  // Low labor cohesion
  if (state.laborCohesion < 25) {
    delta += 2;
  }

  // Low narrative
  if (state.resources.narrative < 30) {
    delta += 1;
  }

  // High mobilization counters (-1 per 8 above 40)
  if (state.resources.mobilization > 40) {
    delta -= Math.floor((state.resources.mobilization - 40) / 8);
  }

  // High narrative counters (-2 if >50)
  if (state.resources.narrative > 50) {
    delta -= 2;
  }

  // High labor cohesion counters (-1 per 8 above 40)
  if (state.laborCohesion > 40) {
    delta -= Math.floor((state.laborCohesion - 40) / 8);
  }

  // High legitimacy counters (-2 if >70)
  if (state.resources.legitimacy > 70) {
    delta -= 2;
  }

  // Cap total growth at +8 per turn
  const capped = Math.min(delta, 8);

  // Apply difficulty multiplier after cap
  const config = getDifficultyConfig(state.difficulty);
  return Math.round(capped * config.rivalGrowthMultiplier);
}

/**
 * Check rival thresholds and return event IDs that should fire.
 */
export function checkRivalThresholds(state: GameState): number[] {
  const thresholds = [30, 50, 60, 70, 85, 95];
  const newThresholds: number[] = [];

  for (const threshold of thresholds) {
    if (
      state.rival.power >= threshold &&
      !state.rival.thresholdsFired.includes(threshold)
    ) {
      newThresholds.push(threshold);
    }
  }

  return newThresholds;
}

/**
 * Apply rival power delta and update state.
 */
export function processRivalTurn(state: GameState): void {
  const delta = calculateRivalPowerDelta(state);
  state.rival.power = clamp(state.rival.power + delta, 0, 100);

  // Track newly crossed thresholds
  const newThresholds = checkRivalThresholds(state);
  state.rival.thresholdsFired.push(...newThresholds);

  // Decrement countdowns
  if (state.rival.gridlockCountdown > 0) {
    state.rival.gridlockCountdown--;
  }
  if (state.rival.cultureWarCountdown > 0) {
    state.rival.cultureWarCountdown--;
    // Culture war: clergy and mainStreet loyalty check
    if (state.blocs.clergy.loyalty < 50) {
      state.blocs.clergy.loyalty = clamp(state.blocs.clergy.loyalty - 5, 0, 100);
    }
    if (state.blocs.mainStreet.loyalty < 50) {
      state.blocs.mainStreet.loyalty = clamp(state.blocs.mainStreet.loyalty - 5, 0, 100);
    }
  }

  // Activate countdowns from newly fired thresholds
  if (newThresholds.includes(50)) {
    state.rival.gridlockCountdown = 4;
  }
  if (newThresholds.includes(60)) {
    state.rival.cultureWarCountdown = 4;
  }
}
