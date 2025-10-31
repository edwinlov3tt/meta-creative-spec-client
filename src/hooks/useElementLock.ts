import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/services/api';

export interface LockInfo {
  email: string;
  name: string;
  lockedAt: number;
}

export interface UseElementLockOptions {
  approvalRequestId: number;
  elementPath: string;
  userEmail: string;
  userName: string;
  enabled?: boolean; // Whether to attempt locking
  autoExtend?: boolean; // Auto-extend lock after 90 seconds
  onLockAcquired?: () => void;
  onLockFailed?: (lockInfo: LockInfo) => void;
  onLockLost?: () => void;
}

export interface UseElementLockReturn {
  isLocked: boolean; // Whether element is locked by anyone
  hasLock: boolean; // Whether current user has the lock
  lockInfo: LockInfo | null;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<boolean>;
  extendLock: () => Promise<boolean>;
  isAcquiring: boolean;
}

/**
 * Hook for managing element-level locks in the approval flow
 *
 * Features:
 * - Automatically acquires lock when enabled
 * - Auto-extends lock after 90 seconds if autoExtend is true
 * - Automatically releases lock on unmount
 * - Provides lock status and control functions
 */
export function useElementLock({
  approvalRequestId,
  elementPath,
  userEmail,
  userName,
  enabled = false,
  autoExtend = true,
  onLockAcquired,
  onLockFailed,
  onLockLost,
}: UseElementLockOptions): UseElementLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [hasLock, setHasLock] = useState(false);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);

  const extendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lockAcquiredRef = useRef(false);

  /**
   * Acquire lock from the server
   */
  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!approvalRequestId || !elementPath || !userEmail || !userName) {
      return false;
    }

    setIsAcquiring(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/approval/lock/${approvalRequestId}/${encodeURIComponent(elementPath)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            name: userName,
            ttl: 120, // 2 minutes
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.data?.lockInfo) {
        setIsLocked(true);
        setHasLock(true);
        setLockInfo(result.data.lockInfo);
        lockAcquiredRef.current = true;
        onLockAcquired?.();
        return true;
      } else if (response.status === 409 && result.lockInfo) {
        // Lock is held by someone else
        setIsLocked(true);
        setHasLock(false);
        setLockInfo(result.lockInfo);
        onLockFailed?.(result.lockInfo);
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return false;
    } finally {
      setIsAcquiring(false);
    }
  }, [approvalRequestId, elementPath, userEmail, userName, onLockAcquired, onLockFailed]);

  /**
   * Release lock on the server
   */
  const releaseLock = useCallback(async (): Promise<boolean> => {
    if (!approvalRequestId || !elementPath || !userEmail || !hasLock) {
      return false;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/approval/lock/${approvalRequestId}/${encodeURIComponent(elementPath)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsLocked(false);
        setHasLock(false);
        setLockInfo(null);
        lockAcquiredRef.current = false;

        // Clear extend timer
        if (extendTimerRef.current) {
          clearTimeout(extendTimerRef.current);
          extendTimerRef.current = null;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return false;
    }
  }, [approvalRequestId, elementPath, userEmail, hasLock]);

  /**
   * Extend lock TTL on the server
   */
  const extendLock = useCallback(async (): Promise<boolean> => {
    if (!approvalRequestId || !elementPath || !userEmail || !hasLock) {
      return false;
    }

    try {
      const response = await fetch(
        `/api/approval/lock/${approvalRequestId}/${encodeURIComponent(elementPath)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            ttl: 120,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        return true;
      } else {
        // Lock was lost
        setIsLocked(false);
        setHasLock(false);
        setLockInfo(null);
        lockAcquiredRef.current = false;
        onLockLost?.();
        return false;
      }
    } catch (error) {
      console.error('Error extending lock:', error);
      return false;
    }
  }, [approvalRequestId, elementPath, userEmail, hasLock, onLockLost]);

  /**
   * Set up auto-extend timer
   */
  useEffect(() => {
    if (hasLock && autoExtend) {
      // Extend lock after 90 seconds (before the 120s TTL expires)
      extendTimerRef.current = setTimeout(() => {
        extendLock().then((success) => {
          if (success) {
            // Schedule next extension
            if (hasLock && autoExtend) {
              extendTimerRef.current = setTimeout(() => extendLock(), 90000);
            }
          }
        });
      }, 90000); // 90 seconds

      return () => {
        if (extendTimerRef.current) {
          clearTimeout(extendTimerRef.current);
          extendTimerRef.current = null;
        }
      };
    }
  }, [hasLock, autoExtend, extendLock]);

  /**
   * Acquire lock when enabled
   */
  useEffect(() => {
    if (enabled && !lockAcquiredRef.current) {
      acquireLock();
    }
  }, [enabled, acquireLock]);

  /**
   * Release lock on unmount
   */
  useEffect(() => {
    return () => {
      if (lockAcquiredRef.current) {
        // Release lock when component unmounts
        fetch(
          `/api/approval/lock/${approvalRequestId}/${encodeURIComponent(elementPath)}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail }),
            keepalive: true, // Ensure request completes even if page is unloading
          }
        ).catch((error) => {
          console.error('Error releasing lock on unmount:', error);
        });
      }

      // Clear extend timer
      if (extendTimerRef.current) {
        clearTimeout(extendTimerRef.current);
      }
    };
  }, [approvalRequestId, elementPath, userEmail]);

  return {
    isLocked,
    hasLock,
    lockInfo,
    acquireLock,
    releaseLock,
    extendLock,
    isAcquiring,
  };
}
