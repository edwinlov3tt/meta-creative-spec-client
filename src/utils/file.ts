// Normalize MIME type to match Claude API requirements
const normalizeMimeType = (type: string): string => {
  const normalized = type.toLowerCase().trim();
  // Convert image/jpg to image/jpeg (Claude doesn't accept image/jpg)
  if (normalized === 'image/jpg') return 'image/jpeg';
  // Ensure it's one of the accepted types
  if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(normalized)) {
    return normalized;
  }
  // Default to jpeg for unknown types
  console.warn(`Unknown image type "${type}", defaulting to image/jpeg`);
  return 'image/jpeg';
};

// Clean base64 data - remove data URL prefix, whitespace, and newlines
const cleanBase64 = (data: string): string => {
  let cleaned = data.trim();

  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    cleaned = parts[parts.length - 1];
  }

  // Remove any whitespace, newlines, or invalid characters
  cleaned = cleaned.replace(/\s/g, '');

  return cleaned;
};

export const fileToBase64 = (file: File): Promise<{ type: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;

        if (!result) {
          reject(new Error('Failed to read file: empty result'));
          return;
        }

        // Clean the base64 data
        const cleanedData = cleanBase64(result);

        if (!cleanedData) {
          reject(new Error('Failed to extract base64 data from file'));
          return;
        }

        // Normalize MIME type
        const normalizedType = normalizeMimeType(file.type);

        resolve({
          type: normalizedType,
          data: cleanedData
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
