/**
 * Campaign Database Queries
 * Shared between Creative Spec and Approval Dashboard
 */

import { query } from './db'
import type { Campaign, CampaignAd, CampaignApprover, CampaignWithAds } from './types'

// ============================================================================
// Campaign CRUD
// ============================================================================

export async function getCampaignsByAdvertiser(advertiserId: number): Promise<Campaign[]> {
  return query<Campaign>(
    `SELECT * FROM campaigns
     WHERE advertiser_id = $1
     ORDER BY created_at DESC`,
    [advertiserId]
  )
}

export async function getCampaignById(campaignId: number): Promise<Campaign | null> {
  const results = await query<Campaign>(
    `SELECT * FROM campaigns WHERE id = $1`,
    [campaignId]
  )
  return results[0] || null
}

export async function getCampaignWithAds(campaignId: number): Promise<CampaignWithAds | null> {
  const campaign = await getCampaignById(campaignId)
  if (!campaign) return null

  const ads = await query<any>(
    `SELECT
      a.id,
      a.short_id,
      a.ad_copy,
      ar.status as approval_status,
      a.created_at
     FROM campaign_ads ca
     JOIN ads a ON a.id = ca.ad_id
     LEFT JOIN approval_requests ar ON ar.ad_id = a.id
     WHERE ca.campaign_id = $1
     ORDER BY ca.display_order, a.created_at`,
    [campaignId]
  )

  return {
    ...campaign,
    ads,
  }
}

export async function createCampaign(data: {
  advertiser_id: number
  name: string
  description?: string
  start_date?: string
  end_date?: string
}): Promise<Campaign> {
  const results = await query<Campaign>(
    `INSERT INTO campaigns (advertiser_id, name, description, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.advertiser_id, data.name, data.description || null, data.start_date || null, data.end_date || null]
  )
  return results[0]
}

export async function updateCampaign(
  campaignId: number,
  data: {
    name?: string
    description?: string
    start_date?: string
    end_date?: string
  }
): Promise<Campaign | null> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.start_date !== undefined) {
    updates.push(`start_date = $${paramIndex++}`)
    values.push(data.start_date)
  }
  if (data.end_date !== undefined) {
    updates.push(`end_date = $${paramIndex++}`)
    values.push(data.end_date)
  }

  if (updates.length === 0) {
    return getCampaignById(campaignId)
  }

  updates.push(`updated_at = NOW()`)
  values.push(campaignId)

  const results = await query<Campaign>(
    `UPDATE campaigns
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  return results[0] || null
}

export async function deleteCampaign(campaignId: number): Promise<boolean> {
  await query(`DELETE FROM campaigns WHERE id = $1`, [campaignId])
  return true
}

// ============================================================================
// Campaign Ads
// ============================================================================

export async function addAdToCampaign(data: {
  campaign_id: number
  ad_id: number
  display_order?: number
  notes?: string
}): Promise<CampaignAd> {
  const results = await query<CampaignAd>(
    `INSERT INTO campaign_ads (campaign_id, ad_id, display_order, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.campaign_id, data.ad_id, data.display_order || 0, data.notes || null]
  )
  return results[0]
}

export async function removeAdFromCampaign(campaignId: number, adId: number): Promise<boolean> {
  await query(
    `DELETE FROM campaign_ads WHERE campaign_id = $1 AND ad_id = $2`,
    [campaignId, adId]
  )
  return true
}

export async function getAdsByCampaign(campaignId: number): Promise<CampaignAd[]> {
  return query<CampaignAd>(
    `SELECT * FROM campaign_ads WHERE campaign_id = $1 ORDER BY display_order`,
    [campaignId]
  )
}

export async function reorderCampaignAds(
  campaignId: number,
  adOrders: Array<{ ad_id: number; display_order: number }>
): Promise<boolean> {
  for (const { ad_id, display_order } of adOrders) {
    await query(
      `UPDATE campaign_ads
       SET display_order = $1
       WHERE campaign_id = $2 AND ad_id = $3`,
      [display_order, campaignId, ad_id]
    )
  }
  return true
}

// ============================================================================
// Campaign Approvers
// ============================================================================

export async function getApproversByCampaign(campaignId: number): Promise<CampaignApprover[]> {
  return query<CampaignApprover>(
    `SELECT * FROM campaign_approvers
     WHERE campaign_id = $1
     ORDER BY is_final_decision_maker DESC, created_at`,
    [campaignId]
  )
}

export async function addApprover(data: {
  campaign_id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  is_final_decision_maker?: boolean
}): Promise<CampaignApprover> {
  const results = await query<CampaignApprover>(
    `INSERT INTO campaign_approvers
     (campaign_id, first_name, last_name, email, phone, is_final_decision_maker)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.campaign_id,
      data.first_name,
      data.last_name,
      data.email,
      data.phone || null,
      data.is_final_decision_maker || false,
    ]
  )
  return results[0]
}

export async function updateApprover(
  approverId: number,
  data: {
    first_name?: string
    last_name?: string
    phone?: string
    is_final_decision_maker?: boolean
    status?: 'active' | 'on_vacation' | 'inactive'
  }
): Promise<CampaignApprover | null> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.first_name !== undefined) {
    updates.push(`first_name = $${paramIndex++}`)
    values.push(data.first_name)
  }
  if (data.last_name !== undefined) {
    updates.push(`last_name = $${paramIndex++}`)
    values.push(data.last_name)
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`)
    values.push(data.phone)
  }
  if (data.is_final_decision_maker !== undefined) {
    updates.push(`is_final_decision_maker = $${paramIndex++}`)
    values.push(data.is_final_decision_maker)
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`)
    values.push(data.status)
  }

  if (updates.length === 0) return null

  updates.push(`updated_at = NOW()`)
  values.push(approverId)

  const results = await query<CampaignApprover>(
    `UPDATE campaign_approvers
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  return results[0] || null
}

export async function setApproverVacation(
  approverId: number,
  vacation: {
    vacation_start_date: string
    vacation_end_date: string
    vacation_delegate_id?: number
  }
): Promise<CampaignApprover | null> {
  const results = await query<CampaignApprover>(
    `UPDATE campaign_approvers
     SET
       status = 'on_vacation',
       vacation_start_date = $1,
       vacation_end_date = $2,
       vacation_delegate_id = $3,
       updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [vacation.vacation_start_date, vacation.vacation_end_date, vacation.vacation_delegate_id || null, approverId]
  )
  return results[0] || null
}

export async function clearApproverVacation(approverId: number): Promise<CampaignApprover | null> {
  const results = await query<CampaignApprover>(
    `UPDATE campaign_approvers
     SET
       status = 'active',
       vacation_start_date = NULL,
       vacation_end_date = NULL,
       vacation_delegate_id = NULL,
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [approverId]
  )
  return results[0] || null
}

export async function deleteApprover(approverId: number): Promise<boolean> {
  await query(`DELETE FROM campaign_approvers WHERE id = $1`, [approverId])
  return true
}
