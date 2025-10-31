import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Facebook, Instagram, Edit } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';
import { API_BASE_URL } from '@/services/api';

interface AdCardProps {
  ad: {
    id: number;
    short_id: string;
    ad_name: string;
    created_at: Date;
    preview_settings: {
      platform: 'facebook' | 'instagram';
      device: string;
      adType: string;
      adFormat: string;
    };
    creative_file: {
      url?: string;
      data?: string;
      type: string;
      name: string;
    } | null;
    primary_text: string;
    headline: string;
  };
  advertiserIdentifier: string;
  onDelete?: () => void;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, advertiserIdentifier, onDelete }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const creativeImageUrl = useMemo(() => {
    if (!ad.creative_file) return null;

    // Prefer R2 URL over base64
    if (ad.creative_file.url) {
      return ad.creative_file.url;
    }

    // Fallback to base64 data
    if (ad.creative_file.data && ad.creative_file.type) {
      const fileData = ad.creative_file.data;
      // If it's already a URL, return it
      if (fileData.startsWith('http') || fileData.startsWith('blob:')) {
        return fileData;
      }

      // Otherwise it's base64, create a data URL
      return `data:${ad.creative_file.type};base64,${fileData}`;
    }

    return null;
  }, [ad.creative_file]);

  const formattedDate = useMemo(() => {
    const date = new Date(ad.created_at);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }, [ad.created_at]);

  const previewUrl = `/preview/${advertiserIdentifier}/ad/${ad.short_id}`;

  const handleCardClick = () => {
    navigate(previewUrl);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${ad.ad_name || 'this ad'}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`${API_BASE_URL}/api/ad/${advertiserIdentifier}/${ad.short_id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete ad');
      }

      showToast('Ad deleted successfully', 'success');

      // Call the onDelete callback to refresh the list
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete ad:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete ad', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit/${advertiserIdentifier}/${ad.short_id}`);
  };

  const platformIcon = ad.preview_settings.platform === 'facebook'
    ? <Facebook className="w-3.5 h-3.5" />
    : <Instagram className="w-3.5 h-3.5" />;

  const platformColor = ad.preview_settings.platform === 'facebook'
    ? 'bg-meta-blue text-white'
    : 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white';

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white border border-border rounded-card overflow-hidden shadow-1 hover:shadow-2 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
    >
      {/* Creative Thumbnail */}
      <div
        className={cn(
          'bg-surface-200 flex items-center justify-center overflow-hidden relative',
          ad.preview_settings.adFormat === '1:1' ? 'aspect-square' :
          ad.preview_settings.adFormat === '4:5' ? 'aspect-4-5' :
          'aspect-square'
        )}
      >
        {creativeImageUrl ? (
          <img
            src={creativeImageUrl}
            alt={ad.ad_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-surface-300 rounded-lg mx-auto mb-2" />
            <p className="text-sm text-text-muted">No Creative</p>
          </div>
        )}

        {/* Platform Badge */}
        <div className={cn('absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1', platformColor)}>
          {platformIcon}
          <span className="capitalize">{ad.preview_settings.platform}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-2">
        {/* Ad Name */}
        <h3 className="font-semibold text-14 text-text-primary line-clamp-1">
          {ad.ad_name || 'Untitled Ad'}
        </h3>

        {/* Headline Preview */}
        <p className="text-12 text-text-secondary line-clamp-2">
          {ad.headline || ad.primary_text || 'No headline'}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-11 text-text-muted pt-2 border-t border-divider">
          <span className="capitalize">
            {ad.preview_settings.adType} · {ad.preview_settings.adFormat}
          </span>
          <span>{formattedDate}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleCardClick}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-surface-100 hover:bg-surface-200 text-text-primary rounded-md text-12 font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={handleEditClick}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-12 font-medium transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-12 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
