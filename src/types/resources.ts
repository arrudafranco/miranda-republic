export type ResourceId =
  | 'legitimacy'
  | 'narrative'
  | 'capital'
  | 'mobilization'
  | 'polarization'
  | 'inflation'
  | 'dread'
  | 'colossusAlignment';

export interface ResourceState {
  legitimacy: number;        // 0-100
  narrative: number;         // 0-100
  capital: number;           // 0-999
  mobilization: number;      // 0-100
  polarization: number;      // 0-100
  inflation: number;         // 0-30
  dread: number;             // 0-100
  colossusAlignment: number; // 0-100
}

export const RESOURCE_RANGES: Record<ResourceId, { min: number; max: number }> = {
  legitimacy:       { min: 0, max: 100 },
  narrative:        { min: 0, max: 100 },
  capital:          { min: 0, max: 999 },
  mobilization:     { min: 0, max: 100 },
  polarization:     { min: 0, max: 100 },
  inflation:        { min: 0, max: 30 },
  dread:            { min: 0, max: 100 },
  colossusAlignment:{ min: 0, max: 100 },
};

export const STARTING_RESOURCES: ResourceState = {
  legitimacy: 65,
  narrative: 45,
  capital: 200,
  mobilization: 40,
  polarization: 25,
  inflation: 6,
  dread: 15,
  colossusAlignment: 65,
};
