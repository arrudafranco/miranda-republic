export type BlocId =
  | 'court'
  | 'military'
  | 'enforcers'
  | 'finance'
  | 'industry'
  | 'tech'
  | 'agri'
  | 'mainStreet'
  | 'media'
  | 'clergy'
  | 'academy'
  | 'artists'
  | 'labor'
  | 'syndicate';

export const ALL_BLOC_IDS: BlocId[] = [
  'court', 'military', 'enforcers', 'finance', 'industry', 'tech',
  'agri', 'mainStreet', 'media', 'clergy', 'academy', 'artists',
  'labor', 'syndicate',
];

export interface BlocSensitivities {
  material: number;   // 0-100: multiplier for POLICY action loyalty effects
  narrative: number;  // 0-100: multiplier for RHETORIC action loyalty effects
}

export interface BlocState {
  id: BlocId;
  loyalty: number;       // 0-100
  power: number;         // 0-100
  sensitivities: BlocSensitivities;
}

export interface BlocDefinition {
  id: BlocId;
  name: string;          // Player-facing name
  tooltip: string;
  ideology: number;      // -100 to +100
  priorities: string[];
  startLoyalty: number;
  startPower: number;
  sensitivities: BlocSensitivities;
}

export interface BlocEffect {
  loyalty?: number;
  power?: number;
}

export type BlocEffectMap = Partial<Record<BlocId, BlocEffect>>;
