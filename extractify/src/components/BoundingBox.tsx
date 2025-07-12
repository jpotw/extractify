// src/components/BoundingBox.tsx

import React, { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { Template } from '../types';
import { useTemplateStore } from '../store/templateStore';

interface BoundingBoxProps {
  template: Template;
  isSelected: boolean;
}

type HandleType = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | 'move';

/**
 * @file Renders a single, interactive bounding box instance.
 * @component
 *
 * @description
 * This component is responsible for a single extraction zone box. It handles:
 * - Rendering the box based on its template data.
 * - Displaying selection state and resize handles.
 * - Handling mouse events for moving and resizing the box.
 * - Updating the global store with the new coordinates after an interaction.
 *
 * @param {BoundingBoxProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered bounding box instance.
 */
const BoundingBox: React.FC<BoundingBoxProps> = ({ template, isSelected }) => {
  const { setSelectedTemplateId, updateTemplateBbox } = useTemplateStore();
  const [interactionType, setInteractionType] = useState<HandleType | null>(null);
  const initialPos = useRef({ x: 0, y: 0, bbox: template.bbox });

  const handleMouseDown = (e: MouseEvent, type: HandleType) => {
    e.stopPropagation(); // Prevent the viewer from starting a new drawing
    setSelectedTemplateId(template.id);
    setInteractionType(type);
    initialPos.current = { x: e.clientX, y: e.clientY, bbox: template.bbox };
  };

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!interactionType) return;

      const dx = e.clientX - initialPos.current.x;
      const dy = e.clientY - initialPos.current.y;
      let { x1, y1, x2, y2 } = initialPos.current.bbox;

      switch (interactionType) {
        case 'move':
          x1 += dx; y1 += dy; x2 += dx; y2 += dy;
          break;
        case 'n':  y1 += dy; break;
        case 's':  y2 += dy; break;
        case 'w':  x1 += dx; break;
        case 'e':  x2 += dx; break;
        case 'nw': x1 += dx; y1 += dy; break;
        case 'ne': x2 += dx; y1 += dy; break;
        case 'sw': x1 += dx; y2 += dy; break;
        case 'se': x2 += dx; y2 += dy; break;
      }
      
      // Update the bbox in the store
      updateTemplateBbox(template.id, { 
        x1: Math.min(x1, x2),
        y1: Math.min(y1, y2),
        x2: Math.max(x1, x2),
        y2: Math.max(y1, y2),
       });

    }, [interactionType, template.id, updateTemplateBbox]
  );

  const handleMouseUp = useCallback(() => {
    setInteractionType(null);
  }, []);

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
        left: `${template.bbox.x1}px`,
        top: `${template.bbox.y1}px`,
        width: `${template.bbox.x2 - template.bbox.x1}px`,
        height: `${template.bbox.y2 - template.bbox.y1}px`,
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {isSelected && (
        <>
          <div className="resize-handle handle-nw" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
          <div className="resize-handle handle-n" onMouseDown={(e) => handleMouseDown(e, 'n')} />
          <div className="resize-handle handle-ne" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
          <div className="resize-handle handle-w" onMouseDown={(e) => handleMouseDown(e, 'w')} />
          <div className="resize-handle handle-e" onMouseDown={(e) => handleMouseDown(e, 'e')} />
          <div className="resize-handle handle-sw" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
          <div className="resize-handle handle-s" onMouseDown={(e) => handleMouseDown(e, 's')} />
          <div className="resize-handle handle-se" onMouseDown={(e) => handleMouseDown(e, 'se')} />
        </>
      )}
    </div>
  );
};

export default BoundingBox;