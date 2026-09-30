import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDoi, doiToUrl } from "../lib/doi.js";
import { buildJournalReference } from "../lib/apa7.js";
import { parseNorwegianLaw, formatCitation } from "../lib/norskLov.js";

test("integrasjonstest: realistisk collector-output gir komplett APA 7 og gyldig DOI", () => {
  // Simulert resultat fra injected/collect-meta.js
  const collectorResult = {
    url: "https://academic.oup.com/jamia/article/30/1/12/6762341",
    detectedAt: "2026-09-02T10:30:00.000Z",
    citation_title: "Artificial intelligence in evidence synthesis and systematic reviews",
    citation_journal_title: "Journal of the American Medical Informatics Association",
    citation_volume: "30",
    citation_issue: "1",
    citation_firstpage: "12",
    citation_lastpage: "21",
    citation_doi: "https://doi.org/10.1093/jamia/ocac198",
    citation_publication_date: "2023/01/15",
    citation_journal_issn: "1527-974X",
    authors: [
      { family: "Marshall", given: "Iain J" },
      { family: "Wallace", given: "Byron C" }
    ],
    og_title: "Artificial intelligence in evidence synthesis",
    og_description: "Overview of machine learning techniques in health research",
    schemaOrg: {
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      "headline": "Artificial intelligence in evidence synthesis and systematic reviews"
    }
  };

  // 1. DOI normalisering fra collector
  const doiNorm = normalizeDoi(collectorResult.citation_doi);
  assert.equal(doiNorm.ok, true);
  assert.equal(doiNorm.doi, "10.1093/jamia/ocac198");
  assert.equal(doiToUrl(doiNorm.doi), "https://doi.org/10.1093/jamia/ocac198");

  // 2. APA 7 generering fra collector
  const refResult = buildJournalReference(collectorResult);
  assert.equal(refResult.status, "complete");
  assert.deepEqual(refResult.missing, []);
  assert.equal(
    refResult.reference,
    "Marshall, I. J. & Wallace, B. C. (2023). " +
      "Artificial intelligence in evidence synthesis and systematic reviews. " +
      "Journal of the American Medical Informatics Association, 30(1), 12–21. " +
      "https://doi.org/10.1093/jamia/ocac198"
  );
});

test("integrasjonstest: collector-output med manglende felt gir incomplete status og mangelliste", () => {
  const incompleteCollectorResult = {
    url: "https://example.org/preprint/123",
    detectedAt: "2026-09-02T10:30:00.000Z",
    citation_title: "Foreløpig observasjonsstudie",
    citation_journal_title: null,
    citation_volume: null,
    citation_issue: null,
    citation_firstpage: null,
    citation_lastpage: null,
    citation_doi: "10.5555/preprint.999",
    citation_publication_date: null,
    authors: [{ family: "Nordmann", given: "Ola" }],
    og_title: "Foreløpig observasjonsstudie",
    og_description: null,
    schemaOrg: null
  };

  const refResult = buildJournalReference(incompleteCollectorResult);
  assert.equal(refResult.status, "incomplete");
  assert.ok(refResult.missing.includes("citation_publication_date"));
  assert.ok(refResult.missing.includes("citation_journal_title"));
  // Likevel genereres best-effort kladd med (u.å.)
  assert.ok(refResult.reference.includes("Nordmann, O. (u.å.). Foreløpig observasjonsstudie."));
});

test("integrasjonstest: collector-output med norsk lovtekst fanges opp og formateres", () => {
  const lawCollectorResult = {
    url: "https://lovdata.no/dokument/NL/lov/1999-07-02-64",
    detectedAt: "2026-09-02T10:30:00.000Z",
    citation_title: "Lov om helsepersonell m.v. (helsepersonelloven) LOV-1999-07-02-64 § 21",
    og_title: "Helsepersonelloven",
    citation_doi: null,
    authors: []
  };

  const parsed = parseNorwegianLaw(lawCollectorResult.citation_title);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.shortTitle, "helsepersonelloven");
  assert.equal(parsed.officialId, "LOV-1999-07-02-64");
  assert.equal(parsed.paraValue, "21");
  assert.equal(formatCitation(parsed), "helsepersonelloven § 21");
  assert.equal(parsed.lovdataUrl, "https://lovdata.no/dokument/NL/lov/1999-07-02-64");
});
