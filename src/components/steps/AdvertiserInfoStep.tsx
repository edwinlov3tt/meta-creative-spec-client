import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Lock, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import { CopyableField } from '@/components/UI/CopyableField';
import { MultiSetModal } from '@/components/campaign/MultiSetModal';
import { useCreativeStore } from '@/stores/creativeStore';
import { showToast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';
import { parseCreativeSets } from '@/utils/zipParser';
import type { DetectedCreativeSet } from '@/utils/zipParser';

interface AdvertiserInfoStepProps {
  fullPage?: boolean;
  isPreview?: boolean;
  goToNextStep?: () => void;
}

export const AdvertiserInfoStep: React.FC<AdvertiserInfoStepProps> = ({ fullPage = false, isPreview = false, goToNextStep }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdditional, setShowAdditional] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showMultiSetModal, setShowMultiSetModal] = useState(false);
  const [detectedMultiSets, setDetectedMultiSets] = useState<DetectedCreativeSet[]>([]);
  const [touchedFields, setTouchedFields] = useState({
    websiteUrl: false,
    companyOverview: false,
    campaignObjective: false
  });

  const facebookLink = useCreativeStore(state => state.brief.facebookLink);
  const websiteUrl = useCreativeStore(state => state.brief.websiteUrl);
  const companyOverview = useCreativeStore(state => state.brief.companyOverview);
  const campaignObjective = useCreativeStore(state => state.brief.campaignObjective);
  const creativeType = useCreativeStore(state => state.brief.creativeType);
  const isFlighted = useCreativeStore(state => state.brief.isFlighted);
  const flightStartDate = useCreativeStore(state => state.brief.flightStartDate);
  const flightEndDate = useCreativeStore(state => state.brief.flightEndDate);
  const updateBriefField = useCreativeStore(state => state.updateBriefField);
  const facebook = useCreativeStore(state => state.facebook);
  const aiState = useCreativeStore(state => state.ai);
  const verifyFacebookPage = useCreativeStore(state => state.verifyFacebookPage);
  const generateAdCopy = useCreativeStore(state => state.generateAdCopy);
  const includeEmoji = useCreativeStore(state => state.brief.includeEmoji);
  const disableAI = useCreativeStore(state => state.brief.disableAI);
  const additionalInstructions = useCreativeStore(state => state.brief.additionalInstructions);
  const creativeFile = useCreativeStore(state => state.brief.creativeFile);
  const creativeFiles = useCreativeStore(state => state.brief.creativeFiles || {});
  const processCreativeUpload = useCreativeStore(state => state.processCreativeUpload);
  const processMultiSetUpload = useCreativeStore(state => state.processMultiSetUpload);
  const setDetectedSets = useCreativeStore(state => state.setDetectedSets);
  const updateBrief = useCreativeStore(state => state.updateBrief);

  const hasAttemptedVerification = facebook.hasAttempted ?? Boolean(facebook.pageData);
  const advertiserFieldsDisabled = facebook.verificationStatus === 'pending' || !hasAttemptedVerification;
  const isGenerateDisabled = !hasAttemptedVerification || !websiteUrl || !companyOverview || !campaignObjective || aiState.isGenerating || aiState.hasGenerated;
  const pageData = facebook.pageData;
  const pageCategory = useMemo(() => (pageData?.categories ? pageData.categories.join(', ') : ''), [pageData?.categories]);
  const instagramHandle = useMemo(() => {
    if (!pageData) return '';
    if (pageData.instagram_url) return pageData.instagram_url;
    const username = pageData.instagram_details?.result?.username;
    return username ? `https://www.instagram.com/${username}` : '';
  }, [pageData]);

  const handleVerifyFacebook = async () => {
    await verifyFacebookPage(facebookLink, websiteUrl);
  };

  const handleGenerateAdCopy = async () => {
    if (!campaignObjective) {
      showToast('Campaign Objective is required', 'error');
      return;
    }

    if (disableAI) {
      // Skip AI generation, just mark as complete to unlock Step 2
      useCreativeStore.setState({
        ai: {
          ...aiState,
          hasGenerated: true
        }
      });
      showToast('Ready to enter ad copy manually', 'success');
      // Navigate to step 2
      if (goToNextStep) {
        goToNextStep();
      }
      return;
    }

    await generateAdCopy();
    // Navigate to step 2 after generating
    if (goToNextStep) {
      goToNextStep();
    }
  };

  const handleFacebookButtonClick = async () => {
    // Don't allow reset - field is locked after verification
    if (facebook.verificationStatus === 'success') {
      return;
    }
    await handleVerifyFacebook();
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (file.name.endsWith('.zip')) {
        // Handle zip file with multi-set detection
        try {
          const detectedSets = await parseCreativeSets(file);

          if (detectedSets.length === 0) {
            showToast('No valid creative sets found in zip file', 'warning');
            continue;
          }

          // Auto-fill current form with first set
          const firstSet = detectedSets[0];
          if (firstSet.square) {
            await processCreativeUpload(firstSet.square);
          }
          if (firstSet.vertical) {
            await processCreativeUpload(firstSet.vertical);
          }

          // If multiple sets detected, store them for modal
          if (detectedSets.length > 1) {
            const remainingSets = detectedSets.slice(1);
            setDetectedSets(remainingSets);
            setDetectedMultiSets(remainingSets);
            setShowMultiSetModal(true);
            showToast(`${detectedSets.length} creative sets detected. First set loaded.`, 'success');
          } else {
            showToast('Creative set loaded successfully', 'success');
          }
        } catch (error) {
          console.error('Failed to parse zip file:', error);
          showToast('Failed to parse zip file', 'error');
        }
      } else {
        await processCreativeUpload(file);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      await handleFiles(files);
    }
  };

  // Full-page mode: always expanded, no header click
  if (fullPage) {
    return (
      <div className="w-full">
        <div className="space-y-sp-4">
          {isPreview ? (
            <CopyableField label="Advertiser Facebook Link" value={facebookLink} />
          ) : (
            <div className="space-y-2">
              <label className="text-12 text-text-muted font-medium">Advertiser Facebook Link</label>
              <div className="relative">
                <input
                  type="url"
                  value={facebookLink}
                  onChange={(e) => updateBriefField('facebookLink', e.target.value)}
                  placeholder="https://facebook.com/brand"
                  className="form-input pr-28"
                  disabled={facebook.verificationStatus === 'success'}
                />
                <Button
                  variant={facebook.verificationStatus === 'success' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => { void handleFacebookButtonClick(); }}
                  disabled={facebook.verificationStatus === 'pending' || facebook.verificationStatus === 'success' || !facebookLink}
                  className="absolute top-1/2 right-1 h-[34px] -translate-y-1/2 px-4"
                >
                  {facebook.verificationStatus === 'pending' ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Verifying…
                    </>
                  ) : facebook.verificationStatus === 'success' ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
              {facebook.error && (
                <p className="text-11 text-danger">{facebook.error}</p>
              )}
              {!hasAttemptedVerification && !facebook.error && (
                <p className="text-11 text-text-muted">Verify your Facebook link to unlock the advertiser fields.</p>
              )}
            </div>
          )}

          <div className={cn('space-y-sp-4', !isPreview && advertiserFieldsDisabled ? 'opacity-60 transition-opacity' : 'transition-opacity')}>
            {isPreview ? (
              <>
                <CopyableField label="Website / CTA URL" value={websiteUrl} />
                <CopyableField label="Company Overview" value={companyOverview} multiline />
                <CopyableField label="Creative Type" value={(creativeType || 'traffic').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                <CopyableField label="Campaign Objective" value={campaignObjective} multiline />

                {/* Creative Flight */}
                <CopyableField label="Is Creative Flighted?" value={isFlighted ? 'Yes' : 'No'} />
                {isFlighted && (
                  <div className="grid grid-cols-2 gap-3">
                    <CopyableField label="Flight Start Date" value={flightStartDate || 'Not set'} />
                    <CopyableField label="Flight End Date" value={flightEndDate || 'Not set'} />
                  </div>
                )}

                {/* Facebook Page Data Fields in Preview Mode */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <CopyableField label="Facebook Page ID" value={pageData?.page_id || ''} />
                  <CopyableField label="Page Category" value={pageCategory} />
                  <div className="col-span-2">
                    <CopyableField label="Page Name" value={pageData?.name || ''} />
                  </div>
                  <div className="col-span-2">
                    <CopyableField label="Instagram Handle" value={instagramHandle} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">
                    Website / CTA URL <span className="text-danger">*</span>
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => updateBriefField('websiteUrl', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, websiteUrl: true }))}
                    placeholder="https://example.com"
                    className={cn(
                      'form-input',
                      touchedFields.websiteUrl && !websiteUrl && 'border-danger focus:border-danger focus:ring-danger'
                    )}
                    required
                    disabled={advertiserFieldsDisabled}
                  />
                  {touchedFields.websiteUrl && !websiteUrl && (
                    <p className="text-11 text-danger">Website URL is required for ad copy generation</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between text-12 text-text-muted font-medium">
                    <span>Company Overview <span className="text-danger">*</span></span>
                    <span className="text-11 text-text-muted">{companyOverview.length}/500</span>
                  </label>
                  <textarea
                    value={companyOverview}
                    onChange={(e) => updateBriefField('companyOverview', e.target.value.slice(0, 500))}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, companyOverview: true }))}
                    placeholder="Describe your company, products, and target audience..."
                    className={cn(
                      'form-textarea h-24',
                      touchedFields.companyOverview && !companyOverview && 'border-danger focus:border-danger focus:ring-danger'
                    )}
                    maxLength={500}
                    required
                    disabled={advertiserFieldsDisabled}
                  />
                  {touchedFields.companyOverview && !companyOverview && (
                    <p className="text-11 text-danger">Company overview is required for ad copy generation</p>
                  )}
                </div>

                {/* Creative Type Dropdown */}
                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">Creative Type</label>
                  <select
                    value={creativeType}
                    onChange={(e) => updateBriefField('creativeType', e.target.value as any)}
                    className="form-select"
                    disabled={advertiserFieldsDisabled}
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
                  <label className="flex items-center justify-between text-12 text-text-muted font-medium">
                    <span>Campaign Objective <span className="text-danger">*</span></span>
                    <span className="text-11 text-text-muted">{campaignObjective.length}/300</span>
                  </label>
                  <textarea
                    value={campaignObjective}
                    onChange={(e) => updateBriefField('campaignObjective', e.target.value.slice(0, 300))}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, campaignObjective: true }))}
                    placeholder="What are your marketing goals for this campaign?"
                    className={cn(
                      'form-textarea h-20',
                      touchedFields.campaignObjective && !campaignObjective && 'border-danger focus:border-danger focus:ring-danger'
                    )}
                    maxLength={300}
                    required
                    disabled={advertiserFieldsDisabled}
                  />
                  {touchedFields.campaignObjective && !campaignObjective && (
                    <p className="text-11 text-danger">Campaign objective is required for ad copy generation</p>
                  )}
                </div>
              </>
            )}

            {!isPreview && (
              <>
                <div className="space-y-3">
                  <label className="text-12 text-text-muted font-medium">Creative Uploads</label>

                  {/* Drag and Drop Upload Area */}
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer',
                      isDragging
                        ? 'border-meta-blue bg-blue-50'
                        : 'border-border hover:border-meta-blue hover:bg-surface-50',
                      advertiserFieldsDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <input
                      id="creative-file-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,.zip"
                      multiple
                      onChange={async (event) => {
                        if (event.target.files && event.target.files.length > 0) {
                          await handleFiles(event.target.files);
                          event.target.value = '';
                        }
                      }}
                      disabled={advertiserFieldsDisabled}
                      className="hidden"
                    />
                    <label
                      htmlFor="creative-file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className={cn(
                        'w-10 h-10 mb-3',
                        isDragging ? 'text-meta-blue' : 'text-text-muted'
                      )} />
                      <p className="text-14 font-medium text-text-primary mb-1">
                        {isDragging ? 'Drop files here' : 'Drag and drop files here'}
                      </p>
                      <p className="text-12 text-text-muted mb-2">or click to browse</p>
                      <p className="text-10 text-text-muted">
                        Supports images, zip files, and folders • Auto-detects 1:1 and 9:16
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Files Display */}
                  {(creativeFiles.square || creativeFiles.vertical) && (
                    <div className="space-y-3">
                      <div className="text-12 font-medium text-text-secondary">Uploaded Creatives</div>
                      <div className="space-y-3">
                        {/* Square Creative */}
                        {creativeFiles.square && (
                          <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-border">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
                                <span className="text-11 font-bold text-green-700">1:1</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-13 font-medium text-text-primary truncate">
                                  {creativeFiles.square.name}
                                </div>
                                <div className="text-11 text-text-muted mt-0.5">
                                  {creativeFiles.square.width} × {creativeFiles.square.height} • Feed ads
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="text-12 text-danger hover:text-red-700 font-medium ml-3 transition-colors"
                              onClick={() => {
                                updateBrief({
                                  creativeFiles: {
                                    ...creativeFiles,
                                    square: undefined
                                  }
                                });
                                showToast('Square creative removed', 'info');
                              }}
                              disabled={advertiserFieldsDisabled}
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {/* Vertical Creative */}
                        {creativeFiles.vertical && (
                          <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-border">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center">
                                <span className="text-11 font-bold text-purple-700">9:16</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-13 font-medium text-text-primary truncate">
                                  {creativeFiles.vertical.name}
                                </div>
                                <div className="text-11 text-text-muted mt-0.5">
                                  {creativeFiles.vertical.width} × {creativeFiles.vertical.height} • Stories/Reels
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="text-12 text-danger hover:text-red-700 font-medium ml-3 transition-colors"
                              onClick={() => {
                                updateBrief({
                                  creativeFiles: {
                                    ...creativeFiles,
                                    vertical: undefined
                                  }
                                });
                                showToast('Vertical creative removed', 'info');
                              }}
                              disabled={advertiserFieldsDisabled}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Is Creative Flighted */}
                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">
                    Is this creative flighted? <span className="text-danger">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-14 cursor-pointer">
                      <input
                        type="radio"
                        name="isFlighted"
                        checked={isFlighted === true}
                        onChange={() => updateBriefField('isFlighted', true)}
                        className="w-4 h-4"
                        disabled={advertiserFieldsDisabled}
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
                        disabled={advertiserFieldsDisabled}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Flight Date Range */}
                {isFlighted && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-12 text-text-muted font-medium">Flight Start Date</label>
                      <input
                        type="date"
                        value={flightStartDate}
                        onChange={(e) => updateBriefField('flightStartDate', e.target.value)}
                        className="form-input"
                        disabled={advertiserFieldsDisabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-12 text-text-muted font-medium">Flight End Date</label>
                      <input
                        type="date"
                        value={flightEndDate}
                        onChange={(e) => updateBriefField('flightEndDate', e.target.value)}
                        className="form-input"
                        disabled={advertiserFieldsDisabled}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {!isPreview && (
              <>
                <div className="border border-border rounded-card">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-12 font-semibold text-text-primary"
                    onClick={() => setShowAdditional(prev => !prev)}
                  >
                    <span>Additional Settings</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdditional ? 'rotate-180' : ''}`} />
                  </button>
                  {showAdditional && (
                    <div className="px-4 pb-4 space-y-sp-3">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-12 text-text-muted font-medium">
                          <input
                            type="checkbox"
                            className="meta-checkbox"
                            checked={disableAI}
                            onChange={(e) => updateBriefField('disableAI', e.target.checked)}
                            disabled={advertiserFieldsDisabled}
                          />
                          Disable AI generation (manual copy entry)
                        </label>
                      </div>

                      {!disableAI && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-12 text-text-muted font-medium">
                            <input
                              type="checkbox"
                              className="meta-checkbox"
                              checked={includeEmoji}
                              onChange={(e) => updateBriefField('includeEmoji', e.target.checked)}
                              disabled={advertiserFieldsDisabled}
                            />
                            Include emoji in generated copy
                          </label>
                        </div>
                      )}

                      {!disableAI && (
                        <div className="space-y-2">
                          <label className="text-12 text-text-muted font-medium">Additional Instructions</label>
                          <textarea
                            value={additionalInstructions}
                            onChange={(e) => updateBriefField('additionalInstructions', e.target.value)}
                            placeholder="Provide context, offers, or tone guidance"
                            className="form-textarea h-16"
                            disabled={advertiserFieldsDisabled}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-12 text-text-muted font-medium">Facebook Page ID</label>
                          <input
                            type="text"
                            value={pageData?.page_id || ''}
                            readOnly
                            className="form-input bg-surface-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-12 text-text-muted font-medium">Page Category</label>
                          <input
                            type="text"
                            value={pageCategory}
                            readOnly
                            className="form-input bg-surface-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-12 text-text-muted font-medium">Page Name</label>
                          <input
                            type="text"
                            value={pageData?.name || ''}
                            readOnly
                            className="form-input bg-surface-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-12 text-text-muted font-medium">Cover Photo</label>
                          <input
                            type="url"
                            value={pageData?.cover_image || ''}
                            readOnly
                            className="form-input bg-surface-50"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <label className="text-12 text-text-muted font-medium">Instagram Handle</label>
                          <input
                            type="text"
                            value={instagramHandle}
                            readOnly
                            className="form-input bg-surface-50"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => { void handleGenerateAdCopy(); }}
                    disabled={isGenerateDisabled}
                    className="w-full"
                  >
                    {aiState.isGenerating ? (
                      <>
                        <Spinner size="md" className="mr-2" />
                        Generating…
                      </>
                    ) : disableAI ? (
                      <>
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Save & Go to Next Step
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Ad Copy
                      </>
                    )}
                  </Button>
                  {isGenerateDisabled && !aiState.isGenerating && (
                    <p className="text-11 text-center text-text-muted">
                      {aiState.hasGenerated
                        ? 'Ad copy already generated. Proceed to Step 2 →'
                        : !hasAttemptedVerification
                        ? 'Verify Facebook link to unlock'
                        : disableAI
                        ? 'Complete all required fields (*) to continue'
                        : 'Complete all required fields (*) to generate'}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Multi-Set Modal */}
        <MultiSetModal
          isOpen={showMultiSetModal}
          onClose={() => setShowMultiSetModal(false)}
          sets={detectedMultiSets}
        />
      </div>
    );
  }

  // No accordion mode - always render full page mode
  return null;
};
