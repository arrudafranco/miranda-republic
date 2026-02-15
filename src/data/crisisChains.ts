import type { CrisisChain } from '../types/events';

export const CRISIS_CHAINS: CrisisChain[] = [
  {
    id: 'banking_crisis',
    stages: ['crisis_bank_run_rumors', 'crisis_credit_freeze', 'crisis_bank_resolution'],
    trigger: (state) => state.resources.inflation > 18,
  },
  {
    id: 'military_restlessness',
    stages: ['crisis_barracks_rumors', 'crisis_officers_ultimatum', 'crisis_loyalty_oath'],
    trigger: (state) => state.blocs.military.loyalty < 25,
  },
  {
    id: 'labor_uprising',
    stages: ['crisis_rolling_strikes', 'crisis_general_shutdown'],
    trigger: (state) => state.blocs.labor.loyalty < 20 && state.laborCohesion > 60,
  },
  {
    id: 'media_scandal',
    stages: ['crisis_leak', 'crisis_investigation', 'crisis_verdict'],
    trigger: (state) => state.pendingDiscoveries.length > 0 || state.blocs.media.loyalty > 65,
  },
  {
    id: 'colossus_pressure',
    stages: ['crisis_diplomatic_warning', 'crisis_sanctions', 'crisis_colossus_ultimatum'],
    trigger: (state) => state.colossus.patience < 20,
  },
];
