/**
 * DOI-normalisering og -validering.
 * Ren funksjonell modul – ingen DOM, ingen nettverk.
 */

const DOI_REGEX = /^10\.(\d{4,9})\/([^\s<>"]+)$/i;

const DOI_URL_PREFIXES = [
  /^https?:\/\/(dx\.)?doi\.org\//i,
  /^https?:\/\/hdl\.handle\.net\//i,
  /^info:doi\//i,
];

/**
 * Normaliserer enhver DOI-variant til kanonisk form:
 * "10.1234/foo.bar" (uten prefiks eller URL).
 *
 * Returnerer { ok: true, doi } eller { ok: false, reason }.
 */
export function normalizeDoi(input) {
  if (typeof input !== "string") {
    return { ok: false, reason: "not-a-string" };
  }

  let s = input.trim();

  // Strip vanlige URL-/prefiksformer
  for (const prefix of DOI_URL_PREFIXES) {
    s = s.replace(prefix, "");
  }
  s = s.replace(/^doi:\s*/i, "").trim();

  // Fjern URL-encoding av skråstrek som noen sider produserer
  s = s.replace(/%2F/gi, "/");

  if (s === "") {
    return { ok: false, reason: "empty" };
  }

  const match = s.match(DOI_REGEX);
  if (!match) {
    return { ok: false, reason: "invalid-syntax" };
  }

  // Kanonisk form: form-bevarende på suffix, standard registrant
  const doi = `10.${match[1]}/${match[2]}`;

  return { ok: true, doi };
}

/**
 * Bygger resolver-URL fra en allerede normalisert DOI.
 */
export function doiToUrl(doi) {
  const norm = normalizeDoi(doi);
  if (!norm.ok) return null;
  return `https://doi.org/${norm.doi}`;
}
