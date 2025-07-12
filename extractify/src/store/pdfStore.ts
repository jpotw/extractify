// src/store/pdfStore.ts

import { create } from 'zustand';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

/**
 * @interface PdfState
 * @description Defines the shape of the state related to the active PDF document.
 */
interface PdfState {
  /**
   * The raw File object selected by the user. Null if no file is loaded.
   */
  file: File | null;
  /**
   * The parsed PDF document object from pdf.js. Null if not parsed.
   */
  pdfDocument: PDFDocumentProxy | null;
  /**
   * The total number of pages in the document.
   */
  numPages: number;
  /**
   * The currently displayed page number (1-based index).
   */
  currentPageNumber: number;
}

/**
 * @interface PdfActions
 * @description Defines the actions for manipulating the PDF state.
 */
interface PdfActions {
  /**
   * Sets the active PDF file and resets related state.
   * @param {File | null} file - The new PDF file object, or null to clear.
   */
  setFile: (file: File | null) => void;
  /**
   * Stores the parsed PDF.js document object.
   * @param {PDFDocumentProxy} pdfDoc - The parsed document proxy.
   */
  setPdfDocument: (pdfDoc: PDFDocumentProxy) => void;
  /**
   * Sets the current page number to be displayed.
   * @param {number} pageNumber - The new page number (1-based).
   */
  setCurrentPageNumber: (pageNumber: number) => void;
}

/**
 * Custom hook for managing the state of the loaded PDF document.
 *
 * This store centralizes the logic for handling the user-selected PDF file,
 * its parsed representation, and pagination details.
 *
 * @returns {object} The store's state and actions.
 */
export const usePdfStore = create<PdfState & PdfActions>((set) => ({
  // Initial State
  file: null,
  pdfDocument: null,
  numPages: 0,
  currentPageNumber: 1,

  // --- ACTIONS ---

  setFile: (file) => set({ file, pdfDocument: null, numPages: 0, currentPageNumber: 1 }),

  setPdfDocument: (pdfDoc) => set({ pdfDocument: pdfDoc, numPages: pdfDoc.numPages }),

  setCurrentPageNumber: (pageNumber) => set({ currentPageNumber: pageNumber }),
}));