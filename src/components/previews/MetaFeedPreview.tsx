import React, { useState, memo, useCallback } from 'react';
import { Globe, Heart, MessageCircle, Share2 } from 'lucide-react';
import type { PreviewAdData, PreviewDevice } from '@/types/previews';

interface MetaFeedPreviewProps {
  device: PreviewDevice;
  adData: PreviewAdData;
  format: '1:1' | '4:5' | '9:16';
}

// Memoize to prevent unnecessary re-renders
export const MetaFeedPreview: React.FC<MetaFeedPreviewProps> = memo(({
  device,
  adData,
  format,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit);
  };

  return (
    <div className="meta-preview" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="bg-white rounded-md overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Header */}
        <div className="p-3 flex items-start gap-2.5">
          {/* Profile Image */}
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: 'var(--always-gray-95)' }}
          >
            {adData.profileImage ? (
              <img
                src={adData.profileImage}
                alt={adData.brandName}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adData.brandName)}&background=1877f2&color=fff&size=128`;
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--fb-logo)' }}
              >
                {adData.brandName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Page Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm leading-tight"
              style={{
                color: 'var(--text-input-outside-label)',
                fontFamily: 'var(--font-family-default)',
              }}
            >
              {adData.brandName}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3" style={{ color: 'var(--always-gray-40)' }} />
              <span
                className="text-xs"
                style={{ color: 'var(--always-gray-40)' }}
              >
                Sponsored · 2h
              </span>
            </div>
          </div>

          {/* Three Dots Menu */}
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--always-gray-95)' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--always-gray-40)' }}>
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
        </div>

        {/* Primary Text */}
        {adData.primaryText && (
          <div className="px-4 pb-3">
            <p
              className="text-sm leading-snug"
              style={{
                color: 'var(--text-input-outside-label)',
                fontFamily: 'var(--font-family-default)',
              }}
            >
              {isExpanded ? adData.primaryText : (
                <>
                  {truncateText(adData.primaryText, 125)}
                  {adData.primaryText.length > 125 && (
                    <>
                      ...{' '}
                      <button
                        onClick={() => setIsExpanded(true)}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--fb-logo)' }}
                      >
                        See more
                      </button>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        )}

        {/* Creative Image */}
        <div
          className={`relative overflow-hidden ${
            format === '1:1' ? 'aspect-square' :
            format === '4:5' ? 'aspect-4-5' :
            'aspect-square'
          }`}
          style={{ backgroundColor: 'var(--always-gray-95)' }}
        >
          {adData.creativeImage ? (
            <img
              src={adData.creativeImage}
              alt="Ad creative"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center" style={{ color: 'var(--always-gray-40)' }}>
                <div
                  className="w-16 h-16 rounded-lg mx-auto mb-2"
                  style={{ backgroundColor: 'var(--always-gray-95)' }}
                />
                <p className="text-sm">Ad Creative</p>
                <p className="text-xs uppercase tracking-wide">
                  {format} format
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Link Preview Card */}
        <div
          className="border-t"
          style={{
            borderColor: 'var(--divider)',
            backgroundColor: 'var(--always-gray-95)',
          }}
        >
          <div className="p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs uppercase mb-1 tracking-wide"
                style={{ color: 'var(--always-gray-40)' }}
              >
                {adData.displayLink}
              </p>
              <h4
                className="font-semibold text-base leading-tight mb-1"
                style={{
                  color: 'var(--text-input-outside-label)',
                  fontFamily: 'var(--font-family-default)',
                }}
              >
                {adData.headline}
              </h4>
              <p
                className="text-sm"
                style={{ color: 'var(--always-gray-40)' }}
              >
                {adData.description}
              </p>
            </div>
            <a
              href={adData.websiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded font-semibold text-sm flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: 'var(--always-gray-95)',
                color: 'var(--text-input-outside-label)',
                border: '1px solid var(--divider)',
              }}
            >
              {adData.callToAction}
            </a>
          </div>
        </div>

        {/* Engagement Buttons */}
        <div
          className="border-t p-1"
          style={{ borderColor: 'var(--divider)' }}
        >
          <div className="flex items-center">
            {[
              { icon: Heart, label: 'Like' },
              { icon: MessageCircle, label: 'Comment' },
              { icon: Share2, label: 'Share' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md flex-1 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--always-gray-40)' }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// Display name for React DevTools
MetaFeedPreview.displayName = 'MetaFeedPreview';
