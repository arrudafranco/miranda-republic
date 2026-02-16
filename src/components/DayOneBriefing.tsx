import { useRef, useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';

export default function DayOneBriefing() {
  const showDayOneBriefing = useGameStore(s => s.showDayOneBriefing);
  const dismissDayOneBriefing = useGameStore(s => s.dismissDayOneBriefing);
  const rivalName = useGameStore(s => s.rival.name);
  const rivalTitle = useGameStore(s => s.rival.title);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showDayOneBriefing) {
      const id = requestAnimationFrame(() => buttonRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [showDayOneBriefing]);

  if (!showDayOneBriefing) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dayone-title"
    >
      <div className="bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl max-w-xl w-full mx-4 overflow-hidden">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

        <div className="p-8">
          <h2
            id="dayone-title"
            className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-6 font-pixel"
          >
            Inauguration Day
          </h2>

          <div className="flex flex-col gap-4 text-sm leading-relaxed text-slate-300 mb-8">
            <p>
              The desk is mahogany, older than the Republic itself. On it sits a telephone, a stack
              of briefing folders, and a blank resignation letter. The letter is pre-signed by your
              predecessor. A courtesy, or a warning.
            </p>
            <p>
              Your chief of staff enters without knocking. "The situation," she says, flipping open
              the first folder. Miranda is a nation of fourteen factions, each convinced it runs the
              country. The Banks control the money. The Generals control the guns. The Underworld
              controls what happens after dark. You control... this desk.
            </p>
            <p>
              She pauses at a dossier marked in red. "{rivalName}, {rivalTitle}. Already organizing.
              Not against you personally, not yet. But the opposition smells opportunity. You have
              forty-eight months." She closes the folder. "The Colossus is watching, as always. They
              want stability. They define stability as cooperation with them."
            </p>
            <p className="text-slate-400 italic">
              The phone is ringing.
            </p>
          </div>

          <button
            ref={buttonRef}
            onClick={dismissDayOneBriefing}
            className="px-8 py-3 rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-100 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Begin
          </button>
        </div>
      </div>
    </div>
  );
}
