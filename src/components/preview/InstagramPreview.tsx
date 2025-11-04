import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, ChevronRight } from 'lucide-react';
import type { Device, AdType, AdFormat } from '@/types/creative';

interface InstagramPreviewProps {
  device: Device;
  adType: AdType;
  adFormat: AdFormat;
  adData: {
    adName: string;
    primaryText: string;
    headline: string;
    description: string;
    callToAction: string;
    websiteUrl: string;
    displayLink: string;
    brandName: string;
    profileImage: string;
    creativeImage: string;
  };
}

export const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  device: _device,
  adType,
  adFormat,
  adData
}) => {
  if (adType === 'story' || adType === 'reel') {
    return (
      <div className="bg-black rounded-lg aspect-story relative overflow-hidden">
        {adData.creativeImage ? (
          <img
            src={adData.creativeImage}
            alt="Ad creative"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Try fallback to base64 if available
              const fallback = (window as any).__creativeImageFallback;
              if (fallback && e.currentTarget.src !== fallback) {
                console.log('[InstagramPreview Story] Primary image failed, trying base64 fallback');
                e.currentTarget.src = fallback;
              } else {
                console.error('[InstagramPreview Story] Creative image failed to load:', e.currentTarget.src);
                e.currentTarget.style.display = 'none';
              }
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="text-sm mb-4">{adData.primaryText}</p>
            <a
              href={adData.websiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black px-6 py-2 rounded-full font-medium inline-block"
            >
              {adData.callToAction}
            </a>
          </div>
        </div>
        {!adData.creativeImage && (
          <div className="absolute inset-0 flex items-center justify-center text-white/60">
            <div className="text-center">
              <div className="w-24 h-24 bg-white/20 rounded-lg mx-auto mb-2" />
              <p className="text-sm font-medium">Story/Reel Preview</p>
              <p className="text-xs text-red-400 mt-2">Image not available</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-[12px] overflow-hidden shadow-card">
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full p-0.5">
            <div className="w-full h-full bg-surface-200 rounded-full overflow-hidden">
              {adData.profileImage && (
                <img
                  src={adData.profileImage}
                  alt={adData.brandName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adData.brandName)}&background=E4405F&color=fff&size=128`;
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-text-primary">@{adData.brandName.toLowerCase()}</span>
            <span className="text-xs text-text-muted">Sponsored</span>
          </div>
        </div>
        <button type="button" className="text-text-muted">
          <div className="w-1 h-1 bg-surface-400 rounded-full mb-1" />
          <div className="w-1 h-1 bg-surface-400 rounded-full mb-1" />
          <div className="w-1 h-1 bg-surface-400 rounded-full" />
        </button>
      </div>

      <div
        className={`bg-surface-200 flex items-center justify-center text-text-muted relative overflow-hidden ${
          adFormat === '1:1' ? 'aspect-square' :
          adFormat === '4:5' ? 'aspect-4-5' :
          'aspect-square'
        }`}
      >
        {adData.creativeImage ? (
          <img
            src={adData.creativeImage}
            alt="Ad creative"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Try fallback to base64 if available
              const fallback = (window as any).__creativeImageFallback;
              if (fallback && e.currentTarget.src !== fallback) {
                console.log('[InstagramPreview] Primary image failed, trying base64 fallback');
                e.currentTarget.src = fallback;
              } else {
                console.error('[InstagramPreview] Creative image failed to load:', e.currentTarget.src);
                e.currentTarget.style.display = 'none';
                // Show placeholder
                const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder');
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = 'block';
                }
              }
            }}
          />
        ) : null}
        <div className={`image-placeholder text-center absolute inset-0 flex items-center justify-center ${adData.creativeImage ? 'hidden' : ''}`}>
          <div>
            <div className="w-16 h-16 bg-surface-300 rounded-lg mx-auto mb-2" />
            <p className="text-sm font-medium">Ad Creative</p>
            <p className="text-xs uppercase tracking-wide text-text-muted mt-1">
              {adFormat === '1:1' ? '1080×1080' : adFormat} format
            </p>
            {!adData.creativeImage && (
              <p className="text-xs text-red-500 mt-2">Image not available</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-divider">
        <a
          href={adData.websiteUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-100 transition-colors"
        >
          <span>{adData.callToAction}</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-text-primary" />
            <MessageCircle className="w-6 h-6 text-text-primary" />
            <Send className="w-6 h-6 text-text-primary" />
          </div>
          <Bookmark className="w-6 h-6 text-text-primary" />
        </div>

        <p className="text-sm font-medium text-text-primary mb-2">234 likes</p>

        <div className="text-sm text-text-primary mb-3">
          <span className="font-medium">@{adData.brandName.toLowerCase()}</span>
          <span className="ml-1">{adData.primaryText}</span>
        </div>

        <p className="text-sm text-text-muted">View all 12 comments</p>
        <p className="text-xs text-text-muted mt-1">2 hours ago</p>
      </div>
    </div>
  );
};
