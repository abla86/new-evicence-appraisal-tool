/**
 * Samler metadata fra nåværende side. Injiseres via
 * browser.scripting.executeScript på brukerens aktive fane.
 * Returnerer et flatt objekt som lib/-kjernen forventer.
 */
(() => {
  const pick = (name) => {
    const el = document.querySelector(`meta[name="${name}" i]`);
    return el ? el.content.trim() : null;
  };

  // citation_author kan forekomme flere ganger
  const authors = [...document.querySelectorAll('meta[name="citation_author" i]')]
    .map((el) => el.content.trim())
    .filter(Boolean)
    .map((raw) => {
      // Enkel heuristikk: "Etternavn, Fornavn" foretrekkes,
      // ellers "Fornavn Etternavn". Markeres alltid som detected.
      if (raw.includes(",")) {
        const [family, given] = raw.split(",");
        return { family: family.trim(), given: (given || "").trim() };
      }
      const parts = raw.split(/\s+/);
      return {
        family: parts.at(-1) || "",
        given: parts.slice(0, -1).join(" "),
      };
    });

  return {
    url: location.href,
    detectedAt: new Date().toISOString(),

    // primær: Highwire/citation-tagger
    citation_title: pick("citation_title"),
    citation_journal_title: pick("citation_journal_title"),
    citation_volume: pick("citation_volume"),
    citation_issue: pick("citation_issue"),
    citation_firstpage: pick("citation_firstpage"),
    citation_lastpage: pick("citation_lastpage"),
    citation_doi: pick("citation_doi"),
    citation_publication_date: pick("citation_publication_date"),
    citation_journal_issn: pick("citation_journal_issn"),
    authors,

    // fallback: OpenGraph og schema.org
    og_title: pick("og:title"),
    og_description: pick("og:description"),

    schemaOrg: (() => {
      const el = document.querySelector('script[type="application/ld+json"]');
      if (!el) return null;
      try {
        return JSON.parse(el.textContent || "null");
      } catch {
        return null; // ødelagt JSON er data, ikke feil
      }
    })(),
  };
})();
