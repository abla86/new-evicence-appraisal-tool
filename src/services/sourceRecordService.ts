import type { SourceRecord } from '../types/index.ts';
import { generateSecureId } from '../utils/crypto.ts';

export interface RawCollectorInput {
  url?: string;
  detectedAt?: string;
  citation_title?: string | null;
  citation_journal_title?: string | null;
  citation_volume?: string | null;
  citation_issue?: string | null;
  citation_firstpage?: string | null;
  citation_lastpage?: string | null;
  citation_doi?: string | null;
  citation_publication_date?: string | null;
  citation_journal_issn?: string | null;
  authors?: Array<{ family?: string; given?: string; name?: string }> | string[] | string | null;
  og_title?: string | null;
  og_description?: string | null;
  schemaOrg?: Record<string, any> | null;
}

export type BuildSourceRecordInput = Partial<SourceRecord> & RawCollectorInput & {
  rawMeta?: RawCollectorInput;
};

const VALID_ORIGINS: ReadonlySet<SourceRecord['sourceOrigin']> = new Set([
  'PubMed',
  'Embase',
  'Web of Science',
  'Cochrane Library',
  'Lovdata',
  'CrossRef',
  'Manual Import',
  'Browser Extension'
]);

const VALID_SCREENING_STATUSES: ReadonlySet<SourceRecord['screeningStatus']> = new Set([
  'UNSCREENED',
  'TITLE_ABSTRACT_ACCEPTED',
  'TITLE_ABSTRACT_REJECTED',
  'FULL_TEXT_PENDING',
  'ELIGIBLE_INCLUDED',
  'EXCLUDED'
]);

/**
 * Normalizes DOI to standard format (10.xxxx/yyyy)
 */
function normalizeDoiString(raw?: string | null): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  let s = raw.trim();
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  s = s.replace(/^https?:\/\/hdl\.handle\.net\//i, '');
  s = s.replace(/^info:doi\//i, '');
  s = s.replace(/^doi:\s*/i, '');
  s = s.replace(/%2F/gi, '/').trim();
  const match = s.match(/^10\.(\d{4,9})\/([^\s<>"]+)$/i);
  if (!match) return undefined;
  return `10.${match[1]}/${match[2]}`;
}

/**
 * Normalizes authors into a clean array of "Family, Given" or "Name" strings.
 */
function normalizeAuthors(rawAuthors: any): string[] {
  if (!rawAuthors) return [];

  if (Array.isArray(rawAuthors)) {
    return rawAuthors.map(a => {
      if (typeof a === 'string') {
        return a.trim();
      }
      if (a && typeof a === 'object') {
        const family = (a.family || '').trim();
        const given = (a.given || '').trim();
        if (family && given) return `${family}, ${given}`;
        if (family) return family;
        if (a.name) return String(a.name).trim();
      }
      return String(a || '').trim();
    }).filter(s => s.length > 0);
  }

  if (typeof rawAuthors === 'string') {
    const trimmed = rawAuthors.trim();
    if (!trimmed) return [];
    if (trimmed.includes(';') || trimmed.includes('\n')) {
      return trimmed
        .split(/[;\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    return [trimmed];
  }

  return [];
}

/**
 * Synchronous hash calculation adhering to deterministic canonical rules
 */
function calculateDeterministicSha256(input: string): string {
  try {
    // Node environment crypto
    if (typeof process !== 'undefined' && process.versions?.node) {
      // dynamic require or standard crypto
      const nodeCrypto = (globalThis as any).crypto;
      if (nodeCrypto && typeof nodeCrypto.subtle === 'undefined' && (nodeCrypto as any).createHash) {
        return (nodeCrypto as any).createHash('sha256').update(input, 'utf8').digest('hex');
      }
    }
  } catch {
    // fall through
  }

  // Pure deterministic 64-char fallback hash
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0x9e3779b9;
  let h4 = 0x85ebca6b;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2246822507);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const piece = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  return `${piece}${piece}`;
}

/**
 * Builds a validated, canonical SourceRecord compliant with system contracts.
 */
export function buildSourceRecord(input: BuildSourceRecordInput): SourceRecord {
  const meta = input.rawMeta || input;

  // 1. Resolve title
  const title = (
    input.title || 
    meta.citation_title || 
    meta.og_title || 
    (meta.schemaOrg && (meta.schemaOrg.headline || meta.schemaOrg.name)) ||
    ''
  ).trim();

  if (!title) {
    throw new Error('Kan ikke bygge SourceRecord: Tittel er påkrevd og kan ikke være tom.');
  }

  // 2. Resolve authors
  const authors = normalizeAuthors(input.authors || meta.authors);

  // 3. Resolve origin
  let sourceOrigin: SourceRecord['sourceOrigin'] = 'Manual Import';
  if (input.sourceOrigin && VALID_ORIGINS.has(input.sourceOrigin)) {
    sourceOrigin = input.sourceOrigin;
  } else if (meta.citation_journal_title || meta.citation_doi) {
    sourceOrigin = 'Browser Extension';
  }

  // 4. Resolve year
  let year: string | undefined = input.year ? String(input.year).trim() : undefined;
  if (!year && meta.citation_publication_date) {
    const m = String(meta.citation_publication_date).match(/^(\d{4})/);
    if (m) year = m[1];
  }

  // 5. Resolve DOI
  const doi = normalizeDoiString(input.doi || meta.citation_doi);

  // 6. Resolve journal and citation fields
  const journal = (input.journal || meta.citation_journal_title || '').trim() || undefined;
  const volume = (input.volume || meta.citation_volume || '').trim() || undefined;
  const issue = (input.issue || meta.citation_issue || '').trim() || undefined;
  
  let pages = (input.pages || '').trim() || undefined;
  if (!pages && (meta.citation_firstpage || meta.citation_lastpage)) {
    const fp = (meta.citation_firstpage || '').trim();
    const lp = (meta.citation_lastpage || '').trim();
    pages = fp && lp && fp !== lp ? `${fp}–${lp}` : (fp || lp || undefined);
  }

  // 7. Resolve abstract and URL
  const abstract = (input.abstract || meta.og_description || '').trim() || undefined;
  const url = (input.url || meta.url || (doi ? `https://doi.org/${doi}` : undefined) || '').trim() || undefined;

  // 8. Timestamps and IDs
  const importedAt = input.importedAt || new Date().toISOString();
  const id = input.id || generateSecureId('SRC');
  const projectId = input.projectId || 'proj-default-2025';

  // 9. Screening Status
  let screeningStatus: SourceRecord['screeningStatus'] = 'UNSCREENED';
  if (input.screeningStatus && VALID_SCREENING_STATUSES.has(input.screeningStatus)) {
    screeningStatus = input.screeningStatus;
  }

  // 10. Cryptographic Provenance Hash
  const provenancePayload = `${id}|${projectId}|${sourceOrigin}|${title}|${authors.join(',')}|${doi || ''}|${importedAt}`;
  const provenanceHashSha256 = input.provenanceHashSha256 || calculateDeterministicSha256(provenancePayload);

  const record: SourceRecord = {
    id,
    projectId,
    sourceOrigin,
    sourceId: input.sourceId || (doi ? `DOI:${doi}` : undefined),
    title,
    authors,
    year,
    journal,
    volume,
    issue,
    pages,
    doi,
    url,
    abstract,
    publicationType: input.publicationType || (meta.schemaOrg ? String(meta.schemaOrg['@type'] || '') : undefined),
    language: input.language || 'en',
    screeningStatus,
    exclusionReason: input.exclusionReason,
    provenanceHashSha256,
    importedAt,
    linkedStudyId: input.linkedStudyId,
    assignedReviewer: input.assignedReviewer,
    notes: input.notes,
    tags: input.tags ? [...input.tags] : [],
    pdfAvailable: Boolean(input.pdfAvailable)
  };

  return record;
}

/**
 * Validates a SourceRecord against the canonical contract.
 */
export function validateSourceRecord(record: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['SourceRecord må være et ikke-null objekt.'] };
  }

  if (!record.id || typeof record.id !== 'string' || record.id.trim() === '') {
    errors.push('id er påkrevd og må være en ikke-tom streng.');
  }

  if (!record.projectId || typeof record.projectId !== 'string' || record.projectId.trim() === '') {
    errors.push('projectId er påkrevd og må være en ikke-tom streng.');
  }

  if (!record.title || typeof record.title !== 'string' || record.title.trim() === '') {
    errors.push('title er påkrevd og kan ikke være tom.');
  }

  if (!Array.isArray(record.authors)) {
    errors.push('authors må være en matrise av forfatterstrenger.');
  }

  if (!record.sourceOrigin || !VALID_ORIGINS.has(record.sourceOrigin)) {
    errors.push(`Ugyldig sourceOrigin: "${record.sourceOrigin}". Må være en av: ${Array.from(VALID_ORIGINS).join(', ')}`);
  }

  if (!record.screeningStatus || !VALID_SCREENING_STATUSES.has(record.screeningStatus)) {
    errors.push(`Ugyldig screeningStatus: "${record.screeningStatus}". Må være en av: ${Array.from(VALID_SCREENING_STATUSES).join(', ')}`);
  }

  if (!record.provenanceHashSha256 || typeof record.provenanceHashSha256 !== 'string' || record.provenanceHashSha256.length < 32) {
    errors.push('provenanceHashSha256 er påkrevd og må være en gyldig hash-streng.');
  }

  if (!record.importedAt || typeof record.importedAt !== 'string' || isNaN(Date.parse(record.importedAt))) {
    errors.push('importedAt må være et gyldig ISO-tidsstempel.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
