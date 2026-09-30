import { normalizeDoi } from "../lib/doi.js";
import { buildJournalReference } from "../lib/apa7.js";
import { parseNorwegianLaw, formatCitation } from "../lib/norskLov.js";

const STATUS_LABELS = {
  complete: { text: "Komplett kladd", cls: "status-complete" },
  incomplete: { text: "Ufullstendig – mangler felt", cls: "status-incomplete" },
  unverifiable: { text: "Kan ikke verifiseres lokalt", cls: "status-unverifiable" },
};

async function inspectCurrentTab() {
  // Støtt både browser (Firefox) og chrome (Chromium) API
  const browserApi = typeof browser !== "undefined" ? browser : chrome;
  if (!browserApi?.tabs?.query) {
    throw new Error("utvidelsesmiljo-mangler");
  }

  const [tab] = await browserApi.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("ingen-aktiv-fane");

  const results = await browserApi.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["injected/collect-meta.js"],
  });

  const meta = results?.[0]?.result;
  if (!meta) throw new Error("ingen-metadata-returnert");
  return meta;
}

export function render(meta) {
  const out = document.getElementById("results");
  if (!out) return;

  // 1. DOI-status
  const doiEl = document.getElementById("doi-result");
  const norm = meta.citation_doi ? normalizeDoi(meta.citation_doi) : null;
  if (doiEl) {
    if (norm?.ok) {
      doiEl.textContent = `DOI funnet: ${norm.doi} (formell gyldighet kontrollert lokalt – ikke bekreftet online)`;
    } else if (meta.citation_doi) {
      doiEl.textContent = `DOI funnet, men ugyldig format: ${meta.citation_doi}`;
    } else {
      doiEl.textContent = "Ingen DOI oppdaget.";
    }
  }

  // 2. APA 7-kladd via felles kjerne
  const result = buildJournalReference(meta);
  const refEl = document.getElementById("apa-output");
  const badgeEl = document.getElementById("apa-status");

  if (refEl) {
    if (result.reference) {
      refEl.textContent = result.reference;
    } else {
      refEl.textContent = "Utilstrekkelig metadata for kladd.";
    }
  }

  if (badgeEl) {
    const statusKey = (result.status || "").toLowerCase();
    const info = STATUS_LABELS[statusKey] || { text: result.status, cls: "status-unverifiable" };
    badgeEl.textContent = info.text;
    badgeEl.className = `badge ${info.cls}`;
    if (result.missing && result.missing.length > 0) {
      badgeEl.dataset.missing = result.missing.join(", ");
      badgeEl.title = `Mangler: ${result.missing.join(", ")}`;
    } else {
      badgeEl.removeAttribute("data-missing");
      badgeEl.removeAttribute("title");
    }
  }

  // 3. Norsk lov/forskrift – sjekk tittel eller OpenGraph
  const lawEl = document.getElementById("law-result");
  const lawSource = meta.citation_title || meta.og_title || "";
  const parsed = lawSource ? parseNorwegianLaw(lawSource) : null;
  if (lawEl) {
    lawEl.textContent =
      parsed?.ok ? formatCitation(parsed) : "Ingen lov/forskrifts-ID oppdaget.";
  }

  // 4. Kopi-knapp – eksportér alltid sammen med status
  const btn = document.getElementById("copy-apa");
  if (btn) {
    btn.disabled = !result.reference;
    btn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(
          `[Status: ${result.status}] ${result.reference ?? ""}`
        );
        btn.textContent = "Kopiert!";
        setTimeout(() => {
          btn.textContent = "Kopier APA 7-kladd";
        }, 1500);
      } catch {
        btn.textContent = "Kopiering feilet";
      }
    };
  }

  out.hidden = false;
}

function showError(err) {
  const errEl = document.getElementById("error");
  if (!errEl) return;
  errEl.textContent =
    err.message === "ingen-aktiv-fane" || err.message === "ingen-metadata-returnert"
      ? "Kunne ikke analysere denne siden. Er den lastet ferdig?"
      : err.message === "utvidelsesmiljo-mangler"
      ? "Utvidelsesmiljø (browser.tabs / browser.scripting) er ikke tilgjengelig i vanlig fanevisning."
      : `Feil: ${err.message}`;
  errEl.hidden = false;
}

const inspectBtn = document.getElementById("inspect");
if (inspectBtn) {
  inspectBtn.addEventListener("click", async () => {
    const errEl = document.getElementById("error");
    if (errEl) errEl.hidden = true;
    try {
      render(await inspectCurrentTab());
    } catch (err) {
      showError(err);
    }
  });
}
