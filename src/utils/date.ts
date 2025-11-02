/**
 * Format a date string to "mmm dd, yyyy" format (e.g., "Nov 11, 2025")
 * Handles timezone shifts properly for date-only inputs (YYYY-MM-DD)
 *
 * @param dateString - Date string in YYYY-MM-DD format or any valid date string
 * @returns Formatted date string or original if invalid
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';

  try {
    let date: Date;

    // If the date is in YYYY-MM-DD format (common from date inputs),
    // parse it in local timezone to avoid UTC midnight shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // Month is 0-indexed in JavaScript Date
      date = new Date(year, month - 1, day);
    } else {
      // For other formats, use standard parsing
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.warn('Failed to format date:', dateString, error);
    return dateString;
  }
};

/**
 * Parse a date string safely in local timezone
 * Prevents UTC midnight timezone shift for YYYY-MM-DD dates
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export const parseLocalDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  try {
    // For YYYY-MM-DD format, parse in local timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // For other formats, use standard parsing
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
};
