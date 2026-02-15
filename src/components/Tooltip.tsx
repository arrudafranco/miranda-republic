import { type ReactNode, useId, useState, useRef, useCallback } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Position tooltip above the element, centered horizontally
    setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    setVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      aria-describedby={id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter as unknown as React.FocusEventHandler}
      onBlur={handleMouseLeave as unknown as React.FocusEventHandler}
    >
      {children}
      {visible && (
        <div
          id={id}
          role="tooltip"
          className="pointer-events-none fixed z-[9999] rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300 shadow-lg shadow-black/40 max-w-64 whitespace-normal border border-slate-700/50 animate-[fadeIn_0.15s_ease-out]"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: 'translate(-50%, -100%) translateY(-8px)',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
