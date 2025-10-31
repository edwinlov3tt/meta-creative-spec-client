import JSZip from 'jszip';

export interface DetectedCreativeSet {
  name: string;
  square?: File;
  vertical?: File;
}

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions from a File object
 */
const getImageDimensions = (file: File): Promise<ImageDimensions> => {
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

/**
 * Determine if an image is 1:1 (square) or 9:16 (vertical/story)
 */
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

/**
 * Extract folder name from file path
 * Examples:
 *   "Social Set A/image.png" -> "Social Set A"
 *   "Main/Social/Social Set A/image.png" -> "Social Set A"
 */
const extractSetName = (filePath: string): string | null => {
  const parts = filePath.split('/').filter(Boolean);

  // Remove filename
  parts.pop();

  if (parts.length === 0) {
    return null; // File is in root, not in a folder
  }

  // Check if path contains "Social" folder (exact match, case insensitive)
  const socialIndex = parts.findIndex(part =>
    part.toLowerCase() === 'social'
  );

  if (socialIndex !== -1 && socialIndex < parts.length - 1) {
    // Return the folder after "Social"
    return parts[socialIndex + 1];
  }

  // If no "Social" folder found, return the last folder
  return parts[parts.length - 1];
};

/**
 * Check if a folder name should be ignored (e.g., "Banner", "Banners")
 */
const shouldIgnoreFolder = (folderName: string): boolean => {
  const lower = folderName.toLowerCase();
  return lower.includes('banner');
};

/**
 * Parse a zip file and detect creative sets organized in folders
 * @param zipFile - The zip file to parse
 * @returns Array of detected creative sets with their images
 */
export const parseCreativeSets = async (zipFile: File): Promise<DetectedCreativeSet[]> => {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipFile);

  // Map to store sets by folder name
  const setsMap = new Map<string, DetectedCreativeSet>();

  // Process each file in the zip
  for (const [filename, zipEntry] of Object.entries(contents.files)) {
    // Skip directories and non-image files
    if (zipEntry.dir || !/\.(png|jpe?g|webp)$/i.test(filename)) {
      continue;
    }

    // Skip Mac OS metadata files (.__MACOSX folder and ._ files)
    if (filename.includes('__MACOSX') || filename.split('/').pop()?.startsWith('._')) {
      continue;
    }

    // Extract set name from folder structure
    const setName = extractSetName(filename);

    if (!setName) {
      continue; // Skip files in root
    }

    // Ignore banner folders
    if (shouldIgnoreFolder(setName)) {
      continue;
    }

    // Get the file extension
    const ext = filename.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    // Convert to File object
    const blob = await zipEntry.async('blob');
    const file = new File([blob], filename.split('/').pop() || filename, {
      type: mimeType
    });

    // Get image dimensions
    try {
      const { width, height } = await getImageDimensions(file);
      const aspectRatio = classifyAspectRatio(width, height);

      // Only process 1:1 and 9:16 images
      if (aspectRatio === 'other') {
        continue;
      }

      // Get or create set entry
      if (!setsMap.has(setName)) {
        setsMap.set(setName, { name: setName });
      }

      const set = setsMap.get(setName)!;

      // Assign to appropriate aspect ratio (prefer first found)
      if (aspectRatio === '1:1' && !set.square) {
        set.square = file;
      } else if (aspectRatio === '9:16' && !set.vertical) {
        set.vertical = file;
      }
    } catch (error) {
      console.warn(`Failed to process image ${filename}:`, error);
      continue;
    }
  }

  // Convert map to array and sort by set name
  const sets = Array.from(setsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return sets;
};

/**
 * Check if the current form has all required fields filled
 */
export const canUseCampaignWorkflow = (storeState: {
  facebook: { verificationStatus?: string };
  brief: {
    websiteUrl: string;
    companyOverview: string;
    campaignObjective: string;
  };
}): boolean => {
  const { facebook, brief } = storeState;

  return (
    facebook.verificationStatus === 'success' &&
    Boolean(brief.websiteUrl) &&
    Boolean(brief.companyOverview) &&
    Boolean(brief.campaignObjective)
  );
};
