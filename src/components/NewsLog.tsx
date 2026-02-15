import { useGameStore } from '../hooks/useGameStore';

export default function NewsLog() {
  const newsLog = useGameStore(s => s.newsLog);
  const reversed = [...newsLog].reverse();

  return (
    <section className="mx-4 mb-4">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-pixel">
        News Log
      </h2>
      <div
        role="log"
        aria-label="News log"
        className="max-h-52 overflow-y-auto rounded bg-slate-900 border border-slate-700/50 p-3 space-y-1"
      >
        {reversed.length === 0 && (
          <p className="text-xs text-slate-500 italic">No news yet.</p>
        )}
        {reversed.map((entry, i) => (
          <div key={`${entry.turn}-${i}`} className="flex gap-2 text-xs">
            <span className="text-slate-500 font-mono shrink-0">T{entry.turn}</span>
            <span className="text-slate-300">{entry.headline}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
