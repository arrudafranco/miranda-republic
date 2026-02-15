import { useGameStore } from '../hooks/useGameStore';
import Tooltip from './Tooltip';

export default function ColossusPanel() {
  const colossus = useGameStore(s => s.colossus);

  return (
    <div className="rounded-xl p-3 bg-slate-800 border border-violet-400/30 shadow-md shadow-violet-900/20">
      <h3 className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2 font-pixel">
        Colossus
      </h3>

      {/* Alignment bar */}
      <div className="mb-2">
        <Tooltip text="How aligned Miranda is with the Colossus. High alignment pleases the Banks but costs sovereignty.">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span id="colossus-alignment-label">Alignment</span>
            <span>{colossus.alignment}</span>
          </div>
        </Tooltip>
        <div
          className="h-2 bg-slate-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={colossus.alignment}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="colossus-alignment-label"
        >
          <div
            className="h-full rounded-full transition-all duration-500 bg-violet-400"
            style={{ width: `${colossus.alignment}%` }}
          />
        </div>
      </div>

      {/* Patience bar */}
      <div>
        <Tooltip text="The Colossus's tolerance. Decreases when you defy their interests.">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span id="colossus-patience-label">Patience</span>
            <span>{colossus.patience}</span>
          </div>
        </Tooltip>
        <div
          className="h-2 bg-slate-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={colossus.patience}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="colossus-patience-label"
        >
          <div
            className="h-full rounded-full transition-all duration-500 bg-violet-300"
            style={{ width: `${colossus.patience}%` }}
          />
        </div>
      </div>
    </div>
  );
}
