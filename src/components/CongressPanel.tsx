import type { BlocId } from '../types/blocs';
import { ALL_BLOC_IDS } from '../types/blocs';
import { BLOC_DEFINITIONS } from '../data/blocs';
import { useGameStore } from '../hooks/useGameStore';
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

function loyaltyColor(loyalty: number): string {
  if (loyalty >= 60) return 'bg-emerald-400';
  if (loyalty >= 30) return 'bg-amber-300';
  return 'bg-rose-400';
}

export default function CongressPanel() {
  const seatShares = useGameStore(s => s.congress.seatShares);
  const blocs = useGameStore(s => s.blocs);
  const isFriendly = useGameStore(s => s.congress.friendlyMajority);

  const hasData = ALL_BLOC_IDS.some(id => (seatShares[id] ?? 0) > 0);
  if (!hasData) return null;

  // Calculate friendly percentage for display
  let friendlyPct = 0;
  for (const id of ALL_BLOC_IDS) {
    if (blocs[id].loyalty >= 50) {
      friendlyPct += (seatShares[id] ?? 0) * 100;
    }
  }
  friendlyPct = Math.round(friendlyPct);

  // Sort blocs by seat share descending for consistent bar rendering
  const sorted = ALL_BLOC_IDS
    .filter(id => (seatShares[id] ?? 0) > 0.01)
    .sort((a, b) => (seatShares[b] ?? 0) - (seatShares[a] ?? 0));

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-pixel">
        Congress
      </h3>

      {/* Stacked bar */}
      <div
        className="flex h-5 rounded overflow-hidden"
        role="img"
        aria-label={`Congressional seats. ${isFriendly ? 'Friendly majority, legislative costs reduced' : 'No majority, legislative costs increased and legitimacy draining'}. ${friendlyPct}%`}
      >
        {sorted.map(id => {
          const pct = (seatShares[id] ?? 0) * 100;
          const loyalty = blocs[id].loyalty;
          const name = BLOC_DEFINITIONS[id].name;
          const tipText = `${name} ${Math.round(pct)}% (loyalty ${loyalty})`;
          const showEmoji = pct >= 6;

          return (
            <Tooltip key={id} text={tipText}>
              <div
                className={`${loyaltyColor(loyalty)} flex items-center justify-center text-[10px] leading-none border-r border-slate-900/30 last:border-r-0 transition-all duration-500`}
                style={{ width: `${pct}%` }}
              >
                {showEmoji && <span aria-hidden="true">{BLOC_EMOJI[id]}</span>}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Majority indicator */}
      <p className={`text-xs mt-1 ${isFriendly ? 'text-green-400' : 'text-red-400'}`}>
        {isFriendly
          ? `Friendly majority... ${friendlyPct}% (legislative costs reduced)`
          : `No majority... ${friendlyPct}% (costs increased, legitimacy draining)`}
      </p>
    </div>
  );
}
