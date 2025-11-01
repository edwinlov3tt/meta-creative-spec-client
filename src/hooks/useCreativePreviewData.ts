import { useMemo, useEffect, useRef } from 'react';
import { useCreativeStore } from '@/stores/creativeStore';
import type { AdFormat, AdType, Device, Platform } from '@/types/creative';

const applySeeMore = (text: string, removeLimit: boolean) => {
  if (!removeLimit) return text;
  if (text.length <= 140) return text;
  const visible = text.slice(0, 140).replace(/\s+$/, '');
  return `${visible}… See more`;
};

export const useCreativePreviewData = () => {
  const preview = useCreativeStore(state => state.preview);
  const adCopy = useCreativeStore(state => state.adCopy);
  const brief = useCreativeStore(state => state.brief);
  const facebook = useCreativeStore(state => state.facebook);
  const blobUrlRef = useRef<string>('');

  const truncatedPrimary = useMemo(
    () => applySeeMore(adCopy.primaryText || '', brief.removeCharacterLimit),
    [adCopy.primaryText, brief.removeCharacterLimit]
  );

  const platform = preview.platform as Platform;
  const device = preview.device as Device;
  const adType = preview.adType as AdType;
  const adFormat = preview.adFormat as AdFormat;

  const brandName = facebook.pageData?.name || adCopy.adName || 'Your Brand';

  const profileImage = useMemo(() => {
    const pageData = facebook.pageData;
    if (!pageData) return '';
    if (pageData.profile_picture) return pageData.profile_picture;
    if (pageData.image) return pageData.image;
    if (Array.isArray(pageData.Images)) {
      const imageEntry = pageData.Images.find(entry => entry?.type === 'facebook_profile_image');
      if (imageEntry?.url) return imageEntry.url;
    }
    if (pageData.instagram_details?.result?.profile_pic_url) {
      return pageData.instagram_details.result.profile_pic_url;
    }
    return '';
  }, [facebook.pageData]);

  const creativeImage = useMemo(() => {
    // Select appropriate creative based on ad type
    let selectedCreative = brief.creativeFile;

    // Safely access creativeFiles with default empty object
    const creativeFiles = brief.creativeFiles || {};

    // For stories/reels (9:16), prefer vertical creative if available
    if (adType === 'story' || adType === 'reel') {
      if (creativeFiles.vertical) {
        selectedCreative = creativeFiles.vertical;
      } else if (creativeFiles.square) {
        selectedCreative = creativeFiles.square;
      }
    } else {
      // For feed ads (1:1), prefer square creative
      if (creativeFiles.square) {
        selectedCreative = creativeFiles.square;
      } else if (creativeFiles.vertical) {
        selectedCreative = creativeFiles.vertical;
      }
    }

    // Check if we have URL (R2) or data (base64)
    if (!selectedCreative || !selectedCreative.type) {
      console.log('[Preview] No creative or type');
      return '';
    }
    if (!selectedCreative.url && !selectedCreative.data) {
      console.log('[Preview] No URL or data available for:', selectedCreative.name || 'unknown');
      console.log('[Preview] Creative object:', selectedCreative);
      return '';
    }

    // Prefer R2 URL over base64 (more efficient, less data in state)
    // Base64 is kept as fallback for localStorage and offline access
    if (selectedCreative.url) {
      return selectedCreative.url;
    }

    // Fall back to base64/blob data if no R2 URL

    const fileData = selectedCreative.data!;
    const fileType = selectedCreative.type;

    // If it's already a blob URL or regular URL, return as-is
    if (fileData.startsWith('blob:') || fileData.startsWith('http')) {
      return fileData;
    }

    // Convert base64 to Blob URL to avoid 431 error
    try {
      // Revoke previous blob URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      // The data is stored as raw base64 string without the data URL prefix
      // Convert it back to bytes
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileType });
      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;

      return blobUrl;
    } catch (error) {
      console.error('Failed to create blob URL:', error);
      return '';
    }
  }, [brief.creativeFile, brief.creativeFiles, adType]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const adData = useMemo(() => ({
    adName: adCopy.adName,
    primaryText: truncatedPrimary,
    headline: adCopy.headline || 'Compelling headline',
    description: adCopy.description || 'Short supporting copy',
    callToAction: adCopy.callToAction,
    websiteUrl: adCopy.destinationUrl,
    displayLink: adCopy.displayLink || 'example.com',
    brandName,
    profileImage,
    creativeImage
  }), [adCopy.adName, truncatedPrimary, adCopy.headline, adCopy.description, adCopy.callToAction, adCopy.destinationUrl, adCopy.displayLink, brandName, profileImage, creativeImage]);

  return {
    platform,
    device,
    adType,
    adFormat,
    adData,
    truncatedPrimary,
    brandName,
    profileImage,
    creativeImage
  };
};
