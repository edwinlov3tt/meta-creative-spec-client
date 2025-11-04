import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { FormBuilder } from '@/components/FormBuilder';
import { ApprovalFormView } from '@/components/ApprovalFormView';
import { AdPreview } from '@/components/AdPreview';
import { ResizablePanels } from '@/components/UI/ResizablePanels';
import { ToastContainer } from '@/components/UI/ToastContainer';
import { ApprovalDrawer } from '@/components/approval/ApprovalDrawer';
import { ApprovalProvider, useApproval } from '@/contexts/ApprovalContext';
import { useCreativeStore } from '@/stores/creativeStore';
import { Spinner } from '@/components/UI/Spinner';
import { API_BASE_URL, getProxiedR2Url } from '@/services/api';
import type { ApprovalRequestWithDetails } from '@/types/approval';
import { PreviewTabs } from '@/components/previews/PreviewTabs';
import { PreviewsGrid } from '@/components/previews/PreviewsGrid';
import type { PreviewPlatform, PreviewPlacement, PreviewAdData } from '@/types/previews';

const PreviewPageContent: React.FC = () => {
  const { advertiser, adId } = useParams<{ advertiser: string; adId: string }>();
  const [searchParams] = useSearchParams();
  const loadPreviewData = useCreativeStore(state => state.loadPreviewData);
  const isPreviewMode = useCreativeStore(state => state.isPreviewMode);
  const adCopy = useCreativeStore(state => state.adCopy);
  const brief = useCreativeStore(state => state.brief);
  const facebook = useCreativeStore(state => state.facebook);
  const [isLoading, setIsLoading] = useState(true);
  const [localApprovalData, setLocalApprovalData] = useState<ApprovalRequestWithDetails | null>(null);

  // All Views state
  const [showAllViews, setShowAllViews] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PreviewPlatform[]>(['facebook', 'instagram', 'messenger']);
  const [selectedPlacements, setSelectedPlacements] = useState<PreviewPlacement[]>(['feed', 'rightcolumn', 'story', 'reel', 'explore', 'instream', 'search', 'inbox']);

  const { setApprovalData, setUserEmail } = useApproval();
  const userEmail = searchParams.get('email') || undefined;

  const loadApprovalData = async () => {
    if (!adId) return;

    try {
      const url = userEmail
        ? `${API_BASE_URL}/api/approval/ad/${adId}?email=${encodeURIComponent(userEmail)}`
        : `${API_BASE_URL}/api/approval/ad/${adId}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        const approvalRequestData = result.data.approval_request;
        setLocalApprovalData(approvalRequestData);
        setApprovalData(approvalRequestData);
        if (userEmail) {
          setUserEmail(userEmail);
        }
      }
    } catch (error) {
      console.error('Failed to load approval data:', error);
    }
  };

  useEffect(() => {
    if (!advertiser || !adId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      await loadPreviewData(advertiser, adId);
      await loadApprovalData();
      setIsLoading(false);
    };

    void load();
  }, [advertiser, adId, loadPreviewData, userEmail]);

  // Generate comprehensive preview data
  const comprehensiveAdData: PreviewAdData = useMemo(() => {
    const pageData = facebook.pageData || {};
    const brandName = pageData.name || adCopy.adName || 'Your Brand';

    // Get profile image with fallbacks
    let profileImage = '';
    if (pageData.profile_picture) {
      profileImage = pageData.profile_picture;
    } else if (pageData.image) {
      profileImage = pageData.image;
    } else if (Array.isArray(pageData.Images)) {
      const imageEntry = pageData.Images.find((entry: any) => entry?.type === 'facebook_profile_image');
      if (imageEntry?.url) profileImage = imageEntry.url;
    }
    if (!profileImage && pageData.instagram_details?.result?.profile_pic_url) {
      profileImage = pageData.instagram_details.result.profile_pic_url;
    }

    // Fallback to UI Avatars if no profile image
    if (!profileImage) {
      profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=1877f2&color=fff&size=256`;
    }

    // Get creative image with comprehensive fallback chain
    const creativeFiles = brief.creativeFiles || {};
    let creativeImage = '';
    let creativeImageFallback = '';

    // Try URLs first (will be proxied for R2)
    if (creativeFiles.square?.url) {
      creativeImage = creativeFiles.square.url;
      // Store base64 as fallback
      if (creativeFiles.square?.data) {
        creativeImageFallback = `data:${creativeFiles.square.type};base64,${creativeFiles.square.data}`;
      }
    } else if (creativeFiles.vertical?.url) {
      creativeImage = creativeFiles.vertical.url;
      if (creativeFiles.vertical?.data) {
        creativeImageFallback = `data:${creativeFiles.vertical.type};base64,${creativeFiles.vertical.data}`;
      }
    } else if (brief.creativeFile?.url) {
      creativeImage = brief.creativeFile.url;
      if (brief.creativeFile?.data) {
        creativeImageFallback = `data:${brief.creativeFile.type};base64,${brief.creativeFile.data}`;
      }
    } else if (creativeFiles.square?.data) {
      // No URL, use base64 directly
      creativeImage = `data:${creativeFiles.square.type};base64,${creativeFiles.square.data}`;
    } else if (creativeFiles.vertical?.data) {
      creativeImage = `data:${creativeFiles.vertical.type};base64,${creativeFiles.vertical.data}`;
    } else if (brief.creativeFile?.data) {
      creativeImage = `data:${brief.creativeFile.type};base64,${brief.creativeFile.data}`;
    }

    // Apply R2 proxy transformation if needed
    if (creativeImage && !creativeImage.startsWith('data:')) {
      creativeImage = getProxiedR2Url(creativeImage);
    }

    // Store fallback in a way components can access it
    if (creativeImageFallback && !window.__creativeImageFallback) {
      (window as any).__creativeImageFallback = creativeImageFallback;
    }

    // Apply "See more" logic if character limit removed
    const applySeeMore = (text: string, removeLimit: boolean) => {
      if (!removeLimit) return text;
      if (text.length <= 140) return text;
      const visible = text.slice(0, 140).replace(/\s+$/, '');
      return `${visible}… See more`;
    };

    const primaryText = applySeeMore(
      adCopy.primaryText || '',
      brief.removeCharacterLimit || false
    );

    return {
      adName: adCopy.adName || '',
      primaryText,
      headline: adCopy.headline || 'Compelling headline',
      description: adCopy.description || 'Short supporting copy',
      callToAction: adCopy.callToAction || 'Learn More',
      websiteUrl: adCopy.destinationUrl || '',
      displayLink: adCopy.displayLink || 'example.com',
      brandName,
      profileImage,
      creativeImage,
    };
  }, [adCopy, brief, facebook]);

  if (isLoading) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-14 text-text-muted">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!isPreviewMode) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <p className="text-16 font-semibold text-text-primary">Preview Not Found</p>
          <p className="text-14 text-text-muted">
            The ad preview you're looking for doesn't exist or is not publicly accessible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 overflow-hidden">
        {showAllViews ? (
          // Comprehensive All Views mode
          <div className="h-full flex flex-col overflow-hidden">
            {/* Header for All Views */}
            <div className="bg-white border-b border-divider px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-20 font-semibold text-text-primary">Comprehensive Ad Previews</h2>
                  <p className="text-14 text-text-muted mt-1">
                    View your ad across all placements and platforms
                  </p>
                </div>
                <button
                  onClick={() => setShowAllViews(false)}
                  className="px-4 py-2 text-14 font-medium text-text-secondary hover:text-text-primary border border-border rounded-md hover:bg-surface-100 transition-colors"
                >
                  Back to Preview
                </button>
              </div>
            </div>

            <PreviewTabs
              selectedPlatforms={selectedPlatforms}
              onPlatformsChange={setSelectedPlatforms}
              selectedPlacements={selectedPlacements}
              onPlacementsChange={setSelectedPlacements}
            />
            <div className="flex-1 overflow-y-auto p-6">
              <PreviewsGrid
                platforms={selectedPlatforms}
                placements={selectedPlacements}
                adData={comprehensiveAdData}
              />
            </div>
          </div>
        ) : (
          // Normal preview mode with resizable panels
          <ResizablePanels
            className="h-full"
            initialLeftWidth={localApprovalData ? 0 : 30}
            minLeftWidth={0}
            maxLeftWidth={70}
            leftPanel={
              <ApprovalFormView isPreview={true} />
            }
            rightPanel={
              <AdPreview onShowAllViews={() => setShowAllViews(true)} />
            }
          />
        )}
      </main>

      {/* Approval Drawer - renders as overlay when approval exists */}
      {localApprovalData && (
        <ApprovalDrawer
          approvalData={localApprovalData}
          userEmail={userEmail}
          onApprovalUpdate={loadApprovalData}
          defaultOpen={true}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export const PreviewPage: React.FC = () => {
  return (
    <ApprovalProvider>
      <PreviewPageContent />
    </ApprovalProvider>
  );
};
