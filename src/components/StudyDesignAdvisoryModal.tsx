import React, { useState } from 'react';
import { 
  GitFork, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { AppraisalInstrument } from '../types';

interface StudyDesignAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInstrument: (instrument: AppraisalInstrument) => void;
}

export const StudyDesignAdvisoryModal: React.FC<StudyDesignAdvisoryModalProps> = ({
  isOpen,
  onClose,
  onSelectInstrument
}) => {
  const [selectedDesign, setSelectedDesign] = useState<string>('qualitative');

  if (!isOpen) return null;

  const designRecommendations: Record<string, {
    name: string;
    description: string;
    recommended?: AppraisalInstrument;
    recommendedLabel?: string;
    rationale: string;
    reportingStandard?: string;
    alternatives: { id: AppraisalInstrument; label: string }[];
    isUncertain?: boolean;
  }> = {
    'unknown-uncertain': {
      name: 'Uavklart / Ukjent studiedesign (Unknown / Uncertain)',
      description: 'Studiedesignet er ennå ikke identifisert eller fastslått i artikkelen.',
      recommended: undefined,
      recommendedLabel: undefined,
      rationale: 'Ingen automatisk instrumentanbefaling kan gis før studiedesignet er avklart av forskeren. Dette forhindrer feilaktig metodisk evaluering basert på antakelser.',
      reportingStandard: undefined,
      alternatives: [],
      isUncertain: true
    },
    qualitative: {
      name: 'Kvalitativ forskning (intervjuer, fokusgrupper, fenomenologi, grounded theory)',
      description: 'Undersøker menneskelige erfaringer, meningsskaping, sosiale prosesser og kontekstuelle forhold.',
      recommended: 'JBI_QUALITATIVE',
      recommendedLabel: 'JBI Kvalitativ Vurdering (2017 - 10 kjernespørsmål)',
      rationale: 'JBI Qualitative 2017 er gullstandarden for vurdering av metodisk kongruens, forskerens posisjonering, refleksivitet og etisk forankring uten reduksjonistisk tallpoengsetting.',
      reportingStandard: 'COREQ / SRQR',
      alternatives: [
        { id: 'CASP', label: 'CASP Kvalitativ sjekkliste' }
      ]
    },
    systematic_review: {
      name: 'Systematisk kunnskapsoversikt / Meta-analyse',
      description: 'Oppsummerer systematisk evidens fra primærstudier etter transparent protokoll.',
      recommended: 'AMSTAR2',
      recommendedLabel: 'AMSTAR 2 (16 standardiserte kriterier med kritiske domener)',
      rationale: 'AMSTAR 2 evaluerer oversikter basert på kritiske svakheter (som forhåndsregistrering, omfattende søk og risiko for skjevhet) fremfor en misvisende sumscore.',
      reportingStandard: 'PRISMA 2020',
      alternatives: [
        { id: 'CASP', label: 'CASP Systematic Review checklist' },
        { id: 'ROB2', label: 'ROBIS (Risk of Bias in Systematic Reviews)' }
      ]
    },
    scoping_review: {
      name: 'Scoping Review / Kunnskapskartlegging',
      description: 'Kartlegger bredde, omfang og kjennetegn ved et felt fremfor å besvare snevre effektspørsmål.',
      recommended: 'PRISMA',
      recommendedLabel: 'PRISMA-ScR (PRISMA Extension for Scoping Reviews)',
      rationale: 'Scoping reviews skal evalueres mot den dedikerte PRISMA-ScR sjekklisten fremfor standard PRISMA 2020 eller AMSTAR 2.',
      reportingStandard: 'PRISMA-ScR',
      alternatives: [
        { id: 'JBI', label: 'JBI Scoping Review Guidance' }
      ]
    },
    qualitative_synthesis: {
      name: 'Kvalitativ kunnskapssyntese (Meta-syntese / Meta-etnografi)',
      description: 'Systematisk sammenstilling og syntese av kvalitative primærstudier.',
      recommended: 'CASP',
      recommendedLabel: 'CASP Systematic Review Checklist (Review-metodikk)',
      rationale: 'Selve oversiktsmetodikken vurderes med CASP for systematiske oversikter. GRADE-CERQual fungerer som et komplementært certainty framework for tillitsgradering til de kvalitative evidensfunnene, ikke som appraisal for selve oversiktsmetodikken.',
      reportingStandard: 'eMERGe / ENTREQ',
      alternatives: [
        { id: 'GRADE', label: 'GRADE-CERQual (Certainty-rammeverk for kvalitative funn)' }
      ]
    },
    rct: {
      name: 'Randomisert Kontrollert Studie (RCT)',
      description: 'Eksperimentelt design med tilfeldig fordeling til intervensjons- og kontrollgruppe.',
      recommended: 'ROB2',
      recommendedLabel: 'Cochrane RoB 2 (Risk of Bias 2)',
      rationale: 'RoB 2 er det internasjonalt anerkjente verktøyet for domene-basert vurdering av randomiseringsprosess, avvik fra tiltenkt intervensjon, manglende utfallsdata og selektiv rapportering.',
      reportingStandard: 'CONSORT 2010',
      alternatives: [
        { id: 'CASP', label: 'CASP RCT checklist' },
        { id: 'JBI', label: 'JBI RCT Critical Appraisal Tool' }
      ]
    },
    cohort: {
      name: 'Observasjonsstudie - Kohortstudie (Cohort Study)',
      description: 'Følger eksponerte og ueksponerte kohorter prospektivt eller retrospektivt over tid.',
      recommended: 'CASP',
      recommendedLabel: 'CASP Kohortstudie Sjekkliste',
      rationale: 'CASP Kohort evaluerer seleksjon av kohort, eksponeringsmåling, konfundere og oppfølgingstid.',
      reportingStandard: 'STROBE',
      alternatives: [
        { id: 'ROBINS_I', label: 'ROBINS-I (for intervensjonseffekter i kohorter)' }
      ]
    },
    case_control: {
      name: 'Observasjonsstudie - Kasus-kontroll (Case-Control Study)',
      description: 'Sammenligner tidligere eksponering hos tilfeller (kasus) mot friske kontroller.',
      recommended: 'CASP',
      recommendedLabel: 'CASP Kasus-kontroll Sjekkliste (aldri kohort-sjekkliste)',
      rationale: 'Kasus-kontrollstudier har spesifikke metodiske utfordringer (recall bias, seleksjon av kontrollgruppe) som må vurderes med et dedikert kasus-kontrollverktøy, aldri et kohortverktøy.',
      reportingStandard: 'STROBE',
      alternatives: []
    },
    guideline: {
      name: 'Klinisk Retningslinje / Faglige Anbefalinger',
      description: 'Systematisk utviklede utsagn for å hjelpe helsepersonell og pasienter med beslutninger.',
      recommended: 'AGREE2',
      recommendedLabel: 'AGREE II (23 ledd fordelt på 6 metodiske domener)',
      rationale: 'AGREE II er det globale standardinstrumentet for evaluering av retningslinjers metodiske strenghet, transparens, uavhengighet og kliniske anvendbarhet.',
      reportingStandard: 'RIGHT / AGREE-S',
      alternatives: []
    },
    diagnostic: {
      name: 'Diagnostisk Nøyaktighetsstudie',
      description: 'Undersøker sensitivitet, spesifisitet og prediktiv verdi for en test mot referansestandard.',
      recommended: 'CASP',
      recommendedLabel: 'CASP Diagnostisk Test (Diagnostic Test Checklist)',
      rationale: 'CASP for diagnostiske tester vurderer referansestandard, blindet tolking, pasientspektrum og klinisk nytteverdi.',
      reportingStandard: 'STARD 2015',
      alternatives: [
        { id: 'JBI', label: 'JBI Diagnostic Test Appraisal' }
      ]
    },
    case_report: {
      name: 'Kasusrapport / Kasusserie (Case Report / Series)',
      description: 'Klinisk beskrivelse av enkeltpasienter eller serier med uvanlige tilstander eller behandlingsforløp.',
      recommended: 'JBI',
      recommendedLabel: 'JBI Critical Appraisal Checklist for Case Reports',
      rationale: 'JBI-sjekklisten for kasusrapporter sikrer systematisk vurdering av demografi, klinisk forløp, diagnostikk og uønskede hendelser.',
      reportingStandard: 'CARE',
      alternatives: []
    },
    implementation: {
      name: 'Implementeringsforskning & Tjenesteinnovasjon',
      description: 'Studerer determinanter for implementering, organisatorisk endring og kunnskapstranslasjon i helsetjenesten.',
      recommended: 'CFIR',
      recommendedLabel: 'CFIR (Consolidated Framework for Implementation Research 2.0)',
      rationale: 'CFIR strukturerer evalueringen i 5 domener (innovasjon, ytre kontekst, indre kontekst, individer og prosess).',
      reportingStandard: 'StaRI / SQUIRE 2.0',
      alternatives: [
        { id: 'KTA', label: 'KTA (Knowledge-to-Action) Action Cycle' }
      ]
    }
  };

  const current = designRecommendations[selectedDesign];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Forskningsdesign-Gate (Metodisk Veiledning)
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Rådgivende &bull; Ikke Tvingende
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Velg studiens forskningsdesign for å motta metodisk begrunnet instrumentanbefaling
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-200 text-xs">
          
          {/* Design Selector */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-300 text-xs">Hvilket forskningsdesign har artikkelen?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(designRecommendations).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDesign(key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedDesign === key
                      ? 'bg-blue-950/60 border-blue-500 text-white shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-bold text-xs">{info.name.split('(')[0]}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{info.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation Box */}
          {current && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  {current.isUncertain ? (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="font-bold text-white text-sm">
                    {current.isUncertain ? 'Metodisk Status:' : 'Anbefalt Vurderingsverktøy:'}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  current.isUncertain
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {current.isUncertain ? 'Ingen Automatisk Anbefaling' : 'Høy Metodisk Kongruens'}
                </span>
              </div>

              {current.isUncertain ? (
                <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-amber-200 space-y-2">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Studiedesign må fastslås før verktøy kan anbefales</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {current.rationale}
                  </p>
                  <p className="text-[11px] text-amber-400/90 font-mono">
                    Systemet nekter gjetting for å forhindre falsk metodisk sikkerhet. Les metodegjennomgangen i artikkelen og velg spesifikt design ovenfor.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-base font-bold text-blue-300 flex items-center gap-2">
                    <span>{current.recommendedLabel}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {current.rationale}
                  </p>
                  {current.reportingStandard && (
                    <div className="text-[11px] text-slate-400 pt-1">
                      <strong>Tilhørende rapporteringsretningslinje:</strong> <span className="font-mono text-purple-300">{current.reportingStandard}</span>
                    </div>
                  )}
                </div>
              )}

              {current.recommended && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (current.recommended) {
                        onSelectInstrument(current.recommended);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktiver {current.recommended} i Workspace</span>
                  </button>

                  {current.alternatives.map(alt => (
                    <button
                      key={alt.id}
                      onClick={() => {
                        onSelectInstrument(alt.id);
                        onClose();
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded text-xs transition-colors cursor-pointer"
                    >
                      Bruk heller {alt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Systemet tvinger aldri et instrument, men veileder mot epistemologisk adekvat vurdering
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
