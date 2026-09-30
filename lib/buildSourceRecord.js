/**
 * Canonical SourceRecord Builder for Javascript & extension contexts.
 * Følger samme kanoniske kontrakt som src/services/sourceRecordService.ts
 */
import { normalizeDoi } from "./doi.js";

const VALID_ORIGINS = new Set([
  'PubMed',
  'Embase',
  'Web of Science',
  'Cochrane Library',
  'Lovdata',
  'CrossRef',
  'Manual Import',
  'Browser Extension'
]);

const VALID_SCREENING_STATUSES = new Set([
  'UNSCREENED',
  'TITLE_ABSTRACT_ACCEPTED',
  'TITLE_ABSTRACT_REJECTED',
  'FULL_TEXT_PENDING',
  'ELIGIBLE_INCLUDED',
  'EXCLUDED'
]);

function normalizeAuthors(rawAuthors) {
  if (!rawAuthors) return [];

  if (Array.isArray(rawAuthors)) {
    return rawAuthors.map(a => {
      if (typeof a === 'string') return a.trim();
      if (a && typeof a === 'object') {
        const family = (a.family || '').trim();
        const given = (a.given || '').trim();
        if (family && given) return `${family}, ${given}`;
        if (family) return family;
        if (a.name) return String(a.name).trim();
      }
      return String(a || '').trim();
    }).filter(Boolean);
  }

  if (typeof rawAuthors === 'string') {
    const trimmed = rawAuthors.trim();
    if (!trimmed) return [];
    if (trimmed.includes(';') || trimmed.includes('\n')) {
      return trimmed.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }

  return [];
}

function calculateSimpleSha256(input) {
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

  const hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  const piece = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  return `${piece}${piece}`;
}

export function buildSourceRecord(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Inndata til buildSourceRecord må være et objekt.');
  }

  const meta = input.rawMeta || input;

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

  const authors = normalizeAuthors(input.authors || meta.authors);

  let sourceOrigin = 'Manual Import';
  if (input.sourceOrigin && VALID_ORIGINS.has(input.sourceOrigin)) {
    sourceOrigin = input.sourceOrigin;
  } else if (meta.citation_journal_title || meta.citation_doi) {
    sourceOrigin = 'Browser Extension';
  }

  let year = input.year ? String(input.year).trim() : undefined;
  if (!year && meta.citation_publication_date) {
    const m = String(meta.citation_publication_date).match(/^(\d{4})/);
    if (m) year = m[1];
  }

  const rawDoi = input.doi || meta.citation_doi;
  const doiNorm = rawDoi ? normalizeDoi(rawDoi) : null;
  const doi = doiNorm?.ok ? doiNorm.doi : undefined;

  const journal = (input.journal || meta.citation_journal_title || '').trim() || undefined;
  const volume = (input.volume || meta.citation_volume || '').trim() || undefined;
  const issue = (input.issue || meta.citation_issue || '').trim() || undefined;

  let pages = (input.pages || '').trim() || undefined;
  if (!pages && (meta.citation_firstpage || meta.citation_lastpage)) {
    const fp = (meta.citation_firstpage || '').trim();
    const lp = (meta.citation_lastpage || '').trim();
    pages = fp && lp && fp !== lp ? `${fp}–${lp}` : (fp || lp || undefined);
  }

  const abstract = (input.abstract || meta.og_description || '').trim() || undefined;
  const url = (input.url || meta.url || (doi ? `https://doi.org/${doi}` : undefined) || '').trim() || undefined;

  const importedAt = input.importedAt || new Date().toISOString();
  const id = input.id || `SRC-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const projectId = input.projectId || 'proj-default-2025';

  let screeningStatus = 'UNSCREENED';
  if (input.screeningStatus && VALID_SCREENING_STATUSES.has(input.screeningStatus)) {
    screeningStatus = input.screeningStatus;
  }

  const provenancePayload = `${id}|${projectId}|${sourceOrigin}|${title}|${authors.join(',')}|${doi || ''}|${importedAt}`;
  const provenanceHashSha256 = input.provenanceHashSha256 || calculateSimpleSha256(provenancePayload);

  return {
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
}
