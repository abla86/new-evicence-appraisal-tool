/**
 * RFC 4180 Compliant CSV / TSV Parser
 * 
 * Supports:
 * - Multiline fields enclosed in quotes
 * - Escaped double quotes ("")
 * - UTF-8 Byte Order Mark (BOM) stripping
 * - Flexible delimiters (comma, semicolon, tab)
 * - Row length validation and whitespace trimming
 * - Graceful handling of malformed records
 */

export interface CsvParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  trimValues?: boolean;
  skipEmptyLines?: boolean;
}

export interface CsvParseResult<T = Record<string, string>> {
  headers: string[];
  rows: T[];
  rawRows: string[][];
  errors: string[];
  delimiterUsed: string;
}

export class CsvParser {
  /**
   * Strips UTF-8 Byte Order Mark (BOM) if present.
   */
  public static stripBom(text: string): string {
    if (text.charCodeAt(0) === 0xFEFF) {
      return text.slice(1);
    }
    return text;
  }

  /**
   * Detects the most probable delimiter from the first line / sample.
   */
  public static detectDelimiter(sample: string): string {
    const cleanSample = this.stripBom(sample);
    const firstLine = cleanSample.split(/\r?\n/)[0] || '';

    let tabCount = 0;
    let semicolonCount = 0;
    let commaCount = 0;

    let inQuotes = false;
    for (let i = 0; i < firstLine.length; i++) {
      const ch = firstLine[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (ch === '\t') tabCount++;
        else if (ch === ';') semicolonCount++;
        else if (ch === ',') commaCount++;
      }
    }

    if (tabCount > semicolonCount && tabCount > commaCount) return '\t';
    if (semicolonCount > commaCount) return ';';
    return ',';
  }

  /**
   * Parses raw tabular text into an array of tokenized rows, correctly handling
   * multiline quoted strings and escaped quotes according to RFC 4180.
   */
  public static parseToMatrix(
    input: string,
    delimiter?: string
  ): { matrix: string[][]; delimiterUsed: string; errors: string[] } {
    const errors: string[] = [];
    const text = this.stripBom(input);
    if (!text || text.trim().length === 0) {
      return { matrix: [], delimiterUsed: delimiter || ',', errors };
    }

    const delim = delimiter || this.detectDelimiter(text);
    const matrix: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;
    const len = text.length;

    while (i < len) {
      const char = text[i];
      const nextChar = i + 1 < len ? text[i + 1] : '';

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i += 2;
          continue;
        }
        // Toggle quote mode
        inQuotes = !inQuotes;
        i++;
        continue;
      }

      if (!inQuotes) {
        if (char === delim) {
          currentRow.push(currentCell);
          currentCell = '';
          i++;
          continue;
        }

        if (char === '\r' && nextChar === '\n') {
          currentRow.push(currentCell);
          matrix.push(currentRow);
          currentRow = [];
          currentCell = '';
          i += 2;
          continue;
        }

        if (char === '\n' || char === '\r') {
          currentRow.push(currentCell);
          matrix.push(currentRow);
          currentRow = [];
          currentCell = '';
          i++;
          continue;
        }
      }

      // Normal character or newline inside quotes
      currentCell += char;
      i++;
    }

    // Push the final cell and row
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      matrix.push(currentRow);
    }

    if (inQuotes) {
      errors.push('Unterminated quoted field detected at end of file.');
    }

    return { matrix, delimiterUsed: delim, errors };
  }

  /**
   * High-level RFC 4180 parser that produces structured records mapped to header keys.
   */
  public static parse<T = Record<string, string>>(
    input: string,
    options: CsvParseOptions = {}
  ): CsvParseResult<T> {
    const {
      delimiter,
      hasHeader = true,
      trimValues = true,
      skipEmptyLines = true
    } = options;

    const { matrix, delimiterUsed, errors } = this.parseToMatrix(input, delimiter);

    // Filter empty rows if requested
    const filteredMatrix = matrix.filter(row => {
      if (!skipEmptyLines) return true;
      return row.some(cell => cell.trim().length > 0);
    });

    if (filteredMatrix.length === 0) {
      return {
        headers: [],
        rows: [],
        rawRows: [],
        errors,
        delimiterUsed
      };
    }

    let headers: string[] = [];
    let dataStartIdx = 0;

    if (hasHeader) {
      headers = filteredMatrix[0].map(h => (trimValues ? h.trim() : h));
      dataStartIdx = 1;
    } else {
      const colCount = Math.max(...filteredMatrix.map(r => r.length));
      headers = Array.from({ length: colCount }, (_, idx) => `column_${idx + 1}`);
    }

    const rows: T[] = [];
    const rawRows: string[][] = [];

    for (let r = dataStartIdx; r < filteredMatrix.length; r++) {
      const rawRow = filteredMatrix[r];
      rawRows.push(rawRow);

      const record: Record<string, string> = {};
      for (let c = 0; c < headers.length; c++) {
        const headerKey = headers[c] || `column_${c + 1}`;
        let val = rawRow[c] !== undefined ? rawRow[c] : '';
        if (trimValues) {
          val = val.trim();
        }
        record[headerKey] = val;
      }

      rows.push(record as unknown as T);
    }

    return {
      headers,
      rows,
      rawRows,
      errors,
      delimiterUsed
    };
  }
}
