import { useState, useEffect, useCallback } from 'react';

const TUTORIAL_KEY = 'miranda-tutorial-seen';

interface TutorialStep {
  title: string;
  body: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Miranda',
    body: 'You are the newly elected leader of the Republic of Miranda. Your term lasts 48 months (turns). Survive, thrive, or be overthrown. Good luck... you will need it.',
  },
  {
    title: 'Resources',
    body: 'The sidebar tracks your political resources. Legitimacy keeps you in power. Capital funds your policies (you earn a base income each turn, plus trade income). Narrative shapes public opinion. Polarization makes everything harder. Keep an eye on all of them.',
  },
  {
    title: 'The Sidebar',
    body: "Below your resources, you'll find three key panels. The Central Bank tracks how independent Miranda's monetary policy is... high independence pleases the Banks but limits your economic tools. The Colossus is the superpower watching Miranda's every move. And Congress tracks your legislative support.",
  },
  {
    title: 'Congress',
    body: "If blocs loyal to you hold a majority in Congress, legislative policy costs drop 15%. Lose your majority and costs rise 15%, your legitimacy drains, and your rival exploits the weakness. Keep the powerful blocs on your side.",
  },
  {
    title: 'Blocs',
    body: 'Miranda\'s power blocs each have loyalty (how much they support you) and power (how much influence they wield). Keep the right blocs happy, or face the consequences.',
  },
  {
    title: 'Your Turn',
    body: 'Each turn, a news event may occur. Then you choose policies to enact. Hover over a policy card to see its full effects. After that, the blocs, the Rival, and the Colossus react. Choose wisely... every action has consequences.',
  },
];

interface TutorialOverlayProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export default function TutorialOverlay({ forceShow, onClose }: TutorialOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
    >
      <div className="bg-slate-900 border border-cyan-700/50 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
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
        <p className="text-sm text-slate-300 leading-relaxed mb-6">{current.body}</p>

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
  );
}
