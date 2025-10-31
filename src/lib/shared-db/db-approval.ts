// Database functions for approval system
import { query, queryOne } from './db.js';
import { nanoid } from 'nanoid';
import type {
  Stakeholder,
  StakeholderInput,
  ApprovalRequest,
  ApprovalRequestInput,
  ApprovalParticipant,
  ApprovalParticipantInput,
  ElementRevision,
  ElementRevisionInput,
  ApprovalActivity,
  ApprovalActivityInput,
  EmailTracking,
  EmailTrackingInput,
  ApprovalRequestWithDetails,
  ApprovalTier,
  ApprovalStatus,
  ParticipantStatus,
} from '../types/approval';

// ============================================
// STAKEHOLDER FUNCTIONS
// ============================================

export async function getStakeholdersByAdvertiser(advertiserId: number): Promise<Stakeholder[]> {
  return query<Stakeholder>(
    `SELECT * FROM advertiser_stakeholders
     WHERE advertiser_id = $1
     ORDER BY role, name`,
    [advertiserId]
  );
}

export async function getStakeholdersByRole(
  advertiserId: number,
  role: string
): Promise<Stakeholder[]> {
  return query<Stakeholder>(
    `SELECT * FROM advertiser_stakeholders
     WHERE advertiser_id = $1 AND role = $2
     ORDER BY name`,
    [advertiserId, role]
  );
}

export async function createStakeholder(input: StakeholderInput): Promise<Stakeholder | null> {
  return queryOne<Stakeholder>(
    `INSERT INTO advertiser_stakeholders
     (advertiser_id, name, email, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (advertiser_id, email, role)
     DO UPDATE SET name = $2, updated_at = NOW()
     RETURNING *`,
    [input.advertiser_id, input.name, input.email, input.role]
  );
}

export async function deleteStakeholder(stakeholderId: number): Promise<boolean> {
  const result = await queryOne<{ id: number }>(
    'DELETE FROM advertiser_stakeholders WHERE id = $1 RETURNING id',
    [stakeholderId]
  );
  return result !== null;
}

// ============================================
// APPROVAL REQUEST FUNCTIONS
// ============================================

export async function createApprovalRequest(
  input: ApprovalRequestInput
): Promise<ApprovalRequest | null> {
  // Always generate a share token - it's used for the approval URL regardless of distribution method
  const shareToken = nanoid(32);

  return queryOne<ApprovalRequest>(
    `INSERT INTO approval_requests
     (ad_id, advertiser_id, share_method, share_token, email_restrictions,
      initiated_by_email, expires_at, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.ad_id,
      input.advertiser_id,
      input.share_method,
      shareToken,
      JSON.stringify(input.email_restrictions || null),
      input.initiated_by_email || null,
      input.expires_at || null,
      JSON.stringify(input.metadata || null),
    ]
  );
}

export async function getApprovalRequestById(id: number): Promise<ApprovalRequest | null> {
  return queryOne<ApprovalRequest>(
    'SELECT * FROM approval_requests WHERE id = $1',
    [id]
  );
}

export async function getApprovalRequestByToken(token: string): Promise<ApprovalRequest | null> {
  return queryOne<ApprovalRequest>(
    'SELECT * FROM approval_requests WHERE share_token = $1',
    [token]
  );
}

export async function getApprovalRequestsByAdId(adId: number): Promise<ApprovalRequest[]> {
  return query<ApprovalRequest>(
    `SELECT * FROM approval_requests
     WHERE ad_id = $1
     ORDER BY created_at DESC`,
    [adId]
  );
}

export async function getApprovalRequestWithDetails(
  id: number
): Promise<ApprovalRequestWithDetails | null> {
  const approvalRequest = await getApprovalRequestById(id);
  if (!approvalRequest) return null;

  const participants = await getParticipantsByApprovalRequest(id);
  const activity = await getActivityByApprovalRequest(id);

  // Get ad details
  const ad = await queryOne<any>(
    'SELECT short_id, ad_copy FROM ads WHERE id = $1',
    [approvalRequest.ad_id]
  );

  return {
    ...approvalRequest,
    ad: ad || { short_id: '', ad_copy: {} },
    participants,
    activity,
  };
}

export async function updateApprovalRequestStatus(
  id: number,
  status: ApprovalStatus
): Promise<ApprovalRequest | null> {
  const completedAt = status === 'approved' || status === 'rejected' ? 'NOW()' : 'NULL';

  return queryOne<ApprovalRequest>(
    `UPDATE approval_requests
     SET status = $1, completed_at = ${completedAt}, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
}

export async function updateApprovalRequestTier(
  id: number,
  tier: ApprovalTier
): Promise<ApprovalRequest | null> {
  return queryOne<ApprovalRequest>(
    `UPDATE approval_requests
     SET current_tier = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [tier, id]
  );
}

// ============================================
// PARTICIPANT FUNCTIONS
// ============================================

export async function createApprovalParticipant(
  input: ApprovalParticipantInput
): Promise<ApprovalParticipant | null> {
  return queryOne<ApprovalParticipant>(
    `INSERT INTO approval_participants
     (approval_request_id, stakeholder_id, email, name, role, tier)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.approval_request_id,
      input.stakeholder_id || null,
      input.email,
      input.name || null,
      input.role,
      input.tier,
    ]
  );
}

export async function getParticipantsByApprovalRequest(
  approvalRequestId: number
): Promise<ApprovalParticipant[]> {
  return query<ApprovalParticipant>(
    `SELECT * FROM approval_participants
     WHERE approval_request_id = $1
     ORDER BY tier, created_at`,
    [approvalRequestId]
  );
}

export async function getParticipantsByTier(
  approvalRequestId: number,
  tier: ApprovalTier
): Promise<ApprovalParticipant[]> {
  return query<ApprovalParticipant>(
    `SELECT * FROM approval_participants
     WHERE approval_request_id = $1 AND tier = $2
     ORDER BY created_at`,
    [approvalRequestId, tier]
  );
}

export async function getParticipantByEmail(
  approvalRequestId: number,
  email: string
): Promise<ApprovalParticipant | null> {
  return queryOne<ApprovalParticipant>(
    `SELECT * FROM approval_participants
     WHERE approval_request_id = $1 AND email = $2`,
    [approvalRequestId, email]
  );
}

export async function updateParticipantStatus(
  participantId: number,
  status: ParticipantStatus
): Promise<ApprovalParticipant | null> {
  return queryOne<ApprovalParticipant>(
    `UPDATE approval_participants
     SET status = $1, responded_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, participantId]
  );
}

// ============================================
// ELEMENT REVISION FUNCTIONS
// ============================================

export async function createElementRevision(
  input: ElementRevisionInput
): Promise<ElementRevision | null> {
  return queryOne<ElementRevision>(
    `INSERT INTO element_revisions
     (approval_request_id, participant_id, element_path, original_value,
      revised_value, comment, status, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      input.approval_request_id,
      input.participant_id,
      input.element_path,
      input.original_value || null,
      input.revised_value || null,
      input.comment || null,
      input.status,
      input.ip_address || null,
      input.user_agent || null,
    ]
  );
}

export async function getRevisionsByApprovalRequest(
  approvalRequestId: number
): Promise<ElementRevision[]> {
  return query<ElementRevision>(
    `SELECT * FROM element_revisions
     WHERE approval_request_id = $1
     ORDER BY created_at DESC`,
    [approvalRequestId]
  );
}

export async function getRevisionsByElement(
  approvalRequestId: number,
  elementPath: string
): Promise<ElementRevision[]> {
  return query<ElementRevision>(
    `SELECT * FROM element_revisions
     WHERE approval_request_id = $1 AND element_path = $2
     ORDER BY created_at DESC`,
    [approvalRequestId, elementPath]
  );
}

// ============================================
// ACTIVITY TRACKING FUNCTIONS
// ============================================

export async function createActivity(
  input: ApprovalActivityInput
): Promise<ApprovalActivity | null> {
  return queryOne<ApprovalActivity>(
    `INSERT INTO approval_activity
     (approval_request_id, participant_id, event_type, user_email, user_name,
      ip_address, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.approval_request_id,
      input.participant_id || null,
      input.event_type,
      input.user_email || null,
      input.user_name || null,
      input.ip_address || null,
      input.user_agent || null,
      JSON.stringify(input.metadata || null),
    ]
  );
}

export async function getActivityByApprovalRequest(
  approvalRequestId: number
): Promise<ApprovalActivity[]> {
  return query<ApprovalActivity>(
    `SELECT * FROM approval_activity
     WHERE approval_request_id = $1
     ORDER BY created_at DESC`,
    [approvalRequestId]
  );
}

// ============================================
// EMAIL TRACKING FUNCTIONS
// ============================================

export async function createEmailTracking(
  input: EmailTrackingInput
): Promise<EmailTracking | null> {
  return queryOne<EmailTracking>(
    `INSERT INTO email_tracking
     (approval_request_id, participant_id, email_provider_id, recipient_email, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.approval_request_id,
      input.participant_id || null,
      input.email_provider_id || null,
      input.recipient_email,
      JSON.stringify(input.metadata || null),
    ]
  );
}

export async function updateEmailOpened(
  emailTrackingId: number
): Promise<EmailTracking | null> {
  return queryOne<EmailTracking>(
    `UPDATE email_tracking
     SET opened_at = COALESCE(opened_at, NOW()),
         open_count = open_count + 1
     WHERE id = $1
     RETURNING *`,
    [emailTrackingId]
  );
}

export async function updateEmailClicked(
  emailTrackingId: number
): Promise<EmailTracking | null> {
  return queryOne<EmailTracking>(
    `UPDATE email_tracking
     SET clicked_at = COALESCE(clicked_at, NOW()),
         click_count = click_count + 1
     WHERE id = $1
     RETURNING *`,
    [emailTrackingId]
  );
}

export async function getEmailTrackingByProviderID(
  providerID: string
): Promise<EmailTracking | null> {
  return queryOne<EmailTracking>(
    `SELECT * FROM email_tracking WHERE email_provider_id = $1`,
    [providerID]
  );
}

// ============================================
// APPROVAL WORKFLOW HELPERS
// ============================================

export async function checkTierComplete(
  approvalRequestId: number,
  tier: ApprovalTier
): Promise<boolean> {
  const participants = await getParticipantsByTier(approvalRequestId, tier);

  if (participants.length === 0) return false;

  // All participants in tier must have approved
  return participants.every(p => p.status === 'approved');
}

export async function checkTierRejected(
  approvalRequestId: number,
  tier: ApprovalTier
): Promise<boolean> {
  const participants = await getParticipantsByTier(approvalRequestId, tier);

  // Any participant rejected means tier is rejected
  return participants.some(p => p.status === 'rejected');
}

export async function advanceToNextTier(
  approvalRequestId: number
): Promise<ApprovalRequest | null> {
  const approvalRequest = await getApprovalRequestById(approvalRequestId);
  if (!approvalRequest) return null;

  const currentTier = approvalRequest.current_tier;
  const nextTier = (currentTier + 1) as ApprovalTier;

  // Check if next tier has participants
  const nextTierParticipants = await getParticipantsByTier(approvalRequestId, nextTier);

  if (nextTierParticipants.length === 0) {
    // No more tiers, mark as approved
    return updateApprovalRequestStatus(approvalRequestId, 'approved');
  }

  // Advance to next tier
  const updated = await updateApprovalRequestTier(approvalRequestId, nextTier);

  // Log tier advancement
  await createActivity({
    approval_request_id: approvalRequestId,
    event_type: 'tier_advanced',
    metadata: {
      from_tier: currentTier,
      to_tier: nextTier,
    },
  });

  return updated;
}
