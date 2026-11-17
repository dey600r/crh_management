import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TruncatedTooltipProps {
  text: string;
  children?: ReactNode;
  className?: string;
  as?: 'span' | 'div';
  onlyWhenTruncated?: boolean;
}

interface TooltipCoords {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

export default function TruncatedTooltip({
  text,
  children,
  className = '',
  as = 'span',
  onlyWhenTruncated = true
}: TruncatedTooltipProps) {
  const triggerRef = useRef<HTMLDivElement & HTMLSpanElement>(null);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  const showIfNeeded = () => {
    const el = triggerRef.current;
    if (!el || !text) return;

    const targetEl = (el.querySelector('[data-truncate-target]') as HTMLElement | null) || el;
    const isTruncated =
      targetEl.scrollWidth > targetEl.clientWidth ||
      targetEl.scrollHeight > targetEl.clientHeight;

    if (onlyWhenTruncated && !isTruncated) {
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const halfMax = 150;
    const rawCenterX = rect.left + rect.width / 2;
    const clampedLeft = Math.max(
      halfMax + 12,
      Math.min(window.innerWidth - halfMax - 12, rawCenterX)
    );

    const placeBelow = rect.top < 64;
    setCoords({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left: clampedLeft,
      placement: placeBelow ? 'bottom' : 'top'
    });
  };

  const hide = () => {
    setCoords(null);
  };

  useEffect(() => {
    if (!coords) return;
    const handleScrollOrResize = () => setCoords(null);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [coords]);

  const Tag = as;

  return (
    <>
      <Tag
        ref={triggerRef}
        className={className}
        onMouseEnter={showIfNeeded}
        onMouseLeave={hide}
        onFocus={showIfNeeded}
        onBlur={hide}
      >
        {children ?? text}
      </Tag>

      {coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                coords.placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)'
            }}
            className="fixed z-[9999] pointer-events-none max-w-[300px] px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-medium leading-snug shadow-lg border border-slate-700/80 break-words"
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}
