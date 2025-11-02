import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Check, Loader2, AlertCircle, ExternalLink, Upload, X, Folder } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { showToast } from '@/stores/toastStore';
import { parseCreativeSets } from '@/utils/zipParser';
import type { DetectedCreativeSet } from '@/utils/zipParser';
import { API_BASE_URL } from '@/services/api';

interface Ad {
  id: number;
  short_id: string;
  ad_name: string;
  brief: {
    creativeFile?: {
      url?: string;
      data?: string;
      type: string;
    };
    creativeFiles?: {
      square?: {
        url?: string;
        data?: string;
        type: string;
      };
      vertical?: {
        url?: string;
        data?: string;
        type: string;
      };
    };
  };
  creative_file: {
    url?: string;
    data?: string;
    type: string;
  } | null;
  preview_settings: {
    platform: 'facebook' | 'instagram';
  };
}

export const CreateCampaignPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    campaign_objective: '',
    start_date: '',
    end_date: ''
  });

  const [selectedAdIds, setSelectedAdIds] = useState<number[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedSets, setUploadedSets] = useState<DetectedCreativeSet[]>([]);
  const [isParsingZip, setIsParsingZip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch advertiser's ads
  useEffect(() => {
    const fetchAds = async () => {
      if (!identifier) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/advertiser/${identifier}`);

        if (!response.ok) {
          throw new Error('Failed to fetch ads');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch ads');
        }

        setAds(result.data.ads || []);
      } catch (err) {
        console.error('[CreateCampaignPage] Error fetching ads:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ads');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [identifier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Campaign name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Create campaign
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${identifier}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ad_ids: selectedAdIds
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign');
      }

      const createdCampaign = result.data.campaign;

      // Step 2: If there are uploaded zip sets, create ads via bulk-create-ads
      if (uploadedSets.length > 0) {
        // Upload images to R2 first
        const uploadToR2 = async (file: File): Promise<string | null> => {
          try {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            const uploadResponse = await fetch(`${API_BASE_URL}/api/upload-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: base64,
                filename: file.name,
                contentType: file.type
              })
            });

            if (!uploadResponse.ok) return null;
            const data = await uploadResponse.json();
            return data.success ? data.url : null;
          } catch (error) {
            console.error('[CreateCampaignPage] R2 upload failed:', error);
            return null;
          }
        };

        // Prepare ads array with R2 URLs
        const ads = [];
        for (const set of uploadedSets) {
          const adData: any = {
            setName: set.name,
            creativeFiles: {}
          };

          if (set.square) {
            const squareUrl = await uploadToR2(set.square);
            if (squareUrl) {
              adData.creativeFiles.square = {
                url: squareUrl,
                name: set.square.name,
                type: set.square.type
              };
            }
          }

          if (set.vertical) {
            const verticalUrl = await uploadToR2(set.vertical);
            if (verticalUrl) {
              adData.creativeFiles.vertical = {
                url: verticalUrl,
                name: set.vertical.name,
                type: set.vertical.type
              };
            }
          }

          ads.push(adData);
        }

        // Call bulk-create-ads API
        const bulkResponse = await fetch(`${API_BASE_URL}/api/campaigns/bulk-create-ads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            advertiserIdentifier: identifier,
            campaignId: createdCampaign.id,
            ads,
            brief: {
              campaignObjective: formData.campaign_objective
            }
          })
        });

        const bulkResult = await bulkResponse.json();

        if (!bulkResult.success) {
          console.error('[CreateCampaignPage] Failed to create ads from zip:', bulkResult.error);
          showToast('Campaign created, but some ads failed to upload', 'warning');
        } else {
          const totalAds = selectedAdIds.length + uploadedSets.length;
          showToast(`Campaign created with ${totalAds} ads`, 'success');
        }
      } else {
        showToast('Campaign created successfully', 'success');
      }

      navigate(`/advertiser/${identifier}/campaign/${createdCampaign.short_id}`);
    } catch (err) {
      console.error('[CreateCampaignPage] Error creating campaign:', err);
      showToast(err instanceof Error ? err.message : 'Failed to create campaign', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAdSelection = (adId: number) => {
    setSelectedAdIds(prev =>
      prev.includes(adId)
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    );
  };

  // Helper: Get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${file.name}`));
      };

      img.src = url;
    });
  };

  // Helper: Classify aspect ratio
  const classifyAspectRatio = (width: number, height: number): '1:1' | '9:16' | 'other' => {
    const aspectRatio = width / height;

    // 1:1 aspect ratio (with tolerance)
    if (Math.abs(aspectRatio - 1) < 0.1) {
      return '1:1';
    }

    // 9:16 aspect ratio (0.5625 with tolerance)
    if (Math.abs(aspectRatio - 0.5625) < 0.1) {
      return '9:16';
    }

    return 'other';
  };

  // Handle file uploads (individual images, multiple files, or ZIP)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('[File Upload] No files selected');
      return;
    }

    console.log('[File Upload] Files selected:', files.length);
    await processFiles(Array.from(files));

    // Reset file input
    event.target.value = '';
  };

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    try {
      setIsParsingZip(true);

      // Check if there's a ZIP file
      const zipFile = files.find(f => f.name.endsWith('.zip'));

      if (zipFile) {
        console.log('[File Upload] Processing ZIP file:', zipFile.name);

        // Parse zip file for creative sets
        const sets = await parseCreativeSets(zipFile);

        console.log('[File Upload] ZIP parsing complete. Sets found:', sets.length);

        if (sets.length === 0) {
          showToast('No valid creative sets found in ZIP file. Make sure images are organized in folders with 1:1 (square) or 9:16 (vertical) aspect ratios.', 'warning');
          return;
        }

        setUploadedSets(prev => [...prev, ...sets]);
        showToast(`${sets.length} creative set${sets.length > 1 ? 's' : ''} added from ZIP`, 'success');
      } else {
        // Process individual image files
        console.log('[File Upload] Processing individual image files:', files.length);

        const imageFiles = files.filter(f =>
          /\.(png|jpe?g|webp)$/i.test(f.name)
        );

        if (imageFiles.length === 0) {
          showToast('No valid image files found. Please upload PNG, JPG, or WebP images.', 'warning');
          return;
        }

        // Process each image and detect aspect ratio
        const newSets: DetectedCreativeSet[] = [];

        for (const file of imageFiles) {
          try {
            const { width, height } = await getImageDimensions(file);
            const aspectRatio = classifyAspectRatio(width, height);

            if (aspectRatio === 'other') {
              console.warn(`[File Upload] Skipping ${file.name} - unsupported aspect ratio`);
              continue;
            }

            // Create a set for this image
            const setName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
            const newSet: DetectedCreativeSet = { name: setName };

            if (aspectRatio === '1:1') {
              newSet.square = file;
            } else if (aspectRatio === '9:16') {
              newSet.vertical = file;
            }

            newSets.push(newSet);
          } catch (error) {
            console.error(`[File Upload] Failed to process ${file.name}:`, error);
          }
        }

        if (newSets.length === 0) {
          showToast('No valid creative sets found. Images must be 1:1 (square) or 9:16 (vertical) aspect ratio.', 'warning');
          return;
        }

        setUploadedSets(prev => [...prev, ...newSets]);
        showToast(`${newSets.length} creative${newSets.length > 1 ? 's' : ''} added`, 'success');
      }
    } catch (error) {
      console.error('[File Upload] Failed to process files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to process files: ${errorMessage}`, 'error');
    } finally {
      setIsParsingZip(false);
    }
  };

  const removeUploadedSet = (setName: string) => {
    setUploadedSets(prev => prev.filter(set => set.name !== setName));
  };

  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-meta-blue animate-spin mx-auto mb-4" />
          <p className="text-16 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-24 font-semibold text-text-primary mb-2">Error</h2>
          <p className="text-14 text-text-secondary mb-6">{error}</p>
          <Button onClick={() => navigate(`/advertiser/${identifier}`)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            to={`/advertiser/${identifier}`}
            className="inline-flex items-center gap-2 text-14 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Advertiser
          </Link>
          <h1 className="text-24 font-bold text-text-primary">Create Campaign</h1>
          <p className="text-14 text-text-secondary mt-1">
            Group multiple ads together with shared objectives and dates
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Campaign Details */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-18 font-semibold text-text-primary mb-4">Campaign Details</h2>

            <div className="space-y-4">
              {/* Campaign Name */}
              <div className="space-y-2">
                <label className="text-12 text-text-muted font-medium">
                  Campaign Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fall 2025 Promotion"
                  className="form-input"
                  required
                />
              </div>

              {/* Campaign Objective */}
              <div className="space-y-2">
                <label className="text-12 text-text-muted font-medium">Campaign Objective</label>
                <textarea
                  value={formData.campaign_objective}
                  onChange={(e) => setFormData({ ...formData, campaign_objective: e.target.value })}
                  placeholder="Describe the goal of this campaign..."
                  className="form-textarea h-24"
                />
                <p className="text-11 text-text-muted">
                  This objective will be inherited by ads that don't have their own objective
                </p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Upload Ad Sets (Optional) */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-18 font-semibold text-text-primary mb-2">Upload Creatives (Optional)</h2>
            <p className="text-14 text-text-secondary mb-4">
              Upload individual images, multiple files, or a ZIP file to create draft ads
            </p>

            {/* Upload Button/Zone */}
            <div className="space-y-4">
              <label
                className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all ${
                  isDragging
                    ? 'border-meta-blue bg-blue-50'
                    : 'border-border hover:border-meta-blue hover:bg-blue-50'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".zip,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isParsingZip}
                  className="hidden"
                />
                <Upload className={`w-10 h-10 mb-3 ${isParsingZip || isDragging ? 'text-meta-blue' : 'text-text-muted'}`} />
                <p className="text-14 font-medium text-text-primary mb-1">
                  {isParsingZip ? 'Processing files...' : isDragging ? 'Drop files here' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-12 text-text-muted">
                  Supports individual images (1:1 or 9:16), multiple files, or ZIP files with organized folders
                </p>
              </label>

              {/* Detected Sets List */}
              {uploadedSets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-13 font-medium text-text-primary">
                    Detected Sets ({uploadedSets.length})
                  </p>
                  <div className="space-y-2">
                    {uploadedSets.map((set) => (
                      <div
                        key={set.name}
                        className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Folder className="w-5 h-5 text-meta-blue flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-13 font-medium text-text-primary truncate">
                              {set.name}
                            </p>
                            <div className="flex items-center gap-3 text-11 text-text-muted">
                              {set.square && <span>✓ 1:1 Square</span>}
                              {set.vertical && <span>✓ 9:16 Vertical</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedSet(set.name)}
                          className="ml-3 p-1 text-text-muted hover:text-danger transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Select Ads */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-18 font-semibold text-text-primary mb-2">Select Existing Ads (Optional)</h2>
            <p className="text-14 text-text-secondary mb-4">
              Choose existing ads to include in this campaign ({selectedAdIds.length} selected)
            </p>

            {ads.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <p className="text-14">No ads available. Create some ads first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {ads.map((ad) => {
                  const isSelected = selectedAdIds.includes(ad.id);

                  // Get image URL - prefer R2 URL over base64
                  let imageUrl = '';
                  if (ad.brief?.creativeFiles?.square?.url) {
                    imageUrl = ad.brief.creativeFiles.square.url;
                  } else if (ad.brief?.creativeFile?.url) {
                    imageUrl = ad.brief.creativeFile.url;
                  }
                  // Intentionally skip base64 data to avoid 431 errors

                  return (
                    <div
                      key={ad.id}
                      className={`relative border-2 rounded-lg p-3 transition-all ${
                        isSelected
                          ? 'border-meta-blue bg-blue-50'
                          : 'border-border hover:border-surface-300'
                      }`}
                    >
                      {/* Selection Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => toggleAdSelection(ad.id)}
                        className="absolute top-2 right-2 z-10"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-meta-blue border-meta-blue'
                            : 'bg-white border-surface-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>

                      {/* Ad Preview Image - Clickable to select */}
                      <button
                        type="button"
                        onClick={() => toggleAdSelection(ad.id)}
                        className="w-full mb-2"
                      >
                        {imageUrl ? (
                          <div className="w-full aspect-square bg-surface-100 rounded-md overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={ad.ad_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full aspect-square bg-surface-100 rounded-md flex items-center justify-center">
                            <span className="text-11 text-text-muted">No Image</span>
                          </div>
                        )}
                      </button>

                      {/* Ad Info */}
                      <button
                        type="button"
                        onClick={() => toggleAdSelection(ad.id)}
                        className="w-full text-left pr-6 mb-2"
                      >
                        <p className="text-13 font-medium text-text-primary leading-tight line-clamp-2">
                          {ad.ad_name || 'Untitled Ad'}
                        </p>
                      </button>

                      {/* Platform and Preview Link */}
                      <div className="flex items-center gap-2 text-10">
                        <span className="text-text-muted capitalize">
                          {ad.preview_settings.platform}
                        </span>
                        <span className="text-text-muted">•</span>
                        <a
                          href={`/preview/${identifier}/ad/${ad.short_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-meta-blue hover:underline"
                        >
                          Preview
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              onClick={() => navigate(`/advertiser/${identifier}`)}
              variant="outline"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="meta"
              disabled={submitting || !formData.name.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
