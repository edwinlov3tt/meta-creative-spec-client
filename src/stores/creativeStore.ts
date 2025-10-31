import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { api, ApiError, API_BASE_URL as CREATIVE_API_BASE } from '@/services/api';
import { fileToBase64 } from '@/utils/file';
import { slugify } from '@/utils/slugify';
import { showToast } from '@/stores/toastStore';
import type {
  CreativeStore,
  CreativeBrief,
  AdCopyFields,
  PreviewSettings,
  UTMParameters,
  FacebookState,
  AIState,
  FacebookPageData,
  SpecExport,
  AutosaveState,
  ShareState
} from '@/types/creative';

const ensureHttps = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

const deriveFacebookFallback = (facebookUrl: string): FacebookPageData | null => {
  if (!facebookUrl) return null;

  const normalized = ensureHttps(facebookUrl.trim());

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch (error) {
    console.warn('Unable to parse Facebook URL for fallback', error);
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.includes('facebook.com') && !host.endsWith('fb.com')) {
    return null;
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean);
  const slugCandidate = pathParts[0];
  if (!slugCandidate) return null;

  // Check if this is a profile.php URL with an id parameter
  let slug: string;
  if (slugCandidate === 'profile.php') {
    const pageId = parsed.searchParams.get('id');
    if (!pageId) return null;
    slug = pageId;
  } else {
    slug = slugCandidate.split('?')[0].split('#')[0];
    if (!slug) return null;
  }

  const readableName = slug
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => (word.length <= 2 ? word.toUpperCase() : `${word[0].toUpperCase()}${word.slice(1)}`))
    .join(' ');

  return {
    page_id: slug,
    name: readableName || slug,
    profile_picture: `https://graph.facebook.com/${encodeURIComponent(slug)}/picture?type=large`,
    url: normalized,
    method: 'client_url_fallback'
  } as FacebookPageData;
};

const humanizeMethod = (method?: string) => {
  if (!method) return undefined;
  return method
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(segment => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
};

const labelFacebookMethod = (method?: string) => {
  if (!method) return undefined;
  const normalized = method.toLowerCase();
  if (normalized === 'worker_api' || normalized === 'worker') {
    return 'Meta Worker';
  }
  if (normalized === 'url_fallback') {
    return 'URL Fallback';
  }
  if (normalized === 'domain_fallback') {
    return 'Domain Fallback';
  }
  return humanizeMethod(method);
};

const base64ToUint8Array = (base64: string) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const dataUrlToUint8Array = (dataUrl: string) => {
  const parts = dataUrl.split(',');
  const base64 = parts.length > 1 ? parts[1] : parts[0];
  return base64ToUint8Array(base64);
};

const generateSpecSheet = (spec: SpecExport, trackedUrl: string) => {
  const lines = [
    'Meta Creative Spec Sheet',
    '==========================',
    '',
    `Ad Name: ${spec.refName || 'Untitled Creative'}`,
    '',
    'Primary Text:',
    spec.postText || '—',
    '',
    `Headline: ${spec.headline || '—'}`,
    `Description: ${spec.description || '—'}`,
    `CTA: ${spec.cta || '—'}`,
    '',
    `Platform: ${spec.platform}`,
    `Device: ${spec.device}`,
    `Ad Type: ${spec.adType}`,
    `Ad Format: ${spec.adFormat}`,
    '',
    `Destination URL: ${spec.destinationUrl || '—'}`,
    `Tracked URL: ${trackedUrl || '—'}`,
    '',
    'Meta Details:',
    `Company Overview: ${spec.meta.company || '—'}`,
    `Company Info: ${spec.meta.companyInfo || '—'}`,
    `Campaign Objective: ${spec.meta.objective || '—'}`,
    `Notes: ${spec.meta.notes || '—'}`,
    `Facebook Link: ${spec.meta.facebookLink || '—'}`,
    `Website: ${spec.meta.url || '—'}`,
  ];

  return lines.join('\n');
};

const defaultUTM = (): UTMParameters => ({
  campaign: 'Ignite',
  medium: 'Facebook',
  source: 'Townsquare',
  content: ''
});

const defaultBrief = (): CreativeBrief => ({
  facebookLink: '',
  websiteUrl: '',
  companyOverview: '',
  campaignObjective: '',
  companyInfo: '',
  additionalInstructions: '',
  customPrompt: '',
  salesFormula: '',
  includeEmoji: true,
  removeCharacterLimit: false,
  disableAI: false,
  utm: defaultUTM(),
  creativeFile: null,
  creativeFiles: {},
  detectedSets: [],
  creativeType: 'traffic',
  isFlighted: false,
  flightStartDate: '',
  flightEndDate: ''
});

const defaultAdCopy = (): AdCopyFields => ({
  adName: '',
  primaryText: '',
  headline: '',
  description: '',
  destinationUrl: '',
  displayLink: '',
  callToAction: 'Learn More'
});

const defaultPreview = (): PreviewSettings => ({
  platform: 'facebook',
  device: 'desktop',
  adType: 'feed',
  adFormat: 'original',
  forceExpandText: false
});

const defaultFacebookState = (): FacebookState => ({
  pageData: null,
  verificationStatus: 'idle',
  hasAttempted: false,
  error: null
});

const defaultAIState = (): AIState => ({
  isGenerating: false,
  hasGenerated: false,
  error: null,
  lastGeneratedAt: null
});

const defaultAutosaveState = (): AutosaveState => ({
  lastSavedAt: null,
  isSaving: false,
  error: null
});

const defaultShareState = (): ShareState => ({
  shareUrl: null,
  shortId: null,
  isSaving: false,
  error: null
});

const AUTOSAVE_STORAGE_KEY = 'meta-creative-autosave-snapshot';

export const useCreativeStore = create<CreativeStore>()(
  devtools(
    persist(
      (set, get) => ({
        brief: defaultBrief(),
        adCopy: defaultAdCopy(),
        preview: defaultPreview(),
        facebook: defaultFacebookState(),
        ai: defaultAIState(),
        autosave: defaultAutosaveState(),
        share: defaultShareState(),
        isDirty: false,
        isPreviewMode: false,
        previewNode: null,
        advertiserIdentifier: null,
        campaignContext: null,

        updateBrief: (updates) =>
          set(state => ({
            brief: { ...state.brief, ...updates },
            isDirty: true
          })),

        updateBriefField: (key, value) =>
          set(state => ({
            brief: { ...state.brief, [key]: value },
            isDirty: true
          })),

        updateUTM: (updates) =>
          set(state => ({
            brief: {
              ...state.brief,
              utm: { ...state.brief.utm, ...updates }
            },
            isDirty: true
          })),

        setCreativeFile: (file) =>
          set(state => ({
            brief: { ...state.brief, creativeFile: file },
            isDirty: true
          })),

        setDetectedSets: (sets) =>
          set(state => ({
            brief: { ...state.brief, detectedSets: sets },
            isDirty: true
          })),

        updateAdCopy: (updates) =>
          set(state => ({
            adCopy: { ...state.adCopy, ...updates },
            isDirty: true
          })),

        updateAdCopyField: (key, value) =>
          set(state => ({
            adCopy: { ...state.adCopy, [key]: value },
            isDirty: true
          })),

        setPreview: (updates) =>
          set(state => ({
            preview: { ...state.preview, ...updates },
            isDirty: true
          })),

        setFacebookState: (facebookUpdates) =>
          set(state => ({
            facebook: { ...state.facebook, ...facebookUpdates },
            isDirty: facebookUpdates.pageData !== undefined ? true : state.isDirty
          })),

        setFacebookPageData: (data) =>
          set(state => ({
            facebook: {
              ...state.facebook,
              pageData: data,
              verificationStatus: data ? 'success' : 'idle',
              hasAttempted: Boolean(data),
              error: null
            },
            brief: {
              ...state.brief,
              companyOverview:
                state.brief.companyOverview || (data?.intro ?? state.brief.companyOverview),
              websiteUrl:
                state.brief.websiteUrl || (data?.website ? ensureHttps(data.website) : state.brief.websiteUrl)
            },
            isDirty: true
          })),

        setAIState: (aiUpdates) =>
          set(state => ({
            ai: { ...state.ai, ...aiUpdates }
          })),

        setAutosaveState: (updates) =>
          set(state => ({
            autosave: { ...state.autosave, ...updates }
          })),

        setPreviewNode: (node) =>
          set({ previewNode: node ?? null }),

        markDirty: () => set({ isDirty: true }),

        markSaved: (timestamp = Date.now()) =>
          set({
            isDirty: false,
            autosave: { lastSavedAt: timestamp, isSaving: false, error: null }
          }),

        resetStore: () => {
          // Clear autosave snapshot from localStorage
          try {
            localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
          } catch (error) {
            console.error('Failed to clear autosave snapshot', error);
          }

          set({
            brief: defaultBrief(),
            adCopy: defaultAdCopy(),
            preview: defaultPreview(),
            facebook: defaultFacebookState(),
            ai: defaultAIState(),
            autosave: defaultAutosaveState(),
            isDirty: false,
            isPreviewMode: false,
            advertiserIdentifier: null,
            campaignContext: null
          });
        },

        exportSpec: (): SpecExport => {
          const state = get();
          const { adCopy, brief, preview, facebook } = state;

          const spec: SpecExport = {
            refName: adCopy.adName,
            adName: adCopy.adName,
            postText: adCopy.primaryText,
            headline: adCopy.headline,
            description: adCopy.description,
            destinationUrl: adCopy.destinationUrl || brief.websiteUrl,
            displayLink: adCopy.displayLink,
            cta: adCopy.callToAction,
            imageName: brief.creativeFile?.name || 'creative-image',
            facebookPageUrl: brief.facebookLink,
            platform: preview.platform,
            device: preview.device,
            adType: preview.adType,
            adFormat: preview.adFormat,
            flightStartDate: brief.flightStartDate,
            flightEndDate: brief.flightEndDate,
            meta: {
              company: brief.companyOverview,
              companyInfo: brief.companyInfo,
              objective: brief.campaignObjective,
              customPrompt: brief.customPrompt,
              formula: brief.salesFormula,
              facebookLink: brief.facebookLink,
              url: brief.websiteUrl,
              notes: brief.additionalInstructions,
              facebookPageData: facebook.pageData
            }
          };
          return spec;
        },

        getTrackedUrl: () => {
          const state = get();
          const baseInput = state.adCopy.destinationUrl || state.brief.websiteUrl;
          if (!baseInput) return '';

          let url: URL;
          try {
            url = new URL(baseInput);
          } catch {
            try {
              url = new URL(`https://${baseInput}`);
            } catch {
              return '';
            }
          }

          const defaults = defaultUTM();
          const campaign = (state.brief.utm.campaign || defaults.campaign).trim();
          const medium = (state.brief.utm.medium || defaults.medium).trim();
          const source = (state.brief.utm.source || defaults.source).trim();
          const contentRaw = state.brief.utm.content || state.adCopy.adName || '';
          const content = slugify(contentRaw);

          const params = url.searchParams;
          params.set('utm_campaign', campaign || defaults.campaign);
          params.set('utm_medium', medium || defaults.medium);
          params.set('utm_source', source || defaults.source);
          if (content) {
            params.set('utm_content', content);
          } else {
            params.delete('utm_content');
          }

          url.search = params.toString();
          return url.toString();
        },

        applyTrackedUrl: () => {
          const tracked = get().getTrackedUrl();
          if (!tracked) return;
          set(state => ({
            adCopy: {
              ...state.adCopy,
              destinationUrl: tracked
            },
            isDirty: true
          }));
        },

        processCreativeUpload: async (file) => {
          if (!file) {
            set(state => ({
              brief: { ...state.brief, creativeFile: null },
              isDirty: true
            }));
            showToast('Creative removed', 'info');
            return;
          }

          const base64 = await fileToBase64(file);

          // Note: MIME type is already normalized in fileToBase64 utility

          // Detect image dimensions
          const detectDimensions = (file: File): Promise<{width: number; height: number}> => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                resolve({ width: img.width, height: img.height });
                URL.revokeObjectURL(img.src);
              };
              img.onerror = reject;
              img.src = URL.createObjectURL(file);
            });
          };

          try {
            const { width, height } = await detectDimensions(file);
            const aspectRatio: '1:1' | '9:16' | 'other' = width === height ? '1:1' :
                               width === 1080 && height === 1920 ? '9:16' : 'other';

            // Upload to R2
            let imageUrl: string | undefined;
            try {
              const uploadResponse = await fetch(`${CREATIVE_API_BASE}/api/upload-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  image: base64.data,
                  filename: file.name,
                  contentType: base64.type
                })
              });

              const uploadResult = await uploadResponse.json();

              if (uploadResult.success) {
                imageUrl = uploadResult.url;
                console.log(`[R2] Image uploaded successfully: ${imageUrl}`);
              } else {
                console.error('[R2] Upload failed:', uploadResult.error);
                showToast('Using base64 fallback (R2 upload failed)', 'warning');
              }
            } catch (uploadError) {
              console.error('[R2] Upload error:', uploadError);
              showToast('Using base64 fallback (R2 upload error)', 'warning');
            }

            const creativeFile = {
              name: file.name,
              size: file.size,
              type: base64.type, // Already normalized in fileToBase64
              url: imageUrl, // R2 URL (undefined if upload failed)
              data: base64.data, // Keep base64 as fallback (for localStorage and if R2 bucket isn't public)
              width,
              height,
              aspectRatio
            };

            console.log('[Store] Creative file created:', {
              name: creativeFile.name,
              hasUrl: !!creativeFile.url,
              hasData: !!creativeFile.data,
              url: creativeFile.url,
              aspectRatio: creativeFile.aspectRatio
            });

            // Auto-organize by aspect ratio
            if (aspectRatio === '1:1') {
              set(state => ({
                brief: {
                  ...state.brief,
                  creativeFile,
                  creativeFiles: {
                    ...state.brief.creativeFiles,
                    square: creativeFile
                  }
                },
                isDirty: true
              }));
              showToast(`Square creative (${width}x${height}) uploaded`, 'success');
            } else if (aspectRatio === '9:16') {
              set(state => ({
                brief: {
                  ...state.brief,
                  creativeFile,
                  creativeFiles: {
                    ...state.brief.creativeFiles,
                    vertical: creativeFile
                  }
                },
                isDirty: true
              }));
              showToast(`Vertical creative (${width}x${height}) for stories/reels uploaded`, 'success');
            } else {
              set(state => ({
                brief: {
                  ...state.brief,
                  creativeFile
                },
                isDirty: true
              }));
              showToast(`Creative uploaded (${width}x${height})`, 'info');
            }
          } catch (error) {
            console.error('Failed to detect dimensions:', error);

            // Upload to R2 even without dimensions
            let imageUrl: string | undefined;
            try {
              const uploadResponse = await fetch(`${CREATIVE_API_BASE}/api/upload-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  image: base64.data,
                  filename: file.name,
                  contentType: base64.type
                })
              });

              const uploadResult = await uploadResponse.json();

              if (uploadResult.success) {
                imageUrl = uploadResult.url;
              }
            } catch (uploadError) {
              console.error('[R2] Upload error:', uploadError);
            }

            // MIME type already normalized in fileToBase64
            set(state => ({
              brief: {
                ...state.brief,
                creativeFile: {
                  name: file.name,
                  size: file.size,
                  type: base64.type, // Already normalized in fileToBase64
                  url: imageUrl,
                  data: imageUrl ? undefined : base64.data
                }
              },
              isDirty: true
            }));
            showToast('Creative ready for AI analysis', 'success');
          }
        },

        processMultiSetUpload: async (zipFile) => {
          try {
            // Import the parser dynamically to avoid circular dependencies
            const { parseCreativeSets } = await import('@/utils/zipParser');
            const detectedSets = await parseCreativeSets(zipFile);

            if (detectedSets.length === 0) {
              showToast('No valid creative sets found in zip file', 'warning');
              return;
            }

            // Auto-fill current form with first set
            const firstSet = detectedSets[0];
            const { processCreativeUpload } = get();

            if (firstSet.square) {
              await processCreativeUpload(firstSet.square);
            }
            if (firstSet.vertical) {
              await processCreativeUpload(firstSet.vertical);
            }

            // If multiple sets detected, store remaining sets
            if (detectedSets.length > 1) {
              const remainingSets = detectedSets.slice(1);
              get().setDetectedSets(remainingSets);
              showToast(`${detectedSets.length} creative sets detected. First set loaded.`, 'success');
            } else {
              showToast('Creative set loaded successfully', 'success');
            }
          } catch (error) {
            console.error('Failed to process multi-set upload:', error);
            showToast('Failed to parse zip file', 'error');
          }
        },

        verifyFacebookPage: async (facebookUrl, websiteUrl) => {
          const inputUrl = facebookUrl.trim();
          if (!inputUrl) {
            set(state => ({
              facebook: {
                ...state.facebook,
                error: 'Please provide a Facebook page URL',
                verificationStatus: 'error'
              }
            }));
            return;
          }

          const resolvedFacebookUrl = ensureHttps(inputUrl);

          set(state => ({
            facebook: {
              ...state.facebook,
              verificationStatus: 'pending',
              hasAttempted: true,
              error: null
            }
          }));

          const commitFacebookSuccess = (pageData: FacebookPageData | null, methodLabel?: string) => {
            set(state => ({
              facebook: {
                ...state.facebook,
                pageData,
                verificationStatus: 'success',
                hasAttempted: true,
                error: null
              },
              brief: {
                ...state.brief,
                facebookLink: resolvedFacebookUrl,
                companyOverview:
                  state.brief.companyOverview || pageData?.intro || state.brief.companyOverview,
                websiteUrl:
                  state.brief.websiteUrl ||
                  (pageData?.website ? ensureHttps(pageData.website) : state.brief.websiteUrl)
              },
              isDirty: true
            }));
            const suffix = methodLabel ? ` (${methodLabel})` : '';
            showToast(`Facebook page verified${suffix}`, 'success');
          };

          try {
            const response = await api.verifyFacebookPage({
              facebookUrl: resolvedFacebookUrl,
              websiteUrl: websiteUrl || get().brief.websiteUrl
            });
            const pageData = (response.data ?? null) as FacebookPageData | null;
            const methodLabel = labelFacebookMethod(response.method);
            if (Array.isArray(response.errors) && response.errors.length > 0) {
              console.warn('Facebook verification warnings', {
                facebookUrl: resolvedFacebookUrl,
                warnings: response.errors
              });
            }
            commitFacebookSuccess(pageData, methodLabel);
            return;
          } catch (error) {
            if (error instanceof ApiError && error.status === 0) {
              const fallbackData = deriveFacebookFallback(resolvedFacebookUrl);
              if (fallbackData) {
                set(state => ({
                  facebook: {
                    ...state.facebook,
                    pageData: fallbackData,
                    verificationStatus: 'success',
                    hasAttempted: true,
                    error: null
                  },
                  brief: {
                    ...state.brief,
                    facebookLink: resolvedFacebookUrl
                  },
                  isDirty: true
                }));
                const baseHint = CREATIVE_API_BASE ? ` (${CREATIVE_API_BASE})` : '';
                console.warn('Using client-side Facebook fallback', {
                  facebookUrl: resolvedFacebookUrl
                });
                showToast(`API offline${baseHint}. Using basic info from URL.`, 'warning');
                return;
              }
            }

            console.error('Facebook verification failed', {
              facebookUrl: resolvedFacebookUrl,
              error
            });

            const message = error instanceof ApiError ? error.message : 'Unable to verify Facebook page';
            set(state => ({
              facebook: {
                ...state.facebook,
                verificationStatus: 'error',
                hasAttempted: true,
                error: message
              }
            }));
            showToast(message, 'error');
          }
        },

        generateAdCopy: async () => {
          const state = get();
          const { brief, facebook } = state;
          const previouslyGenerated = state.ai.hasGenerated;

          if (!brief.websiteUrl || !brief.companyOverview || !brief.campaignObjective) {
            set(() => ({
              ai: {
                ...state.ai,
                error: 'Please complete required fields before generating copy'
              }
            }));
            return;
          }

          // Check if image exists but data is missing (due to localStorage persistence)
          if (brief.creativeFile && (!brief.creativeFile.data || brief.creativeFile.data.length < 1000)) {
            console.warn('[Store] Image metadata exists but data is missing or too small. Skipping image analysis.');
            showToast('Image data lost. Re-upload your image for AI analysis, or continue without it.', 'warning');
          }

          set(() => ({
            ai: {
              ...state.ai,
              isGenerating: true,
              error: null
            }
          }));

          try {
            // Only include image data if it's valid (>1000 chars = real base64 data)
            const hasValidImageData = brief.creativeFile?.data && brief.creativeFile.data.length > 1000;

            const payload = {
              website: ensureHttps(brief.websiteUrl),
              companyOverview: brief.companyOverview,
              objective: brief.campaignObjective,
              salesFormula: brief.salesFormula || undefined,
              companyInfo: brief.companyInfo || undefined,
              instructions: brief.additionalInstructions || undefined,
              customPrompt: brief.customPrompt || undefined,
              includeEmoji: brief.includeEmoji,
              facebookPageData: facebook.pageData || undefined,
              creativeData: hasValidImageData
                ? {
                    type: brief.creativeFile!.type,
                    data: brief.creativeFile!.data
                  }
                : null
            };

            const response = await api.generateAdCopy(payload);
            const methodLabel = response.method ? `AI — ${humanizeMethod(response.method)}` : undefined;

            set(state => ({
              adCopy: {
                ...state.adCopy,
                primaryText: response.data.postText,
                headline: response.data.headline,
                description: response.data.linkDescription,
                displayLink: response.data.displayLink,
                callToAction: response.data.cta,
                adName: response.data.adName,
                destinationUrl: ensureHttps(brief.websiteUrl)
              },
              ai: {
                isGenerating: false,
                hasGenerated: true,
                error: null,
                lastGeneratedAt: Date.now()
              },
              isDirty: true
            }));
            const toastSuffix = methodLabel ? ` (${methodLabel})` : '';
            showToast(
              previouslyGenerated ? `Ad copy regenerated${toastSuffix}` : `Ad copy generated${toastSuffix}`,
              'success'
            );
            get().applyTrackedUrl();
          } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Unable to generate ad copy';
            set(state => ({
              ai: {
                ...state.ai,
                isGenerating: false,
                error: message
              }
            }));
            showToast(message, 'error');
          }
        },

        regenerateAdCopy: async () => {
          await get().generateAdCopy();
        },

        copySpecToClipboard: async () => {
          const spec = get().exportSpec();
          await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
          showToast('Creative spec copied to clipboard', 'success');
        },

        downloadSpecJson: () => {
          const spec = get().exportSpec();
          const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${spec.refName || 'creative-spec'}-${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('Creative spec JSON downloaded', 'success');
        },

        downloadSpecSheet: async () => {
          try {
            const spec = get().exportSpec();

            // Dynamic import - only load Excel library when user downloads
            const { ExcelExportService } = await import('@/services/excelExportService');
            const excelService = new ExcelExportService();
            const excelBuffer = await excelService.generateExcel(spec, spec.facebookPageUrl);
            const filename = excelService.generateFilename(spec.refName || 'creative-spec', true);

            const blob = new Blob([excelBuffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Excel spec sheet downloaded', 'success');
          } catch (error) {
            console.error('Failed to download spec sheet', error);
            showToast('Failed to download spec sheet', 'error');
          }
        },

        downloadBundle: async () => {
          const node = get().previewNode;
          if (!node) {
            showToast('Preview not ready to export', 'error');
            return;
          }

          try {
            // Dynamic import - only load JSZip when user downloads bundle
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const spec = get().exportSpec();
            const timestamp = Date.now();

            // 1. Add JSON spec
            zip.file('creative-spec.json', JSON.stringify(spec, null, 2));

            // 2. Generate and add Excel spec sheet
            try {
              // Dynamic import - only load Excel library when user downloads bundle
              const { ExcelExportService } = await import('@/services/excelExportService');
              const excelService = new ExcelExportService();
              const excelBuffer = await excelService.generateExcel(spec, spec.facebookPageUrl);
              const excelFilename = excelService.generateFilename(spec.refName || 'creative-spec', false);
              zip.file(excelFilename, excelBuffer);
            } catch (error) {
              console.error('Failed to generate Excel file', error);
              showToast('Warning: Excel file skipped', 'warning');
            }

            // 3. Add text-based spec sheet for easy reading
            const trackedUrl = spec.destinationUrl || spec.facebookPageUrl || '';
            const textSpec = generateSpecSheet(spec, trackedUrl);
            zip.file('creative-spec.txt', textSpec);

            // 4. Add preview screenshots (PNG and JPG)
            try {
              // Temporarily expand text for export
              set(state => ({
                preview: { ...state.preview, forceExpandText: true }
              }));

              // Wait for React to re-render
              await new Promise(resolve => setTimeout(resolve, 100));

              const { creativeFile, creativeFiles } = get().brief;

              // Dynamic import - only load html-to-image when user exports
              const { toPng, toJpeg } = await import('html-to-image');

              // Use onclone instead of filter to modify the cloned document, not the original DOM
              const onclone = (clonedDoc: Document) => {
                const images = clonedDoc.querySelectorAll('img');
                images.forEach((img: HTMLImageElement) => {
                  // Handle blob URLs by converting to data URLs
                  if (img.src.startsWith('blob:')) {
                    // Check all possible creative sources and replace blob URL with data URL
                    const creatives = [creativeFile, creativeFiles?.square, creativeFiles?.vertical].filter(Boolean);
                    for (const creative of creatives) {
                      if (creative?.data && creative?.type) {
                        // Replace blob URL with data URL in the CLONED document only
                        img.src = `data:${creative.type};base64,${creative.data}`;
                        break;
                      }
                    }
                  }
                  // R2 URLs (https://) should work as-is in the screenshot
                  // No need to modify them
                });
              };

              const pngDataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 2,
                skipFonts: true,
                onclone
              } as any);
              const jpgDataUrl = await toJpeg(node, {
                cacheBust: true,
                quality: 0.95,
                pixelRatio: 2,
                skipFonts: true,
                onclone
              } as any);

              zip.file('previews/preview.png', dataUrlToUint8Array(pngDataUrl));
              zip.file('previews/preview.jpg', dataUrlToUint8Array(jpgDataUrl));

              // Restore normal state
              set(state => ({
                preview: { ...state.preview, forceExpandText: false }
              }));
            } catch (error) {
              console.error('Failed to generate preview screenshots', error);
              showToast('Warning: Preview screenshots skipped', 'warning');
              // Restore normal state even on error
              set(state => ({
                preview: { ...state.preview, forceExpandText: false }
              }));
            }

            // 5. Add creative files (square 1:1, vertical 9:16, and original)
            const { creativeFiles } = get().brief;

            // Add square creative (1:1 for feed ads)
            if (creativeFiles?.square && creativeFiles.square.name) {
              try {
                let bytes: Uint8Array;

                // Fetch from R2 URL if available, otherwise use base64
                if (creativeFiles.square.url) {
                  const response = await fetch(creativeFiles.square.url);
                  const blob = await response.blob();
                  const arrayBuffer = await blob.arrayBuffer();
                  bytes = new Uint8Array(arrayBuffer);
                } else if (creativeFiles.square.data) {
                  bytes = base64ToUint8Array(creativeFiles.square.data);
                } else {
                  throw new Error('No image data available');
                }

                const ext = creativeFiles.square.name.split('.').pop()?.toLowerCase();

                // Add original with descriptive name
                zip.file(`creatives/original/square-1080x1080-${creativeFiles.square.name}`, bytes);

                // Add labeled copy for easy use
                if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
                  zip.file(`creatives/1080x1080-feed.${ext}`, bytes);
                }
              } catch (error) {
                console.error('Failed to add square creative file', error);
                showToast('Warning: Square creative file skipped', 'warning');
              }
            }

            // Add vertical creative (9:16 for stories/reels)
            if (creativeFiles?.vertical && creativeFiles.vertical.name) {
              try {
                let bytes: Uint8Array;

                // Fetch from R2 URL if available, otherwise use base64
                if (creativeFiles.vertical.url) {
                  const response = await fetch(creativeFiles.vertical.url);
                  const blob = await response.blob();
                  const arrayBuffer = await blob.arrayBuffer();
                  bytes = new Uint8Array(arrayBuffer);
                } else if (creativeFiles.vertical.data) {
                  bytes = base64ToUint8Array(creativeFiles.vertical.data);
                } else {
                  throw new Error('No image data available');
                }

                const ext = creativeFiles.vertical.name.split('.').pop()?.toLowerCase();

                // Add original with descriptive name
                zip.file(`creatives/original/vertical-1080x1920-${creativeFiles.vertical.name}`, bytes);

                // Add labeled copy for easy use
                if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
                  zip.file(`creatives/1080x1920-story.${ext}`, bytes);
                }
              } catch (error) {
                console.error('Failed to add vertical creative file', error);
                showToast('Warning: Vertical creative file skipped', 'warning');
              }
            }

            // Fallback: if no square/vertical, add the old creativeFile
            const creativeFile = get().brief.creativeFile;
            if (!creativeFiles?.square && !creativeFiles?.vertical && creativeFile && creativeFile.name) {
              try {
                let bytes: Uint8Array;

                // Fetch from R2 URL if available, otherwise use base64
                if (creativeFile.url) {
                  const response = await fetch(creativeFile.url);
                  const blob = await response.blob();
                  const arrayBuffer = await blob.arrayBuffer();
                  bytes = new Uint8Array(arrayBuffer);
                } else if (creativeFile.data) {
                  bytes = base64ToUint8Array(creativeFile.data);
                } else {
                  throw new Error('No image data available');
                }

                const ext = creativeFile.name.split('.').pop()?.toLowerCase();

                // Add original
                zip.file(`creatives/original/${creativeFile.name}`, bytes);

                // Add copies in standard formats for easy use
                if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
                  zip.file(`creatives/1080x1080-feed.${ext}`, bytes);
                  zip.file(`creatives/1080x1920-story.${ext}`, bytes);
                }
              } catch (error) {
                console.error('Failed to add creative file', error);
                showToast('Warning: Creative file skipped', 'warning');
              }
            }

            // Generate and download the bundle
            const bundle = await zip.generateAsync({
              type: 'blob',
              compression: 'DEFLATE',
              compressionOptions: { level: 6 }
            });

            const url = URL.createObjectURL(bundle);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${slugify(spec.refName || 'creative-spec')}-bundle-${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Creative bundle downloaded successfully', 'success');
          } catch (error) {
            console.error('Failed to export bundle', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showToast(`Failed to export bundle: ${errorMessage}`, 'error');
          }
        },

        loadAutosaveSnapshot: () => {
          try {
            const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as {
              savedAt: number;
              state: {
                brief: CreativeBrief;
                adCopy: AdCopyFields;
                preview: PreviewSettings;
                facebook: FacebookState;
              };
            };
            if (!parsed?.state) return;
            set(state => ({
              brief: { ...state.brief, ...parsed.state.brief },
              adCopy: { ...state.adCopy, ...parsed.state.adCopy },
              preview: { ...state.preview, ...parsed.state.preview },
              facebook: { ...state.facebook, ...parsed.state.facebook },
              autosave: { lastSavedAt: parsed.savedAt, isSaving: false, error: null },
              isDirty: false
            }));
          } catch (error) {
            console.error('Failed to load autosave snapshot', error);
          }
        },

        saveSnapshot: (timestamp = Date.now()) => {
          const state = get();

          // Strip base64 data from creative files to prevent localStorage quota exceeded
          const briefWithoutBase64 = {
            ...state.brief,
            creativeFile: state.brief.creativeFile ? {
              name: state.brief.creativeFile.name,
              size: state.brief.creativeFile.size,
              type: state.brief.creativeFile.type,
              width: state.brief.creativeFile.width,
              height: state.brief.creativeFile.height,
              aspectRatio: state.brief.creativeFile.aspectRatio,
              // Omit data field to save space
            } : null,
            creativeFiles: {
              square: state.brief.creativeFiles?.square ? {
                name: state.brief.creativeFiles.square.name,
                size: state.brief.creativeFiles.square.size,
                type: state.brief.creativeFiles.square.type,
                width: state.brief.creativeFiles.square.width,
                height: state.brief.creativeFiles.square.height,
                aspectRatio: state.brief.creativeFiles.square.aspectRatio,
                // Omit data field to save space
              } : undefined,
              vertical: state.brief.creativeFiles?.vertical ? {
                name: state.brief.creativeFiles.vertical.name,
                size: state.brief.creativeFiles.vertical.size,
                type: state.brief.creativeFiles.vertical.type,
                width: state.brief.creativeFiles.vertical.width,
                height: state.brief.creativeFiles.vertical.height,
                aspectRatio: state.brief.creativeFiles.vertical.aspectRatio,
                // Omit data field to save space
              } : undefined,
            }
          };

          const snapshot = {
            savedAt: timestamp,
            state: {
              brief: briefWithoutBase64,
              adCopy: state.adCopy,
              preview: state.preview,
              facebook: state.facebook
            }
          };

          try {
            localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(snapshot));
            set(state => ({
              autosave: { ...state.autosave, lastSavedAt: timestamp, isSaving: false, error: null },
              isDirty: false
            }));
          } catch (error) {
            console.error('Failed to persist snapshot', error);
            set(state => ({
              autosave: { ...state.autosave, isSaving: false, error: 'Failed to auto-save' }
            }));
          }
        },

        loadFromURLParams: async () => {
          try {
            const { loadCreativeFromURLParams, clearURLParams } = await import('@/utils/urlParams');
            const creativeData = await loadCreativeFromURLParams();

            if (!creativeData) return;

            const { setName, square, vertical } = creativeData;

            // Load square creative if present
            if (square) {
              await get().processCreativeUpload(square);
            }

            // Load vertical creative if present
            if (vertical) {
              await get().processCreativeUpload(vertical);
            }

            // Update ad name with set name if provided
            if (setName) {
              set(state => ({
                adCopy: { ...state.adCopy, adName: setName },
                isDirty: true
              }));
            }

            // Clear URL params to prevent re-processing on refresh
            clearURLParams();

            showToast(`Creative set "${setName || 'Untitled'}" loaded from link`, 'success');
          } catch (error) {
            console.error('Failed to load from URL params:', error);
            showToast('Failed to load creative from link', 'error');
          }
        },

        exportPreviewImage: async (format) => {
          const node = get().previewNode;
          if (!node) {
            throw new Error('Preview element not available');
          }

          // Temporarily expand text for export
          set(state => ({
            preview: { ...state.preview, forceExpandText: true }
          }));

          // Wait for React to re-render
          await new Promise(resolve => setTimeout(resolve, 100));

          try {
            const { creativeFile, creativeFiles } = get().brief;

            // Dynamic import - only load html-to-image when user exports
            const { toPng, toJpeg } = await import('html-to-image');

            const exportFn = format === 'png' ? toPng : toJpeg;
            const dataUrl = await exportFn(node, {
              cacheBust: true,
              quality: format === 'jpg' ? 0.92 : 1,
              skipFonts: true,
              // Use onclone to modify the cloned document, not the original DOM
              // Type assertion needed as onclone exists in runtime but not in all type definitions
              onclone: (clonedDoc: Document) => {
                const images = clonedDoc.querySelectorAll('img');
                images.forEach((img: HTMLImageElement) => {
                  if (img.src.startsWith('blob:')) {
                    // Check all possible creative sources and replace blob URL with data URL
                    const creatives = [creativeFile, creativeFiles?.square, creativeFiles?.vertical].filter(Boolean);
                    for (const creative of creatives) {
                      if (creative?.data && creative?.type) {
                        // Replace blob URL with data URL in the CLONED document only
                        img.src = `data:${creative.type};base64,${creative.data}`;
                        break;
                      }
                    }
                  }
                });
              }
            } as any);

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `creative-preview-${Date.now()}.${format}`;
            link.click();
            showToast(`Preview exported as ${format.toUpperCase()}`, 'success');
          } finally {
            // Restore normal state
            set(state => ({
              preview: { ...state.preview, forceExpandText: false }
            }));
          }
        },

        setShareState: (updates) =>
          set(state => ({
            share: { ...state.share, ...updates }
          })),

        saveAndShare: async () => {
          const state = get();
          const { brief, adCopy, preview, facebook } = state;

          // Validate required fields
          if (!brief.facebookLink) {
            set(() => ({
              share: {
                ...state.share,
                error: 'Please verify Facebook page before sharing',
                isSaving: false
              }
            }));
            showToast('Please verify Facebook page before sharing', 'error');
            return;
          }

          set(() => ({
            share: {
              ...state.share,
              isSaving: true,
              error: null
            }
          }));

          try {
            const spec = get().exportSpec();

            const response = await api.saveCreative({
              facebookUrl: brief.facebookLink,
              brief,
              adCopy,
              previewSettings: preview,
              specExport: spec,
              creativeFile: brief.creativeFile || undefined,
              facebookPageData: facebook.pageData || undefined,
              campaignShortId: state.campaignContext || undefined
            });

            if (response.success && response.data) {
              set(() => ({
                share: {
                  shareUrl: response.data!.urls.byUsername,
                  shortId: response.data!.shortId,
                  isSaving: false,
                  error: null
                }
              }));
              showToast('Ad saved! Share link copied to clipboard.', 'success');

              // Copy to clipboard
              await navigator.clipboard.writeText(response.data.urls.byUsername);
            }
          } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Failed to save ad';
            set(state => ({
              share: {
                ...state.share,
                isSaving: false,
                error: message
              }
            }));
            showToast(message, 'error');
          }
        },

        loadPreviewData: async (advertiser, adId) => {
          try {
            const response = await fetch(`${CREATIVE_API_BASE}/api/preview/${advertiser}?adId=${adId}`);
            const result = await response.json();

            if (!result.success || !result.data) {
              showToast(result.error || 'Failed to load preview', 'error');
              return;
            }

            const { ad, advertiser: advertiserInfo } = result.data;

            // Load the data into the store
            set({
              brief: ad.brief,
              adCopy: ad.adCopy,
              preview: ad.previewSettings,
              facebook: {
                pageData: advertiserInfo.page_data || null,
                verificationStatus: 'success',
                hasAttempted: true,
                error: null
              },
              ai: {
                isGenerating: false,
                hasGenerated: true,
                error: null,
                lastGeneratedAt: null
              },
              isDirty: false,
              isPreviewMode: true,
              advertiserIdentifier: advertiserInfo.username || advertiserInfo.page_id || null
            });
          } catch (error) {
            console.error('Failed to load preview data', error);
            const message = error instanceof Error ? error.message : 'Failed to load preview';
            showToast(message, 'error');
          }
        }
      }),
      {
        name: 'meta-creative-builder-storage',
        partialize: (state) => ({
          brief: {
            ...state.brief,
            // Exclude base64 data to prevent localStorage quota exceeded
            creativeFile: state.brief.creativeFile ? {
              name: state.brief.creativeFile.name,
              size: state.brief.creativeFile.size,
              type: state.brief.creativeFile.type,
              url: state.brief.creativeFile.url, // Save R2 URL
              width: state.brief.creativeFile.width,
              height: state.brief.creativeFile.height,
              aspectRatio: state.brief.creativeFile.aspectRatio,
              // Omit data field - it's too large for localStorage
            } : null,
            creativeFiles: {
              square: state.brief.creativeFiles?.square ? {
                name: state.brief.creativeFiles.square.name,
                size: state.brief.creativeFiles.square.size,
                type: state.brief.creativeFiles.square.type,
                url: state.brief.creativeFiles.square.url, // Save R2 URL
                width: state.brief.creativeFiles.square.width,
                height: state.brief.creativeFiles.square.height,
                aspectRatio: state.brief.creativeFiles.square.aspectRatio,
                // Omit data field - it's too large for localStorage
              } : undefined,
              vertical: state.brief.creativeFiles?.vertical ? {
                name: state.brief.creativeFiles.vertical.name,
                size: state.brief.creativeFiles.vertical.size,
                type: state.brief.creativeFiles.vertical.type,
                url: state.brief.creativeFiles.vertical.url, // Save R2 URL
                width: state.brief.creativeFiles.vertical.width,
                height: state.brief.creativeFiles.vertical.height,
                aspectRatio: state.brief.creativeFiles.vertical.aspectRatio,
                // Omit data field - it's too large for localStorage
              } : undefined,
            }
          },
          adCopy: state.adCopy,
          preview: state.preview,
          facebook: state.facebook,
          ai: state.ai,
          autosave: state.autosave,
          isDirty: state.isDirty
        }),
        merge: (persistedState, currentState) => {
          const typedPersisted = persistedState as Partial<CreativeStore> | undefined;
          return {
            ...currentState,
            ...typedPersisted,
            brief: {
              ...defaultBrief(),
              ...(typedPersisted?.brief ?? {}),
              creativeFiles: (typedPersisted?.brief?.creativeFiles ?? {})
            },
            autosave: {
              ...defaultAutosaveState(),
              ...(typedPersisted?.autosave ?? {})
            }
          };
        },
        onRehydrateStorage: () => {
          console.log('[Store] Hydrating from localStorage...');
          return (state, error) => {
            if (error) {
              console.error('[Store] Hydration error:', error);
              // If we can't load from localStorage, clear it and start fresh
              try {
                localStorage.removeItem('meta-creative-builder-storage');
                console.log('[Store] Cleared corrupted localStorage');
              } catch (e) {
                console.error('[Store] Failed to clear localStorage:', e);
              }
            } else {
              console.log('[Store] Hydration complete');
            }
          };
        }
      }
    )
  )
);
