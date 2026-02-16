import { useState } from 'react';
import type { BlocId } from '../types/blocs';
import { useGameStore } from '../hooks/useGameStore';
import { BLOC_DEFINITIONS } from '../data/blocs';
import Tooltip from './Tooltip';

const BLOC_EMOJI: Record<BlocId, string> = {
  court: '⚖️',
  military: '🎖️',
  enforcers: '🚔',
  finance: '🏦',
  industry: '🏭',
  tech: '💻',
  agri: '🌾',
  mainStreet: '🏪',
  media: '📺',
  clergy: '⛪',
  academy: '🎓',
  artists: '🎭',
  labor: '✊',
  syndicate: '🕶️',
};

const MOOD_TABLE: Record<BlocId, [string, string, string, string, string]> = {
  court: [
    'Filing motions to have you disbarred from existence.',
    'Ruling against you on principle.',
    'Tolerating your presence in the republic.',
    'Citing precedent in your favor. Reluctantly.',
    'The bench rises when you enter. Unprecedented.',
  ],
  military: [
    'Polishing boots and planning your removal.',
    'Requesting a "security briefing" without you.',
    'Standing at ease. For now.',
    'Saluting with moderate enthusiasm.',
    'Named a base after you. You\'re still alive.',
  ],
  enforcers: [
    'Your security detail looks nervous. About you.',
    'Running "routine drills" near the palace.',
    'Following orders. Checking their phones.',
    'Cracking down on your enemies with gusto.',
    'They\'d take a bullet for you. They\'ve said so. Twice.',
  ],
  finance: [
    'Shorting the Miranda peso. Aggressively.',
    'Threatening capital flight at every meeting.',
    'The interest payments are acceptable. Barely.',
    'Extending your credit line. Don\'t read the fine print.',
    'Calling you "business-friendly" on investor calls.',
  ],
  industry: [
    'The factories are quiet. That\'s not a good sign.',
    'Lobbying for your replacement. Literally anyone.',
    'Running at half capacity. Blaming you at full.',
    'Production is up. They almost thanked you.',
    'Building a statue of you. In steel. On overtime.',
  ],
  tech: [
    'Your face is a negative meme. Algorithm-boosted.',
    'Threatening to move HQ to a friendlier dictatorship.',
    'Attending your summits. Checking stocks under the table.',
    'Offering to digitize your administration. For free.',
    'Named an AI after you. It only says nice things.',
  ],
  agri: [
    'Burning crops rather than sell to your government.',
    'Funding opposition billboards on every rural highway.',
    'The harvest will do. They won\'t credit you.',
    'Exporting record yields. Toasting your trade policy.',
    'Naming their best bull after you. It\'s an honor.',
  ],
  mainStreet: [
    'Closed signs everywhere. "Thanks to YOU" spray-painted.',
    'Prices up, patience down. Muttering at the register.',
    'Business as usual. That\'s the best you\'ll get.',
    'Putting your photo next to the register. Unironically.',
    'Named "Employee of the Month." You don\'t work there.',
  ],
  media: [
    'Every headline is a knife. Some are front page.',
    'Running exposés on your breakfast choices.',
    'Covering you fairly. Suspiciously fairly.',
    'Your press conferences get prime time. Voluntarily.',
    'Writing hagiographies. The Pulitzer committee is concerned.',
  ],
  clergy: [
    'Praying for the republic. Specifically, for your departure.',
    'Sermons about "false shepherds." Eye contact maintained.',
    'Including you in prayers. Generic ones.',
    'Blessing your initiatives from the pulpit.',
    'Declared you "an instrument of providence." Canonization pending.',
  ],
  academy: [
    'Publishing papers on your cognitive deficiencies.',
    'Tenure-track professors writing op-eds against you.',
    'Studying your administration. Academically neutral.',
    'Citing your policies as "surprisingly evidence-based."',
    'Named a research grant after you. The good kind.',
  ],
  artists: [
    'The murals are devastating. And everywhere.',
    'Every play is a thinly veiled takedown of you.',
    'Writing about other things. You\'re not interesting enough.',
    'Composing anthems. Some are genuinely moving.',
    'They say you\'re their muse. The critics agree.',
  ],
  labor: [
    'General strike. Your name is on every sign.',
    'Slowdowns in every sector. Coincidence, they say.',
    'Working to rule. Nothing more, nothing less.',
    'Marching in your support. Banners and all.',
    'The workers\' choir sings your name. In four-part harmony.',
  ],
  syndicate: [
    'Your "accidents" insurance premium just tripled.',
    'The black market is betting against your survival.',
    'Business is business. You\'re not bad for business.',
    'Offering protection. For you, this time.',
    'The underworld considers you family. Sleep well.',
  ],
};

function getMoodText(blocId: BlocId, loyalty: number): string {
  const tier = loyalty >= 81 ? 4 : loyalty >= 61 ? 3 : loyalty >= 41 ? 2 : loyalty >= 21 ? 1 : 0;
  return MOOD_TABLE[blocId][tier];
}

function getLoyaltyTextColor(loyalty: number): string {
  if (loyalty >= 60) return 'text-emerald-400';
  if (loyalty >= 30) return 'text-amber-300';
  return 'text-rose-400';
}

function getLoyaltyColor(loyalty: number): string {
  if (loyalty >= 60) return 'bg-emerald-400';
  if (loyalty >= 30) return 'bg-amber-300';
  return 'bg-rose-400';
}

function getBlocTrend(
  current: number,
  previous: number | undefined
): { symbol: string; colorClass: string; srText: string } | null {
  if (previous === undefined) return null;
  const delta = current - previous;
  if (delta === 0) return { symbol: '~', colorClass: 'text-slate-500', srText: 'stable' };
  const isUp = delta > 0;
  return {
    symbol: isUp ? '\u25B2' : '\u25BC',
    colorClass: isUp ? 'text-emerald-400' : 'text-rose-400',
    srText: `trending ${isUp ? 'up' : 'down'}`,
  };
}

interface BlocGroup {
  label: string;
  color: string;
  blocs: BlocId[];
}

interface BlocOverviewTableProps {
  groups: BlocGroup[];
}

export default function BlocOverviewTable({ groups }: BlocOverviewTableProps) {
  const blocs = useGameStore(s => s.blocs);
  const prevBlocLoyalty = useGameStore(s => s.prevBlocLoyalty);
  const [expandedBloc, setExpandedBloc] = useState<BlocId | null>(null);

  function toggleExpand(id: BlocId) {
    setExpandedBloc(prev => prev === id ? null : id);
  }

  return (
    <div role="table" aria-label="Bloc overview" className="w-full">
      {groups.map(group => (
        <div key={group.label} role="rowgroup">
          {/* Group header */}
          <div
            role="row"
            className={`flex items-center gap-2 px-3 py-1.5 border-l-2 ${group.color}`}
          >
            <span role="columnheader" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {group.label}
            </span>
          </div>

          {/* Bloc rows */}
          {group.blocs.map(id => {
            const bloc = blocs[id];
            const def = BLOC_DEFINITIONS[id];
            const prevLoyalty = prevBlocLoyalty?.[id];
            const trend = getBlocTrend(bloc.loyalty, prevLoyalty);
            const isExpanded = expandedBloc === id;

            return (
              <div key={id} role="row">
                <Tooltip text={getMoodText(id, bloc.loyalty)}>
                  <button
                    onClick={() => toggleExpand(id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset"
                    aria-expanded={isExpanded}
                    aria-label={`${def.name}, loyalty ${bloc.loyalty}, power ${bloc.power}`}
                  >
                    <span role="cell" className="text-sm w-6 text-center" aria-hidden="true">
                      {BLOC_EMOJI[id]}
                    </span>
                    <span role="cell" className="text-sm text-slate-200 flex-1 text-left truncate">
                      {def.name}
                    </span>
                    <span role="cell" className={`text-sm font-semibold tabular-nums w-8 text-right ${getLoyaltyTextColor(bloc.loyalty)}`}>
                      {bloc.loyalty}
                    </span>
                    <span role="cell" className="text-xs text-slate-500 tabular-nums w-8 text-right">
                      P{bloc.power}
                    </span>
                    <span role="cell" className="w-4 text-center">
                      {trend && (
                        <>
                          <span className={`text-[10px] leading-none ${trend.colorClass}`} aria-hidden="true">
                            {trend.symbol}
                          </span>
                          <span className="sr-only">{trend.srText}</span>
                        </>
                      )}
                    </span>
                  </button>
                </Tooltip>

                {/* Expanded detail */}
                <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-40' : 'max-h-0'}`}>
                  <div className="px-4 pb-3 pt-1 ml-6 space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Loyalty</span>
                        <span>{bloc.loyalty}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getLoyaltyColor(bloc.loyalty)}`}
                          style={{ width: `${bloc.loyalty}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Power</span>
                        <span>{bloc.power}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-sky-400/70"
                          style={{ width: `${bloc.power}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 italic leading-snug">
                      {getMoodText(id, bloc.loyalty)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
