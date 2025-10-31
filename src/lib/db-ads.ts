import { query, queryOne } from './db.js';
import { nanoid } from 'nanoid';

export interface Ad {
  id: number;
  short_id: string;
  advertiser_id: number;
  brief: any;
  ad_copy: any;
  preview_settings: any;
  spec_export: any;
  creative_file: any;
  is_public: boolean;
  campaign_id: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Generate a unique 8-character alphanumeric ID
 */
export function generateShortId(): string {
  return nanoid(8);
}

/**
 * Find ad by ID
 */
export async function findAdById(id: number): Promise<Ad | null> {
  return queryOne<Ad>(
    'SELECT * FROM ads WHERE id = $1',
    [id]
  );
}

/**
 * Find ad by short_id
 */
export async function findAdByShortId(shortId: string): Promise<Ad | null> {
  return queryOne<Ad>(
    'SELECT * FROM ads WHERE short_id = $1',
    [shortId]
  );
}

/**
 * Find ad by short_id and advertiser username
 */
export async function findAdByShortIdAndUsername(
  shortId: string,
  username: string
): Promise<Ad | null> {
  return queryOne<Ad>(
    `SELECT ads.* FROM ads
     JOIN advertisers ON ads.advertiser_id = advertisers.id
     WHERE ads.short_id = $1
     AND advertisers.username = $2`,
    [shortId, username]
  );
}

/**
 * Find ad by short_id and advertiser page_id
 */
export async function findAdByShortIdAndPageId(
  shortId: string,
  pageId: string
): Promise<Ad | null> {
  return queryOne<Ad>(
    `SELECT ads.* FROM ads
     JOIN advertisers ON ads.advertiser_id = advertisers.id
     WHERE ads.short_id = $1
     AND advertisers.page_id = $2`,
    [shortId, pageId]
  );
}

/**
 * Find ad by short_id and advertiser identifier (username or page_id)
 */
export async function findAdByShortIdAndAdvertiserIdentifier(
  shortId: string,
  identifier: string
): Promise<Ad | null> {
  return queryOne<Ad>(
    `SELECT ads.* FROM ads
     JOIN advertisers ON ads.advertiser_id = advertisers.id
     WHERE ads.short_id = $1
     AND (advertisers.username = $2 OR advertisers.page_id = $2)`,
    [shortId, identifier]
  );
}

/**
 * Find all ads for an advertiser
 */
export async function findAdsByAdvertiserId(advertiserId: number): Promise<Ad[]> {
  return query<Ad>(
    'SELECT * FROM ads WHERE advertiser_id = $1 ORDER BY created_at DESC',
    [advertiserId]
  );
}

/**
 * Create a new ad
 */
export async function createAd(
  advertiserId: number,
  brief: any,
  adCopy: any,
  previewSettings: any,
  specExport: any,
  creativeFile: any | null = null,
  campaignId: number | null = null
): Promise<Ad> {
  const shortId = generateShortId();

  const result = await queryOne<Ad>(
    `INSERT INTO ads (short_id, advertiser_id, brief, ad_copy, preview_settings, spec_export, creative_file, campaign_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      shortId,
      advertiserId,
      JSON.stringify(brief),
      JSON.stringify(adCopy),
      JSON.stringify(previewSettings),
      JSON.stringify(specExport),
      creativeFile ? JSON.stringify(creativeFile) : null,
      campaignId
    ]
  );

  if (!result) {
    throw new Error('Failed to create ad');
  }

  return result;
}

/**
 * Update an existing ad
 */
export async function updateAd(
  id: number,
  brief: any,
  adCopy: any,
  previewSettings: any,
  specExport: any,
  creativeFile: any | null = null
): Promise<Ad> {
  const result = await queryOne<Ad>(
    `UPDATE ads
     SET brief = $2,
         ad_copy = $3,
         preview_settings = $4,
         spec_export = $5,
         creative_file = $6,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      JSON.stringify(brief),
      JSON.stringify(adCopy),
      JSON.stringify(previewSettings),
      JSON.stringify(specExport),
      creativeFile ? JSON.stringify(creativeFile) : null
    ]
  );

  if (!result) {
    throw new Error('Failed to update ad');
  }

  return result;
}

/**
 * Find all public ads by advertiser identifier (username or page_id)
 */
export async function findPublicAdsByAdvertiserIdentifier(
  identifier: string
): Promise<Ad[]> {
  return query<Ad>(
    `SELECT ads.* FROM ads
     JOIN advertisers ON ads.advertiser_id = advertisers.id
     WHERE (advertisers.username = $1 OR advertisers.page_id = $1)
     AND ads.is_public = true
     ORDER BY ads.created_at DESC`,
    [identifier]
  );
}

/**
 * Get all ads with advertiser information
 */
export async function getAllAdsWithAdvertiser(): Promise<any[]> {
  return query<any>(
    `SELECT
       ads.*,
       advertisers.username as advertiser_username,
       advertisers.page_data
     FROM ads
     JOIN advertisers ON ads.advertiser_id = advertisers.id
     ORDER BY ads.created_at DESC`
  );
}

/**
 * Delete an ad by ID (also deletes associated R2 images)
 */
export async function deleteAd(adId: number): Promise<boolean> {
  // First, fetch the ad to get image URLs
  const ad = await findAdById(adId);
  if (!ad) {
    return false;
  }

  // Extract R2 URLs from the ad brief
  const imageUrls: string[] = [];

  try {
    const brief = typeof ad.brief === 'string' ? JSON.parse(ad.brief) : ad.brief;

    // Check creativeFile for legacy single-file ads
    if (brief.creativeFile?.url) {
      imageUrls.push(brief.creativeFile.url);
    }

    // Check creativeFiles for multi-aspect-ratio ads
    if (brief.creativeFiles?.square?.url) {
      imageUrls.push(brief.creativeFiles.square.url);
    }
    if (brief.creativeFiles?.vertical?.url) {
      imageUrls.push(brief.creativeFiles.vertical.url);
    }
  } catch (error) {
    console.warn('[deleteAd] Failed to parse ad brief for image cleanup:', error);
  }

  // Delete images from R2 (async, don't block on errors)
  if (imageUrls.length > 0) {
    console.log(`[deleteAd] Deleting ${imageUrls.length} images from R2 for ad ${adId}`);

    for (const url of imageUrls) {
      try {
        // Use R2 client directly (more efficient than API call in serverless)
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

        const r2Client = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        });

        // Extract filename from URL
        const urlObj = new URL(url);
        const filename = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

        await r2Client.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: filename
        }));

        console.log(`[deleteAd] Deleted R2 image: ${filename}`);
      } catch (error) {
        console.error(`[deleteAd] Failed to delete R2 image ${url}:`, error);
        // Continue with deletion even if R2 cleanup fails
      }
    }
  }

  // Delete the ad record from database
  const result = await queryOne<{ id: number }>(
    'DELETE FROM ads WHERE id = $1 RETURNING id',
    [adId]
  );
  return result !== null;
}
