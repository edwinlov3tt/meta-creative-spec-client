export type PreviewPlatform = 'facebook' | 'instagram' | 'messenger';
export type PreviewPlacement = 'feed' | 'story' | 'reel' | 'inbox' | 'instream' | 'search' | 'rightcolumn' | 'explore';
export type PreviewDevice = 'mobile' | 'desktop';

export interface PreviewConfiguration {
  platform: PreviewPlatform;
  placement: PreviewPlacement;
  device: PreviewDevice;
  format: '1:1' | '4:5' | '9:16';
}

export interface PreviewAdData {
  adName: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
  websiteUrl: string;
  displayLink: string;
  brandName: string;
  profileImage: string;
  creativeImage: string;
}

export interface PlacementPreview {
  id: string;
  platform: PreviewPlatform;
  placement: PreviewPlacement;
  label: string;
  description: string;
  aspectRatio: '1:1' | '4:5' | '9:16';
  device: PreviewDevice;
  enabled: boolean;
}

export const PLACEMENT_CONFIGS: PlacementPreview[] = [
  {
    id: 'fb-feed',
    platform: 'facebook',
    placement: 'feed',
    label: 'Facebook Feed',
    description: 'Standard news feed placement',
    aspectRatio: '1:1',
    device: 'desktop',
    enabled: true,
  },
  {
    id: 'ig-feed',
    platform: 'instagram',
    placement: 'feed',
    label: 'Instagram Feed',
    description: 'Standard Instagram feed',
    aspectRatio: '1:1',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'fb-rightcolumn',
    platform: 'facebook',
    placement: 'rightcolumn',
    label: 'Facebook Right column',
    description: 'Desktop right column placement',
    aspectRatio: '1:1',
    device: 'desktop',
    enabled: true,
  },
  {
    id: 'fb-feed-mobile',
    platform: 'facebook',
    placement: 'feed',
    label: 'Facebook Feed (Mobile)',
    description: 'Mobile news feed',
    aspectRatio: '4:5',
    device: 'mobile',
    enabled: false,
  },
  {
    id: 'fb-story',
    platform: 'facebook',
    placement: 'story',
    label: 'Facebook Stories',
    description: 'Full-screen vertical stories',
    aspectRatio: '9:16',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'fb-reel',
    platform: 'facebook',
    placement: 'reel',
    label: 'Facebook Reels',
    description: 'Short-form video placement',
    aspectRatio: '9:16',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'ig-story',
    platform: 'instagram',
    placement: 'story',
    label: 'Instagram Stories',
    description: 'Full-screen vertical stories',
    aspectRatio: '9:16',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'ig-reel',
    platform: 'instagram',
    placement: 'reel',
    label: 'Instagram Reels',
    description: 'Short-form video placement',
    aspectRatio: '9:16',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'ig-explore',
    platform: 'instagram',
    placement: 'explore',
    label: 'Instagram Explore home',
    description: 'Explore grid placement',
    aspectRatio: '1:1',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'messenger-inbox',
    platform: 'messenger',
    placement: 'inbox',
    label: 'Messenger Inbox',
    description: 'Sponsored message in inbox',
    aspectRatio: '1:1',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'messenger-story',
    platform: 'messenger',
    placement: 'story',
    label: 'Messenger Stories',
    description: 'Full-screen vertical stories',
    aspectRatio: '9:16',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'fb-instream',
    platform: 'facebook',
    placement: 'instream',
    label: 'Facebook In-stream videos',
    description: 'Video ads in Facebook Watch and video feeds',
    aspectRatio: '1:1',
    device: 'mobile',
    enabled: true,
  },
  {
    id: 'fb-search',
    platform: 'facebook',
    placement: 'search',
    label: 'Facebook Marketplace Search',
    description: 'Ads in Facebook Marketplace search results',
    aspectRatio: '1:1',
    device: 'mobile',
    enabled: true,
  },
];
