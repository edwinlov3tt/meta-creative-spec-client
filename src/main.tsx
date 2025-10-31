import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import { PreviewPage } from './pages/PreviewPage.tsx'
import { PreviewsPage } from './pages/PreviewsPage.tsx'
import { ApprovalPage } from './pages/ApprovalPage.tsx'
import { EditPage } from './pages/EditPage.tsx'
import { AdvertiserPage } from './pages/AdvertiserPage.tsx'
import { AdsLibraryPage } from './pages/AdsLibraryPage.tsx'
import { AdvertisersListPage } from './pages/AdvertisersListPage.tsx'
import { ApprovalViewPage } from './pages/ApprovalViewPage.tsx'
import { PushToAdManagerPage } from './pages/PushToAdManagerPage.tsx'
import { CreateCampaignPage } from './pages/CreateCampaignPage.tsx'
import { CampaignDetailPage } from './pages/CampaignDetailPage.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
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
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)