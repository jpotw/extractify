// src/types.ts

/**
 * @file Defines shared TypeScript types used throughout the application.
 * @description Centralizing types ensures consistency between the state store,
 * API layers, and React components.
 */

/**
 * Represents the coordinates of a rectangular bounding box.
 * The coordinates assume a top-left origin (0,0).
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