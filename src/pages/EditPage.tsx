import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { FormBuilder } from '@/components/FormBuilder';
import { AdPreview } from '@/components/AdPreview';
import { ResizablePanels } from '@/components/UI/ResizablePanels';
import { ToastContainer } from '@/components/UI/ToastContainer';
import { useCreativeStore } from '@/stores/creativeStore';
import { Spinner } from '@/components/UI/Spinner';
import { showToast } from '@/stores/toastStore';
import { API_BASE_URL } from '@/services/api';

export const EditPage: React.FC = () => {
  const { identifier, adId } = useParams<{ identifier: string; adId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const updateBrief = useCreativeStore(state => state.updateBrief);
  const updateAdCopy = useCreativeStore(state => state.updateAdCopy);
  const setFacebookPageData = useCreativeStore(state => state.setFacebookPageData);
  const setCreativeFile = useCreativeStore(state => state.setCreativeFile);
  const resetStore = useCreativeStore(state => state.resetStore);

  useEffect(() => {
    if (identifier && adId) {
      loadAdForEditing();
    }
  }, [identifier, adId]);

  const loadAdForEditing = async () => {
    try {
      setIsLoading(true);
      resetStore();

      const response = await fetch(`${API_BASE_URL}/api/ad/${identifier}/${adId}`);
      const result = await response.json();

      if (result.success && result.data?.ad) {
        const ad = result.data.ad;
        const advertiserData = result.data.advertiser;

        // Load brief data
        if (ad.brief) {
          updateBrief(ad.brief);
        }

        // Load ad copy
        if (ad.ad_copy) {
          updateAdCopy(ad.ad_copy);
        }

        // Load preview settings directly into store
        if (ad.preview_settings) {
          useCreativeStore.setState({ preview: ad.preview_settings });
        }

        // Load Facebook page data
        if (advertiserData?.page_data) {
          setFacebookPageData({
            page_id: advertiserData.page_id,
            name: advertiserData.page_data.name,
            profile_picture: advertiserData.page_data.profile_picture,
            url: `https://facebook.com/${advertiserData.username}`,
            category: advertiserData.page_data.category,
            website: advertiserData.page_data.website,
            method: 'edit_mode_prefill'
          });
        }

        // Load creative file if exists
        // Note: When loading from database, creative is already in base64 format
        // Use setCreativeFile directly instead of processCreativeUpload (which expects File objects)
        if (ad.creative_file) {
          setCreativeFile(ad.creative_file);
        }

        // Load creative files (square and vertical variants) if they exist
        if (ad.brief?.creativeFiles) {
          updateBrief({ creativeFiles: ad.brief.creativeFiles });
        }

        // Set advertiser identifier
        useCreativeStore.setState({ advertiserIdentifier: advertiserData.username });

        showToast('Ad loaded for editing', 'success');
      } else {
        showToast('Failed to load ad', 'error');
      }
    } catch (error) {
      console.error('Failed to load ad for editing:', error);
      showToast('Failed to load ad', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-14 text-text-muted">Loading ad for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanels
          className="h-full"
          initialLeftWidth={56}
          minLeftWidth={35}
          maxLeftWidth={70}
          leftPanel={<FormBuilder />}
          rightPanel={<AdPreview />}
        />
      </main>

      <ToastContainer />
    </div>
  );
};
