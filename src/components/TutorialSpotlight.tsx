interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialSpotlightProps {
  rect: SpotlightRect;
}

export default function TutorialSpotlight({ rect }: TutorialSpotlightProps) {
  const padding = 8;

  return (
    <div
      className="fixed z-[49] pointer-events-none transition-all duration-300 rounded-lg spotlight-pulse"
      aria-hidden="true"
      style={{
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      }}
    />
  );
}
