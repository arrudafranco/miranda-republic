import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import type { BriefingItemType } from '../types/game';

const TYPE_LABELS: Partial<Record<BriefingItemType, string>> = {
  crisis: 'Crisis Report',
  discovery: 'Intelligence',
  resource: 'Field Report',
  bloc_shift: 'Political Dispatch',
  unlock: 'New Capability',
};

const TYPE_BORDER_COLORS: Partial<Record<BriefingItemType, string>> = {
  crisis: 'border-l-rose-400',
  discovery: 'border-l-violet-400',
  resource: 'border-l-emerald-400',
  bloc_shift: 'border-l-sky-400',
  unlock: 'border-l-amber-400',
  color: 'border-l-slate-500',
};

const TYPE_LABEL_COLORS: Partial<Record<BriefingItemType, string>> = {
  crisis: 'text-rose-400',
  discovery: 'text-violet-400',
  resource: 'text-emerald-400',
  bloc_shift: 'text-sky-400',
  unlock: 'text-amber-400',
};

export default function TurnBriefing() {
  const showBriefing = useGameStore(s => s.showBriefing);
  const briefingItems = useGameStore(s => s.briefingItems);
  const dismissBriefing = useGameStore(s => s.dismissBriefing);
  const rivalName = useGameStore(s => s.rival.name);
  const rivalTitle = useGameStore(s => s.rival.title);
  const turn = useGameStore(s => s.turn);
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus button when modal opens
  useEffect(() => {
    if (showBriefing) {
      const id = requestAnimationFrame(() => buttonRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [showBriefing]);

  const handleDismiss = useCallback(() => {
    dismissBriefing();
  }, [dismissBriefing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDismiss();
    }
  }, [handleDismiss]);

  if (!showBriefing || briefingItems.length === 0) return null;

  const rivalItems = briefingItems.filter(i => i.type === 'rival');
  const otherItems = briefingItems.filter(i => i.type !== 'rival');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-title"
      onKeyDown={handleKeyDown}
      onClick={handleDismiss}
    >
      <div
        ref={dialogRef}
        className="bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl max-w-lg w-full mx-4 my-4 overflow-hidden shrink-0 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-cyan-400 to-transparent" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h2
            id="briefing-title"
            className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5 font-pixel"
          >
            Turn Report, Month {turn}
          </h2>

          <div className="flex flex-col gap-4 mb-6">
            {/* Rival section */}
            {rivalItems.length > 0 && (
              <div className="border border-amber-500/20 rounded-lg bg-amber-950/20 p-4">
                <h3 className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2 font-pixel">
                  {rivalName}, {rivalTitle}
                </h3>
                {rivalItems.map((item, i) => (
                  <p key={i} className="text-sm leading-relaxed text-amber-300 italic">
                    {item.text}
                  </p>
                ))}
              </div>
            )}

            {/* Other items */}
            {otherItems.map((item, i) => {
              const label = TYPE_LABELS[item.type];
              const borderColor = TYPE_BORDER_COLORS[item.type] ?? 'border-l-slate-600';
              const labelColor = TYPE_LABEL_COLORS[item.type] ?? 'text-slate-500';

              return (
                <div
                  key={i}
                  className={`border-l-2 ${borderColor} pl-3 py-1`}
                >
                  {label && (
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor} block mb-1`}>
                      {label}
                    </span>
                  )}
                  <p className={`text-sm leading-relaxed ${
                    item.type === 'crisis' ? 'text-rose-300' :
                    item.type === 'color' ? 'text-slate-400 italic' :
                    'text-slate-300'
                  }`}>
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            ref={buttonRef}
            onClick={handleDismiss}
            className="px-6 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
