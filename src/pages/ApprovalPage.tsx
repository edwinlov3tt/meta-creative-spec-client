import React, { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { ApprovalFormView } from '@/components/ApprovalFormView';
import { AdPreview } from '@/components/AdPreview';
import { ResizablePanels, ResizablePanelsRef } from '@/components/UI/ResizablePanels';
import { ToastContainer } from '@/components/UI/ToastContainer';
import { ApprovalDrawer } from '@/components/approval/ApprovalDrawer';
import { ApprovalProvider, useApproval } from '@/contexts/ApprovalContext';
import { useCreativeStore } from '@/stores/creativeStore';
import { Spinner } from '@/components/UI/Spinner';
import { API_BASE_URL } from '@/services/api';
import type { ApprovalRequestWithDetails } from '@/types/approval';

const ApprovalPageContent: React.FC = () => {
  const { advertiser, adId } = useParams<{ advertiser: string; adId: string }>();
  const [searchParams] = useSearchParams();
  const loadPreviewData = useCreativeStore(state => state.loadPreviewData);
  const isPreviewMode = useCreativeStore(state => state.isPreviewMode);
  const [isLoading, setIsLoading] = React.useState(true);
  const [approvalData, setApprovalData] = React.useState<ApprovalRequestWithDetails | null>(null);
  const resizablePanelsRef = useRef<ResizablePanelsRef>(null);

  const { setApprovalData: setContextApprovalData, setUserEmail } = useApproval();
  const userEmail = searchParams.get('email') || undefined;

  const loadApprovalData = async () => {
    if (!adId) return;

    try {
      // Set user email FIRST before loading approval data
      if (userEmail) {
        setUserEmail(userEmail);
      }

      const url = userEmail
        ? `${API_BASE_URL}/api/approval/ad/${adId}?email=${encodeURIComponent(userEmail)}`
        : `${API_BASE_URL}/api/approval/ad/${adId}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        const approvalRequestData = result.data.approval_request;
        console.log('[ApprovalPage] Loaded approval data:', approvalRequestData);
        console.log('[ApprovalPage] Current participant status:',
          approvalRequestData.participants.find((p: any) => p.email === userEmail)?.status
        );
        setApprovalData(approvalRequestData);
        setContextApprovalData(approvalRequestData);
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
      // Set user email first
      if (userEmail) {
        setUserEmail(userEmail);
      }
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
          <p className="text-14 text-text-muted">Loading approval request...</p>
        </div>
      </div>
    );
  }

  if (!isPreviewMode || !approvalData) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <p className="text-16 font-semibold text-text-primary">Approval Request Not Found</p>
          <p className="text-14 text-text-muted">
            The approval request you're looking for doesn't exist or is not accessible.
          </p>
        </div>
      </div>
    );
  }

  const handleReject = () => {
    // Open the left panel so users can revise fields
    resizablePanelsRef.current?.openLeftPanel();
  };

  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanels
          ref={resizablePanelsRef}
          className="h-full"
          initialLeftWidth={0}
          minLeftWidth={0}
          maxLeftWidth={70}
          leftPanel={<ApprovalFormView isPreview={false} />}
          rightPanel={<AdPreview />}
        />
      </main>

      {/* Approval Drawer - renders as overlay */}
      <ApprovalDrawer
        approvalData={approvalData}
        userEmail={userEmail}
        onApprovalUpdate={loadApprovalData}
        onReject={handleReject}
        defaultOpen={true}
      />

      <ToastContainer />
    </div>
  );
};

export const ApprovalPage: React.FC = () => {
  return (
    <ApprovalProvider>
      <ApprovalPageContent />
    </ApprovalProvider>
  );
};
