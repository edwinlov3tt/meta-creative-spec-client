import ExcelJS from 'exceljs';
import type { SpecExport } from '@/types/creative';
import {
  CREATIVE_SPEC_FIELD_MAPPING,
  EXCEL_SHEET_NAME,
  ExportErrorException
} from '@/types/export';

export class ExcelExportService {
  private templatePath = '/templates/meta-creative-spec-sheet.xlsx';

  /**
   * Load the Excel template file
   */
  private async loadTemplate(): Promise<ExcelJS.Workbook> {
    try {
      console.log('Loading Excel template from:', this.templatePath);
      const response = await fetch(this.templatePath);

      if (!response.ok) {
        console.error('Template fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
      }

      console.log('Template fetched, loading into ExcelJS...');
      const arrayBuffer = await response.arrayBuffer();
      console.log('ArrayBuffer size:', arrayBuffer.byteLength);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      console.log('Excel template loaded successfully');
      return workbook;
    } catch (error) {
      console.error('Template load error details:', error);
      throw new ExportErrorException({
        code: 'TEMPLATE_LOAD_ERROR',
        message: 'Failed to load Excel template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Map creative spec data to cell values
   */
  private mapSpecData(spec: SpecExport, facebookUrl?: string): Record<string, string> {
    return {
      [CREATIVE_SPEC_FIELD_MAPPING.adName]: spec.refName || spec.adName || 'Untitled Ad',
      [CREATIVE_SPEC_FIELD_MAPPING.postText]: spec.postText || '',
      [CREATIVE_SPEC_FIELD_MAPPING.imageName]: spec.imageName || 'creative-image',
      [CREATIVE_SPEC_FIELD_MAPPING.facebookPageUrl]: facebookUrl || spec.facebookPageUrl || '',
      [CREATIVE_SPEC_FIELD_MAPPING.headline]: spec.headline || '',
      [CREATIVE_SPEC_FIELD_MAPPING.linkDescription]: spec.description || '',
      [CREATIVE_SPEC_FIELD_MAPPING.destinationUrl]: spec.destinationUrl || '',
      [CREATIVE_SPEC_FIELD_MAPPING.displayLink]: spec.displayLink || '',
      [CREATIVE_SPEC_FIELD_MAPPING.callToAction]: spec.cta || ''
    };
  }

  /**
   * Apply data to worksheet cells (supports both single cells and merged ranges)
   */
  private applyDataToSheet(worksheet: ExcelJS.Worksheet, dataMapping: Record<string, string>): void {
    Object.entries(dataMapping).forEach(([cellRef, value]) => {
      if (!value) return; // Skip empty values

      // Handle merged cell ranges (e.g., "D26:H26")
      if (cellRef.includes(':')) {
        const [startCell] = cellRef.split(':');
        const cell = worksheet.getCell(startCell);
        if (cell) {
          cell.value = value;
        }
      } else {
        // Handle single cell
        const cell = worksheet.getCell(cellRef);
        if (cell) {
          cell.value = value;
        }
      }
    });
  }

  /**
   * Generate populated Excel file
   * Returns ArrayBuffer (compatible with Blob constructor in browser)
   */
  async generateExcel(spec: SpecExport, facebookUrl?: string): Promise<ArrayBuffer> {
    try {
      console.log('Starting Excel generation...');

      // Load template
      const workbook = await this.loadTemplate();

      // Get the spec sheet (try multiple possible names)
      console.log('Looking for worksheet:', EXCEL_SHEET_NAME);
      let specSheet = workbook.getWorksheet(EXCEL_SHEET_NAME);

      // If not found, try the first sheet
      if (!specSheet) {
        console.log('Sheet not found by name, trying first worksheet...');
        specSheet = workbook.worksheets[0];
        console.log('First worksheet name:', specSheet?.name);
      }

      if (!specSheet) {
        throw new Error('Could not find worksheet in template');
      }

      console.log('Mapping spec data to cells...');
      // Map and apply data
      const specData = this.mapSpecData(spec, facebookUrl);
      console.log('Spec data mapped:', Object.keys(specData));

      this.applyDataToSheet(specSheet, specData);
      console.log('Data applied to worksheet');

      // Generate Excel buffer
      console.log('Generating Excel buffer...');
      const buffer = await workbook.xlsx.writeBuffer();
      console.log('Excel buffer generated, size:', buffer.byteLength);

      // Return ArrayBuffer directly (Buffer doesn't exist in browser)
      return buffer;

    } catch (error) {
      console.error('Excel generation error:', error);

      if (error instanceof ExportErrorException) {
        throw error;
      }

      throw new ExportErrorException({
        code: 'EXCEL_GENERATION_ERROR',
        message: 'Failed to generate Excel file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate filename for export
   */
  generateFilename(adName: string, includeTimestamp = true): string {
    const sanitizedName = adName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = includeTimestamp ? `_${Date.now()}` : '';
    return `Meta_Creative_Spec_Sheet_${sanitizedName}${timestamp}.xlsx`;
  }
}
