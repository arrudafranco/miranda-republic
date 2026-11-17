import type { GameState } from '../types/game';
import { POLICY_REPEAT_RULES, type PolicyRepeatRule } from '../data/policyRepeat';

export type RepeatBlock =
  | { kind: 'once' }
  | { kind: 'cooldown'; turnsLeft: number };

export function getPolicyRepeatRule(policyId: string): PolicyRepeatRule | null {
  return POLICY_REPEAT_RULES[policyId] ?? null;
}

/**
 * Why a policy cannot be enacted again right now, or null if it can.
 * Takes the two fields it needs so the UI can call it with store slices.
 */
export function getRepeatBlock(
  policyId: string,
  turn: number,
  policyLastEnacted: Record<string, number> | undefined,
): RepeatBlock | null {
  const rule = getPolicyRepeatRule(policyId);
  if (rule === null) return null;
  const last = policyLastEnacted?.[policyId];
  if (last === undefined) return null;
  if (rule === 'once') return { kind: 'once' };
  const turnsLeft = rule - (turn - last);
  return turnsLeft > 0 ? { kind: 'cooldown', turnsLeft } : null;
}

export function canEnactAgain(state: GameState, policyId: string): boolean {
  return getRepeatBlock(policyId, state.turn, state.policyLastEnacted) === null;
}

/** Short player-facing label for the rule itself, shown on policy cards. */
export function describeRepeatRule(policyId: string): string {
  const rule = getPolicyRepeatRule(policyId);
  if (rule === null) return 'Repeatable any time';
  if (rule === 'once') return 'One time only';
  return `Repeatable every ${rule} turns`;
}

/** Short player-facing reason a policy is blocked right now. */
export function describeRepeatBlock(block: RepeatBlock): string {
  if (block.kind === 'once') return 'Already enacted';
  return block.turnsLeft === 1 ? 'Ready next turn' : `Ready in ${block.turnsLeft} turns`;
}
