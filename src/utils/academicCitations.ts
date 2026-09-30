/**
 * Academic Citation & Legal Parsing Adapter
 * Bridges pure ES-modules from /lib (doi.js, apa7.js, norskLov.js)
 * with TypeScript interfaces for the React UI and Evidence Synthesis Studio.
 */

// @ts-ignore
import { normalizeDoi, doiToUrl } from '../../lib/doi.js';
// @ts-ignore
import { buildJournalReference, formatAuthors, yearFromCitationDate } from '../../lib/apa7.js';
// @ts-ignore
import { parseNorwegianLaw, formatCitation } from '../../lib/norskLov.js';

export interface AuthorMeta {
  family: string;
  given?: string;
}

export interface JournalCitationMeta {
  authors?: AuthorMeta[];
  citation_title?: string;
  citation_journal_title?: string;
  citation_volume?: string | number;
  citation_issue?: string | number;
  citation_firstpage?: string | number;
  citation_lastpage?: string | number;
  citation_doi?: string;
  citation_publication_date?: string;
}

export interface Apa7ReferenceResult {
  status: 'complete' | 'incomplete' | 'unverifiable';
  reference: string | null;
  missing: string[];
}

export interface NorwegianLawResult {
  ok: boolean;
  type?: 'lov' | 'forskrift';
  officialId?: string;
  shortTitle?: string;
  paraValue?: string | null;
  lovdataUrl?: string;
  reason?: string;
}

export function generateApa7Reference(meta: JournalCitationMeta): Apa7ReferenceResult {
  return buildJournalReference(meta) as Apa7ReferenceResult;
}

export function normalizeAcademicDoi(doi: string): { ok: boolean; doi?: string; reason?: string } {
  return normalizeDoi(doi);
}

export function academicDoiToUrl(doi: string): string | null {
  return doiToUrl(doi);
}

export function parseLaw(text: string): NorwegianLawResult {
  return parseNorwegianLaw(text) as NorwegianLawResult;
}

export function formatLawCitation(parsed: NorwegianLawResult, options?: { paragraph?: string }): string | null {
  return formatCitation(parsed, options as any);
}

export { formatAuthors, yearFromCitationDate };
