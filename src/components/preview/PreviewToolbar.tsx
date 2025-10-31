import React, { useState } from 'react';
import { Share2, Download, Check } from 'lucide-react';
import { useCreativeStore } from '@/stores/creativeStore';
import { showToast } from '@/stores/toastStore';
import { Spinner } from '@/components/UI/Spinner';

interface PreviewToolbarProps {
  advertiserIdentifier: string;
  adId: string;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({ advertiserIdentifier, adId }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const downloadBundle = useCreativeStore(state => state.downloadBundle);

  const handleShare = async () => {
    try {
      const previewUrl = `${window.location.origin}/preview/${advertiserIdentifier}/ad/${adId}`;

      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(previewUrl);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = previewUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }

      setJustCopied(true);
      showToast('Preview link copied to clipboard', 'success');

      setTimeout(() => {
        setJustCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      showToast('Failed to copy link', 'error');
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadBundle();
      showToast('Creative spec downloaded successfully', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Failed to download spec', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white border-b border-divider px-6 py-3 flex items-center justify-end gap-3">
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-surface-200 text-text-primary rounded-md text-14 font-medium transition-colors"
        title="Copy preview link to clipboard"
      >
        {justCopied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Share Link
          </>
        )}
      </button>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-14 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download creative spec bundle"
      >
        {isDownloading ? (
          <>
            <Spinner size="sm" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download Spec
          </>
        )}
      </button>
    </div>
  );
};
