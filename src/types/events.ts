import type { BlocEffectMap, BlocId } from './blocs';
import type { ResourceState } from './resources';
import type { GameState } from './game';

export type EventTrigger =
  | { type: 'rival_threshold'; powerLevel: number }
  | { type: 'loyalty_threshold'; blocId: BlocId; direction: 'above' | 'below'; threshold: number }
  | { type: 'random'; weight: number }
  | { type: 'resource_threshold'; resource: keyof ResourceState; direction: 'above' | 'below'; threshold: number };

export interface EventChoice {
  id: string;
  label: string;
  tooltip: string;
  effects: {
    blocs?: BlocEffectMap;
    resources?: Partial<ResourceState>;
    rivalPower?: number;
    laborCohesion?: number;
  };
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  trigger: EventTrigger;
  choices?: EventChoice[];           // If undefined, auto-resolves
  autoEffects?: {
    blocs?: BlocEffectMap;
    resources?: Partial<ResourceState>;
    rivalPower?: number;
    laborCohesion?: number;
  };
  condition?: (state: GameState) => boolean;  // Additional conditions beyond trigger
  oneShot?: boolean;                 // Only fires once per game
  crisisChainId?: string;           // Links event to a crisis chain
}

export interface CrisisChain {
  id: string;
  stages: string[];                  // event IDs in order
  trigger: (state: GameState) => boolean;
  cooldown?: number;                 // turns before chain can re-trigger (default: never)
}
