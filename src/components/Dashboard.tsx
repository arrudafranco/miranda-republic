import { useRef, useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useInactivityGlow } from '../hooks/useInactivityGlow';
import ResourceSidebar from './ResourceSidebar';
import BlocGrid from './BlocGrid';
import EventModal from './EventModal';
import PolicyPicker from './PolicyPicker';
import NewsLog from './NewsLog';
import GameOverScreen from './GameOverScreen';
import Tooltip from './Tooltip';
import TutorialOverlay from './TutorialOverlay';
import TurnBriefing from './TurnBriefing';
import DayOneBriefing from './DayOneBriefing';
import HelpButton from './HelpButton';
import SaveControls from './SaveControls';
import MobileLayout from './MobileLayout';
import MilestonesPanel from './MilestonesPanel';
import MilestoneRewardCard from './MilestoneRewardCard';
import PresidentialDispatch from './PresidentialDispatch';
import type { MobileTab } from './MobileBottomNav';

const PHASE_LABELS: Record<string, string> = {
  news: 'News',
  briefing: 'Briefing',
  action: 'Your Turn',
  reaction: 'Processing...',
  congressional: 'Congress',
  narrative: 'Narrative',
  end: 'End of Turn',
};

const PHASE_TIPS: Record<string, string> = {
  news: 'A news event hits Miranda. React or let it pass.',
  briefing: 'Review the situation before acting.',
  action: 'Choose policies to spend your political capital on.',
  reaction: 'Blocs, the Rival, and the Colossus respond to your moves.',
  congressional: 'Congress recalculates seat shares based on bloc power.',
  narrative: 'The narrative recalculates based on cultural blocs.',
  end: 'The turn wraps up. Labor cohesion and streaks update.',
};

function getTurnDate(turn: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthIndex = (turn - 1) % 12;
  const year = Math.floor((turn - 1) / 12) + 1;
  return `${monthNames[monthIndex]}, Year ${year}`;
}

function DesktopHeader() {
  const turn = useGameStore(s => s.turn);
  const maxTurns = useGameStore(s => s.maxTurns);
  const phase = useGameStore(s => s.phase);
  const submitActions = useGameStore(s => s.submitActions);
  const pendingCount = useGameStore(s => s.pendingActions.length);
  const glowing = useInactivityGlow(120_000);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700/50 flex-shrink-0">
      <h1 className="text-lg font-bold tracking-wide font-pixel title-glow">MIRANDA REPUBLIC</h1>
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <HelpButton />
        <SaveControls />
        {phase === 'action' ? (
          <Tooltip text={`${pendingCount} of 2 policies selected. You can also end with fewer.`}>
            <button
              onClick={() => submitActions()}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-700 hover:bg-amber-600 text-white action-ready ${glowing ? 'end-turn-glow' : ''}`}
            >
              End Turn ({pendingCount}/2)
            </button>
          </Tooltip>
        ) : (
          <Tooltip text={PHASE_TIPS[phase] ?? ''}>
            <span className="px-2 py-0.5 rounded text-xs font-medium cursor-help bg-slate-800 text-cyan-400">
              {PHASE_LABELS[phase] ?? phase}
            </span>
          </Tooltip>
        )}
        <Tooltip text="Each turn is one month of your four-year term.">
          <span className="cursor-help">Turn {turn}/{maxTurns}</span>
        </Tooltip>
        <span>{getTurnDate(turn)}</span>
      </div>
    </header>
  );
}

function MobileHeader() {
  const turn = useGameStore(s => s.turn);
  const maxTurns = useGameStore(s => s.maxTurns);
  const phase = useGameStore(s => s.phase);
  const submitActions = useGameStore(s => s.submitActions);
  const pendingCount = useGameStore(s => s.pendingActions.length);

  return (
    <header className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700/50 flex-shrink-0">
      <h1 className="text-sm font-bold tracking-wide font-pixel title-glow">MIRANDA</h1>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <HelpButton />
        {phase === 'action' ? (
          <button
            onClick={() => submitActions()}
            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-700 hover:bg-amber-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 action-ready"
          >
            End Turn ({pendingCount}/2)
          </button>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-cyan-400">
            {PHASE_LABELS[phase] ?? phase}
          </span>
        )}
        <span>T{turn}/{maxTurns}</span>
      </div>
    </header>
  );
}

function DesktopBody() {
  const phase = useGameStore(s => s.phase);

  return (
    <div className="flex flex-1 overflow-hidden">
      <ResourceSidebar />
      <main id="main-content" className="flex-1 overflow-y-auto">
        <BlocGrid />
        {phase === 'action' && <PolicyPicker />}
        <MilestonesPanel />
        <NewsLog />
      </main>
    </div>
  );
}

export default function Dashboard() {
  const { isMobile } = useBreakpoint();
  const mobileTabSetterRef = useRef<((tab: MobileTab) => void) | null>(null);
  const [forceReplay, setForceReplay] = useState(false);

  const handleMobileTabRef = useCallback((setter: (tab: MobileTab) => void) => {
    mobileTabSetterRef.current = setter;
  }, []);

  const handleTutorialTabChange = useCallback((tab: MobileTab) => {
    mobileTabSetterRef.current?.(tab);
  }, []);

  // Listen for Help button replay requests (single TutorialOverlay instance)
  useEffect(() => {
    function handleReplay() { setForceReplay(true); }
    window.addEventListener('replay-tutorial', handleReplay);
    return () => window.removeEventListener('replay-tutorial', handleReplay);
  }, []);

  return (
    <div className="h-dvh flex flex-col bg-slate-950 text-slate-100 scanlines overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-cyan-700 focus:text-white focus:rounded">
        Skip to main content
      </a>

      {isMobile ? <MobileHeader /> : <DesktopHeader />}
      {isMobile ? <MobileLayout onTabRef={handleMobileTabRef} /> : <DesktopBody />}

      {/* Modals (self-manage visibility) */}
      <EventModal />
      <MilestoneRewardCard />
      <TurnBriefing />
      <DayOneBriefing />
      <PresidentialDispatch />
      <GameOverScreen />
      <TutorialOverlay
        forceShow={forceReplay || undefined}
        onClose={() => setForceReplay(false)}
        onMobileTabChange={isMobile ? handleTutorialTabChange : undefined}
      />
    </div>
  );
}
