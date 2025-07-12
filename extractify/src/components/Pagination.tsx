// src/components/Pagination.tsx

import React from 'react';
import { usePdfStore } from '../store/pdfStore';

/**
 * @file Renders pagination controls for navigating PDF pages.
 * @component
 *
 * @description
 * This component displays the current page number, total pages, and navigation
 * buttons ("Previous", "Next"). It connects to the `usePdfStore` to get the
 * necessary data and calls the `setCurrentPageNumber` action to change pages.
 * The navigation buttons are automatically disabled when at the beginning or
 * end of the document.
 *
 * @returns {JSX.Element | null} The rendered pagination controls, or null if no PDF is loaded.
 */
const Pagination: React.FC = () => {
  const { currentPageNumber, numPages, setCurrentPageNumber } = usePdfStore();

  // Don't render the component if there are no pages (i.e., no PDF loaded).
  if (numPages === 0) {
    return null;
  }

  /**
   * Navigates to the previous page.
   */
  const goToPreviousPage = () => {
    // Ensure we don't go below page 1.
    setCurrentPageNumber(Math.max(1, currentPageNumber - 1));
  };

  /**
   * Navigates to the next page.
   */
  const goToNextPage = () => {
    // Ensure we don't go beyond the total number of pages.
    setCurrentPageNumber(Math.min(numPages, currentPageNumber + 1));
  };

  return (
    <div className="pagination-container">
      <button onClick={goToPreviousPage} disabled={currentPageNumber <= 1}>
        Previous
      </button>
      <span className="page-info">
        Page {currentPageNumber} of {numPages}
      </span>
      <button onClick={goToNextPage} disabled={currentPageNumber >= numPages}>
        Next
      </button>
    </div>
  );
};

export default Pagination;