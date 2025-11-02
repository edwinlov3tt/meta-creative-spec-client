import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { PreviewAdData } from '@/types/previews';

interface MetaSearchPreviewProps {
  adData: PreviewAdData;
}

export const MetaSearchPreview: React.FC<MetaSearchPreviewProps> = ({
  adData,
}) => {
  // Truncate text helper
  const truncateText = (text: string, limit: number) => {
    if (!text || text.length <= limit) return text;
    return text.substring(0, limit);
  };

  return (
    <div className="meta-preview w-full h-full">
      <div
        className="flex items-center justify-center bg-gray-100 rounded-xl w-full h-full"
        style={{
          padding: '24px',
        }}
      >
        <div
          className="bg-white rounded-lg overflow-hidden w-full max-w-[300px]"
          style={{
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
        >
            {/* Image Section - Square 1:1 */}
            <div style={{ width: '100%', position: 'relative', paddingBottom: '100%' }}>
              {adData.creativeImage ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url("${adData.creativeImage}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
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
                  }}
                >
                  <div className="text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2" />
                    <p className="text-sm">1:1 Image</p>
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Profile Section */}
              <div className="flex items-start gap-2 mb-2">
                {/* Profile Image */}
                <div
                  className="flex-shrink-0 rounded-full border overflow-hidden"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderColor: 'rgb(235, 237, 240)',
                  }}
                >
                  {adData.profileImage ? (
                    <img
                      src={adData.profileImage}
                      alt={adData.brandName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300" />
                  )}
                </div>

                {/* Brand Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {truncateText(adData.brandName, 30)}
                  </p>
                </div>

                {/* Ellipsis Button */}
                <button className="flex-shrink-0">
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Headline */}
              <h3
                className="text-primary font-medium mb-2 overflow-hidden"
                style={{
                  fontSize: '15px',
                  lineHeight: '20px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  color: '#1877f2',
                }}
              >
                {adData.headline}
              </h3>

              {/* Sponsored Tag */}
              <p className="text-xs text-gray-500">Sponsored</p>
            </div>
        </div>
      </div>
    </div>
  );
};
