import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import { CombinedPreviewDropdown } from './preview/CombinedPreviewDropdown';
import { FacebookPreview } from './preview/FacebookPreview';
import { InstagramPreview } from './preview/InstagramPreview';
import { useCreativeStore } from '@/stores/creativeStore';
import { useCreativePreviewData } from '@/hooks/useCreativePreviewData';
import { PLACEMENT_CONFIGS } from '@/types/previews';
import type { PlacementPreview } from '@/types/previews';

interface AdPreviewProps {
  onShowAllViews?: () => void;
}

export const AdPreview: React.FC<AdPreviewProps> = ({ onShowAllViews }) => {
  const preview = useCreativeStore(state => state.preview);
  const setPreview = useCreativeStore(state => state.setPreview);
  const setPreviewNode = useCreativeStore(state => state.setPreviewNode);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLDivElement | null>(null);

  // Maintain selected preview config ID separately
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>('fb-feed');

  const {
    platform,
    device,
    adType,
    adFormat,
    adData
  } = useCreativePreviewData();

  // Get all enabled previews for navigation
  const availablePreviews = useMemo(() => {
    return PLACEMENT_CONFIGS.filter((config) => config.enabled);
  }, []);

  // Get current preview config by ID
  const currentPreviewConfig = useMemo(() => {
    const config = PLACEMENT_CONFIGS.find((c) => c.id === selectedPreviewId);
    return config || PLACEMENT_CONFIGS[0];
  }, [selectedPreviewId]);

  const handlePreviewChange = (newPreview: PlacementPreview) => {
    // Update the selected preview ID
    setSelectedPreviewId(newPreview.id);

    // Map placement back to adType
    const newAdType = newPreview.placement === 'feed' ? 'feed'
      : newPreview.placement === 'story' ? 'story'
      : newPreview.placement === 'reel' ? 'reel'
      : newPreview.placement === 'rightcolumn' ? 'feed'
      : newPreview.placement === 'inbox' ? 'feed'
      : newPreview.placement === 'explore' ? 'feed'
      : newPreview.placement === 'instream' ? 'feed'
      : newPreview.placement === 'search' ? 'feed'
      : 'feed';

    // Map platform (messenger -> facebook for compatibility)
    const newPlatform = newPreview.platform === 'messenger' ? 'facebook' : newPreview.platform;

    setPreview({
      platform: newPlatform as 'facebook' | 'instagram',
      device: newPreview.device as 'desktop' | 'mobile',
      adType: newAdType,
    });
  };

  const handlePreviousPreview = () => {
    const currentIndex = availablePreviews.findIndex((p) => p.id === selectedPreviewId);
    const previousIndex = (currentIndex - 1 + availablePreviews.length) % availablePreviews.length;
    handlePreviewChange(availablePreviews[previousIndex]);
  };

  const handleNextPreview = () => {
    const currentIndex = availablePreviews.findIndex((p) => p.id === selectedPreviewId);
    const nextIndex = (currentIndex + 1) % availablePreviews.length;
    handlePreviewChange(availablePreviews[nextIndex]);
  };

  useEffect(() => {
    if (previewCanvasRef.current) {
      setPreviewNode(previewCanvasRef.current);
    }
    return () => setPreviewNode(null);
  }, [setPreviewNode]);

  return (
    <>
      <div
        ref={previewRef}
        className="bg-white flex flex-col h-auto rounded-lg"
      >
        {/* Control Bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-divider">
            {onShowAllViews && (
              <button
                type="button"
                onClick={onShowAllViews}
                className="inline-flex items-center justify-center p-2 bg-meta-blue text-white rounded-md hover:bg-blue-600 transition-colors"
                title="All Views"
              >
                <Grid className="w-4 h-4" />
              </button>
            )}

            {/* Arrow Navigation */}
            <button
              type="button"
              onClick={handlePreviousPreview}
              className="inline-flex items-center justify-center p-2 bg-white border border-border rounded-md hover:bg-surface-50 transition-colors"
              title="Previous preview"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Combined Dropdown */}
            <CombinedPreviewDropdown
              selectedPreview={currentPreviewConfig}
              onPreviewChange={handlePreviewChange}
            />

            <button
              type="button"
              onClick={handleNextPreview}
              className="inline-flex items-center justify-center p-2 bg-white border border-border rounded-md hover:bg-surface-50 transition-colors"
              title="Next preview"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-canvas p-2 rounded-b-lg">
          <div
            ref={previewCanvasRef}
            className={`mx-auto ${
              device === 'mobile' ? 'max-w-sm' : 'max-w-md'
            } ${
              adType === 'story' || adType === 'reel' ? 'aspect-story' : ''
            }`}
          >
            {platform === 'facebook' ? (
              <FacebookPreview
                device={device}
                adType={adType}
                adFormat={adFormat}
                adData={adData}
              />
            ) : (
              <InstagramPreview
                device={device}
                adType={adType}
                adFormat={adFormat}
                adData={adData}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
