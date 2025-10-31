import React from 'react';
import type { PreviewAdData } from '@/types/previews';

interface MetaRightColumnPreviewProps {
  adData: PreviewAdData;
}

export const MetaRightColumnPreview: React.FC<MetaRightColumnPreviewProps> = ({
  adData,
}) => {
  // Truncate text helper
  const truncateText = (text: string, limit: number) => {
    if (!text || text.length <= limit) return text;
    return text.substring(0, limit);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
          {/* Card Content */}
          <div
            className="cursor-pointer"
            style={{
              borderRadius: '6px',
              padding: '8px',
            }}
          >
            <div className="flex items-center">
              {/* Image - 55% width, maintaining 1:1 aspect ratio */}
              <div style={{ width: '55%', position: 'relative' }}>
                <div style={{ paddingBottom: '100%', position: 'relative' }}>
                  {adData.creativeImage ? (
                    <img
                      src={adData.creativeImage}
                      alt={adData.headline}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        border: '2px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center bg-gray-100"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: '2px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                      }}
                    >
                      <div className="text-center text-gray-400">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-1" />
                        <p className="text-xs">1:1</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div style={{ paddingLeft: '12px', flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: '-5px',
                    marginBottom: '-5px',
                  }}
                >
                  {/* Headline */}
                  <div
                    style={{
                      marginTop: '5px',
                      marginBottom: '5px',
                      fontSize: '16px',
                      color: 'rgb(8, 8, 9)',
                      fontWeight: 500,
                    }}
                  >
                    <span
                      style={{
                        wordBreak: 'break-word',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {truncateText(adData.headline, 40)}
                    </span>
                  </div>

                  {/* Display Link */}
                  <div
                    style={{
                      marginTop: '5px',
                      marginBottom: '5px',
                      fontSize: '14px',
                      color: 'rgb(101, 104, 108)',
                      textTransform: 'lowercase',
                    }}
                  >
                    <span
                      style={{
                        wordBreak: 'break-word',
                        maxWidth: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      {adData.displayLink}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
