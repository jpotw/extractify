// src/components/PdfViewer.tsx

import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdfStore } from '../store/pdfStore';
import { useTemplateStore } from '../store/templateStore';
import type { BoundingBox } from '../types';
import Pagination from './Pagination';
import BoundingBoxComponent from './BoundingBox'; // Import the new component

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentRectPixels: BoundingBox | null; // Drawing state remains in pixels for UI
}

/**
 * @file Orchestrates the PDF viewing area and all interactions within it.
 * @component
 */
const PdfViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const { file, setPdfDocument, pdfDocument, currentPageNumber, setCurrentPageNumber } = usePdfStore();
  const { templates, addTemplate, selectedTemplateId, setSelectedTemplateId, removeTemplate } = useTemplateStore();

  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false, startX: 0, startY: 0, currentRectPixels: null,
  });

  useEffect(() => {
    // ... PDF rendering logic (unchanged) ...
    const renderPdf = async () => {
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
        let isNewFile = false;
        if (!pdf) {
          isNewFile = true;
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument(arrayBuffer);
          pdf = await loadingTask.promise;
          setPdfDocument(pdf);
        }
        if (isNewFile && pdf.numPages > 1) {
          const middlePage = Math.max(1, Math.floor(pdf.numPages / 2));
          setCurrentPageNumber(middlePage);
          return;
        }
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
  }, [file, currentPageNumber, pdfDocument, setPdfDocument, setCurrentPageNumber]);

  // Keyboard event handler for deleting selected box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTemplateId) {
        removeTemplate(selectedTemplateId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTemplateId, removeTemplate]);

  const calculateRectInPixels = (startX: number, startY: number, endX: number, endY: number): BoundingBox => {
    return {
      x1: Math.min(startX, endX), y1: Math.min(startY, endY),
      x2: Math.max(startX, endX), y2: Math.max(startY, endY),
    };
  };

  /**
   * Handles the mouse down event on the main canvas wrapper.
   * This function now has dual responsibility:
   * 1. If a box is selected, it deselects it.
   * 2. If no box is selected, it starts a new drawing.
   */
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // If a template is currently selected, the primary action of a background
    // click is to deselect it.
    if (selectedTemplateId) {
      setSelectedTemplateId(null);
      return; // Stop further execution to prevent starting a new drawing.
    }

    // If no template is selected, proceed with starting a new drawing.
    if (!pdfDocument || !canvasRef.current) return;
    const { offsetX, offsetY } = event.nativeEvent;
    setDrawingState({ isDrawing: true, startX: offsetX, startY: offsetY, currentRectPixels: null });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!drawingState.isDrawing) return;
    const { offsetX, offsetY } = event.nativeEvent;
    const newRect = calculateRectInPixels(drawingState.startX, drawingState.startY, offsetX, offsetY);
    setDrawingState((prevState) => ({ ...prevState, currentRectPixels: newRect }));
  };

  const handleMouseUp = () => {
    if (!drawingState.isDrawing || !drawingState.currentRectPixels || !canvasRef.current) return;

    const rect = drawingState.currentRectPixels;
    if (Math.abs(rect.x2 - rect.x1) < 5 || Math.abs(rect.y2 - rect.y1) < 5) {
      setDrawingState({ isDrawing: false, startX: 0, startY: 0, currentRectPixels: null });
      return;
    }

    const zoneName = prompt('Enter a name for this extraction zone:');
    if (zoneName && zoneName.trim() !== '') {
      // Convert pixels to ratios before saving
      const canvas = canvasRef.current;
      const bboxRatio: BoundingBox = {
        x1: rect.x1 / canvas.width,
        y1: rect.y1 / canvas.height,
        x2: rect.x2 / canvas.width,
        y2: rect.y2 / canvas.height,
      };
      const newTemplate = {
        id: `zone_${Date.now()}`,
        name: zoneName.trim(),
        bbox: bboxRatio,
      };
      addTemplate(newTemplate);
      setSelectedTemplateId(newTemplate.id);
    }
    setDrawingState({ isDrawing: false, startX: 0, startY: 0, currentRectPixels: null });
  };

  /**
   * Determines the appropriate cursor style based on the application state.
   */
  const getCursorStyle = (): React.CSSProperties['cursor'] => {
    // If a PDF is loaded and no box is selected, it's ready for drawing.
    if (pdfDocument && !selectedTemplateId) {
      return 'crosshair';
    }
    // Otherwise, use the default cursor (e.g., no PDF, or a box is selected).
    return 'default';
  };

  return (
    <div className="pdf-viewer-container">
      <Pagination />
      <div
        ref={overlayRef}
        className="pdf-canvas-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: getCursorStyle() }} // Apply dynamic cursor style
      >
        <canvas ref={canvasRef}></canvas>
        <div className="bounding-box-overlay">
          {/* Render existing templates using the new component */}
          {templates.map((template) => (
            <BoundingBoxComponent
              key={template.id}
              template={template}
              isSelected={template.id === selectedTemplateId}
              canvasRef={canvasRef} // Pass canvas ref for coordinate conversion
            />
          ))}
          {/* Render the box currently being drawn */}
          {drawingState.isDrawing && drawingState.currentRectPixels && (
            <div
              className="drawing-box"
              style={{
                left: `${drawingState.currentRectPixels.x1}px`,
                top: `${drawingState.currentRectPixels.y1}px`,
                width: `${drawingState.currentRectPixels.x2 - drawingState.currentRectPixels.x1}px`,
                height: `${drawingState.currentRectPixels.y2 - drawingState.currentRectPixels.y1}px`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;