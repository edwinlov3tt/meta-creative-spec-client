/**
 * Load creative files from URL parameters or sessionStorage
 * This is used for the Quick Create workflow where new tabs are opened with pre-filled data
 *
 * Priority:
 * 1. R2 URLs from sessionStorage (primary)
 * 2. Base64 from sessionStorage (fallback)
 * 3. Legacy URL params (backwards compatibility)
 */
export const loadCreativeFromURLParams = async (): Promise<{
  setName: string | null;
  square: File | null;
  vertical: File | null;
} | null> => {
  const params = new URLSearchParams(window.location.search);

  // Check if we have a creativeId (new sessionStorage approach)
  const creativeId = params.get('creativeId');

  if (creativeId) {
    try {
      const storedData = sessionStorage.getItem(creativeId);

      if (!storedData) {
        console.warn('No creative data found in sessionStorage for ID:', creativeId);
        return null;
      }

      const creativeData = JSON.parse(storedData);
      const {
        setName,
        squareUrl,
        squareName,
        verticalUrl,
        verticalName,
        square: squareBase64,
        vertical: verticalBase64
      } = creativeData;

      let square: File | null = null;
      let vertical: File | null = null;

      // Primary: Load from R2 URLs
      if (squareUrl && squareName) {
        try {
          console.log('[Quick Create] Loading square from R2:', squareUrl);
          const response = await fetch(squareUrl);
          if (response.ok) {
            const blob = await response.blob();
            square = new File([blob], squareName, { type: blob.type || 'image/png' });
          } else {
            console.error('Failed to fetch square from R2:', response.status);
          }
        } catch (error) {
          console.error('Failed to load square creative from R2:', error);
        }
      }
      // Fallback: Load from base64 if R2 failed
      else if (squareBase64 && squareName) {
        try {
          console.log('[Quick Create] Loading square from base64 (fallback)');
          const blob = await fetch(squareBase64).then(res => res.blob());
          square = new File([blob], squareName, { type: blob.type || 'image/png' });
        } catch (error) {
          console.error('Failed to load square creative from base64:', error);
        }
      }

      // Primary: Load from R2 URLs
      if (verticalUrl && verticalName) {
        try {
          console.log('[Quick Create] Loading vertical from R2:', verticalUrl);
          const response = await fetch(verticalUrl);
          if (response.ok) {
            const blob = await response.blob();
            vertical = new File([blob], verticalName, { type: blob.type || 'image/png' });
          } else {
            console.error('Failed to fetch vertical from R2:', response.status);
          }
        } catch (error) {
          console.error('Failed to load vertical creative from R2:', error);
        }
      }
      // Fallback: Load from base64 if R2 failed
      else if (verticalBase64 && verticalName) {
        try {
          console.log('[Quick Create] Loading vertical from base64 (fallback)');
          const blob = await fetch(verticalBase64).then(res => res.blob());
          vertical = new File([blob], verticalName, { type: blob.type || 'image/png' });
        } catch (error) {
          console.error('Failed to load vertical creative from base64:', error);
        }
      }

      // Clean up sessionStorage after loading
      sessionStorage.removeItem(creativeId);

      return {
        setName: setName || null,
        square,
        vertical
      };
    } catch (error) {
      console.error('Failed to parse creative data from sessionStorage:', error);
      return null;
    }
  }

  // Fall back to legacy URL params approach
  const setName = params.get('setName');
  const squareBase64 = params.get('square');
  const squareName = params.get('squareName');
  const verticalBase64 = params.get('vertical');
  const verticalName = params.get('verticalName');

  // If no creative params, return null
  if (!squareBase64 && !verticalBase64) {
    return null;
  }

  let square: File | null = null;
  let vertical: File | null = null;

  // Convert square base64 to File
  if (squareBase64 && squareName) {
    try {
      const blob = await fetch(squareBase64).then(res => res.blob());
      square = new File([blob], squareName, { type: blob.type });
    } catch (error) {
      console.error('Failed to load square creative from URL:', error);
    }
  }

  // Convert vertical base64 to File
  if (verticalBase64 && verticalName) {
    try {
      const blob = await fetch(verticalBase64).then(res => res.blob());
      vertical = new File([blob], verticalName, { type: blob.type });
    } catch (error) {
      console.error('Failed to load vertical creative from URL:', error);
    }
  }

  return {
    setName,
    square,
    vertical
  };
};

/**
 * Clear URL parameters after loading
 * This prevents the params from being re-processed on page refresh
 */
export const clearURLParams = () => {
  if (window.location.search) {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
  }
};
