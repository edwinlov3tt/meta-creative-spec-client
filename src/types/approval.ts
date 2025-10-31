// Approval System Type Definitions
// Created: 2025-10-19

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type StakeholderRole = 'client' | 'ae' | 'dcm' | 'buyer';

export type ApprovalStatus =
  | 'pending'
  | 'in_review'
  | 'needs_revision'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type ApprovalTier = 1 | 2 | 3;

export type ShareMethod = 'link' | 'email';

export type ParticipantStatus =
  | 'pending'
  | 'viewed'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export type ElementRevisionStatus =
  | 'approved'
  | 'approved_with_changes'
  | 'not_approved';

export type ActivityEventType =
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_bounced'
  | 'email_spam_complaint'
  | 'link_clicked'
  | 'creative_viewed'
  | 'comment_added'
  | 'comment_replied'
  | 'comment_resolved'
  | 'comment_unresolved'
  | 'revision_submitted'
  | 'revision_suggested'
  | 'approved'
  | 'rejected'
  | 'tier_advanced';

// Element paths for ad copy fields
export type ElementPath =
  | 'ad_copy.adName'
  | 'ad_copy.primaryText'
  | 'ad_copy.headline'
  | 'ad_copy.description'
  | 'ad_copy.callToAction'
  | 'ad_copy.destinationUrl'
  | 'ad_copy.displayLink';

// ============================================
// STAKEHOLDER TYPES
// ============================================

export interface Stakeholder {
  id: number;
  advertiser_id: number;
  name: string;
  email: string;
  role: StakeholderRole;
  created_at: string;
  updated_at: string;
}

export interface StakeholderInput {
  advertiser_id: number;
  name: string;
  email: string;
  role: StakeholderRole;
}

// ============================================
// APPROVAL REQUEST TYPES
// ============================================

export interface ApprovalRequest {
  id: number;
  ad_id: number;
  advertiser_id: number;
  status: ApprovalStatus;
  current_tier: ApprovalTier;
  share_method: ShareMethod;
  share_token: string | null;
  email_restrictions: string[] | null;
  initiated_by_email: string | null;
  initiated_at: string;
  completed_at: string | null;
  expires_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequestInput {
  ad_id: number;
  advertiser_id: number;
  share_method: ShareMethod;
  email_restrictions?: string[];
  initiated_by_email?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface ApprovalRequestWithDetails extends ApprovalRequest {
  ad: {
    short_id: string;
    ad_copy: {
      adName: string;
      primaryText: string;
      headline: string;
      description: string;
    };
  };
  participants: ApprovalParticipant[];
  activity: ApprovalActivity[];
}

// ============================================
// PARTICIPANT TYPES
// ============================================

export interface ApprovalParticipant {
  id: number;
  approval_request_id: number;
  stakeholder_id: number | null;
  email: string;
  name: string | null;
  role: StakeholderRole;
  tier: ApprovalTier;
  status: ParticipantStatus;
  responded_at: string | null;
  created_at: string;
}

export interface ApprovalParticipantInput {
  approval_request_id: number;
  stakeholder_id?: number;
  email: string;
  name?: string;
  role: StakeholderRole;
  tier: ApprovalTier;
}

export interface ParticipantWithStakeholder extends ApprovalParticipant {
  stakeholder?: Stakeholder;
}

// ============================================
// ELEMENT REVISION TYPES
// ============================================

export interface ElementRevision {
  id: number;
  approval_request_id: number;
  participant_id: number;
  element_path: ElementPath;
  original_value: string | null;
  revised_value: string | null;
  comment: string | null;
  status: ElementRevisionStatus;
  parent_revision_id: number | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface ElementRevisionInput {
  approval_request_id: number;
  participant_id: number;
  element_path: ElementPath;
  original_value?: string;
  revised_value?: string;
  comment?: string;
  status: ElementRevisionStatus;
  parent_revision_id?: number;
  ip_address?: string;
  user_agent?: string;
}

export interface ElementRevisionWithParticipant extends ElementRevision {
  participant: ApprovalParticipant;
}

export interface ThreadedElementRevision extends ElementRevision {
  participant: ApprovalParticipant;
  replies: ThreadedElementRevision[];
}

// ============================================
// ACTIVITY TRACKING TYPES
// ============================================

export interface ApprovalActivity {
  id: number;
  approval_request_id: number;
  participant_id: number | null;
  event_type: ActivityEventType;
  user_email: string | null;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ApprovalActivityInput {
  approval_request_id: number;
  participant_id?: number;
  event_type: ActivityEventType;
  user_email?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface ApprovalActivityWithParticipant extends ApprovalActivity {
  participant?: ApprovalParticipant;
}

// ============================================
// EMAIL TRACKING TYPES
// ============================================

export interface EmailTracking {
  id: number;
  approval_request_id: number;
  participant_id: number | null;
  email_provider_id: string | null;
  recipient_email: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  open_count: number;
  click_count: number;
  metadata: Record<string, any> | null;
}

export interface EmailTrackingInput {
  approval_request_id: number;
  participant_id?: number;
  email_provider_id?: string;
  recipient_email: string;
  metadata?: Record<string, any>;
}

// ============================================
// FORM/UI TYPES
// ============================================

export interface ApprovalShareFormData {
  share_method: ShareMethod;
  email_restrictions: string[];
  expires_in_days: number;
  participants: {
    tier_1: { email: string; name: string; role: StakeholderRole }[];
    tier_2: { email: string; name: string; role: StakeholderRole }[];
    tier_3: { email: string; name: string; role: StakeholderRole }[];
  };
  initiated_by_email: string;
}

export interface ElementReviewFormData {
  element_path: ElementPath;
  status: ElementRevisionStatus;
  revised_value?: string;
  comment?: string;
}

export interface ApprovalResponseFormData {
  participant_id: number;
  overall_status: ParticipantStatus;
  element_reviews: ElementReviewFormData[];
  general_comments?: string;
}

// ============================================
// RESPONSE TYPES (for API)
// ============================================

export interface ApprovalInitiateResponse {
  success: boolean;
  data: {
    approval_request: ApprovalRequest;
    share_url?: string;
    emails_sent?: number;
  };
  error?: string;
}

export interface ApprovalStatusResponse {
  success: boolean;
  data: {
    approval_request: ApprovalRequestWithDetails;
    can_approve: boolean;
    current_user_participant?: ApprovalParticipant;
  };
  error?: string;
}

export interface ApprovalSubmitResponse {
  success: boolean;
  data: {
    participant: ApprovalParticipant;
    tier_advanced: boolean;
    new_tier?: ApprovalTier;
    approval_complete?: boolean;
  };
  error?: string;
}

// ============================================
// HELPER TYPES
// ============================================

export interface TierProgress {
  tier: ApprovalTier;
  total_participants: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  is_complete: boolean;
}

export interface ApprovalSummary {
  approval_request: ApprovalRequest;
  tier_progress: TierProgress[];
  total_revisions: number;
  total_comments: number;
  completion_percentage: number;
}
