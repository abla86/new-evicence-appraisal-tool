import { test } from "node:test";
import assert from "node:assert/strict";
import { buildJournalReference, formatAuthors } from "../lib/apa7.js";

const baseMeta = {
  authors: [
    { family: "Hansen", given: "Kari" },
    { family: "Olsen", given: "Per Arne" },
  ],
  citation_title: "Effekt av tiltak X",
  citation_journal_title: "Norsk Tidsskrift for Forskning",
  citation_volume: "12",
  citation_issue: "3",
  citation_firstpage: "45",
  citation_lastpage: "58",
  citation_doi: "10.1000/abc.123",
  citation_publication_date: "2023/05/12",
};

test("fullstendige metadata gir status complete", () => {
  const r = buildJournalReference(baseMeta);
  assert.equal(r.status, "complete");
  assert.deepEqual(r.missing, []);
});

test("referanse følger APA 7-form", () => {
  const { reference } = buildJournalReference(baseMeta);
  assert.equal(
    reference,
    "Hansen, K. & Olsen, P. A. (2023). Effekt av tiltak X. " +
      "Norsk Tidsskrift for Forskning, 12(3), 45–58. " +
      "https://doi.org/10.1000/abc.123"
  );
});

test("flere enn to forfattere: komma + & før siste", () => {
  const r = buildJournalReference({
    ...baseMeta,
    authors: [
      { family: "A", given: "B" },
      { family: "C", given: "D" },
      { family: "E", given: "F" },
    ],
  });
  assert.match(r.reference, /^A, B\., C, D\., & E, F\./);
});

test("21 eller flere forfattere: 19 første, ellipsis (...), og siste forfatter uten &", () => {
  // Opprett liste med 25 forfattere
  const twentyFiveAuthors = Array.from({ length: 25 }, (_, i) => ({
    family: `Author${i + 1}`,
    given: `Init${i + 1}`,
  }));

  const formatted = formatAuthors(twentyFiveAuthors);
  assert.ok(formatted.includes("Author1, I."));
  assert.ok(formatted.includes("Author19, I."));
  assert.ok(formatted.includes("... Author25, I."));
  assert.ok(!formatted.includes("Author20"));
  assert.ok(!formatted.includes("& Author25"));
});

test("mangler dato: '(u.å.)' brukes og status incomplete", () => {
  const { status, reference, missing } = buildJournalReference({
    ...baseMeta,
    citation_publication_date: undefined,
  });
  assert.equal(status, "incomplete");
  assert.ok(missing.includes("citation_publication_date"));
  assert.match(reference, /\(u\.å\.\)/);
});

test("ugyldig DOI flagges i missing", () => {
  const r = buildJournalReference({ ...baseMeta, citation_doi: "ikke-doi" });
  assert.equal(r.status, "incomplete");
  assert.ok(r.missing.includes("citation_doi"));
});

test("ingen tittel og ingen forfatter: unverifiable, ingen referanse", () => {
  const r = buildJournalReference({});
  assert.equal(r.status, "unverifiable");
  assert.equal(r.reference, null);
});
