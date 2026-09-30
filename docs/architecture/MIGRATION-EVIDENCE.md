# Bevis på Migrert Ingeniør- og Forskningskompetanse (Migration Evidence)

Dette dokumentet dokumenterer overføringen av teknisk og metodisk kompetanse fra det eldre `evidence-appraisal-tool` (ASP.NET Core + React) til den helhetlige plattformen `complete-evidence-appraisal-tool`.

---

## Modul 1: Implementeringsvurdering og Tidslinje (KTA)

* **Old Capability**: Kunnskapsbasert handlingsplan og tidslinje for klinisk implementering.
* **Original Implementation**: C# service med hardkodede tidsrom og EF Core entiteter i `evidence-appraisal-tool`.
* **Reason for Removal**: Monolitisk .NET backend-avhengighet, manglende integrasjon med moderne TypeScript type-sikkerhet og reaktive tilstandshåndterere.
* **Canonical Replacement**: 
  * `src/components/KtaTimelineModal.tsx`: Interaktiv 12-måneders KTA-handlingssyklus (Graham et al.) inndelt i 5 faser (Kartlegging, Design, Pilot, Evaluering, Skalering).
  * `src/utils/exporters.ts` (`generateKtaActionPlanExport`): Genererer komplett Markdown-rapport for handlingsplanen.
* **Tests Covering Behaviour**: `src/tests/referenceHubEngine.test.js`, JBI feature inventory tests.
* **Technology Demonstrated**: Reaktiv UI-tilstandsflyt, interaktiv tidslinje-rendering, typesikker domenemodell.
* **Research / Methodology Demonstrated**: Graham et al. Knowledge-to-Action Framework (KTA), barrieredrevet endringsledelse.

---

## Modul 2: Implementeringsvitenskapelig Validering (CFIR 2.0)

* **Old Capability**: Sjekkliste for implementeringsforskning og kontekstuell analyse.
* **Original Implementation**: .NET kontroller som leverte statiske spørsmål for CFIR.
* **Reason for Removal**: Utilstrekkelig støtte for oppdaterte CFIR 2.0-domener og mangel på integrert kryptografisk revisjonsspor.
* **Canonical Replacement**:
  * `src/utils/frameworks.ts` (`CFIR_DOMAINS`): Fullstendig dekning av alle 5 domener (Innovation, Outer Setting, Inner Setting, Individuals, Process).
  * `src/utils/exporters.ts` (`generateCfirEvaluationExport`): Evalueringsrapport med ERIC-intervensjonsanbefalinger.
* **Tests Covering Behaviour**: `tests/jbiFeatureInventory.test.js` og rammeverksvalidering.
* **Technology Demonstrated**: Funksjonell domenedrevet design, typespesifikke svarkategorier (`yes`, `partial`, `no`).
* **Research / Methodology Demonstrated**: Damschroder et al. (2022) CFIR 2.0, Powell et al. ERIC-implementeringsstrategier.

---

## Modul 3: Vurderer-Samarbeid, Konsensus og Inter-Rater Reliability

* **Old Capability**: Sammenligning av to uavhengige vurderere.
* **Original Implementation**: SQL-spørringer som aggregerte avvik mellom brukere i ASP.NET Identity.
* **Reason for Removal**: Treg synkronisering, ingen støtte for sjansekorrigerte reliabilitetsmetrikker som Gwet's AC1 for skjevfordelte data.
* **Canonical Replacement**:
  * `src/utils/statistics.ts`: Matematisk implementasjon av Cohen's unweighted & linear weighted Kappa, samt Gwet's AC1 (stabil ved 'high agreement, low kappa'-paradokset).
  * `src/components/DualReviewerComparison.tsx` & `MultiReviewerComparison.tsx`: Visuell 'blinded review'-sammenligning med felt-for-felt uenighetsløsning og formell konsensusavklaring.
* **Tests Covering Behaviour**: Statistiske beregningstester og valideringslab.
* **Technology Demonstrated**: Komplekse matriseregninger i TypeScript, unweighted/weighted kappa-algoritmer.
* **Research / Methodology Demonstrated**: Inter-rater reliability i systematiske oversikter, PRISMA 2020 krav til uavhengig dobbeltscreening.

---

## Modul 4: Kryptografisk Bevis og Merkle-Revisjonsspor

* **Old Capability**: Tidsstempling og hendelseslogging i databasetabeller.
* **Original Implementation**: C# Entity Framework interceptors med SHA-256 hashing.
* **Reason for Removal**: Propriæt databaselag som ikke kunne verifiseres uavhengig av tredjeparter uten direkte databasetilgang.
* **Canonical Replacement**:
  * `src/utils/crypto.ts`: Standardisert W3C WebCrypto API for SHA-256 beregning, kanonisk serialisering og Merkle-rotnode-kalkulering.
  * `src/components/IntegrityAuditTrail.tsx`: Visuelt revisjonsdashboard som validerer kjedaintegriteten med fargede statusikoner.
  * Manifest-eksport (`manifest_{timestamp}.sha256`) for ekstern uavhengig etterprøvbarhet.
* **Tests Covering Behaviour**: Krypto- og integritetstester, deterministisk JSON-normalisering.
* **Technology Demonstrated**: Web Cryptography API, Merkle hash-trær, uforanderlige loggkjeder.
* **Research / Methodology Demonstrated**: Forskningstransparens, etterrettelighet, reproduksjonsintegritet i samsvar med FAIR-prinsippene.

---

## Modul 5: Referanseintelligens og EndNote CWYW

* **Old Capability**: RIS-eksport og enkel sitatgenerering.
* **Original Implementation**: C# tekstformatteringsservice.
* **Reason for Removal**: Manglende støtte for moderne sitatstandarder, ingen live in-text tokens eller sitatsyntese.
* **Canonical Replacement**:
  * `src/utils/referenceEngine.ts`: Fullblods referansemotor med offisielle EndNote Cite-While-You-Write (CWYW)-tokens `{Etternavn, År #ID}`, Zotero/Mendeley kompatibilitet, 6 sitatstiler (APA 7, Vancouver, Harvard, Chicago, MLA, IEEE) og norsk juridisk stil.
  * `src/components/ReferenceHubView.tsx`: Referansebibliotek med duplikatsjekk (Levenshtein- og ord-vektet), Citavi-stil direkte sitater/memos og ett-klikks overføring til JBI-vurderingsarbeidsflaten.
* **Tests Covering Behaviour**: `src/tests/referenceHubEngine.test.js` (7 tester) og `tests/apa7.test.js` (9 tester).
* **Technology Demonstrated**: RegExp parsing, normalisering av forfatternavn, Levenshtein-avstandsberegning, eksport til RIS og BibTeX.
* **Research / Methodology Demonstrated**: Bibliografisk standardisering, siteringsnøyaktighet, deduplisering i systematiske litteratursøk.
