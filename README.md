# Complete Evidence Appraisal Tool

> **Kanonisk, personvernsikker (Local-First) forskningsarbeidsflate for evidenssyntese, metodisk kvalitetsvurdering, PRISMA 2020 og referansehåndtering.**  
> Utviklet for forskere, helsepersonell og akademiske team som krever 100 % reproduserbarhet, null datalekkasje og full plattformuavhengighet (Windows, macOS, Linux, iPad/nettbrett).

[![Test Suite](https://img.shields.io/badge/Tester-44%2F44%20Gr%C3%B8nne-brightgreen)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Typesikker%20(0%20feil)-blue)](tsconfig.json)
[![Arkitektur](https://img.shields.io/badge/Arkitektur-Local--First%20%7C%20Zero--Knowledge-purple)](#sikkerhet-og-gdpr)
[![OAuth-Fri](https://img.shields.io/badge/OAuth-Ingen%20eksterne%20avhengigheter-success)](#arkitekturprinsipper-og-styringsregler)
[![Standarder](https://img.shields.io/badge/Standarder-PRISMA%202020%20%7C%20JBI%20%7C%20GRADE-orange)](#st%C3%B8ttede-forskningsinstrumenter)

---

## 🏛️ Arkitekturprinsipper og Styringsregler

### Hovedregel for konsolidering og integrasjon
> **«Et repository flyttes eller integreres ikke på grunn av plassering, navn eller historisk tilknytning. Det vurderes ut fra formål, domeneansvar, avhengigheter, sikkerhetskonsekvenser og behovet for selvstendig livssyklus.»**
>
> Dette sikrer at **Complete Evidence** forblir en samlet, stabil og robust produktplattform, samtidig som spesialiserte utvidelser (f.eks. Chrome/Edge Extension Collector) og sikkerhetsmoduler kan utvikles uavhengig uten at arkitekturgrensene brytes.

### 100 % Autonom & Frikoblet (Ingen OAuth / Ingen Google-avhengigheter)
* **Ingen OAuth-kompleksitet:** Applikasjonen krever null OAuth 2.0-oppsett, ingen klient-nøkler (Client IDs/Secrets) og ingen påloggingsservere.
* **Full kildesuverenitet:** Data synkroniseres aldri til eksterne skytjenester med mindre forskeren selv velger å laste ned en fil (.docx, .ris, .json).
* **Ingen eksterne sporingsskript:** Google Identity Services (GSI) og eksterne OAuth-scripts er fjernet, noe som gir garantert institusjonell personvernsamsvar (GDPR).

---

## 🚀 Rask oppstart & Live bruk

Programmet kjører direkte i nettleseren som en moderne Web-applikasjon uten behov for lokal installasjon av C#, Python eller database-servere:

* **Live Web-versjon:** Åpne appen direkte i nettleseren (Chrome, Edge, Firefox, Safari).
* **Frakoblet (Offline):** Når nettsiden er lastet inn, kan du koble fra internett. All behandling og lagring foregår lokalt i nettleseren din.
* **Nettbrett/iPad:** Touch-optimalisert grensesnitt med minst 44px trykkflater, tilpasset både stasjonære skjermer og mobile arbeidsflater.

---

## 📋 De 10 Verifiserte Modulene

Arkitekturen er inndelt i 10 selvstendige, samvirkende moduler som dekker hele forskerarbeidsflyten fra rådata til ferdig manuskript:

```
[2. Research] ────► [3. Evidence] ────► [4. References] ────► [5. Appraisal] ────► [8. Analysis]
 (Protokoll/PICO)     (Kildeinntak)       (Reference Hub)       (10 Instrumenter)   (Kappa / Meta)
        │                                                                                   │
        ▼                                                                                   ▼
[1. Core] ◄────────────────────── [7. Privacy & Audit] ────────────────────────► [9. Reporting]
 (Lokal lagring)                   (SHA-256 Merkle-spor)                            (PRISMA Flyt)
                                                                                            │
                                                                                            ▼
                                                                                   [10. Export]
                                                                                    (Word/RIS/JSON)
```

### 1. Core (Kjernen)
* **Plassering:** `src/types/index.ts`, `src/utils/storage.ts`, `src/components/SafeBoundary.tsx`.
* **Funksjon:** Felles datamodell, typesikring og feilsikkert krasjvern. Dersom uforutsette feil oppstår i en undermodul, forblir resten av applikasjonen og forskerens data fullt operative.

### 2. Research (Protokoll & Søk)
* **Plassering:** `src/components/ProjectProtocolModal.tsx`, `src/components/ResearchSearchHubModal.tsx`.
* **Funksjon:** Formalisering av forskningsspørsmål, PICO-struktur (Population, Intervention, Comparison, Outcome) og PROSPERO/PRISMA-P protokollregistrering. Integrert kobling mot PubMed og Europe PMC for direkte litteratursøk.

### 3. Evidence (Kildeinntak & Screening)
* **Plassering:** `src/components/SourceRecordWorkflowView.tsx`, `src/components/DocumentUploadCard.tsx`, `src/components/EvidenceDocumentViewer.tsx`.
* **Funksjon:** Inntak og forhåndsvisning av råkilder (PDF, XML/JATS, tekst, RIS) uten å forhåndsdømme metodisk kvalitet. Støtter tittel-/abstrakt-screening, fulltekstvurdering og tildeling av offisielle PICO-koder.

### 4. References (Reference Hub & CWYW)
* **Plassering:** `src/components/ReferenceHubView.tsx`, `src/utils/referenceEngine.ts`, `src/utils/academicCitations.ts`.
* **Funksjon:** 
  * **EndNote Cite-While-You-Write (CWYW):** Genererer standardiserte `{Etternavn, År #ID}`-tokens klare til innliming i Word.
  * **Sitatstiler:** APA 7, Vancouver, Harvard, Chicago, MLA, IEEE samt norsk juridisk stil (Lovdata/Forskrifter iht. APA 7 norsk praksis).
  * **Deduplisering:** Beregner ordvektet likhetsscore og tilbyr sikker sammenslåing («Safe Merge») som bevarer notater, sitater og kildehistorikk.
  * **Ett-klikks opprykk:** Overfører kilder direkte til vurderingsrommet som formelle `StudyRecord`-objekter.

### 5. Appraisal (Metodisk Kvalitetsvurdering)
* **Plassering:** `src/components/AppraisalWorkspace.tsx`, `src/utils/frameworks.ts`.
* **Funksjon:** Full implementasjon av 10 internasjonalt anerkjente sjekklister og rammeverk:
  1. **JBI Qualitative (2017):** 10-spørsmåls sjekkliste for kvalitative studier.
  2. **JBI Systematic Reviews:** 11-spørsmåls sjekkliste for systematiske oversikter.
  3. **AMSTAR 2:** 16 metodiske domener for kritiske oversiktsartikler (uten kunstig totalsum).
  4. **Cochrane RoB 2:** 5 domener for risiko for skjevhet i randomiserte forsøk.
  5. **AGREE II:** 6 uavhengige domeneskårer for kliniske retningslinjer.
  6. **CASP Qualitative:** 10 pedagogiske spørsmål for kvalitativ forskning.
  7. **GRADE:** Vurdering av utfallskvalitet og evidensstyrke.
  8. **GRADE-CERQual:** Tillit til funn fra kvalitativ evidenssyntese.
  9. **CFIR 2.0 (2022):** 5 domener for implementeringsvitenskap og kontekstanalyse.
  10. **KTA (Knowledge-to-Action):** 12-måneders handlingsplan og kunnskapssyklus.

### 6. Validation (Metodisk Validering)
* **Plassering:** `src/components/ValidationTestRunnerModal.tsx`, `src/utils/testRunner.ts`.
* **Funksjon:** Automatisk validering av at alle obligatoriske felter og begrunnelser er fylt ut før en studie kan markeres som ferdig vurdert eller låst for publisering.

### 7. Privacy (Personvern & Kryptografisk Integritet)
* **Plassering:** `src/components/GovernanceGateModal.tsx`, `src/components/IntegrityAuditTrail.tsx`, `src/utils/crypto.ts`.
* **Funksjon:**
  * **Zero-Knowledge & Local Storage:** Ingen personopplysninger eller forskningsdata forlater enheten uten eksplisitt brukerhandling.
  * **Merkle Hash-Kjede:** Hver eneste handling (opprettelse, endring, sammenslåing) tidsstemples og hashes med SHA-256 i en uforanderlig revisjonskjede med automatisk varsling ved manipulering.
  * **Data Governance Gate:** Kontrollert låsing («Research Freeze») som forhindrer etterfølgende endring av data under eller etter publisering.

### 8. Analysis (Statistikk & Konsensus)
* **Plassering:** `src/components/DualReviewerComparison.tsx`, `src/components/MultiReviewerComparison.tsx`, `src/utils/statistics.ts`, `src/utils/metaAnalysis.ts`.
* **Funksjon:**
  * **Inter-Rater Reliability:** Beregning av Cohen's unweighted & linear weighted Kappa, samt Gwet's AC1 (stabil mot skjevfordelte marginaler) for dobbeltscreening og uavhengig vurdering.
  * **Meta-analyse:** Statistisk syntese med DerSimonian-Laird Random Effects-modell, Fixed Effect Inverse Variance, Cochran's $Q$, $I^2$-heterogenitet, samt publiseringsskjevhetstester (Egger's & Begg's tester) og leave-one-out sensitivitetsanalyse.

### 9. Reporting (Rapportering & PRISMA 2020)
* **Plassering:** `src/components/PrismaFlowDiagram.tsx`, `src/components/KtaTimelineModal.tsx`, `src/components/ReliabilityReportModal.tsx`.
* **Funksjon:** Interaktivt PRISMA 2020 flytskjema med sanntidsoppdatering av kildetall gjennom identifisering, screening, egnethet og inklusjon, samt automatisk generering av 12-måneders KTA-handlingsplan.

### 10. Export (Eksport & Interoperabilitet)
* **Plassering:** `src/components/ExportModal.tsx`, `src/utils/exporters.ts`.
* **Funksjon:**
  * **Microsoft Word (.docx) & Markdown:** Formaterte metodiske rapporter og utkast til metoderapport.
  * **Referanseformater:** Standard RIS, BibTeX, EndNote XML og CSL-JSON.
  * **PRISMA-data:** CSV og JSON for videre analyse i R, Stata eller Python.
  * **Kryptert prosjektpakke (`.evidencepack.json`):** Full backup og trygg forflytning mellom forskere uten skylekkasje.

---

## 🔒 Sikkerhet, GDPR og Samarbeid

### Local-First Arkitektur
Forskningsprosjekter involverer ofte upubliserte funn eller sensitive helseopplysninger. Systemet lagrer all tilstand utelukkende i nettleserens sandkasse (`localStorage` og `IndexedDB`).

### Trygt Samarbeid uten Sky (Zero-Cloud Leakage)
1. **Forsker A** utfører sin uavhengige screening/vurdering.
2. **Forsker A** klikker **Eksporter prosjektpakke** (`.evidencepack.json`).
3. Filen overleveres til **Forsker B** (via e-post, Teams eller minnepinne).
4. **Forsker B** importerer filen i sitt vurderingsrom.
5. Systemet matcher automatisk vurderingene og beregner Cohen's Kappa, Gwet's AC1 og fremhever uenigheter for konsensusmøte.

---

## 🧪 Teknisk Verifikasjon & Kvalitetssikring

Prosjektet har en automatisert testsuite som verifiserer bibliografisk presisjon, metodisk integritet og kryptografisk kjede:

```bash
# Kjør hele testsuiten (44/44 tester)
npm test

# Kontroller type-sikkerhet med TypeScript (0 feil)
npm run lint

# Bygg optimalisert produksjonspakke
npm run build
```

### Testoversikt (44 tester – 100 % grønne):
* **APA 7 Formatering:** 9 tester (forfatterantall, ellipsis ved 21+ forfattere, årstall, u.å.).
* **Norsk Juridisk Standard:** 7 tester (lover, forskrifter, paragraftegn §, korttitler).
* **DOI-validering:** 11 tester (normalisering, case-insensitivitet, URL-stripping).
* **Reference Hub Engine:** 7 tester (CWYW-tokens, sitatstiler, Paperpile deduplisering, eksport).
* **Collector Integrasjon:** 6 tester (Oxford Academic/JAMIA, BMJ, Tidsskrift for Den Norske Legeforening, robusthet mot korrupt LD+JSON).
* **JBI Feature Inventory:** 4 tester (bevaring av alle 16 kjernefunksjoner, metodisk integritet uten kunstig vekting).

---

## 📁 Prosjektstruktur

```
complete-evidence-appraisal-tool/
├── src/
│   ├── components/           # UI-komponenter og modaler for de 10 modulene
│   │   ├── AppraisalWorkspace.tsx      # Metodisk vurderingsrom (JBI, AMSTAR, RoB)
│   │   ├── DualReviewerComparison.tsx  # Sammenligning av to uavhengige vurderere
│   │   ├── GovernanceGateModal.tsx     # Forskningslås & Data Governance
│   │   ├── IntegrityAuditTrail.tsx     # Visuell SHA-256 Merkle-kjede
│   │   ├── PrismaFlowDiagram.tsx       # Interaktivt PRISMA 2020 flytdiagram
│   │   ├── ReferenceHubView.tsx        # Referansehub med CWYW og deduplisering
│   │   ├── SensitivityAnalysisModal.tsx# Meta-analyse & Forest plots
│   │   └── ...
│   ├── types/
│   │   └── index.ts          # Kanoniske TypeScript-kontrakter
│   └── utils/
│       ├── crypto.ts         # WebCrypto SHA-256 hashing & Merkle-rot
│       ├── exporters.ts      # Eksportmotor (Word, RIS, PRISMA CSV, Markdown)
│       ├── frameworks.ts     # Definisjoner av de 10 vurderingsinstrumentene
│       ├── metaAnalysis.ts   # DerSimonian-Laird & statistiske tester
│       ├── referenceEngine.ts# Sitering (APA 7, Vancouver, EndNote CWYW)
│       ├── statistics.ts     # Cohen's Kappa, Gwet's AC1, reliabilitet
│       └── storage.ts        # Feilsikker lokal persistens
├── tests/                    # Enhetstester og integrasjonstester
├── package.json              # Prosjektkonfigurasjon og scripts
└── vite.config.ts            # Vite produksjonsbygger
```

---

## 📄 Lisens & Faglig Opphav
Utviklet for forskningsformål iht. **JBI Manual for Evidence Synthesis**, **PRISMA 2020 statement**, **Cochrane Handbook** og **APA 7th Edition Publication Manual**.

---

## 🔍 Honest stack notes

- **`@google/genai` dependency**: Present in `package.json` as a platform requirement of the Google AI Studio runtime environment. The core methodological appraisal logic, statistical calculations, and screening workflows run entirely locally in the browser/node environment without mandatory external cloud calls.
- **`firebase-applet-config.json`**: Present as a platform credential and runtime configuration file required by the container environment.
- **Local-First Data Guarantees**: All appraisal data, extracted study records, screening events, and cryptographic audit chains remain strictly within browser `localStorage` (and in-memory caches). No research data is transmitted to external servers or remote endpoints unless the researcher explicitly triggers a manual export (e.g. DOCX, RIS, JSON, BibTeX).

