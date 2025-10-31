import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface PresenceUser {
  id: number;
  approval_request_id: number;
  user_email: string;
  user_name: string | null;
  last_seen_at: string;
  created_at: string;
}

interface UsePresenceOptions {
  approvalRequestId: string | number;
  userEmail?: string;
  userName?: string;
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

export function usePresence({
  approvalRequestId,
  userEmail,
  userName,
  enabled = true,
}: UsePresenceOptions) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // ⚠️ SOCKET.IO TEMPORARILY DISABLED
    // Real-time presence features disabled during backend migration
    // To re-enable: Remove this block and deploy Socket.IO server
    console.log('[usePresence] Socket.IO disabled - real-time presence unavailable');
    setIsLoading(false);
    return;

    // eslint-disable-next-line no-unreachable
    if (!enabled) {
      setIsLoading(false);
      return;
    }

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
      console.log('[Presence] Connected to socket server');
      setIsConnected(true);

      // Join the approval request room
      if (userEmail) {
        socket.emit('presence:join', {
          approvalRequestId,
          userEmail,
          userName,
        });
      }

      setIsLoading(false);
    });

    socket.on('disconnect', () => {
      console.log('[Presence] Disconnected from socket server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Presence] Connection error:', error);
      setIsLoading(false);
    });

    // Listen for presence updates
    socket.on('presence:updated', (users: PresenceUser[]) => {
      console.log('[Presence] Received presence update:', users.length, 'users');
      setActiveUsers(users);
    });

    // Listen for errors
    socket.on('presence:error', (error) => {
      console.error('[Presence] Socket error:', error);
    });

    // Set up heartbeat interval (every 10 seconds)
    if (userEmail) {
      heartbeatIntervalRef.current = setInterval(() => {
        if (socket.connected) {
          socket.emit('presence:heartbeat', {
            approvalRequestId,
            userEmail,
          });
        }
      }, 10000);
    }

    // Clean up on unmount
    return () => {
      console.log('[Presence] Cleaning up socket connection');

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Leave the room before disconnecting
      if (userEmail && socket.connected) {
        socket.emit('presence:leave', {
          approvalRequestId,
          userEmail,
        });
      }

      // Disconnect socket
      socket.disconnect();
      socketRef.current = null;
    };
  }, [approvalRequestId, userEmail, userName, enabled]);

  // Filter out current user from the list
  const otherUsers = activeUsers.filter(
    (user) => user.user_email.toLowerCase() !== userEmail?.toLowerCase()
  );

  return {
    activeUsers,
    otherUsers,
    isLoading,
    isConnected,
    totalCount: activeUsers.length,
  };
}
