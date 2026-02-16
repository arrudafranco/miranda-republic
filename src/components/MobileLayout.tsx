import { useState, useCallback } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import MobileBottomNav, { type MobileTab } from './MobileBottomNav';
import BlocGrid from './BlocGrid';
import PolicyPicker from './PolicyPicker';
import ResourceSidebar from './ResourceSidebar';
import NewsLog from './NewsLog';

interface MobileLayoutProps {
  onTabRef?: (setTab: (tab: MobileTab) => void) => void;
}

export default function MobileLayout({ onTabRef }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('actions');
  const phase = useGameStore(s => s.phase);

  const handleTabChange = useCallback((tab: MobileTab) => {
    setActiveTab(tab);
  }, []);

  // Expose setActiveTab to parent via callback ref
  if (onTabRef) {
    onTabRef(handleTabChange);
  }

  return (
    <>
      {/* Content area - all tabs stay mounted, hidden via CSS to preserve state */}
      <div className="flex-1 overflow-y-auto">
        <div className={activeTab === 'blocs' ? '' : 'hidden'}>
          <BlocGrid compact />
        </div>

        <div className={activeTab === 'actions' ? '' : 'hidden'}>
          {phase === 'action' ? (
            <PolicyPicker />
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Waiting for your turn...</p>
                <p className="text-slate-500 text-xs mt-1">Policies available during the action phase.</p>
              </div>
            </div>
          )}
        </div>

        <div className={activeTab === 'status' ? '' : 'hidden'}>
          <ResourceSidebar variant="fullwidth" />
        </div>

        <div className={activeTab === 'news' ? '' : 'hidden'}>
          <NewsLog fullHeight />
        </div>
      </div>

      {/* Bottom tab bar */}
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Bottom spacer for fixed nav */}
      <div className="h-14 flex-shrink-0" aria-hidden="true" />
    </>
  );
}
