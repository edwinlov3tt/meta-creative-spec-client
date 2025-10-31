import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Trash2, Eye, Calendar, Facebook, Instagram } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import { Button } from '@/components/UI/Button';
import { API_BASE_URL } from '@/services/api';

interface Ad {
  id: number;
  short_id: string;
  ad_name: string;
  created_at: Date;
  advertiser_username: string;
  advertiser_name: string;
  preview_settings: {
    platform: 'facebook' | 'instagram';
    device: string;
    adType: string;
    adFormat: string;
  };
  creative_file: {
    data: string;
    type: string;
    name: string;
  } | null;
  primary_text: string;
  headline: string;
}

export const AdsLibraryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = searchParams.get('role') === 'admin';

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/ads`);

        if (!response.ok) {
          throw new Error('Failed to load ads');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load ads');
        }

        setAds(result.data);
      } catch (err) {
        console.error('[AdsLibraryPage] Error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const handleDelete = async (adId: number, adName: string) => {
    if (!confirm(`Are you sure you want to delete "${adName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(adId);

      const response = await fetch(`${API_BASE_URL}/api/ads/${adId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete ad');
      }

      // Remove ad from list
      setAds(prev => prev.filter(ad => ad.id !== adId));
      showToast('Ad deleted successfully', 'success');
    } catch (err) {
      console.error('[AdsLibraryPage] Delete error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete ad', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-meta-blue animate-spin mx-auto mb-4" />
          <p className="text-16 text-text-secondary">Loading ads...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-24 font-semibold text-text-primary mb-2">Error Loading Ads</h2>
          <p className="text-14 text-text-secondary mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-meta-blue text-white rounded-md text-14 font-medium hover:bg-blue-600 transition-colors"
          >
            Go to Builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-divider">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-32 font-bold text-text-primary mb-2">Ad Library</h1>
              <p className="text-14 text-text-secondary">
                {ads.length} {ads.length === 1 ? 'ad' : 'ads'} total
                {isAdmin && <span className="ml-2 text-danger font-medium">(Admin Mode)</span>}
              </p>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                Go to Builder
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {ads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-16 text-text-secondary">No ads found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map(ad => (
              <div key={ad.id} className="card p-4 hover:shadow-lg transition-shadow">
                {/* Creative Preview */}
                <div className="aspect-square bg-surface-100 rounded-lg mb-4 overflow-hidden relative">
                  {ad.creative_file?.data ? (
                    <img
                      src={`data:${ad.creative_file.type};base64,${ad.creative_file.data}`}
                      alt={ad.ad_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-text-muted text-14">No Image</span>
                    </div>
                  )}
                  {/* Platform Badge */}
                  <div className="absolute top-2 right-2">
                    {ad.preview_settings.platform === 'facebook' ? (
                      <div className="w-8 h-8 bg-meta-blue rounded-full flex items-center justify-center">
                        <Facebook className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                        <Instagram className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad Info */}
                <div className="space-y-2">
                  <h3 className="text-16 font-semibold text-text-primary line-clamp-1">
                    {ad.ad_name}
                  </h3>
                  <p className="text-14 text-text-secondary line-clamp-2">
                    {ad.primary_text}
                  </p>
                  <Link
                    to={`/advertiser/${ad.advertiser_username}`}
                    className="text-12 text-meta-blue hover:underline block"
                  >
                    {ad.advertiser_name}
                  </Link>
                  <div className="flex items-center gap-1 text-12 text-text-muted">
                    <Calendar className="w-3 h-3" />
                    {new Date(ad.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to={`/preview/${ad.advertiser_username}/ad/${ad.short_id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ad.id, ad.ad_name)}
                      disabled={deletingId === ad.id}
                      className="text-danger hover:bg-red-50 hover:border-red-300"
                    >
                      {deletingId === ad.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
