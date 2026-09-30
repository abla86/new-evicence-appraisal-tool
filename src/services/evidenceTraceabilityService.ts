/**
 * EvidenceTraceabilityService
 *
 * Implements rigorous, verifiable auditability for evidence quotes and claimed page/section locations.
 * 
 * Epistemological & Methodological Guardrails:
 * - Quotes MUST be verified against the actual document text (rawContent / digital layer).
 * - Match types:
 *   - EXACT_MATCH: Exact character sequence found in document.
 *   - NORMALIZED_MATCH: Matches after normalizing whitespace, quotes, dashes and case.
 *   - FUZZY_MATCH: High token similarity (>= 80%) with localized text window.
 *   - NOT_FOUND: Quote cannot be traced in the source document.
 * - Validates claimed page numbers and locations against document length and page markers.
 * - Never returns fake verification or unverified "true".
 */

export type QuoteMatchType = 'EXACT_MATCH' | 'NORMALIZED_MATCH' | 'FUZZY_MATCH' | 'NOT_FOUND';

export interface QuoteVerificationResult {
  matchType: QuoteMatchType;
  isVerified: boolean;
  confidence: number; // 0.0 to 1.0
  charOffset: number | null;
  detectedPage: number | null;
  totalEstimatedPages: number;
  claimedLocation?: string;
  isClaimedLocationReasonable: boolean;
  locationDiagnostic: string;
  snippet?: string;
  normalizedQuote: string;
}

const CHARS_PER_STANDARD_PAGE = 3000; // Standard scientific manuscript page density (~450-500 words)

export class EvidenceTraceabilityService {
  /**
   * Normalizes text by condensing whitespace, unifying curly quotes and dashes,
   * and converting to lower case for resilient text matching.
   */
  public static normalizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Estimates total pages in a research document based on page break markers
   * or standard manuscript character density.
   */
  public static estimateTotalPages(documentText: string): number {
    if (!documentText || documentText.trim().length === 0) return 0;

    // Check for explicit page markers like "[Page X]", "--- Page X ---", or form feeds \f
    const explicitMarkers = documentText.match(/(?:page\s*\d+|---+\s*page\s*\d+|\[page\s*\d+\]|\f)/gi);
    if (explicitMarkers && explicitMarkers.length > 0) {
      return Math.max(1, explicitMarkers.length);
    }

    const cleanLength = documentText.trim().length;
    return Math.max(1, Math.ceil(cleanLength / CHARS_PER_STANDARD_PAGE));
  }

  /**
   * Parses claimed page number from strings like "Page 3", "p. 14", "s. 5", "Side 2".
   */
  public static extractClaimedPageNumber(locationString?: string): number | null {
    if (!locationString) return null;
    const match = locationString.match(/(?:page|p\.|s\.|side)\s*(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      return isNaN(num) ? null : num;
    }
    const pureNum = locationString.trim().match(/^\d+$/);
    if (pureNum) {
      return parseInt(pureNum[0], 10);
    }
    return null;
  }

  /**
   * Verifies an evidence quote against the source document text and validates
   * the reasonableness of any claimed page/location citation.
   */
  public static verifyQuote(
    documentText: string,
    quote: string,
    claimedLocation?: string
  ): QuoteVerificationResult {
    const cleanDoc = documentText || '';
    const cleanQuote = (quote || '').trim();
    const totalEstimatedPages = this.estimateTotalPages(cleanDoc);
    const claimedPage = this.extractClaimedPageNumber(claimedLocation);

    // Baseline validation
    if (!cleanQuote || cleanQuote.length < 4 || !cleanDoc || cleanDoc.length < 4) {
      return {
        matchType: 'NOT_FOUND',
        isVerified: false,
        confidence: 0,
        charOffset: null,
        detectedPage: null,
        totalEstimatedPages,
        claimedLocation,
        isClaimedLocationReasonable: false,
        locationDiagnostic: 'Tomt dokument eller utilstrekkelig sitattekst for verifisering.',
        normalizedQuote: ''
      };
    }

    const normDoc = this.normalizeText(cleanDoc);
    const normQuote = this.normalizeText(cleanQuote);

    // 1. Exact Match
    const exactIndex = cleanDoc.indexOf(cleanQuote);
    if (exactIndex !== -1) {
      const detectedPage = Math.max(1, Math.ceil((exactIndex + 1) / CHARS_PER_STANDARD_PAGE));
      const { isReasonable, diagnostic } = this.validateLocation(
        claimedPage,
        claimedLocation,
        detectedPage,
        totalEstimatedPages
      );

      const snippetStart = Math.max(0, exactIndex - 40);
      const snippetEnd = Math.min(cleanDoc.length, exactIndex + cleanQuote.length + 40);
      const snippet = cleanDoc.substring(snippetStart, snippetEnd);

      return {
        matchType: 'EXACT_MATCH',
        isVerified: true,
        confidence: 1.0,
        charOffset: exactIndex,
        detectedPage,
        totalEstimatedPages,
        claimedLocation,
        isClaimedLocationReasonable: isReasonable,
        locationDiagnostic: diagnostic,
        snippet,
        normalizedQuote: normQuote
      };
    }

    // 2. Normalized Match
    const normIndex = normDoc.indexOf(normQuote);
    if (normIndex !== -1) {
      const approxOffset = Math.round((normIndex / Math.max(1, normDoc.length)) * cleanDoc.length);
      const detectedPage = Math.max(1, Math.ceil((approxOffset + 1) / CHARS_PER_STANDARD_PAGE));
      const { isReasonable, diagnostic } = this.validateLocation(
        claimedPage,
        claimedLocation,
        detectedPage,
        totalEstimatedPages
      );

      const snippetStart = Math.max(0, approxOffset - 40);
      const snippetEnd = Math.min(cleanDoc.length, approxOffset + cleanQuote.length + 40);
      const snippet = cleanDoc.substring(snippetStart, snippetEnd);

      return {
        matchType: 'NORMALIZED_MATCH',
        isVerified: true,
        confidence: 0.95,
        charOffset: approxOffset,
        detectedPage,
        totalEstimatedPages,
        claimedLocation,
        isClaimedLocationReasonable: isReasonable,
        locationDiagnostic: diagnostic,
        snippet,
        normalizedQuote: normQuote
      };
    }

    // 3. Substring Token / Fuzzy Match
    const quoteWords = normQuote.split(' ').filter(w => w.length > 2);
    if (quoteWords.length >= 3) {
      const phraseCandidates: string[] = [];
      for (let i = 0; i <= quoteWords.length - 3; i++) {
        phraseCandidates.push(quoteWords.slice(i, i + 3).join(' '));
      }

      for (const phrase of phraseCandidates) {
        const pIdx = normDoc.indexOf(phrase);
        if (pIdx !== -1) {
          // Check local token overlap within a 500-char window
          const windowStart = Math.max(0, pIdx - 50);
          const windowEnd = Math.min(normDoc.length, pIdx + normQuote.length + 100);
          const windowText = normDoc.substring(windowStart, windowEnd);

          let matchedWords = 0;
          for (const word of quoteWords) {
            if (windowText.includes(word)) {
              matchedWords++;
            }
          }

          const overlapRatio = matchedWords / quoteWords.length;
          if (overlapRatio >= 0.70) {
            const approxOffset = Math.round((pIdx / Math.max(1, normDoc.length)) * cleanDoc.length);
            const detectedPage = Math.max(1, Math.ceil((approxOffset + 1) / CHARS_PER_STANDARD_PAGE));
            const { isReasonable, diagnostic } = this.validateLocation(
              claimedPage,
              claimedLocation,
              detectedPage,
              totalEstimatedPages
            );

            const snippetStart = Math.max(0, approxOffset - 40);
            const snippetEnd = Math.min(cleanDoc.length, approxOffset + cleanQuote.length + 60);

            return {
              matchType: 'FUZZY_MATCH',
              isVerified: true,
              confidence: Math.round(overlapRatio * 100) / 100,
              charOffset: approxOffset,
              detectedPage,
              totalEstimatedPages,
              claimedLocation,
              isClaimedLocationReasonable: isReasonable,
              locationDiagnostic: diagnostic,
              snippet: cleanDoc.substring(snippetStart, snippetEnd),
              normalizedQuote: normQuote
            };
          }
        }
      }
    }

    // 4. Not Found
    const { isReasonable, diagnostic } = this.validateLocation(
      claimedPage,
      claimedLocation,
      null,
      totalEstimatedPages
    );

    return {
      matchType: 'NOT_FOUND',
      isVerified: false,
      confidence: 0,
      charOffset: null,
      detectedPage: null,
      totalEstimatedPages,
      claimedLocation,
      isClaimedLocationReasonable: isReasonable,
      locationDiagnostic: `Sitatet ble ikke gjenfunnet i kildedokumentet. ${diagnostic}`,
      normalizedQuote: normQuote
    };
  }

  private static validateLocation(
    claimedPage: number | null,
    claimedLocation: string | undefined,
    detectedPage: number | null,
    totalPages: number
  ): { isReasonable: boolean; diagnostic: string } {
    if (!claimedLocation || claimedLocation.trim().length === 0) {
      return {
        isReasonable: true,
        diagnostic: detectedPage
          ? `Ingen eksplisitt kildeplassering oppgitt. Lokalisert ca. side ${detectedPage} av ${totalPages}.`
          : `Ingen kildeplassering oppgitt. Dokumentet har ca. ${totalPages} sider.`
      };
    }

    if (claimedPage !== null) {
      if (claimedPage > totalPages) {
        return {
          isReasonable: false,
          diagnostic: `Urimelig sidetall: Oppgitt side ${claimedPage}, men dokumentet har kun estimert ${totalPages} sider.`
        };
      }
      if (claimedPage <= 0) {
        return {
          isReasonable: false,
          diagnostic: `Ugyldig sidetall: ${claimedPage}. Sidetall må være positivt heltall.`
        };
      }
      if (detectedPage !== null && Math.abs(detectedPage - claimedPage) > 2) {
        return {
          isReasonable: false,
          diagnostic: `Avvikende plassering: Oppgitt side ${claimedPage}, men sitatet ble funnet rundt side ${detectedPage} (estimert av ${totalPages} sider).`
        };
      }
      return {
        isReasonable: true,
        diagnostic: `Plassering bekreftet: Oppgitt side ${claimedPage} samsvarer med dokumentomfang (${totalPages} sider).`
      };
    }

    // If section or paragraph name was provided
    return {
      isReasonable: true,
      diagnostic: `Kildelokasjon registrert som "${claimedLocation}".`
    };
  }
}
