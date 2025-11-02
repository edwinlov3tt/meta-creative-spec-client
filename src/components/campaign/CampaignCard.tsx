import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Target } from 'lucide-react';
import { formatDate } from '@/utils/date';
import type { CampaignCard as CampaignCardType } from '@/types/campaign';

interface CampaignCardProps {
  campaign: CampaignCardType;
  advertiserIdentifier: string;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, advertiserIdentifier }) => {
  const startDate = campaign.start_date ? formatDate(campaign.start_date) : null;
  const endDate = campaign.end_date ? formatDate(campaign.end_date) : null;

  // Render thumbnail grid (2x2)
  const renderThumbnails = () => {
    const previews = campaign.ad_previews.slice(0, 4);
    const remaining = Math.max(0, campaign.ad_count - 4);

    // If no ads, show empty state
    if (previews.length === 0) {
      return (
        <div className="w-full h-full bg-surface-100 flex items-center justify-center">
          <div className="text-center text-text-muted">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-12">No ads yet</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full">
        {[0, 1, 2, 3].map((index) => {
          const preview = previews[index];

          // Last cell with "more" overlay if there are more than 4 ads
          if (index === 3 && remaining > 0) {
            return (
              <div key={index} className="relative overflow-hidden bg-surface-100 rounded-sm">
                {(preview?.creative_file?.url || preview?.creative_file?.data) && (
                  <img
                    src={preview.creative_file.url || preview.creative_file.data}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white font-semibold text-16">
                    +{remaining}
                  </span>
                </div>
              </div>
            );
          }

          // Regular thumbnail or empty slot
          return (
            <div
              key={index}
              className="overflow-hidden bg-surface-100 rounded-sm"
            >
              {(preview?.creative_file?.url || preview?.creative_file?.data) ? (
                <img
                  src={preview.creative_file.url || preview.creative_file.data}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface-200" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Link
      to={`/advertiser/${advertiserIdentifier}/campaign/${campaign.short_id}`}
      className="group block bg-white rounded-lg border border-border hover:border-meta-blue hover:shadow-md transition-all"
    >
      {/* Thumbnail Grid - 2x2 */}
      <div className="aspect-square overflow-hidden rounded-t-lg">
        {renderThumbnails()}
      </div>

      {/* Campaign Info */}
      <div className="p-4">
        <h3 className="text-16 font-semibold text-text-primary mb-2 group-hover:text-meta-blue transition-colors line-clamp-2">
          {campaign.name}
        </h3>

        {campaign.campaign_objective && (
          <p className="text-13 text-text-secondary mb-3 line-clamp-2">
            {campaign.campaign_objective}
          </p>
        )}

        {/* Stats and Dates */}
        <div className="flex items-center justify-between text-12 text-text-muted">
          <span className="font-medium">
            {campaign.ad_count} {campaign.ad_count === 1 ? 'Ad' : 'Ads'}
          </span>

          {(startDate || endDate) && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {startDate && endDate ? (
                  `${startDate} - ${endDate}`
                ) : startDate ? (
                  `Starts ${startDate}`
                ) : (
                  `Ends ${endDate}`
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
