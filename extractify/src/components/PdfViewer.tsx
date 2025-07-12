// src/components/PdfViewer.tsx

import React, { useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker to avoid errors.
// This points to the version of the worker provided by the 'pdfjs-dist' package.
// Vite will correctly handle this path during the build process.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

/**
 * @file Renders the main PDF viewing area and displays a static PDF.
 * @component
 *
 * @description
 * This component is responsible for rendering a PDF file onto a <canvas> element.
 * It uses the 'pdf.js' library to fetch and display a sample PDF document.
 * The `useEffect` hook triggers the rendering process once the component mounts.
 * The canvas element is accessed via a `useRef` hook.
 *
 * For now, the PDF path is hard-coded for demonstration purposes.
 * This will be made dynamic in a later step.
 *
 * @returns {JSX.Element} The rendered PDF Viewer component.
 */
const PdfViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    /**
     * Asynchronously loads and renders the first page of a PDF document.
     */
    const renderPdf = async () => {
      // Ensure the canvas element is available.
      if (!canvasRef.current) {
        console.error('Canvas element not found!');
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Could not get canvas context!');
        return;
      }

      const pdfPath = '/sample.pdf'; // Path relative to the 'public' folder.

      try {
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // Get the first page.

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
      }
    };

    renderPdf();
  }, []); // The empty dependency array ensures this runs only once on mount.

  return (
    <div className="pdf-viewer-container">
      {/* The canvas where the PDF will be drawn. */}
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default PdfViewer;