import React, { useState } from 'react';
import { 
  FileCheck, 
  ShieldCheck, 
  Download, 
  Activity, 
  History, 
  Upload, 
  FileText, 
  Lock, 
  ChevronDown, 
  Sparkles,
  Layers,
  Database,
  FolderKanban,
  FileSpreadsheet,
  AlertTriangle,
  Users2,
  Quote,
  Sliders,
  Check,
  BookOpen,
  HelpCircle,
  Scale,
  FlaskConical,
  Copy,
  Bookmark,
  Search,
  GitBranch,
  TrendingUp
} from 'lucide-react';
import { ActiveTab, ResearchProject, ReviewerProfile, StudyRecord } from '../types';

interface HeaderProps {
  project: ResearchProject;
  studies: StudyRecord[];
  activeStudyId: string;
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  onSelectStudy: (id: string) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenAudit: () => void;
  onOpenHealth: () => void;
  onOpenTestRunner?: () => void;
  onOpenProjectProtocol: () => void;
  onOpenGovernanceGate: () => void;
  onOpenDataExtraction: () => void;
  onOpenSensitivityAnalysis?: () => void;
  onOpenReliabilityReport?: () => void;
  onOpenDuplicateDetector?: () => void;
  onOpenFreezeModal: () => void;
  onLoadBenchmarkData: () => void;
  onOpenCitationModal?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenDoiVerifier?: () => void;
  onOpenPrivateShare?: () => void;
  onOpenResearchSearch?: () => void;
  onOpenThesisDraft?: () => void;
  onOpenMetaResearch?: () => void;
  onOpenDesignAdvisory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  studies,
  activeStudyId,
  activeTab = 'appraisal',
  onSelectTab,
  onSelectStudy,
  onOpenUpload,
  onOpenExport,
  onOpenAudit,
  onOpenHealth,
  onOpenTestRunner,
  onOpenProjectProtocol,
  onOpenGovernanceGate,
  onOpenDataExtraction,
  onOpenSensitivityAnalysis,
  onOpenReliabilityReport,
  onOpenDuplicateDetector,
  onOpenFreezeModal,
  onLoadBenchmarkData,
  onOpenCitationModal,
  onOpenKnowledgeBase,
  onOpenDoiVerifier,
  onOpenPrivateShare,
  onOpenResearchSearch,
  onOpenThesisDraft,
  onOpenMetaResearch,
  onOpenDesignAdvisory
}) => {
  const activeStudy = studies.find(s => s.id === activeStudyId);
  const isGatePassed = project.governanceGate?.isGatePassed;
  const [showReviewersDropdown, setShowReviewersDropdown] = useState(false);

  const activeReviewer: ReviewerProfile = project.reviewers[0] || {
    id: 'rev-sarah',
    name: 'Dr. Sarah Lindqvist',
    role: 'Lead Reviewer',
    email: 'sarah.lindqvist@evidence-research.org',
    affiliation: 'Dept. of Clinical Epidemiology',
    isBlinded: false,
    avatarColor: 'bg-blue-600'
  };

  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  const reviewerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-700">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Brand & Project Context */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-xs flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-1.5">
                <h1 className="text-sm sm:text-base font-bold leading-none tracking-tight text-white">
                  Complete Evidence Appraisal Tool
                </h1>
                <span className="text-blue-300 text-[10px] font-mono uppercase tracking-widest bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800 font-semibold">
                  v{project.activeVersion || '2.0'}
                </span>
                <button
                  id="header-project-protocol-btn"
                  onClick={onOpenProjectProtocol}
                  title={`Prosjekt: ${project.title} - Klikk for protokoll`}
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-[10px] font-mono transition-colors"
                >
                  <FolderKanban className="w-2.5 h-2.5 text-blue-400" />
                  <span>{project.shortCode || 'SR-2026'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter hidden md:block font-medium">
                WHO Governance • Zero-Telemetry • Fargekodet Evidens
              </p>
            </div>
          </div>

          {/* Center: Active Study Card & Quick Citation */}
          <div className="flex items-center gap-2 flex-1 max-w-xl justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-850 border border-slate-700/80 rounded-lg text-xs w-full max-w-md shadow-2xs">
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[10px] text-slate-400 leading-none mb-0.5">
                  <span className="font-semibold uppercase tracking-wider">Aktiv studie:</span>
                  {activeStudy?.isLocked ? (
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> LÅST
                    </span>
                  ) : (
                    <span className="text-blue-300 font-medium">Under vurdering</span>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="header-study-selector"
                    value={activeStudyId}
                    onChange={(e) => onSelectStudy(e.target.value)}
                    className="w-full bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer truncate pr-4 text-xs"
                    title={activeStudy?.title || 'Velg artikkel'}
                  >
                    {studies.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100 py-1">
                        {s.isLocked ? '🔒 ' : '📄 '} {s.title} ({s.year})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {activeStudy && onOpenCitationModal && (
                <button
                  id="header-citation-btn"
                  onClick={onOpenCitationModal}
                  title="Sitér aktiv artikkel (APA 7, Vancouver, BibTeX)"
                  className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-750 rounded transition-colors flex-shrink-0"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Tools: Tools Dropdown, Guide, Share, Import & Export */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Consolidated Tools & Analysis Dropdown */}
            <div className="relative">
              <button
                id="header-tools-menu-btn"
                onClick={() => {
                  setShowToolsDropdown(!showToolsDropdown);
                  if (showReviewersDropdown) setShowReviewersDropdown(false);
                }}
                title="Avanserte analyse- og forskningsverktøy"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                  showToolsDropdown 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs' 
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline font-medium">Verktøy</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Tools Dropdown Menu */}
              {showToolsDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowToolsDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs divide-y divide-slate-800">
                    <div className="pb-2 px-2 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        <span>Verktøy &amp; Avansert Analyse</span>
                      </span>
                    </div>

                    <div className="py-1.5 space-y-0.5">
                      <button
                        id="header-data-extraction-btn"
                        onClick={() => {
                          onOpenDataExtraction();
                          setShowToolsDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                          <div>
                            <div className="font-semibold text-xs">PICO Dataekstraksjon</div>
                            <div className="text-[10px] text-slate-400">Strukturert uttrekk av studievariabler</div>
                          </div>
                        </div>
                      </button>

                      {onOpenSensitivityAnalysis && (
                        <button
                          id="header-sensitivity-analysis-btn"
                          onClick={() => {
                            onOpenSensitivityAnalysis();
                            setShowToolsDropdown(false);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-blue-400" />
                            <div>
                              <div className="font-semibold text-xs">Sensitivitet &amp; Bias</div>
                              <div className="text-[10px] text-slate-400">Stratifisering og Forest Plots</div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenDuplicateDetector && (
                        <button
                          id="header-duplicate-detector-btn"
                          onClick={() => {
                            onOpenDuplicateDetector();
                            setShowToolsDropdown(false);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Copy className="w-4 h-4 text-amber-400" />
                            <div>
                              <div className="font-semibold text-xs">Duplikatsjekk &amp; Skjerming</div>
                              <div className="text-[10px] text-slate-400">Likhetsanalyse uten data-sletting</div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenReliabilityReport && (
                        <button
                          id="header-reliability-report-btn"
                          onClick={() => {
                            onOpenReliabilityReport();
                            setShowToolsDropdown(false);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-indigo-400" />
                            <div>
                              <div className="font-semibold text-xs">Reliabilitet &amp; Cohen's Kappa</div>
                              <div className="text-[10px] text-slate-400">Inter-rater overensstemmelse</div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenDoiVerifier && (
                        <button
                          id="header-doi-verifier-btn"
                          onClick={() => {
                            onOpenDoiVerifier();
                            setShowToolsDropdown(false);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <div>
                              <div className="font-semibold text-xs">Akademisk DOI-verifisering</div>
                              <div className="text-[10px] text-slate-400">CrossRef, PubMed &amp; Retraction Watch</div>
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenTestRunner && (
                        <button
                          id="header-testlab-btn"
                          onClick={() => {
                            onOpenTestRunner();
                            setShowToolsDropdown(false);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-amber-400" />
                            <div>
                              <div className="font-semibold text-xs">Testlab &amp; Validering</div>
                              <div className="text-[10px] text-slate-400">28 vitenskapelige systemtester</div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>

                    <div className="pt-1.5 space-y-0.5">
                      <button
                        id="header-governance-gate-btn"
                        onClick={() => {
                          onOpenGovernanceGate();
                          setShowToolsDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 ${isGatePassed ? 'text-emerald-400' : 'text-amber-400'}`} />
                          <div>
                            <div className="font-semibold text-xs">Data Governance Gate</div>
                            <div className="text-[10px] text-slate-400">
                              Status: {isGatePassed ? 'Godkjent (Pass)' : 'Handling påkrevd'}
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        id="header-freeze-btn"
                        onClick={() => {
                          onOpenFreezeModal();
                          setShowToolsDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="font-semibold text-xs">Frys &amp; Forsegl Milepæl</div>
                            <div className="text-[10px] text-slate-400">Lås forskningsversjon</div>
                          </div>
                        </div>
                      </button>

                      <button
                        id="header-benchmark-btn"
                        onClick={() => {
                          onLoadBenchmarkData();
                          setShowToolsDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Copy className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-semibold text-xs">Last Referansedata</div>
                            <div className="text-[10px] text-slate-400">Verifiserte benchmark-artikler</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Knowledge Base & Guide Button */}
            {onOpenKnowledgeBase && (
              <button
                id="header-knowledge-base-btn"
                onClick={onOpenKnowledgeBase}
                title="Metodeguide & Kunnskapsbase (WHO / Cochrane / AGREE / JBI)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md text-amber-300 hover:text-white text-xs font-semibold transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-[11px]">Metodeguide</span>
              </button>
            )}

            {/* Private Share Button */}
            {onOpenPrivateShare && (
              <button
                id="header-private-share-btn"
                onClick={onOpenPrivateShare}
                title="Privat Deling & GitHub: Del sikkert uten å gjøre noe offentlig"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-300 hover:text-emerald-200 rounded-md text-xs font-semibold border border-emerald-700/60 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Privat</span>
              </button>
            )}

            {/* System Health / Diagnostic */}
            <button
              id="header-health-button"
              onClick={onOpenHealth}
              title="System Health Monitor"
              className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-md border border-slate-700 transition-colors hidden sm:block"
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Audit Trail */}
            <button
              id="header-audit-button"
              onClick={onOpenAudit}
              title="Kryptografisk Revisjonslogg & Merkle-kjede"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md border border-slate-700 transition-colors hidden sm:block"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Import Button */}
            <button
              id="header-import-button"
              onClick={onOpenUpload}
              title="Importer forskningsartikkel / datasett (PDF, XML, RIS, BibTeX, DOCX)"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold border border-emerald-500 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="font-semibold">Importer</span>
            </button>

            {/* Export Button */}
            <button
              id="header-export-button"
              onClick={onOpenExport}
              title="Eksporter evidenspakke, PRISMA, AMSTAR 2 og revisjonslogg"
              className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold border border-blue-500 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="font-semibold">Eksporter</span>
            </button>

            {/* Reviewer Panel Avatar & Dropdown */}
            <div className="relative">
              <button
                id="header-reviewer-avatar-btn"
                onClick={() => {
                  setShowReviewersDropdown(!showReviewersDropdown);
                  if (showToolsDropdown) setShowToolsDropdown(false);
                }}
                title={`Vurdererpanel (${project.reviewers.length} medlemmer)`}
                className="flex items-center gap-1 p-1 rounded-full bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
              >
                <div 
                  className={`w-7 h-7 rounded-full ${activeReviewer.avatarColor || 'bg-blue-600'} flex items-center justify-center font-bold text-white text-[11px] shadow-xs`}
                >
                  {reviewerInitials(activeReviewer.name)}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 pr-0.5" />
              </button>

              {/* Reviewers List Dropdown */}
              {showReviewersDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowReviewersDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 p-2 text-xs">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Users2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Forskerpanel ({project.reviewers.length})</span>
                      </span>
                      <span className="text-[10px] text-blue-400 font-mono">Opptil 8</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {project.reviewers.map((rev) => (
                        <div 
                          key={rev.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <div className={`w-6 h-6 rounded-full ${rev.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                            {reviewerInitials(rev.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-200 truncate">{rev.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{rev.role} • {rev.affiliation}</div>
                          </div>
                          {rev.isBlinded && (
                            <span className="text-[9px] px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-800 rounded font-semibold">
                              Blindet
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Primary Module & Workflow Navigation Tabs with Clear Grouping */}
      {onSelectTab && (
        <div className="bg-slate-950/90 border-t border-slate-800/90 px-3 sm:px-5 lg:px-6 flex items-center justify-between overflow-x-auto py-1.5">
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Hovedfaner">
            
            {/* Group 1: Kjerne-arbeidsflyt */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/60">
              <button
                id="tab-btn-appraisal"
                onClick={() => onSelectTab('appraisal')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'appraisal'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-blue-300" />
                <span>Vurdering &amp; Leser</span>
              </button>

              <button
                id="tab-btn-library"
                onClick={() => onSelectTab('library')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'library'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Artikler</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {studies.length}
                </span>
              </button>

              <button
                id="tab-btn-source-workflow"
                onClick={() => onSelectTab('source_workflow')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'source_workflow'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kildeposter</span>
              </button>

              <button
                id="tab-btn-reference-hub"
                onClick={() => onSelectTab('reference_hub')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'reference_hub'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Referanser</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block"></div>

            {/* Group 2: Analyse & Kvalitet */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/60">
              <button
                id="tab-btn-synthesis"
                onClick={() => onSelectTab('synthesis')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'synthesis'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Syntese &amp; PICO</span>
              </button>

              <button
                id="tab-btn-governance-audit"
                onClick={() => onSelectTab('governance_audit')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'governance_audit'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Governance &amp; Audit</span>
              </button>

              <button
                id="tab-btn-validation-lab"
                onClick={() => onSelectTab('validation_lab')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'validation_lab'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                <span>Testlab</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block"></div>

            {/* Group 3: Skriving & Integritet */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/60">
              <button
                id="tab-btn-research-search"
                onClick={() => onSelectTab('research_search')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'research_search'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Søk</span>
              </button>

              <button
                id="tab-btn-thesis-output"
                onClick={() => onSelectTab('thesis_output')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'thesis_output'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Oppgavedraft</span>
              </button>

              <button
                id="tab-btn-meta-research"
                onClick={() => onSelectTab('meta_research')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'meta_research'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                <span>Meta-Research</span>
              </button>
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 flex-shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Zero-Telemetry &bull; GDPR Sikret</span>
          </div>
        </div>
      )}
    </header>
  );
};
