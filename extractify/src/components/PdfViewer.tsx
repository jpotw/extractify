// src/components/PdfViewer.tsx

import React, { useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdfStore } from '../store/pdfStore';

// The workerSrc path is now correctly configured to use a stable CDN version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

/**
 * @file Renders the main PDF viewing area, driven by global state.
 * @component
 *
 * @description
 * This component subscribes to the `usePdfStore`. When a new PDF file is set
 * in the store, this component automatically loads, parses, and renders the
 * first page of that document onto the canvas. It handles the entire
 * lifecycle of PDF rendering.
 *
 * @returns {JSX.Element} The rendered PDF Viewer component.
 */
const PdfViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { file, setPdfDocument, pdfDocument, currentPageNumber } = usePdfStore();

  useEffect(() => {
    /**
     * Asynchronously loads and renders a specific page of the active PDF document.
     */
    const renderPdf = async () => {
      // Guard clauses to ensure all required elements and data are present.
      if (!canvasRef.current) {
        console.error('Canvas element not found!');
        return;
      }

      if (!file) {
        // If no file is selected, clear the canvas.
        const context = canvasRef.current.getContext('2d');
        context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Could not get canvas context!');
        return;
      }

      try {
        // Load the document only if it hasn't been loaded yet for this file.
        let pdf = pdfDocument;
        if (!pdf) {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument(arrayBuffer);
          pdf = await loadingTask.promise;
          setPdfDocument(pdf); // Save the parsed document to the store.
        }

        // Get the specified page.
        const page = await pdf.getPage(currentPageNumber);
        const viewport = page.getViewport({ scale: 1.5 });

        // Set canvas dimensions to match the PDF page size.
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the PDF page into the canvas context.
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering PDF:', error);
        // Optionally, clear the file from the store on error.
        // setFile(null);
      }
    };

    renderPdf();
    // This effect should re-run whenever the file or currentPageNumber changes.
  }, [file, currentPageNumber, pdfDocument, setPdfDocument]);

  return (
    <div className="pdf-viewer-container">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default PdfViewer;