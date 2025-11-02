import React from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, X } from 'lucide-react';
import type { PreviewAdData } from '@/types/previews';

interface MetaInstreamPreviewProps {
  adData: PreviewAdData;
}

export const MetaInstreamPreview: React.FC<MetaInstreamPreviewProps> = ({
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
        className="bg-white rounded-md overflow-hidden w-full h-full flex flex-col"
        style={{}}
      >
        {/* Skeleton Header */}
        <div className="p-3 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-3 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
            <div className="h-2 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Main Video/Image Creative - Square 1:1 */}
        <div className="relative w-full" style={{ paddingBottom: '100%' }}>
          {adData.creativeImage ? (
            <img
              src={adData.creativeImage}
              alt="In-stream ad"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2" />
                <p className="text-sm">1:1 Video</p>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Section */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex gap-3">
            {/* Thumbnail */}
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              {adData.creativeImage ? (
                <img
                  src={adData.creativeImage}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>

            {/* Ad Content */}
            <div className="flex-1 min-w-0">
              {/* Headline */}
              <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                {truncateText(adData.headline, 60)}...
              </h3>

              {/* Sponsored + Display Link */}
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <span>Sponsored</span>
                <span>·</span>
                <span className="truncate">{adData.displayLink}</span>
              </div>

              {/* Primary Text - truncated */}
              <p className="text-xs text-gray-600 line-clamp-2">
                {truncateText(adData.primaryText, 80)}...
              </p>
            </div>

            {/* X and Ellipsis buttons */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
              <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Skeleton engagement section */}
        <div className="px-3 py-2 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="h-2 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-2 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-3 py-2 border-t border-gray-200">
          <div className="flex items-center justify-around">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
              <ThumbsUp className="w-5 h-5" />
              <span className="text-sm font-medium">Like</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Comment</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
