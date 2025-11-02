import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AdType, Device } from '@/types/creative';
import { cn } from '@/utils/cn';

interface PlacementsDropdownProps {
  adType: AdType;
  setAdType: (adType: AdType) => void;
  device: Device;
}

export const PlacementsDropdown: React.FC<PlacementsDropdownProps> = ({
  adType,
  setAdType,
  device,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const placementLabel = adType === 'feed' ? 'Feed'
    : adType === 'story' ? 'Stories'
    : adType === 'reel' ? 'Reels'
    : 'Feed';

  const placements: Array<{ value: AdType; label: string; disabledOnMobile?: boolean }> = [
    { value: 'feed', label: 'Feed' },
    { value: 'story', label: 'Stories' },
    { value: 'reel', label: 'Reels' },
  ];

  const handlePlacementSelect = (placement: AdType) => {
    setAdType(placement);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-md text-14 font-medium text-text-primary hover:bg-surface-50 transition-colors"
      >
        <span>{placementLabel}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-border rounded-md shadow-lg z-50">
          <div className="py-2">
            {placements.map((placement) => {
              const isDisabled = placement.disabledOnMobile && device === 'mobile';

              return (
                <button
                  key={placement.value}
                  type="button"
                  onClick={() => !isDisabled && handlePlacementSelect(placement.value)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full text-left px-4 py-2 text-14 transition-colors",
                    adType === placement.value
                      ? "bg-meta-blue/10 text-meta-blue font-medium"
                      : "text-text-primary hover:bg-surface-50",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {placement.label}
                  {isDisabled && (
                    <span className="ml-2 text-12 text-text-muted">(Desktop only)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
