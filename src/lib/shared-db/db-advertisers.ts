/**
 * Advertiser & User Profile Database Queries
 * Shared between Creative Spec and Approval Dashboard
 */

import { query } from './db'
import type { UserProfile } from './types'

// ============================================================================
// User Profiles
// ============================================================================

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const results = await query<UserProfile>(
    `SELECT * FROM user_profiles WHERE email = $1`,
    [email]
  )
  return results[0] || null
}

export async function getUserProfileById(id: number): Promise<UserProfile | null> {
  const results = await query<UserProfile>(
    `SELECT * FROM user_profiles WHERE id = $1`,
    [id]
  )
  return results[0] || null
}

export async function getUserProfilesByAdvertiser(advertiserId: number): Promise<UserProfile[]> {
  return query<UserProfile>(
    `SELECT * FROM user_profiles WHERE advertiser_id = $1 ORDER BY created_at`,
    [advertiserId]
  )
}

export async function createUserProfile(data: {
  advertiser_id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  password_hash?: string
}): Promise<UserProfile> {
  const results = await query<UserProfile>(
    `INSERT INTO user_profiles (advertiser_id, first_name, last_name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.advertiser_id, data.first_name, data.last_name, data.email, data.phone || null, data.password_hash || null]
  )
  return results[0]
}

export async function updateUserProfile(
  userId: number,
  data: {
    first_name?: string
    last_name?: string
    phone?: string
    profile_photo_url?: string
  }
): Promise<UserProfile | null> {
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
  if (data.profile_photo_url !== undefined) {
    updates.push(`profile_photo_url = $${paramIndex++}`)
    values.push(data.profile_photo_url)
  }

  if (updates.length === 0) return null

  updates.push(`updated_at = NOW()`)
  values.push(userId)

  const results = await query<UserProfile>(
    `UPDATE user_profiles
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  return results[0] || null
}

export async function setUserVacation(
  userId: number,
  vacation: {
    is_on_vacation: boolean
    vacation_start_date?: string
    vacation_end_date?: string
    vacation_delegate_id?: number
    vacation_auto_reply?: string
  }
): Promise<UserProfile | null> {
  const results = await query<UserProfile>(
    `UPDATE user_profiles
     SET
       is_on_vacation = $1,
       vacation_start_date = $2,
       vacation_end_date = $3,
       vacation_delegate_id = $4,
       vacation_auto_reply = $5,
       updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      vacation.is_on_vacation,
      vacation.vacation_start_date || null,
      vacation.vacation_end_date || null,
      vacation.vacation_delegate_id || null,
      vacation.vacation_auto_reply || null,
      userId,
    ]
  )
  return results[0] || null
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<boolean> {
  await query(
    `UPDATE user_profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, userId]
  )
  return true
}

export async function updateLastLogin(userId: number): Promise<boolean> {
  await query(
    `UPDATE user_profiles SET last_login_at = NOW() WHERE id = $1`,
    [userId]
  )
  return true
}

export async function verifyUserEmail(userId: number): Promise<boolean> {
  await query(
    `UPDATE user_profiles SET email_verified = TRUE, updated_at = NOW() WHERE id = $1`,
    [userId]
  )
  return true
}
