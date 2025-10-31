import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/UI/Button';

interface CommentReplyProps {
  approvalRequestId: number;
  participantId: number;
  parentRevisionId: number;
  onReplySubmitted: () => void;
  onCancel: () => void;
}

export const CommentReply: React.FC<CommentReplyProps> = ({
  approvalRequestId,
  participantId,
  parentRevisionId,
  onReplySubmitted,
  onCancel,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/approval/comments/${approvalRequestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          comment: replyText,
          parent_revision_id: parentRevisionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReplyText('');
        onReplySubmitted();
      } else {
        alert(result.error || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Reply submission error:', error);
      alert('Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-50 border border-border rounded-lg p-3">
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Write a reply..."
        className="w-full border border-border rounded-lg px-3 py-2 text-14 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={3}
        disabled={isSubmitting}
        autoFocus
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          size="sm"
          disabled={!replyText.trim() || isSubmitting}
        >
          <Send className="w-3 h-3 mr-1" />
          {isSubmitting ? 'Sending...' : 'Send Reply'}
        </Button>
      </div>
    </form>
  );
};
