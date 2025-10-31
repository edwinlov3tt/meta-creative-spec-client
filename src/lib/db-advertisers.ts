import { query, queryOne } from './db.js';

export interface Advertiser {
  id: number;
  username: string;
  page_id: string;
  page_data: any; // FacebookPageData from API
  ad_account_id?: string | null; // Meta Ad Account ID (act_123... format)
  instagram_actor_id?: string | null; // Instagram Business Account ID (optional)
  created_at: Date;
  updated_at: Date;
}

/**
 * Find advertiser by Facebook username (from URL)
 */
export async function findAdvertiserByUsername(username: string): Promise<Advertiser | null> {
  return queryOne<Advertiser>(
    'SELECT * FROM advertisers WHERE username = $1',
    [username]
  );
}

/**
 * Find advertiser by Facebook page ID
 */
export async function findAdvertiserByPageId(pageId: string): Promise<Advertiser | null> {
  return queryOne<Advertiser>(
    'SELECT * FROM advertisers WHERE page_id = $1',
    [pageId]
  );
}

/**
 * Find advertiser by ID
 */
export async function findAdvertiserById(id: number): Promise<Advertiser | null> {
  return queryOne<Advertiser>(
    'SELECT * FROM advertisers WHERE id = $1',
    [id]
  );
}

/**
 * Create or update advertiser
 * Uses UPSERT to handle duplicates gracefully
 */
export async function upsertAdvertiser(
  username: string,
  pageId: string,
  pageData: any
): Promise<Advertiser> {
  const result = await queryOne<Advertiser>(
    `INSERT INTO advertisers (username, page_id, page_data)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO UPDATE
     SET page_id = EXCLUDED.page_id,
         page_data = EXCLUDED.page_data,
         updated_at = NOW()
     RETURNING *`,
    [username, pageId, JSON.stringify(pageData)]
  );

  if (!result) {
    throw new Error('Failed to create or update advertiser');
  }

  return result;
}

/**
 * Extract username from Facebook URL
 */
export function extractUsernameFromFacebookUrl(facebookUrl: string): string | null {
  try {
    const url = new URL(facebookUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.length > 0 ? parts[0] : null;
  } catch {
    return null;
  }
}

/**
 * Find advertiser by identifier (username or page_id)
 */
export async function findAdvertiserByIdentifier(identifier: string): Promise<Advertiser | null> {
  return queryOne<Advertiser>(
    'SELECT * FROM advertisers WHERE username = $1 OR page_id = $1',
    [identifier]
  );
}

/**
 * Get all advertisers with ad count
 */
export async function getAllAdvertisersWithStats(): Promise<any[]> {
  return query<any>(
    `SELECT
       advertisers.*,
       COUNT(ads.id) as total_ads
     FROM advertisers
     LEFT JOIN ads ON advertisers.id = ads.advertiser_id
     GROUP BY advertisers.id
     ORDER BY advertisers.created_at DESC`
  );
}

/**
 * Delete an advertiser by ID (also deletes all associated ads via CASCADE)
 */
export async function deleteAdvertiser(advertiserId: number): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'DELETE FROM advertisers WHERE id = $1 RETURNING id',
    [advertiserId]
  );
  return result !== null;
}
