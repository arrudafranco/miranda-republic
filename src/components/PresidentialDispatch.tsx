import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import {
  ENDINGS,
  PRESIDENTIAL_DISPATCHES,
  TONE_ACCENT,
  TONE_BORDER,
  TONE_GRADIENT,
  TONE_BUTTON_BG,
  substituteDispatchVars,
} from '../data/endings';
import type { GameState } from '../types/game';

export default function PresidentialDispatch() {
  const gameOver = useGameStore(s => s.gameOver);
  const showDispatch = useGameStore(s => s.showDispatch);
  const ending = useGameStore(s => s.ending);
  const dismissDispatch = useGameStore(s => s.dismissDispatch);

  // Grab the full state snapshot for template substitution and conditions
  const stateSnapshot = useGameStore(s => s as unknown as GameState);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameOver && showDispatch) {
      const id = requestAnimationFrame(() => buttonRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [gameOver, showDispatch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismissDispatch();
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
  }, [dismissDispatch]);

  if (!gameOver || !showDispatch || !ending) return null;

  const endingData = ENDINGS[ending];
  const dispatch = PRESIDENTIAL_DISPATCHES[ending];
  const tone = endingData.tone;

  // Filter paragraphs by conditions and substitute template vars
  const paragraphs = dispatch.paragraphs
    .filter(p => !p.condition || p.condition(stateSnapshot))
    .map(p => substituteDispatchVars(p.text, stateSnapshot));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispatch-title"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className={`bg-slate-800 border ${TONE_BORDER[tone]} rounded-2xl shadow-2xl max-w-xl w-full mx-4 my-4 overflow-hidden shrink-0 relative`}
      >
        <div className={`h-1 bg-gradient-to-r ${TONE_GRADIENT[tone]}`} />

        {/* Close button */}
        <button
          onClick={() => dismissDispatch()}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 z-10"
          aria-label="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Presidential Dispatch
          </p>
          <h2
            id="dispatch-title"
            className={`text-2xl sm:text-3xl font-bold ${TONE_ACCENT[tone]} mb-6 font-pixel`}
          >
            {endingData.title}
          </h2>

          <div className="space-y-4 mb-8">
            {paragraphs.map((text, i) => (
              <p
                key={i}
                className="text-slate-300 text-sm sm:text-base leading-relaxed"
              >
                {text}
              </p>
            ))}
          </div>

          <button
            ref={buttonRef}
            onClick={() => dismissDispatch()}
            className={`w-full px-4 py-3 rounded-lg ${TONE_BUTTON_BG[tone]} text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2`}
          >
            Continue to Report
          </button>
        </div>
      </div>
    </div>
  );
}
