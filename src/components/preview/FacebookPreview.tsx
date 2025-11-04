import React, { useState } from 'react';
import { Globe, Heart, MessageCircle, Share } from 'lucide-react';
import { useCreativeStore } from '@/stores/creativeStore';
import type { Device, AdType, AdFormat } from '@/types/creative';

interface FacebookPreviewProps {
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

export const FacebookPreview: React.FC<FacebookPreviewProps> = ({
  device: _device,
  adType,
  adFormat,
  adData
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const adCopy = useCreativeStore(state => state.adCopy);
  const forceExpandText = useCreativeStore(state => state.preview.forceExpandText);
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
                console.log('[FacebookPreview Story] Primary image failed, trying base64 fallback');
                e.currentTarget.src = fallback;
              } else {
                console.error('[FacebookPreview Story] Creative image failed to load:', e.currentTarget.src);
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
      <div className="p-3 flex items-start gap-2">
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-surface-200">
          {adData.profileImage ? (
            <img
              src={adData.profileImage}
              alt={adData.brandName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adData.brandName)}&background=1877f2&color=fff&size=128`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-meta-blue">
              {adData.brandName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-text-primary">{adData.brandName}</h3>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-text-muted" />
            <span className="text-xs text-text-muted">Sponsored</span>
            <span className="text-xs text-text-muted">· 2h</span>
          </div>
        </div>
      </div>

      {adData.primaryText && (
        <div className="px-3 pb-2">
          <p className="text-sm text-text-primary">
            {(isExpanded || forceExpandText) ? adCopy.primaryText : (
              <>
                {adData.primaryText.length > 125
                  ? `${adData.primaryText.substring(0, 125)}... `
                  : adData.primaryText}
                {adData.primaryText.length > 125 && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="text-meta-blue font-medium cursor-pointer hover:underline"
                  >
                    See more
                  </button>
                )}
              </>
            )}
          </p>
        </div>
      )}

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
                console.log('[FacebookPreview] Primary image failed, trying base64 fallback');
                e.currentTarget.src = fallback;
              } else {
                // No fallback available, hide image
                console.error('[FacebookPreview] Creative image failed to load:', e.currentTarget.src);
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

      <div className="border-t border-divider bg-surface-50">
        <div className="p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted uppercase mb-1">{adData.displayLink}</p>
            <h4 className="font-medium text-sm text-text-primary mb-1">{adData.headline}</h4>
            <p className="text-xs text-text-secondary">{adData.description}</p>
          </div>
          <a
            href={adData.websiteUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-surface-200 text-text-primary text-xs px-3 py-1.5 rounded font-medium hover:bg-surface-300 flex-shrink-0"
          >
            {adData.callToAction}
          </a>
        </div>
      </div>

      <div className="border-t border-divider p-2">
        <div className="flex items-center justify-around">
          <button className="flex items-center gap-1 text-text-secondary hover:bg-surface-100 px-3 py-2 rounded-md flex-1 justify-center text-sm">
            <Heart className="w-4 h-4" />
            Like
          </button>
          <button className="flex items-center gap-1 text-text-secondary hover:bg-surface-100 px-3 py-2 rounded-md flex-1 justify-center text-sm">
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>
          <button className="flex items-center gap-1 text-text-secondary hover:bg-surface-100 px-3 py-2 rounded-md flex-1 justify-center text-sm">
            <Share className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};
