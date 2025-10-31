import React, { useMemo, useState } from 'react';
import { Edit3, ChevronDown } from 'lucide-react';
import { CopyableField } from '@/components/UI/CopyableField';
import { useCreativeStore } from '@/stores/creativeStore';
import { useApproval } from '@/contexts/ApprovalContext';
import { cn } from '@/utils/cn';

interface ApprovalFormViewProps {
  isPreview?: boolean;
}

const PRIMARY_TEXT_LIMIT = 125;
const HEADLINE_LIMIT = 40;
const DESCRIPTION_LIMIT = 30;

const CTA_OPTIONS = [
  'No Button', 'Apply Now', 'Book Now', 'Call Now', 'Contact Us',
  'Donate Now', 'Download', 'Get Access', 'Get Offer', 'Get Quote',
  'Get Showtimes', 'Learn More', 'Listen Now', 'Order Now', 'Play Game',
  'Request Time', 'See Menu', 'Send Message', 'Shop Now', 'Sign Up',
  'Subscribe', 'Watch More'
];

// Editable Revision Field - inline editing with red hover in revision mode
interface EditableRevisionFieldProps {
  fieldLabel: string;
  fieldPath: string;
  value: string;
  originalValue: string;
  isRevisionMode: boolean;
  onRevisionChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  type?: 'text' | 'select';
  selectOptions?: string[];
  showCounter?: boolean;
  counterLimit?: number;
  extraContent?: React.ReactNode;
}

const EditableRevisionField: React.FC<EditableRevisionFieldProps> = ({
  fieldLabel,
  value,
  originalValue,
  isRevisionMode,
  onRevisionChange,
  placeholder,
  multiline = false,
  maxLength,
  type = 'text',
  selectOptions = [],
  showCounter = false,
  counterLimit,
  extraContent,
}) => {
  if (!isRevisionMode) {
    return <CopyableField label={fieldLabel} value={value} multiline={multiline} />;
  }

  const hasRevision = value !== originalValue;

  const renderCounter = (value: number, limit: number) => (
    <span className={`text-11 ${value > limit * 0.9 ? 'text-danger' : 'text-text-muted'}`}>
      ({value}/{limit})
    </span>
  );

  return (
    <div
      className={cn(
        'relative group transition-all rounded-lg p-2 -m-2',
        'hover:bg-red-50 hover:shadow-sm',
        hasRevision && 'bg-red-50 border border-red-200'
      )}
      title="Click to revise"
    >
      {/* Revise icon overlay */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-red-600 text-white rounded-full p-1.5 flex items-center gap-1">
          <Edit3 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium pr-1">Revise</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-12 text-text-muted font-medium">{fieldLabel}</label>
          {showCounter && counterLimit && renderCounter(value.length, counterLimit)}
        </div>
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onRevisionChange(e.target.value)}
            className={cn(
              'form-select',
              hasRevision && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
          >
            {selectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            value={value}
            onChange={(e) => onRevisionChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'form-textarea h-20',
              hasRevision && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
            maxLength={maxLength}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onRevisionChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'form-input',
              hasRevision && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
            maxLength={maxLength}
          />
        )}
        {extraContent}
        {hasRevision && (
          <p className="text-11 text-red-600">
            <Edit3 className="w-3 h-3 inline mr-1" />
            Revision pending
          </p>
        )}
      </div>
    </div>
  );
};

export const ApprovalFormView: React.FC<ApprovalFormViewProps> = ({ isPreview = false }) => {
  const { isRevisionMode, addRevision } = useApproval();
  const [showAdditional, setShowAdditional] = useState(false);

  const facebookLink = useCreativeStore(state => state.brief.facebookLink);
  const creativeType = useCreativeStore(state => state.brief.creativeType);
  const isFlighted = useCreativeStore(state => state.brief.isFlighted);
  const flightStartDate = useCreativeStore(state => state.brief.flightStartDate);
  const flightEndDate = useCreativeStore(state => state.brief.flightEndDate);
  const updateBriefField = useCreativeStore(state => state.updateBriefField);
  const facebook = useCreativeStore(state => state.facebook);
  const pageData = facebook.pageData;

  const adCopy = useCreativeStore(state => state.adCopy);
  const removeLimit = useCreativeStore(state => state.brief.removeCharacterLimit);
  const updateAdCopyField = useCreativeStore(state => state.updateAdCopyField);
  const utm = useCreativeStore(state => state.brief.utm);
  const updateUTM = useCreativeStore(state => state.updateUTM);

  // Store original values on mount for comparison
  const [originalValues] = React.useState({
    adName: adCopy.adName,
    primaryText: adCopy.primaryText,
    headline: adCopy.headline,
    description: adCopy.description,
    callToAction: adCopy.callToAction,
    displayLink: adCopy.displayLink,
    destinationUrl: adCopy.destinationUrl,
  });

  const handleRevisionChange = (fieldPath: string, fieldLabel: string, newValue: string) => {
    // Update the store
    const field = fieldPath.split('.')[1] as keyof typeof adCopy;
    updateAdCopyField(field, newValue);

    // Track revision
    const originalValue = originalValues[field as keyof typeof originalValues];
    if (newValue !== originalValue) {
      addRevision(fieldPath, fieldLabel, originalValue, newValue);
    }
  };

  const handlePrimaryTextRevision = (newValue: string) => {
    const limitedValue = removeLimit ? newValue : newValue.slice(0, PRIMARY_TEXT_LIMIT);
    updateAdCopyField('primaryText', limitedValue);

    if (limitedValue !== originalValues.primaryText) {
      addRevision('adCopy.primaryText', 'Primary Text', originalValues.primaryText, limitedValue);
    }
  };

  const pageCategory = useMemo(() => (pageData?.categories ? pageData.categories.join(', ') : ''), [pageData?.categories]);
  const instagramHandle = useMemo(() => {
    if (!pageData) return '';
    if (pageData.instagram_url) return pageData.instagram_url;
    const username = pageData.instagram_details?.result?.username;
    return username ? `https://www.instagram.com/${username}` : '';
  }, [pageData]);

  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Campaign Info Section */}
        <div className="space-y-4">
          <h2 className="text-18 font-semibold text-text-primary border-b border-divider pb-2">
            Campaign Info
          </h2>

          <div className="space-y-4">
            {isPreview ? (
              <>
                <CopyableField label="Advertiser Facebook Link" value={facebookLink} />
                <CopyableField label="Creative Type" value={(creativeType || 'traffic').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                <CopyableField label="Is Creative Flighted?" value={isFlighted ? 'Yes' : 'No'} />
                {isFlighted && (
                  <div className="grid grid-cols-2 gap-3">
                    <CopyableField label="Flight Start Date" value={flightStartDate || 'Not set'} />
                    <CopyableField label="Flight End Date" value={flightEndDate || 'Not set'} />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">Advertiser Facebook Link</label>
                  <input
                    type="url"
                    value={facebookLink}
                    readOnly
                    className="form-input bg-surface-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">Creative Type</label>
                  <select
                    value={creativeType}
                    onChange={(e) => updateBriefField('creativeType', e.target.value as any)}
                    className="form-select bg-surface-50"
                    disabled
                  >
                    <option value="traffic">Traffic</option>
                    <option value="brand_awareness">Brand Awareness</option>
                    <option value="retargeting">Retargeting</option>
                    <option value="engagement">Engagement</option>
                    <option value="conversions">Conversions</option>
                    <option value="leads_sales">Leads/Sales</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">
                    Is this creative flighted?
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-14 cursor-pointer">
                      <input
                        type="radio"
                        name="isFlighted"
                        checked={isFlighted === true}
                        onChange={() => updateBriefField('isFlighted', true)}
                        className="w-4 h-4"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-14 cursor-pointer">
                      <input
                        type="radio"
                        name="isFlighted"
                        checked={isFlighted === false}
                        onChange={() => updateBriefField('isFlighted', false)}
                        className="w-4 h-4"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {isFlighted && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-12 text-text-muted font-medium">Flight Start Date</label>
                      <input
                        type="date"
                        value={flightStartDate}
                        onChange={(e) => updateBriefField('flightStartDate', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-12 text-text-muted font-medium">Flight End Date</label>
                      <input
                        type="date"
                        value={flightEndDate}
                        onChange={(e) => updateBriefField('flightEndDate', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Additional Settings Section - Only in Preview Mode */}
        {isPreview && (
          <div className="border border-border rounded-card">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-left text-12 font-semibold text-text-primary hover:bg-surface-50 transition-colors"
              onClick={() => setShowAdditional(prev => !prev)}
            >
              <span>Additional Settings</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdditional ? 'rotate-180' : ''}`} />
            </button>
            {showAdditional && (
              <div className="px-4 pb-4 space-y-4">
                {/* Facebook Page Data Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <CopyableField label="Facebook Page ID" value={pageData?.page_id || ''} />
                  <CopyableField label="Page Category" value={pageCategory} />
                  <div className="col-span-2">
                    <CopyableField label="Page Name" value={pageData?.name || ''} />
                  </div>
                  <div className="col-span-2">
                    <CopyableField label="Instagram Handle" value={instagramHandle} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ad Details Section */}
        <div className="space-y-4">
          <h2 className="text-18 font-semibold text-text-primary border-b border-divider pb-2">
            Ad Details
          </h2>

          <div className="space-y-4">
            {isPreview ? (
              <>
                <CopyableField label="Ad Name" value={adCopy.adName} />
                <CopyableField label="Primary Text" value={adCopy.primaryText} multiline />
                <CopyableField label="Headline" value={adCopy.headline} />
                <CopyableField label="Description" value={adCopy.description} />

                {/* Reorganized: CTA | Display Link in one row */}
                <div className="grid grid-cols-2 gap-4">
                  <CopyableField label="Call to Action" value={adCopy.callToAction} />
                  <CopyableField label="Display Link" value={adCopy.displayLink} />
                </div>

                {/* Destination URL full width below */}
                <CopyableField label="Destination URL" value={adCopy.destinationUrl} />

                {/* UTM Parameters */}
                <div className="space-y-2">
                  <span className="text-12 text-text-muted font-medium">UTM Parameters</span>
                  <div className="grid grid-cols-2 gap-3">
                    <CopyableField label="Campaign" value={utm.campaign} />
                    <CopyableField label="Medium" value={utm.medium} />
                    <CopyableField label="Source" value={utm.source} />
                    <CopyableField label="Content" value={utm.content} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <EditableRevisionField
                  fieldLabel="Ad Name"
                  fieldPath="adCopy.adName"
                  value={adCopy.adName}
                  originalValue={originalValues.adName}
                  isRevisionMode={isRevisionMode}
                  onRevisionChange={(value) => handleRevisionChange('adCopy.adName', 'Ad Name', value)}
                  placeholder="Descriptive name for internal reference"
                />

                <EditableRevisionField
                  fieldLabel="Primary Text"
                  fieldPath="adCopy.primaryText"
                  value={adCopy.primaryText}
                  originalValue={originalValues.primaryText}
                  isRevisionMode={isRevisionMode}
                  onRevisionChange={handlePrimaryTextRevision}
                  placeholder="Main ad copy that appears in the post"
                  multiline
                  maxLength={removeLimit ? undefined : PRIMARY_TEXT_LIMIT}
                  showCounter={!removeLimit}
                  counterLimit={PRIMARY_TEXT_LIMIT}
                  extraContent={
                    <div className="flex items-center justify-between">
                      <span className={`text-11 ${!removeLimit && adCopy.primaryText.length > PRIMARY_TEXT_LIMIT * 0.9 ? 'text-danger' : 'text-text-muted'}`}>
                        {removeLimit ? 'Unlimited copy enabled (See more preview applied)' : `${PRIMARY_TEXT_LIMIT - adCopy.primaryText.length} characters remaining`}
                      </span>
                      <label className="flex items-center gap-2 text-11 text-text-muted">
                        <input
                          type="checkbox"
                          className="meta-checkbox"
                          checked={removeLimit}
                          onChange={(e) => updateBriefField('removeCharacterLimit', e.target.checked)}
                          disabled={isRevisionMode}
                        />
                        Allow full-length copy
                      </label>
                    </div>
                  }
                />

                <EditableRevisionField
                  fieldLabel="Headline"
                  fieldPath="adCopy.headline"
                  value={adCopy.headline}
                  originalValue={originalValues.headline}
                  isRevisionMode={isRevisionMode}
                  onRevisionChange={(value) => handleRevisionChange('adCopy.headline', 'Headline', value.slice(0, HEADLINE_LIMIT))}
                  placeholder="Bold headline text"
                  maxLength={HEADLINE_LIMIT}
                  showCounter
                  counterLimit={HEADLINE_LIMIT}
                />

                <EditableRevisionField
                  fieldLabel="Description"
                  fieldPath="adCopy.description"
                  value={adCopy.description}
                  originalValue={originalValues.description}
                  isRevisionMode={isRevisionMode}
                  onRevisionChange={(value) => handleRevisionChange('adCopy.description', 'Description', value.slice(0, DESCRIPTION_LIMIT))}
                  placeholder="Brief description"
                  maxLength={DESCRIPTION_LIMIT}
                  showCounter
                  counterLimit={DESCRIPTION_LIMIT}
                />

                {/* Reorganized: CTA | Display Link in one row */}
                <div className="grid grid-cols-2 gap-4">
                  <EditableRevisionField
                    fieldLabel="Call to Action"
                    fieldPath="adCopy.callToAction"
                    value={adCopy.callToAction}
                    originalValue={originalValues.callToAction}
                    isRevisionMode={isRevisionMode}
                    onRevisionChange={(value) => handleRevisionChange('adCopy.callToAction', 'Call to Action', value)}
                    type="select"
                    selectOptions={CTA_OPTIONS}
                  />

                  <EditableRevisionField
                    fieldLabel="Display Link"
                    fieldPath="adCopy.displayLink"
                    value={adCopy.displayLink}
                    originalValue={originalValues.displayLink}
                    isRevisionMode={isRevisionMode}
                    onRevisionChange={(value) => handleRevisionChange('adCopy.displayLink', 'Display Link', value)}
                    placeholder="example.com"
                  />
                </div>

                {/* Destination URL full width below */}
                <EditableRevisionField
                  fieldLabel="Destination URL"
                  fieldPath="adCopy.destinationUrl"
                  value={adCopy.destinationUrl}
                  originalValue={originalValues.destinationUrl}
                  isRevisionMode={isRevisionMode}
                  onRevisionChange={(value) => handleRevisionChange('adCopy.destinationUrl', 'Destination URL', value)}
                  placeholder="https://example.com"
                />

                {/* UTM Parameters */}
                <div className="space-y-2">
                  <span className="text-12 text-text-muted font-medium">UTM Parameters</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={utm.campaign}
                      onChange={(e) => updateUTM({ campaign: e.target.value })}
                      placeholder="utm_campaign"
                      className="form-input"
                    />
                    <input
                      type="text"
                      value={utm.medium}
                      onChange={(e) => updateUTM({ medium: e.target.value })}
                      placeholder="utm_medium"
                      className="form-input"
                    />
                    <input
                      type="text"
                      value={utm.source}
                      onChange={(e) => updateUTM({ source: e.target.value })}
                      placeholder="utm_source"
                      className="form-input"
                    />
                    <input
                      type="text"
                      value={utm.content}
                      onChange={(e) => updateUTM({ content: e.target.value })}
                      placeholder="utm_content (optional)"
                      className="form-input"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
