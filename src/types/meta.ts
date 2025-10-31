/**
 * Type definitions for Meta Marketing API integration
 * Covers campaigns, ad sets, creatives, ads, and related structures
 */

// ============================================
// CAMPAIGN TYPES
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

export type CampaignObjective =
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_SALES'
  | 'OUTCOME_APP_PROMOTION';

export type SpecialAdCategory =
  | 'CREDIT'
  | 'EMPLOYMENT'
  | 'HOUSING'
  | 'ISSUES_ELECTIONS_POLITICS'
  | 'ONLINE_GAMBLING_AND_GAMING';

export interface CampaignInput {
  name: string;
  objective: CampaignObjective;
  special_ad_categories?: SpecialAdCategory[];
  special_ad_category_country?: string[];
}

// ============================================
// AD SET TYPES
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

export type BudgetType = 'daily' | 'lifetime';

export interface AdSetTargeting {
  geo_locations: {
    countries: string[];
    regions?: Array<{ key: string }>;
    cities?: Array<{ key: string; radius: number; distance_unit: string }>;
  };
  age_min: number;
  age_max: number;
  genders?: number[]; // 1 = male, 2 = female
  locales?: number[];
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  device_platforms?: string[];
  flexible_spec?: Array<Record<string, any>>;
}

export interface AdSetInput {
  name: string;
  targeting: AdSetTargeting;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  end_time?: string;
  promoted_object?: {
    page_id?: string;
    pixel_id?: string;
    custom_event_type?: string;
  };
}

// ============================================
// CREATIVE TYPES
// ============================================

export type CreativeType = 'link' | 'video' | 'carousel';

export interface ObjectStorySpec {
  page_id: string;
  instagram_actor_id?: string;
  link_data?: LinkData;
  video_data?: VideoData;
}

export interface LinkData {
  link: string;
  message: string;
  name: string;
  description?: string;
  image_hash?: string;
  call_to_action?: {
    type: CallToActionType;
    value: {
      link: string;
      link_caption?: string;
    };
  };
}

export interface VideoData {
  video_id: string;
  message: string;
  title: string;
  call_to_action?: {
    type: CallToActionType;
    value: {
      link: string;
      link_caption?: string;
    };
  };
}

export type CallToActionType =
  | 'LEARN_MORE'
  | 'SHOP_NOW'
  | 'SIGN_UP'
  | 'DOWNLOAD'
  | 'BOOK_NOW'
  | 'CONTACT_US'
  | 'GET_QUOTE'
  | 'APPLY_NOW'
  | 'WATCH_MORE'
  | 'SUBSCRIBE';

export interface CreativeInput {
  object_story_spec: ObjectStorySpec;
}

// ============================================
// AD TYPES
// ============================================

export interface AdInput {
  name: string;
}

// ============================================
// PLACEMENT TYPES
// ============================================

export type PlacementStrategy = 'automatic' | 'manual';

export interface Placements {
  facebook: FacebookPosition[];
  instagram: InstagramPosition[];
}

export type FacebookPosition =
  | 'feed'
  | 'right_hand_column'
  | 'marketplace'
  | 'video_feeds'
  | 'story'
  | 'reels';

export type InstagramPosition = 'stream' | 'story' | 'reels' | 'explore';

// ============================================
// MEDIA UPLOAD TYPES
// ============================================

export interface ImageUploadResult {
  hash: string;
  url?: string;
}

export interface VideoUploadResult {
  video_id: string;
}

// ============================================
// PUSH PAYLOAD TYPES
// ============================================

export interface MetaPushPayload {
  ad_account_id: string;
  page_id: string;
  instagram_actor_id?: string;

  // Campaign (optional if reusing existing)
  campaign?: CampaignInput;

  // Ad Set (optional if reusing existing)
  adset?: AdSetInput;

  // Creative (required)
  creative: CreativeInput;

  // Ad (optional - name will be auto-generated if not provided)
  ad?: AdInput;

  // Reuse existing campaign/ad set
  existing?: {
    campaign_id?: string;
    adset_id?: string;
  };
}

export interface MetaPushResponse {
  success: boolean;
  data?: {
    campaign_id: string;
    adset_id: string;
    creative_id: string;
    ad_id: string;
    ads_manager_url: string;
    campaign_url?: string;
    adset_url?: string;
    ad_url?: string;
    reused: {
      campaign: boolean;
      adset: boolean;
    };
    notes: string;
  };
  error?: string;
}

// ============================================
// FORM STATE TYPES (for PushToAdManagerPage)
// ============================================

export interface PushFormData {
  // Account info (read-only, from advertiser)
  ad_account_id: string;
  page_id: string;
  instagram_actor_id: string;

  // Campaign selection
  campaignMode: 'new' | 'existing';
  existingCampaignId: string;
  newCampaign: {
    name: string;
    objective: CampaignObjective;
    specialAdCategories: SpecialAdCategory[];
  };

  // Ad Set selection
  adSetMode: 'new' | 'existing';
  existingAdSetId: string;
  newAdSet: {
    name: string;
    budgetType: BudgetType;
    dailyBudget: string; // in cents
    lifetimeBudget: string; // in cents
    startDate: string;
    endDate: string;
    countries: string; // comma-separated
    ageMin: string;
    ageMax: string;
    placementStrategy: PlacementStrategy;
    selectedPlacements: Placements;
  };

  // Creative (read-only from ad, but shown for reference)
  creative: {
    primaryText: string;
    headline: string;
    description: string;
    destinationUrl: string;
    callToAction: CallToActionType;
    imageHash?: string;
    videoId?: string;
  };

  // Ad name (optional)
  adName: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

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

export interface UploadImageResponse {
  success: boolean;
  data?: {
    hash: string;
  };
  error?: string;
}

export interface UploadVideoResponse {
  success: boolean;
  data?: {
    video_id: string;
  };
  error?: string;
}
