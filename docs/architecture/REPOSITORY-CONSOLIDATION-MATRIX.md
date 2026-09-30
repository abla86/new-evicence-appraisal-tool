# Konsolideringsmatrise for Forskningsverktøy

Dokumenterer ansvarsfordeling, konsolidering og arkitekturroller på tvers av repositoriene.

---

## 🏛️ Kanonisk Styringsregel for Repositorier og Integrasjon
> **«Et repository flyttes eller integreres ikke på grunn av plassering, navn eller historisk tilknytning. Det vurderes ut fra formål, domeneansvar, avhengigheter, sikkerhetskonsekvenser og behovet for selvstendig livssyklus.»**
>
> Dette gir en struktur der **Complete Evidence** kan bli en samlet og fungerende produktplattform, samtidig som extensions (f.eks. Chrome/Edge Extension Collector) og Security kan utvikles uavhengig uten at grensene brytes.

---

## 1. Oversikt over Økosystemet

```
                        FORSKNINGSØKOSYSTEM
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
   HOVEDPLATTFORM           SPESIALISERT ARM        SPESIALISERT ARM
complete-evidence-appraisal  academic-research-      research-privacy-
         -tool                     engine                inspector
  (Superapplikasjon)       (Søk, sitat, DOI)       (GDPR, PII, DPIA)
        │
        ▲
        │ (Migrert inn)
legacy evidence-appraisal-tool
   [KLAR FOR ARKIVERING]
```

---

## 2. Konsolideringsmatrise

| Funksjon / Domenemodul | Gammelt Repo (`evidence-appraisal-tool`) | Kanonisk Hovedrepo (`complete-evidence-appraisal-tool`) | Spesialiserte Armer | Beslutning & Status |
|---|---|---|---|---|
| **Kritisk vurdering (JBI, CASP, AMSTAR-2, RoB 2, GRADE, AGREE II)** | .NET controllers & React components | `src/utils/frameworks.ts`, `src/components/AppraisalWorkspace.tsx` | - | **Beholdes i hovedrepo**. Gammel versjon erstattet av typesikker kanonisk implementasjon. |
| **Implementeringsvitenskap (CFIR 2.0 & KTA)** | C# implementation logic | `src/utils/frameworks.ts`, `src/components/KtaTimelineModal.tsx`, `exporters.ts` | - | **Fullt migrert**. Bevart i kanonisk form. |
| **Litteratursøk & PICO-ekstraksjon** | Grunnleggende REST-oppkall | `src/components/ResearchSearchHubModal.tsx`, Europe PMC & OpenAlex | `academic-research-engine` (standalone) | **Delt ansvarsmodell**: Hovedrepo har integrert UI/workflow; armen forblir selvstendig bibliotek/service. |
| **Personvern, GDPR & Data Governance** | Lokal statisk sjekkliste | `src/components/GovernanceGateModal.tsx`, Merkle Audit Trail | `research-privacy-inspector` (standalone) | **Delt ansvarsmodell**: Hovedrepo har runtime governance gate; armen forblir selvstendig revisjonsverktøy. |
| **Referansehåndtering & EndNote CWYW** | Eldre formatering | `src/utils/referenceEngine.ts`, `src/components/ReferenceHubView.tsx` | - | **Nyutviklet i hovedrepo**: Støtter EndNote CWYW `{Forfatter, År #ID}`, Zotero, Mendeley, Citavi og Paperpile-duplikathåndtering. |
| **Konsensus & Inter-Rater Reliability** | C# backend kalkyle | `src/utils/statistics.ts`, `src/components/DualReviewerComparison.tsx` | - | **Fullt migrert**: Cohen's Kappa og Gwet's AC1 beregnes klient- og server-side i TypeScript. |
| **Kryptografisk Integritet & Revisjonsspor** | SHA-256 database triggers | `src/utils/crypto.ts`, `src/components/IntegrityAuditTrail.tsx` | - | **Fullt migrert**: WebCrypto SHA-256 med Merkle-tre og uforanderlig auditlogg. |
| **PRISMA 2020 Flytskjema** | Statiske skjemaer | `src/components/PrismaFlowDiagram.tsx`, interaktive tall og hendelser | - | **Fullt migrert**: Live reaktiv PRISMA-beregning og eksport. |
| **Eksportformater (JSON-LD, RIS, CSV, BibTeX, Markdown, ZIP)** | .NET FileStream-responser | `src/utils/exporters.ts`, `src/components/ExportModal.tsx` | - | **Fullt migrert**: W3C Schema.org, RIS for referanseprogrammer, og fullstendig forskningspakke (ZIP). |

---

## 3. Prinsipper for Utfasing
1. **Ingen duplikatkode**: Ingen parallelle implementasjoner av samme domenelogikk skal vedlikeholdes.
2. **Ingen kode beholdes kun for visning**: Kompetansen bevares gjennom levende arkitektur, tester og `MIGRATION-EVIDENCE.md`.
3. **Klare grensesnitt**: De spesialiserte armene forblir modulære biblioteker med egne kontrakter.
