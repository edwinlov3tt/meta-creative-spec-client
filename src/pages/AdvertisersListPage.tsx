import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Trash2, Eye, Facebook, Plus } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import { Button } from '@/components/UI/Button';
import { API_BASE_URL } from '@/services/api';

interface Advertiser {
  id: number;
  username: string;
  page_id: string;
  page_data: {
    name: string;
    profile_picture?: string;
    category?: string;
  };
  total_ads: number;
  created_at: Date;
}

export const AdvertisersListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = searchParams.get('role') === 'admin';

  useEffect(() => {
    const fetchAdvertisers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/advertisers`);

        if (!response.ok) {
          throw new Error('Failed to load advertisers');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load advertisers');
        }

        setAdvertisers(result.data);
      } catch (err) {
        console.error('[AdvertisersListPage] Error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisers();
  }, []);

  const handleDelete = async (advertiserId: number, advertiserName: string) => {
    if (!confirm(`Are you sure you want to delete "${advertiserName}" and all associated ads? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(advertiserId);

      const response = await fetch(`${API_BASE_URL}/api/advertisers/${advertiserId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete advertiser');
      }

      // Remove advertiser from list
      setAdvertisers(prev => prev.filter(adv => adv.id !== advertiserId));
      showToast('Advertiser deleted successfully', 'success');
    } catch (err) {
      console.error('[AdvertisersListPage] Delete error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete advertiser', 'error');
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
          <p className="text-16 text-text-secondary">Loading advertisers...</p>
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
          <h2 className="text-24 font-semibold text-text-primary mb-2">Error Loading Advertisers</h2>
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
              <h1 className="text-32 font-bold text-text-primary mb-2">Advertisers</h1>
              <p className="text-14 text-text-secondary">
                {advertisers.length} {advertisers.length === 1 ? 'advertiser' : 'advertisers'} total
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

      {/* Advertisers List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {advertisers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-16 text-text-secondary">No advertisers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advertisers.map(advertiser => {
              // Get profile picture URL
              const getProfilePictureUrl = () => {
                if (advertiser.page_data.profile_picture && !advertiser.page_data.profile_picture.includes('test.jpg')) {
                  return advertiser.page_data.profile_picture;
                }
                return `https://graph.facebook.com/${encodeURIComponent(advertiser.username)}/picture?type=large`;
              };

              const profilePictureUrl = getProfilePictureUrl();

              return (
                <div key={advertiser.id} className="card p-6 hover:shadow-lg transition-shadow">
                  {/* Profile Picture & Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <img
                        src={profilePictureUrl}
                        alt={advertiser.page_data.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div
                        className="w-16 h-16 rounded-xl bg-surface-200 items-center justify-center border-2 border-border"
                        style={{ display: 'none' }}
                      >
                        <span className="text-24 font-semibold text-text-muted">
                          {advertiser.page_data.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-18 font-semibold text-text-primary mb-1 truncate">
                        {advertiser.page_data.name}
                      </h3>
                      <p className="text-12 text-text-muted truncate">
                        @{advertiser.username}
                      </p>
                      {advertiser.page_data.category && (
                        <p className="text-12 text-text-secondary mt-1">
                          {advertiser.page_data.category}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-divider">
                    <div className="flex items-center gap-1">
                      <Facebook className="w-4 h-4 text-meta-blue" />
                      <span className="text-14 font-medium text-text-primary">
                        {advertiser.total_ads}
                      </span>
                      <span className="text-12 text-text-secondary">
                        {advertiser.total_ads === 1 ? 'ad' : 'ads'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/advertiser/${advertiser.username}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link to={`/?advertiser=${advertiser.username}`}>
                      <Button size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(advertiser.id, advertiser.page_data.name)}
                        disabled={deletingId === advertiser.id}
                        className="text-danger hover:bg-red-50 hover:border-red-300"
                      >
                        {deletingId === advertiser.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
