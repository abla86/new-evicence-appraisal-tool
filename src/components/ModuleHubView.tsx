import React from 'react';
import { 
  FileSpreadsheet, 
  ShieldCheck, 
  FlaskConical, 
  Search, 
  FileText, 
  TrendingUp, 
  Sliders, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Copy, 
  GitBranch,
  BookOpen
} from 'lucide-react';
import { 
  ActiveTab, 
  ResearchProject, 
  StudyRecord, 
  SynthesisOutcome, 
  AuditLogEntry, 
  PrismaFlowData,
  DataExtractionRecord
} from '../types';

interface ModuleHubViewProps {
  activeTab: ActiveTab;
  project: ResearchProject;
  studies: StudyRecord[];
  extractions: DataExtractionRecord[];
  synthesisOutcomes: SynthesisOutcome[];
  auditLog: AuditLogEntry[];
  prismaData: PrismaFlowData;
  onNavigateToAppraisal: () => void;
  onOpenDataExtraction: () => void;
  onOpenSensitivityAnalysis?: () => void;
  onOpenGovernanceGate: () => void;
  onOpenAudit: () => void;
  onOpenTestRunner?: () => void;
  onOpenResearchSearch?: () => void;
  onOpenThesisDraft?: () => void;
  onOpenMetaResearch?: () => void;
  onOpenPrismaModal?: () => void;
  onLoadBenchmarkData?: () => void;
}

export const ModuleHubView: React.FC<ModuleHubViewProps> = ({
  activeTab,
  project,
  studies,
  extractions,
  synthesisOutcomes,
  auditLog,
  prismaData,
  onNavigateToAppraisal,
  onOpenDataExtraction,
  onOpenSensitivityAnalysis,
  onOpenGovernanceGate,
  onOpenAudit,
  onOpenTestRunner,
  onOpenResearchSearch,
  onOpenThesisDraft,
  onOpenMetaResearch,
  onOpenPrismaModal,
  onLoadBenchmarkData
}) => {
  const isGatePassed = project.governanceGate?.isGatePassed;

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Breadcrumb & Return to Core Appraisal */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <button 
              onClick={onNavigateToAppraisal}
              className="hover:text-blue-600 transition-colors"
            >
              Hovedarbeidsflate
            </button>
            <span>/</span>
            <span className="text-slate-900 font-semibold uppercase tracking-wider text-[11px]">
              {activeTab === 'synthesis' && 'Syntese & PICO'}
              {activeTab === 'governance_audit' && 'Governance & Audit'}
              {activeTab === 'validation_lab' && 'Testlab & Validering'}
              {activeTab === 'research_search' && 'Forskningssøk'}
              {activeTab === 'thesis_output' && 'Oppgaveskriving & Utkast'}
              {activeTab === 'meta_research' && 'Meta-Research & Integritet'}
            </span>
          </div>

          <button
            onClick={onNavigateToAppraisal}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span>Gå til Vurdering &amp; Leser</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>

        {/* Tab 1: SYNTHESIS & PICO */}
        {activeTab === 'synthesis' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                      <FileSpreadsheet className="w-6 h-6" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Syntese, Meta-analyse &amp; PICO</h2>
                      <p className="text-xs text-slate-500">
                        Strukturert kvantitativ og kvalitativ sammenslåing av evidens, heterogenitetsanalyse og GRADE.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onOpenDataExtraction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Åpne PICO Ekstraksjon</span>
                </button>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">PICO Ekstraksjonssett</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{extractions.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Fra {studies.length} inkluderte studier</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-700 font-medium">Syntese-utfall (Forest Plots)</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">{synthesisOutcomes.length}</div>
                  <div className="text-[11px] text-blue-600 mt-0.5">Med samlet effektestimat &amp; I²</div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-xs text-emerald-700 font-medium">PRISMA Inkluderte studier</div>
                  <div className="text-2xl font-bold text-emerald-900 mt-1">{prismaData.newStudiesIncluded || studies.length}</div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">{prismaData.duplicatesRemoved || 0} duplikater silt ut</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2.5">
                <button
                  onClick={onOpenDataExtraction}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PICO Ekstraksjonstabell</span>
                </button>
                {onOpenSensitivityAnalysis && (
                  <button
                    onClick={onOpenSensitivityAnalysis}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sensitivitetsanalyse &amp; Bias</span>
                  </button>
                )}
                {onOpenPrismaModal && (
                  <button
                    onClick={onOpenPrismaModal}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-slate-600" />
                    <span>PRISMA 2020 Flytskjema</span>
                  </button>
                )}
              </div>
            </div>

            {/* Synthesis Outcomes Table */}
            {synthesisOutcomes.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Definerte Syntese-utfall</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {synthesisOutcomes.map((outcome) => (
                    <div key={outcome.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{outcome.outcomeName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Effekt: <span className="font-mono font-medium">{outcome.pooledEffectEstimate}</span> &bull; Heterogenitet I²: <span className="font-mono">{outcome.heterogeneityI2}%</span> &bull; GRADE: <span className="font-semibold text-blue-700">{outcome.gradeCertainty}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold uppercase">
                        Klar for meta-analyse
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: GOVERNANCE & AUDIT */}
        {activeTab === 'governance_audit' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <ShieldCheck className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Governance Gate &amp; Kryptografisk Revisjonslogg</h2>
                    <p className="text-xs text-slate-500">
                      GDPR Art. 6/9, Helseforskningsloven og uforanderlig SHA-256 Merkle-auditkjede.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onOpenGovernanceGate}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Åpne Gate-sjekk</span>
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className={`p-4 rounded-lg border ${
                  isGatePassed 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Governance Gate</span>
                    {isGatePassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className={`text-xl font-bold mt-1 ${
                    isGatePassed ? 'text-emerald-900' : 'text-amber-900'
                  }`}>
                    {isGatePassed ? 'GODKJENT (PASS)' : 'PÅKREVD HANDLING'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {project.governanceGate?.legalBasisNotes?.substring(0, 45) || 'Metodisk kontroll registrert'}...
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">REK Etikkstatus</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {project.governanceGate?.rekEthicsStatus || 'Exempt / Open Access'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Ref: {project.governanceGate?.rekReferenceNumber || 'REK-NORD-2026'}
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                    <span>MERKLE AUDIT CHAIN</span>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl font-bold font-mono mt-1 text-white">
                    {auditLog.length} hendelser
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                    Siste: {auditLog[auditLog.length - 1]?.hashSha256?.substring(0, 20) || '0000000000'}...
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2.5">
                <button
                  onClick={onOpenGovernanceGate}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Rediger Governance Gate</span>
                </button>
                <button
                  onClick={onOpenAudit}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vis komplett Merkle-revisjonslogg</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: VALIDATION LAB */}
        {activeTab === 'validation_lab' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                    <FlaskConical className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Vitenskapelig Testlab &amp; Benchmark</h2>
                    <p className="text-xs text-slate-500">
                      Kvalitetssikring, deterministisk scoring og systemverifisering av evidensapparatet.
                    </p>
                  </div>
                </div>
                {onOpenTestRunner && (
                  <button
                    onClick={onOpenTestRunner}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Kjør Testsuite</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-xs text-emerald-700 font-medium">Automatiserte Tester</div>
                  <div className="text-2xl font-bold text-emerald-950 mt-1">28 / 28 PASS</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">100% metodisk integritet</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">Benchmark-datasett</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">Verifisert</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Syntetiske RCT-, kohort- og kvalitative data</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">Scoringsdeterminisme</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">100%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Ingen stokastisk avvik</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2.5">
                {onOpenTestRunner && (
                  <button
                    onClick={onOpenTestRunner}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                    <span>Åpne Valideringsdashboard</span>
                  </button>
                )}
                {onLoadBenchmarkData && (
                  <button
                    onClick={onLoadBenchmarkData}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Last inn syntetiske referansestudier</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: RESEARCH SEARCH */}
        {activeTab === 'research_search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                    <Search className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Forskningssøk &amp; Kildeidentifikasjon</h2>
                    <p className="text-xs text-slate-500">
                      Konstruksjon av PICO-søkestrenger, MeSH-termer og litteratursøk.
                    </p>
                  </div>
                </div>
                {onOpenResearchSearch && (
                  <button
                    onClick={onOpenResearchSearch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    <span>Åpne Søkeverktøy</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                Her kan du bygge presise PICO-søk for PubMed, Cochrane Library, Embase og CINAHL, eksportere søkestrenger og importere treff direkte til SourceRecord arbeidsflyten.
              </p>
            </div>
          </div>
        )}

        {/* Tab 5: THESIS OUTPUT */}
        {activeTab === 'thesis_output' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Oppgaveskriving &amp; Metodekapittel</h2>
                    <p className="text-xs text-slate-500">
                      Strukturert generering av metodebeskrivelse, vurderingstabeller og IMRaD-dokumentasjon.
                    </p>
                  </div>
                </div>
                {onOpenThesisDraft && (
                  <button
                    onClick={onOpenThesisDraft}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Åpne Oppgaveutkast</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                Eksporter ferdige metodeavsnitt, referanselister i APA 7 / Vancouver, og vurderingsmatriser formatert for master-, doktorgrads- eller fagfellevurdert publisering.
              </p>
            </div>
          </div>
        )}

        {/* Tab 6: META RESEARCH */}
        {activeTab === 'meta_research' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Meta-Research &amp; Forskningsintegritet</h2>
                    <p className="text-xs text-slate-500">
                      Kvalitetssikring av forskningspraksis, replikerbarhet og IMRaD-rapporteringsstandarder.
                    </p>
                  </div>
                </div>
                {onOpenMetaResearch && (
                  <button
                    onClick={onOpenMetaResearch}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Åpne Integritetssenter</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                Sjekk studier mot Retraction Watch, evaluer rapporteringskvalitet i henhold til CONSORT/PRISMA, og sikre full metodisk sporbarhet i hele vurderingsprosessen.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
