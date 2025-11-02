import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { PreviewPlatform, PreviewPlacement, PreviewAdData, PlacementPreview } from '@/types/previews';
import { PLACEMENT_CONFIGS } from '@/types/previews';
import { FacebookPreview } from '../preview/FacebookPreview';
import { InstagramPreview } from '../preview/InstagramPreview';
import { MetaStoryPreview } from './MetaStoryPreview';
import { MetaReelPreview } from './MetaReelPreview';
import { MetaMessengerPreview } from './MetaMessengerPreview';
import { MetaInstreamPreview } from './MetaInstreamPreview';
import { MetaSearchPreview } from './MetaSearchPreview';
import { MetaRightColumnPreview } from './MetaRightColumnPreview';
import { InstagramExplorePreview } from './InstagramExplorePreview';

interface PreviewsGridProps {
  platforms: PreviewPlatform[];
  placements: PreviewPlacement[];
  adData: PreviewAdData;
}

interface PreviewSection {
  title: string;
  placements: PreviewPlacement[];
}

const SECTIONS: PreviewSection[] = [
  {
    title: 'Feeds',
    placements: ['feed', 'rightcolumn', 'inbox', 'explore', 'search'],
  },
  {
    title: 'Stories, Status, Reels',
    placements: ['story', 'reel'],
  },
  {
    title: 'In-stream ads for videos and reels',
    placements: ['instream'],
  },
];

export const PreviewsGrid: React.FC<PreviewsGridProps> = ({
  platforms,
  placements,
  adData,
}) => {
  const [fullscreenPreview, setFullscreenPreview] = useState<PlacementPreview | null>(null);
  const [allPreviews, setAllPreviews] = useState<PlacementPreview[]>([]);

  const getPreviewsForSection = (sectionPlacements: PreviewPlacement[]): PlacementPreview[] => {
    return PLACEMENT_CONFIGS.filter(
      (config) =>
        platforms.includes(config.platform) &&
        sectionPlacements.includes(config.placement) &&
        placements.includes(config.placement) &&
        config.enabled
    );
  };

  const handleViewPreview = (config: PlacementPreview) => {
    // Get all available previews for navigation
    const allAvailablePreviews = PLACEMENT_CONFIGS.filter(
      (c) =>
        platforms.includes(c.platform) &&
        placements.includes(c.placement) &&
        c.enabled
    );
    setAllPreviews(allAvailablePreviews);
    setFullscreenPreview(config);
  };

  const handleNextPreview = () => {
    if (!fullscreenPreview || allPreviews.length === 0) return;
    const currentIndex = allPreviews.findIndex(p => p.id === fullscreenPreview.id);
    const nextIndex = (currentIndex + 1) % allPreviews.length;
    setFullscreenPreview(allPreviews[nextIndex]);
  };

  const handlePreviousPreview = () => {
    if (!fullscreenPreview || allPreviews.length === 0) return;
    const currentIndex = allPreviews.findIndex(p => p.id === fullscreenPreview.id);
    const previousIndex = (currentIndex - 1 + allPreviews.length) % allPreviews.length;
    setFullscreenPreview(allPreviews[previousIndex]);
  };

  // Keyboard navigation
  React.useEffect(() => {
    if (!fullscreenPreview) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenPreview(null);
      } else if (e.key === 'ArrowLeft') {
        handlePreviousPreview();
      } else if (e.key === 'ArrowRight') {
        handleNextPreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenPreview, allPreviews]);

  // Helper to render preview header with view button
  const renderPreviewHeader = (config: PlacementPreview) => (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
        <p className="text-12 text-text-muted leading-tight">{config.description}</p>
      </div>
      <button
        onClick={() => handleViewPreview(config)}
        className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
        title="View fullscreen"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );

  // Render the fullscreen preview based on config
  const renderFullscreenPreviewContent = (config: PlacementPreview) => {
    // Facebook Feed
    if (config.platform === 'facebook' && config.placement === 'feed') {
      return (
        <div className="flex items-center justify-center bg-[#f7f8fa] rounded-lg p-4 h-full">
          <FacebookPreview device={config.device} adType="feed" adFormat={config.aspectRatio} adData={adData} />
        </div>
      );
    }

    // Instagram Feed
    if (config.platform === 'instagram' && config.placement === 'feed') {
      return (
        <div className="flex items-center justify-center bg-[#f7f8fa] rounded-lg p-4 h-full">
          <InstagramPreview device={config.device} adType="feed" adFormat={config.aspectRatio} adData={adData} />
        </div>
      );
    }

    // Facebook Right Column
    if (config.platform === 'facebook' && config.placement === 'rightcolumn') {
      return (
        <div className="flex items-center justify-center bg-[#f7f8fa] rounded-lg p-4 h-full">
          <MetaRightColumnPreview adData={adData} />
        </div>
      );
    }

    // Stories
    if (config.placement === 'story') {
      return (
        <div className="flex items-center justify-center h-full">
          <MetaStoryPreview platform={config.platform} adData={adData} />
        </div>
      );
    }

    // Reels
    if (config.placement === 'reel') {
      return (
        <div className="flex items-center justify-center h-full">
          <MetaReelPreview platform={config.platform} adData={adData} />
        </div>
      );
    }

    // Instagram Explore
    if (config.platform === 'instagram' && config.placement === 'explore') {
      return (
        <div className="flex items-center justify-center bg-[#f7f8fa] rounded-lg p-4 h-full">
          <InstagramExplorePreview adData={adData} />
        </div>
      );
    }

    // In-stream
    if (config.platform === 'facebook' && config.placement === 'instream') {
      return (
        <div className="flex items-center justify-center h-full">
          <MetaInstreamPreview adData={adData} />
        </div>
      );
    }

    // Search
    if (config.platform === 'facebook' && config.placement === 'search') {
      return (
        <div className="flex items-center justify-center h-full">
          <MetaSearchPreview adData={adData} />
        </div>
      );
    }

    // Messenger Inbox
    if (config.platform === 'messenger' && config.placement === 'inbox') {
      return (
        <div className="flex items-center justify-center bg-[#f7f8fa] rounded-lg p-4 h-full">
          <MetaMessengerPreview adData={adData} />
        </div>
      );
    }

    return null;
  };

  const renderPreview = (config: PlacementPreview) => {
    const key = `${config.platform}-${config.placement}-${config.device}`;

    // Facebook Feed
    if (config.platform === 'facebook' && config.placement === 'feed') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full flex items-center justify-center bg-[#f7f8fa] rounded-md">
              <FacebookPreview
                device={config.device}
                adType="feed"
                adFormat={config.aspectRatio}
                adData={adData}
              />
            </div>
          </div>
        </div>
      );
    }

    // Instagram Feed
    if (config.platform === 'instagram' && config.placement === 'feed') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full flex items-center justify-center bg-[#f7f8fa] rounded-md">
              <InstagramPreview
                device={config.device}
                adType="feed"
                adFormat={config.aspectRatio}
                adData={adData}
              />
            </div>
          </div>
        </div>
      );
    }

    // Facebook Right Column
    if (config.platform === 'facebook' && config.placement === 'rightcolumn') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full flex items-center justify-center bg-[#f7f8fa] rounded-md">
              <MetaRightColumnPreview adData={adData} />
            </div>
          </div>
        </div>
      );
    }

    // Stories (Facebook & Instagram)
    if (config.placement === 'story') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full rounded-md">
              <MetaStoryPreview
                platform={config.platform}
                adData={adData}
              />
            </div>
          </div>
        </div>
      );
    }

    // Reels (Facebook & Instagram)
    if (config.placement === 'reel') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full rounded-md">
              <MetaReelPreview
                platform={config.platform}
                adData={adData}
              />
            </div>
          </div>
        </div>
      );
    }

    // Instagram Explore
    if (config.platform === 'instagram' && config.placement === 'explore') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full flex items-center justify-center bg-[#f7f8fa] rounded-md">
              <InstagramExplorePreview adData={adData} />
            </div>
          </div>
        </div>
      );
    }

    // In-stream video (Facebook)
    if (config.platform === 'facebook' && config.placement === 'instream') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full flex items-center justify-center rounded-md">
              <MetaInstreamPreview adData={adData} />
            </div>
          </div>
        </div>
      );
    }

    // Search results (Facebook)
    if (config.platform === 'facebook' && config.placement === 'search') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full flex items-center justify-center rounded-md">
              <MetaSearchPreview adData={adData} />
            </div>
          </div>
        </div>
      );
    }

    // Messenger Inbox
    if (config.platform === 'messenger' && config.placement === 'inbox') {
      return (
        <div key={key} className="flex flex-col relative group w-full max-w-[28rem] rounded-lg">
          <div className="mb-3 flex items-start justify-between p-3 pb-0 rounded-t-lg">
            <div>
              <h3 className="text-14 font-semibold text-text-primary leading-tight">{config.label}</h3>
              <p className="text-12 text-text-muted leading-tight">{config.description}</p>
            </div>
            <button
              onClick={() => handleViewPreview(config)}
              className="ml-2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="View fullscreen"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-hidden bg-[#EAEAEA] p-2 rounded-lg shadow-sm" style={{ aspectRatio: '9/16' }}>
            <div className="w-full h-full flex items-center justify-center bg-[#f7f8fa] rounded-md">
              <MetaMessengerPreview adData={adData} />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const hasAnyPreviews = SECTIONS.some(section =>
    getPreviewsForSection(section.placements).length > 0
  );

  if (!hasAnyPreviews) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-16 font-medium text-text-secondary mb-2">
            No placements selected
          </p>
          <p className="text-14 text-text-muted">
            Select platforms and placements from the tabs above to see previews
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-12">
        {SECTIONS.map((section) => {
          const sectionPreviews = getPreviewsForSection(section.placements);

          if (sectionPreviews.length === 0) return null;

          return (
            <div key={section.title}>
              {/* Section Header */}
              <div className="mb-6">
                <h2 className="text-20 font-semibold text-text-primary mb-1">
                  {section.title}
                </h2>
                <div className="h-px bg-divider mt-2" />
              </div>

              {/* Section Previews Grid */}
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {sectionPreviews.map((config) => renderPreview(config))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Preview Modal */}
      {fullscreenPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setFullscreenPreview(null)}
        >
          {/* Navigation Controls */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 z-10">
            <div className="text-white">
              <h3 className="text-16 font-semibold">{fullscreenPreview.label}</h3>
              <p className="text-12 text-white/70">{fullscreenPreview.description}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenPreview(null);
              }}
              className="text-white hover:bg-white/10 p-2 rounded-md transition-colors"
              title="Close (Esc)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Previous Button */}
          {allPreviews.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePreviousPreview();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-10"
              title="Previous (←)"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Preview Content */}
          <div className="w-full h-full max-w-6xl p-20" onClick={(e) => e.stopPropagation()}>
            {renderFullscreenPreviewContent(fullscreenPreview)}
          </div>

          {/* Next Button */}
          {allPreviews.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextPreview();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-10"
              title="Next (→)"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Preview Counter */}
          {allPreviews.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-14 bg-black/50 px-4 py-2 rounded-full">
              {allPreviews.findIndex(p => p.id === fullscreenPreview.id) + 1} / {allPreviews.length}
            </div>
          )}
        </div>
      )}
    </>
  );
};
