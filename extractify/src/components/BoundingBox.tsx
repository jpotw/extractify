// src/components/BoundingBox.tsx

import React, { MouseEvent, useCallback, useEffect, useRef, useState, RefObject } from 'react';
import type { BoundingBox as BboxRatio, Template } from '../types';
import { useTemplateStore } from '../store/templateStore';

interface BoundingBoxProps {
  template: Template;
  isSelected: boolean;
  canvasRef: RefObject<HTMLCanvasElement>;
}

type HandleType = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | 'move';

/**
 * @file Renders a single, interactive bounding box instance.
 * @component
 *
 * @description
 * This component is responsible for a single extraction zone box. It handles:
 * - Rendering the box based on its template data.
 * - Displaying selection state and all eight resize handles.
 * - Handling mouse events for moving and resizing the box from any edge or corner.
 * - Updating the global store with the new coordinates after an interaction.
 *
 * @param {BoundingBoxProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered bounding box instance.
 */
const BoundingBoxComponent: React.FC<BoundingBoxProps> = ({ template, isSelected, canvasRef }) => {
  const { setSelectedTemplateId, updateTemplateBbox } = useTemplateStore();
  const [interactionType, setInteractionType] = useState<HandleType | null>(null);
  
  // This ref now stores initial positions in pixels for accurate dragging
  const initialInteractionState = useRef({
    mouseX: 0,
    mouseY: 0,
    bboxPixels: { x1: 0, y1: 0, x2: 0, y2: 0 },
  });

  // Convert stored ratio bbox to absolute pixel bbox for rendering
  const getPixelBbox = (ratioBbox: BboxRatio): BboxRatio => {
    if (!canvasRef.current) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    const { width, height } = canvasRef.current;
    return {
      x1: ratioBbox.x1 * width, y1: ratioBbox.y1 * height,
      x2: ratioBbox.x2 * width, y2: ratioBbox.y2 * height,
    };
  };

  const pixelBbox = getPixelBbox(template.bbox);

  const handleMouseDown = (e: MouseEvent, type: HandleType) => {
    if (!canvasRef.current) return;
    e.stopPropagation();
    setSelectedTemplateId(template.id);
    setInteractionType(type);
    initialInteractionState.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      bboxPixels: getPixelBbox(template.bbox),
    };
  };

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
      if (!interactionType || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const dx = e.clientX - initialInteractionState.current.mouseX;
      const dy = e.clientY - initialInteractionState.current.mouseY;
      let { x1, y1, x2, y2 } = initialInteractionState.current.bboxPixels;

      switch (interactionType) {
        case 'move': x1 += dx; y1 += dy; x2 += dx; y2 += dy; break;
        case 'n': y1 += dy; break; case 's': y2 += dy; break;
        case 'w': x1 += dx; break; case 'e': x2 += dx; break;
        case 'nw': x1 += dx; y1 += dy; break; case 'ne': x2 += dx; y1 += dy; break;
        case 'sw': x1 += dx; y2 += dy; break; case 'se': x2 += dx; y2 += dy; break;
      }
      
      // Prevent the box from inverting
      const newX1 = Math.min(x1, x2);
      const newY1 = Math.min(y1, y2);
      const newX2 = Math.max(x1, x2);
      const newY2 = Math.max(y1, y2);

      // Convert back to ratio before updating the store
      const newBboxRatio: BboxRatio = {
        x1: newX1 / canvas.width, y1: newY1 / canvas.height,
        x2: newX2 / canvas.width, y2: newY2 / canvas.height,
      };

      updateTemplateBbox(template.id, newBboxRatio);

    }, [interactionType, template.id, updateTemplateBbox, canvasRef]
  );

  const handleMouseUp = useCallback(() => { setInteractionType(null); }, []);

  useEffect(() => {
    if (interactionType) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interactionType, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`bounding-box-instance ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${pixelBbox.x1}px`, top: `${pixelBbox.y1}px`,
        width: `${pixelBbox.x2 - pixelBbox.x1}px`, height: `${pixelBbox.y2 - pixelBbox.y1}px`,
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {isSelected && (
        <>
          {/* Top-left */}
          <div className="resize-handle handle-nw" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
          {/* Top-center */}
          <div className="resize-handle handle-n" onMouseDown={(e) => handleMouseDown(e, 'n')} />
          {/* Top-right */}
          <div className="resize-handle handle-ne" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
          {/* Middle-left */}
          <div className="resize-handle handle-w" onMouseDown={(e) => handleMouseDown(e, 'w')} />
          {/* Middle-right */}
          <div className="resize-handle handle-e" onMouseDown={(e) => handleMouseDown(e, 'e')} />
          {/* Bottom-left */}
          <div className="resize-handle handle-sw" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
          {/* Bottom-center */}
          <div className="resize-handle handle-s" onMouseDown={(e) => handleMouseDown(e, 's')} />
          {/* Bottom-right */}
          <div className="resize-handle handle-se" onMouseDown={(e) => handleMouseDown(e, 'se')} />
        </>
      )}
    </div>
  );
};

export default BoundingBoxComponent;