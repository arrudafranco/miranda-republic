export interface ColossusState {
  alignment: number;        // 0-100, synced with resources.colossusAlignment
  patience: number;         // 0-100, starts at 70
  tradeDependency: number;  // 0-100%, starts at 40
}

export const STARTING_COLOSSUS: ColossusState = {
  alignment: 65,
  patience: 70,
  tradeDependency: 40,
};
