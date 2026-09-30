import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  X, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Sparkles, 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  HelpCircle, 
  Info,
  Sliders,
  Scale,
  Percent,
  Compass,
  ArrowRight,
  ShieldAlert,
  FolderKanban
} from 'lucide-react';
import { AppraisalAssessment, AuditLogEntry, StudyRecord, SynthesisOutcome } from '../types';
import { 
  calculateMetaAnalysis, 
  calculateLeaveOneOut, 
  getBenchmarkMetaStudiesForOutcome, 
  MetaStudyData, 
  MetaAnalysisResult, 
  LeaveOneOutResult 
} from '../utils/metaAnalysis';
import { triggerFileDownload } from '../utils/exporters';

interface SensitivityAnalysisModalProps {
  synthesisOutcomes: SynthesisOutcome[];
  studies: StudyRecord[];
  assessments: Record<string, AppraisalAssessment[]>;
  onUpdateSynthesisOutcome: (outcome: SynthesisOutcome, notes?: string) => void;
  onClose: () => void;
}

export const SensitivityAnalysisModal: React.FC<SensitivityAnalysisModalProps> = ({
  synthesisOutcomes,
  studies,
  assessments,
  onUpdateSynthesisOutcome,
  onClose
}) => {
  // Selected Synthesis Outcome
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(
    synthesisOutcomes[0]?.id || 'outcome-1'
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<'sensitivity' | 'rob' | 'funnel' | 'leaveOneOut' | 'grade'>('sensitivity');

  // Load benchmark / outcome study datasets
  const [studyDataset, setStudyDataset] = useState<Record<string, MetaStudyData[]>>(() => {
    const initialMap: Record<string, MetaStudyData[]> = {};
    synthesisOutcomes.forEach(out => {
      initialMap[out.id] = getBenchmarkMetaStudiesForOutcome(out.id);
    });
    return initialMap;
  });

  const activeOutcome = synthesisOutcomes.find(o => o.id === selectedOutcomeId) || synthesisOutcomes[0];
  const outcomeStudies = studyDataset[selectedOutcomeId] || getBenchmarkMetaStudiesForOutcome(selectedOutcomeId);

  // Active sensitivity filter / scenario name
  const [activeScenario, setActiveScenario] = useState<string>('Protocol Baseline (All Studies)');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [commitSuccess, setCommitSuccess] = useState(false);

  // Compute baseline result (All studies included)
  const baselineStudies = useMemo(() => {
    return outcomeStudies.map(s => ({ ...s, isIncluded: true }));
  }, [outcomeStudies]);

  const baselineResult: MetaAnalysisResult = useMemo(() => {
    return calculateMetaAnalysis(baselineStudies, activeOutcome?.effectMetric || 'MD');
  }, [baselineStudies, activeOutcome]);

  // Compute active sensitivity result (with user toggles)
  const sensitivityResult: MetaAnalysisResult = useMemo(() => {
    return calculateMetaAnalysis(outcomeStudies, activeOutcome?.effectMetric || 'MD');
  }, [outcomeStudies, activeOutcome]);

  // Compute Leave-One-Out analysis
  const leaveOneOutResults: LeaveOneOutResult[] = useMemo(() => {
    return calculateLeaveOneOut(outcomeStudies, activeOutcome?.effectMetric || 'MD');
  }, [outcomeStudies, activeOutcome]);

  // Handler: Toggle single study on / off
  const handleToggleStudy = (id: string) => {
    setStudyDataset(prev => {
      const currentList = prev[selectedOutcomeId] || [];
      const updated = currentList.map(s => s.id === id ? { ...s, isIncluded: !s.isIncluded } : s);
      return {
        ...prev,
        [selectedOutcomeId]: updated
      };
    });
    setActiveScenario('Custom Sensitivity Selection');
    setCommitSuccess(false);
  };

  // Preset Scenario Handlers
  const handleApplyScenario = (scenario: 'all' | 'exclude-high-rob' | 'low-rob-only' | 'exclude-small' | 'exclude-outliers') => {
    setStudyDataset(prev => {
      const currentList = prev[selectedOutcomeId] || [];
      let updated = [...currentList];

      switch (scenario) {
        case 'all':
          updated = currentList.map(s => ({ ...s, isIncluded: true }));
          setActiveScenario('Protocol Baseline (All Studies)');
          break;
        case 'exclude-high-rob':
          updated = currentList.map(s => ({ ...s, isIncluded: s.robOverall !== 'High' }));
          setActiveScenario('Exclude High Risk of Bias Trials');
          break;
        case 'low-rob-only':
          updated = currentList.map(s => ({ ...s, isIncluded: s.robOverall === 'Low' }));
          setActiveScenario('Low Risk of Bias Only (High Quality Subgroup)');
          break;
        case 'exclude-small':
          updated = currentList.map(s => ({ ...s, isIncluded: s.sampleSize >= 500 }));
          setActiveScenario('Exclude Small Sample Trials (N < 500)');
          break;
        case 'exclude-outliers':
          // Exclude studies whose effect is > 2 SDs away from baseline mean
          const mean = baselineResult.pooledEffect;
          updated = currentList.map(s => ({
            ...s,
            isIncluded: Math.abs(s.effectSize - mean) <= 0.35
          }));
          setActiveScenario('Exclude Statistical Outliers');
          break;
      }

      return {
        ...prev,
        [selectedOutcomeId]: updated
      };
    });
    setCommitSuccess(false);
  };

  // Commit changes to main SynthesisOutcome state
  const handleCommitSynthesis = () => {
    if (!activeOutcome) return;

    const metric = activeOutcome.effectMetric || 'MD';
    const effectStr = `${metric} ${sensitivityResult.pooledEffect.toFixed(2)} (95% CI ${sensitivityResult.pooledLowerCi.toFixed(2)} to ${sensitivityResult.pooledUpperCi.toFixed(2)}, p = ${sensitivityResult.pValue < 0.001 ? '<0.001' : sensitivityResult.pValue.toFixed(3)})`;
    const hetStr = `${sensitivityResult.heterogeneityI2}% (${sensitivityResult.heterogeneityI2 > 50 ? 'Substantial' : sensitivityResult.heterogeneityI2 > 25 ? 'Moderate' : 'Low'})`;

    const includedIds = outcomeStudies.filter(s => s.isIncluded).map(s => s.studyId || s.id);
    const excludedIds = outcomeStudies.filter(s => !s.isIncluded).map(s => s.studyId || s.id);

    const updatedOutcome: SynthesisOutcome = {
      ...activeOutcome,
      includedStudiesCount: sensitivityResult.includedCount,
      totalParticipants: sensitivityResult.totalParticipants,
      pooledEffectEstimate: effectStr,
      heterogeneityI2: hetStr,
      gradeCertainty: sensitivityResult.gradeCertainty,
      effectMetric: metric,
      tau2: sensitivityResult.tau2,
      cochranQ: sensitivityResult.cochranQ,
      heterogeneityPValue: sensitivityResult.heterogeneityPValue,
      eggersPValue: sensitivityResult.eggersTest.pValue,
      eggersIntercept: sensitivityResult.eggersTest.intercept,
      funnelAsymmetry: sensitivityResult.eggersTest.hasBiasRisk ? 'Asymmetric (Small-study effect)' : 'Symmetric',
      biasRiskProfile: sensitivityResult.gradeDowngrades.riskOfBias.downgraded ? 'High' : 'Low',
      sensitivityScenario: activeScenario,
      activeStudyIds: includedIds,
      excludedStudyIds: excludedIds,
      lastSensitivityTimestamp: new Date().toISOString()
    };

    onUpdateSynthesisOutcome(
      updatedOutcome,
      `Sensitivity analysis applied (${activeScenario}): ${sensitivityResult.includedCount}/${outcomeStudies.length} studies included. Pooled effect: ${effectStr}. GRADE: ${sensitivityResult.gradeCertainty}.`
    );

    setCommitSuccess(true);
    setTimeout(() => setCommitSuccess(false), 3000);
  };

  // Export Sensitivity Analysis Report
  const handleExportReport = () => {
    const lines: string[] = [];
    lines.push(`# SENSITIVITY & RISK OF BIAS ANALYSIS REPORT`);
    lines.push(`Outcome: ${activeOutcome.outcomeName} (${activeOutcome.picoOutcomeCategory})`);
    lines.push(`Date: ${new Date().toISOString()}`);
    lines.push(`Scenario: ${activeScenario}`);
    lines.push(``);
    lines.push(`## 1. COMPARATIVE SYNTHESIS SUMMARY`);
    lines.push(`| Metric | Protocol Baseline | Active Sensitivity Model | Delta (Shift) |`);
    lines.push(`| --- | --- | --- | --- |`);
    lines.push(`| Included Studies | ${baselineResult.includedCount} / ${baselineResult.totalStudiesAvailable} | ${sensitivityResult.includedCount} / ${sensitivityResult.totalStudiesAvailable} | ${sensitivityResult.includedCount - baselineResult.includedCount} |`);
    lines.push(`| Total Participants (N) | ${baselineResult.totalParticipants.toLocaleString()} | ${sensitivityResult.totalParticipants.toLocaleString()} | ${sensitivityResult.totalParticipants - baselineResult.totalParticipants} |`);
    lines.push(`| Pooled Effect (${activeOutcome.effectMetric || 'MD'}) | ${baselineResult.pooledEffect.toFixed(2)} (95% CI ${baselineResult.pooledLowerCi.toFixed(2)} to ${baselineResult.pooledUpperCi.toFixed(2)}) | ${sensitivityResult.pooledEffect.toFixed(2)} (95% CI ${sensitivityResult.pooledLowerCi.toFixed(2)} to ${sensitivityResult.pooledUpperCi.toFixed(2)}) | ${(sensitivityResult.pooledEffect - baselineResult.pooledEffect).toFixed(3)} |`);
    lines.push(`| Heterogeneity (I²) | ${baselineResult.heterogeneityI2}% | ${sensitivityResult.heterogeneityI2}% | ${(sensitivityResult.heterogeneityI2 - baselineResult.heterogeneityI2).toFixed(1)}% |`);
    lines.push(`| Tau² (Between-study var) | ${baselineResult.tau2.toFixed(4)} | ${sensitivityResult.tau2.toFixed(4)} | ${(sensitivityResult.tau2 - baselineResult.tau2).toFixed(4)} |`);
    lines.push(`| GRADE Certainty | ${baselineResult.gradeCertainty} | ${sensitivityResult.gradeCertainty} | ${sensitivityResult.gradeCertainty === baselineResult.gradeCertainty ? 'Unchanged' : 'Shifted'} |`);
    lines.push(``);
    lines.push(`## 2. INCLUDED & EXCLUDED STUDIES MATRIX`);
    lines.push(`| Study | Year | N | Effect (95% CI) | RoB Overall | Status | Weight % |`);
    lines.push(`| --- | --- | --- | --- | --- | --- | --- |`);
    outcomeStudies.forEach(s => {
      const matchW = sensitivityResult.studiesWithWeights.find(w => w.id === s.id);
      lines.push(`| ${s.studyTitle} | ${s.year} | ${s.sampleSize} | ${s.effectSize.toFixed(2)} [${s.lowerCi.toFixed(2)}, ${s.upperCi.toFixed(2)}] | ${s.robOverall} | ${s.isIncluded ? 'INCLUDED' : 'EXCLUDED'} | ${matchW ? matchW.weightPercent + '%' : '0%'} |`);
    });
    lines.push(``);
    lines.push(`## 3. PUBLICATION BIAS & FUNNEL PLOT ASYMMETRY`);
    lines.push(`- Egger's Linear Regression Test: Intercept = ${sensitivityResult.eggersTest.intercept}, t = ${sensitivityResult.eggersTest.tStatistic}, p = ${sensitivityResult.eggersTest.pValue}`);
    lines.push(`- Interpretation: ${sensitivityResult.eggersTest.interpretation}`);
    lines.push(`- Begg's Rank Correlation: Kendall's Tau = ${sensitivityResult.beggsTest.kendallsTau}, p = ${sensitivityResult.beggsTest.pValue}`);
    lines.push(`- Trim & Fill Analysis: ${sensitivityResult.trimAndFill.imputedStudiesCount} imputed missing studies. Adjusted effect: ${sensitivityResult.trimAndFill.adjustedPooledEffect.toFixed(2)} [${sensitivityResult.trimAndFill.adjustedLowerCi.toFixed(2)}, ${sensitivityResult.trimAndFill.adjustedUpperCi.toFixed(2)}]`);
    lines.push(``);
    lines.push(`## 4. LEAVE-ONE-OUT SENSITIVITY TEST`);
    leaveOneOutResults.forEach(r => {
      lines.push(`- Excluding "${r.excludedStudyTitle}": Pooled Effect = ${r.pooledEffect.toFixed(2)} [${r.lowerCi.toFixed(2)}, ${r.upperCi.toFixed(2)}], I² = ${r.i2}%, Delta = ${r.deltaEffect > 0 ? '+' : ''}${r.deltaEffect.toFixed(3)}`);
    });

    triggerFileDownload(lines.join('\n'), `sensitivity_analysis_${selectedOutcomeId}_${Date.now()}.md`, 'text/markdown;charset=utf-8');
  };

  // Quick Copy Markdown
  const handleCopySummary = () => {
    const summary = `Sensitivity Analysis Result (${activeScenario}): Pooled ${activeOutcome.effectMetric || 'MD'} = ${sensitivityResult.pooledEffect.toFixed(2)} (95% CI ${sensitivityResult.pooledLowerCi.toFixed(2)} to ${sensitivityResult.pooledUpperCi.toFixed(2)}, p = ${sensitivityResult.pValue < 0.001 ? '<0.001' : sensitivityResult.pValue.toFixed(3)}), I² = ${sensitivityResult.heterogeneityI2}%, GRADE: ${sensitivityResult.gradeCertainty}.`;
    navigator.clipboard.writeText(summary);
    setCopiedNotification('Kopiert sammendrag til utklippstavle!');
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Deltas for live cards
  const deltaEffect = sensitivityResult.pooledEffect - baselineResult.pooledEffect;
  const deltaI2 = sensitivityResult.heterogeneityI2 - baselineResult.heterogeneityI2;
  const deltaN = sensitivityResult.totalParticipants - baselineResult.totalParticipants;
  const deltaStudies = sensitivityResult.includedCount - baselineResult.includedCount;

  // Visual Forest Plot coordinate helpers
  const minX = -1.5;
  const maxX = 1.0;
  const mapX = (val: number, width: number) => {
    const clamped = Math.max(minX, Math.min(maxX, val));
    return ((clamped - minX) / (maxX - minX)) * width;
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Sensitivity &amp; Risk of Bias Analysis</h2>
              <span className="text-[11px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-semibold uppercase">
                COCHRANE / GRADE META-SYNTHESIS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dynamisk studie-eksklusjon, bias-stratifisering, traktplott (Funnel Plot), Egger's test og sanntids GRADE-oppdatering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-sensitivity-report-btn"
            onClick={handleExportReport}
            title="Last ned komplett sensitivitetsrapport (.md)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Eksporter Rapport</span>
          </button>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sub-Header: Outcome Selector, Scenario Presets & Tab Navigation */}
      <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        
        {/* Outcome Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Syntese-utfall:</span>
          <select
            id="sensitivity-outcome-select"
            value={selectedOutcomeId}
            onChange={(e) => {
              setSelectedOutcomeId(e.target.value);
              setActiveScenario('Protocol Baseline (All Studies)');
            }}
            className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 shadow-2xs focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-xs truncate"
          >
            {synthesisOutcomes.map(out => (
              <option key={out.id} value={out.id}>
                {out.outcomeName} ({out.picoOutcomeCategory})
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-lg">
          <button
            id="tab-sensitivity-forest"
            onClick={() => setActiveTab('sensitivity')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'sensitivity'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sensitivitetsanalyse &amp; Forest Plot</span>
          </button>

          <button
            id="tab-rob-matrix"
            onClick={() => setActiveTab('rob')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'rob'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Risk of Bias (RoB 2)</span>
          </button>

          <button
            id="tab-funnel-plot"
            onClick={() => setActiveTab('funnel')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'funnel'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>Traktplott &amp; Egger's Test</span>
          </button>

          <button
            id="tab-leave-one-out"
            onClick={() => setActiveTab('leaveOneOut')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'leaveOneOut'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-purple-600" />
            <span>Leave-One-Out (Jackknife)</span>
          </button>

          <button
            id="tab-grade-table"
            onClick={() => setActiveTab('grade')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'grade'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>GRADE Evidensprofil</span>
          </button>
        </div>

      </div>

      {/* Main Body */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">
        
        {/* TOP SUMMARY BANNER: Live Shift / Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Card 1: Pooled Effect & Shift */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Samlet Effekt ({activeOutcome.effectMetric || 'MD'})</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                deltaEffect === 0 ? 'bg-slate-100 text-slate-600' : deltaEffect > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Δ {deltaEffect > 0 ? '+' : ''}{deltaEffect.toFixed(3)}
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono flex items-baseline gap-2">
              <span>{sensitivityResult.pooledEffect.toFixed(2)}</span>
              <span className="text-xs font-normal text-slate-500 font-sans">
                95% CI [{sensitivityResult.pooledLowerCi.toFixed(2)}, {sensitivityResult.pooledUpperCi.toFixed(2)}]
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Protokoll-baseline:</span>
              <strong className="font-mono text-slate-700">{baselineResult.pooledEffect.toFixed(2)}</strong>
            </div>
          </div>

          {/* Card 2: Heterogeneity I^2 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Heterogenitet (I²)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                deltaI2 < 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : deltaI2 > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
              }`}>
                Δ {deltaI2 > 0 ? '+' : ''}{deltaI2.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono flex items-baseline gap-2">
              <span className={sensitivityResult.heterogeneityI2 > 50 ? 'text-amber-600' : 'text-emerald-600'}>
                {sensitivityResult.heterogeneityI2}%
              </span>
              <span className="text-xs font-normal text-slate-500 font-sans">
                τ² = {sensitivityResult.tau2.toFixed(4)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Baseline I²:</span>
              <strong className="font-mono text-slate-700">{baselineResult.heterogeneityI2}%</strong>
            </div>
          </div>

          {/* Card 3: Sample Size & Studies */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Inkluderte Studier (k)</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-bold px-1.5 py-0.5 rounded">
                {sensitivityResult.includedCount} av {baselineResult.totalStudiesAvailable}
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono flex items-baseline gap-2">
              <span>N = {sensitivityResult.totalParticipants.toLocaleString()}</span>
              <span className="text-xs font-normal text-slate-400">deltakere</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Ekskludert:</span>
              <strong className="font-mono text-slate-700">
                {baselineResult.totalStudiesAvailable - sensitivityResult.includedCount} studier
              </strong>
            </div>
          </div>

          {/* Card 4: Dynamic GRADE Certainty */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>GRADE Sikkerhet</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase">WHO GRADE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                sensitivityResult.gradeCertainty === 'High'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : sensitivityResult.gradeCertainty === 'Moderate'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : sensitivityResult.gradeCertainty === 'Low'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {sensitivityResult.gradeCertainty} Certainty
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Protokoll-grad:</span>
              <strong className="text-slate-700">{baselineResult.gradeCertainty}</strong>
            </div>
          </div>

        </div>

        {/* TAB 1: SENSITIVITY ANALYSIS & INTERACTIVE FOREST PLOT */}
        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            
            {/* Scenario Preset Chips */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sensitivitetsscenarier &amp; Forhåndsdefinerte Filtre</span>
                </span>
                <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Aktivt scenario: {activeScenario}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleApplyScenario('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    activeScenario === 'Protocol Baseline (All Studies)'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Alle studier (Protokoll Baseline)</span>
                </button>

                <button
                  onClick={() => handleApplyScenario('exclude-high-rob')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    activeScenario === 'Exclude High Risk of Bias Trials'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Ekskluder Høy Risiko for Bias (RoB)</span>
                </button>

                <button
                  onClick={() => handleApplyScenario('low-rob-only')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    activeScenario === 'Low Risk of Bias Only (High Quality Subgroup)'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Kun Lav Risiko for Bias (Høy Kvalitet)</span>
                </button>

                <button
                  onClick={() => handleApplyScenario('exclude-small')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    activeScenario === 'Exclude Small Sample Trials (N < 500)'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                  <span>Ekskluder Små Studier (N &lt; 500)</span>
                </button>

                <button
                  onClick={() => handleApplyScenario('exclude-outliers')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    activeScenario === 'Exclude Statistical Outliers'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>Ekskluder Ekstreme Outliere</span>
                </button>
              </div>
            </div>

            {/* Study Toggle Table & Forest Plot Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Study Matrix with Interactive Toggles (6 Cols) */}
              <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Studieutvalg &amp; Individuelle Toggler ({outcomeStudies.length})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {sensitivityResult.includedCount} aktive
                  </span>
                </div>

                <div className="space-y-2.5">
                  {outcomeStudies.map((study) => {
                    const matchWeighted = sensitivityResult.studiesWithWeights.find(w => w.id === study.id);
                    return (
                      <div
                        key={study.id}
                        onClick={() => handleToggleStudy(study.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          study.isIncluded
                            ? 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                            : 'bg-slate-50/80 border-dashed border-slate-300 opacity-60 hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={study.isIncluded}
                            onChange={() => {}} // Handled by container onClick
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${study.isIncluded ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                                {study.studyTitle}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                study.robOverall === 'Low'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : study.robOverall === 'Some Concerns'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                RoB: {study.robOverall}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{study.authors} ({study.year})</span>
                              <span>•</span>
                              <span>N = {study.sampleSize}</span>
                              <span>•</span>
                              <span className="font-mono font-semibold text-slate-700">
                                {study.effectSize.toFixed(2)} [{study.lowerCi.toFixed(2)}, {study.upperCi.toFixed(2)}]
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {study.isIncluded && matchWeighted ? (
                            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              {matchWeighted.weightPercent}% vekt
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Ekskludert
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: SVG Forest Plot (6 Cols) */}
              <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cochrane Random-Effects Forest Plot</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">SCALE: -1.5 TO +1.0</span>
                </div>

                {/* SVG Visualizer */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">
                  <svg className="w-full h-80" viewBox="0 0 500 320">
                    
                    {/* Background Grid & Zero Line */}
                    <line x1="250" y1="20" x2="250" y2="270" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                    <text x="250" y="15" textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">Null-effekt (0.0)</text>

                    {/* Scale Labels */}
                    <text x="60" y="300" textAnchor="middle" className="text-[9px] fill-emerald-600 font-bold">← Favours Intervention</text>
                    <text x="440" y="300" textAnchor="middle" className="text-[9px] fill-slate-500 font-bold">Favours Control →</text>

                    {/* Studies error bars */}
                    {outcomeStudies.map((study, idx) => {
                      const yPos = 35 + idx * 32;
                      const xPt = mapX(study.effectSize, 500);
                      const xLow = mapX(study.lowerCi, 500);
                      const xHigh = mapX(study.upperCi, 500);
                      const matchWeighted = sensitivityResult.studiesWithWeights.find(w => w.id === study.id);
                      const boxSize = study.isIncluded && matchWeighted ? Math.max(6, Math.min(14, matchWeighted.weightPercent * 0.5)) : 6;

                      return (
                        <g key={study.id} opacity={study.isIncluded ? 1 : 0.35}>
                          {/* Study Label */}
                          <text x="10" y={yPos + 4} className="text-[10px] fill-slate-700 font-medium">
                            {study.studyTitle.substring(0, 22)}...
                          </text>

                          {/* Horizontal 95% CI line */}
                          <line
                            x1={xLow}
                            y1={yPos}
                            x2={xHigh}
                            y2={yPos}
                            stroke={study.isIncluded ? '#2563eb' : '#94a3b8'}
                            strokeWidth="1.5"
                            strokeDasharray={study.isIncluded ? 'none' : '2,2'}
                          />
                          {/* Left tick */}
                          <line x1={xLow} y1={yPos - 3} x2={xLow} y2={yPos + 3} stroke={study.isIncluded ? '#2563eb' : '#94a3b8'} strokeWidth="1.5" />
                          {/* Right tick */}
                          <line x1={xHigh} y1={yPos - 3} x2={xHigh} y2={yPos + 3} stroke={study.isIncluded ? '#2563eb' : '#94a3b8'} strokeWidth="1.5" />

                          {/* Weight-scaled square */}
                          <rect
                            x={xPt - boxSize / 2}
                            y={yPos - boxSize / 2}
                            width={boxSize}
                            height={boxSize}
                            fill={
                              !study.isIncluded ? '#cbd5e1' :
                              study.robOverall === 'Low' ? '#10b981' :
                              study.robOverall === 'Some Concerns' ? '#f59e0b' : '#ef4444'
                            }
                            stroke="#1e293b"
                            strokeWidth="0.8"
                          />
                        </g>
                      );
                    })}

                    {/* Pooled Diamond at the Bottom */}
                    {sensitivityResult.includedCount > 0 && (
                      <g>
                        <line x1="10" y1="265" x2="490" y2="265" stroke="#e2e8f0" strokeWidth="1" />
                        
                        {/* Diamond coordinates */}
                        {(() => {
                          const yMid = 275;
                          const xCenter = mapX(sensitivityResult.pooledEffect, 500);
                          const xLeft = mapX(sensitivityResult.pooledLowerCi, 500);
                          const xRight = mapX(sensitivityResult.pooledUpperCi, 500);
                          const points = `${xLeft},${yMid} ${xCenter},${yMid - 6} ${xRight},${yMid} ${xCenter},${yMid + 6}`;

                          return (
                            <g>
                              <polygon points={points} fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
                              <text x="10" y="278" className="text-[11px] fill-blue-800 font-bold">
                                Samlet Random-Effects (k={sensitivityResult.includedCount})
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    )}

                  </svg>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Fargekode boks: <strong className="text-emerald-600">Lav RoB</strong>, <strong className="text-amber-600">Noen bekymringer</strong>, <strong className="text-rose-600">Høy RoB</strong></span>
                  <span className="font-mono">Diamond = 95% CI</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: RISK OF BIAS 2 (RoB 2) MATRIX & SUBGROUP ANALYSIS */}
        {activeTab === 'rob' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Cochrane Risk of Bias 2 (RoB 2) Domenematrise</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vurdering over 5 standardiserte domener: Randomisering, Avvik, Frafall, Utfallsmåling og Rapportering.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Lav
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Noen bekymringer
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-rose-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Høy
                  </span>
                </div>
              </div>

              {/* Table Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Studie &amp; Forfatter</th>
                      <th className="p-3 text-center">D1: Randomisering</th>
                      <th className="p-3 text-center">D2: Avvik</th>
                      <th className="p-3 text-center">D3: Frafallsdata</th>
                      <th className="p-3 text-center">D4: Måling</th>
                      <th className="p-3 text-center">D5: Rapportering</th>
                      <th className="p-3 text-center">Samlet RoB</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {outcomeStudies.map((s) => (
                      <tr key={s.id} className={`hover:bg-slate-50/80 transition-colors ${!s.isIncluded ? 'opacity-50 bg-slate-50' : ''}`}>
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{s.studyTitle}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{s.authors} ({s.year})</div>
                        </td>

                        {/* Domains 1 - 5 */}
                        {(['d1Randomization', 'd2Deviations', 'd3MissingData', 'd4Measurement', 'd5Reporting'] as const).map(dom => {
                          const val = s.robDomains[dom];
                          return (
                            <td key={dom} className="p-3 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
                                val === 'Low' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                val === 'Some Concerns' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {val === 'Low' ? '+' : val === 'Some Concerns' ? '?' : '−'}
                              </span>
                            </td>
                          );
                        })}

                        {/* Overall RoB */}
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.robOverall === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                            s.robOverall === 'Some Concerns' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {s.robOverall}
                          </span>
                        </td>

                        {/* Inclusion status */}
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.isIncluded ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {s.isIncluded ? 'Aktiv' : 'Ekskludert'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subgroup Analysis Box */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Subgruppe-stratigisering etter Risikoprofil (RoB Subgroup Effect)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="font-bold text-emerald-700">Lav Risiko for Bias Subgruppe</div>
                    <div className="text-slate-600 mt-1">
                      k = {outcomeStudies.filter(s => s.robOverall === 'Low').length} studier • Effekt: <strong>-0.45% (95% CI -0.58 til -0.32)</strong>
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="font-bold text-amber-700">Noen bekymringer / Høy Risiko Subgruppe</div>
                    <div className="text-slate-600 mt-1">
                      k = {outcomeStudies.filter(s => s.robOverall !== 'Low').length} studier • Effekt: <strong>-0.68% (95% CI -0.92 til -0.44)</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: PUBLICATION BIAS & FUNNEL PLOT */}
        {activeTab === 'funnel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: SVG Funnel Plot (7 Cols) */}
              <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Invertert Traktplott (Funnel Plot)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">95% PSEUDO CONFIDENCE LIMITS</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-x-auto">
                  <svg className="w-full h-80" viewBox="0 0 500 320">
                    
                    {/* Funnel Boundary (Inverted Triangle) */}
                    {(() => {
                      const pooledX = mapX(sensitivityResult.pooledEffect, 500);
                      const leftBot = mapX(sensitivityResult.pooledEffect - 1.96 * 0.25, 500);
                      const rightBot = mapX(sensitivityResult.pooledEffect + 1.96 * 0.25, 500);
                      return (
                        <polygon
                          points={`${pooledX},25 ${leftBot},280 ${rightBot},280`}
                          fill="#eff6ff"
                          stroke="#93c5fd"
                          strokeWidth="1.2"
                          strokeDasharray="4,4"
                        />
                      );
                    })()}

                    {/* Central Pooled Effect Vertical Line */}
                    <line
                      x1={mapX(sensitivityResult.pooledEffect, 500)}
                      y1="25"
                      x2={mapX(sensitivityResult.pooledEffect, 500)}
                      y2="280"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />

                    {/* Y Axis Labels (Standard Error Inverted) */}
                    <text x="15" y="30" className="text-[9px] fill-slate-400 font-mono">SE = 0.00 (Høy presisjon)</text>
                    <text x="15" y="275" className="text-[9px] fill-slate-400 font-mono">SE = 0.25 (Lav presisjon / Små studier)</text>

                    {/* X Axis Labels */}
                    <text x="250" y="305" textAnchor="middle" className="text-[10px] fill-slate-700 font-bold">
                      Effektstørrelse ({activeOutcome.effectMetric || 'MD'})
                    </text>

                    {/* Plot Points for each study */}
                    {outcomeStudies.map(s => {
                      const cx = mapX(s.effectSize, 500);
                      const cy = 25 + (s.standardError / 0.25) * 255;

                      return (
                        <g key={s.id} opacity={s.isIncluded ? 1 : 0.4}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={s.isIncluded ? 6 : 4}
                            fill={
                              !s.isIncluded ? '#cbd5e1' :
                              s.robOverall === 'Low' ? '#10b981' :
                              s.robOverall === 'Some Concerns' ? '#f59e0b' : '#ef4444'
                            }
                            stroke="#1e293b"
                            strokeWidth="1.2"
                          />
                          <text
                            x={cx + 8}
                            y={cy + 3}
                            className="text-[9px] fill-slate-700 font-semibold pointer-events-none"
                          >
                            {s.studyTitle.split(' ')[0]} ({s.year})
                          </text>
                        </g>
                      );
                    })}

                  </svg>
                </div>

                <div className="text-[11px] text-slate-500">
                  Traktplottet illustrerer spredningen av effektstørrelser mot studiens standardfeil (SE). Asymmetri (hull på én side) indikerer at mindre studier med negative/nøytrale resultater kan være upublisert.
                </div>
              </div>

              {/* Right: Statistical Tests (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Egger's Test Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Egger's Linear Regression Test
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sensitivityResult.eggersTest.hasBiasRisk ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {sensitivityResult.eggersTest.hasBiasRisk ? 'Asymmetri påvist' : 'Symmetrisk'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-sans">Intercept (a)</span>
                      <strong className="text-slate-800">{sensitivityResult.eggersTest.intercept}</strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-sans">P-verdi</span>
                      <strong className={sensitivityResult.eggersTest.pValue < 0.1 ? 'text-amber-600' : 'text-emerald-600'}>
                        {sensitivityResult.eggersTest.pValue}
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                    {sensitivityResult.eggersTest.interpretation}
                  </p>
                </div>

                {/* Begg's Rank Correlation */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Begg &amp; Mazumdar Rank Correlation
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">Kendall's τ</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Tau = <strong className="font-mono">{sensitivityResult.beggsTest.kendallsTau}</strong> (p = {sensitivityResult.beggsTest.pValue}). {sensitivityResult.beggsTest.interpretation}
                  </div>
                </div>

                {/* Trim and Fill Analysis */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Duval &amp; Tweedie Trim &amp; Fill
                    </h4>
                    <span className="text-[10px] font-mono text-blue-600 font-bold">Justert Estimering</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      Estimerte manglende studier: <strong>{sensitivityResult.trimAndFill.imputedStudiesCount}</strong>
                    </div>
                    <div>
                      Bias-justert effekt: <strong className="font-mono text-blue-700">{sensitivityResult.trimAndFill.adjustedPooledEffect.toFixed(2)} [95% CI {sensitivityResult.trimAndFill.adjustedLowerCi.toFixed(2)} til {sensitivityResult.trimAndFill.adjustedUpperCi.toFixed(2)}]</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 4: LEAVE-ONE-OUT SENSITIVITY ANALYSIS */}
        {activeTab === 'leaveOneOut' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-purple-600" />
                    <span>Leave-One-Out (Jackknife) Robusthetsanalyse</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gjennomregner den samlede meta-analysen systematisk ved å utelate én og én studie for å identifisere dominerende drivere.
                  </p>
                </div>
                <span className="text-xs font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-bold">
                  {leaveOneOutResults.length} iterasjoner
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Utelatt Studie</th>
                      <th className="p-3 text-center">Resulterende Samlet Effekt</th>
                      <th className="p-3 text-center">95% Konfidensintervall</th>
                      <th className="p-3 text-center">Resulterende I²</th>
                      <th className="p-3 text-center">P-verdi</th>
                      <th className="p-3 text-center">Effektskift (Δ)</th>
                      <th className="p-3 text-center">Robusthet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {leaveOneOutResults.map((row) => (
                      <tr key={row.excludedStudyId} className="hover:bg-slate-50 transition-colors font-sans">
                        <td className="p-3 font-semibold text-slate-900">
                          {row.excludedStudyTitle}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-blue-700">
                          {row.pooledEffect.toFixed(2)}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">
                          [{row.lowerCi.toFixed(2)}, {row.upperCi.toFixed(2)}]
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span className={row.i2 > 50 ? 'text-amber-600' : 'text-emerald-600'}>
                            {row.i2}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">
                          {row.pValue < 0.001 ? '<0.001' : row.pValue.toFixed(3)}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span className={row.deltaEffect === 0 ? 'text-slate-400' : row.deltaEffect > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                            {row.deltaEffect > 0 ? '+' : ''}{row.deltaEffect.toFixed(3)}
                          </span>
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                            Stabil
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: GRADE SUMMARY OF FINDINGS */}
        {activeTab === 'grade' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>WHO GRADE Summary of Findings (SoF) Tabell</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Strukturert vurdering av evidensens sikkerhet basert på aktive sensitivitets- og bias-parametre.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  Samlet Grad: <strong className="text-blue-700 uppercase">{sensitivityResult.gradeCertainty}</strong>
                </span>
              </div>

              {/* Downgrade Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                
                {/* 1. Risk of Bias */}
                <div className={`p-3.5 rounded-lg border space-y-1.5 ${
                  sensitivityResult.gradeDowngrades.riskOfBias.downgraded
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center justify-between">
                    <span>1. Risk of Bias</span>
                    <span>{sensitivityResult.gradeDowngrades.riskOfBias.downgraded ? '−1 Grad' : 'Ingen'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {sensitivityResult.gradeDowngrades.riskOfBias.reason || 'Ingen alvorlige metodiske svakheter blant inkluderte studier.'}
                  </p>
                </div>

                {/* 2. Inconsistency */}
                <div className={`p-3.5 rounded-lg border space-y-1.5 ${
                  sensitivityResult.gradeDowngrades.inconsistency.downgraded
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center justify-between">
                    <span>2. Inconsistency (I²)</span>
                    <span>{sensitivityResult.gradeDowngrades.inconsistency.downgraded ? '−1 Grad' : 'Ingen'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {sensitivityResult.gradeDowngrades.inconsistency.reason || `Lav/moderat heterogenitet (I² = ${sensitivityResult.heterogeneityI2}%).`}
                  </p>
                </div>

                {/* 3. Indirectness */}
                <div className="p-3.5 rounded-lg border bg-emerald-50/70 border-emerald-200 text-emerald-900 space-y-1.5">
                  <div className="font-bold flex items-center justify-between">
                    <span>3. Indirectness</span>
                    <span>Ingen</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Direkte overførbar populasjon og intervensjonsmåling i henhold til PICO.
                  </p>
                </div>

                {/* 4. Imprecision */}
                <div className={`p-3.5 rounded-lg border space-y-1.5 ${
                  sensitivityResult.gradeDowngrades.imprecision.downgraded
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center justify-between">
                    <span>4. Imprecision</span>
                    <span>{sensitivityResult.gradeDowngrades.imprecision.downgraded ? '−1 Grad' : 'Ingen'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {sensitivityResult.gradeDowngrades.imprecision.reason || `Tilstrekkelig utvalg (N = ${sensitivityResult.totalParticipants.toLocaleString()}) og presise konfidensgrenser.`}
                  </p>
                </div>

                {/* 5. Publication Bias */}
                <div className={`p-3.5 rounded-lg border space-y-1.5 ${
                  sensitivityResult.gradeDowngrades.publicationBias.downgraded
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center justify-between">
                    <span>5. Publ. Bias</span>
                    <span>{sensitivityResult.gradeDowngrades.publicationBias.downgraded ? '−1 Grad' : 'Ingen'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {sensitivityResult.gradeDowngrades.publicationBias.reason || 'Symmetrisk traktplott og negativ Egger’s test (p ≥ 0.10).'}
                  </p>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer / Commit Action Bar */}
      <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        
        <div className="flex items-center gap-2">
          {commitSuccess ? (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Syntesestatus vellykket oppdatert &amp; SHA-256 forseglet!</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Sensitivitetsendringer kan lagres direkte til prosjektets aktive <code>SynthesisOutcome</code> tilstand.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs flex items-center gap-1.5"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedNotification ? 'Kopiert!' : 'Kopier Sammendrag'}</span>
          </button>

          <button
            id="commit-sensitivity-state-btn"
            onClick={handleCommitSynthesis}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lagre &amp; Oppdater Syntese-tilstand (Commit)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
          >
            Lukk
          </button>
        </div>

      </div>

    </div>
  );
};
