import React, { useEffect } from 'react';
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
import { API_BASE_URL } from '@/services/api';
import { PreviewToolbar } from '@/components/preview/PreviewToolbar';
import type { ApprovalRequestWithDetails } from '@/types/approval';

const PreviewPageContent: React.FC = () => {
  const { advertiser, adId } = useParams<{ advertiser: string; adId: string }>();
  const [searchParams] = useSearchParams();
  const loadPreviewData = useCreativeStore(state => state.loadPreviewData);
  const isPreviewMode = useCreativeStore(state => state.isPreviewMode);
  const [isLoading, setIsLoading] = React.useState(true);
  const [localApprovalData, setLocalApprovalData] = React.useState<ApprovalRequestWithDetails | null>(null);

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

      {/* Preview Toolbar with Share and Download buttons */}
      {advertiser && adId && (
        <PreviewToolbar advertiserIdentifier={advertiser} adId={adId} />
      )}

      <main className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanels
          className="h-full"
          initialLeftWidth={localApprovalData ? 0 : 30}
          minLeftWidth={0}
          maxLeftWidth={70}
          leftPanel={
            <ApprovalFormView isPreview={true} />
          }
          rightPanel={
            <AdPreview />
          }
        />
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
