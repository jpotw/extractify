// src/lib/postProcessor.ts

/**
 * @file Contains post-processing functions to clean and structure raw extracted text.
 */

/**
 * A general-purpose cleaner for raw text.
 * - Removes spaced-out uppercase headers (e.g., "P R O P E R T Y...").
 * - Consolidates multiple whitespace characters into a single space.
 * @param {string} text - The raw text to clean.
 * @returns {string} The cleaned text.
 */
function preCleanText(text: string): string {
    const spacedHeaderRegex = /(?:[A-Z]\s){5,}[A-Z]/g;
    return text
      .replace(spacedHeaderRegex, '')
      .replace(/\s{2,}/g, ' ') // Consolidate spaces
      .trim();
}

/**
 * Parses text using a keyword-based slicing algorithm.
 * This is robust against ordering issues and multi-line values.
 * 
 * @param {string} rawText - The raw, unclean text from an extraction zone.
 * @param {string[]} primaryKeys - The list of primary keys to extract (e.g., '주소', '준공연도').
 * @returns {string} A formatted string with "Key: Value" pairs on each line.
 */
function parseWithKeywords(rawText: string, primaryKeys: string[]): string {
    const text = preCleanText(rawText);

    // 1. Find all occurrences of primary keys and their indices.
    const foundKeys: { key: string; index: number }[] = [];
    primaryKeys.forEach(key => {
        // Use a regex to find the key to handle cases where it might be part of another word
        const regex = new RegExp(key, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            foundKeys.push({ key, index: match.index });
        }
    });

    // Remove duplicate keys, keeping the first occurrence
    const uniqueFoundKeys = foundKeys.filter((v, i, a) => a.findIndex(t => (t.key === v.key)) === i);

    // 2. Sort the found keys by their appearance order in the text.
    uniqueFoundKeys.sort((a, b) => a.index - b.index);

    if (uniqueFoundKeys.length === 0) {
        return text; // Return cleaned text if no keys are found
    }

    // 3. Slice the text based on key positions.
    const results: Record<string, string> = {};
    for (let i = 0; i < uniqueFoundKeys.length; i++) {
        const current = uniqueFoundKeys[i];
        const next = uniqueFoundKeys[i + 1];

        const startIndex = current.index;
        const endIndex = next ? next.index : text.length; // Go to end if it's the last key

        // 4. Extract and clean the value.
        let value = text.substring(startIndex, endIndex);
        value = value.replace(current.key, '').trim(); // Remove the key itself
        
        // Remove colon if it's the first character of the value
        if (value.startsWith(':')) {
            value = value.substring(1).trim();
        }

        results[current.key] = value;
    }
    
    // 5. Format the output string in the original desired order of primaryKeys.
    return primaryKeys
        .map(key => (results[key] ? `${key}: ${results[key].replace(/\s+/g, ' ').trim()}` : null))
        .filter(line => line !== null)
        .join('\n');
}

/**
 * The main post-processor function. It delegates to a specific parser
 * based on the template name.
 * @param {string} templateName - The name of the extraction zone.
 * @param {string} rawText - The raw text extracted from that zone.
 * @returns {string} The processed and formatted text.
 */
export function postProcessText(templateName: string, rawText: string): string {
  // Use a case-insensitive regular expression to test for keywords.
  const overviewRegex = /general|overview|정보/i; // "정보" 추가

  // Define keywords for the "General Information" / "Property Overview" section.
  const overviewKeys = [
    '주소', '준공연도', '연면적(GFA)', '빌딩규모', '기준층면적', '전용률',
    '엘리베이터', '천장고', '위치', '주차'
  ];
  
  // You can define other key sets for other templates here.
  // const rentKeys = ['층', '보증금', '임대료', '관리비'];

  if (overviewRegex.test(templateName)) {
    return parseWithKeywords(rawText, overviewKeys);
  }
  
  // Fallback for other sections, just basic cleaning for now.
  return preCleanText(rawText);
}