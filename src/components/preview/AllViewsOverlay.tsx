import React from 'react';
import { X } from 'lucide-react';
import { FacebookPreview } from './FacebookPreview';
import { InstagramPreview } from './InstagramPreview';
import { useCreativePreviewData } from '@/hooks/useCreativePreviewData';

interface AllViewsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PreviewVariation {
  id: string;
  label: string;
  platform: 'facebook' | 'instagram';
  device: 'desktop' | 'mobile';
  adType: 'feed' | 'story' | 'reel';
  adFormat: 'original' | '1:1' | '4:5' | 'single_image';
}

export const AllViewsOverlay: React.FC<AllViewsOverlayProps> = ({ isOpen, onClose }) => {
  const { adData } = useCreativePreviewData();

  if (!isOpen) return null;

  const previewVariations: PreviewVariation[] = [
    // Facebook variations
    { id: 'fb-feed-desktop', label: 'Facebook Feed (Desktop)', platform: 'facebook', device: 'desktop', adType: 'feed', adFormat: 'original' },
    { id: 'fb-feed-mobile', label: 'Facebook Feed (Mobile)', platform: 'facebook', device: 'mobile', adType: 'feed', adFormat: 'original' },
    { id: 'fb-stories', label: 'Facebook Stories', platform: 'facebook', device: 'mobile', adType: 'story', adFormat: 'original' },
    { id: 'fb-reels', label: 'Facebook Reels', platform: 'facebook', device: 'mobile', adType: 'reel', adFormat: 'original' },

    // Instagram variations
    { id: 'ig-feed-desktop', label: 'Instagram Feed (Desktop)', platform: 'instagram', device: 'desktop', adType: 'feed', adFormat: 'original' },
    { id: 'ig-feed-mobile', label: 'Instagram Feed (Mobile)', platform: 'instagram', device: 'mobile', adType: 'feed', adFormat: 'original' },
    { id: 'ig-stories', label: 'Instagram Stories', platform: 'instagram', device: 'mobile', adType: 'story', adFormat: 'original' },
    { id: 'ig-reels', label: 'Instagram Reels', platform: 'instagram', device: 'mobile', adType: 'reel', adFormat: 'original' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between bg-white rounded-lg shadow-lg px-6 py-4">
          <div>
            <h2 className="text-20 font-semibold text-text-primary">All Preview Variations</h2>
            <p className="text-14 text-text-muted mt-1">
              Viewing {previewVariations.length} different placements and devices
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-100 transition-colors"
            title="Close preview"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {previewVariations.map((variation) => (
              <div key={variation.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Card Header */}
                <div className="px-4 py-3 border-b border-divider bg-surface-50">
                  <h3 className="text-13 font-semibold text-text-primary">{variation.label}</h3>
                  <p className="text-11 text-text-muted mt-0.5 capitalize">
                    {variation.device} • {variation.adFormat}
                  </p>
                </div>

                {/* Preview Container */}
                <div className="p-4 bg-canvas">
                  <div
                    className={`mx-auto ${
                      variation.device === 'mobile' ? 'max-w-[280px]' : 'max-w-[320px]'
                    } ${
                      variation.adType === 'story' || variation.adType === 'reel' ? 'aspect-story' : ''
                    }`}
                    style={{
                      transform: 'scale(0.85)',
                      transformOrigin: 'top center',
                    }}
                  >
                    {variation.platform === 'facebook' ? (
                      <FacebookPreview
                        device={variation.device}
                        adType={variation.adType}
                        adFormat={variation.adFormat}
                        adData={adData}
                      />
                    ) : (
                      <InstagramPreview
                        device={variation.device}
                        adType={variation.adType}
                        adFormat={variation.adFormat}
                        adData={adData}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="h-12" />
      </div>
    </div>
  );
};
