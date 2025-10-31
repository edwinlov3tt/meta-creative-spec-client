import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Copy, ExternalLink, Facebook, Instagram, Plus, Eye } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';
import { Button } from '@/components/UI/Button';

type TabType = 'ads' | 'campaigns' | 'info';

interface AdvertiserHeaderProps {
  advertiser: {
    username: string;
    page_id: string;
    page_data: {
      name: string;
      profile_picture?: string;
      category?: string;
    };
  };
  stats: {
    total_ads: number;
    facebook_ads: number;
    instagram_ads: number;
  };
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const AdvertiserHeader: React.FC<AdvertiserHeaderProps> = ({
  advertiser,
  stats,
  activeTab,
  onTabChange
}) => {
  const { page_data, page_id, username } = advertiser;
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Build Facebook page URL
  const facebookPageUrl = `https://facebook.com/${username}`;

  const handleCreateAd = () => {
    // Navigate to builder with advertiser identifier
    navigate(`/?advertiser=${username}`);
  };

  const handleCopyPageId = async () => {
    try {
      // Try modern Clipboard API first (requires HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(page_id);
        showToast('Page ID copied to clipboard', 'success');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for non-secure contexts (HTTP with IP address)
        const textArea = document.createElement('textarea');
        textArea.value = page_id;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showToast('Page ID copied to clipboard', 'success');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            throw new Error('Copy command failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Failed to copy page ID', 'error');
    }
  };

  // Build profile picture URL with fallbacks
  const getProfilePictureUrl = () => {
    // Try profile_picture field
    if (page_data.profile_picture && !page_data.profile_picture.includes('test.jpg')) {
      return page_data.profile_picture;
    }

    // Try image field as fallback
    const pageDataAny = page_data as any;
    if (pageDataAny.image && !pageDataAny.image.includes('test.jpg')) {
      return pageDataAny.image;
    }

    // Use Facebook Graph API as fallback
    if (pageDataAny.page_id || advertiser.username) {
      const identifier = pageDataAny.page_id || advertiser.username;
      return `https://graph.facebook.com/${encodeURIComponent(identifier)}/picture?type=large`;
    }

    return null;
  };

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <div className="bg-white border-b border-divider">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-14 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Builder
        </Link>

        {/* Advertiser Info */}
        <div className="flex items-start gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={page_data.name}
                className="w-24 h-24 rounded-xl object-cover border-2 border-border"
                onError={(e) => {
                  // If image fails to load, hide it and show fallback
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-24 h-24 rounded-xl bg-surface-200 flex items-center justify-center border-2 border-border"
              style={{ display: profilePictureUrl ? 'none' : 'flex' }}
            >
              <span className="text-32 font-semibold text-text-muted">
                {page_data.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Info and Stats */}
          <div className="flex-1 min-w-0">
            {/* Advertiser Name with Facebook Link */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <a
                  href={facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-32 font-bold text-text-primary hover:text-meta-blue transition-colors flex items-center gap-2 group"
                >
                  {page_data.name}
                  <ExternalLink className="w-5 h-5 text-text-muted group-hover:text-meta-blue transition-colors" />
                </a>

                {/* Page ID with Copy */}
                <button
                  onClick={handleCopyPageId}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all group",
                    copied
                      ? "bg-green-100 hover:bg-green-100"
                      : "hover:bg-surface-100"
                  )}
                  title="Copy Page ID"
                >
                  <span className={cn(
                    "text-14 italic font-normal transition-colors",
                    copied ? "text-green-700" : "text-text-muted"
                  )}>
                    {page_id}
                  </span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-600 transition-all" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate(`/advertiser/${username}/previews`)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ad Previews
                </Button>
                <Button
                  onClick={handleCreateAd}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ad
                </Button>
              </div>
            </div>

            {page_data.category && (
              <p className="text-14 text-text-secondary mb-4">
                {page_data.category}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4 border-t border-divider">
              <div className="flex items-center gap-2">
                <div className="text-24 font-semibold text-text-primary">
                  {stats.total_ads}
                </div>
                <div className="text-14 text-text-secondary">
                  {stats.total_ads === 1 ? 'Ad' : 'Ads'}
                </div>
              </div>

              {stats.facebook_ads > 0 && (
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-meta-blue" />
                  <div className="text-16 font-medium text-text-primary">
                    {stats.facebook_ads}
                  </div>
                </div>
              )}

              {stats.instagram_ads > 0 && (
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <div className="text-16 font-medium text-text-primary">
                    {stats.instagram_ads}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-8 border-b border-divider">
          <button
            onClick={() => onTabChange('ads')}
            className={cn(
              'px-4 py-3 text-14 font-medium transition-colors relative',
              activeTab === 'ads'
                ? 'text-meta-blue'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Ads
            {activeTab === 'ads' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-meta-blue" />
            )}
          </button>
          <button
            onClick={() => onTabChange('campaigns')}
            className={cn(
              'px-4 py-3 text-14 font-medium transition-colors relative',
              activeTab === 'campaigns'
                ? 'text-meta-blue'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Campaigns
            {activeTab === 'campaigns' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-meta-blue" />
            )}
          </button>
          <button
            onClick={() => onTabChange('info')}
            className={cn(
              'px-4 py-3 text-14 font-medium transition-colors relative',
              activeTab === 'info'
                ? 'text-meta-blue'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Advertiser Info
            {activeTab === 'info' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-meta-blue" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
