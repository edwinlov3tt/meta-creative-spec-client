import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/UI/Spinner';
import { Button } from '@/components/UI/Button';
import { Header } from '@/components/Layout/Header';
import { AlertCircle, CheckCircle2, Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import { ToastContainer } from '@/components/UI/ToastContainer';
import { API_BASE_URL } from '@/services/api';
import type {
  MetaCampaign,
  MetaAdSet,
  CampaignObjective,
  SpecialAdCategory,
  CallToActionType,
  MetaPushPayload,
  MetaPushResponse,
  BudgetType,
} from '@/types/meta';

const OBJECTIVES: { value: CampaignObjective; label: string }[] = [
  { value: 'OUTCOME_TRAFFIC', label: 'Traffic' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
  { value: 'OUTCOME_AWARENESS', label: 'Awareness' },
  { value: 'OUTCOME_LEADS', label: 'Leads' },
  { value: 'OUTCOME_SALES', label: 'Sales' },
];

const SPECIAL_AD_CATEGORIES: { value: SpecialAdCategory; label: string }[] = [
  { value: 'CREDIT', label: 'Credit' },
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'HOUSING', label: 'Housing' },
  { value: 'ISSUES_ELECTIONS_POLITICS', label: 'Issues, Elections, Politics' },
];

interface AdData {
  ad: {
    id: number;
    short_id: string;
    ad_name: string;
    primary_text: string;
    headline: string;
    description: string;
    destination_url: string;
    call_to_action: string;
    creative_file: {
      data: string;
      type: string;
      name: string;
    } | null;
  };
  advertiser: {
    id: number;
    username: string;
    page_id: string;
    ad_account_id?: string;
    instagram_actor_id?: string;
  };
}

export const PushToAdManagerPage: React.FC = () => {
  const { advertiser, adId } = useParams<{ advertiser: string; adId: string }>();
  const navigate = useNavigate();

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingAdSets, setIsLoadingAdSets] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isSavingAccountId, setIsSavingAccountId] = useState(false);

  // Data states
  const [adData, setAdData] = useState<AdData | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [adSets, setAdSets] = useState<MetaAdSet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<MetaPushResponse | null>(null);

  // Form state
  const [campaignMode, setCampaignMode] = useState<'new' | 'existing'>('new');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [newCampaignName, setNewCampaignName] = useState<string>('');
  const [campaignObjective, setCampaignObjective] = useState<CampaignObjective>('OUTCOME_TRAFFIC');
  const [specialAdCategories, setSpecialAdCategories] = useState<SpecialAdCategory[]>([]);

  const [adSetMode, setAdSetMode] = useState<'new' | 'existing'>('new');
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>('');
  const [newAdSetName, setNewAdSetName] = useState<string>('');
  const [budgetType, setBudgetType] = useState<BudgetType>('daily');
  const [dailyBudget, setDailyBudget] = useState<string>('500');
  const [lifetimeBudget, setLifetimeBudget] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [countries, setCountries] = useState<string>('US');
  const [ageMin, setAgeMin] = useState<string>('21');
  const [ageMax, setAgeMax] = useState<string>('65');

  const [showPayloadPreview, setShowPayloadPreview] = useState(false);

  // Editable ad account ID (for when advertiser doesn't have one set)
  const [editableAdAccountId, setEditableAdAccountId] = useState<string>('');

  // Load ad and advertiser data
  useEffect(() => {
    const loadData = async () => {
      if (!advertiser || !adId) {
        setError('Invalid parameters');
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);
        const response = await fetch(`${API_BASE_URL}/api/ad/${advertiser}/${adId}`);
        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load ad data');
        }

        setAdData(result.data);

        // Auto-populate campaign/ad set names
        setNewCampaignName(`${result.data.ad.ad_name} - Campaign`);
        setNewAdSetName(`${result.data.ad.ad_name} - Ad Set`);
      } catch (err) {
        console.error('Failed to load ad data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ad data');
      } finally {
        setIsLoadingData(false);
      }
    };

    void loadData();
  }, [advertiser, adId]);

  // Load campaigns when ad data is loaded
  useEffect(() => {
    if (adData?.advertiser.ad_account_id) {
      void loadCampaigns();
    }
  }, [adData]);

  // Load ad sets when a campaign is selected
  useEffect(() => {
    if (campaignMode === 'existing' && selectedCampaignId && adData?.advertiser.ad_account_id) {
      void loadAdSets(selectedCampaignId);
    }
  }, [campaignMode, selectedCampaignId, adData]);

  const loadCampaigns = async () => {
    if (!adData?.advertiser.ad_account_id) return;

    try {
      setIsLoadingCampaigns(true);
      const response = await fetch(`${API_BASE_URL}/api/meta/campaigns?ad_account_id=${encodeURIComponent(adData.advertiser.ad_account_id)}`);
      const result = await response.json();

      if (result.data) {
        setCampaigns(result.data);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      showToast('Failed to load campaigns', 'error');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadAdSets = async (campaignId: string) => {
    if (!adData?.advertiser.ad_account_id) return;

    try {
      setIsLoadingAdSets(true);
      const response = await fetch(
        `/api/meta/adsets?ad_account_id=${encodeURIComponent(adData.advertiser.ad_account_id)}&campaign_id=${campaignId}`
      );
      const result = await response.json();

      if (result.data) {
        setAdSets(result.data);
      }
    } catch (err) {
      console.error('Failed to load ad sets:', err);
      showToast('Failed to load ad sets', 'error');
    } finally {
      setIsLoadingAdSets(false);
    }
  };

  const saveAccountId = async () => {
    if (!adData || !editableAdAccountId.trim()) {
      showToast('Please enter an Ad Account ID', 'error');
      return;
    }

    try {
      setIsSavingAccountId(true);
      const response = await fetch(`${API_BASE_URL}/api/advertisers/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiser_id: adData.advertiser.id,
          ad_account_id: editableAdAccountId.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Ad Account ID saved successfully', 'success');

        // Update local state with the saved account ID
        setAdData({
          ...adData,
          advertiser: {
            ...adData.advertiser,
            ad_account_id: result.data.advertiser.ad_account_id,
          },
        });

        setEditableAdAccountId('');

        // Load campaigns now that we have an account ID
        void loadCampaigns();
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save Ad Account ID', 'error');
    } finally {
      setIsSavingAccountId(false);
    }
  };

  const buildPushPayload = (): MetaPushPayload | null => {
    if (!adData) return null;

    const payload: MetaPushPayload = {
      ad_account_id: adData.advertiser.ad_account_id!,
      page_id: adData.advertiser.page_id,
      instagram_actor_id: adData.advertiser.instagram_actor_id,

      creative: {
        object_story_spec: {
          page_id: adData.advertiser.page_id,
          link_data: {
            link: adData.ad.destination_url,
            message: adData.ad.primary_text,
            name: adData.ad.headline,
            description: adData.ad.description || undefined,
            call_to_action: {
              type: (adData.ad.call_to_action as CallToActionType) || 'LEARN_MORE',
              value: {
                link: adData.ad.destination_url,
              },
            },
            // Add image data if available
            ...(adData.ad.creative_file && adData.ad.creative_file.type.startsWith('image/')
              ? { image_data: adData.ad.creative_file.data }
              : {}),
          },
        },
      },

      ad: {
        name: adData.ad.ad_name,
      },
    };

    // Campaign
    if (campaignMode === 'existing' && selectedCampaignId) {
      payload.existing = { campaign_id: selectedCampaignId };
    } else {
      payload.campaign = {
        name: newCampaignName,
        objective: campaignObjective,
        special_ad_categories: specialAdCategories.length > 0 ? specialAdCategories : undefined,
      };
    }

    // Ad Set
    if (adSetMode === 'existing' && selectedAdSetId) {
      payload.existing = {
        ...payload.existing,
        adset_id: selectedAdSetId,
      };
    } else {
      payload.adset = {
        name: newAdSetName,
        targeting: {
          geo_locations: {
            countries: countries.split(',').map(c => c.trim()),
          },
          age_min: parseInt(ageMin),
          age_max: parseInt(ageMax),
        },
        ...(budgetType === 'daily'
          ? { daily_budget: parseInt(dailyBudget) }
          : { lifetime_budget: parseInt(lifetimeBudget) }),
        ...(startDate ? { start_time: new Date(startDate).toISOString() } : {}),
        ...(endDate ? { end_time: new Date(endDate).toISOString() } : {}),
      };
    }

    return payload;
  };

  const handlePush = async () => {
    const payload = buildPushPayload();
    if (!payload) return;

    try {
      setIsPushing(true);
      const response = await fetch(`${API_BASE_URL}/api/meta/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: MetaPushResponse = await response.json();

      if (result.success && result.data) {
        setPushResult(result);
        showToast('Ad successfully pushed to Meta Ads Manager!', 'success');
      } else {
        throw new Error(result.error || 'Failed to push ad');
      }
    } catch (err) {
      console.error('Push error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to push ad', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  // Loading state
  if (isLoadingData) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-14 text-text-muted">Loading ad data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !adData) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-danger" />
          <p className="text-16 font-semibold text-text-primary">Failed to Load</p>
          <p className="text-14 text-text-muted">{error || 'Could not load ad data'}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (pushResult?.success && pushResult.data) {
    return (
      <div className="h-screen bg-canvas flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-card border border-border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-24 font-semibold text-text-primary mb-2">
              Ad Pushed Successfully!
            </h1>
            <p className="text-14 text-text-muted mb-6">
              Your ad has been created in Meta Ads Manager with status PAUSED. Activate it when ready.
            </p>

            <div className="bg-surface-50 rounded-lg p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-text-muted">Campaign ID:</span>
                  <p className="font-mono text-xs mt-1">{pushResult.data.campaign_id}</p>
                </div>
                <div>
                  <span className="text-text-muted">Ad Set ID:</span>
                  <p className="font-mono text-xs mt-1">{pushResult.data.adset_id}</p>
                </div>
                <div>
                  <span className="text-text-muted">Creative ID:</span>
                  <p className="font-mono text-xs mt-1">{pushResult.data.creative_id}</p>
                </div>
                <div>
                  <span className="text-text-muted">Ad ID:</span>
                  <p className="font-mono text-xs mt-1">{pushResult.data.ad_id}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={pushResult.data.ads_manager_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-meta-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open in Ads Manager
                <ExternalLink className="w-4 h-4" />
              </a>
              <Button onClick={() => navigate(-1)} variant="outline">
                Back to Preview
              </Button>
            </div>

            <p className="text-xs text-text-muted mt-4">{pushResult.data.notes}</p>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-28 font-semibold text-text-primary mb-2">
              Push to Ad Manager
            </h1>
            <p className="text-14 text-text-muted">
              Configure and push your approved ad to Meta Ads Manager. All objects will be created as PAUSED.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              {/* Account Info */}
              <div className="bg-white rounded-card border border-border p-6">
                <h2 className="text-18 font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Account Information
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    Account details from advertiser settings. The <code className="bg-blue-100 px-1 rounded">act_</code> prefix is automatically managed by the system.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-12 font-medium text-text-muted mb-1">
                      Ad Account ID {!adData.advertiser.ad_account_id && <span className="text-red-600">*</span>}
                    </label>
                    {adData.advertiser.ad_account_id ? (
                      <input
                        type="text"
                        value={adData.advertiser.ad_account_id}
                        disabled
                        className="w-full px-3 py-2 border border-border rounded-md bg-surface-50 text-14"
                      />
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editableAdAccountId}
                          onChange={(e) => setEditableAdAccountId(e.target.value)}
                          placeholder="1234567890 (act_ will be added automatically)"
                          className="w-full px-3 py-2 border border-border rounded-md text-14"
                        />
                        <Button
                          onClick={saveAccountId}
                          disabled={isSavingAccountId || !editableAdAccountId.trim()}
                          className="w-full"
                        >
                          {isSavingAccountId ? (
                            <>
                              <Spinner className="w-4 h-4 mr-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Ad Account ID'
                          )}
                        </Button>
                        <p className="text-xs text-orange-600">
                          Please enter your Meta Ad Account ID to continue. You can find this in your Meta Business Manager settings.
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-12 font-medium text-text-muted mb-1">
                      Page ID
                    </label>
                    <input
                      type="text"
                      value={adData.advertiser.page_id}
                      disabled
                      className="w-full px-3 py-2 border border-border rounded-md bg-surface-50 text-14"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Selection */}
              <div className="bg-white rounded-card border border-border p-6">
                <h2 className="text-18 font-semibold mb-4">Campaign</h2>
                {!adData.advertiser.ad_account_id && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-xs text-yellow-800">
                      Please save an Ad Account ID above to configure campaign settings.
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="campaignMode"
                        checked={campaignMode === 'new'}
                        onChange={() => setCampaignMode('new')}
                        disabled={!adData.advertiser.ad_account_id}
                        className="text-blue-600"
                      />
                      <span className="text-14">Create New</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="campaignMode"
                        checked={campaignMode === 'existing'}
                        onChange={() => setCampaignMode('existing')}
                        disabled={!adData.advertiser.ad_account_id}
                        className="text-blue-600"
                      />
                      <span className="text-14">Use Existing</span>
                    </label>
                  </div>

                  {campaignMode === 'new' ? (
                    <>
                      <div>
                        <label className="block text-12 font-medium text-text-muted mb-1">
                          Campaign Name *
                        </label>
                        <input
                          type="text"
                          value={newCampaignName}
                          onChange={(e) => setNewCampaignName(e.target.value)}
                          placeholder="My Campaign"
                          className="w-full px-3 py-2 border border-border rounded-md text-14"
                        />
                      </div>
                      <div>
                        <label className="block text-12 font-medium text-text-muted mb-1">
                          Objective *
                        </label>
                        <select
                          value={campaignObjective}
                          onChange={(e) => setCampaignObjective(e.target.value as CampaignObjective)}
                          className="w-full px-3 py-2 border border-border rounded-md text-14"
                        >
                          {OBJECTIVES.map(obj => (
                            <option key={obj.value} value={obj.value}>{obj.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-12 font-medium text-text-muted mb-2">
                          Special Ad Categories
                        </label>
                        <div className="space-y-2">
                          {SPECIAL_AD_CATEGORIES.map(cat => (
                            <label key={cat.value} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={specialAdCategories.includes(cat.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSpecialAdCategories([...specialAdCategories, cat.value]);
                                  } else {
                                    setSpecialAdCategories(specialAdCategories.filter(c => c !== cat.value));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-14">{cat.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-12 font-medium text-text-muted mb-1">
                        Select Campaign *
                      </label>
                      {isLoadingCampaigns ? (
                        <div className="flex items-center gap-2 py-2">
                          <Spinner size="sm" />
                          <span className="text-14 text-text-muted">Loading campaigns...</span>
                        </div>
                      ) : (
                        <select
                          value={selectedCampaignId}
                          onChange={(e) => setSelectedCampaignId(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md text-14"
                        >
                          <option value="">Select a campaign...</option>
                          {campaigns.map(campaign => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.name} ({campaign.status})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Ad Set Selection */}
              <div className="bg-white rounded-card border border-border p-6">
                <h2 className="text-18 font-semibold mb-4">Ad Set</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="adSetMode"
                        checked={adSetMode === 'new'}
                        onChange={() => setAdSetMode('new')}
                        className="text-blue-600"
                      />
                      <span className="text-14">Create New</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="adSetMode"
                        checked={adSetMode === 'existing'}
                        onChange={() => setAdSetMode('existing')}
                        className="text-blue-600"
                        disabled={campaignMode === 'new'}
                      />
                      <span className="text-14">Use Existing</span>
                    </label>
                  </div>

                  {adSetMode === 'new' ? (
                    <>
                      <div>
                        <label className="block text-12 font-medium text-text-muted mb-1">
                          Ad Set Name *
                        </label>
                        <input
                          type="text"
                          value={newAdSetName}
                          onChange={(e) => setNewAdSetName(e.target.value)}
                          placeholder="My Ad Set"
                          className="w-full px-3 py-2 border border-border rounded-md text-14"
                        />
                      </div>

                      <div>
                        <label className="block text-12 font-medium text-text-muted mb-2">
                          Budget Type *
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="budgetType"
                              checked={budgetType === 'daily'}
                              onChange={() => setBudgetType('daily')}
                              className="text-blue-600"
                            />
                            <span className="text-14">Daily</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="budgetType"
                              checked={budgetType === 'lifetime'}
                              onChange={() => setBudgetType('lifetime')}
                              className="text-blue-600"
                            />
                            <span className="text-14">Lifetime</span>
                          </label>
                        </div>
                      </div>

                      {budgetType === 'daily' ? (
                        <div>
                          <label className="block text-12 font-medium text-text-muted mb-1">
                            Daily Budget (cents) *
                          </label>
                          <input
                            type="number"
                            value={dailyBudget}
                            onChange={(e) => setDailyBudget(e.target.value)}
                            placeholder="500"
                            min="50"
                            className="w-full px-3 py-2 border border-border rounded-md text-14"
                          />
                          <p className="text-xs text-text-muted mt-1">
                            ${(parseInt(dailyBudget) / 100).toFixed(2)} per day
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-12 font-medium text-text-muted mb-1">
                              Lifetime Budget (cents) *
                            </label>
                            <input
                              type="number"
                              value={lifetimeBudget}
                              onChange={(e) => setLifetimeBudget(e.target.value)}
                              placeholder="5000"
                              min="50"
                              className="w-full px-3 py-2 border border-border rounded-md text-14"
                            />
                            <p className="text-xs text-text-muted mt-1">
                              ${(parseInt(lifetimeBudget) / 100).toFixed(2)} total
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-12 font-medium text-text-muted mb-1">
                                Start Date *
                              </label>
                              <input
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md text-14"
                              />
                            </div>
                            <div>
                              <label className="block text-12 font-medium text-text-muted mb-1">
                                End Date *
                              </label>
                              <input
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md text-14"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-12 font-medium text-text-muted mb-1">
                          Countries (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={countries}
                          onChange={(e) => setCountries(e.target.value)}
                          placeholder="US,CA,GB"
                          className="w-full px-3 py-2 border border-border rounded-md text-14"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-12 font-medium text-text-muted mb-1">
                            Age Min
                          </label>
                          <input
                            type="number"
                            value={ageMin}
                            onChange={(e) => setAgeMin(e.target.value)}
                            min="18"
                            max="65"
                            className="w-full px-3 py-2 border border-border rounded-md text-14"
                          />
                        </div>
                        <div>
                          <label className="block text-12 font-medium text-text-muted mb-1">
                            Age Max
                          </label>
                          <input
                            type="number"
                            value={ageMax}
                            onChange={(e) => setAgeMax(e.target.value)}
                            min="18"
                            max="65"
                            className="w-full px-3 py-2 border border-border rounded-md text-14"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-12 font-medium text-text-muted mb-1">
                        Select Ad Set *
                      </label>
                      {isLoadingAdSets ? (
                        <div className="flex items-center gap-2 py-2">
                          <Spinner size="sm" />
                          <span className="text-14 text-text-muted">Loading ad sets...</span>
                        </div>
                      ) : (
                        <select
                          value={selectedAdSetId}
                          onChange={(e) => setSelectedAdSetId(e.target.value)}
                          disabled={!selectedCampaignId}
                          className="w-full px-3 py-2 border border-border rounded-md text-14 disabled:opacity-50"
                        >
                          <option value="">Select an ad set...</option>
                          {adSets.map(adSet => (
                            <option key={adSet.id} value={adSet.id}>
                              {adSet.name} ({adSet.status})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Creative Preview & Actions */}
            <div className="space-y-6">
              {/* Creative Details */}
              <div className="bg-white rounded-card border border-border p-6">
                <h2 className="text-18 font-semibold mb-4">Creative Preview</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-12 font-medium text-text-muted mb-1">
                      Ad Name
                    </label>
                    <p className="text-14 text-text-primary">{adData.ad.ad_name}</p>
                  </div>
                  <div>
                    <label className="block text-12 font-medium text-text-muted mb-1">
                      Primary Text
                    </label>
                    <p className="text-14 text-text-primary">{adData.ad.primary_text}</p>
                  </div>
                  <div>
                    <label className="block text-12 font-medium text-text-muted mb-1">
                      Headline
                    </label>
                    <p className="text-14 text-text-primary">{adData.ad.headline}</p>
                  </div>
                  <div>
                    <label className="block text-12 font-medium text-text-muted mb-1">
                      Description
                    </label>
                    <p className="text-14 text-text-primary">{adData.ad.description}</p>
                  </div>
                  <div>
                    <label className="block text-12 font-medium text-text-muted mb-1">
                      Destination URL
                    </label>
                    <p className="text-14 text-text-primary break-all">{adData.ad.destination_url}</p>
                  </div>
                  <div>
                    <label className="block text-12 font-medium text-text-muted mb-1">
                      Call to Action
                    </label>
                    <p className="text-14 text-text-primary">{adData.ad.call_to_action}</p>
                  </div>
                  {adData.ad.creative_file && (
                    <div>
                      <label className="block text-12 font-medium text-text-muted mb-1">
                        Creative File
                      </label>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-14 text-text-primary">
                          {adData.ad.creative_file.type.startsWith('image/') ? 'Image' : 'Video'} will be uploaded automatically
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payload Preview */}
              <div className="bg-white rounded-card border border-border p-6">
                <button
                  onClick={() => setShowPayloadPreview(!showPayloadPreview)}
                  className="w-full flex items-center justify-between text-18 font-semibold mb-4"
                >
                  <span>API Payload Preview</span>
                  {showPayloadPreview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {showPayloadPreview && (
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs max-h-96">
                    {JSON.stringify(buildPushPayload(), null, 2)}
                  </pre>
                )}
              </div>

              {/* Action Button */}
              <div className="bg-white rounded-card border border-border p-6">
                <Button
                  onClick={handlePush}
                  disabled={isPushing || !adData.advertiser.ad_account_id}
                  className="w-full bg-meta-blue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
                >
                  {isPushing ? (
                    <>
                      <Spinner className="w-5 h-5" />
                      Pushing to Ad Manager...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Push to Ad Manager
                    </>
                  )}
                </Button>
                <p className="text-xs text-text-muted text-center mt-4">
                  All objects will be created with status PAUSED. You can activate them in Ads Manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
};
