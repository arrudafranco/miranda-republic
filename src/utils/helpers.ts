export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Seedable PRNG (mulberry32). When no seed is set, falls back to Math.random().
let _rngFn: (() => number) | null = null;

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed the PRNG for deterministic results. Call with no args to reset to Math.random(). */
export function seedRng(seed?: number): void {
  _rngFn = seed !== undefined ? mulberry32(seed) : null;
}

/** Get the next random number in [0, 1). Uses seed if set, otherwise Math.random(). */
export function random(): number {
  return _rngFn ? _rngFn() : Math.random();
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

export function rollChance(probability: number): boolean {
  return random() < probability;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
