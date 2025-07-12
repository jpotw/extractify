// src/components/PdfViewer.tsx

import React from 'react';

/**
 * @file Renders the main PDF viewing area of the application.
 * @component
 *
 * @description
 * This component is responsible for displaying the loaded PDF file. In later
 * development stages, it will contain a <canvas> element for rendering PDF
 * pages via pdf.js and will handle all user interactions for drawing
 * bounding boxes (e.g., onMouseDown, onMouseMove, onMouseUp events).
 *
 * For this initial step, it serves as a static visual placeholder.
 *
 * @returns {JSX.Element} The rendered PDF Viewer component.
 */
const PdfViewer: React.FC = () => {
  return (
    <div className="pdf-viewer-container">
      <h2>PDF Viewer</h2>
      <p>The PDF document will be rendered here. Users will draw extraction zones on this canvas.</p>
    </div>
  );
};

export default PdfViewer;