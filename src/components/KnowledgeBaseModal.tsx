import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Database, 
  Layers, 
  GraduationCap, 
  FileText, 
  Flame, 
  Bookmark, 
  X, 
  ChevronRight,
  Info
} from 'lucide-react';
import { AppraisalInstrument } from '../types';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInstrument?: AppraisalInstrument;
}

interface GuideSection {
  id: string;
  category: 'Metoder & Skjemaer' | 'Databaser & Søk' | 'Statistikk & Syntese' | 'WHO & Governance';
  title: string;
  subtitle: string;
  instrument?: AppraisalInstrument;
  content: {
    overview: string;
    keyPoints: string[];
    criticalFlawsOrRules?: string[];
    officialRef: string;
  };
}

const KNOWLEDGE_SECTIONS: GuideSection[] = [
  {
    id: 'amstar2-guide',
    category: 'Metoder & Skjemaer',
    title: 'AMSTAR 2: Vurdering av systematiske oversikter',
    subtitle: '16 punkter hvorav 7 kritiske domener (Shea et al., BMJ 2017)',
    instrument: 'AMSTAR2',
    content: {
      overview: 'AMSTAR 2 (A MeaSurement Tool to Assess Systematic Reviews) er gullstandarden for kritisk vurdering av systematiske oversikter som inkluderer randomiserte (RCT) eller ikke-randomiserte intervensjonsstudier.',
      keyPoints: [
        'Kritiske domener avgjør den overordnede tilliten til oversikten (Høy, Moderat, Lav, Kritisk lav).',
        'Et enkelt kritisk avvik (mer enn 1) reduserer tilliten automatisk til "Kritisk lav".',
        'Ikke-kritiske svakheter kan samles opp, men reduserer kun tilliten trinnvis.'
      ],
      criticalFlawsOrRules: [
        'Punkt 2: Protokollregistrering a priori (f.eks. PROSPERO) før oppstart.',
        'Punkt 4: Omfattende litteratursøk i minst 2 hoveddatabaser + grå litteratur.',
        'Punkt 7: Begrunnet liste over ekskluderte fulltekstartikler.',
        'Punkt 9: Tilfredsstillende metode for vurdering av risiko for skjevhet (RoB) i primærstudier.',
        'Punkt 11: Korrekt statistisk metaanalysemetodikk (random-effects / heterogenitet).',
        'Punkt 13: Hensyn til risiko for skjevhet i tolkningen av resultatene.',
        'Punkt 15: Kvantitativ vurdering av publikasjonsskjevhet (Funnel plot / Egger).'
      ],
      officialRef: 'Shea BJ, et al. AMSTAR 2: a critical appraisal tool for systematic reviews. BMJ 2017;358:j4008.'
    }
  },
  {
    id: 'agree2-guide',
    category: 'Metoder & Skjemaer',
    title: 'AGREE II: Vurdering av kliniske retningslinjer',
    subtitle: '23 punkter fordelt på 6 domener med 1–7 Likert-skala (Brouwers et al., CMAJ 2010)',
    instrument: 'AGREE2',
    content: {
      overview: 'AGREE II (Appraisal of Guidelines for Research & Evaluation II) er det internasjonalt ledende verktøyet for å vurdere metodisk kvalitet, transparens og anvendbarhet i kliniske retningslinjer.',
      keyPoints: [
        'Domene 1: Omfang og formål (Scope and Purpose) - Punktene 1–3.',
        'Domene 2: Involvering av interessenter (Stakeholder Involvement) - Punktene 4–6.',
        'Domene 3: Rigor i utviklingen (Rigour of Development) - Punktene 7–14 (kjernedomene for vitenskapelig styrke).',
        'Domene 4: Klarhet i presentasjon (Clarity of Presentation) - Punktene 15–17.',
        'Domene 5: Anvendbarhet (Applicability) - Punktene 18–21 (organisatoriske barrierer og implementering).',
        'Domene 6: Redaksjonell uavhengighet (Editorial Independence) - Punktene 22–23.',
        'Standardisert domeneskår beregnes som: (Oppnådd skår - Min skår) / (Maks skår - Min skår) × 100%.'
      ],
      officialRef: 'Brouwers MC, et al. AGREE II: advancing guideline development, reporting and evaluation in health care. CMAJ 2010;182(18):E839-E842.'
    }
  },
  {
    id: 'rob2-guide',
    category: 'Metoder & Skjemaer',
    title: 'Cochrane RoB 2: Risiko for skjevhet i randomiserte forsøk',
    subtitle: '5 domener for RCT-evaluering (Sterne et al., BMJ 2019)',
    instrument: 'ROB2',
    content: {
      overview: 'RoB 2 er Cochrane-samarbeidets offisielle verktøy for å vurdere risiko for systematiske skjevheter i randomiserte kontrollerte studier.',
      keyPoints: [
        'Domene 1: Skjevhet knyttet til randomiseringsprosessen (sekvensgenerering og hemmelighold).',
        'Domene 2: Skjevhet som skyldes avvik fra planlagte intervensjoner (blinding av deltakere/personell).',
        'Domene 3: Skjevhet som skyldes manglende utfallsdata (frafall/attrition).',
        'Domene 4: Skjevhet ved måling av utfallet (blinding av utfallsvurderere).',
        'Domene 5: Skjevhet ved selektiv rapportering av resultat.'
      ],
      officialRef: 'Sterne JAC, et al. RoB 2: a revised tool for assessing risk of bias in randomised trials. BMJ 2019;366:l4898.'
    }
  },
  {
    id: 'casp-guide',
    category: 'Metoder & Skjemaer',
    title: 'CASP: Vurdering av kvalitativ forskning',
    subtitle: '10 sjekkpunkter for kvalitative studier (Critical Appraisal Skills Programme)',
    instrument: 'CASP',
    content: {
      overview: 'CASP-sjekklisten hjelper forskere og klinikere med å vurdere gyldigheten, resultatene og nytten av kvalitative forskningsstudier (intervjuer, fokusgrupper, observasjoner).',
      keyPoints: [
        'Spørsmål 1-2 er screeningsspørsmål: Tydelig formål og egnet kvalitativ metodologi.',
        'Spørsmål 3-7 omhandler metodisk grundighet (utvalgsstrategi, datainnsamling, refleksivitet, etikk, dataanalyse).',
        'Spørsmål 8-10 vurderer resultatene og den kliniske verdien.'
      ],
      officialRef: 'CASP (Critical Appraisal Skills Programme). Qualitative Studies Checklist 2018.'
    }
  },
  {
    id: 'grade-guide',
    category: 'Statistikk & Syntese',
    title: 'GRADE: Gradering av evidens og anbefalinger',
    subtitle: 'Vurdering av tillit til samlet evidens (Guyatt et al., BMJ 2008)',
    instrument: 'GRADE',
    content: {
      overview: 'GRADE (Grading of Recommendations Assessment, Development and Evaluation) er det internasjonalt aksepterte rammeverket (brukt av bl.a. WHO og Helsedirektoratet) for å gradere kvaliteten på samlet evidens som Høy, Moderat, Lav eller Svært lav.',
      keyPoints: [
        'Randomiserte studier starter på "Høy kvalitet", mens observasjonsstudier starter på "Lav kvalitet".',
        '5 faktorer kan nedgradere evidensen (-1 eller -2): Risiko for skjevhet, inkonsistens (I² > 50%), indirekte evidens, upresisjon (brede konfidensintervall), og publikasjonsskjevhet.',
        '3 faktorer kan oppgradere observasjonsevidens (+1 eller +2): Stor effektstørrelse (RR > 2 eller 5), dose-responsgradient, eller at restkonfundering motvirker effekten.'
      ],
      officialRef: 'Guyatt GH, et al. GRADE: an emerging consensus on rating quality of evidence. BMJ 2008;336:924-926.'
    }
  },
  {
    id: 'database-search-guide',
    category: 'Databaser & Søk',
    title: 'Akademiske databaser & søkemetodikk',
    subtitle: 'PubMed/MEDLINE, Embase, Cochrane CENTRAL, Epistemonikos & OpenAlex',
    content: {
      overview: 'Systematiske litteratursøk må gjennomføres med eksplisitte søkestrenger, kombinasjon av kontrollerte emneord (MeSH / EMTREE) og fritekstsøk, samt dokumentasjon av treffantall for PRISMA-flytskjema.',
      keyPoints: [
        'MEDLINE/PubMed: Bruk MeSH-termer kombinert med tittel/sammendragsord ([tiab]).',
        'Embase: Større europeisk og farmakologisk dekning. Bruk EMTREE-termer.',
        'Cochrane CENTRAL: Spesialregister for randomiserte og kontrollerte studier.',
        'Epistemonikos: Spesialisert flerspråklig database for systematiske oversikter.',
        'Grå litteratur & prøveregistre: ClinicalTrials.gov, WHO ICTRP, OpenGrey, NIVA.'
      ],
      officialRef: 'Higgins JPT, et al. Cochrane Handbook for Systematic Reviews of Interventions. 2nd ed. 2019.'
    }
  },
  {
    id: 'statistics-guide',
    category: 'Statistikk & Syntese',
    title: 'Statistiske metoder & inter-rater reliabilitet',
    subtitle: 'Fleiss\' Kappa, Cohens Kappa, I² Heterogenitet & Metaanalyse',
    content: {
      overview: 'Når flere uavhengige granskere vurderer samme artikkel, må graden av samstemmighet kvantifiseres statistisk for å sikre vitenskapelig robusthet.',
      keyPoints: [
        'Cohens Kappa (κ): Måler enighet mellom to granskere korrigert for tilfeldighet (<0.40 Lav, 0.41–0.60 Moderat, 0.61–0.80 God, 0.81–1.00 Fremragende).',
        'Fleiss\' Kappa: Generalisering for et panel på 3 eller flere granskere.',
        'I² Statistikk: Kvantifiserer heterogenitet i metaanalyser (0–40% Lav, 30–60% Moderat, 50–90% Betydelig, 75–100% Svært stor).'
      ],
      officialRef: 'Fleiss JL. Measuring nominal scale agreement among many raters. Psychological Bulletin 1971;76(5):378-382.'
    }
  }
];

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  initialInstrument
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    if (initialInstrument === 'AGREE2') return 'agree2-guide';
    if (initialInstrument === 'ROB2') return 'rob2-guide';
    if (initialInstrument === 'CASP') return 'casp-guide';
    if (initialInstrument === 'GRADE') return 'grade-guide';
    return 'amstar2-guide';
  });

  if (!isOpen) return null;

  const categories = ['Alle', 'Metoder & Skjemaer', 'Databaser & Søk', 'Statistikk & Syntese', 'WHO & Governance'];

  const filteredSections = KNOWLEDGE_SECTIONS.filter(sec => {
    const matchesCategory = selectedCategory === 'Alle' || sec.category === selectedCategory;
    const matchesSearch = searchTerm.trim().length === 0 || 
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.content.overview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.content.keyPoints.some(kp => kp.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeSection = KNOWLEDGE_SECTIONS.find(s => s.id === activeSectionId) || filteredSections[0] || KNOWLEDGE_SECTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Metodeguide, Hjelpesenter & Kunnskapsbase (WHO / Cochrane / AGREE)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Innebygd oppslagsverk for kvalitetsvurdering, kriterier, statistikk og søkestandarder
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Search */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-200 bg-white border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søk i kunnskapsbasen..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
          
          {/* Left Index Sidebar */}
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50 overflow-y-auto p-3 space-y-1.5">
            {filteredSections.map(sec => {
              const isActive = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${
                    isActive 
                      ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500 text-blue-950 font-semibold' 
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {sec.category}
                    </span>
                    {sec.instrument && (
                      <span className="text-[10px] font-bold text-blue-600 font-mono">
                        {sec.instrument}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 leading-tight">{sec.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sec.subtitle}</p>
                </button>
              );
            })}
          </div>

          {/* Right Detail Content */}
          <div className="md:col-span-8 overflow-y-auto p-6 space-y-6 bg-white">
            {activeSection && (
              <div className="space-y-5 animate-fade-in">
                
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded">
                      {activeSection.category}
                    </span>
                    {activeSection.instrument && (
                      <span className="bg-slate-100 text-slate-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                        Standard: {activeSection.instrument}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">
                    {activeSection.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    {activeSection.subtitle}
                  </p>
                </div>

                {/* Overview Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed">
                  <p>{activeSection.content.overview}</p>
                </div>

                {/* Key Points */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Nøkkelkriterier og metoderegler</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {activeSection.content.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/60">
                        <span className="text-emerald-600 font-bold mt-0.5">•</span>
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Critical Flaws if available */}
                {activeSection.content.criticalFlawsOrRules && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Kritiske domener & absolutte krav</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {activeSection.content.criticalFlawsOrRules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-950 font-medium">
                          <span className="text-rose-600 font-bold">⚠️</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Official Reference */}
                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Offisiell referanse</span>
                    <p className="font-mono text-slate-200 text-[11px] mt-0.5">{activeSection.content.officialRef}</p>
                  </div>
                  <GraduationCap className="w-5 h-5 text-blue-400 flex-shrink-0" />
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-slate-500">
            Kvalitetssikret i henhold til WHO Guideline Development Handbook og Cochrane Handbook 2025/2026.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Lukk kunnskapsbasen
          </button>
        </div>

      </div>
    </div>
  );
};
