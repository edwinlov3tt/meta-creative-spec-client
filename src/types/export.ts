// Export-specific type definitions for Creative Spec

export interface ExportProgress {
  stage: 'initializing' | 'processing_data' | 'generating_excel' | 'creating_zip' | 'complete';
  progress: number;
  message: string;
}

export interface ExportError {
  code: 'TEMPLATE_LOAD_ERROR' | 'DATA_MAPPING_ERROR' | 'EXCEL_GENERATION_ERROR' | 'ZIP_CREATION_ERROR' | 'DOWNLOAD_ERROR';
  message: string;
  details?: string;
}

export class ExportErrorException extends Error {
  public readonly code: ExportError['code'];
  public readonly details?: string;

  constructor(error: ExportError) {
    super(error.message);
    this.name = 'ExportErrorException';
    this.code = error.code;
    this.details = error.details;
  }
}

export interface ExportOptions {
  includeJson: boolean;
  filename?: string;
  timestamp?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: ExportError;
}

// Cell mapping constants for Excel export
// Based on "Meta - Single Image - Spec Sheet.xlsx" template
export const CREATIVE_SPEC_FIELD_MAPPING = {
  adName: 'D26:H26',           // Name of Ad (merged cell)
  postText: 'D27:H29',          // Post Text (merged cell)
  imageName: 'D30',             // Name of Image
  facebookPageUrl: 'D32:H32',   // URL of Facebook Page (merged cell)
  headline: 'D34',              // Headline
  linkDescription: 'D35',       // Newsfeed Link Description
  destinationUrl: 'D36',        // Website Destination URL
  displayLink: 'D37',           // Display link
  callToAction: 'D38'           // Call To Action
} as const;

// Sheet name in the template
export const EXCEL_SHEET_NAME = 'Spec Sheet' as const;
