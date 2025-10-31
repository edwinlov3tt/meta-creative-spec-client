import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { GripVertical, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialLeftWidth?: number; // percentage (0-100)
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
  className?: string;
}

export interface ResizablePanelsRef {
  openLeftPanel: () => void;
  closeLeftPanel: () => void;
}

export const ResizablePanels = forwardRef<ResizablePanelsRef, ResizablePanelsProps>(({
  leftPanel,
  rightPanel,
  initialLeftWidth = 55,
  minLeftWidth = 35,
  maxLeftWidth = 70,
  className = ''
}, ref) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth || 35);
  const [isDragging, setIsDragging] = useState(false);
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(initialLeftWidth > 0);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    openLeftPanel: () => setIsLeftPanelVisible(true),
    closeLeftPanel: () => setIsLeftPanelVisible(false),
  }));

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
    setLeftWidth(clampedWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const actualLeftWidth = isLeftPanelVisible ? leftWidth : 0;
  const rightWidth = 100 - actualLeftWidth;

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full ${className}`}
    >
      {isLeftPanelVisible && (
        <>
          <div
            className="min-w-0 border-r border-surface-200 bg-white flex flex-col"
            style={{ width: `${leftWidth}%` }}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="max-w-3xl mx-auto p-6 space-y-sp-6">
                {leftPanel}
              </div>
            </div>
          </div>

          <div
            className={`relative w-1 bg-surface-200 hover:bg-surface-300 cursor-col-resize transition-colors flex items-center justify-center group ${
              isDragging ? 'bg-primary-400' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className={`absolute inset-y-0 w-3 -ml-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
              isDragging ? 'opacity-100' : ''
            }`}>
              <GripVertical className="w-3 h-4 text-surface-400" />
            </div>
            <div className="absolute inset-y-0 w-4 -ml-1.5" />

            {/* Collapse button */}
            <button
              onClick={() => setIsLeftPanelVisible(false)}
              className="absolute top-4 right-0 translate-x-1/2 p-1.5 rounded-full bg-white border border-surface-300 hover:bg-surface-50 hover:border-surface-400 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
              title="Hide panel"
            >
              <PanelLeftClose className="w-3.5 h-3.5 text-surface-600" />
            </button>
          </div>
        </>
      )}

      <div
        className="min-w-0 bg-surface-50 flex flex-col"
        style={{ width: `${rightWidth}%` }}
      >
        {!isLeftPanelVisible && (
          <button
            onClick={() => setIsLeftPanelVisible(true)}
            className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white border border-surface-300 hover:bg-surface-50 hover:border-surface-400 transition-colors shadow-md"
            title="Show panel"
          >
            <PanelLeftOpen className="w-4 h-4 text-surface-600" />
          </button>
        )}

        <div className="sticky top-0 flex-1 min-h-0 overflow-hidden">
          <div className="h-full w-full flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-md">
              {rightPanel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
