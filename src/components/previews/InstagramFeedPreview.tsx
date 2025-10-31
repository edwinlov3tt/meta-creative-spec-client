import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import type { PreviewAdData, PreviewDevice } from '@/types/previews';

interface InstagramFeedPreviewProps {
  device: PreviewDevice;
  adData: PreviewAdData;
  format: '1:1' | '4:5' | '9:16';
}

export const InstagramFeedPreview: React.FC<InstagramFeedPreviewProps> = ({
  device,
  adData,
  format,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit);
  };

  // Extract username from brand name
  const username = adData.brandName.toLowerCase().replace(/[^a-z0-9]/g, '');

  return (
    <div className="meta-preview" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{
          boxShadow: 'var(--card-box-shadow)',
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Instagram Header */}
        <div className="p-3 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden p-0.5"
            style={{
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
              {adData.profileImage ? (
                <img
                  src={adData.profileImage}
                  alt={adData.brandName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adData.brandName)}&background=1877f2&color=fff&size=128`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                  {adData.brandName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span
                className="font-semibold text-sm"
                style={{
                  color: 'var(--text-input-outside-label)',
                  fontFamily: 'var(--font-family-default)',
                }}
              >
                {username}
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--always-gray-40)' }}
              >
                · Sponsored
              </span>
            </div>
          </div>

          <button className="w-6 h-6 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--text-input-outside-label)' }}>
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
        </div>

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
              </div>
            </div>
          )}
        </div>

        {/* Instagram Actions */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Heart className="w-6 h-6" style={{ color: 'var(--text-input-outside-label)' }} />
              <MessageCircle className="w-6 h-6" style={{ color: 'var(--text-input-outside-label)' }} />
              <Send className="w-6 h-6" style={{ color: 'var(--text-input-outside-label)' }} />
            </div>
            <Bookmark className="w-6 h-6" style={{ color: 'var(--text-input-outside-label)' }} />
          </div>

          {/* Caption */}
          {adData.primaryText && (
            <div className="mb-2">
              <p
                className="text-sm leading-snug"
                style={{
                  color: 'var(--text-input-outside-label)',
                  fontFamily: 'var(--font-family-default)',
                }}
              >
                <span className="font-semibold mr-1">{username}</span>
                {isExpanded ? adData.primaryText : (
                  <>
                    {truncateText(adData.primaryText, 100)}
                    {adData.primaryText.length > 100 && (
                      <>
                        ...{' '}
                        <button
                          onClick={() => setIsExpanded(true)}
                          className="font-normal"
                          style={{ color: 'var(--always-gray-40)' }}
                        >
                          more
                        </button>
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          )}

          {/* CTA Button */}
          <a
            href={adData.websiteUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded-lg font-semibold text-sm mt-2"
            style={{
              backgroundColor: 'var(--fb-logo)',
              color: 'white',
            }}
          >
            {adData.callToAction}
          </a>
        </div>
      </div>
    </div>
  );
};
