import type { GameState } from '../types/game';
import { clamp } from '../utils/helpers';

/**
 * Process Colossus state each turn.
 * Patience decays when alignment is low. Alignment synced with resources.
 */
export function processColossusTurn(state: GameState): void {
  // Sync alignment from resources
  state.colossus.alignment = state.resources.colossusAlignment;

  // Patience decay when alignment is low
  if (state.colossus.alignment < 40) {
    state.colossus.patience = clamp(state.colossus.patience - 3, 0, 100);
  } else if (state.colossus.alignment < 55) {
    state.colossus.patience = clamp(state.colossus.patience - 1, 0, 100);
  } else if (state.colossus.alignment > 70) {
    // Patience recovers slowly when aligned
    state.colossus.patience = clamp(state.colossus.patience + 1, 0, 100);
  }

  // Low patience effects
  if (state.colossus.patience <= 0) {
    // Crisis: economic pressure
    state.resources.capital = clamp(state.resources.capital - 15, 0, 999);
    state.resources.inflation = clamp(state.resources.inflation + 2, 0, 30);
    state.blocs.finance.loyalty = clamp(state.blocs.finance.loyalty - 5, 0, 100);
  }

  // High alignment effects on domestic blocs
  if (state.colossus.alignment > 70) {
    // Banks happy, scholars/artists resent dependency
    state.blocs.finance.loyalty = clamp(state.blocs.finance.loyalty + 1, 0, 100);
    state.blocs.academy.loyalty = clamp(state.blocs.academy.loyalty - 1, 0, 100);
  } else if (state.colossus.alignment < 30) {
    // Factories and unions may benefit from protectionism
    state.blocs.industry.loyalty = clamp(state.blocs.industry.loyalty + 1, 0, 100);
    state.blocs.finance.loyalty = clamp(state.blocs.finance.loyalty - 2, 0, 100);
  }
}

/**
 * Calculate trade income based on Colossus trade dependency.
 */
export function calculateTradeIncome(state: GameState): number {
  const baseIncome = 10;
  const tradeIncome = Math.round(baseIncome * (state.colossus.tradeDependency / 100));

  // Reduced income if alignment is very low
  if (state.colossus.alignment < 30) {
    return Math.round(tradeIncome * 0.5);
  }

  return tradeIncome;
}
