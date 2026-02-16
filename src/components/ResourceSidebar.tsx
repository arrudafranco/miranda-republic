import { useGameStore } from '../hooks/useGameStore';
import { getDifficultyConfig } from '../types/game';
import type { ResourceState } from '../types/resources';
import Tooltip from './Tooltip';
import ColossusPanel from './ColossusPanel';
import CongressPanel from './CongressPanel';
import RivalBar from './RivalBar';

interface ResourceDef {
  key: keyof ResourceState;
  label: string;
  color: string;
  max: number;
}

const RESOURCE_DEFS: ResourceDef[] = [
  { key: 'legitimacy', label: 'Legitimacy', color: 'bg-sky-300', max: 100 },
  { key: 'narrative', label: 'Narrative', color: 'bg-amber-300', max: 100 },
  { key: 'capital', label: 'Capital', color: 'bg-emerald-300', max: 999 },
  { key: 'mobilization', label: 'Mobilization', color: 'bg-rose-300', max: 100 },
  { key: 'polarization', label: 'Polarization', color: 'bg-orange-300', max: 100 },
  { key: 'inflation', label: 'Inflation', color: 'bg-yellow-200', max: 30 },
  { key: 'dread', label: 'Dread', color: 'bg-rose-400', max: 100 },
];

/** Resources where going UP is bad for the player */
const NEGATIVE_RESOURCES = new Set<keyof ResourceState>(['polarization', 'inflation', 'dread']);

function getTrendArrow(
  key: keyof ResourceState,
  current: number,
  previous: number | undefined
): { symbol: string; colorClass: string; srText: string } | null {
  if (previous === undefined) return null;
  const delta = current - previous;
  if (delta === 0) return { symbol: '~', colorClass: 'text-slate-500', srText: 'stable' };

  const isUp = delta > 0;
  const isBad = NEGATIVE_RESOURCES.has(key) ? isUp : !isUp;

  return {
    symbol: isUp ? '\u25B2' : '\u25BC',
    colorClass: isBad ? 'text-rose-400' : 'text-emerald-400',
    srText: `trending ${isUp ? 'up' : 'down'}`,
  };
}

function getDynamicTooltip(
  key: keyof ResourceState,
  value: number,
  resources: ResourceState,
  totalIncome: number,
  baseIncome: number,
  tradeIncome: number,
  colossusAlignment: number,
  centralBankIndependence: number,
  coupDreadThreshold: number
): string {
  switch (key) {
    case 'legitimacy':
      return `Presidential approval (${value}/100). Hits 0, you're impeached. +1/turn with congressional majority, -1 without. High central bank independence adds +1/turn.`;
    case 'narrative': {
      const rivalNote = value > 50
        ? 'Above 50, your rival grows slower (-2/turn).'
        : value < 30
          ? 'Below 30, your rival grows faster.'
          : 'Between 30 and 50, moderate rival pressure.';
      return `Control of the public story (${value}/100). ${rivalNote} Driven by Heralds, Artists, Scholars, and Clergy loyalty. Higher values open more options at term's end.`;
    }
    case 'capital':
      return `Political capital (${value}). Spent on policies. You earn ${totalIncome}/turn (${baseIncome} governance + ${tradeIncome} trade).${colossusAlignment < 30 ? ' Trade halved due to low Colossus alignment.' : ''}`;
    case 'mobilization': {
      const mobNote = value > 40
        ? 'Above 40, suppresses rival growth.'
        : 'Below 40, rival growth is unchecked.';
      return `Your base's energy (${value}/100). ${mobNote} Lost through austerity and backlash. Gained through labor and mass-appeal policies.`;
    }
    case 'polarization': {
      let costNote: string;
      if (value < 30) {
        costNote = 'Currently no cost penalty.';
      } else if (value < 60) {
        costNote = 'Centrist policies cost 25% more.';
      } else if (value < 80) {
        costNote = 'Centrist policies cost 50% more with 20% backlash risk.';
      } else {
        costNote = 'Centrist policies cost 100% more with 40% backlash risk. Non-centrist policies get cheaper.';
      }
      return `Societal division (${value}/100). ${costNote} At 60+, centrist backlash risk.`;
    }
    case 'inflation': {
      let inflNote: string;
      if (value < 10) {
        inflNote = 'Currently manageable.';
      } else if (value < 18) {
        inflNote = `Adds +${Math.floor(value / 5) * 2} rival growth. Above 12, currency crisis can trigger.`;
      } else {
        inflNote = `Adds +${Math.floor(value / 5) * 2} rival growth. Banking crisis chain is active.`;
      }
      return `Economic pain (${value}/30). ${inflNote}`;
    }
    case 'dread':
      return `State fear (${value}/100). Combined with low military loyalty (< 20), triggers a coup at dread > ${coupDreadThreshold}.`;
    default:
      return '';
  }
}

export default function ResourceSidebar() {
  const resources = useGameStore(s => s.resources);
  const previousResources = useGameStore(s => s.previousResources);
  const centralBankIndependence = useGameStore(s => s.centralBankIndependence);
  const difficulty = useGameStore(s => s.difficulty);
  const config = getDifficultyConfig(difficulty);
  const baseIncome = config.baseCapitalIncome;
  const colossus = useGameStore(s => s.colossus);
  // Trade income: base 10 * (tradeDependency/100), halved if alignment < 30
  const rawTrade = Math.round(10 * (colossus.tradeDependency / 100));
  const tradeIncome = colossus.alignment < 30 ? Math.round(rawTrade * 0.5) : rawTrade;
  const totalIncome = baseIncome + tradeIncome;

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-700/50 p-4 flex flex-col gap-3 overflow-y-auto">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-pixel">
        Resources
      </h2>

      {RESOURCE_DEFS.map(r => {
        const value = resources[r.key];
        const pct = Math.min((value / r.max) * 100, 100);
        const tip = getDynamicTooltip(
          r.key, value, resources,
          totalIncome, baseIncome, tradeIncome,
          colossus.alignment,
          centralBankIndependence,
          config.coupDreadThreshold
        );
        const prevValue = previousResources ? previousResources[r.key] : undefined;
        const trend = getTrendArrow(r.key, value, prevValue);

        return (
          <Tooltip key={r.key} text={tip}>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span id={`resource-${r.key}-label`}>{r.label}</span>
                <span className="flex items-center gap-1">
                  {trend && (
                    <>
                      <span className={`text-[10px] leading-none ${trend.colorClass}`} aria-hidden="true">{trend.symbol}</span>
                      <span className="sr-only">{r.label} {trend.srText}</span>
                    </>
                  )}
                  {value}{r.max <= 100 ? '' : `/${r.max}`}
                </span>
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
