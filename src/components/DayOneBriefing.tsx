import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { useBreakpoint } from '../hooks/useBreakpoint';
import type { Difficulty } from '../types/game';

const TUTORIAL_KEY = 'miranda-tutorial-seen';

function getBriefingParagraphs(difficulty: Difficulty, rivalName: string, rivalTitle: string): string[] {
  if (difficulty === 'story') {
    return [
      'The desk is mahogany, older than the Republic itself. Someone has polished it recently. On it sits a telephone, a modest stack of briefing folders, and a bottle of wine with a handwritten note from your predecessor. "You\'ll be fine," it reads. You almost believe it.',
      `Your chief of staff enters with a knock and a smile. "The situation," she says, opening the first folder without urgency. Miranda is a nation of fourteen factions, each convinced it runs the country. The Banks control the money. The Generals control the guns. The Underworld controls what happens after dark. You control this desk... and right now, that feels like enough.`,
      `She pauses at a dossier near the bottom of the stack. "${rivalName}, ${rivalTitle}. Organizing, yes, but nothing alarming. You have time." She closes the folder. "The Colossus is watching, as always. They want stability. But they're patient. Forty-eight months is a long time."`,
      'The phone rings once, then stops. Someone else answered it for you.',
    ];
  }

  if (difficulty === 'crisis') {
    return [
      'The desk has cigarette burns from a predecessor who didn\'t make it four years. Three briefing folders sit on it, all marked urgent. The resignation letter is already typed. Someone left it as a template.',
      'Your chief of staff enters already arguing on the phone. She hangs up without saying goodbye. "The situation," she says, dropping the folders open. Miranda is a nation of fourteen factions, and right now at least six of them want you gone. The Banks are threatening capital flight. The Generals requested a "security briefing" this morning... without inviting you. The Underworld sent flowers. That\'s never good.',
      `She stabs a finger at a dossier marked in red. "${rivalName}, ${rivalTitle}. Already held two rallies this week. The opposition doesn't just smell opportunity... they're printing campaign signs." She doesn't close the folder. "The Colossus ambassador called twice before breakfast. They want 'stability.' They define stability as you doing exactly what they say."`,
      'Three phones are ringing. Nobody is answering them.',
    ];
  }

  // Standard (default)
  return [
    'The desk is mahogany, older than the Republic itself. On it sits a telephone, a stack of briefing folders, and a blank resignation letter. The letter is pre-signed by your predecessor. A courtesy, or a warning.',
    'Your chief of staff enters without knocking. "The situation," she says, flipping open the first folder. Miranda is a nation of fourteen factions, each convinced it runs the country. The Banks control the money. The Generals control the guns. The Underworld controls what happens after dark. You control... this desk.',
    `She pauses at a dossier marked in red. "${rivalName}, ${rivalTitle}. Already organizing. Not against you personally, not yet. But the opposition smells opportunity. You have forty-eight months." She closes the folder. "The Colossus is watching, as always. They want stability. They define stability as cooperation with them."`,
    'The phone is ringing.',
  ];
}

export default function DayOneBriefing() {
  const showDayOneBriefing = useGameStore(s => s.showDayOneBriefing);
  const dismissDayOneBriefing = useGameStore(s => s.dismissDayOneBriefing);
  const rivalName = useGameStore(s => s.rival.name);
  const rivalTitle = useGameStore(s => s.rival.title);
  const difficulty = useGameStore(s => s.difficulty);
  const { isMobile } = useBreakpoint();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Wait for the tutorial to finish before showing inauguration
  const [tutorialDone, setTutorialDone] = useState(() => {
    try { return !!localStorage.getItem(TUTORIAL_KEY); } catch { return true; }
  });

  useEffect(() => {
    if (tutorialDone) return;
    // Poll for tutorial completion (set by TutorialOverlay on skip/finish)
    const interval = setInterval(() => {
      try {
        if (localStorage.getItem(TUTORIAL_KEY)) {
          setTutorialDone(true);
        }
      } catch { /* ignore */ }
    }, 200);
    return () => clearInterval(interval);
  }, [tutorialDone]);

  useEffect(() => {
    if (showDayOneBriefing && tutorialDone) {
      const id = requestAnimationFrame(() => buttonRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [showDayOneBriefing, tutorialDone]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismissDayOneBriefing();
    }
  }, [dismissDayOneBriefing]);

  if (!showDayOneBriefing || !tutorialDone) return null;

  const paragraphs = getBriefingParagraphs(difficulty, rivalName, rivalTitle);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dayone-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl max-w-xl w-full mx-4 my-4 overflow-hidden shrink-0 relative">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

        {/* Close button */}
        <button
          onClick={dismissDayOneBriefing}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className={isMobile ? 'p-5' : 'p-8'}>
          <h2
            id="dayone-title"
            className={`font-semibold text-amber-400 uppercase tracking-wider font-pixel ${isMobile ? 'text-xs mb-4' : 'text-sm mb-6'}`}
          >
            Inauguration Day
          </h2>

          <div className={`flex flex-col text-slate-300 ${isMobile ? 'gap-3 text-xs leading-relaxed mb-5' : 'gap-4 text-sm leading-relaxed mb-8'}`}>
            {paragraphs.map((text, i) => (
              <p key={i} className={i === paragraphs.length - 1 ? 'text-slate-400 italic' : ''}>
                {text}
              </p>
            ))}
          </div>

          <button
            ref={buttonRef}
            onClick={dismissDayOneBriefing}
            className={`rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-100 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${isMobile ? 'px-6 py-2.5 text-xs' : 'px-8 py-3 text-sm'}`}
          >
            Begin
          </button>
        </div>
      </div>
    </div>
  );
}
