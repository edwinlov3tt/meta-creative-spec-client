import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';

interface CopyableFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  className?: string;
}

export const CopyableField: React.FC<CopyableFieldProps> = ({
  label,
  value,
  multiline = false,
  className
}) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    try {
      // Try modern Clipboard API first (requires HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        showToast(`Copied ${label}`, 'success');
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for non-secure contexts (HTTP with IP address)
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            showToast(`Copied ${label}`, 'success');
            setTimeout(() => setCopied(false), 2000);
          } else {
            throw new Error('Copy command failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-12 text-text-muted font-medium">{label}</label>
      <div
        className={cn(
          'relative px-3 py-2 rounded-md transition-all cursor-pointer border border-transparent',
          'hover:bg-blue-50/50 hover:border-blue-200',
          multiline ? 'min-h-[4rem]' : 'min-h-[2.5rem]',
          copied && 'bg-green-50/50 border-green-200'
        )}
        onClick={handleCopy}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          'text-14 text-text-primary whitespace-pre-wrap break-words',
          !value && 'text-text-muted italic'
        )}>
          {value || '(empty)'}
        </div>
        {(isHovered || copied) && (
          <div className={cn(
            'absolute top-2 right-2 flex items-center gap-1 text-12',
            copied ? 'text-green-600' : 'text-blue-600'
          )}>
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
