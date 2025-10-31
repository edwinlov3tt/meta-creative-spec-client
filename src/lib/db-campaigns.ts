import { query, queryOne } from './db.js';
import { nanoid } from 'nanoid';
import type { Campaign, CampaignWithAds, CampaignCard } from '../types/campaign.js';

/**
 * Generate a unique 8-character alphanumeric ID for campaigns
 */
export function generateCampaignShortId(): string {
  return nanoid(8);
}

/**
 * Find campaign by ID
 */
export async function findCampaignById(id: number): Promise<Campaign | null> {
  return queryOne<Campaign>(
    'SELECT * FROM campaigns WHERE id = $1',
    [id]
  );
}

/**
 * Find campaign by short_id
 */
export async function findCampaignByShortId(shortId: string): Promise<Campaign | null> {
  return queryOne<Campaign>(
    'SELECT * FROM campaigns WHERE short_id = $1',
    [shortId]
  );
}

/**
 * Find campaign by short_id and advertiser identifier
 */
export async function findCampaignByShortIdAndAdvertiserIdentifier(
  shortId: string,
  identifier: string
): Promise<Campaign | null> {
  return queryOne<Campaign>(
    `SELECT campaigns.* FROM campaigns
     JOIN advertisers ON campaigns.advertiser_id = advertisers.id
     WHERE campaigns.short_id = $1
     AND (advertisers.username = $2 OR advertisers.page_id = $2)`,
    [shortId, identifier]
  );
}

/**
 * Find all campaigns for an advertiser
 */
export async function findCampaignsByAdvertiserId(advertiserId: number): Promise<Campaign[]> {
  return query<Campaign>(
    'SELECT * FROM campaigns WHERE advertiser_id = $1 ORDER BY created_at DESC',
    [advertiserId]
  );
}

/**
 * Find all campaigns for an advertiser by identifier (username or page_id)
 */
export async function findCampaignsByAdvertiserIdentifier(identifier: string): Promise<Campaign[]> {
  return query<Campaign>(
    `SELECT campaigns.* FROM campaigns
     JOIN advertisers ON campaigns.advertiser_id = advertisers.id
     WHERE advertisers.username = $1 OR advertisers.page_id = $1
     ORDER BY campaigns.created_at DESC`,
    [identifier]
  );
}

/**
 * Find campaign with all its ads
 */
export async function findCampaignWithAds(campaignId: number): Promise<CampaignWithAds | null> {
  const campaign = await findCampaignById(campaignId);
  if (!campaign) return null;

  const ads = await query(
    `SELECT id, short_id, ad_copy, creative_file, preview_settings
     FROM ads
     WHERE campaign_id = $1
     ORDER BY created_at DESC`,
    [campaignId]
  );

  // Parse JSON fields and create simplified ad objects
  const adsData = ads.map((ad: any) => {
    const adCopy = typeof ad.ad_copy === 'string' ? JSON.parse(ad.ad_copy) : ad.ad_copy;
    const creativeFile = ad.creative_file
      ? (typeof ad.creative_file === 'string' ? JSON.parse(ad.creative_file) : ad.creative_file)
      : null;
    const previewSettings = typeof ad.preview_settings === 'string'
      ? JSON.parse(ad.preview_settings)
      : ad.preview_settings;

    return {
      id: ad.id,
      short_id: ad.short_id,
      ad_name: adCopy.adName || 'Untitled Ad',
      creative_file: creativeFile,
      preview_settings: previewSettings
    };
  });

  return {
    ...campaign,
    ads: adsData,
    ad_count: adsData.length
  };
}

/**
 * Get campaigns with preview thumbnails for campaign cards
 */
export async function findCampaignCardsByAdvertiserIdentifier(identifier: string): Promise<CampaignCard[]> {
  const campaigns = await query<Campaign>(
    `SELECT campaigns.* FROM campaigns
     JOIN advertisers ON campaigns.advertiser_id = advertisers.id
     WHERE advertisers.username = $1 OR advertisers.page_id = $1
     ORDER BY campaigns.created_at DESC`,
    [identifier]
  );

  // For each campaign, get first 4 ads for preview thumbnails
  const campaignCards = await Promise.all(
    campaigns.map(async (campaign) => {
      const ads = await query(
        `SELECT id, creative_file
         FROM ads
         WHERE campaign_id = $1
         ORDER BY created_at DESC
         LIMIT 4`,
        [campaign.id]
      );

      const ad_count = await queryOne<{ count: number }>(
        'SELECT COUNT(*)::int as count FROM ads WHERE campaign_id = $1',
        [campaign.id]
      );

      const ad_previews = ads.map((ad: any) => {
        const creativeFile = ad.creative_file
          ? (typeof ad.creative_file === 'string' ? JSON.parse(ad.creative_file) : ad.creative_file)
          : null;

        return {
          id: ad.id,
          creative_file: creativeFile
        };
      });

      return {
        id: campaign.id,
        short_id: campaign.short_id,
        name: campaign.name,
        campaign_objective: campaign.campaign_objective,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        ad_count: ad_count?.count || 0,
        ad_previews
      };
    })
  );

  return campaignCards;
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  advertiserId: number,
  name: string,
  campaignObjective: string | null,
  startDate: string | null,
  endDate: string | null
): Promise<Campaign> {
  const shortId = generateCampaignShortId();

  return queryOne<Campaign>(
    `INSERT INTO campaigns (short_id, advertiser_id, name, campaign_objective, start_date, end_date, is_public)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING *`,
    [shortId, advertiserId, name, campaignObjective, startDate, endDate]
  ) as Promise<Campaign>;
}

/**
 * Update campaign
 */
export async function updateCampaign(
  id: number,
  name: string,
  campaignObjective: string | null,
  startDate: string | null,
  endDate: string | null
): Promise<Campaign | null> {
  return queryOne<Campaign>(
    `UPDATE campaigns
     SET name = $2, campaign_objective = $3, start_date = $4, end_date = $5, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id, name, campaignObjective, startDate, endDate]
  );
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: number): Promise<boolean> {
  const result = await queryOne(
    'DELETE FROM campaigns WHERE id = $1 RETURNING id',
    [id]
  );
  return !!result;
}

/**
 * Assign ad to campaign (also inherits campaign_objective if ad doesn't have one)
 */
export async function assignAdToCampaign(
  adId: number,
  campaignId: number
): Promise<void> {
  // Get the ad's current brief to check if it has a campaign objective
  const ad = await queryOne<any>(
    'SELECT brief FROM ads WHERE id = $1',
    [adId]
  );

  if (!ad) {
    throw new Error('Ad not found');
  }

  // Get campaign objective
  const campaign = await findCampaignById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Parse brief
  const brief = typeof ad.brief === 'string' ? JSON.parse(ad.brief) : ad.brief;

  // If ad doesn't have campaignObjective and campaign does, inherit it
  if (!brief.campaignObjective && campaign.campaign_objective) {
    brief.campaignObjective = campaign.campaign_objective;

    // Update ad with campaign_id and updated brief
    await query(
      `UPDATE ads
       SET campaign_id = $1, brief = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [campaignId, JSON.stringify(brief), adId]
    );
  } else {
    // Just update campaign_id
    await query(
      `UPDATE ads
       SET campaign_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [campaignId, adId]
    );
  }
}

/**
 * Remove ad from campaign
 */
export async function removeAdFromCampaign(adId: number): Promise<void> {
  await query(
    `UPDATE ads
     SET campaign_id = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [adId]
  );
}

/**
 * Get navigation info for ad in campaign (previous/next ads)
 */
export async function getCampaignAdNavigation(
  campaignId: number,
  currentAdId: number
): Promise<{
  previous: { id: number; short_id: string } | null;
  next: { id: number; short_id: string } | null;
  position: number;
  total: number;
}> {
  // Get all ads in campaign ordered by creation date
  const ads = await query<{ id: number; short_id: string }>(
    `SELECT id, short_id
     FROM ads
     WHERE campaign_id = $1
     ORDER BY created_at ASC`,
    [campaignId]
  );

  const currentIndex = ads.findIndex(ad => ad.id === currentAdId);

  if (currentIndex === -1) {
    return {
      previous: null,
      next: null,
      position: 0,
      total: ads.length
    };
  }

  return {
    previous: currentIndex > 0 ? ads[currentIndex - 1] : null,
    next: currentIndex < ads.length - 1 ? ads[currentIndex + 1] : null,
    position: currentIndex + 1,
    total: ads.length
  };
}
