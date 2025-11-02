import React, { useState, useMemo } from 'react';
import { Check, ExternalLink, Folder } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { CampaignSelect } from './CampaignSelect';
import { useCreativeStore } from '@/stores/creativeStore';
import { showToast } from '@/stores/toastStore';
import { canUseCampaignWorkflow } from '@/utils/zipParser';
import type { DetectedCreativeSet } from '@/utils/zipParser';
import { API_BASE_URL } from '@/services/api';

interface MultiSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sets: DetectedCreativeSet[];
  campaignContext?: {
    campaignId: number;
    campaignName: string;
    advertiserIdentifier: string;
  };
}

export const MultiSetModal: React.FC<MultiSetModalProps> = ({
  isOpen,
  onClose,
  sets,
  campaignContext,
}) => {
  const [selectedSets, setSelectedSets] = useState<Set<string>>(
    new Set(sets.map(set => set.name))
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | 'new' | null>(
    campaignContext ? campaignContext.campaignId : null
  );
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const storeState = useCreativeStore();
  const advertiserIdentifier = campaignContext?.advertiserIdentifier || storeState.advertiserIdentifier;

  // Check if campaign workflow is available
  // In campaign context mode, always allow campaign workflow
  const canUseCampaign = useMemo(() => {
    if (campaignContext) return true;
    return canUseCampaignWorkflow({
      facebook: storeState.facebook,
      brief: {
        websiteUrl: storeState.brief.websiteUrl,
        companyOverview: storeState.brief.companyOverview,
        campaignObjective: storeState.brief.campaignObjective,
      }
    });
  }, [campaignContext, storeState.facebook, storeState.brief]);

  const toggleSetSelection = (setName: string) => {
    setSelectedSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setName)) {
        newSet.delete(setName);
      } else {
        newSet.add(setName);
      }
      return newSet;
    });
  };

  const handleCampaignSelect = (campaignId: number | 'new', campaignName?: string) => {
    setSelectedCampaignId(campaignId);
    if (campaignId === 'new' && campaignName !== undefined) {
      setNewCampaignName(campaignName);
    }
  };

  const handleQuickCreate = async () => {
    setIsProcessing(true);
    try {
      const selectedSetsList = sets.filter(set => selectedSets.has(set.name));

      // Helper: Upload file to R2
      const uploadToR2 = async (file: File): Promise<string | null> => {
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64,
              filename: file.name,
              contentType: file.type
            })
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const data = await response.json();
          return data.success ? data.url : null;
        } catch (error) {
          console.error('[Quick Create] R2 upload failed:', error);
          return null;
        }
      };

      // Helper: Convert file to base64 for fallback
      const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      // Process each set and open tabs
      for (let i = 0; i < selectedSetsList.length; i++) {
        const set = selectedSetsList[i];

        // Generate unique ID for this creative set
        const creativeId = `creative_${Date.now()}_${i}`;

        // Build URL params object
        const params = new URLSearchParams();
        params.set('setName', set.name);

        // Open tab IMMEDIATELY (synchronously) to avoid popup blocker
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
          showToast('Please allow popups for this site', 'warning');
          continue;
        }

        // Try to upload to R2 first (primary method)
        let squareUrl: string | null = null;
        let verticalUrl: string | null = null;
        let useFallback = false;

        if (set.square) {
          squareUrl = await uploadToR2(set.square);
          if (!squareUrl) useFallback = true;
        }

        if (set.vertical) {
          verticalUrl = await uploadToR2(set.vertical);
          if (!verticalUrl) useFallback = true;
        }

        // If R2 upload succeeded, pass URLs via sessionStorage (small data)
        if (!useFallback && (squareUrl || verticalUrl)) {
          const creativeData: any = {
            setName: set.name,
            squareUrl,
            squareName: set.square?.name,
            verticalUrl,
            verticalName: set.vertical?.name
          };
          sessionStorage.setItem(creativeId, JSON.stringify(creativeData));
        } else {
          // Fallback: Use base64 in sessionStorage
          console.warn('[Quick Create] Using base64 fallback for set:', set.name);
          const creativeData: any = {
            setName: set.name,
            squareName: set.square?.name,
            verticalName: set.vertical?.name
          };

          if (set.square) {
            creativeData.square = await convertFileToBase64(set.square);
          }

          if (set.vertical) {
            creativeData.vertical = await convertFileToBase64(set.vertical);
          }

          sessionStorage.setItem(creativeId, JSON.stringify(creativeData));
        }

        // Update URL with creativeId after data is stored
        newWindow.location.href = `${window.location.origin}${window.location.pathname}?creativeId=${creativeId}`;

        // Small delay between opening tabs
        if (i < selectedSetsList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      showToast(`Opening ${selectedSetsList.length} new tabs for quick creation`, 'success');
      onClose();
    } catch (error) {
      console.error('Failed to create tabs:', error);
      showToast('Failed to open new tabs', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCampaignCreate = async () => {
    if (!canUseCampaign) {
      showToast('Please complete all required fields first', 'warning');
      return;
    }

    // When in campaign context, use campaignContext.campaignId directly
    const targetCampaignId = campaignContext ? campaignContext.campaignId : selectedCampaignId;
    const targetCampaignName = campaignContext ? undefined : (selectedCampaignId === 'new' ? newCampaignName : undefined);

    if (!campaignContext) {
      // Only validate selection if NOT in campaign context
      if (!selectedCampaignId) {
        showToast('Please select a campaign', 'warning');
        return;
      }

      if (selectedCampaignId === 'new' && !newCampaignName.trim()) {
        showToast('Please enter a campaign name', 'warning');
        return;
      }
    }

    setIsProcessing(true);
    try {
      const selectedSetsList = sets.filter(set => selectedSets.has(set.name));

      console.log('[MultiSetModal] Creating ads with:', {
        advertiserIdentifier,
        campaignId: targetCampaignId,
        campaignName: targetCampaignName,
        selectedSetsCount: selectedSetsList.length,
        isInCampaignContext: !!campaignContext
      });

      // Helper: Upload file to R2
      const uploadToR2 = async (file: File): Promise<string | null> => {
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const uploadResponse = await fetch(`${API_BASE_URL}/api/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64,
              filename: file.name,
              contentType: file.type
            })
          });

          if (!uploadResponse.ok) return null;
          const data = await uploadResponse.json();
          return data.success ? data.url : null;
        } catch (error) {
          console.error('[MultiSetModal] R2 upload failed:', error);
          return null;
        }
      };

      // Upload files to R2 and prepare ad specs
      const ads = [];
      for (const set of selectedSetsList) {
        const adData: any = {
          setName: set.name,
          creativeFiles: {}
        };

        // Upload square image if exists
        if (set.square) {
          const squareUrl = await uploadToR2(set.square);
          if (squareUrl) {
            adData.creativeFiles.square = {
              url: squareUrl,
              name: set.square.name,
              type: set.square.type
            };
          }
        }

        // Upload vertical image if exists
        if (set.vertical) {
          const verticalUrl = await uploadToR2(set.vertical);
          if (verticalUrl) {
            adData.creativeFiles.vertical = {
              url: verticalUrl,
              name: set.vertical.name,
              type: set.vertical.type
            };
          }
        }

        ads.push(adData);
      }

      // Call bulk create API
      const response = await fetch(`${API_BASE_URL}/api/campaigns/bulk-create-ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiserIdentifier,
          campaignId: typeof targetCampaignId === 'number' ? targetCampaignId : undefined,
          campaignName: targetCampaignName,
          ads,
          brief: {
            facebookLink: storeState.brief.facebookLink,
            websiteUrl: storeState.brief.websiteUrl,
            companyOverview: storeState.brief.companyOverview,
            campaignObjective: storeState.brief.campaignObjective || campaignContext?.campaignName,
            isFlighted: storeState.brief.isFlighted,
            flightStartDate: storeState.brief.flightStartDate,
            flightEndDate: storeState.brief.flightEndDate
          }
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create ads');
      }

      showToast(result.message || `${selectedSetsList.length} ads created successfully`, 'success');

      // Navigate to campaign page or close modal
      if (campaignContext) {
        // Already on campaign page, just close and let parent refresh
        onClose();
      } else if (advertiserIdentifier && result.campaign) {
        // Navigate to the new campaign
        window.location.href = `/advertiser/${advertiserIdentifier}/campaign/${result.campaign.short_id}`;
      } else {
        onClose();
      }
    } catch (error) {
      console.error('[MultiSetModal] Failed to create campaign ads:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create ads', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campaignContext ? `Add Ads to ${campaignContext.campaignName}` : "Multiple Creative Sets Detected"}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-13 text-text-primary">
            We found <strong>{sets.length} creative sets</strong> in your upload.
            {campaignContext ? (
              <> Select the sets below to add as draft ads to this campaign.</>
            ) : (
              <> The first set has been loaded into the current form. Select additional sets below to create more ads.</>
            )}
          </p>
        </div>

        {/* Sets Selection */}
        <div className="space-y-3">
          <label className="text-12 text-text-muted font-medium">
            Select Creative Sets ({selectedSets.size} selected)
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sets.map((set) => (
              <label
                key={set.name}
                className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSets.has(set.name)}
                  onChange={() => toggleSetSelection(set.name)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Folder className="w-4 h-4 text-text-muted flex-shrink-0" />
                    <span className="text-13 font-medium text-text-primary">
                      {set.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-11 text-text-muted">
                    {set.square && (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-600" />
                        1:1 Square
                      </span>
                    )}
                    {set.vertical && (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-purple-600" />
                        9:16 Vertical
                      </span>
                    )}
                    {!set.square && !set.vertical && (
                      <span className="text-text-muted italic">No valid images</span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Campaign Selection (Only if form is complete) */}
        {canUseCampaign && (
          <CampaignSelect
            advertiserIdentifier={advertiserIdentifier}
            onCampaignSelect={handleCampaignSelect}
            selectedCampaignId={selectedCampaignId}
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-200">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {/* Quick Create Option (Only available when NOT in campaign context) */}
            {!campaignContext && (
              <Button
                variant="outline"
                onClick={handleQuickCreate}
                disabled={isProcessing || selectedSets.size === 0}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Quick Create ({selectedSets.size} tabs)
              </Button>
            )}

            {/* Campaign Workflow Option (Only if form complete) */}
            {canUseCampaign && (
              <Button
                onClick={handleCampaignCreate}
                disabled={isProcessing || selectedSets.size === 0 || !selectedCampaignId}
              >
                {isProcessing ? 'Creating...' : `Add to Campaign (${selectedSets.size} ads)`}
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-11 text-text-muted space-y-1">
          {!campaignContext && (
            <p>
              <strong>Quick Create:</strong> Opens new tabs with pre-filled forms for manual review and submission.
            </p>
          )}
          {canUseCampaign ? (
            <p>
              <strong>{campaignContext ? 'Add to Campaign' : 'Create in Campaign'}:</strong> Automatically creates ads in the selected campaign without opening new tabs.
            </p>
          ) : !campaignContext && (
            <p className="text-text-muted italic">
              Complete all required fields (*) to unlock the Campaign workflow option.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
