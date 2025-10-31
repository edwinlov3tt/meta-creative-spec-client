export interface Campaign {
  id: number;
  short_id: string;
  advertiser_id: number;
  name: string;
  campaign_objective: string | null;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignWithAds extends Campaign {
  ads: Array<{
    id: number;
    short_id: string;
    ad_name: string;
    creative_file: {
      data: string;
      type: string;
      name: string;
    } | null;
    preview_settings: {
      platform: 'facebook' | 'instagram';
      device: string;
      adType: string;
      adFormat: string;
    };
  }>;
  ad_count: number;
}

export interface CampaignFormData {
  name: string;
  campaign_objective: string;
  start_date: string;
  end_date: string;
  ad_ids?: number[]; // Optional array of ad IDs to assign on creation
}

export interface CampaignCard {
  id: number;
  short_id: string;
  name: string;
  campaign_objective: string | null;
  start_date: string | null;
  end_date: string | null;
  ad_count: number;
  ad_previews: Array<{
    id: number;
    creative_file: {
      data: string;
      type: string;
    } | null;
  }>;
}
