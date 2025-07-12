// src/components/PdfViewer.tsx

import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdfStore } from '../store/pdfStore';
import { useTemplateStore } from '../store/templateStore';
import type { BoundingBox } from '../types';

// The workerSrc path is now correctly configured to use a stable CDN version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

/**
 * @interface DrawingState
 * @description Represents the state of the active drawing operation.
 */
interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentRect: BoundingBox | null;
}

/**
 * @file Renders the PDF and handles interactive bounding box creation.
 * @component
 *
 * @description
 * This is a highly interactive component responsible for:
 * 1. Rendering the current PDF page from `usePdfStore`.
 * 2. Displaying all existing bounding boxes from `useTemplateStore`.
 * 3. Handling mouse events (`mousedown`, `mousemove`, `mouseup`) to allow users
 *    to draw new bounding boxes on a transparent overlay.
 * 4. Prompting the user for a name and creating a new template upon completion
 *    of a drawing.
 *
 * @returns {JSX.Element} The rendered PDF Viewer component with drawing capabilities.
 */
const PdfViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Global state from Zustand stores
  const { file, setPdfDocument, pdfDocument, currentPageNumber, setCurrentPageNumber } =
    usePdfStore();
  const { templates, addTemplate } = useTemplateStore();

  // Local state for the drawing interaction
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentRect: null,
  });

  // Effect for rendering the PDF
  useEffect(() => {
    /**
     * Asynchronously loads and renders a specific page of the active PDF document.
     */
    const renderPdf = async () => {
      // Guard clauses to ensure all required elements and data are present.
      if (!canvasRef.current || !file) {
        if (canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      try {
        let pdf = pdfDocument;
        // This 'isNewFile' flag prevents us from re-calculating the middle page on every render.
        let isNewFile = false; 

        // Load the document only if it hasn't been loaded yet for this file.
        if (!pdf) {
          isNewFile = true;
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument(arrayBuffer);
          pdf = await loadingTask.promise;
          setPdfDocument(pdf); // Save the parsed document to the store.
        }

        // --- NEW LOGIC: JUMP TO MIDDLE PAGE ---
        // If it's a new file and has more than one page, jump to the middle.
        if (isNewFile && pdf.numPages > 1) {
          const middlePage = Math.max(1, Math.floor(pdf.numPages / 2));
          // We set the page number in the store. The effect will re-run with the new page number.
          setCurrentPageNumber(middlePage);
          return; // Exit this render cycle; the next one will render the correct middle page.
        }
        // --- END OF NEW LOGIC ---

        // Get the specified page.
        const page = await pdf.getPage(currentPageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (error) {
        console.error('Error rendering PDF:', error);
      }
    };

    renderPdf();
    // This effect should re-run whenever the file or currentPageNumber changes.
  }, [file, currentPageNumber, pdfDocument, setPdfDocument, setCurrentPageNumber]);

  /**
   * Calculates the coordinates of a rectangle based on start and end points.
   * Ensures that x1/y1 are always top-left and x2/y2 are bottom-right.
   * @param {number} startX - The starting X coordinate.
   * @param {number} startY - The starting Y coordinate.
   * @param {number} endX - The current/ending X coordinate.
   * @param {number} endY - The current/ending Y coordinate.
   * @returns {BoundingBox} The normalized bounding box.
   */
  const calculateRect = (startX: number, startY: number, endX: number, endY: number): BoundingBox => {
    return {
      x1: Math.min(startX, endX),
      y1: Math.min(startY, endY),
      x2: Math.max(startX, endX),
      y2: Math.max(startY, endY),
    };
  };

  /**
   * Handles the mouse down event to begin a drawing action.
   */
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    // Only start drawing if a PDF is loaded.
    if (!pdfDocument) return;

    // Get coordinates relative to the overlay wrapper.
    const { offsetX, offsetY } = event.nativeEvent;

    setDrawingState({
      isDrawing: true,
      startX: offsetX,
      startY: offsetY,
      currentRect: null, // Reset any previous drawing
    });
  };

  /**
   * Handles the mouse move event to update the dimensions of the box being drawn.
   */
  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!drawingState.isDrawing) return;

    const { offsetX, offsetY } = event.nativeEvent;
    const newRect = calculateRect(drawingState.startX, drawingState.startY, offsetX, offsetY);
    
    setDrawingState((prevState) => ({ ...prevState, currentRect: newRect }));
  };

  /**
   * Handles the mouse up event to finalize the drawing and create a template.
   */
  const handleMouseUp = () => {
    if (!drawingState.isDrawing || !drawingState.currentRect) return;

    // Check if the box is too small to be a valid selection.
    const { x1, y1, x2, y2 } = drawingState.currentRect;
    if (Math.abs(x2 - x1) < 5 || Math.abs(y2 - y1) < 5) {
      // Reset drawing state without creating a template.
      setDrawingState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
      return;
    }

    const zoneName = prompt('Enter a name for this extraction zone:');

    if (zoneName && zoneName.trim() !== '') {
      addTemplate({
        id: `zone_${Date.now()}`,
        name: zoneName.trim(),
        bbox: drawingState.currentRect,
      });
    }

    // Reset drawing state after the operation is complete.
    setDrawingState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
  };

  return (
    <div className="pdf-viewer-container">
      {/* This wrapper is crucial for positioning the overlay relative to the canvas */}
      <div
        ref={overlayRef}
        className="pdf-canvas-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        // Add onMouseLeave to cancel drawing if the mouse leaves the area
        onMouseLeave={handleMouseUp} 
        style={{ cursor: pdfDocument ? 'crosshair' : 'default' }}
      >
        <canvas ref={canvasRef}></canvas>

        {/* This overlay will contain all drawn bounding boxes */}
        <div className="bounding-box-overlay">
          {/* Render existing templates */}
          {templates.map((template) => (
            <div
              key={template.id}
              className="bounding-box"
              style={{
                left: `${template.bbox.x1}px`,
                top: `${template.bbox.y1}px`,
                width: `${template.bbox.x2 - template.bbox.x1}px`,
                height: `${template.bbox.y2 - template.bbox.y1}px`,
              }}
            />
          ))}

          {/* Render the box currently being drawn */}
          {drawingState.isDrawing && drawingState.currentRect && (
            <div
              className="drawing-box"
              style={{
                left: `${drawingState.currentRect.x1}px`,
                top: `${drawingState.currentRect.y1}px`,
                width: `${drawingState.currentRect.x2 - drawingState.currentRect.x1}px`,
                height: `${drawingState.currentRect.y2 - drawingState.currentRect.y1}px`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;