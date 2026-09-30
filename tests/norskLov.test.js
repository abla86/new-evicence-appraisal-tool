import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNorwegianLaw, formatCitation } from "../lib/norskLov.js";

test("lov med paragraf parses korrekt", () => {
  const p = parseNorwegianLaw(
    "Lov om helsepersonell m.v. (helsepersonelloven) LOV-1999-07-02-64 § 2-1"
  );
  assert.equal(p.ok, true);
  assert.equal(p.type, "lov");
  assert.equal(p.shortTitle, "helsepersonelloven");
  assert.equal(p.paraValue, "2-1");
  assert.match(p.lovdataUrl, /lovdata\.no\/dokument\/NL\/lov\/1999-07-02-64/);
});

test("forskrift klassifiseres som forskrift og parser paragraf", () => {
  const p = parseNorwegianLaw(
    "Forskrift om pasientjournal FOR-2019-03-01-168 § 4"
  );
  assert.equal(p.ok, true);
  assert.equal(p.type, "forskrift");
  assert.equal(p.shortTitle, "pasientjournal");
  assert.equal(p.paraValue, "4");
  assert.equal(p.officialId, "FOR-2019-03-01-168");
  assert.match(p.lovdataUrl, /lovdata\.no\/dokument\/NL\/forskrift\/2019-03-01-168/);
});

test("korttittel foretrekkes i sitatformat, ikke APA-år", () => {
  const p = parseNorwegianLaw(
    "Lov om pasientrettigheter (pasientrettighetsloven) LOV-1999-07-02-63"
  );
  assert.equal(formatCitation(p), "pasientrettighetsloven");
});

test("paragraf tas med i sitat", () => {
  const p = parseNorwegianLaw(
    "Lov om helsepersonell m.v. (helsepersonelloven) LOV-1999-07-02-64 § 18"
  );
  assert.equal(formatCitation(p), "helsepersonelloven § 18");
});

test("eksplisitt paragraf overstyrer parsing", () => {
  const p = parseNorwegianLaw(
    "Lov om helsepersonell m.v. (helsepersonelloven) LOV-1999-07-02-64"
  );
  assert.equal(
    formatCitation(p, { paragraph: "4" }),
    "helsepersonelloven § 4"
  );
});

test("tekst uten offisiell ID avvises", () => {
  const p = parseNorwegianLaw("helsepersonelloven § 2-1");
  assert.equal(p.ok, false);
  assert.equal(p.reason, "no-official-id");
});

test("tom inndata avvises", () => {
  assert.equal(parseNorwegianLaw("").ok, false);
  assert.equal(parseNorwegianLaw(null).ok, false);
});
