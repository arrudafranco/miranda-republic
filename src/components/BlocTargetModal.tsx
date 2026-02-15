import { useEffect, useRef } from 'react';
import type { BlocId } from '../types/blocs';
import { ALL_BLOC_IDS } from '../types/blocs';
import { BLOC_DEFINITIONS } from '../data/blocs';

const BLOC_EMOJI: Record<BlocId, string> = {
  court: '\u2696\uFE0F',
  military: '\uD83C\uDF96\uFE0F',
  enforcers: '\uD83D\uDE94',
  finance: '\uD83C\uDFE6',
  industry: '\uD83C\uDFED',
  tech: '\uD83D\uDCBB',
  agri: '\uD83C\uDF3E',
  mainStreet: '\uD83C\uDFEA',
  media: '\uD83D\uDCFA',
  clergy: '\u26EA',
  academy: '\uD83C\uDF93',
  artists: '\uD83C\uDFAD',
  labor: '\u270A',
  syndicate: '\uD83D\uDD76\uFE0F',
};

interface BlocTargetModalProps {
  onSelect: (blocId: BlocId) => void;
  onCancel: () => void;
}

export default function BlocTargetModal({ onSelect, onCancel }: BlocTargetModalProps) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => firstRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bloc-target-title"
    >
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 id="bloc-target-title" className="text-lg font-bold text-cyan-400 mb-4">
          Choose Target Bloc
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {ALL_BLOC_IDS.map((blocId, i) => (
            <button
              key={blocId}
              ref={i === 0 ? firstRef : undefined}
              onClick={() => onSelect(blocId)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-cyan-900/50 border border-slate-600 hover:border-cyan-500/50 text-slate-100 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <span aria-hidden="true">{BLOC_EMOJI[blocId]}</span>
              <span>{BLOC_DEFINITIONS[blocId].name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="mt-4 w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
