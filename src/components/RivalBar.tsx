import { useGameStore } from '../hooks/useGameStore';
import Tooltip from './Tooltip';

export default function RivalBar() {
  const rival = useGameStore(s => s.rival);

  return (
    <Tooltip text="The opposition's momentum. Grows from polarization, inflation, and low legitimacy. At 100, they win.">
      <div className="rounded-xl p-3 bg-slate-800 border border-rose-400/30 shadow-md shadow-rose-900/20">
        <h3 className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1 font-pixel">
          Rival
        </h3>
        <p className="text-sm font-medium text-slate-100 truncate">{rival.name}</p>
        <p className="text-xs text-slate-400 mb-2 truncate">{rival.title}</p>

        {/* Power bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span id="rival-power-label">Power</span>
            <span>{rival.power}</span>
          </div>
          <div
            className="h-2 bg-slate-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={rival.power}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby="rival-power-label"
          >
            <div
              className="h-full rounded-full transition-all duration-500 bg-rose-400"
              style={{
                width: `${rival.power}%`,
                boxShadow: '0 0 10px rgba(251,113,133,0.5)',
              }}
            />
          </div>
        </div>
      </div>
    </Tooltip>
  );
}
