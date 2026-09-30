/**
 * Parser og formatterer norske lov- og forskriftshenvisninger.
 * Følger norsk praksis og Lovdata-standard (ikke amerikansk APA-tilpasning).
 */

const ID_REGEX = /\b(LOV|FOR)-(\d{4})-(\d{2})-(\d{2})-(\d+)\b/i;
const PARA_REGEX = /§\s*([\d\w-]+)/i;

export function parseNorwegianLaw(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, reason: "empty" };
  }

  const idMatch = text.match(ID_REGEX);
  if (!idMatch) return { ok: false, reason: "no-official-id" };

  const [, kind, year, month, day, number] = idMatch;
  const type = kind.toUpperCase() === "LOV" ? "lov" : "forskrift";

  // Tittel = tekst fram til offisiell ID
  let head = text.slice(0, idMatch.index).trim().replace(/[.,]$/, "");
  const paren = head.match(/\(([^)]+)\)\s*$/);
  const shortTitle = paren 
    ? paren[1].trim() 
    : head.replace(/^(Lov|Forskrift)\s+om\s+/i, "").replace(/\s+m\.v\.$/i, "").trim();
  const paraValue = text.match(PARA_REGEX)?.[1] ?? null;

  return {
    ok: true,
    type,
    officialId: idMatch[0],
    shortTitle,
    paraValue,
    lovdataUrl: `https://lovdata.no/dokument/NL/${type}/${year}-${month}-${day}-${number}`,
  };
}

/** 
 * Norsk form: "helsepersonelloven § 2-1" – aldri APA-forfatterår. 
 */
export function formatCitation(parsed, { paragraph = null } = {}) {
  if (!parsed?.ok) return null;
  const para = paragraph ?? parsed.paraValue;
  const name = parsed.shortTitle || parsed.type;
  return para ? `${name} § ${para}` : name;
}
