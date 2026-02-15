import type { Policy } from '../types/actions';
import Tooltip from './Tooltip';
import { getEffectTags, formatPolicyEffects } from '../utils/policyEffects';

const CATEGORY_COLORS: Record<string, string> = {
  economic: 'bg-emerald-800/80 text-emerald-200',
  labor: 'bg-sky-800/80 text-sky-200',
  backroom: 'bg-violet-800/80 text-violet-200',
  rhetoric: 'bg-orange-800/80 text-orange-200',
  security: 'bg-rose-800/80 text-rose-200',
  diplomatic: 'bg-teal-800/80 text-teal-200',
  institutional: 'bg-amber-800/80 text-amber-200',
};

const CATEGORY_BORDER: Record<string, string> = {
  economic: 'border-l-emerald-400',
  labor: 'border-l-sky-400',
  backroom: 'border-l-violet-400',
  rhetoric: 'border-l-orange-400',
  security: 'border-l-rose-400',
  diplomatic: 'border-l-teal-400',
  institutional: 'border-l-amber-400',
};

interface PolicyCardProps {
  policy: Policy;
  selected: boolean;
  disabled: boolean;
  needsMajority?: boolean;
  effectiveCost: number;
  onToggle: () => void;
}

export default function PolicyCard({ policy, selected, disabled, needsMajority, effectiveCost, onToggle }: PolicyCardProps) {
  const colorClass = CATEGORY_COLORS[policy.category] ?? 'bg-slate-600 text-slate-200';
  const borderClass = CATEGORY_BORDER[policy.category] ?? 'border-l-slate-500';

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) onToggle();
    }
  }

  const effectTags = getEffectTags(policy);
  const structuredEffects = formatPolicyEffects(policy);
  const fullTooltip = structuredEffects
    ? `${policy.tooltip}\n---\n${structuredEffects}`
    : policy.tooltip;

  return (
    <Tooltip text={fullTooltip}>
      <div
        role="checkbox"
        aria-checked={selected}
        aria-disabled={disabled}
        aria-label={`${policy.name}, ${policy.category}, cost ${effectiveCost}`}
        tabIndex={0}
        onClick={() => !disabled && onToggle()}
        onKeyDown={handleKeyDown}
        className={`
          rounded-xl p-4 border border-l-4 transition-all select-none
          ${borderClass}
          ${selected
            ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-slate-700'
            : 'border-slate-600/40 bg-slate-800/90'}
          ${disabled
            ? 'opacity-60 grayscale border-slate-600 cursor-not-allowed'
            : 'cursor-pointer hover:border-slate-500/60'}
          ${!selected && !disabled && 'focus:ring-2 focus:ring-cyan-500'}
        `}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-slate-100 truncate">{policy.name}</h4>
          {disabled && needsMajority && <span className="text-[10px] text-amber-400 italic shrink-0">Needs majority</span>}
          {disabled && !needsMajority && <span className="text-[10px] text-slate-400 italic shrink-0">Unavailable</span>}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${colorClass}`}>
            {policy.category}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Cost: <span className="text-slate-200 font-medium">{effectiveCost}</span>
        </div>
        {effectTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2" aria-hidden="true">
            {effectTags.map((tag, i) => (
              <span key={i} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tag.color}`}>
                {tag.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </Tooltip>
  );
}
