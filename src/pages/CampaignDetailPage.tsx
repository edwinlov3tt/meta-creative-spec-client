import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Share2, Calendar, Target, Loader2, AlertCircle, Trash2, Upload, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { MultiSetModal } from '@/components/campaign/MultiSetModal';
import { parseCreativeSets } from '@/utils/zipParser';
import { formatDate } from '@/utils/date';
import { showToast } from '@/stores/toastStore';
import { API_BASE_URL } from '@/services/api';
import type { CampaignWithAds } from '@/types/campaign';
import type { DetectedCreativeSet } from '@/utils/zipParser';

export const CampaignDetailPage: React.FC = () => {
  const { identifier, campaignId } = useParams<{ identifier: string; campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignWithAds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMultiSetModal, setShowMultiSetModal] = useState(false);
  const [detectedSets, setDetectedSets] = useState<DetectedCreativeSet[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!identifier || !campaignId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/campaigns/${identifier}/${campaignId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch campaign');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch campaign');
        }

        setCampaign(result.data.campaign);
      } catch (err) {
        console.error('[CampaignDetailPage] Error fetching campaign:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [identifier, campaignId]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/advertiser/${identifier}/campaign/${campaignId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Campaign link copied to clipboard', 'success');
    } catch (err) {
      console.error('Failed to copy link:', err);
      showToast('Failed to copy link', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign? Ads will not be deleted, only ungrouped.')) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`${API_BASE_URL}/api/campaigns/${identifier}/${campaignId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete campaign');
      }

      showToast('Campaign deleted successfully', 'success');
      navigate(`/advertiser/${identifier}`);
    } catch (err) {
      console.error('[CampaignDetailPage] Error deleting campaign:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete campaign', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddAds = () => {
    fileInputRef.current?.click();
  };

  const handleCreateAd = () => {
    navigate(`/?advertiser=${identifier}&campaign=${campaignId}`);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      showToast('Please upload a ZIP file', 'error');
      return;
    }

    try {
      setIsUploading(true);

      // Parse zip file for creative sets
      const sets = await parseCreativeSets(file);

      if (sets.length === 0) {
        showToast('No valid creative sets found in ZIP file', 'warning');
        return;
      }

      // Show multi-set modal with detected sets
      setDetectedSets(sets);
      setShowMultiSetModal(true);
      showToast(`${sets.length} creative sets detected`, 'success');
    } catch (error) {
      console.error('[CampaignDetailPage] Failed to parse zip file:', error);
      showToast('Failed to parse ZIP file', 'error');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMultiSetModalClose = async () => {
    setShowMultiSetModal(false);
    // Refetch campaign data to show new ads
    if (identifier && campaignId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/campaigns/${identifier}/${campaignId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCampaign(result.data.campaign);
          }
        }
      } catch (error) {
        console.error('[CampaignDetailPage] Failed to refresh campaign:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-meta-blue animate-spin mx-auto mb-4" />
          <p className="text-16 text-text-secondary">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-24 font-semibold text-text-primary mb-2">Campaign Not Found</h2>
          <p className="text-14 text-text-secondary mb-6">
            {error || "The campaign you're looking for doesn't exist."}
          </p>
          <Button onClick={() => navigate(`/advertiser/${identifier}`)} variant="outline">
            Go to Advertiser
          </Button>
        </div>
      </div>
    );
  }

  const startDate = campaign.start_date ? formatDate(campaign.start_date) : null;
  const endDate = campaign.end_date ? formatDate(campaign.end_date) : null;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            to={`/advertiser/${identifier}`}
            className="inline-flex items-center gap-2 text-14 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Advertiser
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-28 font-bold text-text-primary mb-2">{campaign.name}</h1>

              {campaign.campaign_objective && (
                <p className="text-16 text-text-secondary mb-4">{campaign.campaign_objective}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-14 text-text-muted">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>{campaign.ad_count} {campaign.ad_count === 1 ? 'Ad' : 'Ads'}</span>
                </div>

                {(startDate || endDate) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {startDate && endDate ? (
                        `${startDate} - ${endDate}`
                      ) : startDate ? (
                        `Starts ${startDate}`
                      ) : (
                        `Ends ${endDate}`
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCreateAd}
                variant="default"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Ad
              </Button>
              <Button
                onClick={handleAddAds}
                variant="outline"
                size="sm"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Add from Zip
                  </>
                )}
              </Button>
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {campaign.ads.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-18 font-semibold text-text-primary mb-2">No Ads Yet</h3>
            <p className="text-14 text-text-secondary">
              Add ads to this campaign to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {campaign.ads.map((ad) => {
              // Check if ad is a draft (missing required ad copy fields)
              const isDraft = !ad.ad_copy?.primary_text || !ad.ad_copy?.headline;
              const targetUrl = isDraft
                ? `/edit/${identifier}/${ad.short_id}`
                : `/preview/${identifier}/ad/${ad.short_id}`;

              return (
                <Link
                  key={ad.id}
                  to={targetUrl}
                  className="group block bg-white rounded-lg border border-border hover:border-meta-blue hover:shadow-md transition-all relative"
                >
                  {/* Ad Preview */}
                  <div className="relative">
                    {(ad.creative_file?.url || ad.creative_file?.data) ? (
                      <div className="aspect-square overflow-hidden rounded-t-lg bg-surface-100">
                        <img
                          src={ad.creative_file.url || ad.creative_file.data}
                          alt={ad.ad_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-surface-100 rounded-t-lg flex items-center justify-center">
                        <Target className="w-12 h-12 text-text-muted opacity-50" />
                      </div>
                    )}

                    {/* Draft Badge */}
                    {isDraft && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-10 font-bold rounded-md">
                        DRAFT
                      </div>
                    )}

                    {/* Generate Button Overlay (only for drafts) */}
                    {isDraft && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center">
                        <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                          <Sparkles className="w-4 h-4 text-meta-blue" />
                          <span className="text-13 font-medium text-text-primary">Generate Ad Copy</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ad Info */}
                  <div className="p-4">
                    <h4 className="text-14 font-semibold text-text-primary mb-1 line-clamp-2 group-hover:text-meta-blue transition-colors">
                      {ad.ad_name || 'Untitled Ad'}
                    </h4>
                    <p className="text-12 text-text-muted capitalize">
                      {ad.preview_settings.platform} • {ad.preview_settings.adType}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Multi-Set Modal */}
      {campaign && (
        <MultiSetModal
          isOpen={showMultiSetModal}
          onClose={handleMultiSetModalClose}
          sets={detectedSets}
          campaignContext={{
            campaignId: campaign.id,
            campaignName: campaign.name,
            advertiserIdentifier: identifier!
          }}
        />
      )}
    </div>
  );
};
