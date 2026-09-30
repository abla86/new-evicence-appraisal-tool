/**
 * APA 7-referansegenerering. Deterministisk, lokal, uten nettverk.
 * Importerer kun på lib/doi.js.
 */
import { normalizeDoi, doiToUrl } from "./doi.js";

/**
 * Formatterer forfattere etter APA 7 standard:
 * - 1 forfatter: "Hansen, K."
 * - 2 forfattere: "Hansen, K. & Olsen, P. A."
 * - 3–20 forfattere: "A, B., C, D., & E, F."
 * - 21+ forfattere: Første 19 forfattere, etterfulgt av ellipsis (...), og siste forfatter uten ampersand.
 */
export function formatAuthors(authors) {
  // authors: array av { family, given }
  if (!authors || !Array.isArray(authors) || authors.length === 0) return null;

  const formatSingle = (a) => {
    if (!a) return '';
    const family = (a.family || '').trim();
    const initials = (a.given || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((g) => `${g[0].toUpperCase()}.`)
      .join(" ");
    return initials ? `${family}, ${initials}` : family;
  };

  const formatted = authors.map(formatSingle).filter(Boolean);
  if (formatted.length === 0) return null;

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`;

  // APA 7: Ved 21 eller flere forfattere tas de første 19 med,
  // deretter ellipsis (...), og til slutt den aller siste forfatteren uten "&".
  if (formatted.length >= 21) {
    const first19 = formatted.slice(0, 19).join(", ");
    const lastAuthor = formatted[formatted.length - 1];
    return `${first19}, ... ${lastAuthor}`;
  }

  // 3 til 20 forfattere: komma mellom alle og ", & " før den siste
  return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1];
}

export function yearFromCitationDate(dateStr) {
  // citation_publication_date er typisk "2023/05/12", "2023-05-12" eller "2023"
  if (!dateStr) return null;
  const m = String(dateStr).match(/^(\d{4})/);
  return m ? m[1] : null;
}

/**
 * Genererer en APA 7 journalartikkel-referanse.
 * meta: { authors, citation_title, citation_journal_title,
 *         citation_volume, citation_issue, citation_firstpage,
 *         citation_lastpage, citation_doi, citation_publication_date }
 *
 * Returnerer { status, reference|null, missing[] } der status er
 * "complete" | "incomplete" | "unverifiable".
 */
export function buildJournalReference(meta) {
  if (!meta || typeof meta !== "object") {
    return { status: "unverifiable", reference: null, missing: ["metadata"] };
  }

  const missing = [];
  const title = meta.citation_title?.trim();
  const journal = meta.citation_journal_title?.trim();
  const authors = formatAuthors(meta.authors);
  const year = yearFromCitationDate(meta.citation_publication_date);

  if (!title) missing.push("citation_title");
  if (!journal) missing.push("citation_journal_title");
  if (!authors) missing.push("citation_author");
  if (!year) missing.push("citation_publication_date");

  if (!title && !authors) {
    return { status: "unverifiable", reference: null, missing };
  }

  const doi = meta.citation_doi ? normalizeDoi(meta.citation_doi) : null;
  if (meta.citation_doi && !doi?.ok) missing.push("citation_doi");

  const authorPart = authors ? `${authors} ` : "";
  const yearPart = year ? `(${year}). ` : "(u.å.). ";
  const titlePart = `${title ?? "[Uten tittel]"}. `;
  const journalPart = journal ? `${journal}` : "";

  let volIssuePages = "";
  if (meta.citation_volume) {
    volIssuePages += `, ${meta.citation_volume}`;
    if (meta.citation_issue) volIssuePages += `(${meta.citation_issue})`;
  }
  if (meta.citation_firstpage) {
    volIssuePages += meta.citation_lastpage
      ? `, ${meta.citation_firstpage}–${meta.citation_lastpage}`
      : `, ${meta.citation_firstpage}`;
  }

  const doiPart = doi?.ok ? ` https://doi.org/${doi.doi}` : "";

  const reference = `${authorPart}${yearPart}${titlePart}${journalPart}${volIssuePages}.${doiPart}`.trim();

  return {
    status: missing.length === 0 ? "complete" : "incomplete",
    reference,
    missing,
  };
}
