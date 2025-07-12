// src/components/ResultsPreview.tsx

import React from 'react';
import { useExtractionStore } from '../store/extractionStore';

/**
 * @file Displays the results of a text extraction operation.
 * @component
 *
 * @description
 * This component subscribes to the `useExtractionStore` and renders the
 * extraction status and results. It shows a loading message, an error message,
 * or a list of the extracted key-value pairs.
 *
 * @returns {JSX.Element} The rendered results preview panel.
 */
const ResultsPreview: React.FC = () => {
  const { status, results, progressMessage } = useExtractionStore();

  if (status === 'idle') {
    return null; // Don't show anything if no extraction has been run
  }

  return (
    <div className="results-preview-container">
      <h3>Extraction Results</h3>
      {status === 'pending' && <p className="extraction-status">{progressMessage || 'Extracting...'}</p>}
      {status === 'error' && (
        <p className="extraction-status" style={{ color: '#ff6b6b' }}>
          An error occurred: {progressMessage}
        </p>
      )}
      {status === 'success' && results && (
        <div className="results-list">
          {Object.entries(results).length === 0 ? (
            <p className="extraction-status">No text found in the defined zones.</p>
          ) : (
            Object.entries(results).map(([key, value]) => (
              <div key={key} className="result-item">
                <span className="result-item-key">{key}</span>
                <p className="result-item-value">{value || 'N/A'}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsPreview;