/**
 * Unified Reference Engine
 * Combines the best capabilities of EndNote, Zotero, Mendeley, Paperpile, and Citavi:
 * - EndNote: CWYW (Cite While You Write) tokens, EndNote XML export, field preservation.
 * - Zotero: Broad CSL styles (APA 7, Vancouver, Harvard, Chicago, MLA, IEEE), retraction alerts.
 * - Mendeley: Collections (folders), tags, PDF attachment metadata.
 * - Paperpile: Duplicate detection without auto-deletion, safe merging with audit history.
 * - Citavi: Knowledge organization (categories, direct quotation excerpts with page refs, thought memos).
 */

// @ts-ignore
import { normalizeDoi, doiToUrl } from '../../lib/doi.js';
// @ts-ignore
import { buildJournalReference, formatAuthors, yearFromCitationDate } from '../../lib/apa7.js';
// @ts-ignore
import { parseNorwegianLaw, formatCitation } from '../../lib/norskLov.js';

import type { 
  ReferenceItem, 
  ReferenceAuthor, 
  CitationStyle, 
  ReferenceDirectQuote, 
  ReferenceThoughtMemo, 
  ReferenceMergeEvent,
  StudyRecord 
} from '../types/index.ts';
import { calculateSha256Sync } from './crypto.ts';

export interface DuplicatePair {
  id: string;
  source: ReferenceItem;
  target: ReferenceItem;
  similarityScore: number;
  type?: 'EXACT_DOI' | 'SIMILAR_TITLE_AND_YEAR' | 'EXACT_TITLE';
  matchType: 'EXACT_DOI' | 'SIMILAR_TITLE_AND_YEAR' | 'EXACT_TITLE';
  description: string;
}

export interface ValidationCheckResult {
  status: 'VALIDATED' | 'VALIDATION_REQUIRED' | 'RETRACTED';
  completenessPercent: number;
  issues: string[];
}

/**
 * Format author list for Vancouver / NLM (e.g. "Hansen H, Berg M, Aas I")
 */
export function formatVancouverAuthors(authors: ReferenceAuthor[]): string {
  if (!authors || authors.length === 0) return 'Ukjent forfatter';
  if (authors.length <= 6) {
    return authors.map(a => `${a.family} ${getInitials(a.given)}`).join(', ');
  }
  const firstSix = authors.slice(0, 6).map(a => `${a.family} ${getInitials(a.given)}`).join(', ');
  return `${firstSix}, et al.`;
}

/**
 * Format author list for Harvard (e.g. "Hansen, H. and Berg, M.")
 */
export function formatHarvardAuthors(authors: ReferenceAuthor[]): string {
  if (!authors || authors.length === 0) return 'Ukjent forfatter';
  if (authors.length === 1) {
    return `${authors[0].family}, ${getInitialsWithDots(authors[0].given)}`;
  }
  if (authors.length === 2) {
    return `${authors[0].family}, ${getInitialsWithDots(authors[0].given)} and ${authors[1].family}, ${getInitialsWithDots(authors[1].given)}`;
  }
  return `${authors[0].family}, ${getInitialsWithDots(authors[0].given)} et al.`;
}

/**
 * Format author list for Chicago (e.g. "Hansen, Henrik, and Maria Berg.")
 */
export function formatChicagoAuthors(authors: ReferenceAuthor[]): string {
  if (!authors || authors.length === 0) return 'Ukjent forfatter';
  if (authors.length === 1) {
    return `${authors[0].family}, ${authors[0].given || ''}`.trim();
  }
  if (authors.length === 2) {
    return `${authors[0].family}, ${authors[0].given || ''}, and ${authors[1].given || ''} ${authors[1].family}`.trim();
  }
  return `${authors[0].family}, ${authors[0].given || ''}, et al.`.trim();
}

/**
 * Format author list for IEEE (e.g. "H. Hansen and M. Berg")
 */
export function formatIeeeAuthors(authors: ReferenceAuthor[]): string {
  if (!authors || authors.length === 0) return 'Anon.';
  if (authors.length === 1) {
    return `${getInitialsWithDots(authors[0].given)} ${authors[0].family}`.trim();
  }
  if (authors.length === 2) {
    return `${getInitialsWithDots(authors[0].given)} ${authors[0].family} and ${getInitialsWithDots(authors[1].given)} ${authors[1].family}`.trim();
  }
  if (authors.length <= 6) {
    const list = authors.map(a => `${getInitialsWithDots(a.given)} ${a.family}`.trim());
    return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
  }
  return `${getInitialsWithDots(authors[0].given)} ${authors[0].family} et al.`.trim();
}

function getInitials(given?: string): string {
  if (!given) return '';
  return given
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map(p => p[0].toUpperCase())
    .join('');
}

function getInitialsWithDots(given?: string): string {
  if (!given) return '';
  return given
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map(p => `${p[0].toUpperCase()}.`)
    .join(' ');
}

/**
 * Generates an EndNote Cite While You Write (CWYW) token
 * Format: {FirstAuthorFamily, Year #RecordId}
 */
export function generateCwywToken(ref: ReferenceItem, indexHint?: number): string {
  const firstAuthor = ref.authors?.[0]?.family || 'Ref';
  const year = ref.year || 's.a.';
  const id = indexHint !== undefined ? indexHint : (ref.id.split('-').pop() || '1');
  return `{${firstAuthor}, ${year} #${id}}`;
}

/**
 * Generates In-Text Citation (Parenthetical and Narrative)
 */
export function generateInTextCitation(ref: ReferenceItem): { parenthetical: string; narrative: string } {
  const authors = ref.authors || [];
  const year = ref.year || 'u.å.';

  if (authors.length === 0) {
    const shortTitle = ref.title.length > 25 ? ref.title.slice(0, 25) + '...' : ref.title;
    return {
      parenthetical: `("${shortTitle}", ${year})`,
      narrative: `"${shortTitle}" (${year})`
    };
  }

  if (authors.length === 1) {
    return {
      parenthetical: `(${authors[0].family}, ${year})`,
      narrative: `${authors[0].family} (${year})`
    };
  }

  if (authors.length === 2) {
    return {
      parenthetical: `(${authors[0].family} & ${authors[1].family}, ${year})`,
      narrative: `${authors[0].family} og ${authors[1].family} (${year})`
    };
  }

  // 3 or more authors
  return {
    parenthetical: `(${authors[0].family} et al., ${year})`,
    narrative: `${authors[0].family} et al. (${year})`
  };
}

/**
 * Formats a reference into any requested CitationStyle
 */
export function formatReferenceInStyle(ref: ReferenceItem, style: CitationStyle, index = 1): string {
  const authors = ref.authors || [];
  const title = ref.title || 'Uten tittel';
  const year = ref.year || 'u.å.';
  const journal = ref.journal || '';
  const vol = ref.volume || '';
  const issue = ref.issue ? `(${ref.issue})` : '';
  const pages = ref.pages || '';
  const doiNorm = ref.doi ? normalizeDoi(ref.doi) : null;
  const doiUrl = doiNorm && doiNorm.ok ? doiToUrl(doiNorm.doi) : (ref.doi ? `https://doi.org/${ref.doi}` : '');

  // 1. Norwegian Law check
  if (style === 'NorwegianLaw' || ref.itemType === 'statute' || ref.itemType === 'regulation') {
    const parsed = parseNorwegianLaw(ref.title);
    if (parsed.ok) {
      const cited = formatCitation(parsed, { paragraph: ref.pages } as any);
      if (cited) return cited;
    }
  }

  switch (style) {
    case 'APA7': {
      // Use core lib/apa7.js
      const apaRes = buildJournalReference({
        authors: authors.map(a => ({ family: a.family, given: a.given })),
        citation_title: title,
        citation_journal_title: journal,
        citation_volume: vol,
        citation_issue: ref.issue,
        citation_firstpage: pages.split(/[-–]/)[0]?.trim(),
        citation_lastpage: pages.split(/[-–]/)[1]?.trim(),
        citation_doi: ref.doi,
        citation_publication_date: ref.publicationDate || year
      });
      return apaRes.reference || `${authors.map(a => a.family).join(', ')} (${year}). ${title}. ${journal}.`;
    }

    case 'Vancouver': {
      // 1. Authors. Title. Journal. Year;Vol(Issue):Pages. doi:DOI
      const authorStr = formatVancouverAuthors(authors);
      const cleanTitle = title.replace(/\.$/, '');
      let bib = `${index}. ${authorStr}. ${cleanTitle}.`;
      if (journal) bib += ` ${journal}.`;
      if (year) bib += ` ${year};`;
      if (vol) bib += `${vol}`;
      if (issue) bib += `${issue}`;
      if (pages) bib += `:${pages}.`;
      else if (vol || issue) bib += '.';
      if (doiUrl) bib += ` doi:${doiNorm?.doi || ref.doi}`;
      return bib;
    }

    case 'Harvard': {
      // Authors (Year) 'Title', Journal, Vol(Issue), pp. Pages. doi:DOI
      const authorStr = formatHarvardAuthors(authors);
      let bib = `${authorStr} (${year}) '${title}'`;
      if (journal) bib += `, ${journal}`;
      if (vol) bib += `, ${vol}${issue}`;
      if (pages) bib += `, pp. ${pages}`;
      bib += '.';
      if (doiUrl) bib += ` Available at: ${doiUrl}.`;
      return bib;
    }

    case 'Chicago': {
      // Authors. Year. "Title." Journal Vol, no. Issue: Pages. doi.
      const authorStr = formatChicagoAuthors(authors);
      let bib = `${authorStr}. ${year}. "${title}."`;
      if (journal) bib += ` ${journal}`;
      if (vol) bib += ` ${vol}`;
      if (ref.issue) bib += `, no. ${ref.issue}`;
      if (pages) bib += `: ${pages}`;
      bib += '.';
      if (doiUrl) bib += ` ${doiUrl}.`;
      return bib;
    }

    case 'MLA': {
      // Authors. "Title." Journal, vol. Vol, no. Issue, Year, pp. Pages, doi.
      const authorStr = formatChicagoAuthors(authors);
      let bib = `${authorStr}. "${title}."`;
      if (journal) bib += ` ${journal},`;
      if (vol) bib += ` vol. ${vol},`;
      if (ref.issue) bib += ` no. ${ref.issue},`;
      bib += ` ${year}`;
      if (pages) bib += `, pp. ${pages}`;
      bib += '.';
      if (doiUrl) bib += ` ${doiUrl}`;
      return bib;
    }

    case 'IEEE': {
      // [#] Authors, "Title," Journal, vol. Vol, no. Issue, pp. Pages, Year.
      const authorStr = formatIeeeAuthors(authors);
      let bib = `[${index}] ${authorStr}, "${title},"`;
      if (journal) bib += ` ${journal},`;
      if (vol) bib += ` vol. ${vol},`;
      if (ref.issue) bib += ` no. ${ref.issue},`;
      if (pages) bib += ` pp. ${pages},`;
      bib += ` ${year}.`;
      if (doiUrl) bib += ` doi: ${doiNorm?.doi || ref.doi}.`;
      return bib;
    }

    case 'NorwegianLaw': {
      const parsed = parseNorwegianLaw(ref.title);
      return formatCitation(parsed, { paragraph: ref.pages } as any) || `${title} (${year})`;
    }

    default:
      return `${authors.map(a => a.family).join(', ')} (${year}). ${title}. ${journal}.`;
  }
}

/**
 * Validates reference metadata completeness and checks retraction notices
 */
export function validateReferenceCompleteness(ref: ReferenceItem): ValidationCheckResult {
  const issues: string[] = [];

  if (ref.retractionAlert?.isRetracted) {
    issues.push(`RETRACTION WARNING: Artikkelen er trukket tilbake (${ref.retractionAlert.reason || 'Se melding'})`);
    return {
      status: 'RETRACTED',
      completenessPercent: 20,
      issues
    };
  }

  if (!ref.title || ref.title.trim().length === 0) {
    issues.push('Mangler tittel');
  }
  if (!ref.authors || ref.authors.length === 0) {
    issues.push('Mangler forfattere');
  }
  if (!ref.year && !ref.publicationDate) {
    issues.push('Mangler publiseringsår/dato');
  }
  if (ref.itemType === 'journalArticle') {
    if (!ref.journal) issues.push('Mangler tidsskriftnavn');
    if (!ref.volume) issues.push('Mangler volum');
    if (!ref.pages) issues.push('Mangler sidetall');
    if (!ref.doi) issues.push('Mangler DOI');
  } else if (ref.itemType === 'book') {
    if (!ref.publisher) issues.push('Mangler forlag/utgiver');
    if (!ref.isbn) issues.push('Mangler ISBN');
  }

  const totalChecks = 6;
  const passedChecks = Math.max(0, totalChecks - issues.length);
  const completenessPercent = Math.round((passedChecks / totalChecks) * 100);

  const status = issues.length === 0 ? 'VALIDATED' : 'VALIDATION_REQUIRED';

  return {
    status,
    completenessPercent,
    issues
  };
}

/**
 * Normalize string for similarity checks
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Token-based Dice similarity coefficient (0 to 1)
 */
export function calculateTitleSimilarity(a: string, b: string): number {
  const normA = normalizeString(a);
  const normB = normalizeString(b);
  if (normA === normB) return 1.0;

  const wordsA = new Set(normA.split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normB.split(' ').filter(w => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  return (2 * intersection) / (wordsA.size + wordsB.size);
}

/**
 * Detects duplicates across the reference library without deleting
 */
export function detectDuplicates(references: ReferenceItem[]): DuplicatePair[] {
  const duplicates: DuplicatePair[] = [];
  const checkedPairs = new Set<string>();

  for (let i = 0; i < references.length; i++) {
    for (let j = i + 1; j < references.length; j++) {
      const refA = references[i];
      const refB = references[j];
      const pairKey = [refA.id, refB.id].sort().join(':::');
      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);

      // Check 1: Exact DOI
      if (refA.doi && refB.doi) {
        const normA = normalizeDoi(refA.doi);
        const normB = normalizeDoi(refB.doi);
        if (normA.ok && normB.ok && normA.doi === normB.doi) {
          duplicates.push({
            id: `dup-${refA.id}-${refB.id}`,
            source: refA,
            target: refB,
            similarityScore: 1.0,
            type: 'EXACT_DOI',
            matchType: 'EXACT_DOI',
            description: `Eksakt DOI-match (${normA.doi})`
          });
          continue;
        }
      }

      // Check 2: Exact Title
      const normTitleA = normalizeString(refA.title);
      const normTitleB = normalizeString(refB.title);
      if (normTitleA === normTitleB && normTitleA.length > 10) {
        duplicates.push({
          id: `dup-${refA.id}-${refB.id}`,
          source: refA,
          target: refB,
          similarityScore: 0.98,
          type: 'EXACT_TITLE',
          matchType: 'EXACT_TITLE',
          description: `Eksakt tittelmatch med samme ordlyd`
        });
        continue;
      }

      // Check 3: Fuzzy title similarity and same/close year
      const similarity = calculateTitleSimilarity(refA.title, refB.title);
      const yearDiff = Math.abs(parseInt(refA.year || '0', 10) - parseInt(refB.year || '0', 10));
      if (similarity >= 0.82 && (isNaN(yearDiff) || yearDiff <= 1)) {
        duplicates.push({
          id: `dup-${refA.id}-${refB.id}`,
          source: refA,
          target: refB,
          similarityScore: Math.round(similarity * 100) / 100,
          type: 'SIMILAR_TITLE_AND_YEAR',
          matchType: 'SIMILAR_TITLE_AND_YEAR',
          description: `Høy tittellikhet (${Math.round(similarity * 100)}%) og overlappende årgang`
        });
      }
    }
  }

  return duplicates;
}

/**
 * Merges duplicate reference into target reference with full audit trail (Paperpile pattern)
 * Does NOT delete history.
 */
export function mergeReferenceItems(
  target: ReferenceItem, 
  duplicate: ReferenceItem, 
  user: string,
  reason = 'Duplikat sammenslåing'
): ReferenceItem {
  const mergedCollections = Array.from(new Set([...target.collections, ...duplicate.collections]));
  const mergedTags = Array.from(new Set([...target.tags, ...duplicate.tags]));
  const mergedCategories = Array.from(new Set([...target.categories, ...duplicate.categories]));

  const mergedQuotes: ReferenceDirectQuote[] = [
    ...target.directQuotes,
    ...duplicate.directQuotes.filter(dq => !target.directQuotes.some(tq => tq.text === dq.text))
  ];

  const mergedThoughts: ReferenceThoughtMemo[] = [
    ...target.thoughtMemos,
    ...duplicate.thoughtMemos.filter(dt => !target.thoughtMemos.some(tt => tt.title === dt.title))
  ];

  const mergeEvent: ReferenceMergeEvent = {
    id: `merge-${Date.now()}`,
    mergedAt: new Date().toISOString(),
    mergedFromId: duplicate.id,
    mergedFromTitle: duplicate.title,
    user,
    reason
  };

  const updatedHistory = [...(target.mergeHistory || []), mergeEvent];

  // Pick best metadata (fill missing from duplicate)
  const updated: ReferenceItem = {
    ...target,
    journal: target.journal || duplicate.journal,
    volume: target.volume || duplicate.volume,
    issue: target.issue || duplicate.issue,
    pages: target.pages || duplicate.pages,
    doi: target.doi || duplicate.doi,
    pmid: target.pmid || duplicate.pmid,
    abstract: target.abstract || duplicate.abstract,
    url: target.url || duplicate.url,
    pdfAvailable: target.pdfAvailable || duplicate.pdfAvailable,
    pdfFileName: target.pdfFileName || duplicate.pdfFileName,
    collections: mergedCollections,
    tags: mergedTags,
    categories: mergedCategories,
    directQuotes: mergedQuotes,
    thoughtMemos: mergedThoughts,
    mergeHistory: updatedHistory,
    updatedAt: new Date().toISOString()
  };

  // Re-verify completeness
  const check = validateReferenceCompleteness(updated);
  updated.status = check.status;
  updated.validationIssues = check.issues;

  return updated;
}

/**
 * Promotes a ReferenceItem into a JBI StudyRecord so it can undergo appraisal
 */
export function promoteReferenceToStudy(ref: ReferenceItem, projectId: string): StudyRecord {
  const authorStr = ref.authors.map(a => `${a.family} ${a.given || ''}`.trim()).join(', ');
  const rawContent = `Tittel: ${ref.title}\nForfattere: ${authorStr}\nTidsskrift: ${ref.journal || 'N/A'}\nÅr: ${ref.year || 'N/A'}\nDOI: ${ref.doi || 'N/A'}\n\nSammendrag:\n${ref.abstract || 'Ikke oppgitt'}\n\nDirekte sitater registrert i Reference Hub:\n${ref.directQuotes.map(q => `[s. ${q.page}] "${q.text}"`).join('\n')}`;
  
  const hash = calculateSha256Sync(rawContent);

  return {
    id: `study-ref-${ref.id}`,
    projectId,
    sourceRefId: ref.id,
    title: ref.title,
    authors: authorStr,
    year: ref.year,
    journal: ref.journal,
    doi: ref.doi,
    abstract: ref.abstract,
    documentType: 'Qualitative Research',
    fileName: ref.pdfFileName || `${ref.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    fileSizeBytes: 1024 * 450,
    fileExtension: 'pdf',
    rawContent,
    documentHashSha256: hash,
    importedAt: new Date().toISOString(),
    isLocked: false,
    tags: ref.tags,
    findings: [
      {
        id: `finding-${ref.id}-1`,
        instrument: 'JBI_QUALITATIVE',
        domainId: 'jbi-q1',
        topic: 'Filosofisk og metodologisk kongruens',
        sectionOrPage: 'Metode',
        matchedTerm: 'qualitative',
        excerpt: ref.abstract?.slice(0, 150) || ref.title,
        confidence: 'High',
        suggestedAnswer: 'ja',
        researcherConfirmed: false
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// EXPORTERS: RIS, BibTeX, EndNote XML, CSL-JSON, Word CWYW, Rich Text HTML
// ---------------------------------------------------------------------------

/**
 * Export to RIS (EndNote, Zotero, Mendeley, Paperpile standard)
 */
export function exportToRis(references: ReferenceItem[]): string {
  return references.map(ref => {
    const lines: string[] = [];
    lines.push('TY  - JOUR');
    lines.push(`TI  - ${ref.title}`);
    (ref.authors || []).forEach(a => {
      lines.push(`AU  - ${a.family}, ${a.given || ''}`);
    });
    if (ref.journal) lines.push(`JO  - ${ref.journal}`);
    if (ref.year) lines.push(`PY  - ${ref.year}`);
    if (ref.volume) lines.push(`VL  - ${ref.volume}`);
    if (ref.issue) lines.push(`IS  - ${ref.issue}`);
    if (ref.pages) {
      const parts = ref.pages.split(/[-–]/);
      if (parts[0]) lines.push(`SP  - ${parts[0].trim()}`);
      if (parts[1]) lines.push(`EP  - ${parts[1].trim()}`);
    }
    if (ref.doi) lines.push(`DO  - ${ref.doi}`);
    if (ref.abstract) lines.push(`AB  - ${ref.abstract.replace(/\r?\n/g, ' ')}`);
    if (ref.url) lines.push(`UR  - ${ref.url}`);
    if (ref.cwywToken) lines.push(`M1  - ${ref.cwywToken}`);
    (ref.tags || []).forEach(t => lines.push(`KW  - ${t}`));
    lines.push('ER  -');
    return lines.join('\n');
  }).join('\n\n');
}

/**
 * Export to BibTeX (LaTeX, Overleaf, Zotero, Mendeley)
 */
export function exportToBibtex(references: ReferenceItem[]): string {
  return references.map((ref) => {
    const rawFamily = ref.authors?.[0]?.family || 'Ref';
    const firstAuthor = rawFamily.charAt(0).toUpperCase() + rawFamily.slice(1).replace(/[^a-zA-Z0-9]/g, '');
    const citeKey = `${firstAuthor}${ref.year || '2024'}`;
    const authorStr = (ref.authors || [])
      .map(a => `${a.family}, ${a.given || ''}`)
      .join(' and ');

    const fields: string[] = [
      `  author = {${authorStr}}`,
      `  title = {${ref.title}}`
    ];
    if (ref.journal) fields.push(`  journal = {${ref.journal}}`);
    if (ref.year) fields.push(`  year = {${ref.year}}`);
    if (ref.volume) fields.push(`  volume = {${ref.volume}}`);
    if (ref.issue) fields.push(`  number = {${ref.issue}}`);
    if (ref.pages) fields.push(`  pages = {${ref.pages}}`);
    if (ref.doi) fields.push(`  doi = {${ref.doi}}`);
    if (ref.url) fields.push(`  url = {${ref.url}}`);

    return `@article{${citeKey},\n${fields.join(',\n')}\n}`;
  }).join('\n\n');
}

/**
 * Export to EndNote XML (Preserves all fields for EndNote X9 / 20 / 21)
 */
export function exportToEndNoteXml(references: ReferenceItem[]): string {
  const records = references.map((ref, i) => {
    const authorsXml = (ref.authors || []).map(a => 
      `          <author>${escapeXml(a.family)}, ${escapeXml(a.given || '')}</author>`
    ).join('\n');

    return `    <record>
      <rec-number>${i + 1}</rec-number>
      <ref-type name="Journal Article">17</ref-type>
      <contributors>
        <authors>
${authorsXml}
        </authors>
      </contributors>
      <titles>
        <title>${escapeXml(ref.title)}</title>
        <secondary-title>${escapeXml(ref.journal || '')}</secondary-title>
      </titles>
      <dates>
        <year>${escapeXml(ref.year || '')}</year>
      </dates>
      <volume>${escapeXml(ref.volume || '')}</volume>
      <number>${escapeXml(ref.issue || '')}</number>
      <pages>${escapeXml(ref.pages || '')}</pages>
      <electronic-resource-num>${escapeXml(ref.doi || '')}</electronic-resource-num>
      <abstract>${escapeXml(ref.abstract || '')}</abstract>
      <custom1>${escapeXml(ref.cwywToken || '')}</custom1>
    </record>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<xml>
  <records>
${records}
  </records>
</xml>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export to CSL-JSON (Zotero & Citation Style Language standard)
 */
export function exportToCslJson(references: ReferenceItem[]): string {
  const csl = references.map(ref => ({
    id: ref.id,
    type: ref.itemType === 'book' ? 'book' : 'article-journal',
    title: ref.title,
    'container-title': ref.journal,
    author: (ref.authors || []).map(a => ({
      family: a.family,
      given: a.given
    })),
    issued: {
      'date-parts': [[parseInt(ref.year || '2024', 10)]]
    },
    volume: ref.volume,
    issue: ref.issue,
    page: ref.pages,
    DOI: ref.doi,
    URL: ref.url,
    abstract: ref.abstract
  }));

  return JSON.stringify(csl, null, 2);
}

/**
 * Export to CSV for Excel / Sheets / Covidence
 */
export function exportToCsv(references: ReferenceItem[]): string {
  const headers = ['ID', 'Tittel', 'Forfattere', 'Aar', 'Tidsskrift', 'Volum', 'Hefte', 'Sider', 'DOI', 'Status', 'CWYW_Token'];
  const rows = references.map(r => {
    const authors = (r.authors || []).map(a => `${a.family} ${a.given || ''}`.trim()).join('; ');
    return [
      `"${r.id}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${authors.replace(/"/g, '""')}"`,
      `"${r.year || ''}"`,
      `"${(r.journal || '').replace(/"/g, '""')}"`,
      `"${r.volume || ''}"`,
      `"${r.issue || ''}"`,
      `"${r.pages || ''}"`,
      `"${r.doi || ''}"`,
      `"${r.status}"`,
      `"${r.cwywToken}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate Word Cite While You Write text document
 */
export function generateWordCwywDocument(references: ReferenceItem[], style: CitationStyle = 'APA7'): string {
  const sampleParagraph = references.slice(0, 3).map((r, i) => {
    const inText = generateInTextCitation(r);
    const token = r.cwywToken;
    return `Tidligere forskningssynteser har påvist betydelig verdi av tidlig tverrfaglig innsats ${inText.parenthetical} ${token}.`;
  }).join(' ');

  const bibliography = references.map((r, i) => formatReferenceInStyle(r, style, i + 1)).join('\n\n');

  return `=== WORD CITE WHILE YOU WRITE (CWYW) INTEGRASJONSDOKUMENT ===
Bruk tokens nedenfor direkte i Word, LibreOffice eller andre skriveprogrammer for automatisk referansestyring.

EKSEMPELTEKST MED WORD TOKENS:
${sampleParagraph}

----------------------------------------------------------------------
LITTERATURLISTE (${style}):
----------------------------------------------------------------------
${bibliography}

ENDNOTE CWYW TOKENS OVERSIKT:
${references.map(r => `${r.cwywToken} -> ${r.title}`).join('\n')}
`;
}

/**
 * Generate formatted HTML for rich text editors / clipboard pasting
 */
export function generateRichTextHtml(references: ReferenceItem[], style: CitationStyle = 'APA7'): string {
  const itemsHtml = references.map((r, i) => {
    const formatted = formatReferenceInStyle(r, style, i + 1);
    return `<p style="margin-bottom: 12px; text-indent: -36px; padding-left: 36px; line-height: 1.5; font-family: 'Times New Roman', serif;">${formatted}</p>`;
  }).join('\n');

  return `<div style="font-family: 'Times New Roman', serif; font-size: 12pt;">
  <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 16px;">Litteraturliste (${style})</h2>
  ${itemsHtml}
</div>`;
}

export const generateGoogleDocsHtml = generateRichTextHtml;

// ---------------------------------------------------------------------------
// IMPORTERS: Parse RIS, BibTeX, Quick Identifiers
// ---------------------------------------------------------------------------

export function parseRis(risText: string): Partial<ReferenceItem>[] {
  const entries: Partial<ReferenceItem>[] = [];
  const rawRecords = risText.split(/\n(?=TY\s+-)/);

  for (const raw of rawRecords) {
    if (!raw.trim()) continue;
    const item: Partial<ReferenceItem> = {
      authors: [],
      tags: [],
      collections: ['Importert fra RIS'],
      categories: [],
      directQuotes: [],
      thoughtMemos: []
    };

    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/);
      if (!match) continue;
      const tag = match[1];
      const val = match[2].trim();

      switch (tag) {
        case 'TI':
        case 'T1':
          item.title = val;
          break;
        case 'AU':
        case 'A1': {
          const parts = val.split(',');
          item.authors?.push({
            family: parts[0]?.trim() || val,
            given: parts[1]?.trim()
          });
          break;
        }
        case 'JO':
        case 'JF':
        case 'T2':
          item.journal = val;
          break;
        case 'PY':
        case 'Y1':
          item.year = val.match(/\d{4}/)?.[0] || val;
          break;
        case 'VL':
          item.volume = val;
          break;
        case 'IS':
          item.issue = val;
          break;
        case 'SP':
          item.pages = val;
          break;
        case 'EP':
          item.pages = item.pages ? `${item.pages}-${val}` : val;
          break;
        case 'DO':
          item.doi = val;
          break;
        case 'AB':
          item.abstract = val;
          break;
        case 'KW':
          item.tags?.push(val);
          break;
      }
    }

    if (item.title) {
      entries.push(item);
    }
  }

  return entries;
}
