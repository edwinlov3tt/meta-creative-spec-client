import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, Monitor, ChevronDown } from 'lucide-react';
import { PreviewControls } from './preview/PreviewControls';
import { FacebookPreview } from './preview/FacebookPreview';
import { InstagramPreview } from './preview/InstagramPreview';
import { useCreativeStore } from '@/stores/creativeStore';
import { useCreativePreviewData } from '@/hooks/useCreativePreviewData';

export const AdPreview: React.FC = () => {
  const preview = useCreativeStore(state => state.preview);
  const setPreview = useCreativeStore(state => state.setPreview);
  const setPreviewNode = useCreativeStore(state => state.setPreviewNode);

  const [showControls, setShowControls] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLDivElement | null>(null);

  const {
    platform,
    device,
    adType,
    adFormat,
    adData
  } = useCreativePreviewData();

  const handleSetPreview = (updates: Partial<typeof preview>) => {
    const normalized: Partial<typeof preview> = { ...updates };
    if (updates.adType && (updates.adType === 'story' || updates.adType === 'reel')) {
      normalized.device = 'mobile';
    }
    if (updates.device && (adType === 'story' || adType === 'reel') && updates.device !== 'mobile') {
      return; // stories/reels force mobile
    }
    setPreview(normalized);
  };

  useEffect(() => {
    if (previewCanvasRef.current) {
      setPreviewNode(previewCanvasRef.current);
    }
    return () => setPreviewNode(null);
  }, [setPreviewNode]);

  return (
    <div
      ref={previewRef}
      className="bg-white border border-border rounded-card shadow-1 flex flex-col h-auto"
    >
      <div className="p-5 border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {device === 'mobile' ? (
              <Smartphone className="w-5 h-5 text-text-muted" />
            ) : (
              <Monitor className="w-5 h-5 text-text-muted" />
            )}
            <div>
              <p className="text-12 text-text-muted uppercase tracking-wide">Preview</p>
              <span className="text-14 font-semibold text-text-primary capitalize">
                {platform} {adType} ({device})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowControls(prev => !prev)}
            className="inline-flex items-center gap-1 text-12 font-medium text-text-muted hover:text-text-primary ml-auto"
          >
            <span>Settings</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showControls ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showControls && (
          <div className="mt-4">
            <PreviewControls
              platform={platform}
              setPlatform={(value) => handleSetPreview({ platform: value })}
              device={device}
              setDevice={(value) => handleSetPreview({ device: value })}
              adType={adType}
              setAdType={(value) => handleSetPreview({ adType: value })}
              adFormat={adFormat}
              setAdFormat={(value) => handleSetPreview({ adFormat: value })}
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-canvas p-5">
        <div
          ref={previewCanvasRef}
          className={`mx-auto ${
            device === 'mobile' ? 'max-w-sm' : 'max-w-md'
          } ${
            adType === 'story' || adType === 'reel' ? 'aspect-story' : ''
          }`}
        >
          {platform === 'facebook' ? (
            <FacebookPreview
              device={device}
              adType={adType}
              adFormat={adFormat}
              adData={adData}
            />
          ) : (
            <InstagramPreview
              device={device}
              adType={adType}
              adFormat={adFormat}
              adData={adData}
            />
          )}
        </div>
      </div>
    </div>
  );
};
