import fs from 'fs';
import { definePDFJSModule, extractText } from 'unpdf';

// Node.js ortamı için DOM polyfills
declare global {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  var DOMMatrix: any;
  // biome-ignore lint/suspicious/noExplicitAny: <>
  var OffscreenCanvas: any;
}

if (typeof globalThis.DOMMatrix === 'undefined') {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  (globalThis as any).DOMMatrix = class DOMMatrix {
    constructor() {
      // Minimal DOMMatrix implementation
    }
  };
}

if (typeof globalThis.OffscreenCanvas === 'undefined') {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  (globalThis as any).OffscreenCanvas = class OffscreenCanvas {
    constructor() {
      // Minimal OffscreenCanvas implementation
    }
  };
}

/**
 * PDF işleme için singleton service
 * UnJS unpdf kütüphanesini kullanarak PDF'lerden text extraction yapar
 */
export class PDFService {
  private static instance: PDFService;
  private isInitialized = false;

  private constructor() {}

  /**
   * Singleton instance'ını döndürür
   */
  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  /**
   * PDF.js'i Node.js ortamı için initialize eder
   * Bu method ilk PDF işleminden önce otomatik olarak çağrılır
   */
  private async initializePDF(): Promise<void> {
    if (!this.isInitialized) {
      try {
        // Node.js ortamı için legacy build kullan ve worker'ı disable et
        await definePDFJSModule(() => import('pdfjs-dist/legacy/build/pdf.mjs'));

        this.isInitialized = true;
      } catch (error) {
        console.error('❌ Failed to initialize PDF.js:', error);
        throw new Error('PDF service initialization failed');
      }
    }
  }

  /**
   * Buffer'dan PDF text'ini extract eder
   * @param pdfBuffer - PDF dosyasının Buffer'ı
   * @param options - Extract seçenekleri
   * @returns PDF'den çıkarılan text
   */
  public async extractTextFromBuffer(
    pdfBuffer: Buffer,
    options: {
      mergePages?: boolean;
    } = {},
  ): Promise<string> {
    try {
      await this.initializePDF();

      const result =
        options.mergePages === true
          ? await extractText(new Uint8Array(pdfBuffer), { mergePages: true })
          : await extractText(new Uint8Array(pdfBuffer));

      return Array.isArray(result.text) ? result.text.join('\n') : result.text;
    } catch (error) {
      console.error('❌ PDF text extraction with unpdf failed:', error);
      return '';
    }
  }



  /**
   * URL'den PDF'i indirir ve text'ini extract eder
   * @param url - PDF dosyasının URL'i
   * @param options - Extract seçenekleri
   * @returns PDF'den çıkarılan text
   */
  public async extractTextFromUrl(
    url: string,
    options: {
      mergePages?: boolean;
    } = { mergePages: true },
  ): Promise<string> {
    try {
      const pdfBuffer = await this.downloadPdfFromUrl(url);
      return await this.extractTextFromBuffer(pdfBuffer, options);
    } catch (error) {
      console.error('❌ PDF text extraction from URL failed:', error);
      throw new Error(
        `Failed to extract text from PDF URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * File path'den PDF text'ini extract eder
   * @param filePath - PDF dosyasının path'i
   * @param options - Extract seçenekleri
   * @returns PDF'den çıkarılan text
   */
  public async extractTextFromFile(
    filePath: string,
    options: {
      mergePages?: boolean;
    } = { mergePages: true },
  ): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return await this.extractTextFromBuffer(fileBuffer, options);
    } catch (error) {
      console.error('❌ PDF text extraction from file failed:', error);
      throw new Error(
        `Failed to extract text from PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * PDF'i URL'den indirir ve Buffer olarak döndürür
   * @param url - PDF dosyasının URL'i
   * @returns PDF'in Buffer'ı
   */
  private async downloadPdfFromUrl(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('❌ PDF download failed:', error);
      throw new Error(
        `Failed to download PDF from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Service'in initialize durumunu kontrol eder
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Service'i manuel olarak initialize eder (opsiyonel)
   * Normalde ilk kullanımda otomatik initialize olur
   */
  public async initialize(): Promise<void> {
    await this.initializePDF();
  }
}

// Convenience export - singleton instance
export const pdfService = PDFService.getInstance();
