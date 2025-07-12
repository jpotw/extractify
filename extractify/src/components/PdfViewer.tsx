// src/components/PdfViewer.tsx

import React, { useRef, useEffect, useState, MouseEvent } from 'react';
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
  currentRect: BoundingBox | null;
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
    isDrawing: false, startX: 0, startY: 0, currentRect: null,
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

  const calculateRect = (startX: number, startY: number, endX: number, endY: number): BoundingBox => {
    return {
      x1: Math.min(startX, endX), y1: Math.min(startY, endY),
      x2: Math.max(startX, endX), y2: Math.max(startY, endY),
    };
  };

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    // Deselect any selected box if clicking on the background
    setSelectedTemplateId(null);

    if (!pdfDocument) return;
    const { offsetX, offsetY } = event.nativeEvent;
    setDrawingState({ isDrawing: true, startX: offsetX, startY: offsetY, currentRect: null });
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!drawingState.isDrawing) return;
    const { offsetX, offsetY } = event.nativeEvent;
    const newRect = calculateRect(drawingState.startX, drawingState.startY, offsetX, offsetY);
    setDrawingState((prevState) => ({ ...prevState, currentRect: newRect }));
  };

  const handleMouseUp = () => {
    if (!drawingState.isDrawing || !drawingState.currentRect) return;

    const { x1, y1, x2, y2 } = drawingState.currentRect;
    if (Math.abs(x2 - x1) < 5 || Math.abs(y2 - y1) < 5) {
      setDrawingState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
      return;
    }

    const zoneName = prompt('Enter a name for this extraction zone:');
    if (zoneName && zoneName.trim() !== '') {
        const newTemplate = {
            id: `zone_${Date.now()}`,
            name: zoneName.trim(),
            bbox: drawingState.currentRect,
        };
      addTemplate(newTemplate);
      // Automatically select the new box
      setSelectedTemplateId(newTemplate.id);
    }
    setDrawingState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
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
        style={{ cursor: pdfDocument ? 'crosshair' : 'default' }}
      >
        <canvas ref={canvasRef}></canvas>
        <div className="bounding-box-overlay">
          {/* Render existing templates using the new component */}
          {templates.map((template) => (
            <BoundingBoxComponent
              key={template.id}
              template={template}
              isSelected={template.id === selectedTemplateId}
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