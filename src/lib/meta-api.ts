/**
 * Meta Marketing API Client Library
 * TypeScript port of facebookClient.js from meta-buyer-flow-demo-plus
 *
 * Provides reusable functions for interacting with Meta Marketing API:
 * - Campaign management
 * - Ad Set management
 * - Creative creation
 * - Ad creation
 * - Media uploads (images/videos)
 * - Preview generation
 *
 * All objects are created with status='PAUSED' for safety.
 * Uses Meta Graph API v24.0 (configurable via env)
 */

import axios, { type AxiosError } from 'axios';

const META_GRAPH_BASE = 'https://graph.facebook.com';

/**
 * Get Meta Graph API base URL with version
 */
function getGraphApiUrl(): string {
  const version = process.env.META_API_VERSION || 'v24.0';
  return `${META_GRAPH_BASE}/${version}`;
}

/**
 * Resolve access token from environment or request body
 * Priority: request body token (if allowed) > server env token
 */
export function resolveAccessToken(bodyToken?: string): string {
  const allowBodyToken = String(process.env.META_ALLOW_BODY_TOKEN || 'false').toLowerCase() === 'true';

  if (allowBodyToken && bodyToken) {
    return bodyToken;
  }

  if (process.env.META_ACCESS_TOKEN) {
    return process.env.META_ACCESS_TOKEN;
  }

  throw new Error('Missing Meta access token: set META_ACCESS_TOKEN in .env or enable META_ALLOW_BODY_TOKEN');
}

/**
 * Normalize Ad Account ID to include act_ prefix
 * Meta API requires act_ prefix for most endpoints
 *
 * IMPORTANT: This should be used everywhere ad_account_id is processed
 * to ensure consistency across the application
 */
export function normalizeActId(adAccountId: string): string {
  if (!adAccountId) {
    throw new Error('Ad Account ID is required');
  }

  // Remove any whitespace
  const trimmed = adAccountId.trim();

  // If it already has act_ prefix, return as-is
  if (trimmed.startsWith('act_')) {
    return trimmed;
  }

  // Otherwise, add the act_ prefix
  return `act_${trimmed}`;
}

/**
 * Normalize Ad Account ID for database storage
 * Always stores with act_ prefix for consistency
 * Returns null if empty string
 */
export function normalizeActIdForDb(adAccountId: string | null | undefined): string | null {
  if (!adAccountId || adAccountId.trim() === '') {
    return null;
  }

  return normalizeActId(adAccountId);
}

/**
 * Handle Meta API errors with detailed logging
 */
function handleMetaApiError(error: AxiosError, context: string): never {
  console.error(`[Meta API Error] ${context}:`, error.response?.data || error.message);

  const errorData = error.response?.data as any;
  const errorMessage = errorData?.error?.message || error.message || 'Unknown Meta API error';

  throw new Error(`Meta API Error (${context}): ${errorMessage}`);
}

// ============================================
// CAMPAIGN MANAGEMENT
// ============================================

export interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  effective_status: string;
  created_time?: string;
  updated_time?: string;
}

export interface ListCampaignsParams {
  ad_account_id: string;
  access_token: string;
  after?: string;
}

export interface ListCampaignsResponse {
  data: MetaCampaign[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}

/**
 * List campaigns for an ad account
 */
export async function listCampaigns(params: ListCampaignsParams): Promise<ListCampaignsResponse> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/campaigns`;

    const queryParams: Record<string, any> = {
      access_token: params.access_token,
      fields: 'id,name,objective,status,effective_status,created_time,updated_time',
      limit: 25,
    };

    if (params.after) {
      queryParams.after = params.after;
    }

    const { data } = await axios.get(url, { params: queryParams });
    return data;
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'listCampaigns');
  }
}

export interface CreateCampaignParams {
  ad_account_id: string;
  campaign: {
    name?: string;
    objective?: string;
    special_ad_categories?: string[];
    special_ad_category_country?: string[];
  };
  access_token: string;
}

export interface CreateCampaignResponse {
  id: string;
  payload: Record<string, any>;
}

/**
 * Create a new campaign (PAUSED by default)
 */
export async function createCampaign(params: CreateCampaignParams): Promise<CreateCampaignResponse> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/campaigns`;

    const payload: Record<string, any> = {
      name: params.campaign?.name || 'API Demo Campaign',
      objective: params.campaign?.objective || 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      is_adset_budget_sharing_enabled: false,
    };

    if (Array.isArray(params.campaign?.special_ad_categories) && params.campaign.special_ad_categories.length > 0) {
      payload.special_ad_categories = params.campaign.special_ad_categories;

      if (params.campaign?.special_ad_category_country) {
        payload.special_ad_category_country = params.campaign.special_ad_category_country;
      }
    }

    console.log('[Meta API] Creating campaign:', JSON.stringify(payload, null, 2));

    const { data } = await axios.post(url, payload, {
      params: { access_token: params.access_token },
    });

    return { id: data.id, payload };
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'createCampaign');
  }
}

// ============================================
// AD SET MANAGEMENT
// ============================================

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  effective_status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  end_time?: string;
}

export interface ListAdSetsParams {
  ad_account_id: string;
  access_token: string;
  campaign_id?: string;
  after?: string;
}

export interface ListAdSetsResponse {
  data: MetaAdSet[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}

/**
 * List ad sets for an ad account (optionally filtered by campaign)
 */
export async function listAdSets(params: ListAdSetsParams): Promise<ListAdSetsResponse> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/adsets`;

    const queryParams: Record<string, any> = {
      access_token: params.access_token,
      fields: 'id,name,status,effective_status,campaign_id,daily_budget,lifetime_budget,start_time,end_time',
      limit: 25,
    };

    if (params.campaign_id) {
      queryParams.campaign_id = params.campaign_id;
    }

    if (params.after) {
      queryParams.after = params.after;
    }

    const { data } = await axios.get(url, { params: queryParams });
    return data;
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'listAdSets');
  }
}

export interface CreateAdSetParams {
  ad_account_id: string;
  campaign_id: string;
  adset: {
    name?: string;
    targeting?: Record<string, any>;
    daily_budget?: number;
    lifetime_budget?: number;
    start_time?: string;
    end_time?: string;
    promoted_object?: Record<string, any>;
  };
  access_token: string;
}

export interface CreateAdSetResponse {
  id: string;
  payload: Record<string, any>;
}

/**
 * Create a new ad set (PAUSED by default)
 */
export async function createAdSet(params: CreateAdSetParams): Promise<CreateAdSetResponse> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/adsets`;

    const payload: Record<string, any> = {
      name: params.adset?.name || 'API Demo Ad Set',
      campaign_id: params.campaign_id,
      status: 'PAUSED',
      targeting: params.adset?.targeting || {
        geo_locations: { countries: ['US'] },
        age_min: 21,
        age_max: 65,
      },
      is_adset_budget_sharing_enabled: false,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'REACH',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    };

    // Budget
    if (params.adset?.daily_budget) {
      payload.daily_budget = params.adset.daily_budget;
    } else if (params.adset?.lifetime_budget) {
      payload.lifetime_budget = params.adset.lifetime_budget;
    } else {
      payload.daily_budget = 500; // Default $5 daily budget (in cents)
    }

    // Dates
    if (params.adset?.start_time) {
      payload.start_time = params.adset.start_time;
    }
    if (params.adset?.end_time) {
      payload.end_time = params.adset.end_time;
    }

    // Promoted object
    if (params.adset?.promoted_object) {
      payload.promoted_object = params.adset.promoted_object;
    }

    console.log('[Meta API] Creating ad set:', JSON.stringify(payload, null, 2));

    const { data } = await axios.post(url, payload, {
      params: { access_token: params.access_token },
    });

    return { id: data.id, payload };
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'createAdSet');
  }
}

// ============================================
// CREATIVE MANAGEMENT
// ============================================

export interface CreateCreativeParams {
  ad_account_id: string;
  creative: {
    object_story_spec: Record<string, any>;
  };
  access_token: string;
}

export interface CreateCreativeResponse {
  id: string;
  payload: Record<string, any>;
}

/**
 * Create a new ad creative
 */
export async function createCreative(params: CreateCreativeParams): Promise<CreateCreativeResponse> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/adcreatives`;

    const payload = {
      object_story_spec: params.creative.object_story_spec,
    };

    console.log('[Meta API] Creating creative:', JSON.stringify(payload, null, 2));

    const { data } = await axios.post(url, payload, {
      params: { access_token: params.access_token },
    });

    return { id: data.id, payload };
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'createCreative');
  }
}

// ============================================
// AD MANAGEMENT
// ============================================

export interface CreateAdParams {
  ad_account_id: string;
  ad: {
    name?: string;
  };
  adset_id: string;
  creative_id: string;
  access_token: string;
}

export interface CreateAdResponse {
  id: string;
  payload: Record<string, any>;
}

/**
 * Create a new ad (PAUSED by default)
 */
export async function createAd(params: CreateAdParams): Promise<CreateAdResponse> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/ads`;

    const payload = {
      name: params.ad?.name || 'API Demo Ad',
      adset_id: params.adset_id,
      creative: { creative_id: params.creative_id },
      status: 'PAUSED',
    };

    console.log('[Meta API] Creating ad:', JSON.stringify(payload, null, 2));

    const { data } = await axios.post(url, payload, {
      params: { access_token: params.access_token },
    });

    return { id: data.id, payload };
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'createAd');
  }
}

// ============================================
// MEDIA UPLOADS
// ============================================

export interface UploadImageParams {
  ad_account_id: string;
  image_data: string; // base64 or URL
  access_token: string;
}

export interface UploadImageResponse {
  hash: string;
}

/**
 * Upload an image and get hash for use in creatives
 */
export async function uploadImage(params: UploadImageParams): Promise<UploadImageResponse> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/adimages`;

    // Remove data:image prefix if present
    let imageData = params.image_data;
    if (imageData.startsWith('data:')) {
      imageData = imageData.split(',')[1];
    }

    const payload = {
      bytes: imageData,
    };

    console.log('[Meta API] Uploading image to ad account:', actId);

    const { data } = await axios.post(url, payload, {
      params: { access_token: params.access_token },
    });

    // Meta returns {images: {bytes: {hash: '...', url: '...'}}}
    const hash = data.images?.bytes?.hash || data.images?.[imageData]?.hash;

    if (!hash) {
      throw new Error('Failed to get image hash from Meta API response');
    }

    console.log('[Meta API] Image uploaded successfully, hash:', hash);

    return { hash };
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'uploadImage');
  }
}

export interface UploadVideoParams {
  ad_account_id: string;
  video_data: string; // base64 or file path
  access_token: string;
}

export interface UploadVideoResponse {
  video_id: string;
}

/**
 * Upload a video and get video_id for use in creatives
 * Note: This is a simplified version. For large videos, use resumable upload.
 */
export async function uploadVideo(params: UploadVideoParams): Promise<UploadVideoResponse> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/advideos`;

    // For now, we'll use the simple upload method
    // TODO: Implement chunked upload for large files

    console.log('[Meta API] Uploading video to ad account:', actId);
    console.warn('[Meta API] Video upload is simplified - large files may fail');

    const payload = {
      source: params.video_data,
    };

    const { data } = await axios.post(url, payload, {
      params: { access_token: params.access_token },
      timeout: 300000, // 5 minute timeout for video uploads
    });

    if (!data.id) {
      throw new Error('Failed to get video ID from Meta API response');
    }

    console.log('[Meta API] Video uploaded successfully, ID:', data.id);

    return { video_id: data.id };
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'uploadVideo');
  }
}

// ============================================
// PREVIEW GENERATION
// ============================================

export interface GeneratePreviewParams {
  ad_account_id: string;
  ad_format: string;
  creative: {
    object_story_spec: Record<string, any>;
  };
  access_token: string;
}

/**
 * Generate ad preview (returns HTML iframe snippet)
 * Note: Preview iframes expire after ~24 hours
 */
export async function generatePreview(params: GeneratePreviewParams): Promise<string> {
  try {
    const actId = normalizeActId(params.ad_account_id);
    const url = `${getGraphApiUrl()}/${actId}/generatepreviews`;

    const payload = {
      creative: params.creative,
    };

    const queryParams = {
      access_token: params.access_token,
      ad_format: params.ad_format,
    };

    const { data } = await axios.post(url, payload, { params: queryParams });

    // Meta returns {data: [{body: '<iframe...>'}]}
    return data?.data?.[0]?.body || '';
  } catch (error) {
    handleMetaApiError(error as AxiosError, 'generatePreview');
  }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Generate Ads Manager deep link for an ad account
 */
export function adsManagerUrl(adAccountId: string): string {
  const id = adAccountId.startsWith('act_')
    ? adAccountId.replace('act_', '')
    : adAccountId;

  return `https://www.facebook.com/adsmanager/manage/campaigns?act=${id}`;
}

/**
 * Generate direct link to a specific campaign in Ads Manager
 */
export function campaignUrl(adAccountId: string, campaignId: string): string {
  const actId = adAccountId.startsWith('act_')
    ? adAccountId.replace('act_', '')
    : adAccountId;

  return `https://www.facebook.com/adsmanager/manage/campaigns?act=${actId}&selected_campaign_ids=${campaignId}`;
}

/**
 * Generate direct link to a specific ad set in Ads Manager
 */
export function adSetUrl(adAccountId: string, adSetId: string): string {
  const actId = adAccountId.startsWith('act_')
    ? adAccountId.replace('act_', '')
    : adAccountId;

  return `https://www.facebook.com/adsmanager/manage/adsets?act=${actId}&selected_adset_ids=${adSetId}`;
}

/**
 * Generate direct link to a specific ad in Ads Manager
 */
export function adUrl(adAccountId: string, adId: string): string {
  const actId = adAccountId.startsWith('act_')
    ? adAccountId.replace('act_', '')
    : adAccountId;

  return `https://www.facebook.com/adsmanager/manage/ads?act=${actId}&selected_ad_ids=${adId}`;
}
