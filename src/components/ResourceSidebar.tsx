import { useGameStore } from '../hooks/useGameStore';
import { getDifficultyConfig } from '../types/game';
import Tooltip from './Tooltip';
import ColossusPanel from './ColossusPanel';
import CongressPanel from './CongressPanel';
import RivalBar from './RivalBar';

interface ResourceDef {
  key: keyof ReturnType<typeof useResourceValues>;
  label: string;
  color: string;
  max: number;
  tip: string;
}

function useResourceValues() {
  return useGameStore(s => s.resources);
}

const RESOURCE_DEFS: ResourceDef[] = [
  { key: 'legitimacy', label: 'Legitimacy', color: 'bg-sky-300', max: 100, tip: 'Presidential approval. Hits zero, you\'re impeached.' },
  { key: 'narrative', label: 'Narrative', color: 'bg-amber-300', max: 100, tip: 'Who controls the story. Cultural blocs recalculate this every turn.' },
  { key: 'capital', label: 'Capital', color: 'bg-emerald-300', max: 999, tip: 'Political capital. Spent on policies. Hard to earn, easy to burn.' },
  { key: 'mobilization', label: 'Mobilization', color: 'bg-rose-300', max: 100, tip: 'Popular energy. High mobilization counters your rival.' },
  { key: 'polarization', label: 'Polarization', color: 'bg-orange-300', max: 100, tip: 'Societal division. Raises policy costs and fuels your rival.' },
  { key: 'inflation', label: 'Inflation', color: 'bg-yellow-200', max: 30, tip: 'Economic pain. High inflation boosts rival power every turn.' },
  { key: 'dread', label: 'Dread', color: 'bg-rose-400', max: 100, tip: 'State fear. Too much dread with low military loyalty triggers a coup.' },
];

export default function ResourceSidebar() {
  const resources = useResourceValues();
  const centralBankIndependence = useGameStore(s => s.centralBankIndependence);
  const difficulty = useGameStore(s => s.difficulty);
  const baseIncome = getDifficultyConfig(difficulty).baseCapitalIncome;

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-700/50 p-4 flex flex-col gap-3 overflow-y-auto">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-pixel">
        Resources
      </h2>

      {RESOURCE_DEFS.map(r => {
        const value = resources[r.key];
        const pct = Math.min((value / r.max) * 100, 100);
        const tip = r.key === 'capital'
          ? `Political capital. Spent on policies. You earn ${baseIncome}/turn from governance plus trade income.`
          : r.tip;
        return (
          <Tooltip key={r.key} text={tip}>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span id={`resource-${r.key}-label`}>{r.label}</span>
                <span>{value}{r.max <= 100 ? '' : `/${r.max}`}</span>
              </div>
              <div
                className="h-2 bg-slate-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={r.max}
                aria-labelledby={`resource-${r.key}-label`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${r.color}${r.key === 'narrative' && value < 30 ? ' animate-narrative-flicker' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </Tooltip>
        );
      })}

      <hr className="border-slate-700/50 my-1" />

      {/* Central Bank Independence */}
      <div className="rounded-xl p-3 bg-slate-800 border border-teal-400/30 shadow-md shadow-teal-900/20">
        <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2 font-pixel">
          Central Bank
        </h3>
        <Tooltip text="How independent is the central bank from your government. High independence stabilizes Banks but limits your monetary tools.">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span id="cbi-label">Independence</span>
            <span>{centralBankIndependence}</span>
          </div>
        </Tooltip>
        <div
          className="h-2 bg-slate-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={centralBankIndependence}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="cbi-label"
        >
          <div
            className="h-full rounded-full transition-all duration-500 bg-teal-300"
            style={{ width: `${centralBankIndependence}%` }}
          />
        </div>
      </div>

      <hr className="border-slate-700/50 my-1" />
      <ColossusPanel />

      <hr className="border-slate-700/50 my-1" />
      <CongressPanel />

      <hr className="border-slate-700/50 my-1" />
      <RivalBar />
    </aside>
  );
}
