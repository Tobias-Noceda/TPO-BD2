import React, { useEffect,useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../utils';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'bottom-left';

export type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  className?: string;
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 100,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = (triggerRect: DOMRect, placement: TooltipPlacement) => {
    const offset = 8; // Distance from trigger element
    
    switch (placement) {
      case 'top':
        return {
          top: triggerRect.top - offset,
          left: triggerRect.left + triggerRect.width / 2,
        };
      case 'top-left':
        return {
          top: triggerRect.top - offset,
          left: triggerRect.left - offset,
        };
      case 'bottom':
        return {
          top: triggerRect.bottom + offset,
          left: triggerRect.left + triggerRect.width / 2,
        };
      case 'bottom-left':
        return {
          top: triggerRect.bottom + offset,
          left: triggerRect.left - offset,
        };
      case 'left':
        return {
          top: triggerRect.top + triggerRect.height / 2,
          left: triggerRect.left - offset,
        };
      case 'right':
        return {
          top: triggerRect.top + triggerRect.height / 2,
          left: triggerRect.right + offset,
        };
      default:
        return { top: 0, left: 0 };
    }
  };

  const show = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipPosition = calculatePosition(rect, placement);
        setPosition(tooltipPosition);
        setVisible(true);
      }
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const baseClassname = cn(
    "relative inline-block",
    className
  )

  const transformStyles: Record<TooltipPlacement, string> = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-y-1/2 -translate-x-full',
    right: '-translate-y-1/2',
    'top-left': '-translate-x-full -translate-y-full',
    'bottom-left': '-translate-x-full',
  };

  const tooltipClass = cn(
    "fixed w-max max-w-32 z-50 px-3 py-2 text-xs text-onAction font-normal font-nunito bg-zinc-950 rounded shadow transition-opacity duration-150 opacity-100 text-left break-all whitespace-normal",
    transformStyles[placement]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        className={baseClassname}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {visible && createPortal(
        <div 
          role='tooltip' 
          className={tooltipClass}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
