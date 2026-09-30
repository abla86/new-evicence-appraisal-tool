import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { normalizeDoi, doiToUrl } from "../../lib/doi.js";
import { buildJournalReference, formatAuthors } from "../../lib/apa7.js";

/**
 * Hjelpefunksjon som simulerer et nettleser-DOM-miljø basert på en reell nettsides HTML.
 * Skaper en 'document' og 'location'-kontekst som injected/collect-meta.js kan kjøre i.
 */
function createMockDomFromHtml(html, url = "https://example.com/article/1") {
  // Finn alle meta-tagger med name eller property
  const metaRegex = /<meta\s+([^>]+)>/gi;
  const metaElements = [];
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const attrStr = match[1];
    const nameMatch = attrStr.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i);
    const contentMatch = attrStr.match(/content\s*=\s*["']([^"']*)["']/i);
    if (nameMatch && contentMatch) {
      metaElements.push({
        name: nameMatch[1],
        content: contentMatch[1],
      });
    }
  }

  // Finn application/ld+json script tags
  const scriptRegex = /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const scriptElements = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptElements.push({
      textContent: match[1].trim(),
    });
  }

  const document = {
    querySelector(selector) {
      // meta[name="..."] eller meta[property="..."]
      const metaMatch = selector.match(/meta\[name="([^"]+)"\s*i\]/i);
      if (metaMatch) {
        const target = metaMatch[1].toLowerCase();
        const found = metaElements.find((m) => m.name.toLowerCase() === target);
        return found ? { content: found.content } : null;
      }
      if (selector.includes('script[type="application/ld+json"]')) {
        return scriptElements[0] || null;
      }
      return null;
    },
    querySelectorAll(selector) {
      const metaMatch = selector.match(/meta\[name="([^"]+)"\s*i\]/i);
      if (metaMatch) {
        const target = metaMatch[1].toLowerCase();
        const matches = metaElements.filter((m) => m.name.toLowerCase() === target);
        return matches.map((m) => ({ content: m.content }));
      }
      return [];
    },
  };

  const location = {
    href: url,
  };

  return { document, location };
}

/**
 * Kjører det faktiske collector-skriptet (injected/collect-meta.js) i en isolert VM-kontekst.
 */
function runCollectorOnHtml(html, url) {
  const collectorScriptPath = path.resolve("./injected/collect-meta.js");
  const collectorCode = fs.readFileSync(collectorScriptPath, "utf-8");

  const { document, location } = createMockDomFromHtml(html, url);
  const context = {
    document,
    location,
    Date,
    JSON,
    Array,
    String,
    console,
  };
  vm.createContext(context);
  const result = vm.runInContext(collectorCode, context);
  // browser.scripting.executeScript returnerer data serialisert via structured clone / JSON
  return JSON.parse(JSON.stringify(result));
}

// -----------------------------------------------------------------------------------------
// INTEGRASJONSTESTER: Full flyt fra nettside-DOM via collector til ferdig APA-referanse
// -----------------------------------------------------------------------------------------

test("Integrasjonstest: Oxford Academic (JAMIA) - Full flyt fra HTML via collector til APA 7", () => {
  // Reell HTML-kontekst fra et akademisk tidsskrift (Oxford University Press / JAMIA)
  const realOxfordAcademicHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Artificial intelligence in evidence synthesis and systematic reviews | JAMIA</title>
      
      <!-- Highwire Press / Google Scholar Citation Meta Tags -->
      <meta name="citation_title" content="Artificial intelligence in evidence synthesis and systematic reviews">
      <meta name="citation_author" content="Marshall, Iain J">
      <meta name="citation_author" content="Wallace, Byron C">
      <meta name="citation_journal_title" content="Journal of the American Medical Informatics Association">
      <meta name="citation_volume" content="30">
      <meta name="citation_issue" content="1">
      <meta name="citation_firstpage" content="12">
      <meta name="citation_lastpage" content="21">
      <meta name="citation_doi" content="https://doi.org/10.1093/jamia/ocac198">
      <meta name="citation_publication_date" content="2023/01/15">
      <meta name="citation_journal_issn" content="1527-974X">

      <!-- Fallback metadata -->
      <meta property="og:title" content="Artificial intelligence in evidence synthesis">
      <meta property="og:description" content="Overview of machine learning techniques in health research">

      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        "headline": "Artificial intelligence in evidence synthesis and systematic reviews",
        "datePublished": "2023-01-15",
        "isPartOf": {
          "@type": "Periodical",
          "name": "Journal of the American Medical Informatics Association"
        }
      }
      </script>
    </head>
    <body>
      <article>
        <h1>Artificial intelligence in evidence synthesis and systematic reviews</h1>
      </article>
    </body>
    </html>
  `;

  const pageUrl = "https://academic.oup.com/jamia/article/30/1/12/6762341";

  // Steg 1: Kjør det faktiske collector-skriptet på siden
  const collectedMetadata = runCollectorOnHtml(realOxfordAcademicHtml, pageUrl);

  // Valider at collector har ekstrahert feltene presist
  assert.equal(collectedMetadata.url, pageUrl);
  assert.equal(collectedMetadata.citation_title, "Artificial intelligence in evidence synthesis and systematic reviews");
  assert.equal(collectedMetadata.citation_journal_title, "Journal of the American Medical Informatics Association");
  assert.equal(collectedMetadata.citation_volume, "30");
  assert.equal(collectedMetadata.citation_issue, "1");
  assert.equal(collectedMetadata.citation_firstpage, "12");
  assert.equal(collectedMetadata.citation_lastpage, "21");
  assert.equal(collectedMetadata.citation_doi, "https://doi.org/10.1093/jamia/ocac198");
  assert.equal(collectedMetadata.citation_publication_date, "2023/01/15");
  assert.deepEqual(collectedMetadata.authors, [
    { family: "Marshall", given: "Iain J" },
    { family: "Wallace", given: "Byron C" },
  ]);
  assert.equal(collectedMetadata.schemaOrg["@type"], "ScholarlyArticle");

  // Steg 2: DOI-normalisering
  const doiResult = normalizeDoi(collectedMetadata.citation_doi);
  assert.equal(doiResult.ok, true);
  assert.equal(doiResult.doi, "10.1093/jamia/ocac198");
  assert.equal(doiToUrl(doiResult.doi), "https://doi.org/10.1093/jamia/ocac198");

  // Steg 3: APA 7 referansegenerering fra innhentede metadata
  const apaResult = buildJournalReference(collectedMetadata);

  assert.equal(apaResult.status, "complete", "Referansen skal ha status complete");
  assert.deepEqual(apaResult.missing, [], "Det skal ikke være noen manglende kjernefelt");

  const expectedReference =
    "Marshall, I. J. & Wallace, B. C. (2023). " +
    "Artificial intelligence in evidence synthesis and systematic reviews. " +
    "Journal of the American Medical Informatics Association, 30(1), 12–21. " +
    "https://doi.org/10.1093/jamia/ocac198";

  assert.equal(apaResult.reference, expectedReference, "Generert APA 7-referanse skal matche nøyaktig");
});

test("Integrasjonstest: BMJ / The Lancet - Multi-forfatter med 'Fornavn Etternavn' heuristikk", () => {
  // Reell HTML-kontekst der forfatternavn oppgis uten komma (f.eks. "Trisha Greenhalgh")
  const bmjStyleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="citation_title" content="Qualitative research synthesis: a guide for healthcare professionals">
      <meta name="citation_author" content="Trisha Greenhalgh">
      <meta name="citation_author" content="Jill Russell">
      <meta name="citation_author" content="David Taylor">
      <meta name="citation_journal_title" content="BMJ">
      <meta name="citation_volume" content="368">
      <meta name="citation_issue" content="8231">
      <meta name="citation_firstpage" content="m1234">
      <meta name="citation_doi" content="10.1136/bmj.m1234">
      <meta name="citation_publication_date" content="2022-04-10">
    </head>
    <body></body>
    </html>
  `;

  const pageUrl = "https://www.bmj.com/content/368/bmj.m1234";
  const collected = runCollectorOnHtml(bmjStyleHtml, pageUrl);

  // Valider at collector har splittet fornavn og etternavn korrekt
  assert.deepEqual(collected.authors, [
    { family: "Greenhalgh", given: "Trisha" },
    { family: "Russell", given: "Jill" },
    { family: "Taylor", given: "David" },
  ]);

  // Generer APA 7
  const apaResult = buildJournalReference(collected);
  assert.equal(apaResult.status, "complete");
  assert.equal(
    apaResult.reference,
    "Greenhalgh, T., Russell, J., & Taylor, D. (2022). " +
      "Qualitative research synthesis: a guide for healthcare professionals. " +
      "BMJ, 368(8231), m1234. " +
      "https://doi.org/10.1136/bmj.m1234"
  );
});

test("Integrasjonstest: Tidsskrift for Den Norske Legeforening - Norsk kontekst og case-insensitivitet", () => {
  // Reell HTML med store bokstaver i meta-navn og URL med 'doi:' prefiks
  const norskTidsskriftHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <META NAME="CITATION_TITLE" CONTENT="Kvalitativ forskningsmetode i medisinsk praksis">
      <META NAME="CITATION_AUTHOR" CONTENT="Aas, Ingrid">
      <META NAME="CITATION_JOURNAL_TITLE" CONTENT="Tidsskrift for Den Norske Legeforening">
      <META NAME="CITATION_VOLUME" CONTENT="144">
      <META NAME="CITATION_ISSUE" CONTENT="3">
      <META NAME="CITATION_FIRSTPAGE" CONTENT="201">
      <META NAME="CITATION_LASTPAGE" CONTENT="206">
      <META NAME="CITATION_DOI" CONTENT="doi: 10.4045/tidsskr.24.0123">
      <META NAME="CITATION_PUBLICATION_DATE" CONTENT="2024">
    </head>
    <body></body>
    </html>
  `;

  const pageUrl = "https://tidsskriftet.no/2024/02/kronikk/kvalitativ-forskningsmetode";
  const collected = runCollectorOnHtml(norskTidsskriftHtml, pageUrl);

  assert.equal(collected.citation_title, "Kvalitativ forskningsmetode i medisinsk praksis");
  assert.equal(collected.authors[0].family, "Aas");
  assert.equal(collected.authors[0].given, "Ingrid");

  const apaResult = buildJournalReference(collected);
  assert.equal(apaResult.status, "complete");
  assert.equal(
    apaResult.reference,
    "Aas, I. (2024). " +
      "Kvalitativ forskningsmetode i medisinsk praksis. " +
      "Tidsskrift for Den Norske Legeforening, 144(3), 201–206. " +
      "https://doi.org/10.4045/tidsskr.24.0123"
  );
});

test("Integrasjonstest: Manglende publiseringsdato og sidetall gir (u.å.) og status incomplete", () => {
  // Nettside med ufullstendige metadata (f.eks. forhåndspublikasjon)
  const preprintHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="citation_title" content="Preliminary findings on clinical decision support">
      <meta name="citation_author" content="Nordmann, Ola">
      <meta name="citation_journal_title" content="Nordic Health Informatics Preprint">
      <!-- Ingen dato og ingen sidetall -->
      <meta name="citation_doi" content="10.1101/2026.01.01.123456">
    </head>
    <body></body>
    </html>
  `;

  const pageUrl = "https://example.org/preprints/123456";
  const collected = runCollectorOnHtml(preprintHtml, pageUrl);

  const apaResult = buildJournalReference(collected);
  assert.equal(apaResult.status, "incomplete", "Skal markeres som incomplete når dato mangler");
  assert.ok(apaResult.missing.includes("citation_publication_date"), "Dato skal være i missing-listen");
  assert.ok(apaResult.reference.includes("(u.å.)"), "Uten årstall skal formatere som (u.å.)");
  assert.ok(apaResult.reference.includes("Nordmann, O. (u.å.). Preliminary findings on clinical decision support."));
  assert.ok(apaResult.reference.includes("https://doi.org/10.1101/2026.01.01.123456"));
});

test("Integrasjonstest: Robusthet mot korrupt LD+JSON og ustrukturerte nettsider", () => {
  // Sider med syntaksfeil i JSON-LD skal ikke krasje collector-skriptet
  const brokenHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="citation_title" content="Robustness under corrupted script tags">
      <meta name="citation_author" content="Test, User">
      <meta name="citation_journal_title" content="Journal of Software Testing">
      <meta name="citation_publication_date" content="2025">
      <script type="application/ld+json">
        { "not valid json" : ... oops syntax error
      </script>
    </head>
    <body></body>
    </html>
  `;

  // Skal ikke kaste unntak
  let collected;
  assert.doesNotThrow(() => {
    collected = runCollectorOnHtml(brokenHtml, "https://example.com/broken-json");
  });

  assert.equal(collected.schemaOrg, null, "Ødelagt JSON skal fanges opp og returnere null uten å krasje");
  assert.equal(collected.citation_title, "Robustness under corrupted script tags");

  const apaResult = buildJournalReference(collected);
  assert.ok(apaResult.reference.startsWith("Test, U. (2025)."));
});
