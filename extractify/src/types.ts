// src/types.ts

/**
 * @file Defines shared TypeScript types used throughout the application.
 */

/**
 * Represents the coordinates of a rectangular bounding box using
 * normalized, relative coordinates (ranging from 0.0 to 1.0).
 * This makes the coordinates independent of the display scale.
 */
export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Represents a single extraction zone template defined by the user.
 * It includes a unique identifier, a user-defined name, and its
 * corresponding bounding box on the PDF page.
 */
export interface Template {
  id: string;
  name: string;
  bbox: BoundingBox;
}

/**
 * Represents the result of a single extraction operation.
 */
export type ExtractionResult = Record<string, string>;