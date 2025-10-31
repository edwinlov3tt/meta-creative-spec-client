import React from 'react';
import {
  Mail,
  CheckCircle,
  XCircle,
  ArrowRight,
  Eye,
  Clock,
  User,
  MessageSquare,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { useApprovalActivity } from '@/hooks/useApprovalActivity';

interface ActivityTimelineProps {
  approvalRequestId: string | number;
  className?: string;
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email_sent: Mail,
  email_opened: Mail,
  link_clicked: Eye,
  creative_viewed: Eye,
  comment_added: MessageSquare,
  revision_submitted: MessageSquare,
  revision_suggested: Edit3,
  approved: CheckCircle,
  rejected: XCircle,
  tier_advanced: ArrowRight,
  viewed: Eye,
  revision_requested: MessageSquare,
  created: Clock,
};

const eventColors: Record<string, string> = {
  email_sent: 'text-blue-600 bg-blue-50',
  email_opened: 'text-blue-600 bg-blue-50',
  link_clicked: 'text-blue-600 bg-blue-50',
  creative_viewed: 'text-gray-600 bg-gray-50',
  comment_added: 'text-purple-600 bg-purple-50',
  revision_submitted: 'text-orange-600 bg-orange-50',
  revision_suggested: 'text-red-600 bg-red-50',
  approved: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50',
  tier_advanced: 'text-purple-600 bg-purple-50',
  viewed: 'text-gray-600 bg-gray-50',
  revision_requested: 'text-orange-600 bg-orange-50',
  created: 'text-blue-600 bg-blue-50',
};

const eventLabels: Record<string, string> = {
  email_sent: 'Email Sent',
  email_opened: 'Email Opened',
  link_clicked: 'Link Clicked',
  creative_viewed: 'Creative Viewed',
  comment_added: 'Comment Added',
  revision_submitted: 'Revision Submitted',
  revision_suggested: 'Revision Suggested',
  approved: 'Approved',
  rejected: 'Rejected',
  tier_advanced: 'Advanced to Next Tier',
  viewed: 'Viewed',
  revision_requested: 'Revision Requested',
  created: 'Created',
};

function formatTimestamp(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatFullTimestamp(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  approvalRequestId,
  className = '',
}) => {
  const { activities, isLoading, isConnected } = useApprovalActivity({
    approvalRequestId,
    enabled: !!approvalRequestId,
  });

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-spin" />
        <p className="text-gray-500 text-sm">Loading activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No activity yet</p>
        {!isConnected && (
          <p className="text-orange-500 text-xs mt-2">Real-time updates disconnected</p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-3 sm:mb-4">
          <p className="text-orange-800 text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Real-time updates disconnected. Activities will not update automatically.
          </p>
        </div>
      )}
      {activities.map((activity, index) => {
        const Icon = eventIcons[activity.event_type] || Clock;
        const colorClass = eventColors[activity.event_type] || 'text-gray-600 bg-gray-50';
        const label = eventLabels[activity.event_type] || activity.event_type;

        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="relative flex gap-3 sm:gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 sm:left-5 top-11 sm:top-10 bottom-0 w-px bg-gray-200" />
            )}

            {/* Icon - larger touch target on mobile */}
            <div className={`relative flex-shrink-0 w-10 h-10 sm:w-10 sm:h-10 rounded-full ${colorClass} flex items-center justify-center`}>
              <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4 sm:pb-6 min-h-[44px]">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-13 sm:text-sm">
                    {label}
                  </h4>

                  {/* User info - stacked vertically */}
                  {(activity.user_name || activity.user_email) && (
                    <div className="flex items-start gap-1.5 mt-1 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        {activity.user_name && <span className="font-medium truncate">{activity.user_name}</span>}
                        {activity.user_email && <span className="text-gray-500 truncate">{activity.user_email}</span>}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="mt-2 text-xs text-gray-600">
                      {activity.metadata.comments && (
                        <p className="bg-gray-50 rounded-md p-2.5 sm:p-2 border border-gray-200">
                          {activity.metadata.comments}
                        </p>
                      )}
                      {activity.metadata.from_tier && activity.metadata.to_tier && (
                        <p>
                          Tier {activity.metadata.from_tier} → Tier {activity.metadata.to_tier}
                        </p>
                      )}
                      {activity.metadata.participant_count !== undefined && (
                        <p>
                          {activity.metadata.participant_count} participant(s)
                        </p>
                      )}
                      {/* Show revision details */}
                      {activity.metadata.revision_count !== undefined && activity.metadata.revision_count > 0 && (
                        <div className="bg-orange-50 rounded-md p-2.5 sm:p-2 border border-orange-200 mt-2">
                          <p className="font-medium text-orange-900 mb-1">
                            {activity.metadata.revision_count} revision{activity.metadata.revision_count !== 1 ? 's' : ''} submitted
                          </p>
                          {activity.metadata.fields && Array.isArray(activity.metadata.fields) && (
                            <ul className="list-disc list-inside text-orange-800 space-y-0.5">
                              {activity.metadata.fields.map((field: string, idx: number) => (
                                <li key={idx}>{field}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {/* Show geolocation data */}
                      {activity.metadata.geo && (
                        <div className="bg-blue-50 rounded-md p-2.5 sm:p-2 border border-blue-200 mt-2 flex items-center gap-2">
                          <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="text-blue-800 text-11 sm:text-xs min-w-0">
                            {activity.metadata.geo.city && activity.metadata.geo.region && (
                              <span className="truncate block">{activity.metadata.geo.city}, {activity.metadata.geo.region}</span>
                            )}
                            {activity.metadata.geo.country && (
                              <span className={activity.metadata.geo.city ? " • " : ""}>{activity.metadata.geo.country}</span>
                            )}
                            {activity.metadata.geo.ip && !activity.metadata.geo.city && (
                              <span className="text-blue-600">{activity.metadata.geo.ip}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex-shrink-0 text-right">
                  <time
                    className="text-11 sm:text-xs text-gray-500 whitespace-nowrap"
                    dateTime={new Date(activity.created_at).toISOString()}
                    title={formatFullTimestamp(activity.created_at)}
                  >
                    {formatTimestamp(activity.created_at)}
                  </time>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
