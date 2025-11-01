import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { FormBuilder } from './components/FormBuilder';
import { AdPreview } from './components/AdPreview';
import { ResizablePanels } from './components/UI/ResizablePanels';
import { AutoSave } from './components/AutoSave';
import { ToastContainer } from './components/UI/ToastContainer';
import { useCreativeStore } from '@/stores/creativeStore';
import { showToast } from '@/stores/toastStore';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoadingAdvertiser, setIsLoadingAdvertiser] = useState(false);

  const loadAutosaveSnapshot = useCreativeStore(state => state.loadAutosaveSnapshot);
  const loadFromURLParams = useCreativeStore(state => state.loadFromURLParams);
  const resetStore = useCreativeStore(state => state.resetStore);
  const setFacebookPageData = useCreativeStore(state => state.setFacebookPageData);
  const updateBrief = useCreativeStore(state => state.updateBrief);
  const advertiserIdentifier = useCreativeStore(state => state.advertiserIdentifier);

  // Load advertiser data from query parameter
  useEffect(() => {
    const advertiser = searchParams.get('advertiser');
    const campaign = searchParams.get('campaign');

    // Skip if no advertiser parameter or already loaded
    if (!advertiser || advertiserIdentifier === advertiser) {
      return;
    }

    const loadAdvertiserData = async () => {
      try {
        setIsLoadingAdvertiser(true);

        // Reset store completely for a fresh form
        resetStore();

        const response = await fetch(`${API_BASE_URL}/api/advertiser/${advertiser}`);

        if (!response.ok) {
          throw new Error('Failed to load advertiser data');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load advertiser data');
        }

        const { advertiser: advertiserData, ads } = result.data;

        // Pre-fill Facebook page data
        const facebookPageData = {
          page_id: advertiserData.page_id,
          name: advertiserData.page_data.name,
          profile_picture: advertiserData.page_data.profile_picture,
          url: `https://facebook.com/${advertiserData.username}`,
          category: advertiserData.page_data.category,
          website: advertiserData.page_data.website,
          intro: undefined,
          method: 'advertiser_page_prefill'
        };

        // Set Facebook page data (this will set verification status to success)
        setFacebookPageData(facebookPageData);

        // Pre-fill only advertiser data (Facebook link and website) - start fresh without any ad data
        updateBrief({
          facebookLink: `https://facebook.com/${advertiserData.username}`,
          websiteUrl: advertiserData.page_data.website || ''
          // Leave all other fields empty for fresh ad creation
        });

        // Store advertiser identifier
        useCreativeStore.setState({ advertiserIdentifier: advertiserData.username });

        // Store campaign context if provided
        if (campaign) {
          useCreativeStore.setState({ campaignContext: campaign });
        }

        // Remove the query parameters after loading
        setSearchParams({}, { replace: true });

        showToast('Advertiser data pre-filled successfully', 'success');
      } catch (error) {
        console.error('[App] Failed to load advertiser data:', error);
        showToast('Failed to load advertiser data', 'error');
        // Remove the query parameter on error
        setSearchParams({}, { replace: true });
      } finally {
        setIsLoadingAdvertiser(false);
      }
    };

    loadAdvertiserData();
  }, [searchParams, setSearchParams, advertiserIdentifier, resetStore, setFacebookPageData, updateBrief]);

  // Load autosave snapshot (only if not loading advertiser)
  useEffect(() => {
    if (!searchParams.get('advertiser')) {
      loadAutosaveSnapshot();
    }
  }, [loadAutosaveSnapshot, searchParams]);

  // Load creative from URL params (for Quick Create workflow)
  useEffect(() => {
    const hasCreativeParams = searchParams.has('creativeId') || searchParams.has('setName') || searchParams.has('square') || searchParams.has('vertical');

    if (hasCreativeParams && !isLoadingAdvertiser) {
      void loadFromURLParams();
    }
  }, [loadFromURLParams, searchParams, isLoadingAdvertiser]);

  // Show loading state while advertiser data is being loaded
  if (isLoadingAdvertiser) {
    return (
      <div className="h-screen bg-canvas flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-meta-blue animate-spin mx-auto mb-4" />
            <p className="text-16 text-text-secondary">Loading advertiser data...</p>
          </div>
        </main>
        <ToastContainer />
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
          leftPanel={
            <FormBuilder />
          }
          rightPanel={
            <AdPreview />
          }
        />
      </main>

      <AutoSave />
      <ToastContainer />
    </div>
  );
}

export default App;
