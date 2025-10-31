import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { PreviewTabs } from '@/components/previews/PreviewTabs';
import { PreviewsGrid } from '@/components/previews/PreviewsGrid';
import type { PreviewPlatform, PreviewPlacement, PreviewAdData } from '@/types/previews';
import { API_BASE_URL } from '@/services/api';
import { Loader2 } from 'lucide-react';
import '@/styles/meta-tokens.css';

interface AdListItem {
  id: number;
  short_id: string;
  ad_name: string;
  primary_text: string;
  headline: string;
  description: string;
  call_to_action: string;
  destination_url: string;
  display_link: string;
  creative_file: {
    data: string;
    type: string;
    name: string;
    url?: string;
  } | null;
  creative_files?: {
    square?: { data: string; type: string; name: string; url?: string };
    vertical?: { data: string; type: string; name: string; url?: string };
  };
  preview_settings: {
    platform: 'facebook' | 'instagram';
    device: string;
    adType: string;
    adFormat: string;
  };
  brief?: {
    removeCharacterLimit?: boolean;
  };
}

interface AdvertiserData {
  advertiser: {
    id: number;
    username: string;
    page_id: string;
    page_data: {
      name: string;
      profile_picture?: string;
      image?: string;
      Images?: Array<{ type?: string; url?: string }>;
      instagram_details?: {
        result?: {
          profile_pic_url?: string;
        };
      };
    };
  };
  ads: AdListItem[];
}

export const PreviewsPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState<PreviewPlatform[]>(['facebook', 'instagram', 'messenger']);
  const [selectedPlacements, setSelectedPlacements] = useState<PreviewPlacement[]>(['feed', 'rightcolumn', 'story', 'reel', 'explore', 'instream', 'search', 'inbox']);
  const [advertiserData, setAdvertiserData] = useState<AdvertiserData | null>(null);
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch advertiser ads
  useEffect(() => {
    if (!identifier) {
      navigate('/');
      return;
    }

    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/advertiser/${identifier}`);

        if (!response.ok) {
          throw new Error('Failed to fetch advertiser data');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setAdvertiserData(result.data);

          // Select the first ad by default
          if (result.data.ads && result.data.ads.length > 0) {
            setSelectedAdId(result.data.ads[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [identifier, navigate]);

  // Generate adData from selected ad
  const adData: PreviewAdData = useMemo(() => {
    if (!advertiserData || !selectedAdId) {
      return {
        adName: '',
        primaryText: '',
        headline: 'Compelling headline',
        description: 'Short supporting copy',
        callToAction: 'Learn More',
        websiteUrl: '',
        displayLink: 'example.com',
        brandName: 'Your Brand',
        profileImage: '',
        creativeImage: '',
      };
    }

    const selectedAd = advertiserData.ads.find(ad => ad.id === selectedAdId);
    if (!selectedAd) {
      return {
        adName: '',
        primaryText: '',
        headline: 'Compelling headline',
        description: 'Short supporting copy',
        callToAction: 'Learn More',
        websiteUrl: '',
        displayLink: 'example.com',
        brandName: advertiserData.advertiser.page_data.name || 'Your Brand',
        profileImage: '',
        creativeImage: '',
      };
    }

    // Apply "See more" logic
    const applySeeMore = (text: string, removeLimit: boolean) => {
      if (!removeLimit) return text;
      if (text.length <= 140) return text;
      const visible = text.slice(0, 140).replace(/\s+$/, '');
      return `${visible}… See more`;
    };

    const primaryText = applySeeMore(
      selectedAd.primary_text || '',
      selectedAd.brief?.removeCharacterLimit || false
    );

    // Get profile image
    const pageData = advertiserData.advertiser.page_data;
    let profileImage = '';
    if (pageData.profile_picture) {
      profileImage = pageData.profile_picture;
    } else if (pageData.image) {
      profileImage = pageData.image;
    } else if (Array.isArray(pageData.Images)) {
      const imageEntry = pageData.Images.find(entry => entry?.type === 'facebook_profile_image');
      if (imageEntry?.url) profileImage = imageEntry.url;
    }
    if (!profileImage && pageData.instagram_details?.result?.profile_pic_url) {
      profileImage = pageData.instagram_details.result.profile_pic_url;
    }

    // Get creative image - prefer vertical for stories/reels, square for feed
    let creativeImage = '';
    const creativeFiles = selectedAd.creative_files || {};

    // Primary creative image - prefer vertical if available for 9:16 formats
    if (creativeFiles.vertical?.url) {
      creativeImage = creativeFiles.vertical.url;
    } else if (creativeFiles.square?.url) {
      creativeImage = creativeFiles.square.url;
    } else if (selectedAd.creative_file?.url) {
      creativeImage = selectedAd.creative_file.url;
    }

    return {
      adName: selectedAd.ad_name,
      primaryText,
      headline: selectedAd.headline || 'Compelling headline',
      description: selectedAd.description || 'Short supporting copy',
      callToAction: selectedAd.call_to_action || 'Learn More',
      websiteUrl: selectedAd.destination_url || '',
      displayLink: selectedAd.display_link || 'example.com',
      brandName: advertiserData.advertiser.page_data.name || selectedAd.ad_name || 'Your Brand',
      profileImage,
      creativeImage,
    };
  }, [advertiserData, selectedAdId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-16 text-text-secondary">Loading ads...</p>
        </div>
      </div>
    );
  }

  if (!advertiserData || !advertiserData.ads || advertiserData.ads.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-16 text-text-secondary">No ads found</p>
          <button
            onClick={() => navigate(`/advertiser/${identifier}`)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Back to Advertiser
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-divider">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-24 font-semibold text-text-primary mb-2">
                Comprehensive Ad Previews
              </h1>
              <p className="text-14 text-text-secondary">
                View your ad across all placements and platforms
              </p>
            </div>
            <button
              onClick={() => navigate(`/advertiser/${identifier}`)}
              className="px-4 py-2 text-14 font-medium text-text-secondary hover:text-text-primary border border-border rounded-md hover:bg-surface-100 transition-colors"
            >
              Back to Ads
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <PreviewTabs
        selectedPlatforms={selectedPlatforms}
        onPlatformsChange={setSelectedPlatforms}
        selectedPlacements={selectedPlacements}
        onPlacementsChange={setSelectedPlacements}
        ads={advertiserData.ads}
        selectedAdId={selectedAdId}
        onAdChange={setSelectedAdId}
      />

      {/* Previews Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <PreviewsGrid
          platforms={selectedPlatforms}
          placements={selectedPlacements}
          adData={adData}
        />
      </div>
    </div>
  );
};
