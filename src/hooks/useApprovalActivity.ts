import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ApprovalActivity {
  id: number;
  approval_request_id: number;
  participant_id: number | null;
  event_type: string;
  user_email: string | null;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface ActivityEvent {
  approvalRequestId: string | number;
  participantId?: number;
  eventType: string;
  userEmail?: string;
  userName?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface UseApprovalActivityOptions {
  approvalRequestId: string | number;
  enabled?: boolean;
}

// Get Socket.io server URL from environment or detect based on current host
// Socket.IO is now integrated with the Express server on the same port
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // In production, use same origin (Vercel frontend proxies to Railway backend)
  if (import.meta.env.PROD) {
    return window.location.origin;
  }

  // Development: use API server URL or default to localhost:3001
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

export function useApprovalActivity({
  approvalRequestId,
  enabled = true,
}: UseApprovalActivityOptions) {
  const [activities, setActivities] = useState<ApprovalActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial activity data
  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/approval/${approvalRequestId}`);
      const result = await response.json();

      if (result.success && result.data?.activity) {
        setActivities(result.data.activity);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('[Activity] Failed to fetch activities:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ⚠️ SOCKET.IO TEMPORARILY DISABLED
    // Real-time activity updates disabled during backend migration
    // To re-enable: Remove this block and deploy Socket.IO server
    console.log('[useApprovalActivity] Socket.IO disabled - using polling only');

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Fetch initial activities only (no socket connection)
    void fetchActivities();

    // Disable Socket.IO real-time updates
    return;

    // eslint-disable-next-line no-unreachable
    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Activity] Connected to socket server');
      setIsConnected(true);

      // Join the approval request room for activity updates
      socket.emit('presence:join', {
        approvalRequestId,
        userEmail: 'activity-listener', // Passive listener
        userName: null,
      });
    });

    socket.on('disconnect', () => {
      console.log('[Activity] Disconnected from socket server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Activity] Connection error:', error);
    });

    // Listen for new activity events
    socket.on('activity:event', (event: ActivityEvent) => {
      console.log('[Activity] Received new activity event:', event.eventType);

      // Create a new activity record from the event
      const newActivity: ApprovalActivity = {
        id: Date.now(), // Temporary ID until we fetch full data
        approval_request_id: Number(event.approvalRequestId),
        participant_id: event.participantId || null,
        event_type: event.eventType,
        user_email: event.userEmail || null,
        user_name: event.userName || null,
        ip_address: null,
        user_agent: null,
        metadata: event.metadata || null,
        created_at: new Date(event.timestamp).toISOString(),
      };

      // Add to the beginning of the list (most recent first)
      setActivities((prev) => [newActivity, ...prev]);
    });

    // Listen for comment events
    socket.on('activity:comment_added', (event: {
      approvalRequestId: string | number;
      userEmail: string;
      userName?: string;
      elementPath?: string;
      comment: string;
      timestamp: Date;
    }) => {
      console.log('[Activity] Received new comment');

      const newActivity: ApprovalActivity = {
        id: Date.now(),
        approval_request_id: Number(event.approvalRequestId),
        participant_id: null,
        event_type: 'comment',
        user_email: event.userEmail,
        user_name: event.userName || null,
        ip_address: null,
        user_agent: null,
        metadata: {
          element_path: event.elementPath,
          comment: event.comment,
        },
        created_at: new Date(event.timestamp).toISOString(),
      };

      setActivities((prev) => [newActivity, ...prev]);
    });

    // Listen for approval decisions
    socket.on('approval:decision', (event: {
      approvalRequestId: string | number;
      status: string;
      userEmail: string;
      userName?: string;
      comments?: string;
      timestamp: Date;
    }) => {
      console.log('[Activity] Received approval decision:', event.status);

      const newActivity: ApprovalActivity = {
        id: Date.now(),
        approval_request_id: Number(event.approvalRequestId),
        participant_id: null,
        event_type: event.status,
        user_email: event.userEmail,
        user_name: event.userName || null,
        ip_address: null,
        user_agent: null,
        metadata: event.comments ? { comments: event.comments } : null,
        created_at: new Date(event.timestamp).toISOString(),
      };

      setActivities((prev) => [newActivity, ...prev]);
    });

    // Listen for errors
    socket.on('activity:error', (error) => {
      console.error('[Activity] Socket error:', error);
    });

    // Clean up on unmount
    return () => {
      console.log('[Activity] Cleaning up socket connection');

      // Leave the room before disconnecting
      if (socket.connected) {
        socket.emit('presence:leave', {
          approvalRequestId,
          userEmail: 'activity-listener',
        });
      }

      // Disconnect socket
      socket.disconnect();
      socketRef.current = null;
    };
  }, [approvalRequestId, enabled]);

  // Refresh activities manually
  const refreshActivities = () => {
    void fetchActivities();
  };

  return {
    activities,
    isLoading,
    isConnected,
    refreshActivities,
  };
}
