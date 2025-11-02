import React, { useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import { ActivityTimeline } from './ActivityTimeline';
import { Check, X, Clock, Users, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import type { ApprovalRequestWithDetails } from '@/types/approval';
import { API_BASE_URL } from '@/services/api';

interface ApprovalDrawerProps {
  approvalData: ApprovalRequestWithDetails;
  userEmail?: string;
  onApprovalUpdate?: () => void;
  defaultOpen?: boolean;
  onReject?: () => void;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> },
    in_review: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Users className="w-3 h-3" /> },
    approved: { bg: 'bg-green-100', text: 'text-green-700', icon: <Check className="w-3 h-3" /> },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: <X className="w-3 h-3" /> },
  };

  const style = styles[status] || styles.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.icon}
      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

export const ApprovalDrawer: React.FC<ApprovalDrawerProps> = ({
  approvalData,
  userEmail,
  onApprovalUpdate,
  defaultOpen = true,
  onReject,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find current user's participant record
  const currentParticipant = userEmail
    ? approvalData.participants.find(p => p.email.toLowerCase() === userEmail.toLowerCase())
    : null;

  // Check if user can approve
  const canApprove =
    currentParticipant &&
    currentParticipant.tier === approvalData.current_tier &&
    currentParticipant.status === 'pending';

  // Get current tier participants
  const tierParticipants = approvalData.participants.filter(
    p => p.tier === approvalData.current_tier
  );

  const handleApprove = async () => {
    if (!currentParticipant) return;

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
        onApprovalUpdate?.();
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
    if (!currentParticipant) return;

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
        showToast('Creative rejected - Click on form fields to suggest revisions', 'info');

        // Close the drawer
        setIsOpen(false);

        // Trigger the onReject callback to open the left panel
        onReject?.();

        onApprovalUpdate?.();
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

  const tierName = approvalData.current_tier === 1 ? 'Client' : approvalData.current_tier === 2 ? 'Account Executive' : 'Digital Campaign Manager';

  return (
    <>
      {/* Collapsed State - Desktop: Button on right edge, Mobile: Bottom tab */}
      {!isOpen && (
        <>
          {/* Desktop collapsed button */}
          <button
            onClick={() => setIsOpen(true)}
            className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 bg-meta-blue text-white px-3 py-6 rounded-l-lg shadow-lg hover:bg-blue-600 transition-all z-50 flex-col items-center gap-2"
            aria-label="Open approval panel"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-xs font-medium" style={{ writingMode: 'vertical-rl' }}>
              Approval
            </span>
          </button>

          {/* Mobile collapsed button */}
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden fixed bottom-4 right-4 bg-meta-blue text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-all z-50 flex items-center gap-2"
            aria-label="Open approval panel"
          >
            <Users className="w-5 h-5" />
            <span className="text-14 font-semibold">Approval</span>
          </button>
        </>
      )}

      {/* Drawer Panel - Desktop: Right sidebar, Mobile: Bottom sheet */}
      <div
        className={`fixed bg-white shadow-2xl transition-transform duration-300 ease-in-out z-50
          bottom-0 left-0 right-0 w-full max-h-[85vh] rounded-t-2xl border-t
          lg:top-0 lg:bottom-auto lg:left-auto lg:right-0 lg:h-full lg:w-[420px] lg:max-h-full lg:border-l lg:border-t-0 lg:rounded-none
          ${isOpen ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-full'}
        `}
      >
        {/* Mobile drag handle */}
        <div className="lg:hidden flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-divider bg-surface-50">
          <h2 className="text-16 font-semibold text-text-primary">Approval Status</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close approval panel"
          >
            <ChevronRight className="w-5 h-5 text-text-muted lg:block hidden" />
            <X className="w-5 h-5 text-text-muted lg:hidden block" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Status Badge */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(approvalData.status)}
                <span className="text-12 text-text-muted">
                  Tier {approvalData.current_tier}: {tierName}
                </span>
              </div>
            </div>

            {/* Expiration */}
            {approvalData.expires_at && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-12 text-blue-700">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Expires: {new Date(approvalData.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}

            {/* Current Tier Participants */}
            <div>
              <h3 className="text-14 font-semibold text-text-primary mb-3">Current Reviewers</h3>
              <div className="space-y-2">
                {tierParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="bg-surface-50 border border-border rounded-lg p-3 min-h-[44px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-13 font-medium text-text-primary truncate">
                          {participant.name || participant.email}
                        </p>
                        <p className="text-11 text-text-muted truncate">{participant.email}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(participant.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {canApprove && (
              <div className="space-y-3 sticky bottom-0 bg-white pt-4 pb-2 border-t border-divider">
                <h3 className="text-14 font-semibold text-text-primary">Your Review</h3>
                <div className="space-y-2">
                  <Button
                    onClick={handleApprove}
                    variant="default"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] text-15"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
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
                    className="w-full min-h-[48px] text-15"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {!canApprove && currentParticipant && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-12 text-blue-700">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                  {currentParticipant.status === 'approved' || currentParticipant.status === 'rejected'
                    ? `You have already ${currentParticipant.status} this creative.`
                    : `Waiting for Tier ${approvalData.current_tier} review.`}
                </p>
              </div>
            )}

            {/* Activity Timeline */}
            <div>
              <h3 className="text-14 font-semibold text-text-primary mb-3">Activity</h3>
              <ActivityTimeline approvalRequestId={approvalData.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
