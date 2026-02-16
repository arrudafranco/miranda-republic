import type { Policy, ActionChoice } from '../types/actions';
import { getEffectTags } from '../utils/policyEffects';
import { CATEGORY_DOT } from './PolicyCard';

interface PolicyOverviewTableProps {
  policies: Policy[];
  selected: ActionChoice[];
  unlockedPolicyIds: string[];
  newlyUnlockedPolicyIds: string[];
  isDisabled: (policy: Policy) => boolean;
  getDisabledReason: (policy: Policy) => string | null;
  getEffectiveCost: (policy: Policy) => number;
  onToggle: (policyId: string) => void;
  onDetail: (policy: Policy) => void;
}

export default function PolicyOverviewTable({
  policies,
  selected,
  unlockedPolicyIds,
  newlyUnlockedPolicyIds,
  isDisabled,
  getDisabledReason,
  getEffectiveCost,
  onToggle,
  onDetail,
}: PolicyOverviewTableProps) {
  return (
    <div role="table" aria-label="Policy overview" className="w-full">
      {policies.map(policy => {
        const isLocked = !unlockedPolicyIds.includes(policy.id);
        const isSelected = selected.some(s => s.policyId === policy.id);
        const disabled = isLocked || (!isSelected && (isDisabled(policy) || selected.length >= 2));
        const disabledReason = isLocked ? (policy.unlockCondition?.hint ?? 'Locked') : (isSelected ? null : getDisabledReason(policy));
        const effectiveCost = isLocked ? 0 : getEffectiveCost(policy);
        const isNew = newlyUnlockedPolicyIds.includes(policy.id);
        const dotClass = CATEGORY_DOT[policy.category] ?? 'bg-slate-400';
        const effectTags = isLocked ? [] : getEffectTags(policy);

        if (isLocked) {
          return (
            <div
              key={policy.id}
              role="row"
              className="flex items-center gap-2 px-3 py-2 opacity-40 grayscale"
              title={disabledReason ?? 'Locked'}
            >
              <span className={`w-2 h-2 rounded-full ${dotClass} shrink-0`} role="cell" aria-hidden="true" />
              <svg aria-hidden="true" className="w-3 h-3 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span role="cell" className="text-sm text-slate-400 flex-1 truncate">{policy.name}</span>
              <span role="cell" className="text-[10px] text-slate-500 italic truncate max-w-[120px]">{disabledReason}</span>
            </div>
          );
        }

        return (
          <div
            key={policy.id}
            role="row"
            className={`flex items-center gap-2 px-3 py-2 transition-colors ${
              isSelected ? 'bg-cyan-900/30 ring-1 ring-cyan-500/40 rounded' :
              'hover:bg-slate-800/60'
            } ${disabled && !isSelected ? 'opacity-60' : ''}`}
          >
            {/* Category dot */}
            <span className={`w-2 h-2 rounded-full ${dotClass} shrink-0`} role="cell" aria-hidden="true" />

            {/* Name - click to open detail */}
            <button
              role="cell"
              onClick={() => onDetail(policy)}
              className="text-sm text-slate-200 flex-1 truncate text-left focus:outline-none focus-visible:underline min-w-0"
              aria-label={`View details for ${policy.name}`}
            >
              {policy.name}
              {isNew && <span className="ml-1.5 text-[9px] text-cyan-400 font-bold uppercase">New</span>}
            </button>

            {/* Cost */}
            <span role="cell" className="text-xs text-slate-400 tabular-nums shrink-0 w-8 text-right">
              {effectiveCost}
            </span>

            {/* Effect tags (up to 2) */}
            <div role="cell" className="hidden lg:flex gap-1 shrink-0 w-40" aria-hidden="true">
              {effectTags.slice(0, 2).map((tag, i) => (
                <span key={i} className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${tag.color}`}>
                  {tag.text}
                </span>
              ))}
            </div>

            {/* Disabled reason */}
            {disabled && disabledReason && (
              <span role="cell" className="text-[10px] text-amber-400 italic shrink-0 hidden sm:inline">
                {disabledReason}
              </span>
            )}

            {/* Checkbox */}
            <button
              role="checkbox"
              aria-checked={isSelected}
              aria-label={isSelected ? `Deselect ${policy.name}` : `Select ${policy.name}`}
              onClick={(e) => { e.stopPropagation(); if (!disabled || isSelected) onToggle(policy.id); }}
              disabled={disabled && !isSelected}
              className={`
                w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
                ${isSelected
                  ? 'bg-cyan-600 border-cyan-500'
                  : disabled
                    ? 'border-slate-600 cursor-not-allowed'
                    : 'border-slate-500 hover:border-cyan-500'}
              `}
            >
              {isSelected && (
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
