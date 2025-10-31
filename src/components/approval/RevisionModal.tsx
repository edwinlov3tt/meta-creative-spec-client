import React, { useState, useEffect } from 'react';
import { X, Edit3, Send, Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import { useElementLock } from '@/hooks/useElementLock';
import { ElementLockIndicator } from './ElementLockIndicator';
import { CommentThread } from './CommentThread';
import type { ThreadedElementRevision } from '@/types/approval';
import { API_BASE_URL } from '@/services/api';

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldLabel: string;
  fieldPath: string;
  currentValue: string;
  approvalRequestId: number;
  participantId: number;
  userEmail: string;
  userName: string;
  onRevisionSubmitted?: () => void;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
  isOpen,
  onClose,
  fieldLabel,
  fieldPath,
  currentValue,
  approvalRequestId,
  participantId,
  userEmail,
  userName,
  onRevisionSubmitted,
}) => {
  const [revisedValue, setRevisedValue] = useState(currentValue);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [comments, setComments] = useState<ThreadedElementRevision[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(true);

  // Element locking
  const {
    isLocked,
    hasLock,
    lockInfo,
    releaseLock,
    isAcquiring,
  } = useElementLock({
    approvalRequestId,
    elementPath: fieldPath,
    userEmail,
    userName,
    enabled: isOpen,
    autoExtend: true,
    onLockAcquired: () => {
      setLockError(null);
    },
    onLockFailed: (info) => {
      setLockError(`This element is currently being edited by ${info.name}`);
    },
    onLockLost: () => {
      setLockError('You have lost the edit lock on this element');
    },
  });

  // Release lock when closing modal
  useEffect(() => {
    if (!isOpen && hasLock) {
      releaseLock();
    }
  }, [isOpen, hasLock, releaseLock]);

  // Load comments for this element
  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await fetch(`${API_BASE_URL}/api/approval/comments/${approvalRequestId}`);
      const result = await response.json();

      if (result.success) {
        // Filter comments for this specific element path
        const elementComments = result.data.comments.filter(
          (c: ThreadedElementRevision) => c.element_path === fieldPath
        );
        setComments(elementComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, approvalRequestId, fieldPath]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Check if we have the lock before submitting
    if (!hasLock) {
      setLockError('You must have the edit lock to submit a revision');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/approval/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_request_id: approvalRequestId,
          participant_id: participantId,
          element_path: fieldPath,
          original_value: currentValue,
          revised_value: revisedValue,
          comment,
          status: 'pending',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload comments to show the new revision
        await loadComments();
        // Release lock before closing
        await releaseLock();
        onRevisionSubmitted?.();
        onClose();
      } else {
        alert(result.error || 'Failed to submit revision');
      }
    } catch (error) {
      console.error('Revision submission error:', error);
      alert('Failed to submit revision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    // Release lock when closing
    if (hasLock) {
      await releaseLock();
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center sm:p-4"
        onClick={handleClose}
      >
        {/* Modal - Full screen on mobile, centered dialog on desktop */}
        <div
          className="bg-white shadow-2xl w-full h-full sm:h-auto sm:rounded-lg sm:max-w-2xl sm:max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-divider flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-16 sm:text-18 font-semibold text-text-primary">Suggest Revision</h2>
                <p className="text-12 sm:text-13 text-text-muted truncate">{fieldLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
              {isAcquiring && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                  <Spinner className="w-4 h-4" />
                  <span>Acquiring lock...</span>
                </div>
              )}
              {!isAcquiring && (
                <ElementLockIndicator
                  lockInfo={lockInfo}
                  isLocked={isLocked}
                  hasLock={hasLock}
                />
              )}
              <button
                onClick={handleClose}
                className="p-2 hover:bg-surface-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable area */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
            {/* Lock Error Message */}
            {lockError && (
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-amber-900 mb-1 text-13 sm:text-14">Cannot Edit</h4>
                  <p className="text-12 sm:text-sm text-amber-700">{lockError}</p>
                </div>
              </div>
            )}

            {/* Current Value */}
            <div>
              <label className="block text-12 sm:text-13 font-medium text-text-muted mb-2">
                Current Copy
              </label>
              <div className="bg-surface-50 border border-border rounded-lg p-3 sm:p-4">
                <p className="text-13 sm:text-14 text-text-primary whitespace-pre-wrap">{currentValue}</p>
              </div>
            </div>

            {/* Revised Value */}
            <div>
              <label className="block text-12 sm:text-13 font-medium text-text-primary mb-2">
                Suggested Revision
              </label>
              <textarea
                value={revisedValue}
                onChange={(e) => setRevisedValue(e.target.value)}
                className="w-full min-h-[120px] sm:min-h-[120px] px-3 sm:px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y text-13 sm:text-14 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Enter your suggested revision..."
                disabled={!hasLock || isAcquiring}
              />
            </div>

            {/* Comment/Notes */}
            <div>
              <label className="block text-12 sm:text-13 font-medium text-text-primary mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full min-h-[80px] px-3 sm:px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y text-13 sm:text-14 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Add any notes or context for this revision..."
                disabled={!hasLock || isAcquiring}
              />
            </div>

            {/* Comment Thread Section */}
            <div className="border-t border-divider pt-4 sm:pt-6 mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted" />
                  <h3 className="text-14 sm:text-15 font-semibold text-text-primary">
                    Comments & Discussion
                  </h3>
                  {comments.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-10 sm:text-11 font-medium rounded">
                      {comments.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-12 sm:text-13 text-blue-600 hover:text-blue-700 font-medium min-h-[44px] px-3 flex items-center"
                >
                  {showComments ? 'Hide' : 'Show'}
                </button>
              </div>

              {showComments && (
                <div>
                  {isLoadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="w-6 h-6" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 bg-surface-50 rounded-lg border border-border">
                      <MessageCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
                      <p className="text-13 sm:text-14 text-text-muted">
                        No comments yet. Add a revision to start the discussion.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {comments.map((commentThread) => (
                        <CommentThread
                          key={commentThread.id}
                          comment={commentThread}
                          approvalRequestId={approvalRequestId}
                          participantId={participantId}
                          userEmail={userEmail}
                          userName={userName}
                          onReplySubmitted={loadComments}
                          onResolveToggled={loadComments}
                          canResolve={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-divider bg-surface-50 flex-shrink-0">
            <Button
              onClick={handleClose}
              variant="ghost"
              disabled={isSubmitting}
              className="min-h-[48px] px-4 sm:px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="default"
              disabled={isSubmitting || !revisedValue.trim() || !hasLock || isAcquiring}
              className="min-h-[48px] px-4 sm:px-6"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Revision
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
