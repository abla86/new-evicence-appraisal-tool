import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDoi, doiToUrl } from "../lib/doi.js";

test("ren DOI beholdes", () => {
  assert.deepEqual(normalizeDoi("10.1000/journal.2024.001"), {
    ok: true,
    doi: "10.1000/journal.2024.001",
  });
});

test("doi.org-URL strippes", () => {
  assert.equal(
    normalizeDoi("https://doi.org/10.1234/abc.def").doi,
    "10.1234/abc.def"
  );
});

test("http-variant og dx-subdomene strippes", () => {
  assert.equal(
    normalizeDoi("http://dx.doi.org/10.5555/12345678").doi,
    "10.5555/12345678"
  );
});

test("doi:-prefiks strippes", () => {
  assert.equal(normalizeDoi("doi:10.1000/xyz").doi, "10.1000/xyz");
});

test("Case-insensitiv prefiks men form bevart", () => {
  assert.equal(
    normalizeDoi("HTTPS://DOI.ORG/10.1000/XyZ-9").doi,
    "10.1000/XyZ-9"
  );
});

test("manglende registrantnummer avvises", () => {
  assert.equal(normalizeDoi("11.1000/foo").ok, false);
});

test("tom streng avvises", () => {
  assert.equal(normalizeDoi("   ").ok, false);
  assert.equal(normalizeDoi("").ok, false);
});

test("ikke-streng avvises", () => {
  assert.equal(normalizeDoi(null).ok, false);
  assert.equal(normalizeDoi(42).ok, false);
});

test("DOI med %2F dekodes", () => {
  assert.equal(
    normalizeDoi("https://doi.org/10.1000%2Ffoo").doi,
    "10.1000/foo"
  );
});

test("doiToUrl gir korrekt lenke", () => {
  assert.equal(doiToUrl("10.1000/abc"), "https://doi.org/10.1000/abc");
});

test("doiToUrl returnerer null ved ugyldig inndata", () => {
  assert.equal(doiToUrl("ikke-en-doi"), null);
});
