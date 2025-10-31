import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignCard } from './CampaignCard';
import { Plus, FolderKanban, Loader2 } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import type { CampaignCard as CampaignCardType } from '@/types/campaign';
import { API_BASE_URL } from '@/services/api';

interface CampaignGridProps {
  advertiserIdentifier: string;
}

export const CampaignGrid: React.FC<CampaignGridProps> = ({ advertiserIdentifier }) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/campaigns/${advertiserIdentifier}`);

        if (!response.ok) {
          throw new Error('Failed to fetch campaigns');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch campaigns');
        }

        setCampaigns(result.data.campaigns || []);
      } catch (err) {
        console.error('[CampaignGrid] Error fetching campaigns:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [advertiserIdentifier]);

  const handleCreateCampaign = () => {
    navigate(`/advertiser/${advertiserIdentifier}/campaign/new`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-meta-blue animate-spin mx-auto mb-4" />
          <p className="text-14 text-text-secondary">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-18 font-semibold text-text-primary mb-2">Error Loading Campaigns</h3>
          <p className="text-14 text-text-secondary mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
          <FolderKanban className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-20 font-semibold text-text-primary mb-2">
          No Campaigns Yet
        </h3>
        <p className="text-14 text-text-secondary max-w-md mb-6">
          Create your first campaign to group multiple ads together with shared objectives and dates.
        </p>
        <Button onClick={handleCreateCampaign} variant="meta">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>
    );
  }

  // Campaign grid
  return (
    <div>
      {/* Header with Create button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-20 font-semibold text-text-primary">Campaigns</h2>
          <p className="text-14 text-text-secondary mt-1">
            {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>
        <Button onClick={handleCreateCampaign} variant="meta" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Grid of campaign cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            advertiserIdentifier={advertiserIdentifier}
          />
        ))}
      </div>
    </div>
  );
};
