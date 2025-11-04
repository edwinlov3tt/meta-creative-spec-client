import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Link, Clipboard, Link2 } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { CopyableField } from '@/components/UI/CopyableField';
import { useCreativeStore } from '@/stores/creativeStore';
import { showToast } from '@/stores/toastStore';
import { slugify } from '@/utils/slugify';
import { cn } from '@/utils/cn';

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

const renderCounter = (value: number, limit: number) => (
  <span className={`text-11 ${value > limit * 0.9 ? 'text-danger' : 'text-text-muted'}`}>
    ({value}/{limit})
  </span>
);

interface AdCopyStepProps {
  fullPage?: boolean;
  isPreview?: boolean;
}

export const AdCopyStep: React.FC<AdCopyStepProps> = ({ fullPage = false, isPreview = false }) => {
  const hasGenerated = useCreativeStore(state => state.ai.hasGenerated);
  const aiState = useCreativeStore(state => state.ai);
  const [isExpanded, setIsExpanded] = useState(false);

  const adCopy = useCreativeStore(state => state.adCopy);
  const removeLimit = useCreativeStore(state => state.brief.removeCharacterLimit);
  const updateAdCopyField = useCreativeStore(state => state.updateAdCopyField);
  const updateBriefField = useCreativeStore(state => state.updateBriefField);
  const utm = useCreativeStore(state => state.brief.utm);
  const updateUTM = useCreativeStore(state => state.updateUTM);
  const clearUTM = useCreativeStore(state => state.clearUTM);
  const getTrackedUrl = useCreativeStore(state => state.getTrackedUrl);
  const applyTrackedUrl = useCreativeStore(state => state.applyTrackedUrl);
  const lastAutoContent = useRef<string>('');
  const isLocked = !hasGenerated && !aiState.isGenerating;

  const handlePrimaryTextChange = (value: string) => {
    if (removeLimit) {
      updateAdCopyField('primaryText', value);
      return;
    }
    updateAdCopyField('primaryText', value.slice(0, PRIMARY_TEXT_LIMIT));
  };

  useEffect(() => {
    if (aiState.isGenerating || hasGenerated) {
      setIsExpanded(true);
    }
  }, [aiState.isGenerating, hasGenerated]);

  useEffect(() => {
    if (!aiState.isGenerating && !hasGenerated) {
      setIsExpanded(false);
    }
  }, [aiState.isGenerating, hasGenerated]);

  const handleToggle = () => {
    if (isLocked) {
      showToast('Generate ad copy to unlock Step 2', 'warning');
      return;
    }
    setIsExpanded(prev => !prev);
  };

  useEffect(() => {
    const slug = slugify(adCopy.adName || '');
    if (!slug) return;
    const current = utm.content || '';
    if (current === slug) {
      lastAutoContent.current = slug;
      return;
    }
    if (!current || current === lastAutoContent.current) {
      updateUTM({ content: slug });
      lastAutoContent.current = slug;
    }
  }, [adCopy.adName, updateUTM, utm.content]);

  const trackedUrl = getTrackedUrl();

  const handleCopyTrackedUrl = async () => {
    if (!trackedUrl) return;
    try {
      await navigator.clipboard.writeText(trackedUrl);
      showToast('Tracked URL copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy tracked URL', error);
      showToast('Unable to copy tracked URL', 'error');
    }
  };

  const handleApplyTrackedUrl = () => {
    applyTrackedUrl();
    showToast('Destination updated with UTM parameters', 'success');
  };

  // Full-page mode: always expanded, no locking UI
  if (fullPage) {
    return (
      <div className="w-full">
        <div className="space-y-sp-4">
          {!isPreview && aiState.error && (
            <div className="bg-danger/10 border border-danger/40 text-danger text-12 font-medium rounded-md px-3 py-2">
              {aiState.error}
            </div>
          )}

          {isPreview ? (
            <>
              <CopyableField label="Ad Name" value={adCopy.adName} />
              <CopyableField label="Primary Text" value={adCopy.primaryText} multiline />
              <CopyableField label="Headline" value={adCopy.headline} />
              <CopyableField label="Description" value={adCopy.description} />
              <div className="grid grid-cols-2 gap-4">
                <CopyableField label="Destination URL" value={adCopy.destinationUrl} />
                <CopyableField label="Display Link" value={adCopy.displayLink} />
              </div>
              <CopyableField label="Call to Action" value={adCopy.callToAction} />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-12 text-text-muted font-medium">Ad Name</label>
                <input
                  type="text"
                  value={adCopy.adName}
                  onChange={(e) => updateAdCopyField('adName', e.target.value)}
                  placeholder="Descriptive name for internal reference"
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-12 text-text-muted font-medium">Primary Text</label>
                  {removeLimit ? (
                    <span className="text-11 text-text-muted">{adCopy.primaryText.length} chars</span>
                  ) : (
                    renderCounter(adCopy.primaryText.length, PRIMARY_TEXT_LIMIT)
                  )}
                </div>
                <textarea
                  value={adCopy.primaryText}
                  onChange={(e) => handlePrimaryTextChange(e.target.value)}
                  placeholder="Main ad copy that appears in the post"
                  className="form-textarea h-20"
                  maxLength={removeLimit ? undefined : PRIMARY_TEXT_LIMIT}
                />
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
                    />
                    Allow full-length copy
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-12 text-text-muted font-medium">Headline</label>
                  {renderCounter(adCopy.headline.length, HEADLINE_LIMIT)}
                </div>
                <input
                  type="text"
                  value={adCopy.headline}
                  onChange={(e) => updateAdCopyField('headline', e.target.value.slice(0, HEADLINE_LIMIT))}
                  placeholder="Bold headline text"
                  className="form-input"
                  maxLength={HEADLINE_LIMIT}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-12 text-text-muted font-medium">Description</label>
                  {renderCounter(adCopy.description.length, DESCRIPTION_LIMIT)}
                </div>
                <input
                  type="text"
                  value={adCopy.description}
                  onChange={(e) => updateAdCopyField('description', e.target.value.slice(0, DESCRIPTION_LIMIT))}
                  placeholder="Brief description"
                  className="form-input"
                  maxLength={DESCRIPTION_LIMIT}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">Destination URL</label>
                  <input
                    type="url"
                    value={adCopy.destinationUrl}
                    onChange={(e) => updateAdCopyField('destinationUrl', e.target.value)}
                    placeholder="https://example.com"
                    className="form-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">Display Link</label>
                  <input
                    type="text"
                    value={adCopy.displayLink}
                    onChange={(e) => updateAdCopyField('displayLink', e.target.value)}
                    placeholder="example.com"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-12 text-text-muted font-medium">Call to Action</label>
                <select
                  value={adCopy.callToAction}
                  onChange={(e) => updateAdCopyField('callToAction', e.target.value)}
                  className="form-select"
                >
                  {CTA_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {isPreview ? (
            <div className="space-y-2">
              <span className="text-12 text-text-muted font-medium">UTM Parameters</span>
              <div className="grid grid-cols-2 gap-3">
                <CopyableField label="Campaign" value={utm.campaign} />
                <CopyableField label="Medium" value={utm.medium} />
                <CopyableField label="Source" value={utm.source} />
                <CopyableField label="Content" value={utm.content} />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-12 text-text-muted font-medium">UTM Parameters</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearUTM}
                    className="text-11 h-auto py-1"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-11 text-text-muted">Campaign</label>
                    <input
                      type="text"
                      value={utm.campaign}
                      onChange={(e) => updateUTM({ campaign: e.target.value })}
                      placeholder="utm_campaign"
                      className="form-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-11 text-text-muted">Medium</label>
                    <input
                      type="text"
                      value={utm.medium}
                      onChange={(e) => updateUTM({ medium: e.target.value })}
                      placeholder="utm_medium"
                      className="form-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-11 text-text-muted">Source</label>
                    <input
                      type="text"
                      value={utm.source}
                      onChange={(e) => updateUTM({ source: e.target.value })}
                      placeholder="utm_source"
                      className="form-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-11 text-text-muted">Content <span className="text-text-muted/70">(optional)</span></label>
                    <input
                      type="text"
                      value={utm.content}
                      onChange={(e) => updateUTM({ content: e.target.value })}
                      placeholder="utm_content"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="bg-surface-50 border border-border rounded-card px-4 py-3 text-12 text-text-muted">
              <div className="flex items-center gap-2 text-text-primary font-semibold mb-2">
                <Link2 className="w-3.5 h-3.5" />
                Tracked URL
              </div>
              {trackedUrl ? (
                <a
                  href={trackedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-link break-words"
                >
                  {trackedUrl}
                </a>
              ) : (
                <span className="text-text-muted">Add a destination URL to generate a tracked link.</span>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyTrackedUrl}
                  disabled={!trackedUrl}
                >
                  <Clipboard className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyTrackedUrl}
                  disabled={!trackedUrl}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Apply to Destination
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
      </div>
    );
  }

  // Original accordion mode
  return (
    <div className="card">
      <button
        type="button"
        aria-disabled={isLocked}
        className={cn('w-full flex items-center justify-between p-6 text-left transition-opacity', isLocked ? 'opacity-60 cursor-not-allowed' : '')}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
          <div>
            <h2 className={cn('text-16 font-semibold', isLocked ? 'text-text-muted' : 'text-text-primary')}>Step 2: Ad Copy</h2>
            <p className="text-12 text-text-muted">
              {isLocked ? 'Generate ad copy to unlock editing.' : 'Edit and customize your ad content.'}
            </p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-sp-4">
          {aiState.error && (
            <div className="bg-danger/10 border border-danger/40 text-danger text-12 font-medium rounded-md px-3 py-2">
              {aiState.error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-12 text-text-muted font-medium">Ad Name</label>
            <input
              type="text"
              value={adCopy.adName}
              onChange={(e) => updateAdCopyField('adName', e.target.value)}
              placeholder="Descriptive name for internal reference"
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-12 text-text-muted font-medium">Primary Text</label>
              {removeLimit ? (
                <span className="text-11 text-text-muted">{adCopy.primaryText.length} chars</span>
              ) : (
                renderCounter(adCopy.primaryText.length, PRIMARY_TEXT_LIMIT)
              )}
            </div>
            <textarea
              value={adCopy.primaryText}
              onChange={(e) => handlePrimaryTextChange(e.target.value)}
              placeholder="Main ad copy that appears in the post"
              className="form-textarea h-20"
              maxLength={removeLimit ? undefined : PRIMARY_TEXT_LIMIT}
            />
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
                />
                Allow full-length copy
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-12 text-text-muted font-medium">Headline</label>
              {renderCounter(adCopy.headline.length, HEADLINE_LIMIT)}
            </div>
            <input
              type="text"
              value={adCopy.headline}
              onChange={(e) => updateAdCopyField('headline', e.target.value.slice(0, HEADLINE_LIMIT))}
              placeholder="Bold headline text"
              className="form-input"
              maxLength={HEADLINE_LIMIT}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-12 text-text-muted font-medium">Description</label>
              {renderCounter(adCopy.description.length, DESCRIPTION_LIMIT)}
            </div>
            <input
              type="text"
              value={adCopy.description}
              onChange={(e) => updateAdCopyField('description', e.target.value.slice(0, DESCRIPTION_LIMIT))}
              placeholder="Brief description"
              className="form-input"
              maxLength={DESCRIPTION_LIMIT}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-12 text-text-muted font-medium">Destination URL</label>
              <input
                type="url"
                value={adCopy.destinationUrl}
                onChange={(e) => updateAdCopyField('destinationUrl', e.target.value)}
                placeholder="https://example.com"
                className="form-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-12 text-text-muted font-medium">Display Link</label>
              <input
                type="text"
                value={adCopy.displayLink}
                onChange={(e) => updateAdCopyField('displayLink', e.target.value)}
                placeholder="example.com"
                className="form-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-12 text-text-muted font-medium">Call to Action</label>
            <select
              value={adCopy.callToAction}
              onChange={(e) => updateAdCopyField('callToAction', e.target.value)}
              className="form-select"
            >
              {CTA_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-12 text-text-muted font-medium">UTM Parameters</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearUTM}
                className="text-11 h-auto py-1"
              >
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-11 text-text-muted">Campaign</label>
                <input
                  type="text"
                  value={utm.campaign}
                  onChange={(e) => updateUTM({ campaign: e.target.value })}
                  placeholder="utm_campaign"
                  className="form-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-11 text-text-muted">Medium</label>
                <input
                  type="text"
                  value={utm.medium}
                  onChange={(e) => updateUTM({ medium: e.target.value })}
                  placeholder="utm_medium"
                  className="form-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-11 text-text-muted">Source</label>
                <input
                  type="text"
                  value={utm.source}
                  onChange={(e) => updateUTM({ source: e.target.value })}
                  placeholder="utm_source"
                  className="form-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-11 text-text-muted">Content <span className="text-text-muted/70">(optional)</span></label>
                <input
                  type="text"
                  value={utm.content}
                  onChange={(e) => updateUTM({ content: e.target.value })}
                  placeholder="utm_content"
                  className="form-input"
                />
              </div>
            </div>
            <div className="bg-surface-50 border border-border rounded-card px-4 py-3 text-12 text-text-muted">
              <div className="flex items-center gap-2 text-text-primary font-semibold mb-2">
                <Link2 className="w-3.5 h-3.5" />
                Tracked URL
              </div>
              {trackedUrl ? (
                <a
                  href={trackedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-link break-words"
                >
                  {trackedUrl}
                </a>
              ) : (
                <span className="text-text-muted">Add a destination URL to generate a tracked link.</span>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyTrackedUrl}
                  disabled={!trackedUrl}
                >
                  <Clipboard className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyTrackedUrl}
                  disabled={!trackedUrl}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Apply to Destination
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
