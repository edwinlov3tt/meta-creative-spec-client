import type { DetectedCreativeSet } from '@/utils/zipParser';

export type Platform = 'facebook' | 'instagram';
export type Device = 'desktop' | 'mobile';
export type AdType = 'feed' | 'story' | 'reel';
export type AdFormat = 'single_image' | 'original' | '1:1' | '4:5';

export interface CreativeFile {
  name: string;
  size: number;
  type: string;
  url?: string; // R2 public URL
  data?: string; // base64 payload for AI service (fallback/legacy)
  width?: number;
  height?: number;
  aspectRatio?: '1:1' | '9:16' | 'other';
}

export interface CreativeFiles {
  square?: CreativeFile; // 1080x1080 for feed
  vertical?: CreativeFile; // 1080x1920 for stories/reels
}

export interface UTMParameters {
  campaign: string;
  medium: string;
  source: string;
  content: string;
}

export type CreativeType = 'traffic' | 'brand_awareness' | 'retargeting' | 'engagement' | 'conversions' | 'leads_sales';

export interface CreativeBrief {
  facebookLink: string;
  websiteUrl: string;
  companyOverview: string;
  campaignObjective: string;
  companyInfo: string;
  additionalInstructions: string;
  customPrompt: string;
  salesFormula: string;
  includeEmoji: boolean;
  removeCharacterLimit: boolean;
  disableAI: boolean;
  utm: UTMParameters;
  creativeFile: CreativeFile | null;
  creativeFiles: CreativeFiles;
  creativeType: CreativeType;
  isFlighted: boolean;
  flightStartDate: string;
  flightEndDate: string;
  detectedSets?: DetectedCreativeSet[];
}

export interface AdCopyFields {
  adName: string;
  primaryText: string;
  headline: string;
  description: string;
  destinationUrl: string;
  displayLink: string;
  callToAction: string;
}

export interface PreviewSettings {
  platform: Platform;
  device: Device;
  adType: AdType;
  adFormat: AdFormat;
  forceExpandText?: boolean;
}

export interface FacebookPageData {
  page_id?: string;
  name?: string;
  categories?: string[];
  cover_image?: string;
  intro?: string;
  image?: string;
  profile_picture?: string;
  instagram_url?: string;
  instagram_details?: {
    result?: {
      username?: string;
      full_name?: string;
      profile_pic_url?: string;
    } | null;
  } | null;
  website?: string;
  Images?: Array<{ type?: string; url?: string } | null>;
  [key: string]: unknown;
}

export interface FacebookState {
  pageData: FacebookPageData | null;
  verificationStatus: 'idle' | 'pending' | 'success' | 'error';
  hasAttempted: boolean;
  error?: string | null;
}

export interface AIState {
  isGenerating: boolean;
  hasGenerated: boolean;
  error?: string | null;
  lastGeneratedAt?: number | null;
}

export interface AutosaveState {
  lastSavedAt: number | null;
  isSaving: boolean;
  error: string | null;
}

export interface ShareState {
  shareUrl: string | null;
  shortId: string | null;
  isSaving: boolean;
  error: string | null;
}

export interface SpecExport {
  refName: string;
  adName?: string;
  postText: string;
  headline: string;
  description: string;
  destinationUrl: string;
  displayLink: string;
  cta: string;
  imageName?: string;
  facebookPageUrl?: string;
  platform: Platform;
  device: Device;
  adType: AdType;
  adFormat: AdFormat;
  flightStartDate: string;
  flightEndDate: string;
  meta: {
    company: string;
    companyInfo: string;
    objective: string;
    customPrompt: string;
    formula: string;
    facebookLink: string;
    url: string;
    notes: string;
    facebookPageData: FacebookPageData | null;
  };
}

export interface CreativeStore {
  brief: CreativeBrief;
  adCopy: AdCopyFields;
  preview: PreviewSettings;
  facebook: FacebookState;
  ai: AIState;
  autosave: AutosaveState;
  share: ShareState;
  isDirty: boolean;
  isPreviewMode: boolean;
  previewNode: HTMLElement | null;
  advertiserIdentifier: string | null;
  campaignContext: string | null; // Campaign short_id for auto-assignment

  // Mutators
  updateBrief: (updates: Partial<CreativeBrief>) => void;
  updateBriefField: <K extends keyof CreativeBrief>(key: K, value: CreativeBrief[K]) => void;
  updateUTM: (updates: Partial<UTMParameters>) => void;
  setCreativeFile: (file: CreativeFile | null) => void;
  setDetectedSets: (sets: DetectedCreativeSet[]) => void;
  updateAdCopy: (updates: Partial<AdCopyFields>) => void;
  updateAdCopyField: <K extends keyof AdCopyFields>(key: K, value: AdCopyFields[K]) => void;
  setPreview: (updates: Partial<PreviewSettings>) => void;

  setFacebookState: (state: Partial<FacebookState>) => void;
  setFacebookPageData: (data: FacebookPageData | null) => void;

  setAIState: (state: Partial<AIState>) => void;

  markDirty: () => void;
  markSaved: (timestamp?: number) => void;
  resetStore: () => void;
  setAutosaveState: (updates: Partial<AutosaveState>) => void;

  exportSpec: () => SpecExport;

  // Async actions
  processCreativeUpload: (file: File | null) => Promise<void>;
  processMultiSetUpload: (zipFile: File) => Promise<void>;
  verifyFacebookPage: (facebookUrl: string, websiteUrl?: string) => Promise<void>;
  generateAdCopy: () => Promise<void>;
  regenerateAdCopy: () => Promise<void>;

  copySpecToClipboard: () => Promise<void>;
  downloadSpecJson: () => void;
  downloadSpecSheet: () => void;
  downloadBundle: () => Promise<void>;
  loadAutosaveSnapshot: () => void;
  saveSnapshot: (timestamp?: number) => void;
  loadFromURLParams: () => Promise<void>;
  setPreviewNode: (node: HTMLElement | null) => void;
  exportPreviewImage: (format: 'png' | 'jpg') => Promise<void>;
  getTrackedUrl: () => string;
  applyTrackedUrl: () => void;
  saveAndShare: () => Promise<void>;
  setShareState: (updates: Partial<ShareState>) => void;
  loadPreviewData: (advertiser: string, adId: string) => Promise<void>;
}
