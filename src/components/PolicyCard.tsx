import type { Policy } from '../types/actions';
import Tooltip from './Tooltip';

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
  effectiveCost: number;
  onToggle: () => void;
}

export default function PolicyCard({ policy, selected, disabled, effectiveCost, onToggle }: PolicyCardProps) {
  const colorClass = CATEGORY_COLORS[policy.category] ?? 'bg-slate-600 text-slate-200';
  const borderClass = CATEGORY_BORDER[policy.category] ?? 'border-l-slate-500';

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) onToggle();
    }
  }

  return (
    <Tooltip text={policy.tooltip}>
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
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-slate-500/60'}
        `}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-slate-100 truncate">{policy.name}</h4>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${colorClass}`}>
            {policy.category}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Cost: <span className="text-slate-200 font-medium">{effectiveCost}</span>
        </div>
      </div>
    </Tooltip>
  );
}
