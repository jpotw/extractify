// src/components/TemplateSidebar.tsx

import React, { useCallback } from 'react';
import { useTemplateStore } from '../store/templateStore';
import { usePdfStore } from '../store/pdfStore';
import { useExtractionStore } from '../store/extractionStore';
import { runExtractionInWorker } from '../lib/extractor'; // Updated import
import type { ExtractionResult } from '../types';
import PdfUploader from './PdfUploader';
import TemplateLoader from './TemplateLoader';
import ResultsPreview from './ResultsPreview'; // Import the new component

/**
 * @file Renders the sidebar for creating and managing extraction templates.
 * @component
 */
const TemplateSidebar: React.FC = () => {
  const { templates, removeTemplate } = useTemplateStore();
  const { file, currentPageNumber } = usePdfStore(); // Get currentPageNumber from the store
  const { status: extractionStatus, setExtractionState, reset: resetExtraction } = useExtractionStore();

  /**
   * Handles the "Save Template" button click.
   */
  const handleSaveTemplate = () => {
    // ... (unchanged) ...
    if (templates.length === 0) return;
    const jsonString = JSON.stringify(templates, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Kicks off the extraction process using the Web Worker.
   */
  const handleExtractText = useCallback(() => {
    if (!file || templates.length === 0) return;

    resetExtraction();
    setExtractionState({ status: 'pending', progressMessage: 'Initializing worker...' });

    runExtractionInWorker({
      file,
      templates,
      currentPageNumber, // Pass the current page number
      onProgress: (progress) => {
        setExtractionState({ status: 'pending', progressMessage: progress.progressMessage });
      },
      onSuccess: (results) => {
        setExtractionState({ status: 'success', results });
      },
      onError: (error) => {
        setExtractionState({ status: 'error', progressMessage: error });
      },
    });
  }, [file, templates, currentPageNumber, setExtractionState, resetExtraction]);

  const canExtract = file && templates.length > 0 && extractionStatus !== 'pending';

  return (
    <aside className="template-sidebar-container">
      <div className="sidebar-section">
        <h2>File Management</h2>
        <PdfUploader />
      </div>

      <div className="sidebar-section">
        <div className="template-list-header">
          <h2>Extraction Zones</h2>
        </div>
        <div className="template-list">
          {/* ... (list rendering unchanged) ... */}
          <ul>
            {templates.length === 0 && (
              <li className="empty-list-item">
                <p>No zones created yet. Draw on the PDF to begin.</p>
              </li>
            )}
            {templates.map((template) => (
              <li key={template.id}>
                <span>{template.name}</span>
                <div className="zone-actions">
                  <button disabled>Edit</button>
                  <button onClick={() => removeTemplate(template.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ResultsPreview /> {/* Add the results component here */}

      <div className="template-actions">
        {/* The new "Extract Text" button */}
        <button onClick={handleExtractText} disabled={!canExtract}>
          {extractionStatus === 'pending' ? 'Extracting...' : 'Extract Text from Current Page'}
        </button>
        <button onClick={handleSaveTemplate} disabled={templates.length === 0}>
          Save Template
        </button>
        <TemplateLoader />
      </div>
    </aside>
  );
};

export default TemplateSidebar;