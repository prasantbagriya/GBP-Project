import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  title?: string;
  align?: 'center' | 'left' | 'right';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  title,
  align = 'center',
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

  const arrowClasses =
    align === 'left'
      ? 'left-3 translate-x-0'
      : align === 'right'
      ? 'right-3 left-auto translate-x-0'
      : 'left-1/2 -translate-x-1/2';

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
        className="p-0.5 text-slate-400 hover:text-blue-600 focus:text-blue-600 focus:outline-none rounded-full transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 bottom-full mb-1.5 w-60 sm:w-64 max-w-[calc(100vw-2rem)] p-2.5 bg-slate-900 text-white text-[11px] font-normal leading-relaxed rounded-lg shadow-xl border border-slate-700/80 break-words pointer-events-auto ${alignmentClasses}`}
        >
          {title && (
            <div className="font-bold text-slate-200 text-xs mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <Info className="w-3 h-3 text-blue-400 shrink-0" />
              <span>{title}</span>
            </div>
          )}
          <p className="text-slate-300 font-normal">{content}</p>
          <div
            className={`absolute top-full -mt-[1px] border-4 border-transparent border-t-slate-900 ${arrowClasses}`}
          />
        </div>
      )}
    </div>
  );
};
