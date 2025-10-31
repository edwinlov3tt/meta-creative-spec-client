import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdvertiserHeader } from '@/components/advertiser/AdvertiserHeader';
import { AdGrid } from '@/components/advertiser/AdGrid';
import { AdvertiserInfo } from '@/components/advertiser/AdvertiserInfo';
import { CampaignGrid } from '@/components/campaign/CampaignGrid';
import { Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

type TabType = 'ads' | 'campaigns' | 'info';

interface AdvertiserData {
  advertiser: {
    id: number;
    username: string;
    page_id: string;
    page_data: {
      name: string;
      profile_picture?: string;
      cover_image?: string;
      category?: string;
      instagram_url?: string;
      instagram_details?: {
        result?: {
          username?: string;
        };
      };
    };
  };
  ads: Array<{
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
      data: string;
      type: string;
      name: string;
    } | null;
    primary_text: string;
    headline: string;
    brief?: {
      companyOverview?: string;
      facebookLink?: string;
      websiteUrl?: string;
      campaignObjective?: string;
      [key: string]: any;
    };
    ad_copy?: any;
  }>;
  stats: {
    total_ads: number;
    facebook_ads: number;
    instagram_ads: number;
    newest_ad_date: Date | null;
  };
}

export const AdvertiserPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdvertiserData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ads');

  const fetchAdvertiserData = async () => {
    if (!identifier) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/advertiser/${identifier}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Advertiser not found');
        }
        throw new Error('Failed to load advertiser data');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load advertiser data');
      }

      setData(result.data);
    } catch (err) {
      console.error('[AdvertiserPage] Error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertiserData();
  }, [identifier, navigate]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-meta-blue animate-spin mx-auto mb-4" />
          <p className="text-16 text-text-secondary">Loading advertiser...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-24 font-semibold text-text-primary mb-2">
            {error === 'Advertiser not found' ? 'Advertiser Not Found' : 'Error Loading Data'}
          </h2>
          <p className="text-14 text-text-secondary mb-6">
            {error || 'Unable to load advertiser data. Please try again.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-meta-blue text-white rounded-md text-14 font-medium hover:bg-blue-600 transition-colors"
          >
            Go to Builder
          </button>
        </div>
      </div>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ads':
        return (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <AdGrid
              ads={data.ads}
              advertiserIdentifier={identifier || ''}
              onAdDeleted={fetchAdvertiserData}
            />
          </div>
        );

      case 'campaigns':
        return (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <CampaignGrid advertiserIdentifier={identifier || ''} />
          </div>
        );

      case 'info':
        return (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <AdvertiserInfo
              advertiser={data.advertiser}
              companyOverview={data.ads[0]?.brief?.companyOverview}
              website={data.ads[0]?.brief?.websiteUrl}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Success State
  return (
    <div className="min-h-screen bg-surface-50">
      <AdvertiserHeader
        advertiser={data.advertiser}
        stats={data.stats}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {renderTabContent()}
    </div>
  );
};
