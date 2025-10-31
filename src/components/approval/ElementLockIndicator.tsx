import React from 'react';
import { Lock, Edit3 } from 'lucide-react';
import type { LockInfo } from '@/hooks/useElementLock';

interface ElementLockIndicatorProps {
  lockInfo: LockInfo | null;
  isLocked: boolean;
  hasLock: boolean;
  className?: string;
}

/**
 * Component to display lock status for an editable element
 *
 * Shows:
 * - Lock icon with owner's name if locked by someone else
 * - Edit icon if current user has the lock
 * - Nothing if element is not locked
 */
export const ElementLockIndicator: React.FC<ElementLockIndicatorProps> = ({
  lockInfo,
  isLocked,
  hasLock,
  className = '',
}) => {
  if (!isLocked || !lockInfo) {
    return null;
  }

  // Format time since locked
  const getTimeSince = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) {
      return 'just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (hasLock) {
    // Current user has the lock - show editing indicator
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium ${className}`}>
        <Edit3 className="w-3.5 h-3.5" />
        <span>You're editing</span>
      </div>
    );
  }

  // Someone else has the lock
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium ${className}`}>
      <Lock className="w-3.5 h-3.5" />
      <span>
        Locked by <strong>{lockInfo.name}</strong> ({getTimeSince(lockInfo.lockedAt)})
      </span>
    </div>
  );
};

interface ElementLockBadgeProps {
  lockInfo: LockInfo | null;
  isLocked: boolean;
  hasLock: boolean;
  variant?: 'inline' | 'tooltip' | 'overlay';
}

/**
 * Badge-style lock indicator for compact display
 */
export const ElementLockBadge: React.FC<ElementLockBadgeProps> = ({
  lockInfo,
  isLocked,
  hasLock,
  variant = 'inline',
}) => {
  if (!isLocked || !lockInfo) {
    return null;
  }

  const icon = hasLock ? (
    <Edit3 className="w-3 h-3" />
  ) : (
    <Lock className="w-3 h-3" />
  );

  const colorClass = hasLock
    ? 'bg-blue-100 text-blue-700'
    : 'bg-amber-100 text-amber-700';

  if (variant === 'tooltip') {
    return (
      <div className="relative group">
        <div className={`p-1 rounded ${colorClass} cursor-help`}>
          {icon}
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {hasLock ? 'You are editing' : `Locked by ${lockInfo.name}`}
        </div>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className={`absolute top-2 right-2 p-1.5 rounded-full ${colorClass} shadow-sm`}>
        {icon}
      </div>
    );
  }

  // inline variant
  return (
    <div className={`inline-flex p-1 rounded ${colorClass}`}>
      {icon}
    </div>
  );
};

interface LockedOverlayProps {
  lockInfo: LockInfo;
  onRequestEdit?: () => void;
}

/**
 * Full overlay to prevent interaction with locked element
 */
export const LockedOverlay: React.FC<LockedOverlayProps> = ({
  lockInfo,
  onRequestEdit,
}) => {
  return (
    <div className="absolute inset-0 bg-black/5 backdrop-blur-[0.5px] rounded-lg flex items-center justify-center z-10">
      <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-amber-200 max-w-xs text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-amber-600" />
          <h4 className="font-semibold text-gray-900">Element Locked</h4>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          <strong>{lockInfo.name}</strong> is currently editing this element.
        </p>
        {onRequestEdit && (
          <button
            onClick={onRequestEdit}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Request to edit
          </button>
        )}
      </div>
    </div>
  );
};
