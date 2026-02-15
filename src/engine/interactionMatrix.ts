import type { BlocId, BlocEffectMap } from '../types/blocs';

// Alliance/rivalry coefficients: positive = alliance, negative = rivalry
// Range: -1 to +1. Only significant pairs listed; unlisted = 0.
const MATRIX: Partial<Record<BlocId, Partial<Record<BlocId, number>>>> = {
  finance: {
    tech: 0.6,
    agri: 0.4,
    labor: -0.7,
    industry: -0.4,
    syndicate: 0.2, // money laundering symbiosis
  },
  tech: {
    finance: 0.6,
    labor: -0.6,
    industry: -0.3,
    artists: 0.2,
  },
  agri: {
    finance: 0.4,
    academy: -0.4,
    labor: -0.2,
  },
  industry: {
    labor: 0.5,
    finance: -0.4,
    tech: -0.3,
  },
  labor: {
    industry: 0.5,
    artists: 0.4,
    academy: 0.3,
    finance: -0.7,
    tech: -0.6,
    mainStreet: -0.3,
  },
  military: {
    enforcers: 0.6,
    clergy: 0.4,
    academy: -0.3,
  },
  enforcers: {
    military: 0.6,
    clergy: 0.3,
    syndicate: -0.5, // officially antagonistic
    artists: -0.4,
    media: -0.3,
  },
  clergy: {
    military: 0.4,
    enforcers: 0.3,
    mainStreet: 0.4,
    artists: -0.6,
  },
  artists: {
    labor: 0.4,
    academy: 0.5,
    clergy: -0.6,
    enforcers: -0.4,
  },
  academy: {
    artists: 0.5,
    labor: 0.3,
    military: -0.3,
    agri: -0.4,
  },
  media: {
    enforcers: -0.3,
  },
  mainStreet: {
    clergy: 0.4,
    labor: -0.3,
    syndicate: -0.3,
  },
  syndicate: {
    enforcers: -0.5,
    court: -0.5,
    mainStreet: -0.3,
    finance: 0.2,
  },
  court: {
    syndicate: -0.5,
  },
};

const RIPPLE_SCALE = 0.25;

export function getInteractionCoefficient(from: BlocId, to: BlocId): number {
  return MATRIX[from]?.[to] ?? 0;
}

/**
 * Given primary loyalty deltas from a policy, compute secondary ripple effects.
 * Returns additional loyalty deltas at 25% scale.
 */
export function computeRippleEffects(
  primaryDeltas: BlocEffectMap
): BlocEffectMap {
  const ripples: BlocEffectMap = {};

  for (const [blocIdStr, effect] of Object.entries(primaryDeltas)) {
    const blocId = blocIdStr as BlocId;
    if (!effect?.loyalty) continue;

    const loyaltyDelta = effect.loyalty;
    const relationships = MATRIX[blocId];
    if (!relationships) continue;

    for (const [allyIdStr, coefficient] of Object.entries(relationships)) {
      const allyId = allyIdStr as BlocId;
      // Don't ripple back to blocs that already have primary effects
      if (primaryDeltas[allyId]) continue;

      const rippleDelta = Math.round(loyaltyDelta * coefficient * RIPPLE_SCALE);
      if (rippleDelta === 0) continue;

      if (!ripples[allyId]) {
        ripples[allyId] = { loyalty: 0 };
      }
      ripples[allyId]!.loyalty = (ripples[allyId]!.loyalty ?? 0) + rippleDelta;
    }
  }

  return ripples;
}
