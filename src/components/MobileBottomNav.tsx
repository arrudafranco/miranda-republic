import { useRef, useCallback } from 'react';
import { useGameStore } from '../hooks/useGameStore';

export type MobileTab = 'blocs' | 'actions' | 'status' | 'news';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string }[] = [
  { id: 'blocs', label: 'Blocs' },
  { id: 'actions', label: 'Actions' },
  { id: 'status', label: 'Status' },
  { id: 'news', label: 'News' },
];

function BlocsIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} />
      <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} />
    </svg>
  );
}

function ActionsIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function StatusIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <rect x="3" y="12" width="4" height="9" rx="1" fill={active ? 'currentColor' : 'none'} />
      <rect x="10" y="7" width="4" height="14" rx="1" fill={active ? 'currentColor' : 'none'} />
      <rect x="17" y="3" width="4" height="18" rx="1" fill={active ? 'currentColor' : 'none'} />
    </svg>
  );
}

function NewsIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M7 8h10M7 12h6" strokeLinecap="round" fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

const ICONS: Record<MobileTab, (props: { active: boolean }) => JSX.Element> = {
  blocs: BlocsIcon,
  actions: ActionsIcon,
  status: StatusIcon,
  news: NewsIcon,
};

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const phase = useGameStore(s => s.phase);
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIdx = TABS.findIndex(t => t.id === activeTab);
    let nextIdx = -1;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = (currentIdx + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = (currentIdx - 1 + TABS.length) % TABS.length;
    }

    if (nextIdx >= 0) {
      onTabChange(TABS[nextIdx].id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIdx]?.focus();
    }
  }, [activeTab, onTabChange]);

  // Calculate active tab indicator position
  const activeIdx = TABS.findIndex(t => t.id === activeTab);

  return (
    <nav
      ref={tabListRef}
      className="fixed bottom-0 left-0 right-0 h-14 bg-slate-900 border-t border-slate-700/50 z-40 safe-area-bottom"
      role="tablist"
      aria-label="Game navigation"
    >
      {/* Animated active indicator */}
      <div
        className="absolute top-0 h-0.5 bg-cyan-400 transition-all duration-200"
        style={{ left: `${activeIdx * 25}%`, width: '25%' }}
        aria-hidden="true"
      />

      <div className="flex h-full">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = ICONS[tab.id];
          const showPulse = tab.id === 'actions' && phase === 'action' && !isActive;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              data-tutorial={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={handleKeyDown}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative
                focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset
                ${isActive ? 'text-cyan-400' : 'text-slate-500'}
              `}
            >
              {showPulse && (
                <span className="absolute top-1.5 right-1/2 translate-x-4 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
              )}
              <Icon active={isActive} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
