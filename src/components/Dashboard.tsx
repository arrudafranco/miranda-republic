import { useState, useCallback } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import ResourceSidebar from './ResourceSidebar';
import BlocGrid from './BlocGrid';
import EventModal from './EventModal';
import PolicyPicker from './PolicyPicker';
import NewsLog from './NewsLog';
import GameOverScreen from './GameOverScreen';
import Tooltip from './Tooltip';
import TutorialOverlay from './TutorialOverlay';
import HelpButton from './HelpButton';

const PHASE_LABELS: Record<string, string> = {
  news: 'News',
  briefing: 'Briefing',
  action: 'Your Turn',
  reaction: 'Processing...',
  congressional: 'Congress',
  narrative: 'Narrative',
  end: 'End of Turn',
};

const PHASE_TIPS: Record<string, string> = {
  news: 'A news event hits Miranda. React or let it pass.',
  briefing: 'Review the situation before acting.',
  action: 'Choose policies to spend your political capital on.',
  reaction: 'Blocs, the Rival, and the Colossus respond to your moves.',
  congressional: 'Congress recalculates seat shares based on bloc power.',
  narrative: 'The narrative recalculates based on cultural blocs.',
  end: 'The turn wraps up. Labor cohesion and streaks update.',
};

function getTurnDate(turn: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthIndex = (turn - 1) % 12;
  const year = Math.floor((turn - 1) / 12) + 1;
  return `${monthNames[monthIndex]}, Year ${year}`;
}

function SaveControls() {
  const initGame = useGameStore(s => s.initGame);
  const saveGame = useGameStore(s => s.saveGame);
  const loadGame = useGameStore(s => s.loadGame);
  const hasSavedGame = useGameStore(s => s.hasSavedGame);
  const gameOver = useGameStore(s => s.gameOver);
  const turn = useGameStore(s => s.turn);

  const [flash, setFlash] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'load' | 'new' | null>(null);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1500);
  }, []);

  const handleSave = () => {
    saveGame();
    showFlash('Saved');
  };

  const handleLoad = () => {
    if (confirmAction === 'load') {
      const ok = loadGame();
      setConfirmAction(null);
      showFlash(ok ? 'Loaded' : 'Load failed');
    } else {
      setConfirmAction('load');
      setTimeout(() => setConfirmAction(c => c === 'load' ? null : c), 3000);
    }
  };

  const handleNewGame = () => {
    if (confirmAction === 'new') {
      initGame();
      setConfirmAction(null);
    } else {
      setConfirmAction('new');
      setTimeout(() => setConfirmAction(c => c === 'new' ? null : c), 3000);
    }
  };

  const btnBase = 'px-2 py-0.5 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500';
  const btnNormal = `${btnBase} bg-slate-700 text-slate-300 hover:bg-slate-600`;
  const btnConfirm = `${btnBase} bg-amber-700 text-amber-100 hover:bg-amber-600`;

  return (
    <div className="flex items-center gap-2" role="toolbar" aria-label="Game controls">
      {flash && (
        <span className="text-xs text-green-400 animate-pulse" aria-live="polite">{flash}</span>
      )}
      {!gameOver && (
        <button onClick={handleSave} className={btnNormal}>Save</button>
      )}
      {hasSavedGame() && (
        <button onClick={handleLoad} className={confirmAction === 'load' ? btnConfirm : btnNormal}>
          {confirmAction === 'load' ? 'Confirm load?' : 'Load'}
        </button>
      )}
      {turn > 1 || !gameOver ? (
        <button onClick={handleNewGame} className={confirmAction === 'new' ? btnConfirm : btnNormal}>
          {confirmAction === 'new' ? 'Confirm?' : 'New Game'}
        </button>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const turn = useGameStore(s => s.turn);
  const maxTurns = useGameStore(s => s.maxTurns);
  const phase = useGameStore(s => s.phase);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 scanlines">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700/50 flex-shrink-0">
        <h1 className="text-lg font-bold tracking-wide font-pixel title-glow">MIRANDA REPUBLIC</h1>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <HelpButton />
          <SaveControls />
          <Tooltip text={PHASE_TIPS[phase] ?? ''}>
            <span className={`px-2 py-0.5 rounded text-xs font-medium cursor-help ${phase === 'action' ? 'bg-cyan-800 text-cyan-200 animate-pulse' : 'bg-slate-800 text-cyan-400'}`}>
              {PHASE_LABELS[phase] ?? phase}
            </span>
          </Tooltip>
          <Tooltip text="Each turn is one month of your four-year term.">
            <span className="cursor-help">Turn {turn}/{maxTurns}</span>
          </Tooltip>
          <span>{getTurnDate(turn)}</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <ResourceSidebar />
        <main className="flex-1 overflow-y-auto">
          <BlocGrid />
          <NewsLog />
          {phase === 'action' && <PolicyPicker />}
        </main>
      </div>

      {/* Modals (self-manage visibility) */}
      <EventModal />
      <GameOverScreen />
      <TutorialOverlay />
    </div>
  );
}
