import type { BlocEffectMap } from './blocs';
import type { ResourceState } from './resources';
import type { GameState } from './game';

export type ActionCategory =
  | 'economic'
  | 'social'
  | 'labor'
  | 'security'
  | 'institutional'
  | 'diplomatic'
  | 'rhetoric'
  | 'backroom';

export interface DiscoveryEffect {
  chance: number;             // 0-1 probability
  delay?: number;             // turns before exposure (0 or undefined = immediate)
  effects: {
    blocs?: BlocEffectMap;
    resources?: Partial<ResourceState>;
    rivalPower?: number;
  };
}

export interface DelayedEffect {
  turns: number;
  perTurn: Partial<ResourceState>;
  blocEffects?: Partial<Record<BlocId, { loyalty?: number; power?: number }>>;
  rivalEffect?: number;
  cohesionEffect?: number;
}

export interface PolicyEffects {
  blocs: BlocEffectMap;
  resources?: Partial<ResourceState>;
  laborCohesion?: number;
  rivalPower?: number;
  discovery?: DiscoveryEffect;
  delayed?: DelayedEffect;
}

export interface Policy {
  id: string;
  name: string;
  tooltip: string;
  category: ActionCategory;
  minPolarization: number;
  maxPolarization: number;
  capitalCost: number;
  centrist: boolean;
  targetBloc?: boolean;        // Player picks target bloc
  requiresSyndicateLoyalty?: number;
  effects: PolicyEffects;
  conditionalEffects?: (state: GameState) => Partial<PolicyEffects>;
}

export interface ActionChoice {
  policyId: string;
  targetBlocId?: string;       // For targetBloc policies
}

export interface ActiveDelayedEffect {
  turnsRemaining: number;
  perTurn: Partial<ResourceState>;
  sourcePolicyId: string;
  blocEffects?: Partial<Record<BlocId, { loyalty?: number; power?: number }>>;
  rivalEffect?: number;
  cohesionEffect?: number;
}
