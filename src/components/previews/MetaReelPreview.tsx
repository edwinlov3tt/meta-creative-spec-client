import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, Play, Share2, MoreHorizontal } from 'lucide-react';
import type { PreviewAdData, PreviewPlatform } from '@/types/previews';

interface MetaReelPreviewProps {
  platform: PreviewPlatform;
  adData: PreviewAdData;
}

export const MetaReelPreview: React.FC<MetaReelPreviewProps> = ({
  platform,
  adData,
}) => {
  const [isTextExpanded, setIsTextExpanded] = React.useState(false);

  // Instagram animation states
  const [instagramFrame, setInstagramFrame] = React.useState<'transparent' | 'solid' | 'expanded'>('transparent');

  const username = platform === 'instagram'
    ? adData.brandName.toLowerCase().replace(/[^a-z0-9]/g, '')
    : adData.brandName;

  // Truncate text to 30 characters for collapsed view
  const truncateText = (text: string, limit: number = 30) => {
    if (!text || text.length <= limit) return text;
    return text.substring(0, limit);
  };

  // Instagram Reels animation cycle
  React.useEffect(() => {
    if (platform !== 'instagram') return;

    const cycle = () => {
      // Transparent button (0-5s)
      setInstagramFrame('transparent');

      setTimeout(() => {
        // Solid white button (5-10s)
        setInstagramFrame('solid');
      }, 5000);

      setTimeout(() => {
        // Expanded CTA (10-30s)
        setInstagramFrame('expanded');
      }, 10000);
    };

    // Start cycle immediately
    cycle();

    // Repeat every 30 seconds
    const interval = setInterval(cycle, 30000);

    return () => clearInterval(interval);
  }, [platform]);

  return (
    <div className="meta-preview w-full h-full">
      <div
        className="bg-black rounded-md overflow-hidden relative w-full h-full"
      >
        {/* Reel Content */}
        {adData.creativeImage && (
          <img
            src={adData.creativeImage}
            alt="Reel ad"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ backgroundColor: '#000' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {/* Play Icon Overlay */}
        {adData.creativeImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Facebook Reels Layout */}
        {platform === 'facebook' ? (
          <>
            {/* Bottom Container - Contains both left content and right actions column */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="flex">
                {/* Left Side - Content (Red, Orange, Green, Gray sections) */}
                <div className="flex-1 px-4 py-3">
                  {/* Profile Image + Brand Name (horizontal) - RED */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
                      {adData.profileImage ? (
                        <img
                          src={adData.profileImage}
                          alt={adData.brandName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-gray-700">
                          {adData.brandName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p className="text-white font-semibold text-sm truncate flex-1 min-w-0">
                      {adData.brandName}
                    </p>
                  </div>

                  {/* Primary Text (collapsed with ...more) - ORANGE */}
                  <div className="mb-2.5 relative z-10">
                    {isTextExpanded ? (
                      <p className="text-white text-sm leading-snug">
                        {adData.primaryText || adData.headline}
                      </p>
                    ) : (
                      <p className="text-white text-sm leading-snug">
                        {truncateText(adData.primaryText || adData.headline, 30)}
                        {(adData.primaryText || adData.headline || '').length > 30 && (
                          <>
                            {'... '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsTextExpanded(true);
                              }}
                              className="text-white/80 hover:text-white transition-colors font-normal inline cursor-pointer relative z-20"
                            >
                              more
                            </button>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* CTA Button - Full Width - GREEN */}
                  <a
                    href={adData.websiteUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-black px-4 py-2.5 rounded-lg font-semibold text-sm text-center hover:bg-gray-100 transition-colors mb-2"
                  >
                    {adData.callToAction}
                  </a>

                  {/* Sponsored Tag - GRAY */}
                  <p className="text-white/70 text-xs">Sponsored</p>
                </div>

                {/* Right Side Actions Column - PURPLE - Aligned from bottom */}
                <div
                  className="w-14 flex flex-col justify-end items-center gap-5"
                  style={{
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    paddingRight: '0.50rem'
                  }}
                >
                  <button className="w-9 h-9 flex items-center justify-center text-white transition-opacity hover:opacity-80">
                    <Share2 className="w-6 h-6" />
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center text-white transition-opacity hover:opacity-80">
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Instagram Reels Layout - Animated */}

            {/* Bottom Container - Contains both left content and right actions column */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="flex">
                {/* Left Side - Content */}
                <div className="flex-1 pl-4 pr-2 py-3 min-w-0">
                  {/* Profile Image + Page Name + Follow Button - ALWAYS VISIBLE (RED) */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                      {adData.profileImage ? (
                        <img
                          src={adData.profileImage}
                          alt={adData.brandName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-gradient-to-br from-purple-500 to-pink-500">
                          {adData.brandName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p className="text-white font-semibold text-sm truncate flex-1 min-w-0">
                      {adData.brandName}
                    </p>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                      Follow
                    </button>
                  </div>

                  {/* Animated CTA Section */}
                  {instagramFrame === 'expanded' ? (
                    /* Frame 2: Expanded CTA Container */
                    <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 transition-all duration-500 mb-2">
                      {/* Thumbnail + Headline (SIDE BY SIDE) */}
                      <div className="flex gap-3 items-center mb-3">
                        {/* 1:1 Thumbnail Preview - LIGHT BLUE (Always visible) */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-600">
                          {adData.creativeImage ? (
                            <img
                              src={adData.creativeImage}
                              alt="Ad preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-12 h-12 bg-gray-500 rounded-md" />
                            </div>
                          )}
                        </div>

                        {/* Headline - YELLOW */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[11px] font-medium leading-snug">
                            {adData.headline}
                          </p>
                        </div>
                      </div>

                      {/* CTA Button - GREEN */}
                      <a
                        href={adData.websiteUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-white text-black px-4 py-2.5 rounded-lg font-semibold text-sm text-center hover:bg-gray-100 transition-colors"
                      >
                        {adData.callToAction}
                      </a>
                    </div>
                  ) : (
                    /* Frame 1: Simple CTA (transparent or solid) - GREEN - FULL WIDTH */
                    <a
                      href={adData.websiteUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block w-full px-4 py-2 rounded-lg font-semibold text-sm text-center transition-all duration-500 mb-2 ${
                        instagramFrame === 'transparent'
                          ? 'bg-transparent border-2 border-white text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {adData.callToAction}
                    </a>
                  )}

                  {/* Primary Text - ALWAYS VISIBLE - BELOW CTA (ORANGE) */}
                  <p className="text-white text-sm leading-snug mb-1">
                    {adData.primaryText || adData.headline}
                  </p>

                  {/* Sponsored Tag - ALWAYS VISIBLE (GRAY) */}
                  <p className="text-white/70 text-xs">Sponsored</p>
                </div>

                {/* Right Side Actions Column - PURPLE - Instagram style icons ONLY */}
                <div
                  className="w-14 flex flex-col justify-end items-center gap-4"
                  style={{
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    paddingRight: '0.50rem'
                  }}
                >
                  <button className="text-white transition-opacity hover:opacity-80">
                    <Heart className="w-7 h-7" />
                  </button>
                  <button className="text-white transition-opacity hover:opacity-80">
                    <MessageCircle className="w-7 h-7" />
                  </button>
                  <button className="text-white transition-opacity hover:opacity-80">
                    <Send className="w-7 h-7" />
                  </button>
                  <button className="text-white transition-opacity hover:opacity-80">
                    <MoreHorizontal className="w-7 h-7" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Placeholder if no image */}
        {!adData.creativeImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/60">
              <div className="w-24 h-24 bg-white/20 rounded-lg mx-auto mb-2" />
              <p className="text-sm">Reel Preview</p>
              <p className="text-xs">9:16 Format</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
