import { type ReactNode, useId, useState, useRef, useCallback, useLayoutEffect } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, bottom: 0 });
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAnchor({ x: rect.left + rect.width / 2, y: rect.top, bottom: rect.bottom });
    setVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  // Clamp tooltip position to viewport after it renders and we know its size
  useLayoutEffect(() => {
    if (!visible || !tipRef.current) return;
    const tip = tipRef.current.getBoundingClientRect();
    const pad = 8;

    let left = anchor.x - tip.width / 2;
    let top = anchor.y - tip.height - 8;

    // If tooltip would go above viewport, flip below the element
    if (top < pad) {
      top = anchor.bottom + 8;
    }

    // Clamp horizontally
    left = Math.max(pad, Math.min(left, window.innerWidth - tip.width - pad));

    setPos({ left, top });
  }, [visible, anchor]);

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
          ref={tipRef}
          id={id}
          role="tooltip"
          className="pointer-events-none fixed z-[9999] rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300 shadow-lg shadow-black/40 max-w-96 whitespace-pre-line border border-slate-700/50 animate-[fadeIn_0.15s_ease-out]"
          style={{
            left: `${pos.left}px`,
            top: `${pos.top}px`,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
