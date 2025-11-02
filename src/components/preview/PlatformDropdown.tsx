import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Platform, Device, AdFormat } from '@/types/creative';
import { cn } from '@/utils/cn';

interface PlatformDropdownProps {
  platform: Platform;
  setPlatform: (platform: Platform) => void;
  device: Device;
  setDevice: (device: Device) => void;
  adFormat: AdFormat;
  setAdFormat: (adFormat: AdFormat) => void;
  adType: string;
}

export const PlatformDropdown: React.FC<PlatformDropdownProps> = ({
  platform,
  setPlatform,
  device,
  setDevice,
  adFormat,
  setAdFormat,
  adType,
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

  const handlePlatformChange = (newPlatform: Platform) => {
    setPlatform(newPlatform);
  };

  const platformLabel = platform === 'facebook' ? 'Facebook' : 'Instagram';
  const deviceLabel = device === 'desktop' ? 'Desktop' : 'Mobile';
  const formatLabel = adFormat === 'original' ? 'Original'
    : adFormat === '1:1' ? '1:1 Square'
    : adFormat === '4:5' ? '4:5 Vertical'
    : 'Single Image';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-md text-14 font-medium text-text-primary hover:bg-surface-50 transition-colors"
      >
        <span>{platformLabel}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-border rounded-md shadow-lg z-50">
          <div className="p-3 space-y-4">
            {/* Platform Selection */}
            <div>
              <label className="block text-12 text-text-muted font-medium mb-2">Platform</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePlatformChange('facebook')}
                  className={cn(
                    'meta-chip',
                    platform === 'facebook' ? 'meta-chip-selected' : 'meta-chip-default'
                  )}
                >
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => handlePlatformChange('instagram')}
                  className={cn(
                    'meta-chip',
                    platform === 'instagram' ? 'meta-chip-selected' : 'meta-chip-default'
                  )}
                >
                  Instagram
                </button>
              </div>
            </div>

            {/* Device Selection */}
            <div>
              <label className="block text-12 text-text-muted font-medium mb-2">Device</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  disabled={adType === 'story' || adType === 'reel'}
                  className={cn(
                    'meta-chip',
                    device === 'desktop' ? 'meta-chip-selected' : 'meta-chip-default',
                    (adType === 'story' || adType === 'reel') && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  className={cn(
                    'meta-chip',
                    device === 'mobile' ? 'meta-chip-selected' : 'meta-chip-default'
                  )}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Ad Format Selection */}
            <div>
              <label className="block text-12 text-text-muted font-medium mb-2">Ad Format</label>
              <select
                value={adFormat}
                onChange={(e) => setAdFormat(e.target.value as AdFormat)}
                className="form-select w-full text-sm"
              >
                <option value="original">Original</option>
                <option value="1:1">1:1 Square</option>
                <option value="4:5">4:5 Vertical</option>
                {platform === 'facebook' && adType === 'feed' && (
                  <option value="single_image">Single Image</option>
                )}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
