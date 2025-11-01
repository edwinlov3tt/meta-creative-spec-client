// API Base URL Configuration
// In production (with Vercel proxy), use relative URLs to leverage proxy rewrites
// In development, connect directly to local backend
const getApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL ?? '').trim();

  // If explicitly set via environment variable, use it
  if (envUrl) {
    return envUrl;
  }

  // In production builds, use empty string for relative URLs (proxied by Vercel)
  if (import.meta.env.PROD) {
    return '';
  }

  // In development, use localhost
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

// R2 Proxy Configuration
// Direct R2 URLs have CORS issues, so we use a Cloudflare Worker proxy
const R2_WORKER_PROXY_URL = 'https://creative-spec-r2-proxy.edwin-6f1.workers.dev';
const R2_DIRECT_URL = 'https://pub-2e94e700ed3d408eb2e1aefe6da0cf5f.r2.dev';

/**
 * Transform a direct R2 URL to use the Cloudflare Worker proxy
 * This fixes CORS issues when fetching creative files from the frontend
 *
 * @param url - R2 URL (direct or already proxied)
 * @returns Proxied URL that supports CORS
 *
 * @example
 * getProxiedR2Url('https://pub-2e94e700ed3d408eb2e1aefe6da0cf5f.r2.dev/file.jpg')
 * // Returns: 'https://creative-spec-r2-proxy.edwin-6f1.workers.dev/file.jpg'
 */
export const getProxiedR2Url = (url: string): string => {
  if (!url) return url;

  // If already using worker proxy, return as-is
  if (url.startsWith(R2_WORKER_PROXY_URL)) {
    return url;
  }

  // If using direct R2 URL, transform to worker proxy
  if (url.startsWith(R2_DIRECT_URL)) {
    return url.replace(R2_DIRECT_URL, R2_WORKER_PROXY_URL);
  }

  // Otherwise return as-is (might be a blob URL or data URL)
  return url;
};

class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

const resolveEndpoint = (endpoint: string) => {
  if (!API_BASE_URL) return endpoint;
  if (endpoint.startsWith('http')) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

type FetchOptions = globalThis.RequestInit;

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = resolveEndpoint(endpoint);
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
  } catch (error) {
    console.error('API network error', { url, error });
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new ApiError(0, 'Unable to reach API server', { url, message });
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Failed to parse API response', { url, text, error });
    throw new ApiError(response.status, 'Invalid response from server');
  }

  const responseError =
    typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
      ? (data as { error: string }).error
      : undefined;

  if (!response.ok || responseError) {
    throw new ApiError(response.status, responseError || response.statusText, data);
  }

  return data as T;
}

export interface GenerateAdCopyPayload {
  website: string;
  companyOverview: string;
  objective: string;
  salesFormula?: string;
  companyInfo?: string;
  instructions?: string;
  customPrompt?: string;
  includeEmoji?: boolean;
  creativeDescription?: string;
  facebookPageData?: unknown;
  creativeData?: {
    type: string;
    data: string;
  } | null;
}

export interface GeneratedAdCopyResponse {
  success: boolean;
  data: {
    postText: string;
    headline: string;
    linkDescription: string;
    displayLink: string;
    cta: string;
    adName: string;
    reasoning?: string;
  };
  method?: string;
  error?: string;
}

export interface FacebookVerificationRequest {
  facebookUrl: string;
  websiteUrl?: string;
}

export interface FacebookVerificationResponse {
  success: boolean;
  data: unknown;
  method?: string;
  errors?: string[];
  error?: string;
}

export interface SaveCreativeRequest {
  facebookUrl: string;
  brief: any;
  adCopy: any;
  previewSettings: any;
  specExport: any;
  creativeFile?: any;
  facebookPageData?: any;
  campaignShortId?: string; // Optional campaign to assign ad to
}

export interface SaveCreativeResponse {
  success: boolean;
  data?: {
    shortId: string;
    urls: {
      byUsername: string;
      byPageId: string;
    };
  };
  error?: string;
}

export const api = {
  generateAdCopy(payload: GenerateAdCopyPayload) {
    return request<GeneratedAdCopyResponse>('/api/generate-copy', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  verifyFacebookPage(payload: FacebookVerificationRequest) {
    return request<FacebookVerificationResponse>('/api/facebook-page', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  saveCreative(payload: SaveCreativeRequest) {
    return request<SaveCreativeResponse>('/api/save-creative', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

export { ApiError, API_BASE_URL };
