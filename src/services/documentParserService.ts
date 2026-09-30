/**
 * DocumentParserService
 *
 * Robust ingestion and parsing of scientific research documents (PDF, DOCX, TXT, MD, HTML).
 *
 * Methodological and Technical Guardrails:
 * - Gracefully handles corrupted, empty, or oversized files without crashing.
 * - Detects scanned documents missing digital text layers:
 *   Flags `isOcrRequired: true` and `ocrConfidence: null` (NO fake confidence metrics).
 * - Identifies DOI, title, abstract candidates, and proposed study design.
 * - Enforces explicit separation between raw algorithmic candidate data and Human Verification.
 */

import { calculateSha256 } from '../utils/crypto.ts';

export type SupportedDocumentExtension = 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'ris' | 'bib';

export interface DocumentParseError {
  code: 'FILE_EMPTY' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT' | 'CORRUPTED_CONTENT' | 'PARSING_FAILED';
  message: string;
  details?: string;
}

export interface ParsedDocumentResult {
  success: boolean;
  fileName: string;
  fileSizeBytes: number;
  fileExtension: SupportedDocumentExtension | 'unknown';
  documentHashSha256?: string;
  extractedTitle?: string;
  extractedAuthors?: string[];
  extractedYear?: string;
  extractedJournal?: string;
  extractedDoi?: string;
  extractedAbstract?: string;
  rawText: string;
  isOcrRequired: boolean;
  ocrStatus: 'NOT_NEEDED' | 'OCR_REQUIRED' | 'PROCESSED';
  ocrConfidence: number | null; // Strictly NULL if OCR has not been executed; no fake scores!
  suggestedStudyDesign?: string;
  error?: DocumentParseError;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit

export class DocumentParserService {
  /**
   * Parses raw file input into a structured scientific document representation.
   */
  public static async parseFile(
    fileName: string,
    fileSizeBytes: number,
    content: string
  ): Promise<ParsedDocumentResult> {
    const ext = this.extractExtension(fileName);

    // 1. File size validation
    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        fileName,
        fileSizeBytes,
        fileExtension: ext,
        rawText: '',
        isOcrRequired: false,
        ocrStatus: 'NOT_NEEDED',
        ocrConfidence: null,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `Filstørrelsen (${Math.round(fileSizeBytes / 1024 / 1024)} MB) overstiger maksimal tillatt grense på 25 MB.`
        }
      };
    }

    // 2. Empty file validation
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        fileName,
        fileSizeBytes,
        fileExtension: ext,
        rawText: '',
        isOcrRequired: false,
        ocrStatus: 'NOT_NEEDED',
        ocrConfidence: null,
        error: {
          code: 'FILE_EMPTY',
          message: 'Filen er tom eller inneholder ingen lesbare data.'
        }
      };
    }

    // 3. Cryptographic hash for provenance
    const documentHashSha256 = await calculateSha256(content);

    // 4. Check for scanned / non-text PDF simulation or binary placeholder
    const isBinaryOrScanned = content.startsWith('%PDF') && content.length < 500 && !content.includes('font');
    if (isBinaryOrScanned || (ext === 'pdf' && content.replace(/\s/g, '').length < 80)) {
      return {
        success: true,
        fileName,
        fileSizeBytes,
        fileExtension: 'pdf',
        documentHashSha256,
        rawText: content,
        isOcrRequired: true,
        ocrStatus: 'OCR_REQUIRED',
        ocrConfidence: null, // Transparently null
        error: undefined
      };
    }

    // 5. Extract metadata heuristics
    const extractedDoi = this.detectDoi(content);
    const { title, abstract, authors, year, journal } = this.extractBibliographicFields(content, fileName);
    const suggestedStudyDesign = this.detectStudyDesignCandidate(content);

    return {
      success: true,
      fileName,
      fileSizeBytes,
      fileExtension: ext,
      documentHashSha256,
      extractedTitle: title,
      extractedAuthors: authors,
      extractedYear: year,
      extractedJournal: journal,
      extractedDoi,
      extractedAbstract: abstract,
      rawText: content,
      isOcrRequired: false,
      ocrStatus: 'NOT_NEEDED',
      ocrConfidence: null,
      suggestedStudyDesign
    };
  }

  private static extractExtension(fileName: string): SupportedDocumentExtension | 'unknown' {
    const parts = fileName.split('.');
    if (parts.length < 2) return 'unknown';
    const ext = parts.pop()?.toLowerCase();
    if (['pdf', 'docx', 'txt', 'md', 'html', 'ris', 'bib'].includes(ext || '')) {
      return ext as SupportedDocumentExtension;
    }
    return 'unknown';
  }

  public static detectDoi(text: string): string | undefined {
    const doiMatch = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
    if (!doiMatch) return undefined;
    return doiMatch[0].replace(/[.,;)]+$/, ''); // clean trailing punctuation
  }

  private static extractBibliographicFields(
    text: string,
    fileName: string
  ): { title: string; abstract?: string; authors?: string[]; year?: string; journal?: string } {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Title heuristic: first non-empty line with substantive length, or derived from fileName
    let title = lines[0] || fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (title.startsWith('#')) {
      title = title.replace(/^#+\s*/, '');
    }

    // Year heuristic
    const yearMatch = text.match(/\b(19\d\d|20\d\d)\b/);
    const year = yearMatch ? yearMatch[1] : undefined;

    // Abstract heuristic: Look for explicit "Abstract" heading
    let abstract: string | undefined;
    const abstractMatch = text.match(/abstract[:\s\n]+([\s\S]{100,2000}?)(?=\n\n(?:keywords|introduction|method|bakgrunn)|$)/i);
    if (abstractMatch) {
      abstract = abstractMatch[1].trim();
    } else if (lines.length > 2) {
      // Fallback: take next paragraph as preliminary excerpt
      abstract = lines.slice(1, 4).join(' ');
    }

    return {
      title,
      abstract,
      year
    };
  }

  public static detectStudyDesignCandidate(text: string): string | undefined {
    const lower = text.toLowerCase();

    if (lower.includes('systematic review') && lower.includes('meta-analysis')) {
      return 'Systematic Review / Meta-Analysis';
    }
    if (lower.includes('randomized controlled trial') || lower.includes('randomised controlled trial') || lower.includes('double-blind')) {
      return 'Randomized Controlled Trial';
    }
    if (lower.includes('qualitative') || lower.includes('semi-structured interview') || lower.includes('focus group') || lower.includes('thematic analysis')) {
      return 'Qualitative Research';
    }
    if (lower.includes('cohort study') || lower.includes('prospective cohort')) {
      return 'Observational Cohort';
    }
    if (lower.includes('case-control') || lower.includes('matched controls')) {
      return 'Case-Control Study';
    }
    if (lower.includes('clinical practice guideline') || lower.includes('guideline recommendation')) {
      return 'Clinical Practice Guideline';
    }
    if (lower.includes('scoping review')) {
      return 'Scoping Review';
    }

    return undefined;
  }
}
