import { useState, useCallback } from 'react';
import { useGameStore } from '../hooks/useGameStore';

export default function SaveControls() {
  const resetToMenu = useGameStore(s => s.resetToMenu);
  const saveGame = useGameStore(s => s.saveGame);
  const loadGame = useGameStore(s => s.loadGame);
  const hasSavedGame = useGameStore(s => s.hasSavedGame);
  const gameOver = useGameStore(s => s.gameOver);
  const turn = useGameStore(s => s.turn);
  const skipBriefings = useGameStore(s => s.skipBriefings);
  const setSkipBriefings = useGameStore(s => s.setSkipBriefings);

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
      resetToMenu();
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
      <label className="flex items-center gap-1.5 cursor-pointer ml-1" title="Skip turn reports between turns">
        <input
          type="checkbox"
          checked={skipBriefings}
          onChange={(e) => setSkipBriefings(e.target.checked)}
          className="w-3 h-3 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
        />
        <span className="text-[10px] text-slate-400">Skip reports</span>
      </label>
    </div>
  );
}
