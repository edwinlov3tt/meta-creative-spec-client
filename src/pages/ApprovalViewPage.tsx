import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Spinner } from '@/components/UI/Spinner';
import { Button } from '@/components/UI/Button';
import { Check, X, AlertCircle, Clock, Users } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import { ToastContainer } from '@/components/UI/ToastContainer';
import { ActivityTimeline } from '@/components/approval/ActivityTimeline';
import type { ApprovalRequestWithDetails, ApprovalParticipant } from '@/types/approval';
import { API_BASE_URL } from '@/services/api';

export const ApprovalViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const userEmail = searchParams.get('email');

  const [isLoading, setIsLoading] = useState(true);
  const [approvalData, setApprovalData] = useState<ApprovalRequestWithDetails | null>(null);
  const [canApprove, setCanApprove] = useState(false);
  const [currentParticipant, setCurrentParticipant] = useState<ApprovalParticipant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadApprovalData();
    }
  }, [token, userEmail]);

  const loadApprovalData = async () => {
    try {
      setIsLoading(true);

      const url = userEmail
        ? `/api/approval/token/${token}?email=${encodeURIComponent(userEmail)}`
        : `/api/approval/token/${token}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setApprovalData(result.data.approval_request);
        setCanApprove(result.data.can_approve);
        setCurrentParticipant(result.data.current_user_participant || null);
      } else {
        showToast(result.error || 'Failed to load approval', 'error');
      }
    } catch (error) {
      console.error('Failed to load approval data:', error);
      showToast('Failed to load approval', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!currentParticipant || !approvalData) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/approval/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_request_id: approvalData.id,
          participant_id: currentParticipant.id,
          status: 'approved',
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Creative approved successfully', 'success');
        await loadApprovalData();
      } else {
        showToast(result.error || 'Failed to submit approval', 'error');
      }
    } catch (error) {
      console.error('Approval submission error:', error);
      showToast('Failed to submit approval', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!currentParticipant || !approvalData) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/approval/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_request_id: approvalData.id,
          participant_id: currentParticipant.id,
          status: 'rejected',
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Creative rejected', 'info');
        await loadApprovalData();
      } else {
        showToast(result.error || 'Failed to submit rejection', 'error');
      }
    } catch (error) {
      console.error('Rejection submission error:', error);
      showToast('Failed to submit rejection', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> },
      in_review: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Users className="w-3 h-3" /> },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: <Check className="w-3 h-3" /> },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: <X className="w-3 h-3" /> },
      needs_revision: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <AlertCircle className="w-3 h-3" /> },
    };

    const style = styles[status] || styles.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-14 text-text-muted">Loading approval...</p>
        </div>
      </div>
    );
  }

  if (!approvalData) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-danger" />
          <p className="text-16 font-semibold text-text-primary">Approval Not Found</p>
          <p className="text-14 text-text-muted">
            The approval you're looking for doesn't exist or has expired.
          </p>
        </div>
      </div>
    );
  }

  const tierParticipants = approvalData.participants.filter(p => p.tier === approvalData.current_tier);
  const isCurrentTier = currentParticipant && currentParticipant.tier === approvalData.current_tier;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile sticky header */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-16 font-semibold text-text-primary truncate">
              {approvalData.ad?.ad_copy?.adName || 'Untitled Ad'}
            </h1>
            <p className="text-12 text-text-muted">Approval Request</p>
          </div>
          <div className="flex-shrink-0 ml-3">
            {getStatusBadge(approvalData.status)}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header - Hidden on mobile (shown in sticky header instead) */}
        <div className="hidden lg:block bg-white rounded-card border border-border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-24 font-semibold text-text-primary mb-2">
                Creative Approval Request
              </h1>
              <p className="text-14 text-text-muted">
                Ad: {approvalData.ad?.ad_copy?.adName || 'Untitled Ad'}
              </p>
            </div>
            <div>
              {getStatusBadge(approvalData.status)}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-11 text-text-muted mb-1">Current Tier</p>
              <p className="text-14 font-medium">
                Tier {approvalData.current_tier}:{' '}
                {approvalData.current_tier === 1 ? 'Client' : approvalData.current_tier === 2 ? 'AE' : 'DCM'}
              </p>
            </div>
            <div>
              <p className="text-11 text-text-muted mb-1">Initiated</p>
              <p className="text-14 font-medium">
                {new Date(approvalData.initiated_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-11 text-text-muted mb-1">Expires</p>
              <p className="text-14 font-medium">
                {approvalData.expires_at
                  ? new Date(approvalData.expires_at).toLocaleDateString()
                  : 'No expiration'}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile info cards */}
        <div className="lg:hidden grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-lg border border-border p-3">
            <p className="text-10 text-text-muted mb-1">Tier</p>
            <p className="text-13 font-medium">
              {approvalData.current_tier}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-border p-3">
            <p className="text-10 text-text-muted mb-1">Initiated</p>
            <p className="text-13 font-medium">
              {new Date(approvalData.initiated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-border p-3">
            <p className="text-10 text-text-muted mb-1">Expires</p>
            <p className="text-13 font-medium">
              {approvalData.expires_at
                ? new Date(approvalData.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'None'}
            </p>
          </div>
        </div>

        {/* Current Tier Participants */}
        <div className="bg-white rounded-card border border-border p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-16 sm:text-18 font-semibold text-text-primary mb-3 sm:mb-4">
            Tier {approvalData.current_tier} Reviewers
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {tierParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 sm:p-3 border border-border rounded-lg min-h-[44px]">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-13 sm:text-14 font-medium truncate">{participant.name || participant.email}</p>
                  <p className="text-11 sm:text-12 text-text-muted truncate">{participant.email}</p>
                </div>
                <div className="flex-shrink-0">{getStatusBadge(participant.status)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Creative Preview */}
        <div className="bg-white rounded-card border border-border p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-16 sm:text-18 font-semibold text-text-primary mb-3 sm:mb-4">Creative Preview</h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-11 sm:text-12 font-medium text-text-muted mb-1">Primary Text</p>
              <p className="text-13 sm:text-14 text-text-primary">{approvalData.ad?.ad_copy?.primaryText}</p>
            </div>
            <div>
              <p className="text-11 sm:text-12 font-medium text-text-muted mb-1">Headline</p>
              <p className="text-13 sm:text-14 text-text-primary">{approvalData.ad?.ad_copy?.headline}</p>
            </div>
            <div>
              <p className="text-11 sm:text-12 font-medium text-text-muted mb-1">Description</p>
              <p className="text-13 sm:text-14 text-text-primary">{approvalData.ad?.ad_copy?.description}</p>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-card border border-border p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-16 sm:text-18 font-semibold text-text-primary mb-3 sm:mb-4">Activity Timeline</h2>
          <ActivityTimeline approvalRequestId={approvalData.id} />
        </div>

        {/* Action Buttons - Desktop */}
        {canApprove && isCurrentTier && (
          <div className="hidden sm:block bg-white rounded-card border border-border p-6">
            <h2 className="text-18 font-semibold text-text-primary mb-4">Your Review</h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleApprove}
                variant="default"
                disabled={isSubmitting}
                className="flex-1 min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                disabled={isSubmitting}
                className="flex-1 min-h-[44px]"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Mobile floating action buttons */}
        {canApprove && isCurrentTier && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 shadow-lg z-30">
            <div className="flex items-center gap-3 max-w-md mx-auto">
              <Button
                onClick={handleApprove}
                variant="default"
                disabled={isSubmitting}
                className="flex-1 min-h-[48px] text-15 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                disabled={isSubmitting}
                className="flex-1 min-h-[48px] text-15 font-semibold"
              >
                <X className="w-5 h-5 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {!canApprove && currentParticipant && (
          <div className="bg-blue-50 border border-blue-200 rounded-card p-3 sm:p-4 mb-20 sm:mb-0">
            <p className="text-13 sm:text-14 text-blue-700">
              {currentParticipant.status === 'approved' || currentParticipant.status === 'rejected'
                ? `You have already ${currentParticipant.status} this creative.`
                : `This approval is currently in Tier ${approvalData.current_tier}. You'll be able to review it when it reaches your tier.`}
            </p>
          </div>
        )}

        {/* Add bottom padding on mobile when action buttons are visible */}
        {canApprove && isCurrentTier && <div className="sm:hidden h-20" />}
      </div>

      <ToastContainer />
    </div>
  );
};
