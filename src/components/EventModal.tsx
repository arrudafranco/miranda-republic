import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import Tooltip from './Tooltip';

export default function EventModal() {
  const phase = useGameStore(s => s.phase);
  const currentEvent = useGameStore(s => s.currentEvent);
  const pendingOutcome = useGameStore(s => s.pendingOutcome);
  const resolveCurrentEvent = useGameStore(s => s.resolveCurrentEvent);
  const dismissOutcome = useGameStore(s => s.dismissOutcome);
  const showDayOneBriefing = useGameStore(s => s.showDayOneBriefing);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Don't show during tutorial or inauguration
  const tutorialSeen = (() => {
    try { return !!localStorage.getItem('miranda-tutorial-seen'); } catch { return true; }
  })();

  const showEvent = phase === 'news' && currentEvent !== null && tutorialSeen && !showDayOneBriefing;
  const showOutcome = phase === 'news' && pendingOutcome !== null && currentEvent === null && tutorialSeen && !showDayOneBriefing;
  const visible = showEvent || showOutcome;
  const hasChoices = currentEvent?.choices && currentEvent.choices.length > 0;

  // Auto-skip when no event this turn
  useEffect(() => {
    if (phase === 'news' && currentEvent === null) {
      resolveCurrentEvent();
    }
  }, [phase, currentEvent, resolveCurrentEvent]);

  // Auto-focus first button when modal opens
  useEffect(() => {
    if (visible) {
      const id = requestAnimationFrame(() => firstButtonRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [visible]);

  // Focus trap and Escape key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (showOutcome) {
        dismissOutcome();
      } else if (hasChoices) {
        resolveCurrentEvent(currentEvent!.choices![0].id);
      } else {
        resolveCurrentEvent();
      }
      return;
    }

    // Focus trap
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [hasChoices, showOutcome, currentEvent, resolveCurrentEvent, dismissOutcome]);

  if (!visible) return null;

  // Outcome card stage (after event choice resolved)
  if (showOutcome && pendingOutcome) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="outcome-title"
        onKeyDown={handleKeyDown}
      >
        <div ref={dialogRef} className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-lg w-full mx-4 my-4 overflow-hidden shrink-0 relative">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

          {/* Close button (outcome is informational, no choices) */}
          <button
            onClick={() => dismissOutcome()}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6">
            <h2 id="outcome-title" className="text-lg font-bold text-amber-400 mb-3">
              {pendingOutcome.choiceLabel}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed italic mb-6">
              {pendingOutcome.text}
            </p>
            <button
              ref={firstButtonRef}
              onClick={() => dismissOutcome()}
              className="w-full px-4 py-3 rounded-lg bg-amber-800/60 hover:bg-amber-700/60 text-amber-50 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEvent) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
      onKeyDown={handleKeyDown}
    >
      <div ref={dialogRef} className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-lg w-full mx-4 my-4 overflow-hidden shrink-0">
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-cyan-400 to-transparent" />
        <div className="p-6">
        <h2
          id="event-title"
          className="text-xl font-bold text-cyan-400 mb-3"
        >
          {currentEvent.name}
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          {currentEvent.description}
        </p>

        {hasChoices ? (
          <div className="flex flex-col gap-3">
            {currentEvent.choices!.map((choice, i) => (
              <Tooltip key={choice.id} text={choice.tooltip}>
                <button
                  ref={i === 0 ? firstButtonRef : undefined}
                  onClick={() => resolveCurrentEvent(choice.id)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 hover:bg-cyan-900/50 border border-slate-600 hover:border-cyan-500/50 text-slate-100 text-sm font-medium text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {choice.label}
                </button>
              </Tooltip>
            ))}
          </div>
        ) : (
          <button
            ref={firstButtonRef}
            onClick={() => resolveCurrentEvent()}
            className="w-full px-4 py-3 rounded-lg bg-cyan-800 hover:bg-cyan-700 text-cyan-50 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            Continue
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
