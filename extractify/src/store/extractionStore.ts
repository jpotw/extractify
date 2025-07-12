// src/store/extractionStore.ts

import { create } from 'zustand';
import type { ExtractionResult } from '../types';

/**
 * @type ExtractionStatus
 * @description Represents the current status of the extraction process.
 */
export type ExtractionStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * @interface ExtractionState
 * @description Defines the shape of the state for the extraction process.
 */
interface ExtractionState {
  status: ExtractionStatus;
  /** A message indicating the current progress, e.g., "Running OCR on page 1...". */
  progressMessage: string;
  results: ExtractionResult | null;
}

/**
 * @interface ExtractionActions
 * @description Defines the actions for manipulating the extraction state.
 */
interface ExtractionActions {
  /**
   * Sets the extraction status, progress message, and results.
   */
  setExtractionState: (state: Partial<ExtractionState>) => void;
  /**
   * Resets the store to its initial idle state.
   */
  reset: () => void;
}

const initialState: ExtractionState = {
  status: 'idle',
  progressMessage: '',
  results: null,
};

/**
 * Custom hook for managing the state of the data extraction process.
 *
 * This store tracks whether an extraction is idle, pending, successful, or failed,
 * and holds the resulting data.
 *
 * @returns {object} The store's state and actions.
 */
export const useExtractionStore = create<ExtractionState & ExtractionActions>((set) => ({
  ...initialState,

  setExtractionState: (newState) => set((state) => ({ ...state, ...newState })),

  reset: () => set(initialState),
}));