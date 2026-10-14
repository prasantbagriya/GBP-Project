import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  title?: string;
  align?: 'center' | 'left' | 'right';
  side?: 'top' | 'bottom';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  title,
  align = 'center',
  side = 'bottom',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const alignmentClasses =
    align === 'left'
      ? 'left-0 translate-x-0'
      : align === 'right'
      ? 'right-0 left-auto translate-x-0'
      : 'left-1/2 -translate-x-1/2';

  const arrowHorizontalClasses =
    align === 'left'
      ? 'left-3 translate-x-0'
      : align === 'right'
      ? 'right-3 left-auto translate-x-0'
      : 'left-1/2 -translate-x-1/2';

  // Position tooltip safely below (top-full mt-1.5) or above (bottom-full mb-1.5)
  const verticalClasses =
    side === 'top'
      ? 'bottom-full mb-1.5'
      : 'top-full mt-1.5';

  const arrowClasses =
    side === 'top'
      ? `top-full -mt-[1px] border-4 border-transparent border-t-slate-900 ${arrowHorizontalClasses}`
      : `bottom-full -mb-[1px] border-4 border-transparent border-b-slate-900 ${arrowHorizontalClasses}`;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center align-middle ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label={title || 'Information'}
        className="p-0.5 text-slate-400 hover:text-blue-600 focus:text-blue-600 focus:outline-none rounded transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 ${verticalClasses} w-60 sm:w-64 max-w-[calc(100vw-2.5rem)] p-2.5 bg-slate-900 text-white text-[11px] font-normal leading-relaxed rounded-md shadow-xl border border-slate-700/80 break-words pointer-events-auto ${alignmentClasses}`}
        >
          <div className="flex items-center justify-between gap-1 mb-1 border-b border-slate-800 pb-1">
            <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5 truncate">
              <Info className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="truncate">{title || 'Details'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded text-xs leading-none shrink-0 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-slate-300 font-normal leading-snug">{content}</p>
          <div className={`absolute ${arrowClasses}`} />
        </div>
      )}
    </div>
  );
};
