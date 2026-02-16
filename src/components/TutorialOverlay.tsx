import { useState, useEffect, useCallback, useRef } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import TutorialSpotlight from './TutorialSpotlight';
import type { MobileTab } from './MobileBottomNav';

const TUTORIAL_KEY = 'miranda-tutorial-seen';

interface SpotlightTarget {
  desktop?: string;
  mobile?: string;
  mobileTab?: MobileTab;
}

interface TutorialStep {
  title: string;
  body: string;
  mobileBody?: string;
  spotlight?: SpotlightTarget;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Miranda',
    body: 'You are the newly elected leader of the Republic of Miranda. Your term lasts 48 months (turns). Survive, thrive, or be overthrown. Good luck... you will need it.',
  },
  {
    title: 'Resources',
    body: 'The sidebar tracks your political resources. Legitimacy keeps you in power. Capital funds your policies (you earn a base income each turn, plus trade income). Narrative shapes public opinion. Polarization makes everything harder. Keep an eye on all of them.',
    mobileBody: 'The Status tab tracks your political resources. Legitimacy keeps you in power. Capital funds your policies (you earn a base income each turn, plus trade income). Narrative shapes public opinion. Polarization makes everything harder. Keep an eye on all of them.',
    spotlight: { desktop: 'resources', mobile: 'tab-status', mobileTab: 'status' },
  },
  {
    title: 'Key Panels',
    body: "Below your resources, you'll find three key panels. The Central Bank tracks how independent Miranda's monetary policy is... high independence pleases the Banks but limits your economic tools. The Colossus is the superpower watching Miranda's every move. And Congress tracks your legislative support.",
    mobileBody: "In the Status tab, you'll find three key panels below your resources. The Central Bank tracks how independent Miranda's monetary policy is... high independence pleases the Banks but limits your economic tools. The Colossus is the superpower watching Miranda's every move. And Congress tracks your legislative support.",
    spotlight: { desktop: 'panels', mobile: 'tab-status', mobileTab: 'status' },
  },
  {
    title: 'Congress',
    body: "If blocs loyal to you hold a majority in Congress, legislative policy costs drop 15%. Lose your majority and costs rise 15%, your legitimacy drains, and your rival exploits the weakness. Keep the powerful blocs on your side.",
    spotlight: { desktop: 'congress', mobile: 'tab-status', mobileTab: 'status' },
  },
  {
    title: 'Blocs',
    body: 'Miranda\'s power blocs each have loyalty (how much they support you) and power (how much influence they wield). Keep the right blocs happy, or face the consequences.',
    spotlight: { desktop: 'blocs', mobile: 'tab-blocs', mobileTab: 'blocs' },
  },
  {
    title: 'The Rival',
    body: 'Your political rival is not sitting idle. Each turn, they act against you. Watch their panel for what they did and how fast their power is growing. If they trigger Gridlock or a Culture War, you will see badges with countdowns and their effects. Keep their power below 100 or they win.',
    spotlight: { desktop: 'rival', mobile: 'tab-status', mobileTab: 'status' },
  },
  {
    title: 'Your Turn',
    body: 'Each turn, a news event may occur. Then you choose policies to enact. Hover over a policy card to see its full effects. After that, the blocs, the Rival, and the Colossus react. Choose wisely... every action has consequences.',
    mobileBody: 'Each turn, a news event may occur. Then you choose policies to enact. Tap a policy name to see its full effects. After that, the blocs, the Rival, and the Colossus react. Choose wisely... every action has consequences.',
    spotlight: { desktop: 'policies', mobile: 'tab-actions', mobileTab: 'actions' },
  },
  {
    title: 'Policy Categories',
    body: 'Policies are organized by category (Economic, Labor, Security, and more). Use the tabs above the policy grid to filter. Some policies are locked at the start and unlock as your government grows... through time, relationships, or the political climate. Locked cards show hints about what you need.',
    spotlight: { desktop: 'policy-tabs', mobile: 'tab-actions', mobileTab: 'actions' },
  },
  {
    title: 'View Modes',
    body: 'Each major panel (blocs, policies, sidebar) has an Overview/Detail toggle. Overview mode condenses information into compact rows for quick scanning. Detail mode shows full cards with progress bars. Your preference is saved automatically. Try both and see what fits your play style.',
    mobileBody: 'On mobile, each panel is already optimized for compact viewing. On larger screens you can toggle between Overview and Detail modes for blocs, policies, and the sidebar.',
  },
  {
    title: 'Backroom Deals',
    body: 'Some backroom policies let you choose which bloc to target. When you select one, a modal will ask you to pick a bloc. That bloc receives a direct loyalty bonus. Useful for shoring up wavering allies, but be careful. The discovery risk is real.',
  },
  {
    title: 'Turn Reports',
    body: 'After your turn ends, you may see a brief report of what happened across Miranda. These are narrative snapshots, not exhaustive summaries. Pay attention to what the Rival is doing and any crises unfolding. Or press Continue to skip ahead.',
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getCardPosition(
  spotRect: SpotlightRect,
  cardWidth: number,
  cardHeight: number
): { top: number; left: number } {
  const pad = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Try below
  if (spotRect.top + spotRect.height + pad + cardHeight < vh) {
    return {
      top: spotRect.top + spotRect.height + pad,
      left: Math.max(pad, Math.min(spotRect.left, vw - cardWidth - pad)),
    };
  }
  // Try right
  if (spotRect.left + spotRect.width + pad + cardWidth < vw) {
    return {
      top: Math.max(pad, Math.min(spotRect.top, vh - cardHeight - pad)),
      left: spotRect.left + spotRect.width + pad,
    };
  }
  // Try above
  if (spotRect.top - pad - cardHeight > 0) {
    return {
      top: spotRect.top - pad - cardHeight,
      left: Math.max(pad, Math.min(spotRect.left, vw - cardWidth - pad)),
    };
  }
  // Try left
  if (spotRect.left - pad - cardWidth > 0) {
    return {
      top: Math.max(pad, Math.min(spotRect.top, vh - cardHeight - pad)),
      left: spotRect.left - pad - cardWidth,
    };
  }
  // Fallback: centered
  return {
    top: Math.max(pad, (vh - cardHeight) / 2),
    left: Math.max(pad, (vw - cardWidth) / 2),
  };
}

interface TutorialOverlayProps {
  forceShow?: boolean;
  onClose?: () => void;
  onMobileTabChange?: (tab: MobileTab) => void;
}

export default function TutorialOverlay({ forceShow, onClose, onMobileTabChange }: TutorialOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { isMobile } = useBreakpoint();
  const [spotRect, setSpotRect] = useState<SpotlightRect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setStep(0);
      return;
    }
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, [forceShow]);

  // Find spotlight target and position card
  useEffect(() => {
    if (!visible) return;

    const current = STEPS[step];
    const targetAttr = isMobile
      ? current.spotlight?.mobile
      : current.spotlight?.desktop;

    // Switch mobile tab if needed
    if (isMobile && current.spotlight?.mobileTab && onMobileTabChange) {
      onMobileTabChange(current.spotlight.mobileTab);
    }

    if (!targetAttr) {
      setSpotRect(null);
      setCardPos(null);
      return;
    }

    function updatePosition() {
      const el = document.querySelector(`[data-tutorial="${targetAttr}"]`);
      if (!el) {
        setSpotRect(null);
        setCardPos(null);
        return;
      }

      const rect = el.getBoundingClientRect();
      const newRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
      setSpotRect(newRect);

      // Estimate card size (will be refined after render)
      const cardW = Math.min(400, window.innerWidth - 32);
      const cardH = 220;
      setCardPos(getCardPosition(newRect, cardW, cardH));
    }

    // Small delay to let tab switch render
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [visible, step, isMobile, onMobileTabChange]);

  // Refine card position after render
  useEffect(() => {
    if (!spotRect || !cardRef.current) return;
    const card = cardRef.current;
    const cardW = card.offsetWidth;
    const cardH = card.offsetHeight;
    setCardPos(getCardPosition(spotRect, cardW, cardH));
  }, [spotRect]);

  const close = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      // ignore
    }
    onClose?.();
  }, [onClose]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      close();
    }
  }, [step, close]);

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  if (!visible) return null;

  const current = STEPS[step];
  const bodyText = (isMobile && current.mobileBody) ? current.mobileBody : current.body;
  const hasSpotlight = spotRect !== null;

  return (
    <>
      {/* Spotlight cutout (when target found) */}
      {hasSpotlight && <TutorialSpotlight rect={spotRect} />}

      {/* Overlay backdrop (only when no spotlight) */}
      {!hasSpotlight && (
        <div className="fixed inset-0 z-[49] bg-black/70" aria-hidden="true" />
      )}

      {/* Tutorial card */}
      <div
        className="fixed z-50"
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial"
        style={
          hasSpotlight && cardPos
            ? { top: cardPos.top, left: cardPos.left }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <div
          ref={cardRef}
          className="bg-slate-900 border border-cyan-700/50 rounded-lg p-6 max-w-md w-full shadow-2xl transition-all duration-300"
          style={!hasSpotlight ? { margin: '0 16px' } : undefined}
        >
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500">{step + 1}/{STEPS.length}</span>
            <button
              onClick={close}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
              aria-label="Skip tutorial"
            >
              Skip
            </button>
          </div>

          {/* Content */}
          <h2 className="text-lg font-bold text-cyan-300 mb-3">{current.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">{bodyText}</p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-700 text-slate-300 hover:bg-slate-600"
              aria-label="Previous step"
            >
              Back
            </button>

            {/* Step dots */}
            <div className="flex gap-1.5" aria-hidden="true">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-cyan-400' : 'bg-slate-700'}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-cyan-700 text-cyan-100 hover:bg-cyan-600"
              aria-label={step < STEPS.length - 1 ? 'Next step' : 'Finish tutorial'}
            >
              {step < STEPS.length - 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
