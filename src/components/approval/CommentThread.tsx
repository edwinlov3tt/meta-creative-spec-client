import React, { useState } from 'react';
import { MessageCircle, Check, CheckCircle, User } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { CommentReply } from './CommentReply';
import type { ThreadedElementRevision } from '@/types/approval';

interface CommentThreadProps {
  comment: ThreadedElementRevision;
  approvalRequestId: number;
  participantId: number;
  userEmail: string;
  userName: string;
  onReplySubmitted?: () => void;
  onResolveToggled?: () => void;
  canResolve?: boolean;
  depth?: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  approvalRequestId,
  participantId,
  userEmail,
  userName,
  onReplySubmitted,
  onResolveToggled,
  canResolve = false,
  depth = 0,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isResolvingToggle, setIsResolvingToggle] = useState(false);

  const isTopLevel = depth === 0;
  const isResolved = comment.is_resolved;
  const maxDepth = 3; // Maximum nesting depth

  const handleResolveToggle = async () => {
    try {
      setIsResolvingToggle(true);

      const response = await fetch(`${API_BASE_URL}/api/approval/comments/${comment.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          participant_id: participantId,
          resolve: !isResolved,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onResolveToggled?.();
      } else {
        alert(result.error || 'Failed to update comment status');
      }
    } catch (error) {
      console.error('Error toggling resolve status:', error);
      alert('Failed to update comment status');
    } finally {
      setIsResolvingToggle(false);
    }
  };

  const handleReplySubmitted = () => {
    setShowReplyForm(false);
    onReplySubmitted?.();
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`
        ${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}
        ${isResolved ? 'opacity-60' : ''}
      `}
    >
      {/* Comment Card */}
      <div
        className={`
          border rounded-lg p-4
          ${isResolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-border'}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-13 font-medium text-text-primary">
                  {comment.participant.name || comment.participant.email}
                </span>
                {isTopLevel && isResolved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-11 font-medium rounded">
                    <CheckCircle className="w-3 h-3" />
                    Resolved
                  </span>
                )}
              </div>
              <div className="text-11 text-text-muted">
                {formatTimestamp(comment.created_at)}
                {comment.element_path && isTopLevel && (
                  <span className="ml-2">· {comment.element_path.replace('ad_copy.', '')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Resolve button (only for top-level comments) */}
          {isTopLevel && canResolve && (
            <Button
              variant={isResolved ? 'secondary' : 'default'}
              size="sm"
              onClick={handleResolveToggle}
              disabled={isResolvingToggle}
              className="ml-2"
            >
              {isResolvingToggle ? (
                'Updating...'
              ) : isResolved ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Unresolve
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resolve
                </>
              )}
            </Button>
          )}
        </div>

        {/* Comment Content */}
        <div className="text-14 text-text-primary whitespace-pre-wrap pl-10">
          {comment.comment}
        </div>

        {/* Revised Value (if present) */}
        {comment.revised_value && (
          <div className="mt-3 pl-10">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-11 font-medium text-blue-700 mb-1">Suggested Change:</div>
              <div className="text-13 text-blue-900">{comment.revised_value}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isResolved && depth < maxDepth && (
          <div className="mt-3 pl-10">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-13 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Reply
            </button>
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3 pl-10">
            <CommentReply
              approvalRequestId={approvalRequestId}
              participantId={participantId}
              parentRevisionId={comment.id}
              onReplySubmitted={handleReplySubmitted}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              approvalRequestId={approvalRequestId}
              participantId={participantId}
              userEmail={userEmail}
              userName={userName}
              onReplySubmitted={onReplySubmitted}
              onResolveToggled={onResolveToggled}
              canResolve={false} // Only top-level comments can be resolved
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
