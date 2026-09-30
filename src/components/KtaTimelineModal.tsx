import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Layers, 
  Download, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  FileText, 
  Info,
  Sliders,
  ShieldCheck,
  Building2,
  Users,
  Target
} from 'lucide-react';
import { StudyRecord } from '../types';
import { triggerFileDownload } from '../utils/exporters';

interface KtaPhase {
  id: string;
  name: string;
  category: 'Planlegging' | 'Implementering' | 'Evaluering' | 'Utvidelse';
  startMonth: number;
  endMonth: number;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
  keyActivities: string[];
  deliverables: string[];
  stakeholders: string[];
  barriersAndMitigations: { barrier: string; mitigation: string }[];
}

const DEFAULT_KTA_PHASES: KtaPhase[] = [
  {
    id: 'design',
    name: 'Design',
    category: 'Planlegging',
    startMonth: 2,
    endMonth: 4,
    color: '#3b82f6',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-600',
    textClass: 'text-blue-700',
    description: 'Lokal tilpasning av kunnskapsbaserte retningslinjer, utforming av intervensjoner og kliniske arbeidsflyter.',
    keyActivities: [
      'Tilpasse evidensanbefalinger til lokale kliniske IT-systemer og EPJ',
      'Utvikle standardiserte pasientforløp og sjekklister',
      'Designe opplæringsprogram og e-læringsmoduler for klinisk personell',
      'Etablere tverrfaglig styringsgruppe og prosjektmandat'
    ],
    deliverables: [
      'Lokal klinisk retningslinje / prosedyredokument',
      'Opplæringsmanual og lommekort for klinikere',
      'Plan for teknisk integrasjon i journalsystem'
    ],
    stakeholders: ['Prosjektleder', 'Klinisk fagekspert', 'EPJ-ansvarlig', 'Avdelingsledelse'],
    barriersAndMitigations: [
      {
        barrier: 'Retningslinjer oppleves for rigide for komplekse pasienter',
        mitigation: 'Inkludere pragmatiske kliniske unntakskriterier og beslutningsstøtte.'
      }
    ]
  },
  {
    id: 'evaluering',
    name: 'Evaluering',
    category: 'Evaluering',
    startMonth: 8,
    endMonth: 10,
    color: '#8b5cf6',
    bgClass: 'bg-indigo-500',
    borderClass: 'border-indigo-600',
    textClass: 'text-indigo-700',
    description: 'Omfattende prosess- og resultatevaluering av pilotenhet, måling av klinisk etterlevelse og pasientutfall.',
    keyActivities: [
      'Klinisk journalaudit av etterlevelse i pilotavdelingen',
      'Kvantitativ måling av primære pasientutfall og bivirkningsrater',
      'Kvalitative fokusgruppeintervjuer med helsepersonell og pasienter',
      'Kostnads- og ressursanalyse av intervensjonen'
    ],
    deliverables: [
      'Kvalitets- og evalueringsrapport med statistisk analyse',
      'Revisjon av intervensjonsdesign basert på erfaringer',
      'Beslutningsgrunnlag for foretaksledelsen om videreføring'
    ],
    stakeholders: ['Forsker / Evalueringsansvarlig', 'Kvalitetsavdeling', 'Statistiker', 'Brukerrepresentant'],
    barriersAndMitigations: [
      {
        barrier: 'Lav svarprosent på kliniske evalueringsskjemaer',
        mitigation: 'Automatisert datauttrekk direkte fra EPJ fremfor manuelle skjema.'
      }
    ]
  },
  {
    id: 'kartlegging',
    name: 'Kartlegging',
    category: 'Planlegging',
    startMonth: 0,
    endMonth: 2,
    color: '#3b82f6',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-600',
    textClass: 'text-blue-700',
    description: 'Identifisering av klinisk kunnskapshull, oppsummering av forskningsevidens (AMSTAR 2 / GRADE) og barriereanalyse.',
    keyActivities: [
      'Identifisere praksisgap og uønsket variasjon i helsetjenesten',
      'Systematisk søk og kritisk vurdering av kunnskapssynteser og retningslinjer',
      'Gjennomføre barriere- og fasilitatoranalyse blant klinikere',
      'Forankre prosjektet hos ledelse og tillitsvalgte'
    ],
    deliverables: [
      'Kunnskapsoppsummering og kvalitetsvurdering (AMSTAR 2 / GRADE)',
      'Rapport over kartlagte barrierer i målavdelinger',
      'Godkjent prosjektprotokoll'
    ],
    stakeholders: ['Forskningsgruppe', 'Klinikkledelse', 'Klinisk personell', 'Kvalitetsutvalg'],
    barriersAndMitigations: [
      {
        barrier: 'Motstand mot endring og mangel på tid i klinisk hverdag',
        mitigation: 'Tidlig involvering av nøkkelpersoner og kartlegging av motivasjonsfaktorer.'
      }
    ]
  },
  {
    id: 'pilot',
    name: 'Pilot',
    category: 'Implementering',
    startMonth: 4,
    endMonth: 8,
    color: '#10b981',
    bgClass: 'bg-emerald-500',
    borderClass: 'border-emerald-600',
    textClass: 'text-emerald-700',
    description: 'Praktisk utprøving av intervensjonen i en utvalgt pilotavdeling med superbrukere og ukentlig oppfølging.',
    keyActivities: [
      'Opplæring av lokale kliniske superbrukere / endringsagenter',
      'Lansering av nye prosedyrer i pilotavdelingen',
      'Ukentlige tavlemøter og operativ problemløsning',
      'Månedlig audit & feedback på etterlevelse til klinisk team'
    ],
    deliverables: [
      'Fullført opplæring for 100 % av målgruppen i pilotenhet',
      'Månedlige audit-rapporter for etterlevelse',
      'Loggbok over uforutsette hendelser og justeringer'
    ],
    stakeholders: ['Superbrukere', 'Avdelingssykepleiere', 'Overleger', 'Prosjektleder'],
    barriersAndMitigations: [
      {
        barrier: 'Klinikere faller tilbake til gamle rutiner under høyt arbeidspress',
        mitigation: 'Faste superbrukere på alle vaktlag og synlige visuelle påminnelser i EPJ.'
      }
    ]
  },
  {
    id: 'skalering',
    name: 'Skalering',
    category: 'Utvidelse',
    startMonth: 10,
    endMonth: 12,
    color: '#f97316',
    bgClass: 'bg-orange-500',
    borderClass: 'border-orange-600',
    textClass: 'text-orange-700',
    description: 'Breddeimplementering på tvers av hele sykehuset eller helseregionen, forankring i ordinær linjeledelse og drift.',
    keyActivities: [
      'Rulle ut intervensjonen til øvrige kliniske avdelinger',
      'Overføre prosjektansvar til ordinær linjeorganisasjon',
      'Etablere kontinuerlig kvalitetsmonitorering i styringsportal',
      'Dele erfaringer i nasjonale fagnettverk og publisere resultater'
    ],
    deliverables: [
      'Foretaksdekkende implementeringsrapport',
      'Driftsavtale for kontinuerlig monitorering',
      'Vitenskapelig implementeringsartikkel (CFIR/KTA)'
    ],
    stakeholders: ['Sykehusdirektør / Foretaksledelse', 'Klinikksjefer', 'Regionale fagnettverk'],
    barriersAndMitigations: [
      {
        barrier: 'Tap av momentum når prosjektorganisasjonen avvikles',
        mitigation: 'Formell innlemmelse i årlige virksomhetsplaner og kvalitetsmål.'
      }
    ]
  }
];

interface KtaTimelineModalProps {
  studies?: StudyRecord[];
  onClose: () => void;
}

export const KtaTimelineModal: React.FC<KtaTimelineModalProps> = ({
  studies = [],
  onClose
}) => {
  const [phases, setPhases] = useState<KtaPhase[]>(DEFAULT_KTA_PHASES);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('kartlegging');
  const [isEditMode, setIsEditMode] = useState(false);

  const selectedPhase = phases.find(p => p.id === selectedPhaseId) || phases[0];

  const handleExportPlan = () => {
    let md = '# Knowledge-to-Action (KTA) 12-Måneders Implementeringsplan\n';
    md += `*Generert: ${new Date().toLocaleDateString('no-NO')}*\n\n`;
    md += '## Implementeringstidslinje (12 Måneder fra kartlegging til skalering)\n\n';
    md += '| Fase | Kategori | Måneder | Varighet | Hovedfokus |\n';
    md += '| :--- | :--- | :--- | :--- | :--- |\n';
    phases.forEach(p => {
      md += `| **${p.name}** | ${p.category} | Måned ${p.startMonth} – ${p.endMonth} | ${p.endMonth - p.startMonth} mnd | ${p.description} |\n`;
    });
    md += '\n## Detaljerte Fasebeskrivelser & Leveranser\n\n';
    phases.forEach(p => {
      md += `### ${p.name} (${p.category} - Måned ${p.startMonth} til ${p.endMonth})\n`;
      md += `${p.description}\n\n`;
      md += '**Nøkkelaktiviteter:**\n';
      p.keyActivities.forEach(a => { md += `- ${a}\n`; });
      md += '\n**Leveranser:**\n';
      p.deliverables.forEach(d => { md += `- ${d}\n`; });
      md += '\n**Nøkkelroller / Interessenter:**\n';
      p.stakeholders.forEach(s => { md += `- ${s}\n`; });
      md += '\n**Barriere og Tiltak:**\n';
      p.barriersAndMitigations.forEach(bm => {
        md += `- *Barriere:* ${bm.barrier}\n  *Tiltak:* ${bm.mitigation}\n`;
      });
      md += '\n---\n\n';
    });

    triggerFileDownload(md, 'KTA-Implementeringsplan-12-maaneder.md', 'text/markdown;charset=utf-8');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">KTA Implementeringstidslinje</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Graham et al. KTA-Modell
                </span>
              </div>
              <p className="text-xs text-slate-400">
                12 måneder fra kartlegging til skalering i helsetjenesten
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPlan}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksporter Plan (MD)</span>
            </button>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isEditMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Lagre Justering' : 'Juster Tidsrom'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors ml-2"
              title="Lukk modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Visual Timeline Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  12 måneder fra kartlegging til skalering
                </h3>
                <p className="text-xs text-slate-500">
                  Klikk på en fase i tidslinjen for å se detaljerte aktiviteter, leveranser og barrieretiltak
                </p>
              </div>

              {/* Legend matching user diagram */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 inline-block"></span>
                  <span>Evaluering</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Implementering</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block"></span>
                  <span>Planlegging</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block"></span>
                  <span>Utvidelse</span>
                </div>
              </div>
            </div>

            {/* Gantt Canvas */}
            <div className="relative pt-4 pb-2 select-none">
              
              {/* Rows matching exact order from uploaded diagram */}
              {phases.map((phase) => {
                const isSelected = selectedPhaseId === phase.id;
                // Calculate percentage positions across 12 months (0 to 12)
                const leftPercent = (phase.startMonth / 12) * 100;
                const widthPercent = ((phase.endMonth - phase.startMonth) / 12) * 100;

                return (
                  <div 
                    key={phase.id} 
                    className={`relative flex items-center my-4.5 py-1 transition-all ${isSelected ? 'bg-slate-200/50 rounded-lg' : ''}`}
                  >
                    {/* Left label with dashed guide line */}
                    <div className="w-28 text-right pr-4 text-xs font-semibold text-slate-600 shrink-0">
                      {phase.name}
                    </div>

                    {/* Timeline Track with dashed guide line */}
                    <div className="relative flex-1 h-10 flex items-center">
                      {/* Dashed baseline */}
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-400"></div>

                      {/* Floating Phase Bar */}
                      <div
                        onClick={() => setSelectedPhaseId(phase.id)}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`
                        }}
                        className={`absolute h-8.5 rounded-lg shadow cursor-pointer transition-all duration-200 flex items-center justify-center text-white text-xs font-bold ${phase.bgClass} hover:brightness-110 hover:shadow-md ${
                          isSelected ? 'ring-3 ring-slate-900 ring-offset-2 scale-[1.02] z-10' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <span className="truncate px-2">
                          {phase.name} ({phase.startMonth} - {phase.endMonth} mnd)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* X-Axis Scale from 0 to 12 Months */}
              <div className="flex items-center pt-4 border-t border-slate-700 mt-6 ml-28">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                  <div key={month} className="flex-1 text-center relative">
                    <div className="w-px h-2 bg-slate-700 absolute top-0 left-1/2 -translate-x-1/2"></div>
                    <span className="text-[11px] font-mono text-slate-600 block mt-2.5">
                      {month}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-center text-xs font-semibold text-slate-500 mt-2 ml-28">
                Måneder
              </div>
            </div>
          </div>

          {/* Detailed Selected Phase Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Phase Overview & Deliverables (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-full ${selectedPhase.bgClass}`}></span>
                  <h4 className="text-base font-bold text-slate-800">
                    Fase: {selectedPhase.name} ({selectedPhase.category})
                  </h4>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                    Måned {selectedPhase.startMonth} – {selectedPhase.endMonth} ({selectedPhase.endMonth - selectedPhase.startMonth} mnd)
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  KTA-steg #{phases.findIndex(p => p.id === selectedPhase.id) + 1}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedPhase.description}
              </p>

              {/* Activities */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kjernearbeid &amp; Aktiviteter</span>
                </h5>
                <ul className="space-y-1.5">
                  {selectedPhase.keyActivities.map((act, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Deliverables */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Konkrete Leveranser (Deliverables)</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedPhase.deliverables.map((del, i) => (
                    <div key={i} className="text-xs bg-indigo-50/50 text-indigo-900 border border-indigo-100 p-2 rounded flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stakeholders & Barrier Mitigation (1 col) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Involverte Roller &amp; Aktører</span>
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPhase.stakeholders.map((stk, i) => (
                    <span key={i} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                      {stk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kjent Barriere &amp; Risikotiltak</span>
                </h5>
                <div className="space-y-2">
                  {selectedPhase.barriersAndMitigations.map((bm, i) => (
                    <div key={i} className="text-xs bg-amber-50/60 border border-amber-200/80 rounded p-2.5 space-y-1">
                      <div className="font-semibold text-amber-900">
                        ⚠️ Barriere: {bm.barrier}
                      </div>
                      <div className="text-slate-700">
                        ✅ <strong>Tiltak:</strong> {bm.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Research Linkage */}
              <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tilknyttede Kunnskapsgrunnlag</span>
                </div>
                <p>
                  {studies.length} studier importert i prosjektet. KTA-modellen kobler forskningskvalitet direkte med klinisk praksisforbedring.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>KTA Framework i henhold til Graham et al. (2006) &amp; Folkehelseinstituttet</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-semibold transition-colors cursor-pointer"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
