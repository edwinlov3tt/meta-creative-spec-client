import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { showToast } from '@/stores/toastStore';

interface ApprovalActivityListenerProps {
  approvalRequestId: number;
  currentUserEmail?: string;
}

// Get Socket.io server URL
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.PROD) {
    return window.location.origin;
  }

  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

/**
 * ApprovalActivityListener - Real-time toast notifications for approval events
 *
 * Listens to Socket.IO events and shows toast notifications for:
 * - Approval decisions (approved/rejected) - Green/Red toasts
 * - Email activity (opened/clicked) - Blue toasts
 * - Tier advancement - Blue toasts
 * - Revisions suggested - Orange toasts
 * - Comments added - Blue toasts
 */
export const ApprovalActivityListener: React.FC<ApprovalActivityListenerProps> = ({
  approvalRequestId,
  currentUserEmail,
}) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[ApprovalActivityListener] Connected to socket server');

      // Join the approval request room
      socket.emit('presence:join', {
        approvalRequestId,
        userEmail: currentUserEmail || 'activity-listener',
        userName: null,
      });
    });

    socket.on('disconnect', () => {
      console.log('[ApprovalActivityListener] Disconnected from socket server');
    });

    socket.on('connect_error', (error) => {
      console.error('[ApprovalActivityListener] Connection error:', error);
    });

    // Listen for approval decisions - Show prominent toasts
    socket.on('approval:submitted', (data: {
      status: 'approved' | 'rejected';
      participant: { id: number; email: string; name: string };
      tierAdvanced: boolean;
      newTier?: number;
      approvalComplete: boolean;
      timestamp: string;
    }) => {
      // Don't show toast if it's the current user's action
      if (currentUserEmail && data.participant.email.toLowerCase() === currentUserEmail.toLowerCase()) {
        return;
      }

      const userName = data.participant.name || data.participant.email;

      if (data.status === 'approved') {
        showToast(
          `✓ Creative approved by ${userName}`,
          'success',
          5000
        );
      } else if (data.status === 'rejected') {
        showToast(
          `✗ Creative rejected by ${userName}`,
          'error',
          5000
        );
      }
    });

    // Listen for tier advancement
    socket.on('approval:tier_advanced', (data: {
      fromTier: number;
      toTier: number;
      status: string;
      timestamp: string;
    }) => {
      const tierNames = ['', 'Client', 'AE', 'DCM'];
      const tierName = tierNames[data.toTier] || `Tier ${data.toTier}`;

      showToast(
        `↗ Moving to ${tierName} review`,
        'info',
        4000
      );
    });

    // Listen for all activity events for selective toast notifications
    socket.on('activity:new', (eventData: {
      activity: {
        event_type: string;
        user_email: string | null;
        user_name: string | null;
        metadata: Record<string, any> | null;
      };
      timestamp: string;
    }) => {
      const { activity } = eventData;

      // Don't show toast if it's the current user's action
      if (currentUserEmail && activity.user_email?.toLowerCase() === currentUserEmail.toLowerCase()) {
        return;
      }

      const userName = activity.user_name || activity.user_email || 'Someone';

      // Show toasts for specific events
      switch (activity.event_type) {
        case 'email_opened':
          showToast(
            `📧 ${userName} opened the approval email`,
            'info',
            3000
          );
          break;

        case 'revision_suggested':
          const field = activity.metadata?.element_path || 'a field';
          showToast(
            `✏️ ${userName} suggested changes to ${field}`,
            'warning',
            4000
          );
          break;

        case 'comment_added':
          showToast(
            `💬 ${userName} added a comment`,
            'info',
            3000
          );
          break;

        case 'creative_viewed':
          // Optional: Could show this but might be too noisy
          // showToast(
          //   `👁️ ${userName} is viewing the creative`,
          //   'info',
          //   2000
          // );
          break;

        // Don't show toasts for these events (too frequent or low importance)
        case 'email_sent':
        case 'email_clicked':
        case 'created':
          // Silent - activity timeline will show these
          break;
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('[ApprovalActivityListener] Cleaning up socket connection');

      if (socket.connected) {
        socket.emit('presence:leave', {
          approvalRequestId,
          userEmail: currentUserEmail || 'activity-listener',
        });
      }

      socket.disconnect();
      socketRef.current = null;
    };
  }, [approvalRequestId, currentUserEmail]);

  // This component doesn't render anything - it's just a listener
  return null;
};
