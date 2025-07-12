// src/workers/extraction.worker.ts

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import type { PDFPageProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import type { BoundingBox, Template, ExtractionResult } from '../types';

/**
 * Extracts text from a specified rectangular region on a PDF page using pdf.js's text layer.
 *
 * This function attempts to extract text by filtering text items whose bounding box overlaps
 * with the provided region. The coordinates are in PDF pixel space.
 *
 * @param page - The PDF.js page proxy object.
 * @param bbox - The bounding box (in PDF pixel coordinates) to extract text from.
 * @returns The extracted text as a string, or an empty string if nothing is found.
 */
async function extractTextFromRegion(page: PDFPageProxy, bbox: BoundingBox): Promise<string> {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });

  // Convert bbox Y coordinates from top-left to PDF.js bottom-left origin
  const pdfY1 = viewport.height - bbox.y2;
  const pdfY2 = viewport.height - bbox.y1;

  // Filter only TextItem objects that are within the bounding box
  const extractedItems = textContent.items.filter((item): item is TextItem => {
    // Type guard: only process TextItem (not TextMarkedContent)
    if (!('str' in item) || !Array.isArray(item.transform)) return false;
    const tx = item.transform[4];
    const ty = item.transform[5];
    return tx >= bbox.x1 && tx <= bbox.x2 && ty >= pdfY1 && ty <= pdfY2;
  });

  // Sort items top-to-bottom, then left-to-right for natural reading order
  extractedItems.sort((a, b) => {
    if (a.transform[5] > b.transform[5]) return -1;
    if (a.transform[5] < b.transform[5]) return 1;
    if (a.transform[4] < b.transform[4]) return -1;
    if (a.transform[4] > b.transform[4]) return 1;
    return 0;
  });

  // Concatenate all text items into a single string
  return extractedItems.map(item => item.str).join(' ').trim();
}

/**
 * Extracts text from a specified region on a PDF page using OCR (Optical Character Recognition).
 *
 * This function renders the page to an offscreen canvas, crops the region, and runs Tesseract OCR.
 *
 * @param page - The PDF.js page proxy object.
 * @param bbox - The bounding box (in PDF pixel coordinates) to extract text from.
 * @returns The recognized text as a string, or an empty string if nothing is found.
 */
async function extractWithOCR(page: PDFPageProxy, bbox: BoundingBox): Promise<string> {
  const scale = 2.0; // Use a higher scale for better OCR accuracy
  const viewport = page.getViewport({ scale });

  // Render the full page to an offscreen canvas
  const fullPageCanvas = new OffscreenCanvas(viewport.width, viewport.height);
  const fullPageContext = fullPageCanvas.getContext('2d');
  if (!fullPageContext) throw new Error('Could not get OffscreenCanvas context for full page');
  // Render the page into the canvas context
  await page.render({ canvasContext: fullPageContext as unknown as CanvasRenderingContext2D, viewport }).promise;

  // Calculate crop region in scaled pixel coordinates
  const cropWidth = (bbox.x2 - bbox.x1) * scale;
  const cropHeight = (bbox.y2 - bbox.y1) * scale;
  const cropX = bbox.x1 * scale;
  const cropY = bbox.y1 * scale;

  if (cropWidth <= 0 || cropHeight <= 0) {
    return '';
  }

  // Create a new offscreen canvas for the cropped region
  const croppedCanvas = new OffscreenCanvas(cropWidth, cropHeight);
  const croppedContext = croppedCanvas.getContext('2d');
  if (!croppedContext) throw new Error('Could not get OffscreenCanvas context for crop');

  // Draw the cropped region from the full page onto the cropped canvas
  croppedContext.drawImage(
    fullPageCanvas,
    cropX, cropY, cropWidth, cropHeight, // Source rect
    0, 0, cropWidth, cropHeight          // Destination rect
  );

  // Run OCR on the cropped canvas using Tesseract.js (supports English and Korean)
  const { data: { text } } = await Tesseract.recognize(croppedCanvas, 'eng+kor', {});

  return text.trim();
}

// --- MAIN WORKER LOGIC ---

/**
 * Main entry point for the extraction web worker.
 *
 * Handles messages from the main thread, loads the PDF, and performs extraction in two passes:
 *   1. Fast, parallel text extraction for all templates.
 *   2. Sequential OCR for templates where text extraction was insufficient.
 *
 * Posts progress and result messages back to the main thread.
 */
self.onmessage = async (event: MessageEvent<{ file: File; templates: Template[]; currentPageNumber: number }>) => {
  const { file, templates, currentPageNumber } = event.data;

  if (!file || !templates) {
    postMessage({ type: 'error', data: 'Missing file or templates.' });
    return;
  }

  try {
    // Notify main thread that PDF is loading
    postMessage({ type: 'progress', data: { status: 'pending', progressMessage: 'Loading PDF...' } });

    // Set the workerSrc for pdf.js (required for web worker usage)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

    // Load the PDF document and the requested page
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdfDoc.getPage(currentPageNumber);
    const viewport = page.getViewport({ scale: 1.0 });

    // Results object to accumulate extraction results
    const results: ExtractionResult = {};
    // Queue for templates that require OCR (populated in pass 1)
    const ocrQueue: Template[] = [];

    // --- PASS 1: Fast, parallel text-based extraction for all templates ---
    postMessage({ type: 'progress', data: { status: 'pending', progressMessage: 'Pass 1/2: Extracting text...' } });

    // For each template, attempt text extraction in parallel
    const textExtractionPromises = templates.map(async (template) => {
      // Convert ratio-based bbox to pixel coordinates
      const pixelBbox: BoundingBox = {
        x1: template.bbox.x1 * viewport.width,
        y1: template.bbox.y1 * viewport.height,
        x2: template.bbox.x2 * viewport.width,
        y2: template.bbox.y2 * viewport.height,
      };

      // Try extracting text from the region
      const text = await extractTextFromRegion(page, pixelBbox);
      if (!text || text.trim().length < 5) {
        // If text is insufficient, add to the OCR queue for pass 2
        ocrQueue.push(template);
      } else {
        // Otherwise, store the result
        results[template.name] = text.trim();
      }
    });

    // Wait for all text extraction attempts to finish
    await Promise.all(textExtractionPromises);

    // --- PASS 2: Sequential OCR for templates where text extraction failed ---
    if (ocrQueue.length > 0) {
      let ocrProcessed = 0;
      for (let i = 0; i < ocrQueue.length; i++) {
        const template: Template = ocrQueue[i];
        ocrProcessed++;
        const progressMessage = `Pass 2/2: Running OCR on "${template.name}" (${ocrProcessed}/${ocrQueue.length})...`;
        postMessage({ type: 'progress', data: { status: 'pending', progressMessage } });
        try {
          // Convert ratio-based bbox to pixel coordinates
          const pixelBbox: BoundingBox = {
            x1: template.bbox.x1 * viewport.width,
            y1: template.bbox.y1 * viewport.height,
            x2: template.bbox.x2 * viewport.width,
            y2: template.bbox.y2 * viewport.height,
          };
          // Run OCR extraction for this template
          const text = await extractWithOCR(page, pixelBbox);
          results[template.name] = text;
        } catch (error) {
          // If OCR fails, log and mark as error
          console.error(`OCR failed for zone "${template.name}":`, error);
          results[template.name] = "OCR Error";
        }
      }
    }

    // All extraction complete, post results
    postMessage({ type: 'success', data: results });

  } catch (error) {
    // Catch-all error handler for the worker
    console.error('Worker error:', error);
    postMessage({ type: 'error', data: error instanceof Error ? error.message : 'An unknown error occurred in the worker.' });
  }
};