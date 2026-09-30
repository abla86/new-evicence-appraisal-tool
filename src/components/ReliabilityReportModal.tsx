import React, { useState, useMemo } from 'react';
import { 
  AppraisalAssessment, 
  AppraisalInstrument, 
  ProjectReliabilitySummary, 
  ResearchProject, 
  ReviewerProfile, 
  StudyRecord, 
  StudyReliabilityRecord 
} from '../types';
import { calculateProjectReliabilityReport } from '../utils/statistics';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Download, 
  Copy, 
  Search, 
  Filter, 
  Users2, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Info, 
  Sparkles, 
  HelpCircle, 
  Check, 
  FileText, 
  GitCompare, 
  ExternalLink,
  Layers,
  Award,
  BookOpen,
  PieChart,
  SlidersHorizontal,
  Table as TableIcon
} from 'lucide-react';

interface ReliabilityReportModalProps {
  project?: ResearchProject;
  studies: StudyRecord[];
  assessments: Record<string, AppraisalAssessment[]>;
  reviewers: ReviewerProfile[];
  onOpenStudyConsensus?: (studyId: string, instrument: AppraisalInstrument) => void;
  onClose: () => void;
}

export const ReliabilityReportModal: React.FC<ReliabilityReportModalProps> = ({
  project,
  studies,
  assessments,
  reviewers,
  onOpenStudyConsensus,
  onClose
}) => {
  // Compute full inter-rater reliability report
  const reliabilitySummary: ProjectReliabilitySummary = useMemo(() => {
    return calculateProjectReliabilityReport(studies, assessments, reviewers);
  }, [studies, assessments, reviewers]);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'kappa_desc' | 'kappa_asc' | 'agreement_desc' | 'discrepancies_desc' | 'title'>('kappa_desc');
  const [expandedStudyId, setExpandedStudyId] = useState<string | null>(
    reliabilitySummary.studies[0]?.studyId || null
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'studies' | 'matrix' | 'guidance'>('overview');

  // Filtered and Sorted Studies
  const filteredStudies = useMemo(() => {
    return reliabilitySummary.studies
      .filter(study => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = study.studyTitle.toLowerCase().includes(q);
          const matchesAuthors = study.studyAuthors.toLowerCase().includes(q);
          const matchesReviewers = study.reviewerNames.some(r => r.toLowerCase().includes(q));
          if (!matchesTitle && !matchesAuthors && !matchesReviewers) return false;
        }

        // Instrument filter
        if (instrumentFilter !== 'ALL' && study.instrument !== instrumentFilter) {
          return false;
        }

        // Tier filter
        if (tierFilter !== 'ALL') {
          if (tierFilter === 'HIGH' && study.cohensKappa < 0.60) return false;
          if (tierFilter === 'MODERATE' && (study.cohensKappa < 0.40 || study.cohensKappa >= 0.60)) return false;
          if (tierFilter === 'LOW' && study.cohensKappa >= 0.40) return false;
          if (tierFilter === 'HAS_DISCREPANCIES' && study.discrepanciesCount === 0) return false;
          if (tierFilter === 'CONSENSUS_SEALED' && !study.hasConsensus) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'kappa_desc') return b.cohensKappa - a.cohensKappa;
        if (sortBy === 'kappa_asc') return a.cohensKappa - b.cohensKappa;
        if (sortBy === 'agreement_desc') return b.observedAgreement - a.observedAgreement;
        if (sortBy === 'discrepancies_desc') return b.discrepanciesCount - a.discrepanciesCount;
        if (sortBy === 'title') return a.studyTitle.localeCompare(b.studyTitle);
        return 0;
      });
  }, [reliabilitySummary.studies, searchQuery, instrumentFilter, tierFilter, sortBy]);

  // Color helper for Kappa interpretation
  const getKappaBadgeColor = (kappa: number) => {
    if (kappa >= 0.81) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (kappa >= 0.61) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (kappa >= 0.41) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (kappa >= 0.21) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getKappaPillBg = (kappa: number) => {
    if (kappa >= 0.81) return 'bg-emerald-600 text-white';
    if (kappa >= 0.61) return 'bg-blue-600 text-white';
    if (kappa >= 0.41) return 'bg-amber-600 text-white';
    if (kappa >= 0.21) return 'bg-orange-500 text-white';
    return 'bg-red-600 text-white';
  };

  const getRatingBadgeClass = (answer: string) => {
    const a = answer.toLowerCase();
    if (a === 'yes' || a === 'low' || a === '7' || a === '6' || a === 'ja') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
    }
    if (a === 'partial' || a === 'some concerns' || a === 'some_concerns' || a === '5' || a === '4' || a === 'delvis') {
      return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
    }
    if (a === 'no' || a === 'high' || a === 'critically low' || a === '3' || a === '2' || a === '1' || a === 'nei') {
      return 'bg-red-100 text-red-800 border-red-300 font-semibold';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Study ID',
      'Study Title',
      'Year',
      'Authors',
      'Instrument',
      'Reviewers Count',
      'Reviewers Names',
      'Observed Agreement Po (%)',
      'Expected Agreement Pe (%)',
      'Cohens Kappa',
      'Interpretation',
      'SE',
      '95% CI Lower',
      '95% CI Upper',
      'z-Score',
      'p-Value',
      'PABAK',
      'Fleiss Kappa',
      'Agreed Domains',
      'Total Domains',
      'Total Discrepancies',
      'Critical Discrepancies',
      'Consensus Reached'
    ];

    const rows = reliabilitySummary.studies.map(s => [
      `"${s.studyId}"`,
      `"${s.studyTitle.replace(/"/g, '""')}"`,
      `"${s.studyYear}"`,
      `"${s.studyAuthors.replace(/"/g, '""')}"`,
      `"${s.instrument}"`,
      s.totalReviewers,
      `"${s.reviewerNames.join('; ')}"`,
      s.observedAgreement,
      s.expectedAgreement,
      s.cohensKappa,
      `"${s.kappaInterpretation}"`,
      s.standardError,
      s.ci95Lower,
      s.ci95Upper,
      s.zScore,
      s.pValue,
      s.pabak,
      s.fleissKappa ?? 'N/A',
      s.agreedDomains,
      s.totalDomains,
      s.discrepanciesCount,
      s.criticalDiscrepanciesCount,
      s.hasConsensus ? 'YES' : 'NO'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `InterRater_Reliability_Report_Cohens_Kappa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(reliabilitySummary, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reliability_Summary_Cohens_Kappa_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy PRISMA 2020 narrative text
  const handleCopyMethodNarrative = () => {
    const text = `Inter-Rater Reliability Methodological Summary (PRISMA 2020 / PROSPERO):
Critical methodological appraisal was conducted independently by multiple calibrated reviewers (${reliabilitySummary.totalStudiesWithMultipleReviewers} studies double-evaluated, representing ${reliabilitySummary.multiReviewerCoveragePercentage}% of eligible project trials).

Overall inter-rater concordance across all paired appraisal domains yielded a pooled Cohen's Kappa of κ = ${reliabilitySummary.pooledCohensKappa.toFixed(2)} (Landis & Koch classification: "${reliabilitySummary.pooledInterpretation}"), with an average observed inter-rater agreement of ${reliabilitySummary.meanObservedAgreement}% (mean study Cohen's κ = ${reliabilitySummary.meanStudyKappa.toFixed(2)}). 

Distribution of agreement across double-assessed trials:
- Almost Perfect (κ > 0.80): ${reliabilitySummary.tierDistribution.almostPerfect} studies (${reliabilitySummary.totalStudiesWithMultipleReviewers > 0 ? Math.round((reliabilitySummary.tierDistribution.almostPerfect / reliabilitySummary.totalStudiesWithMultipleReviewers) * 100) : 0}%)
- Substantial (0.60 < κ ≤ 0.80): ${reliabilitySummary.tierDistribution.substantial} studies (${reliabilitySummary.totalStudiesWithMultipleReviewers > 0 ? Math.round((reliabilitySummary.tierDistribution.substantial / reliabilitySummary.totalStudiesWithMultipleReviewers) * 100) : 0}%)
- Moderate (0.40 < κ ≤ 0.60): ${reliabilitySummary.tierDistribution.moderate} studies
- Low / Discrepant (κ ≤ 0.40): ${reliabilitySummary.tierDistribution.fair + reliabilitySummary.tierDistribution.slight + reliabilitySummary.tierDistribution.poor} studies

A total of ${reliabilitySummary.totalDiscrepancies} individual domain discrepancies (including ${reliabilitySummary.criticalDiscrepancies} critical flaw divergences) were identified. Following structured third-arbiter adjudication meetings, ${reliabilitySummary.resolvedDiscrepancies} discrepancies (${reliabilitySummary.resolutionRatePercentage}%) reached definitive consensus status prior to qualitative and meta-analytic evidence synthesis.`;

    navigator.clipboard.writeText(text);
    setCopyFeedback('Kopiert til utklippstavle!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div 
        id="reliability-report-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/90 text-white rounded-lg shadow-xs flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Inter-Rater Reliability &amp; Cohen's Kappa Rapport
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-bold font-mono bg-blue-950 text-blue-300 rounded border border-blue-700/60 uppercase">
                  Multi-Rater Matrise
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Statistisk reliabilitetsanalyse, Cohen's &kappa;, observerte samsvarsnivåer og voldgiftsstatus for alle studier med flere sensorer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reliability-copy-narrative-btn"
              onClick={handleCopyMethodNarrative}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-200 hover:text-white rounded-md text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Kopier PRISMA 2020 metodetekst"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">{copyFeedback}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px]">Kopier PRISMA-tekst</span>
                </>
              )}
            </button>

            <button
              id="reliability-export-csv-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Eksporter til CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">CSV</span>
            </button>

            <button
              id="reliability-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Lukk modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-2">
            <button
              id="reliability-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Oversikt &amp; Nøkkeltall</span>
            </button>
            <button
              id="reliability-tab-studies"
              onClick={() => setActiveTab('studies')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'studies'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Studieoversikt &amp; Kappa ({reliabilitySummary.studies.length})</span>
            </button>
            <button
              id="reliability-tab-matrix"
              onClick={() => setActiveTab('matrix')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>Parvis Sensor-Sammenligning</span>
            </button>
            <button
              id="reliability-tab-guidance"
              onClick={() => setActiveTab('guidance')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'guidance'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Cochrane &amp; Landis-Koch Referanser</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Dekning:</span>
            <span className="font-bold text-slate-800">
              {reliabilitySummary.totalStudiesWithMultipleReviewers}/{reliabilitySummary.totalStudiesInProject} studier ({reliabilitySummary.multiReviewerCoveragePercentage}%)
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Metric Hero Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Pooled Cohen's Kappa */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Samlet Cohen's &kappa; (Pooled)
                      </span>
                      <Scale className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-900 font-mono">
                        {reliabilitySummary.pooledCohensKappa.toFixed(2)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getKappaBadgeColor(reliabilitySummary.pooledCohensKappa)}`}>
                        {reliabilitySummary.pooledInterpretation}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                    <span>Gj.snitt per studie:</span>
                    <span className="font-bold text-slate-700 font-mono">&kappa; = {reliabilitySummary.meanStudyKappa.toFixed(2)}</span>
                  </div>
                </div>

                {/* Observed Agreement */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Observert Samsvar (Po)
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-900 font-mono">
                        {reliabilitySummary.meanObservedAgreement}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        gjennomsnittlig
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                    <span>Vurderte domener:</span>
                    <span className="font-bold text-slate-700 font-mono">{reliabilitySummary.totalPairedDomainEvaluations} par</span>
                  </div>
                </div>

                {/* Multi-Reviewer Coverage */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Dobbeltvurdering Dekning
                      </span>
                      <Users2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-900 font-mono">
                        {reliabilitySummary.multiReviewerCoveragePercentage}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({reliabilitySummary.totalStudiesWithMultipleReviewers}/{reliabilitySummary.totalStudiesInProject})
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                    <span>Cochrane standard:</span>
                    <span className="font-bold text-emerald-600">&ge; 2 uavhengige</span>
                  </div>
                </div>

                {/* Consensus & Discrepancies */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Voldgifts- &amp; Konsensusrate
                      </span>
                      <Award className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-slate-900 font-mono">
                        {reliabilitySummary.resolutionRatePercentage}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        avvik løst
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                    <span>Uavklarte avvik:</span>
                    <span className="font-bold text-amber-700 font-mono">
                      {reliabilitySummary.totalDiscrepancies - reliabilitySummary.resolvedDiscrepancies} gjenstår
                    </span>
                  </div>
                </div>

              </div>

              {/* Agreement Tier Distribution Bar */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Fordeling av Inter-Rater Samsvarsnivåer (Landis &amp; Koch 1977)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Totalt {reliabilitySummary.totalStudiesWithMultipleReviewers} dobbeltvurderte studier
                  </span>
                </div>

                {/* Color-segmented stacked progress bar */}
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 shadow-inner">
                  {reliabilitySummary.totalStudiesWithMultipleReviewers > 0 ? (
                    <>
                      <div 
                        style={{ width: `${(reliabilitySummary.tierDistribution.almostPerfect / reliabilitySummary.totalStudiesWithMultipleReviewers) * 100}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`Nesten perfekt (κ > 0.80): ${reliabilitySummary.tierDistribution.almostPerfect} studier`}
                      />
                      <div 
                        style={{ width: `${(reliabilitySummary.tierDistribution.substantial / reliabilitySummary.totalStudiesWithMultipleReviewers) * 100}%` }}
                        className="bg-blue-500 h-full transition-all"
                        title={`Betydelig (0.60 < κ ≤ 0.80): ${reliabilitySummary.tierDistribution.substantial} studier`}
                      />
                      <div 
                        style={{ width: `${(reliabilitySummary.tierDistribution.moderate / reliabilitySummary.totalStudiesWithMultipleReviewers) * 100}%` }}
                        className="bg-amber-500 h-full transition-all"
                        title={`Moderat (0.40 < κ ≤ 0.60): ${reliabilitySummary.tierDistribution.moderate} studier`}
                      />
                      <div 
                        style={{ width: `${((reliabilitySummary.tierDistribution.fair + reliabilitySummary.tierDistribution.slight + reliabilitySummary.tierDistribution.poor) / reliabilitySummary.totalStudiesWithMultipleReviewers) * 100}%` }}
                        className="bg-red-500 h-full transition-all"
                        title={`Lavt / Dårlig (κ ≤ 0.40): ${reliabilitySummary.tierDistribution.fair + reliabilitySummary.tierDistribution.slight + reliabilitySummary.tierDistribution.poor} studier`}
                      />
                    </>
                  ) : (
                    <div className="bg-slate-200 w-full h-full" />
                  )}
                </div>

                {/* Legend Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <div className="font-bold text-emerald-900">Nesten perfekt (&kappa; &gt; 0.80)</div>
                      <div className="text-emerald-700 font-mono font-semibold">{reliabilitySummary.tierDistribution.almostPerfect} studier</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <div className="font-bold text-blue-900">Betydelig (0.61–0.80)</div>
                      <div className="text-blue-700 font-mono font-semibold">{reliabilitySummary.tierDistribution.substantial} studier</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <div className="font-bold text-amber-900">Moderat (0.41–0.60)</div>
                      <div className="text-amber-700 font-mono font-semibold">{reliabilitySummary.tierDistribution.moderate} studier</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                    <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <div className="font-bold text-red-900">Lavt / Uenighet (&le; 0.40)</div>
                      <div className="text-red-700 font-mono font-semibold">
                        {reliabilitySummary.tierDistribution.fair + reliabilitySummary.tierDistribution.slight + reliabilitySummary.tierDistribution.poor} studier
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary Highlights & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Metodologisk Konklusjon (PRISMA 2020)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Prosjektet oppviser et <strong className="text-slate-900">{reliabilitySummary.pooledInterpretation.toLowerCase()}</strong> metodisk samsvarsnivå mellom uavhengige evaluatorer med en samlet Cohen's &kappa; på <strong className="text-slate-900 font-mono">{reliabilitySummary.pooledCohensKappa.toFixed(2)}</strong>. Totalt {reliabilitySummary.totalDiscrepancies} faglige avvik er identifisert, hvorav {reliabilitySummary.resolvedDiscrepancies} ({reliabilitySummary.resolutionRatePercentage}%) er harmonisert gjennom forhåndsdefinerte voldgiftsprosedyrer.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('studies')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      <span>Utforsk detaljer for alle {reliabilitySummary.studies.length} studier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Rapportering &amp; Tidsskrift-Krav
                    </h3>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-800">Cochrane Handbook (Ch. 4.6):</strong> Anbefaler uavhengig dobbeltsensur med eksplisitt rapportering av &kappa; og uenighetsrate.</li>
                    <li><strong className="text-slate-800">PRISMA 2020 Item 7 &amp; 10:</strong> Krever dokumentasjon av hvordan vurderinger ble harmonisert.</li>
                    <li><strong className="text-slate-800">PABAK-korreksjon:</strong> Beregnet for å kompensere for eventuell skeiv prevalensfordeling.</li>
                  </ul>
                  <div className="pt-2">
                    <button
                      onClick={handleCopyMethodNarrative}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier formell metodebeskrivelse for manuskript</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STUDIES BREAKDOWN */}
          {activeTab === 'studies' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Filter and Search Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reliability-search-input"
                    type="text"
                    placeholder="Søk på studietittel, forfatter, sensor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {/* Instrument filter */}
                  <select
                    id="reliability-filter-instrument"
                    value={instrumentFilter}
                    onChange={(e) => setInstrumentFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Alle Verktøy</option>
                    <option value="AMSTAR2">AMSTAR 2</option>
                    <option value="ROB2">RoB 2</option>
                    <option value="AGREE2">AGREE II</option>
                    <option value="ROBINS_I">ROBINS-I</option>
                    <option value="CASP">CASP</option>
                  </select>

                  {/* Tier filter */}
                  <select
                    id="reliability-filter-tier"
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Alle Samsvarsnivåer</option>
                    <option value="HIGH">Høyt (&kappa; &ge; 0.60)</option>
                    <option value="MODERATE">Moderat (0.40–0.60)</option>
                    <option value="LOW">Lavt (&kappa; &lt; 0.40)</option>
                    <option value="HAS_DISCREPANCIES">Har Uavklarte Avvik</option>
                    <option value="CONSENSUS_SEALED">Konsensus Forseglet</option>
                  </select>

                  {/* Sort by */}
                  <select
                    id="reliability-sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'kappa_desc' | 'kappa_asc' | 'agreement_desc' | 'discrepancies_desc' | 'title')}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="kappa_desc">Høyest &kappa; først</option>
                    <option value="kappa_asc">Lavest &kappa; først</option>
                    <option value="agreement_desc">Høyest samsvar %</option>
                    <option value="discrepancies_desc">Flest avvik</option>
                    <option value="title">Studietittel A–Å</option>
                  </select>
                </div>
              </div>

              {/* Study List */}
              {filteredStudies.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">Ingen studier matcher filteret</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Prøv å nullstille søket eller velg et annet filter for å vise evaluerte studier.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudies.map((study) => {
                    const isExpanded = expandedStudyId === study.studyId;

                    return (
                      <div 
                        key={study.studyId}
                        className={`bg-white rounded-xl border transition-all ${
                          isExpanded 
                            ? 'border-blue-300 shadow-md ring-1 ring-blue-100' 
                            : 'border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        {/* Summary Row */}
                        <div 
                          onClick={() => setExpandedStudyId(isExpanded ? null : study.studyId)}
                          className="p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-slate-100 text-slate-700 rounded border border-slate-200 uppercase">
                                {study.instrument}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {study.studyTitle}
                              </h4>
                              {study.hasConsensus ? (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Konsensus forseglet</span>
                                </span>
                              ) : study.discrepanciesCount > 0 ? (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded border border-amber-200 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{study.discrepanciesCount} avvik</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded border border-blue-200">
                                  100% Samsvar
                                </span>
                              )}
                            </div>

                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>{study.studyAuthors} ({study.studyYear})</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users2 className="w-3 h-3 text-slate-400" />
                                {study.totalReviewers} sensorer: {study.reviewerNames.join(', ')}
                              </span>
                            </div>
                          </div>

                          {/* Metric Pill Badges */}
                          <div className="flex items-center gap-3 self-end sm:self-center">
                            
                            {/* Cohen's Kappa Badge */}
                            <div className="text-right">
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Cohen's &kappa;</div>
                              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1.5 border ${getKappaBadgeColor(study.cohensKappa)}`}>
                                <span className="text-sm">{study.cohensKappa.toFixed(2)}</span>
                                <span className="text-[10px] font-medium opacity-80">({study.kappaInterpretation})</span>
                              </div>
                            </div>

                            {/* Observed Agreement */}
                            <div className="text-right hidden sm:block">
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Samsvar (Po)</div>
                              <div className="text-sm font-bold text-slate-800 font-mono">
                                {study.observedAgreement}%
                              </div>
                            </div>

                            {/* Expand/Collapse Toggle Button */}
                            <button
                              aria-label="Utvid studiedetaljer"
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Drill-down Details */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-4">
                            
                            {/* Detailed Statistics Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 text-xs">
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Forventet Sjanse (Pe)</span>
                                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{study.expectedAgreement}%</div>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">95% Konfidensintervall</span>
                                <div className="text-xs font-bold text-slate-800 font-mono mt-1">[{study.ci95Lower.toFixed(2)}, {study.ci95Upper.toFixed(2)}]</div>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Standardfeil (SE)</span>
                                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{study.standardError.toFixed(3)}</div>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Signifikans (p-verdi)</span>
                                <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                                  {study.pValue < 0.001 ? 'p < 0.001' : `p = ${study.pValue.toFixed(3)}`}
                                </div>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">PABAK-indeks</span>
                                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{study.pabak.toFixed(2)}</div>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Fleiss' &kappa; (Multi-Rater)</span>
                                <div className="text-sm font-bold text-purple-700 font-mono mt-0.5">
                                  {study.fleissKappa !== undefined ? study.fleissKappa.toFixed(2) : 'N/A (2 sensorer)'}
                                </div>
                              </div>
                            </div>

                            {/* Pairwise Comparisons if > 2 Reviewers */}
                            {study.pairwiseComparisons.length > 1 && (
                              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                  <Users2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Alle parvise sensor-kombinasjoner ({study.pairwiseComparisons.length} par)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {study.pairwiseComparisons.map((pair, pIdx) => (
                                    <div key={pIdx} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs flex items-center justify-between">
                                      <div className="min-w-0">
                                        <div className="font-semibold text-slate-800 truncate">
                                          {pair.reviewerAName} vs. {pair.reviewerBName}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          Samsvar: {pair.observedAgreement}% • 95% CI: [{pair.ci95Lower}, {pair.ci95Upper}]
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ml-2 ${getKappaBadgeColor(pair.cohensKappa)}`}>
                                        &kappa;={pair.cohensKappa.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Domain-by-Domain Agreement Grid */}
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              <div className="px-3.5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                                  Domene-for-domene vurderingsmatrise ({study.domainDetails.length} items)
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {study.agreedDomains}/{study.totalDomains} enstemmige ({Math.round((study.agreedDomains / study.totalDomains) * 100)}%)
                                </span>
                              </div>

                              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                                {study.domainDetails.map((dom) => (
                                  <div key={dom.domainId} className={`p-3 text-xs flex items-start justify-between gap-3 ${!dom.isAgreed ? 'bg-amber-50/40' : ''}`}>
                                    <div className="space-y-1 flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] text-slate-500 font-bold">
                                          #{dom.domainNumber}
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                          {dom.domainTitle}
                                        </span>
                                        {dom.isCritical && (
                                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-red-100 text-red-700 rounded border border-red-200">
                                            Kritisk
                                          </span>
                                        )}
                                      </div>

                                      {/* Individual sensor answers */}
                                      <div className="flex items-center flex-wrap gap-2 pt-1">
                                        {Object.entries(dom.ratings).map(([revName, ans]) => (
                                          <div key={revName} className="flex items-center gap-1 text-[11px]">
                                            <span className="text-slate-500 font-medium">{revName}:</span>
                                            <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getRatingBadgeClass(ans)}`}>
                                              {ans}
                                            </span>
                                          </div>
                                        ))}

                                        {dom.consensusAnswer && (
                                          <div className="flex items-center gap-1 text-[11px] ml-2 pl-2 border-l border-slate-200">
                                            <span className="text-purple-600 font-bold">Konsensus:</span>
                                            <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getRatingBadgeClass(dom.consensusAnswer)}`}>
                                              {dom.consensusAnswer}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex-shrink-0">
                                      {dom.isAgreed ? (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded border border-emerald-200 flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          <span>Enstemmig</span>
                                        </span>
                                      ) : dom.consensusAnswer ? (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-800 rounded border border-purple-200 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Voldgift Løst</span>
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded border border-amber-200 flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3" />
                                          <span>Avvik Gjenstår</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Button: Open Consensus Modal */}
                            {onOpenStudyConsensus && (
                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={() => onOpenStudyConsensus(study.studyId, study.instrument)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                  <GitCompare className="w-3.5 h-3.5" />
                                  <span>Åpne Konsensus- &amp; Voldgiftspanel for denne studien</span>
                                </button>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PAIRWISE MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Parvis Inter-Rater Concordance Matrise
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Beregner &kappa; og samsvarsgrad på tvers av alle sensorpar
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-3 font-bold">Studie</th>
                        <th className="p-3 font-bold">Sensor A</th>
                        <th className="p-3 font-bold">Sensor B</th>
                        <th className="p-3 font-bold text-center">Verktøy</th>
                        <th className="p-3 font-bold text-center">Samsvar (Po)</th>
                        <th className="p-3 font-bold text-center">Forventet (Pe)</th>
                        <th className="p-3 font-bold text-center">Cohen's &kappa;</th>
                        <th className="p-3 font-bold text-center">95% Konfidensintervall</th>
                        <th className="p-3 font-bold text-center">Tolkning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reliabilitySummary.studies.flatMap(s => 
                        s.pairwiseComparisons.map((pair, pIdx) => (
                          <tr key={`${s.studyId}-${pIdx}`} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium text-slate-800 max-w-[200px] truncate">
                              {s.studyTitle}
                            </td>
                            <td className="p-3 text-slate-700">{pair.reviewerAName}</td>
                            <td className="p-3 text-slate-700">{pair.reviewerBName}</td>
                            <td className="p-3 text-center">
                              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 rounded border border-slate-200">
                                {s.instrument}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-semibold">{pair.observedAgreement}%</td>
                            <td className="p-3 text-center font-mono text-slate-500">{pair.expectedAgreement}%</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold font-mono border ${getKappaBadgeColor(pair.cohensKappa)}`}>
                                {pair.cohensKappa.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-600">
                              [{pair.ci95Lower.toFixed(2)}, {pair.ci95Upper.toFixed(2)}]
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-slate-700 font-medium">
                                {pair.kappaInterpretation}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GUIDANCE & FORMULAS */}
          {activeTab === 'guidance' && (
            <div className="space-y-6 animate-in fade-in duration-150 text-xs text-slate-700 leading-relaxed">
              
              {/* Formula & Reference Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Statistisk Formelgrunnlag: Cohen's Kappa (&kappa;)
                  </h3>
                </div>

                <p>
                  Cohen's kappa (&kappa;) måler inter-rater reliabilitet for kvalitative (kategoriske) vurderinger korrigert for hypotetisk sannsynlighet for tilfeldig enighet:
                </p>

                <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs space-y-2 border border-slate-800">
                  <div className="text-blue-300 font-bold">// Cohen's Kappa Hovedformel</div>
                  <div>&kappa; = (P_o - P_e) / (1 - P_e)</div>
                  <div className="text-slate-400 text-[11px] pt-1">
                    hvor P_o = Observert relativ enighet, P_e = Hypotetisk sjanseenighet (sum av marginale sannsynligheter).
                  </div>
                  <div className="text-blue-300 font-bold pt-2">// Standardfeil (Large-sample SE) &amp; 95% Konfidensintervall</div>
                  <div>SE(&kappa;) = sqrt( (P_o * (1 - P_o)) / (N * (1 - P_e)^2) )</div>
                  <div>95% CI = [ &kappa; - 1.96 * SE,  &kappa; + 1.96 * SE ]</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-600" />
                      Landis &amp; Koch (1977) Benchmark Skala
                    </h4>
                    <table className="w-full text-[11px]">
                      <tbody>
                        <tr className="border-b border-slate-200"><td className="py-1 font-mono font-bold">&gt; 0.80</td><td className="py-1 text-emerald-700 font-semibold">Nesten perfekt samsvar (Almost Perfect)</td></tr>
                        <tr className="border-b border-slate-200"><td className="py-1 font-mono font-bold">0.61 – 0.80</td><td className="py-1 text-blue-700 font-semibold">Betydelig samsvar (Substantial)</td></tr>
                        <tr className="border-b border-slate-200"><td className="py-1 font-mono font-bold">0.41 – 0.60</td><td className="py-1 text-amber-700 font-semibold">Moderat samsvar (Moderate)</td></tr>
                        <tr className="border-b border-slate-200"><td className="py-1 font-mono font-bold">0.21 – 0.40</td><td className="py-1 text-orange-700 font-semibold">Akseptabelt / rimelig samsvar (Fair)</td></tr>
                        <tr className="border-b border-slate-200"><td className="py-1 font-mono font-bold">0.01 – 0.20</td><td className="py-1 text-red-600 font-semibold">Svakt / ubetydelig samsvar (Slight)</td></tr>
                        <tr><td className="py-1 font-mono font-bold">&le; 0.00</td><td className="py-1 text-red-800 font-semibold">Dårlig samsvar (Poor)</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                      PABAK &amp; Fleiss' Multi-Rater Kappa
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      <strong>PABAK (Prevalence and Bias-Adjusted Kappa):</strong> Når prevalensen av visse kategorier er svært skjev (f.eks. nesten alle studier får "Lav risiko"), kan standard &kappa; bli unaturlig lav til tross for 90%+ observert enighet (Kappa-paradokset). PABAK korrigerer for denne skjevheten.
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <strong>Fleiss' Kappa:</strong> Benyttes når det er flere enn 2 sensorer (f.eks. 3–8 sensorer i tverrfaglige ekspertpaneler) som vurderer samme sett med metodiske spørsmål.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              Klar for publisering i henhold til <strong>PRISMA 2020</strong> og <strong>Cochrane Handbook</strong> retningslinjer.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Eksporter JSON
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
            >
              Lukk Rapport
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
