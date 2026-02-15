import type { Policy } from '../types/actions';
import { BLOC_DEFINITIONS } from '../data/blocs';
import type { BlocId } from '../types/blocs';

interface EffectTag {
  text: string;
  color: string;
}

const BLOC_SHORT_NAMES: Record<BlocId, string> = {
  court: 'Court',
  military: 'Generals',
  enforcers: 'Enforcers',
  finance: 'Banks',
  industry: 'Factories',
  tech: 'Tech',
  agri: 'Landowners',
  mainStreet: 'Main St',
  media: 'Heralds',
  clergy: 'Clergy',
  academy: 'Scholars',
  artists: 'Artists',
  labor: 'Unions',
  syndicate: 'Underworld',
};

/** Returns up to 3 compact effect tags for at-a-glance display on policy cards. */
export function getEffectTags(policy: Policy): EffectTag[] {
  const tags: EffectTag[] = [];
  const { effects } = policy;

  // Immediate capital
  const immCap = effects.resources?.capital;
  if (immCap && immCap !== 0) {
    tags.push({
      text: `${immCap > 0 ? '+' : ''}${immCap} cap`,
      color: immCap > 0 ? 'text-emerald-300 bg-emerald-900/60' : 'text-rose-300 bg-rose-900/60',
    });
  }

  // Delayed capital
  const delayed = effects.delayed;
  if (delayed?.perTurn?.capital && delayed.perTurn.capital !== 0) {
    const c = delayed.perTurn.capital;
    tags.push({
      text: `${c > 0 ? '+' : ''}${c}/turn (${delayed.turns}t)`,
      color: c > 0 ? 'text-emerald-300 bg-emerald-900/60' : 'text-rose-300 bg-rose-900/60',
    });
  }

  if (tags.length >= 3) return tags.slice(0, 3);

  // Legitimacy
  const legit = effects.resources?.legitimacy;
  if (legit && legit !== 0) {
    tags.push({
      text: `${legit > 0 ? '+' : ''}${legit} legit`,
      color: legit > 0 ? 'text-sky-300 bg-sky-900/60' : 'text-rose-300 bg-rose-900/60',
    });
  }

  if (tags.length >= 3) return tags.slice(0, 3);

  // Rival power
  const rival = effects.rivalPower;
  if (rival && rival !== 0) {
    tags.push({
      text: `${rival > 0 ? '+' : ''}${rival} rival`,
      color: rival > 0 ? 'text-red-300 bg-red-900/60' : 'text-green-300 bg-green-900/60',
    });
  }

  return tags.slice(0, 3);
}

/** Builds a structured tooltip string showing all policy effects. */
export function formatPolicyEffects(policy: Policy): string {
  const { effects } = policy;
  const parts: string[] = [];

  // Resource effects
  const resourceParts: string[] = [];
  if (effects.resources) {
    const labels: Record<string, string> = {
      capital: 'Capital',
      legitimacy: 'Legitimacy',
      narrative: 'Narrative',
      mobilization: 'Mobilization',
      polarization: 'Polarization',
      inflation: 'Inflation',
      dread: 'Dread',
      colossusAlignment: 'Colossus',
    };
    for (const [key, val] of Object.entries(effects.resources)) {
      if (val !== undefined && val !== 0) {
        const sign = val > 0 ? '+' : '';
        resourceParts.push(`${labels[key] ?? key} ${sign}${val}`);
      }
    }
  }

  // Delayed effects
  if (effects.delayed) {
    const d = effects.delayed;
    for (const [key, val] of Object.entries(d.perTurn)) {
      if (val !== undefined && val !== 0) {
        const labels: Record<string, string> = {
          capital: 'Capital',
          legitimacy: 'Legitimacy',
          narrative: 'Narrative',
          mobilization: 'Mobilization',
          polarization: 'Polarization',
          inflation: 'Inflation',
          dread: 'Dread',
          colossusAlignment: 'Colossus',
        };
        const sign = val > 0 ? '+' : '';
        resourceParts.push(`${labels[key] ?? key} ${sign}${val}/turn (${d.turns}t)`);
      }
    }
    if (d.rivalEffect && d.rivalEffect !== 0) {
      const sign = d.rivalEffect > 0 ? '+' : '';
      resourceParts.push(`Rival ${sign}${d.rivalEffect}/turn (${d.turns}t)`);
    }
    if (d.cohesionEffect && d.cohesionEffect !== 0) {
      const sign = d.cohesionEffect > 0 ? '+' : '';
      resourceParts.push(`Cohesion ${sign}${d.cohesionEffect}/turn (${d.turns}t)`);
    }
  }

  // Rival power (immediate)
  if (effects.rivalPower && effects.rivalPower !== 0) {
    const sign = effects.rivalPower > 0 ? '+' : '';
    resourceParts.push(`Rival ${sign}${effects.rivalPower}`);
  }

  // Labor cohesion
  if (effects.laborCohesion && effects.laborCohesion !== 0) {
    const sign = effects.laborCohesion > 0 ? '+' : '';
    resourceParts.push(`Cohesion ${sign}${effects.laborCohesion}`);
  }

  // Central bank independence
  if (effects.centralBankIndependence && effects.centralBankIndependence !== 0) {
    const sign = effects.centralBankIndependence > 0 ? '+' : '';
    resourceParts.push(`CBI ${sign}${effects.centralBankIndependence}`);
  }

  if (resourceParts.length > 0) {
    parts.push(resourceParts.join(' . '));
  }

  // Bloc effects
  const blocParts: string[] = [];
  for (const [blocId, effect] of Object.entries(effects.blocs)) {
    const name = BLOC_SHORT_NAMES[blocId as BlocId] ?? BLOC_DEFINITIONS[blocId as BlocId]?.name ?? blocId;
    const bits: string[] = [];
    if (effect.loyalty !== undefined && effect.loyalty !== 0) {
      const sign = effect.loyalty > 0 ? '+' : '';
      bits.push(`${sign}${effect.loyalty} loyalty`);
    }
    if (effect.power !== undefined && effect.power !== 0) {
      const sign = effect.power > 0 ? '+' : '';
      bits.push(`${sign}${effect.power} power`);
    }
    if (bits.length > 0) {
      blocParts.push(`${name} ${bits.join(', ')}`);
    }
  }

  if (blocParts.length > 0) {
    parts.push(blocParts.join(' . '));
  }

  return parts.join('\n');
}
