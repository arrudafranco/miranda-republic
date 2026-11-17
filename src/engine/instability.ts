import type { GameState } from '../types/game';
import { clamp } from '../utils/helpers';

// === Instability at the extremes (v1.8) ===
// Very high inflation and very high polarization do more than help the Rival at the ballot box.
// They erode the government's standing, feed the illicit economy, and unsettle the barracks.
// So does a superpower that has run out of patience.

/** Inflation at or above this level grows the illicit economy (every other turn). */
export const INFLATION_CRIME_THRESHOLD = 15;
/** Inflation at or above this level also drains legitimacy and grows crime every turn. */
export const INFLATION_EXTREME_THRESHOLD = 20;
/** Polarization at or above this level drains legitimacy, raises dread and unsettles the Generals. */
export const POLARIZATION_EXTREME_THRESHOLD = 75;

/** With a base this energized and a story this dominant, division consolidates the ruler instead of eroding them. */
export const SIEGE_MOBILIZATION = 60;
export const SIEGE_NARRATIVE = 55;

/** Colossus patience below this level means active meddling in Miranda's barracks. */
export const COLOSSUS_MEDDLING_PATIENCE = 20;

/** With the public story on your side, standing up to the Colossus reads as patriotism. */
export const PATRIOTIC_RALLY_NARRATIVE = 50;

export type InstabilityEffect =
  | 'price_crime' | 'price_collapse' | 'fracture' | 'siege_politics'
  | 'foreign_meddling' | 'foreign_destabilization'
  | 'collaboration_divide' | 'patriotic_rally';

/** True when the ruler is positioned to profit from an us-against-them climate. */
export function isSiegePolitics(state: GameState): boolean {
  return state.resources.mobilization >= SIEGE_MOBILIZATION && state.resources.narrative >= SIEGE_NARRATIVE;
}

export function processInstabilityTurn(state: GameState): InstabilityEffect[] {
  const res = state.resources;
  const applied: InstabilityEffect[] = [];

  if (res.inflation >= INFLATION_EXTREME_THRESHOLD) {
    // Savings evaporate, shelves empty, and the black market becomes the market
    res.legitimacy = clamp(res.legitimacy - 1, 0, 100);
    state.blocs.syndicate.power = clamp(state.blocs.syndicate.power + 1, 0, 100);
    applied.push('price_collapse');
  } else if (res.inflation >= INFLATION_CRIME_THRESHOLD) {
    if (state.turn % 2 === 0) {
      state.blocs.syndicate.power = clamp(state.blocs.syndicate.power + 1, 0, 100);
    }
    applied.push('price_crime');
  }

  if (res.polarization >= POLARIZATION_EXTREME_THRESHOLD) {
    if (isSiegePolitics(state)) {
      // The ruler owns the story and the streets. Division rallies their side and legitimacy holds,
      // but the regime now runs on fear of the other half.
      res.dread = clamp(res.dread + 1, 0, 100);
      applied.push('siege_politics');
    } else {
      // Half the country stops accepting the other half's government as legitimate
      res.legitimacy = clamp(res.legitimacy - 1, 0, 100);
      res.dread = clamp(res.dread + 1, 0, 100);
      state.blocs.military.loyalty = clamp(state.blocs.military.loyalty - 1, 0, 100);
      applied.push('fracture');
    }
  }

  if (state.colossus.patience < COLOSSUS_MEDDLING_PATIENCE) {
    const destabilizing = state.colossus.patience <= 0;
    const rally = res.narrative >= PATRIOTIC_RALLY_NARRATIVE;
    const slowTick = state.turn % 2 === 0;

    // Officers trained abroad start taking calls from the embassy
    state.blocs.military.loyalty = clamp(state.blocs.military.loyalty - 1, 0, 100);

    if (destabilizing) {
      // Open destabilization: the opposition is funded and the government painted as a pariah.
      // A government that owns the story holds its standing. One that does not, bleeds.
      state.rival.power = clamp(state.rival.power + 1, 0, 100);
      if (!rally) res.legitimacy = clamp(res.legitimacy - 1, 0, 100);
      applied.push('foreign_destabilization');
    } else {
      applied.push('foreign_meddling');
    }

    // The country splits into those who would resist and those who would accommodate
    if (slowTick) res.polarization = clamp(res.polarization + 1, 0, 100);
    applied.push('collaboration_divide');

    // Patriotism: short of open destabilization, defiance with the story on your side builds standing
    if (rally) {
      if (!destabilizing && slowTick) res.legitimacy = clamp(res.legitimacy + 1, 0, 100);
      applied.push('patriotic_rally');
    }
  }

  return applied;
}
