import { useState, useCallback } from 'react';
import TutorialOverlay from './TutorialOverlay';

export default function HelpButton() {
  const [showTutorial, setShowTutorial] = useState(false);

  const open = useCallback(() => setShowTutorial(true), []);
  const close = useCallback(() => setShowTutorial(false), []);

  return (
    <>
      <button
        onClick={open}
        className="w-7 h-7 rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-cyan-300 transition-colors text-sm font-bold flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
        aria-label="Help and tutorial"
        title="Help"
      >
        ?
      </button>
      {showTutorial && <TutorialOverlay forceShow onClose={close} />}
    </>
  );
}
