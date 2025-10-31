import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { AdCard } from './AdCard';

interface Ad {
  id: number;
  short_id: string;
  ad_name: string;
  created_at: Date;
  preview_settings: {
    platform: 'facebook' | 'instagram';
    device: string;
    adType: string;
    adFormat: string;
  };
  creative_file: {
    url?: string;
    data?: string;
    type: string;
    name: string;
  } | null;
  primary_text: string;
  headline: string;
}

interface AdGridProps {
  ads: Ad[];
  advertiserIdentifier: string;
  onAdDeleted?: () => void;
}

type SortOption = 'newest' | 'oldest' | 'name';
type PlatformFilter = 'all' | 'facebook' | 'instagram';

export const AdGrid: React.FC<AdGridProps> = ({ ads, advertiserIdentifier, onAdDeleted }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter and sort ads
  const filteredAndSortedAds = useMemo(() => {
    let filtered = [...ads];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ad =>
        ad.ad_name.toLowerCase().includes(query) ||
        ad.headline.toLowerCase().includes(query) ||
        ad.primary_text.toLowerCase().includes(query)
      );
    }

    // Apply platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(ad => ad.preview_settings.platform === platformFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.ad_name.localeCompare(b.ad_name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [ads, searchQuery, platformFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search ads by name, headline, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-md text-14 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-meta-blue focus:border-transparent"
          />
        </div>

        {/* Platform Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`px-4 py-2 rounded-md text-14 font-medium transition-colors ${
              platformFilter === 'all'
                ? 'bg-meta-blue text-white'
                : 'bg-surface-100 text-text-primary hover:bg-surface-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPlatformFilter('facebook')}
            className={`px-4 py-2 rounded-md text-14 font-medium transition-colors ${
              platformFilter === 'facebook'
                ? 'bg-meta-blue text-white'
                : 'bg-surface-100 text-text-primary hover:bg-surface-200'
            }`}
          >
            Facebook
          </button>
          <button
            onClick={() => setPlatformFilter('instagram')}
            className={`px-4 py-2 rounded-md text-14 font-medium transition-colors ${
              platformFilter === 'instagram'
                ? 'bg-meta-blue text-white'
                : 'bg-surface-100 text-text-primary hover:bg-surface-200'
            }`}
          >
            Instagram
          </button>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-4 py-2 bg-white border border-border rounded-md text-14 text-text-primary focus:outline-none focus:ring-2 focus:ring-meta-blue focus:border-transparent"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-14 text-text-secondary">
        Showing {filteredAndSortedAds.length} of {ads.length} ads
      </div>

      {/* Grid */}
      {filteredAndSortedAds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedAds.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              advertiserIdentifier={advertiserIdentifier}
              onDelete={onAdDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-surface-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Search className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-16 font-semibold text-text-primary mb-2">
            No ads found
          </h3>
          <p className="text-14 text-text-secondary">
            {searchQuery.trim()
              ? 'Try adjusting your search or filters'
              : 'This advertiser has no ads yet'}
          </p>
        </div>
      )}
    </div>
  );
};
