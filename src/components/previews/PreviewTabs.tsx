import React from 'react';
import { cn } from '@/utils/cn';
import type { PreviewPlatform, PreviewPlacement } from '@/types/previews';

interface AdItem {
  id: number;
  ad_name: string;
  short_id: string;
}

interface PreviewTabsProps {
  selectedPlatforms: PreviewPlatform[];
  onPlatformsChange: (platforms: PreviewPlatform[]) => void;
  selectedPlacements: PreviewPlacement[];
  onPlacementsChange: (placements: PreviewPlacement[]) => void;
  ads?: AdItem[];
  selectedAdId?: number | null;
  onAdChange?: (adId: number) => void;
}

const PLATFORMS: { value: PreviewPlatform; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'messenger', label: 'Messenger' },
];

const ALL_PLACEMENTS: { value: PreviewPlacement; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'rightcolumn', label: 'Right column' },
  { value: 'story', label: 'Stories' },
  { value: 'reel', label: 'Reels' },
  { value: 'explore', label: 'Explore' },
  { value: 'instream', label: 'In-stream' },
  { value: 'search', label: 'Search' },
  { value: 'inbox', label: 'Inbox' },
];

export const PreviewTabs: React.FC<PreviewTabsProps> = ({
  selectedPlatforms,
  onPlatformsChange,
  selectedPlacements,
  onPlacementsChange,
  ads = [],
  selectedAdId,
  onAdChange,
}) => {
  const togglePlatform = (platform: PreviewPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  const togglePlacement = (placement: PreviewPlacement) => {
    if (selectedPlacements.includes(placement)) {
      onPlacementsChange(selectedPlacements.filter(p => p !== placement));
    } else {
      onPlacementsChange([...selectedPlacements, placement]);
    }
  };

  return (
    <div className="border-b border-divider bg-white">
      {/* Ad Selection Dropdown */}
      {ads.length > 0 && onAdChange && (
        <div className="px-6 pt-4 pb-3 border-b border-divider">
          <div className="flex items-center gap-3">
            <span className="text-12 text-text-muted uppercase tracking-wide">Select Ad:</span>
            <select
              value={selectedAdId || ''}
              onChange={(e) => onAdChange(Number(e.target.value))}
              className="px-4 py-2 text-14 font-medium border border-border rounded-md bg-white hover:bg-surface-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {ads.map((ad) => (
                <option key={ad.id} value={ad.id}>
                  {ad.ad_name}
                </option>
              ))}
            </select>
            <span className="text-12 text-text-muted">
              {ads.length} ad{ads.length !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>
      )}

      {/* Platform Filters */}
      <div className="px-6 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-12 text-text-muted uppercase tracking-wide mr-2">Platforms:</span>
          {PLATFORMS.map((platform) => (
            <button
              key={platform.value}
              onClick={() => togglePlatform(platform.value)}
              className={cn(
                'px-4 py-2 text-14 font-medium rounded-md border transition-all',
                selectedPlatforms.includes(platform.value)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-text-primary hover:bg-canvas'
              )}
            >
              {platform.label}
            </button>
          ))}
          {selectedPlatforms.length > 0 && selectedPlatforms.length < PLATFORMS.length && (
            <button
              onClick={() => onPlatformsChange(PLATFORMS.map(p => p.value))}
              className="ml-2 px-3 py-2 text-12 font-medium text-primary hover:underline transition-colors"
            >
              Select All Platforms
            </button>
          )}
        </div>
      </div>

      {/* Placement Filters */}
      <div className="px-6 pb-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-12 text-text-muted uppercase tracking-wide mr-2">Placements:</span>
          {ALL_PLACEMENTS.map((placement) => (
            <button
              key={placement.value}
              onClick={() => togglePlacement(placement.value)}
              className={cn(
                'px-3 py-1.5 text-12 font-semibold rounded-md border transition-all',
                selectedPlacements.includes(placement.value)
                  ? 'bg-[#E7F3FF] text-primary border-primary'
                  : 'bg-surface border-border text-text-primary hover:bg-canvas'
              )}
            >
              {placement.label}
            </button>
          ))}
          {selectedPlacements.length > 0 && (
            <button
              onClick={() => onPlacementsChange([])}
              className="ml-2 px-3 py-1.5 text-12 font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Clear All
            </button>
          )}
          {selectedPlacements.length === 0 && (
            <button
              onClick={() => onPlacementsChange(ALL_PLACEMENTS.map(p => p.value))}
              className="ml-2 px-3 py-1.5 text-12 font-medium text-primary hover:underline transition-colors"
            >
              Select All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
