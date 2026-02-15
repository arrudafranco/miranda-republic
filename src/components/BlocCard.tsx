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

function getLoyaltyColor(loyalty: number): string {
  if (loyalty >= 60) return 'bg-emerald-400';
  if (loyalty >= 30) return 'bg-amber-300';
  return 'bg-rose-400';
}

interface BlocCardProps {
  blocId: BlocId;
}

export default function BlocCard({ blocId }: BlocCardProps) {
  const bloc = useGameStore(s => s.blocs[blocId]);
  const def = BLOC_DEFINITIONS[blocId];

  return (
    <Tooltip text={def.tooltip}>
      <article className="rounded-xl p-4 shadow-md shadow-black/30 bg-slate-800/90 border border-slate-600/40 hover:border-slate-500/60 transition-colors" aria-label={`${def.name} bloc`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg" aria-hidden="true">{BLOC_EMOJI[blocId]}</span>
          <h3 className="text-sm font-semibold text-slate-100 truncate">{def.name}</h3>
        </div>

        {/* Loyalty bar */}
        <div className="mb-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span id={`${blocId}-loyalty-label`}>Loyalty</span>
            <span>{bloc.loyalty}</span>
          </div>
          <div
            className="h-2 bg-slate-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={bloc.loyalty}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby={`${blocId}-loyalty-label`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${getLoyaltyColor(bloc.loyalty)}`}
              style={{ width: `${bloc.loyalty}%` }}
            />
          </div>
        </div>

        {/* Power bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span id={`${blocId}-power-label`}>Power</span>
            <span>{bloc.power}</span>
          </div>
          <div
            className="h-2 bg-slate-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={bloc.power}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby={`${blocId}-power-label`}
          >
            <div
              className="h-full rounded-full transition-all duration-500 bg-sky-400/70"
              style={{ width: `${bloc.power}%` }}
            />
          </div>
        </div>

        {/* Mood text */}
        <p className="text-xs text-slate-400 italic leading-snug">
          {getMoodText(blocId, bloc.loyalty)}
        </p>
      </article>
    </Tooltip>
  );
}
