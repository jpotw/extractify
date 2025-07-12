// src/lib/extractor.ts

import type { Template, ExtractionResult } from '../types';

// Store a single worker instance to avoid re-creation.
let worker: Worker | null = null;

/**
 * @file Manages the Web Worker for the extraction process.
 */

/**
 * Initializes and runs the extraction process in a Web Worker.
 *
 * @param {File} file - The PDF file to process.
 * @param {Template[]} templates - The templates to apply for extraction.
 * @param {number} currentPageNumber - The current page number to process.
 * @param {function} onProgress - Callback function for progress updates.
 * @param {function} onSuccess - Callback function for successful extraction.
 * @param {function} onError - Callback function for errors.
 */
export function runExtractionInWorker({
  file,
  templates,
  currentPageNumber,
  onProgress,
  onSuccess,
  onError,
}: {
  file: File;
  templates: Template[];
  currentPageNumber: number;
  onProgress: (message: { status: string; progressMessage: string }) => void;
  onSuccess: (results: ExtractionResult) => void;
  onError: (error: string) => void;
}) {
  // Terminate any existing worker before starting a new one.
  if (worker) {
    worker.terminate();
  }

  // Create a new worker. The `new URL(...)` syntax is how Vite handles workers.
  worker = new Worker(new URL('../workers/extraction.worker.ts', import.meta.url), {
    type: 'module',
  });

  // Listen for messages from the worker.
  worker.onmessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    switch (type) {
      case 'progress':
        onProgress(data);
        break;
      case 'success':
        onSuccess(data);
        worker?.terminate(); // Clean up worker after success
        worker = null;
        break;
      case 'error':
        onError(data);
        worker?.terminate(); // Clean up worker after error
        worker = null;
        break;
      default:
        console.warn('Unknown message type from worker:', type);
    }
  };

  // Handle errors from the worker itself.
  worker.onerror = (event: ErrorEvent) => {
    onError(event.message);
    worker?.terminate();
    worker = null;
  };

  // Start the process by sending the file, templates and current page number to the worker.
  worker.postMessage({ file, templates, currentPageNumber });
}
