import React from 'react';
import { usePresence } from '@/hooks/usePresence';

interface PresenceChipsProps {
  approvalRequestId: string | number;
  userEmail?: string;
  userName?: string;
}

function getInitials(email: string, name?: string | null): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // Get initials from email
  const emailPart = email.split('@')[0];
  const parts = emailPart.split(/[._-]/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return emailPart.slice(0, 2).toUpperCase();
}

function getColorForEmail(email: string): string {
  // Generate consistent color based on email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];

  return colors[Math.abs(hash) % colors.length];
}

export const PresenceChips: React.FC<PresenceChipsProps> = ({
  approvalRequestId,
  userEmail,
  userName,
}) => {
  const { otherUsers, isLoading } = usePresence({
    approvalRequestId,
    userEmail,
    userName,
    enabled: !!approvalRequestId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">Connecting...</span>
      </div>
    );
  }

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-text-muted mr-1">Viewing:</span>
      <div className="flex items-center -space-x-2">
        {otherUsers.slice(0, 5).map((user) => {
          const initials = getInitials(user.user_email, user.user_name);
          const colorClass = getColorForEmail(user.user_email);
          const displayName = user.user_name || user.user_email.split('@')[0];

          return (
            <div
              key={user.id}
              className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full ${colorClass} text-white text-xs font-medium ring-2 ring-surface-0 transition-transform hover:scale-110 hover:z-10`}
              title={`${displayName} (${user.user_email})`}
            >
              {initials}
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-surface-0 rounded-full"></span>
            </div>
          );
        })}
        {otherUsers.length > 5 && (
          <div
            className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-200 text-text-muted text-xs font-medium ring-2 ring-surface-0"
            title={`${otherUsers.length - 5} more viewer${otherUsers.length - 5 > 1 ? 's' : ''}`}
          >
            +{otherUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};
