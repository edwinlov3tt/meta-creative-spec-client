import React from 'react';
import type { Platform, Device, AdType, AdFormat } from '@/types/creative';
import { cn } from '@/utils/cn';

interface PreviewControlsProps {
  platform: Platform;
  setPlatform: (platform: Platform) => void;
  device: Device;
  setDevice: (device: Device) => void;
  adType: AdType;
  setAdType: (adType: AdType) => void;
  adFormat: AdFormat;
  setAdFormat: (adFormat: AdFormat) => void;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({
  platform,
  setPlatform,
  device,
  setDevice,
  adType,
  setAdType,
  adFormat,
  setAdFormat,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-12 text-text-muted font-medium mb-2">Platform</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlatform('facebook')}
            className={cn(
              'meta-chip',
              platform === 'facebook' ? 'meta-chip-selected' : 'meta-chip-default'
            )}
          >
            Facebook
          </button>
          <button
            type="button"
            onClick={() => setPlatform('instagram')}
            className={cn(
              'meta-chip',
              platform === 'instagram' ? 'meta-chip-selected' : 'meta-chip-default'
            )}
          >
            Instagram
          </button>
        </div>
      </div>

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

      <div>
        <label className="block text-12 text-text-muted font-medium mb-2">Ad Type</label>
        <select
          value={adType}
          onChange={(e) => setAdType(e.target.value as AdType)}
          className="form-select w-full text-sm"
        >
          <option value="feed">Feed</option>
          <option value="story">Story</option>
          <option value="reel">Reel</option>
        </select>
      </div>

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
  );
};
