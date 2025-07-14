// src/lib/postProcessor.ts

import type { TextItem } from 'pdfjs-dist/types/src/display/api';

/**
 * @file Advanced post-processing functions for PDF text extraction based on geometric layout.
 * 
 * This module provides sophisticated text processing capabilities for table-like structures
 * commonly found in Korean real estate documents. It handles key-value pair extraction
 * with support for multi-line values and flexible key matching.
 * 
 * @author Extractify Development Team
 * @version 2.0.0
 */

/**
 * Configuration for the property overview extraction
 */
const PROPERTY_OVERVIEW_CONFIG = {
  /** Keywords that identify property overview sections */
  SECTION_IDENTIFIERS: /general|overview|정보/i,
  
  /** Standard keys found in Korean property overview tables */
  STANDARD_KEYS: [
    '주소', '교통', '연면적', '빌딩규모', '준공연도', '전용율', 
    '기준층 면적', '천정고', '엘리베이터', '주차사항', '특이사항'
  ],
  
  /** Layout tolerances for row boundary detection */
  ROW_TOLERANCE: 15,
  KEY_EXCLUSION_TOLERANCE: 8,
  MIN_VALUE_OFFSET: 20
} as const;

/**
 * Interface for key location information
 */
interface KeyLocation {
  item: TextItem;
  y: number;
  x: number;
}

/**
 * Interface for row boundary information
 */
interface RowBoundary {
  key: string;
  y: number;
  minY: number;
  maxY: number;
}

/**
 * Interface for extracted value with position
 */
interface ExtractedValue {
  text: string;
  x: number;
  y: number;
}

/**
 * Finds a key in the text items with flexible matching strategies.
 * 
 * Supports three matching levels:
 * 1. Exact string matching
 * 2. Space-normalized matching
 * 3. First keyword matching (for compound keys like "기준층 면적")
 * 
 * @param items - Array of text items from PDF.js
 * @param key - The key to search for
 * @returns Key location information or null if not found
 */
function findKeyInItems(items: TextItem[], key: string): KeyLocation | null {
  // Strategy 1: Exact substring matching
  let keyItem = items.find(item => item.str.includes(key));
  if (keyItem) {
    return { 
      item: keyItem, 
      y: keyItem.transform[5], 
      x: keyItem.transform[4] 
    };
  }

  // Strategy 2: Space-normalized matching (handles OCR spacing issues)
  const normalizedKey = key.replace(/\s+/g, '');
  keyItem = items.find(item => 
    item.str.replace(/\s+/g, '').includes(normalizedKey)
  );
  if (keyItem) {
    return { 
      item: keyItem, 
      y: keyItem.transform[5], 
      x: keyItem.transform[4] 
    };
  }

  // Strategy 3: First keyword matching (for compound keys)
  const keyWords = key.split(/\s+/);
  if (keyWords.length > 1) {
    keyItem = items.find(item => {
      const itemStr = item.str.trim();
      const firstKeyword = keyWords[0];
      return itemStr === firstKeyword || itemStr.includes(firstKeyword);
    });
    
    if (keyItem) {
      return { 
        item: keyItem, 
        y: keyItem.transform[5], 
        x: keyItem.transform[4] 
      };
    }
  }

  return null;
}

/**
 * Calculates precise row boundaries for each key to prevent value overlap.
 * 
 * Uses a combination of inter-row midpoints and tolerance limits to ensure
 * each row captures only its intended values.
 * 
 * @param keyRows - Array of row boundary objects (will be modified in place)
 */
function calculateRowBoundaries(keyRows: RowBoundary[]): void {
  const { ROW_TOLERANCE } = PROPERTY_OVERVIEW_CONFIG;

  for (let i = 0; i < keyRows.length; i++) {
    const currentRow = keyRows[i];
    
    // Calculate upper boundary
    if (i > 0) {
      const prevRow = keyRows[i - 1];
      const midpoint = (currentRow.y + prevRow.y) / 2;
      currentRow.maxY = Math.min(midpoint, currentRow.y + ROW_TOLERANCE);
    } else {
      currentRow.maxY = currentRow.y + ROW_TOLERANCE;
    }
    
    // Calculate lower boundary
    if (i < keyRows.length - 1) {
      const nextRow = keyRows[i + 1];
      const midpoint = (currentRow.y + nextRow.y) / 2;
      currentRow.minY = Math.max(midpoint, currentRow.y - ROW_TOLERANCE);
    } else {
      currentRow.minY = currentRow.y - ROW_TOLERANCE;
    }
  }
}

/**
 * Extracts values from a specific row while excluding key components.
 * 
 * Implements sophisticated filtering to ensure only actual values are captured,
 * excluding the key itself and avoiding cross-row contamination.
 * 
 * @param items - All text items from the extraction zone
 * @param row - Row boundary information
 * @param keyLocation - Location of the key for this row
 * @returns Array of extracted values with position information
 */
function extractRowValues(
  items: TextItem[], 
  row: RowBoundary, 
  keyLocation: KeyLocation
): ExtractedValue[] {
  const { KEY_EXCLUSION_TOLERANCE, MIN_VALUE_OFFSET } = PROPERTY_OVERVIEW_CONFIG;
  const keyX = keyLocation.x;
  const keyWidth = row.key.replace(/\s+/g, '').length * 8; // Approximate key width
  const firstKeyWord = row.key.split(/\s+/)[0];
  
  const rowValues: ExtractedValue[] = [];
  
  for (const item of items) {
    const itemY = item.transform[5];
    const itemX = item.transform[4];
    
    // Skip the key item itself
    if (item === keyLocation.item) continue;
    
    // Skip key components (only the first keyword for compound keys)
    const itemStr = item.str.trim();
    const isKeyComponent = itemStr === firstKeyWord || itemStr.includes(firstKeyWord);
    if (isKeyComponent && Math.abs(itemY - row.y) <= KEY_EXCLUSION_TOLERANCE) {
      continue;
    }
    
    // Include items within row boundaries and to the right of the key
    const isInRowBounds = itemY <= row.maxY && itemY >= row.minY;
    const isRightOfKey = itemX > keyX + keyWidth + MIN_VALUE_OFFSET;
    
    if (isInRowBounds && isRightOfKey) {
      rowValues.push({
        text: item.str,
        x: itemX,
        y: itemY
      });
    }
  }
  
  return rowValues;
}

/**
 * Sorts extracted values in natural reading order.
 * 
 * Prioritizes top-to-bottom ordering (Y-coordinate) for multi-line values,
 * then left-to-right (X-coordinate) within the same line.
 * 
 * @param values - Array of extracted values to sort
 * @returns Sorted array in reading order
 */
function sortValuesInReadingOrder(values: ExtractedValue[]): ExtractedValue[] {
  return values.sort((a, b) => {
    // Primary sort: Y-coordinate (top to bottom)
    if (Math.abs(a.y - b.y) > 3) {
      return b.y - a.y;
    }
    // Secondary sort: X-coordinate (left to right)
    return a.x - b.x;
  });
}

/**
 * Parses table-structured text with precise row-based extraction.
 * 
 * This is the core algorithm for handling Korean property overview tables.
 * It identifies keys, calculates row boundaries, and extracts values while
 * preventing cross-contamination between rows.
 * 
 * @param items - Text items extracted from the PDF region
 * @param keys - Array of expected keys to look for
 * @returns Formatted string with key-value pairs
 */
function parseTableByRows(items: TextItem[], keys: string[]): string {
  if (!items?.length) return '';

  // Step 1: Locate all keys and establish row positions
  const keyRows: RowBoundary[] = [];
  
  for (const key of keys) {
    const keyLocation = findKeyInItems(items, key);
    if (keyLocation) {
      keyRows.push({
        key,
        y: keyLocation.y,
        minY: 0, // Will be calculated
        maxY: 0  // Will be calculated
      });
    }
  }

  // Early return if no keys found
  if (keyRows.length === 0) {
    return items.map(item => item.str).join(' ');
  }

  // Step 2: Sort rows by Y-coordinate (top to bottom)
  keyRows.sort((a, b) => b.y - a.y);

  // Step 3: Calculate precise row boundaries
  calculateRowBoundaries(keyRows);

  // Step 4: Extract values for each row
  const results: Record<string, string> = {};

  for (const row of keyRows) {
    const keyLocation = findKeyInItems(items, row.key);
    if (!keyLocation) continue;
    
    const rawValues = extractRowValues(items, row, keyLocation);
    const sortedValues = sortValuesInReadingOrder(rawValues);
    
    const valueText = sortedValues
      .map(v => v.text)
      .join(' ')
      .trim();
    
    if (valueText) {
      results[row.key] = valueText;
    }
  }

  // Step 5: Format output in original key order
  return keys
    .map(key => {
      const value = results[key];
      return value ? `${key}: ${value}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Legacy geometric layout parser for non-table structures.
 * 
 * Handles documents that don't follow strict table layouts by grouping
 * text items into rows and attempting to reconstruct key-value relationships.
 * 
 * @param items - Text items from the extraction zone
 * @param keys - Expected keys to look for
 * @returns Formatted string with extracted content
 * @deprecated Consider using parseTableByRows for better accuracy
 */
function parseLegacyGeometricLayout(items: TextItem[], keys: string[]): string {
  // Group items into rows based on Y-coordinate similarity
  const rows: TextItem[][] = [];
  
  if (items.length > 0) {
    // Sort by position: top-to-bottom, then left-to-right
    items.sort((a, b) => {
      const yDiff = Math.abs(b.transform[5] - a.transform[5]);
      if (yDiff > 2) return b.transform[5] - a.transform[5];
      return a.transform[4] - b.transform[4];
    });

    let currentRow: TextItem[] = [items[0]];
    
    for (let i = 1; i < items.length; i++) {
      const yDiff = Math.abs(items[i].transform[5] - items[i-1].transform[5]);
      if (yDiff < 2) {
        currentRow.push(items[i]);
      } else {
        rows.push(currentRow);
        currentRow = [items[i]];
      }
    }
    rows.push(currentRow);
  }

  // Reconstruct key-value pairs from rows
  const results: Record<string, string[]> = {};
  let currentKey: string | null = null;

  for (const row of rows) {
    const rowText = row.map(item => item.str).join(' ');
    
    // Check if this row contains a key
    const foundKey = keys.find(key => rowText.includes(key));
    
    if (foundKey) {
      currentKey = foundKey;
      const keyIndex = rowText.indexOf(foundKey);
      const valueText = rowText.substring(keyIndex + foundKey.length).trim();
      
      if (valueText) {
        if (!results[currentKey]) results[currentKey] = [];
        results[currentKey].push(valueText);
      }
    } else if (currentKey) {
      // This row is a continuation of the previous key's value
      const valueText = rowText.trim();
      if (valueText) {
        if (!results[currentKey]) results[currentKey] = [];
        results[currentKey].push(valueText);
      }
    }
  }
  
  // Format final output
  return keys
    .map(key => {
      const values = results[key];
      return values?.length ? `${key}: ${values.join(' ')}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Main post-processing function for extracted text.
 * 
 * Analyzes the template name to determine the appropriate processing strategy
 * and applies the most suitable algorithm for the content type.
 * 
 * @param templateName - Name of the extraction template/zone
 * @param items - Array of TextItem objects from PDF.js
 * @returns Processed and formatted text string
 * 
 * @example
 * ```typescript
 * const processedText = postProcessText('Property Overview', textItems);
 * // Returns: "주소: 서울시 강남구...\n교통: 지하철 2호선..."
 * ```
 */
export function postProcessText(templateName: string, items: TextItem[]): string {
  if (!items?.length) return '';

  const { SECTION_IDENTIFIERS, STANDARD_KEYS } = PROPERTY_OVERVIEW_CONFIG;
  const normalizedName = templateName.toLowerCase();

  // Check if this is a property overview section
  if (SECTION_IDENTIFIERS.test(normalizedName)) {
    // Use advanced table parsing for structured property data
    return parseTableByRows(items, STANDARD_KEYS.slice());
  }
  
  // Default: simple text concatenation for unstructured content
  return items
    .map(item => item.str)
    .filter(str => str.trim())
    .join(' ');
}