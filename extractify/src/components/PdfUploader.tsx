// src/components/PdfUploader.tsx

import React, { useCallback, useRef } from 'react';
import { usePdfStore } from '../store/pdfStore';

/**
 * @file A component for selecting a local PDF file.
 * @component
 *
 * @description
 * This component provides a user-friendly button to open the file dialog.
 * It uses a hidden file input element, which is programmatically triggered.
 * When a user selects a file, it updates the central `usePdfStore`.
 *
 * @returns {JSX.Element} The rendered PDF uploader button.
 */
const PdfUploader: React.FC = () => {
  const { setFile } = usePdfStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles the file selection event.
   * Validates that a file was selected and it is a PDF, then updates the store.
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const selectedFile = files[0];
        if (selectedFile.type === 'application/pdf') {
          setFile(selectedFile);
        } else {
          alert('Please select a valid PDF file.');
        }
      }
    },
    [setFile],
  );

  /**
   * Programmatically clicks the hidden file input.
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ display: 'none' }} // The input is hidden from the user.
      />
      <button onClick={handleButtonClick}>Open PDF File</button>
    </div>
  );
};

export default PdfUploader;