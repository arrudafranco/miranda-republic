import type { Difficulty } from '../types/game';

interface DifficultyOption {
  id: Difficulty;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  border: string;
  hoverBg: string;
}

const OPTIONS: DifficultyOption[] = [
  {
    id: 'story',
    title: 'Story',
    subtitle: 'For first-timers',
    description: 'More capital, slower rivals, forgiving legitimacy. Learn the ropes without the noose.',
    accent: 'text-green-400',
    border: 'border-green-500/40',
    hoverBg: 'hover:bg-green-900/30 focus:bg-green-900/30',
  },
  {
    id: 'standard',
    title: 'Standard',
    subtitle: 'The intended experience',
    description: 'Balanced challenge. You will be tested. Miranda doesn\'t forgive easily.',
    accent: 'text-cyan-400',
    border: 'border-cyan-500/40',
    hoverBg: 'hover:bg-cyan-900/30 focus:bg-cyan-900/30',
  },
  {
    id: 'crisis',
    title: 'Crisis',
    subtitle: 'For masochists',
    description: 'Less money, faster rivals, lower thresholds. Everything is on fire and you\'re already behind.',
    accent: 'text-red-400',
    border: 'border-red-500/40',
    hoverBg: 'hover:bg-red-900/30 focus:bg-red-900/30',
  },
];

interface Props {
  onSelect: (difficulty: Difficulty) => void;
}

export default function DifficultySelect({ onSelect }: Props) {
  return (
    <div
      className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4"
      role="main"
      aria-label="Difficulty selection"
    >
      <h1 className="text-4xl font-bold text-slate-100 mb-2 font-pixel">
        The Miranda Republic
      </h1>
      <p className="text-slate-400 mb-10 text-center max-w-md">
        You are the new president. Choose how hard Miranda fights back.
      </p>

      <div className="grid gap-4 w-full max-w-3xl sm:grid-cols-3" role="group" aria-label="Difficulty options">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`text-left p-6 rounded-xl border ${opt.border} bg-slate-800/80 ${opt.hoverBg} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 cursor-pointer`}
            aria-label={`${opt.title} difficulty. ${opt.subtitle}`}
          >
            <h2 className={`text-xl font-bold ${opt.accent} mb-1 font-pixel`}>
              {opt.title}
            </h2>
            <p className="text-xs text-slate-400 mb-3">{opt.subtitle}</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {opt.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
