/**
 * Shared Database Library
 *
 * This library is used by both:
 * - Creative Spec App
 * - Approval Dashboard App
 *
 * To use in another app, copy this entire folder to that app's src/lib/shared-db/
 */

// Core database connection
export { query, getPool } from './db'

// Approval queries (existing)
export * from './db-approval'

// Campaign queries (new)
export * from './db-campaigns'

// Advertiser/User queries (new)
export * from './db-advertisers'

// TypeScript types
export * from './types'
