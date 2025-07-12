// src/workers/extraction.worker.ts

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import type { PDFPageProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import type { BoundingBox, Template, ExtractionResult } from '../types';

/**
 * Extracts text from a specified region using pdf.js's text layer.
 */
async function extractTextFromRegion(page: PDFPageProxy, bbox: BoundingBox): Promise<string> {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });

  const pdfY1 = viewport.height - bbox.y2;
  const pdfY2 = viewport.height - bbox.y1;

  const extractedItems = textContent.items.filter((item) => {
    if (!('str' in item)) return false;
    const tx = item.transform[4];
    const ty = item.transform[5];
    return tx >= bbox.x1 && tx <= bbox.x2 && ty >= pdfY1 && ty <= pdfY2;
  });

  extractedItems.sort((a, b) => {
    if (a.transform[5] > b.transform[5]) return -1;
    if (a.transform[5] < b.transform[5]) return 1;
    if (a.transform[4] < b.transform[4]) return -1;
    if (a.transform[4] > b.transform[4]) return 1;
    return 0;
  });

  return extractedItems.map(item => (item as TextItem).str).join(' ').trim();
}

/**
 * Extracts text from a region using OCR, precisely cropping the image.
 */
async function extractWithOCR(page: PDFPageProxy, bbox: BoundingBox): Promise<string> {
  const scale = 2.0;
  const viewport = page.getViewport({ scale });

  const fullPageCanvas = new OffscreenCanvas(viewport.width, viewport.height);
  const fullPageContext = fullPageCanvas.getContext('2d');
  if (!fullPageContext) throw new Error('Could not get OffscreenCanvas context for full page');
  await page.render({ canvasContext: fullPageContext, viewport }).promise;

  const cropWidth = (bbox.x2 - bbox.x1) * scale;
  const cropHeight = (bbox.y2 - bbox.y1) * scale;
  const cropX = bbox.x1 * scale;
  const cropY = bbox.y1 * scale;

  if (cropWidth <= 0 || cropHeight <= 0) {
      return '';
  }

  const croppedCanvas = new OffscreenCanvas(cropWidth, cropHeight);
  const croppedContext = croppedCanvas.getContext('2d');
  if (!croppedContext) throw new Error('Could not get OffscreenCanvas context for crop');
  
  croppedContext.drawImage(
    fullPageCanvas,
    cropX, cropY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );

  const { data: { text } } = await Tesseract.recognize(croppedCanvas, 'eng+kor', {});

  return text.trim();
}

// --- MAIN WORKER LOGIC ---

self.onmessage = async (event: MessageEvent) => {
  const { file, templates, currentPageNumber } = event.data;

  if (!file || !templates) {
    postMessage({ type: 'error', data: 'Missing file or templates.' });
    return;
  }

  try {
    postMessage({ type: 'progress', data: { status: 'pending', progressMessage: 'Loading PDF...' } });
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdfDoc.getPage(currentPageNumber);
    const viewport = page.getViewport({ scale: 1.0 });

    const results: ExtractionResult = {};
    let templatesProcessed = 0;
    
    for (const template of templates) {
      templatesProcessed++;
      const progressMessage = `Processing zone "${template.name}" (${templatesProcessed}/${templates.length})...`;
      postMessage({ type: 'progress', data: { status: 'pending', progressMessage } });

      try {
        // Convert ratio coordinates to pixel coordinates
        const pixelBbox: BoundingBox = {
          x1: template.bbox.x1 * viewport.width,
          y1: template.bbox.y1 * viewport.height,
          x2: template.bbox.x2 * viewport.width,
          y2: template.bbox.y2 * viewport.height,
        };

        // Try normal text extraction first with pixel coordinates
        let text = await extractTextFromRegion(page, pixelBbox);

        // If text is too short, try OCR with pixel coordinates
        if (!text || text.trim().length < 5) {
          postMessage({ type: 'progress', data: { status: 'pending', progressMessage: `Running OCR on "${template.name}"...` } });
          text = await extractWithOCR(page, pixelBbox);
        }
        
        results[template.name] = text.trim();
      } catch (error) {
        console.error(`Failed to process zone "${template.name}":`, error);
        results[template.name] = "Extraction Error";
      }
    }

    postMessage({ type: 'success', data: results });
  } catch (error) {
    console.error('Worker error:', error);
    postMessage({ type: 'error', data: error instanceof Error ? error.message : 'An unknown error occurred in the worker.' });
  }
};