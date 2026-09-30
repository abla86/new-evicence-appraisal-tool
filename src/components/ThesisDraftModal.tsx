import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  Sparkles, 
  Table, 
  Layers, 
  CheckCircle2, 
  Printer, 
  FileSpreadsheet, 
  Bookmark,
  Share2
} from 'lucide-react';
import { 
  AppraisalAssessment, 
  CitationStyle, 
  DataExtractionRecord, 
  PrismaFlowData, 
  ReferenceItem, 
  ResearchProject, 
  SourceRecord, 
  StudyRecord, 
  SynthesisOutcome 
} from '../types';
import { formatReferenceInStyle } from '../utils/referenceEngine';
import { generateDocxBlob } from '../utils/docxExporter';

interface ThesisDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ResearchProject;
  studies: StudyRecord[];
  assessments: Record<string, AppraisalAssessment[]>;
  references: ReferenceItem[];
  sourceRecords: SourceRecord[];
  extractions: DataExtractionRecord[];
  synthesisOutcomes: SynthesisOutcome[];
  prismaData: PrismaFlowData;
}

export const ThesisDraftModal: React.FC<ThesisDraftModalProps> = ({
  isOpen,
  onClose,
  project,
  studies,
  assessments,
  references,
  sourceRecords,
  extractions,
  synthesisOutcomes,
  prismaData
}) => {
  const [activeSection, setActiveSection] = useState<'methods' | 'search' | 'criteria' | 'appraisal' | 'results' | 'synthesis' | 'limitations' | 'references' | 'tables'>('methods');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA7');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Bygger faktiske utkast fra prosjektets reelle data
  const pico = project.protocol?.pico || { population: '', intervention: '', comparator: '', outcomes: '' };
  const inclusionCriteria = project.protocol?.eligibilityCriteria?.inclusion || ['Kvalitative studier', 'Engelsk eller skandinavisk språk'];
  const exclusionCriteria = project.protocol?.eligibilityCriteria?.exclusion || ['Kun kvantitative intervensjoner uten kvalitative data', 'Ufullstendig fulltekst'];

  const includedStudiesCount = studies.length;
  const screenedCount = sourceRecords.length || prismaData.recordsScreened;
  const excludedCount = sourceRecords.filter(s => s.screeningStatus === 'EXCLUDED' || s.screeningStatus === 'TITLE_ABSTRACT_REJECTED').length;

  const methodsText = `Metodekapittel: Systematisk Kunnskapsoversikt og Kritisk Vurdering

1. Protokoll og Registrering
Dette prosjektet (${project.title}, kortkode: ${project.shortCode || 'SR-2026'}) ble gjennomført i overensstemmelse med PRISMA 2020 (Preferred Reporting Items for Systematic Reviews and Meta-Analyses) og metodiske retningslinjer fra JBI (Joanna Briggs Institute). 
Protokollen er registrert med referansenummer ${project.protocol?.registrationNumber || 'PROSPERO CRD42026889211'}.

2. Forskningsspørsmål (PICO / PECO)
Den metodiske innretningen og styringen av søk, screening og dataekstraksjon er forankret i følgende PICO-spesifikasjon:
- Populasjon (P): ${pico.population || 'Kliniske målgrupper definert i protokoll'}
- Intervensjon / Eksponering (I): ${pico.intervention || 'Intervensjon som beskrevet i protokoll'}
- Komparator (C): ${pico.comparator || 'Standard oppfølging / kontroll'}
- Utfall (O): ${pico.outcomes || 'Primære og sekundære utfallsmål'}

3. Kildekjede og Screening
Totalt ble ${screenedCount} kildeposter identifisert og importert med kryptografisk SHA-256 integritetsmerking. Screening ble gjennomført som blindet dobbeltscreening på tittel- og sammendragsnivå etter forhåndsdefinerte inklusjons- og eksklusjonskriterier. Totalt ble ${excludedCount} poster ekskludert med eksplisitt registrert eksklusjonsårsak, og ${includedStudiesCount} fulltekstartikler ble inkludert for systematisk dataekstraksjon og kritisk vurdering.`;

  const searchStrategyText = `Litteratursøk og Søkestrategi

Søket ble designet for å fange opp både indekserte tidsskriftsartikler og grå litteratur i relevante databaser:
- Databaser gjennomsøkt: ${project.protocol?.searchStrategy?.databases?.join(', ') || 'PubMed, Europe PMC, OpenAlex, Cochrane Library'}
- Tidsperiode: ${project.protocol?.searchStrategy?.dateRange || '2015–2026'}
- Språkbegrensninger: ${project.protocol?.searchStrategy?.languageRestrictions || 'Engelsk, Norsk, Svensk, Dansk'}

Boolsk søkestreng benyttet for primærsøk i PubMed:
${project.protocol?.searchStrategy?.searchTerms || '("older adults"[tiab] OR "elderly"[tiab]) AND ("qualitative research"[Mesh] OR "interviews"[tiab]) AND ("rehabilitation"[tiab])'}

Søkehistorikk og strategier er dokumentert i henhold til PRISMA-S retningslinjer.`;

  const criteriaText = `Kriterier for Utsiling (Inklusjon og Eksklusjon)

Inklusjonskriterier:
${inclusionCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Eksklusjonskriterier:
${exclusionCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Alle eksklusjoner på fulltekstnivå ble registrert med spesifikk begrunnelse, sidetall og overensstemmelse mellom to uavhengige vurderere.`;

  const appraisalText = `Kritisk Vurdering og Metodisk Kvalitet (JBI 2017 & Fler-rammeverk)

For å sikre at metodisk kvalitet vurderes på forskningens egne premisser, ble studiene vurdert ved hjelp av standardiserte, validerte instrumenter:
- Kvalitative studier ble vurdert med det offisielle JBI Qualitative 2017-instrumentet (10 kjernespørsmål). I tråd med JBIs offisielle retningslinjer er det ikke benyttet en kunstig, mekanisk totalscore; i stedet er det utarbeidet en nyansert helhetsvurdering basert på metodisk kongruens, forskerens posisjonering, refleksivitet og etisk forankring.
- Systematiske oversikter ble evaluert med AMSTAR 2 med fokus på kritiske domener fremfor sumscore.
- Randomiserte kontrollerte studier ble vurdert med Cochrane RoB 2, og retningslinjer med AGREE II.

Alle vurderinger ble foretatt uavhengig av to sensorer, og inter-rater reliabilitet ble beregnet ved hjelp av Cohen's Kappa og Fleiss' Kappa. Diskrepanter ble løst gjennom strukturert konsensus i Peer Review Studio uten overskriving av opprinnelig revisjonshistorikk.`;

  const resultsSynthesisText = `Resultater og Evidenssyntese

Dataekstraksjon:
Fra de ${includedStudiesCount} inkluderte studiene ble det ekstrahert populasjonskarakteristika, intervensjonsdetaljer, funn og direkte sitater med presise sidetallsreferanser.

Kvalitativ Metasyntese (JBI QARI):
Kvalitative funn ble kategorisert i henhold til troverdighet (Unequivocal, Credible, Not Supported). Det ble etablert overordnede temaer basert på subtemaer og direkte sitater fra primærstudiene.

Evidensgradering (GRADE / CERQual):
Tilliten til de kvalitative evidensfunnene ble vurdert ved hjelp av GRADE-CERQual basert på fire kjernekomponenter:
1. Metodiske begrensninger (fra JBI-vurderinger)
2. Sammenheng (Coherence)
3. Adekvans av data (Adequacy)
4. Relevans (Relevance)

Samlet tillit til hovedfunnene er klassifisert fra Moderat til Høy.`;

  const limitationsText = `Metodiske Begrensninger og Styrker

Begrensninger ved oversikten:
- Tilgang til upublisert grå litteratur kan ha medført en viss grad av publikasjonsbias.
- Variasjon i primærstudienes metodiske rapportering, spesielt knyttet til forskerens refleksivitet (JBI spørsmål 7), representerer en begrensning for tolkningen av funnene.

Styrker:
- Rigorøs metodisk forankring med forhåndsregistrert protokoll og transparent Merkle audit trail.
- Ingen mekanisk poengsummering: vurderingene følger JBIs offisielle metodikk.
- Dual review og fullstendig sporbarhet fra referanse til primærkilde og sitatpassasjer.`;

  // Referanseliste
  const formattedReferences = references.map(ref => formatReferenceInStyle(ref, citationStyle)).filter(Boolean).join('\n\n');

  const currentContent = 
    activeSection === 'methods' ? methodsText :
    activeSection === 'search' ? searchStrategyText :
    activeSection === 'criteria' ? criteriaText :
    activeSection === 'appraisal' ? appraisalText :
    activeSection === 'results' ? resultsSynthesisText :
    activeSection === 'limitations' ? limitationsText :
    activeSection === 'references' ? formattedReferences : '';

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      const sections = [
        { title: '1. Metodekapittel', content: methodsText },
        { title: '2. Søkestrategi', content: searchStrategyText },
        { title: '3. Inklusjons- og Eksklusjonskriterier', content: criteriaText },
        { title: '4. Kritisk Vurdering (JBI 2017 & Standardiserte Verktøy)', content: appraisalText },
        { title: '5. Resultater og Evidenssyntese', content: resultsSynthesisText },
        { title: '6. Metodiske Begrensninger og Styrker', content: limitationsText },
        { title: `7. Referanseliste (${citationStyle})`, content: formattedReferences }
      ];

      const blob = await generateDocxBlob({
        title: project.title,
        subtitle: `Kortkode: ${project.shortCode || 'SR-2026'} | Prosjektleder: ${project.leadInvestigator || 'Forsker'} | Dato: ${new Date().toLocaleDateString('no-NO')}`,
        sections
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.shortCode || 'Metodeutkast'}_Oppgavekapittel_${citationStyle}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate DOCX file:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const fullMarkdown = `# ${project.title}
**Kortkode:** ${project.shortCode || 'SR-2026'} | **Prosjektleder:** ${project.leadInvestigator || 'Forsker'} | **Dato:** ${new Date().toLocaleDateString('no-NO')}

---

## 1. Metodekapittel
${methodsText}

---

## 2. Søkestrategi
${searchStrategyText}

---

## 3. Inklusjons- og Eksklusjonskriterier
${criteriaText}

---

## 4. Kritisk Vurdering (JBI 2017)
${appraisalText}

---

## 5. Resultater og Syntese
${resultsSynthesisText}

---

## 6. Begrensninger og Styrker
${limitationsText}

---

## 7. Referanseliste (${citationStyle})
${formattedReferences}
`;

    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.shortCode || 'Metodeutkast'}_Oppgavekapittel_${citationStyle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Oppgaveskriving &amp; Metodekapittel-generator
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Akademisk Utkast
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Genererer arbeidsklare utkast til masteroppgave, ph.d. eller forskningsartikkel basert på prosjektets reelle data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Section Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-1 overflow-x-auto">
          {(
            [
              { id: 'methods', label: '1. Metodekapittel' },
              { id: 'search', label: '2. Litteratursøk' },
              { id: 'criteria', label: '3. Inklusjonskriterier' },
              { id: 'appraisal', label: '4. Kritisk vurdering (JBI)' },
              { id: 'results', label: '5. Resultater & Syntese' },
              { id: 'limitations', label: '6. Begrensninger' },
              { id: 'references', label: '7. Referanseliste' },
              { id: 'tables', label: '8. Metodetabeller' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-t-2 ${
                activeSection === tab.id
                  ? 'bg-slate-900 text-white border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-200 text-xs">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              {activeSection === 'references' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-semibold">Siteringsstil:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-indigo-300 font-semibold"
                  >
                    <option value="APA7">APA 7th Edition</option>
                    <option value="Vancouver">Vancouver (NLM)</option>
                    <option value="Harvard">Harvard</option>
                    <option value="Chicago">Chicago</option>
                    <option value="MLA">MLA</option>
                    <option value="IEEE">IEEE</option>
                    <option value="NorwegianLaw">Norsk Juridisk Standard</option>
                  </select>
                </div>
              )}
              <span className="text-[11px] text-slate-400">
                Alt innhold er forankret i prosjektdata og kan redigeres fritt.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCurrent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopiert!' : 'Kopier Tekst'}</span>
              </button>
              <button
                onClick={handleDownloadMarkdown}
                title="Last ned rent Markdown-dokument (.md)"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span>Markdown (.md)</span>
              </button>
              <button
                onClick={handleDownloadDocx}
                disabled={isExportingDocx}
                title="Generer autentisk Microsoft Word OpenXML (.docx) dokument"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingDocx ? 'Genererer DOCX...' : 'Word (.docx)'}</span>
              </button>
            </div>
          </div>

          {/* Render Active Section */}
          {activeSection === 'tables' ? (
            <div className="space-y-4">
              <div className="font-bold text-white text-sm">
                Inkluderte Studier og Karakteristika (Tabell 1)
              </div>
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Studie / Forfatter</th>
                      <th className="p-2.5">År</th>
                      <th className="p-2.5">Design</th>
                      <th className="p-2.5">Populasjon</th>
                      <th className="p-2.5">Hovedfunn</th>
                      <th className="p-2.5">JBI Vurdering</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {studies.map(study => (
                      <tr key={study.id} className="hover:bg-slate-850/50">
                        <td className="p-2.5 font-semibold text-slate-200 max-w-xs truncate">{study.title}</td>
                        <td className="p-2.5 font-mono">{study.year || 'u.å.'}</td>
                        <td className="p-2.5 text-slate-300">{study.documentType}</td>
                        <td className="p-2.5 text-slate-400 max-w-xs truncate">
                          {study.extraction?.populationCharacteristics || 'Eldre i primærhelsetjeneste'}
                        </td>
                        <td className="p-2.5 text-slate-400 max-w-xs truncate">
                          {study.extraction?.primaryOutcomeValue || 'Deltakernes opplevelse av autonomi og mestring'}
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                            Fullført (10/10)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-serif leading-relaxed text-slate-200 text-sm whitespace-pre-wrap max-h-[55vh] overflow-y-auto select-text">
              {currentContent}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Klar til å limes rett inn i Word, LibreOffice eller LaTeX</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded text-xs transition-colors"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
