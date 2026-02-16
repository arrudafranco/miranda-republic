import { useState, useEffect } from 'react';
import type { BlocId } from '../types/blocs';
import BlocCard from './BlocCard';
import BlocOverviewTable from './BlocOverviewTable';

interface BlocGroup {
  label: string;
  color: string;
  blocs: BlocId[];
}

const BLOC_GROUPS: BlocGroup[] = [
  { label: 'State Power', color: 'border-rose-500/50', blocs: ['court', 'military', 'enforcers'] },
  { label: 'Capital', color: 'border-emerald-500/50', blocs: ['finance', 'industry', 'tech', 'agri', 'mainStreet'] },
  { label: 'Culture', color: 'border-amber-500/50', blocs: ['media', 'clergy', 'academy', 'artists'] },
  { label: 'Labor', color: 'border-sky-500/50', blocs: ['labor'] },
  { label: 'Underworld', color: 'border-slate-500/50', blocs: ['syndicate'] },
];

const BLOC_VIEW_KEY = 'miranda-bloc-view';

type ViewMode = 'detail' | 'overview';

interface BlocGridProps {
  compact?: boolean;
}

export default function BlocGrid({ compact }: BlocGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(BLOC_VIEW_KEY) as ViewMode) || 'detail';
    } catch {
      return 'detail';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(BLOC_VIEW_KEY, viewMode);
    } catch {
      // ignore
    }
  }, [viewMode]);

  // Mobile compact layout (no toggle, uses existing accordion)
  if (compact) {
    return (
      <div className="p-3 flex flex-col gap-3">
        {BLOC_GROUPS.map(group => (
          <div key={group.label}>
            <h3 className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1 border-l-2 ${group.color}`}>
              {group.label}
            </h3>
            <div className="flex flex-col gap-1">
              {group.blocs.map(id => (
                <BlocCard key={id} blocId={id} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4" data-tutorial="blocs">
      {/* View toggle */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-pixel">
          Power Blocs
        </h2>
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5" role="radiogroup" aria-label="Bloc view mode">
          <button
            role="radio"
            aria-checked={viewMode === 'overview'}
            onClick={() => setViewMode('overview')}
            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              viewMode === 'overview' ? 'bg-slate-700 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            role="radio"
            aria-checked={viewMode === 'detail'}
            onClick={() => setViewMode('detail')}
            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              viewMode === 'detail' ? 'bg-slate-700 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Detail
          </button>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <BlocOverviewTable groups={BLOC_GROUPS} />
      ) : (
        BLOC_GROUPS.map(group => (
          <div key={group.label} className="mb-4">
            <h3 className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-2 border-l-2 ${group.color}`}>
              {group.label}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {group.blocs.map(id => (
                <BlocCard key={id} blocId={id} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
