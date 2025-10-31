// Shared TypeScript types for both applications

export type CampaignStatus = 'waiting' | 'approved' | 'denied' | 'in_progress'
export type ApproverStatus = 'active' | 'on_vacation' | 'inactive'

export interface Campaign {
  id: number
  advertiser_id: number
  name: string
  description: string | null
  status: CampaignStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, any> | null
  total_ads: number
  approved_ads: number
  denied_ads: number
  pending_ads: number
}

export interface CampaignAd {
  id: number
  campaign_id: number
  ad_id: number
  display_order: number
  notes: string | null
  added_at: string
}

export interface CampaignApprover {
  id: number
  campaign_id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  is_final_decision_maker: boolean
  status: ApproverStatus
  vacation_delegate_id: number | null
  vacation_start_date: string | null
  vacation_end_date: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: number
  advertiser_id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  profile_photo_url: string | null
  password_hash: string | null
  email_verified: boolean
  is_on_vacation: boolean
  vacation_delegate_id: number | null
  vacation_start_date: string | null
  vacation_end_date: string | null
  vacation_auto_reply: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface CampaignWithAds extends Campaign {
  ads: Array<{
    id: number
    short_id: string
    ad_copy: {
      adName: string
      primaryText: string
      headline: string
      description: string
    }
    approval_status: string | null
    created_at: string
  }>
}

export interface CalendarEvent {
  id: string
  type: 'campaign' | 'ad'
  title: string
  start: string
  end: string
  status: string
  campaign_id?: number
  ad_id?: number
}

export interface DashboardStats {
  total_campaigns: number
  active_campaigns: number
  pending_approvals: number
  approved_this_month: number
  denied_this_month: number
  upcoming_end_dates: Array<{
    campaign_id: number
    campaign_name: string
    end_date: string
    days_remaining: number
  }>
}
