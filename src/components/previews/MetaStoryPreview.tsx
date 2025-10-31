import React from 'react';
import { ChevronUp, MoreHorizontal, X, Link2 } from 'lucide-react';
import type { PreviewAdData, PreviewPlatform } from '@/types/previews';

interface MetaStoryPreviewProps {
  platform: PreviewPlatform;
  adData: PreviewAdData;
}

export const MetaStoryPreview: React.FC<MetaStoryPreviewProps> = ({
  platform,
  adData,
}) => {
  const [progressKey, setProgressKey] = React.useState(0);
  const [instagramFrame, setInstagramFrame] = React.useState<'default' | 'expanded'>('default');
  const [isTextExpanded, setIsTextExpanded] = React.useState(false);

  const username = platform === 'instagram'
    ? adData.brandName.toLowerCase().replace(/[^a-z0-9]/g, '')
    : adData.brandName;

  // Truncate text to 65 characters for Instagram Stories
  const truncateInstagramText = (text: string, limit: number = 65) => {
    if (!text || text.length <= limit) return text;
    return text.substring(0, limit);
  };

  // Progress bar animation for Messenger and Facebook Stories
  React.useEffect(() => {
    if (platform === 'instagram') return;

    const interval = setInterval(() => {
      setProgressKey((prev) => prev + 1);
    }, 7000); // Reset every 7 seconds

    return () => clearInterval(interval);
  }, [platform]);

  // Instagram Stories animation cycle
  React.useEffect(() => {
    if (platform !== 'instagram') return;

    const cycle = () => {
      // Default view (0-5s)
      setInstagramFrame('default');
      setProgressKey((prev) => prev + 1);

      setTimeout(() => {
        // Expanded view (5-12s)
        setInstagramFrame('expanded');
      }, 5000);
    };

    // Start cycle immediately
    cycle();

    // Repeat every 12 seconds
    const interval = setInterval(cycle, 12000);

    return () => clearInterval(interval);
  }, [platform]);

  // Determine CTA button style based on image brightness (simple heuristic)
  const getCtaStyle = () => {
    // Default to white for Messenger Stories
    return 'bg-white text-black';
  };

  // Messenger Stories Layout
  if (platform === 'messenger') {
    return (
      <div className="meta-preview">
        <div
          className="bg-black rounded-xl overflow-hidden aspect-story relative"
          style={{
            maxWidth: '360px',
          }}
        >
          {/* Progress Bar - 4px from top */}
          <div
            className="absolute left-0 right-0 z-20"
            style={{ top: '4px' }}
          >
            <div className="mx-2">
              <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  key={progressKey}
                  className="h-full bg-white rounded-full animate-progress"
                  style={{
                    animation: 'progressBar 7s linear forwards',
                  }}
                />
              </div>
            </div>
          </div>

          <style>{`
            @keyframes progressBar {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>

          {/* Story Content */}
          {adData.creativeImage && (
            <img
              src={adData.creativeImage}
              alt="Story ad"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ backgroundColor: '#000' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 pt-6 px-4 z-10">
            <div className="flex items-start gap-2">
              {/* Profile Image */}
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
                {adData.profileImage ? (
                  <img
                    src={adData.profileImage}
                    alt={adData.brandName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-gray-700">
                    {adData.brandName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Page Title + Sponsored */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {adData.brandName}
                </p>
                <p className="text-white/80 text-xs">Sponsored</p>
              </div>

              {/* Ellipsis */}
              <button className="w-8 h-8 flex items-center justify-center text-white flex-shrink-0">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Bottom CTA */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 z-10"
            style={{ paddingBottom: '20px' }}
          >
            {/* Up Arrow */}
            <div className="flex justify-center mb-3">
              <ChevronUp className="w-6 h-6 text-white" strokeWidth={3} />
            </div>

            {/* CTA Button - Pill shape, centered */}
            <div className="flex justify-center">
              <a
                href={adData.websiteUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block px-6 py-2 rounded-full font-semibold text-sm ${getCtaStyle()}`}
              >
                {adData.callToAction}
              </a>
            </div>
          </div>

          {/* Placeholder if no image */}
          {!adData.creativeImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/60">
                <div className="w-24 h-24 bg-white/20 rounded-lg mx-auto mb-2" />
                <p className="text-sm">Messenger Story</p>
                <p className="text-xs">9:16 Format</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Facebook & Instagram Stories Layout
  return (
    <div className="meta-preview">
      <div
        className="bg-black rounded-xl overflow-hidden aspect-story relative"
        style={{
          maxWidth: '360px',
        }}
      >
        {/* Progress Bar - Facebook and Instagram, 4px from top */}
        {(platform === 'facebook' || platform === 'instagram') && (
          <div
            className="absolute left-0 right-0 z-20"
            style={{ top: '4px' }}
          >
            <div className="mx-2">
              <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  key={progressKey}
                  className="h-full bg-white rounded-full"
                  style={{
                    animation: platform === 'instagram' ? 'progressBar 12s linear forwards' : 'progressBar 7s linear forwards',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes progressBar {
            from { width: 0%; }
            to { width: 100%; }
          }
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

        {/* Story Content */}
        {adData.creativeImage && (
          <img
            src={adData.creativeImage}
            alt="Story ad"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ backgroundColor: '#000' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 pt-6 px-4 z-10">
          <div className="flex items-center gap-2">
            {/* Profile Ring */}
            <div className={`w-10 h-10 rounded-full flex-shrink-0 ${platform === 'instagram' ? 'p-0.5' : ''}`}
              style={platform === 'instagram' ? {
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              } : undefined}
            >
              <div className={`w-full h-full rounded-full overflow-hidden ${platform === 'instagram' ? 'bg-black p-0.5' : ''}`}>
                {adData.profileImage ? (
                  <img
                    src={adData.profileImage}
                    alt={adData.brandName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-gray-700 rounded-full">
                    {adData.brandName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {platform === 'instagram' ? adData.brandName : username}
              </p>
              {platform !== 'instagram' && (
                <p className="text-white/80 text-xs">Sponsored</p>
              )}
            </div>

            {/* Close/More - Facebook and Instagram style horizontal with X */}
            {(platform === 'facebook' || platform === 'instagram') ? (
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center text-white">
                  <MoreHorizontal className="w-6 h-6" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center text-white">
                  <X className="w-6 h-6" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button className="w-8 h-8 flex items-center justify-center text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="6" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="18" r="1" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        {platform === 'instagram' ? (
          <>
            {/* Background overlay for expanded view */}
            {instagramFrame === 'expanded' && (
              <div
                className="absolute inset-x-0 bottom-0 h-64 z-5"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                  animation: 'fadeIn 0.5s ease-out forwards',
                }}
              />
            )}

            {/* Centered CTA Group for expanded view - positioned higher */}
            {instagramFrame === 'expanded' && (
              <div
                className="absolute left-0 right-0 px-4 z-10"
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  animation: 'fadeUp 0.6s ease-out forwards',
                }}
              >
                {/* Page Title and Display Link */}
                <div className="text-center mb-3">
                  <p className="text-white text-base font-semibold mb-0.5">{adData.brandName}</p>
                  <p className="text-white/90 text-sm">{adData.displayLink}</p>
                </div>

                {/* Pill-shaped CTA Button */}
                <div className="flex justify-center">
                  <a
                    href={adData.websiteUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>{adData.callToAction}</span>
                  </a>
                </div>
              </div>
            )}

            {/* Instagram Bottom Content - Post text always at same position */}
            <div className="absolute bottom-0 left-0 right-0 px-4 z-10" style={{ paddingBottom: '3.5rem' }}>
              {/* Post text - always at same position */}
              {adData.primaryText && (
                <div className="mb-3">
                  {isTextExpanded ? (
                    <p className="text-white text-sm leading-snug">
                      {adData.primaryText}
                    </p>
                  ) : (
                    <p className="text-white text-sm leading-snug">
                      {truncateInstagramText(adData.primaryText, 65)}
                      {adData.primaryText.length > 65 && (
                        <>
                          {'... '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsTextExpanded(true);
                            }}
                            className="text-white/80 hover:text-white transition-colors font-normal inline cursor-pointer"
                          >
                            more
                          </button>
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Default View - Up Arrow and CTA Button */}
              {instagramFrame === 'default' && (
                <>
                  {/* Up Arrow */}
                  <div className="flex justify-center mb-3">
                    <ChevronUp className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>

                  {/* CTA Button */}
                  <div className="flex justify-center">
                    <a
                      href={adData.websiteUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                      style={{ color: '#3858a8' }}
                    >
                      <Link2 className="w-5 h-5" />
                      <span>{adData.callToAction}</span>
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Sponsored tag - persistent at bottom left */}
            <div className="absolute bottom-6 left-4 z-10">
              <p className="text-white/70 text-xs">Sponsored</p>
            </div>
          </>
        ) : (
          /* Facebook Stories View */
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 z-10">
            {/* Primary Text - Only for Facebook and 1:1 images */}
            {platform === 'facebook' && adData.primaryText && (
              <div className="mb-4">
                <p className="text-white text-sm leading-snug">
                  {adData.primaryText}
                  {adData.primaryText.length > 100 && (
                    <span className="text-white/80"> ...More</span>
                  )}
                </p>
              </div>
            )}

            {/* Up Arrow */}
            <div className="flex justify-center mb-3">
              <ChevronUp className="w-6 h-6 text-white" strokeWidth={3} />
            </div>

            {/* CTA Button - Center aligned with link icon inside */}
            <div className="flex justify-center">
              <a
                href={adData.websiteUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                style={{ color: '#3858a8' }}
              >
                <Link2 className="w-5 h-5" />
                <span>{adData.callToAction}</span>
              </a>
            </div>
          </div>
        )}

        {/* Placeholder if no image */}
        {!adData.creativeImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/60">
              <div className="w-24 h-24 bg-white/20 rounded-lg mx-auto mb-2" />
              <p className="text-sm">Story Preview</p>
              <p className="text-xs">9:16 Format</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
