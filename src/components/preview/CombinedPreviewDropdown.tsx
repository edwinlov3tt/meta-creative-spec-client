import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { PLACEMENT_CONFIGS } from '@/types/previews';
import type { PlacementPreview } from '@/types/previews';
import { cn } from '@/utils/cn';

interface CombinedPreviewDropdownProps {
  selectedPreview: PlacementPreview;
  onPreviewChange: (preview: PlacementPreview) => void;
}

interface PreviewSection {
  title: string;
  placements: string[];
}

const SECTIONS: PreviewSection[] = [
  {
    title: 'Feeds',
    placements: ['feed', 'rightcolumn', 'inbox', 'explore'],
  },
  {
    title: 'Stories, Status, Reels',
    placements: ['story', 'reel'],
  },
  {
    title: 'In-stream ads for videos and reels',
    placements: ['instream'],
  },
  {
    title: 'Search results',
    placements: ['search'],
  },
];

export const CombinedPreviewDropdown: React.FC<CombinedPreviewDropdownProps> = ({
  selectedPreview,
  onPreviewChange,
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'messenger':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPreviewLabel = (preview: PlacementPreview) => {
    const platformName = preview.platform.charAt(0).toUpperCase() + preview.platform.slice(1);
    const deviceName = preview.device.charAt(0).toUpperCase() + preview.device.slice(1);
    const placementName = preview.placement === 'feed' ? 'Feed'
      : preview.placement === 'story' ? 'Stories'
      : preview.placement === 'reel' ? 'Reels'
      : preview.placement === 'rightcolumn' ? 'Right Column'
      : preview.placement === 'inbox' ? 'Inbox'
      : preview.placement === 'explore' ? 'Explore'
      : preview.placement === 'instream' ? 'In-stream'
      : preview.placement === 'search' ? 'Search'
      : preview.placement;

    return `${platformName} ${deviceName} ${placementName}`;
  };

  const handlePreviewSelect = (preview: PlacementPreview) => {
    onPreviewChange(preview);
    setIsOpen(false);
  };

  // Get grouped previews by section
  const getPreviewsForSection = (sectionPlacements: string[]) => {
    return PLACEMENT_CONFIGS.filter(
      (config) =>
        sectionPlacements.includes(config.placement) &&
        config.enabled
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-md text-14 font-medium text-text-primary hover:bg-surface-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          {getPlatformIcon(selectedPreview.platform)}
          <span>{getPreviewLabel(selectedPreview)}</span>
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="py-2">
            {SECTIONS.map((section) => {
              const sectionPreviews = getPreviewsForSection(section.placements);

              if (sectionPreviews.length === 0) return null;

              return (
                <div key={section.title} className="mb-2 last:mb-0">
                  {/* Section Header */}
                  <div className="px-3 py-2 bg-surface-50">
                    <h4 className="text-12 font-semibold text-text-muted uppercase tracking-wide">
                      {section.title}
                    </h4>
                  </div>

                  {/* Section Items */}
                  <div className="py-1">
                    {sectionPreviews.map((preview) => (
                      <button
                        key={preview.id}
                        type="button"
                        onClick={() => handlePreviewSelect(preview)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-14 transition-colors flex items-center gap-2",
                          selectedPreview.id === preview.id
                            ? "bg-meta-blue/10 text-meta-blue font-medium"
                            : "text-text-primary hover:bg-surface-50"
                        )}
                      >
                        {getPlatformIcon(preview.platform)}
                        <span>{getPreviewLabel(preview)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
