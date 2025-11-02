import React, { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import { formatDate } from '@/utils/date';
import { showToast } from '@/stores/toastStore';
import { API_BASE_URL } from '@/services/api';
import type { Campaign } from '@/types/campaign';

interface CampaignSelectProps {
  advertiserIdentifier: string | null;
  onCampaignSelect: (campaignId: number | 'new', campaignName?: string) => void;
  selectedCampaignId: number | 'new' | null;
}

export const CampaignSelect: React.FC<CampaignSelectProps> = ({
  advertiserIdentifier,
  onCampaignSelect,
  selectedCampaignId,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCampaignInput, setShowNewCampaignInput] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');

  useEffect(() => {
    if (!advertiserIdentifier) return;

    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/campaigns/${advertiserIdentifier}`);
        if (!response.ok) {
          throw new Error('Failed to fetch campaigns');
        }
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        showToast('Failed to load campaigns', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCampaigns();
  }, [advertiserIdentifier]);

  const handleNewCampaignClick = () => {
    setShowNewCampaignInput(true);
    setNewCampaignName('');
    onCampaignSelect('new', '');
  };

  const handleNewCampaignNameChange = (name: string) => {
    setNewCampaignName(name);
    onCampaignSelect('new', name);
  };

  if (!advertiserIdentifier) {
    return null;
  }

  return (
    <div className="space-y-3">
      <label className="text-12 text-text-muted font-medium">
        Select Campaign or Create New
      </label>

      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Spinner size="sm" className="mr-2" />
          <span className="text-13 text-text-muted">Loading campaigns...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Existing Campaigns */}
          {campaigns.length > 0 && (
            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <label
                  key={campaign.id}
                  className="flex items-start gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="campaign"
                    value={campaign.id}
                    checked={selectedCampaignId === campaign.id}
                    onChange={() => onCampaignSelect(campaign.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-13 font-medium text-text-primary">
                      {campaign.name}
                    </div>
                    {campaign.campaign_objective && (
                      <div className="text-11 text-text-muted mt-0.5">
                        {campaign.campaign_objective}
                      </div>
                    )}
                    {(campaign.start_date || campaign.end_date) && (
                      <div className="text-11 text-text-muted mt-0.5">
                        {campaign.start_date && formatDate(campaign.start_date)}
                        {campaign.start_date && campaign.end_date && ' - '}
                        {campaign.end_date && formatDate(campaign.end_date)}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Create New Campaign Option */}
          {!showNewCampaignInput ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewCampaignClick}
              className="w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Campaign
            </Button>
          ) : (
            <div className="p-3 border border-meta-blue rounded-lg bg-blue-50">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="campaign"
                  value="new"
                  checked={selectedCampaignId === 'new'}
                  onChange={() => onCampaignSelect('new', newCampaignName)}
                  className="mt-2.5"
                />
                <div className="flex-1 space-y-2">
                  <div className="text-13 font-medium text-text-primary">
                    Create New Campaign
                  </div>
                  <input
                    type="text"
                    value={newCampaignName}
                    onChange={(e) => handleNewCampaignNameChange(e.target.value)}
                    placeholder="Enter campaign name..."
                    className="form-input w-full"
                    autoFocus
                  />
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      {campaigns.length === 0 && !isLoading && (
        <p className="text-12 text-text-muted text-center py-4">
          No campaigns yet. Create your first campaign to get started.
        </p>
      )}
    </div>
  );
};
