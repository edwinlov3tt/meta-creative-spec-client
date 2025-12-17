import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

// Lazy load pages for better initial bundle size
// These pages will be loaded on-demand when the user navigates to them
const PreviewPage = lazy(() => import('./pages/PreviewPage.tsx').then(m => ({ default: m.PreviewPage })))
const PreviewsPage = lazy(() => import('./pages/PreviewsPage.tsx').then(m => ({ default: m.PreviewsPage })))
const ApprovalPage = lazy(() => import('./pages/ApprovalPage.tsx').then(m => ({ default: m.ApprovalPage })))
const EditPage = lazy(() => import('./pages/EditPage.tsx').then(m => ({ default: m.EditPage })))
const AdvertiserPage = lazy(() => import('./pages/AdvertiserPage.tsx').then(m => ({ default: m.AdvertiserPage })))
const AdsLibraryPage = lazy(() => import('./pages/AdsLibraryPage.tsx').then(m => ({ default: m.AdsLibraryPage })))
const AdvertisersListPage = lazy(() => import('./pages/AdvertisersListPage.tsx').then(m => ({ default: m.AdvertisersListPage })))
const ApprovalViewPage = lazy(() => import('./pages/ApprovalViewPage.tsx').then(m => ({ default: m.ApprovalViewPage })))
const PushToAdManagerPage = lazy(() => import('./pages/PushToAdManagerPage.tsx').then(m => ({ default: m.PushToAdManagerPage })))
const CreateCampaignPage = lazy(() => import('./pages/CreateCampaignPage.tsx').then(m => ({ default: m.CreateCampaignPage })))
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage.tsx').then(m => ({ default: m.CampaignDetailPage })))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-500">Loading...</span>
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/preview/:advertiser/ad/:adId" element={<PreviewPage />} />
            <Route path="/approval/:advertiser/ad/:adId" element={<ApprovalPage />} />
            <Route path="/edit/:identifier/:adId" element={<EditPage />} />
            <Route path="/advertiser/:identifier" element={<AdvertiserPage />} />
            <Route path="/advertiser/:identifier/previews" element={<PreviewsPage />} />
            <Route path="/advertiser/:identifier/campaign/new" element={<CreateCampaignPage />} />
            <Route path="/advertiser/:identifier/campaign/:campaignId" element={<CampaignDetailPage />} />
            <Route path="/ads" element={<AdsLibraryPage />} />
            <Route path="/advertisers" element={<AdvertisersListPage />} />
            <Route path="/approval/:token" element={<ApprovalViewPage />} />
            <Route path="/push-to-ad-manager/:advertiser/:adId" element={<PushToAdManagerPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
