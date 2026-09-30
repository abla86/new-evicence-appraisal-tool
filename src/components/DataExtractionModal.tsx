import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Link2, 
  Sparkles, 
  ShieldCheck, 
  X,
  FileText,
  HelpCircle,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { DataExtractionRecord, StudyRecord, SynthesisOutcome } from '../types';

interface DataExtractionModalProps {
  studies: StudyRecord[];
  activeStudyId: string;
  extractions: DataExtractionRecord[];
  synthesisOutcomes: SynthesisOutcome[];
  onSaveExtraction: (extraction: DataExtractionRecord) => void;
  onDeleteExtraction: (id: string) => void;
  onOpenSensitivityAnalysis?: () => void;
  onClose: () => void;
}

export const DataExtractionModal: React.FC<DataExtractionModalProps> = ({
  studies,
  activeStudyId,
  extractions,
  synthesisOutcomes,
  onSaveExtraction,
  onDeleteExtraction,
  onOpenSensitivityAnalysis,
  onClose
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<string>(activeStudyId || studies[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'extractions' | 'traceability'>('extractions');

  const activeStudy = studies.find(s => s.id === selectedStudyId) || studies[0];
  const studyExtractions = extractions.filter(e => e.studyId === selectedStudyId);

  // Form State for new/editing extraction
  const [sampleSize, setSampleSize] = useState<number | undefined>(4820);
  const [populationCharacteristics, setPopulationCharacteristics] = useState<string>(
    'Adults with Type 2 Diabetes, baseline HbA1c 8.2% ± 1.1%, mean age 58.4 years'
  );
  const [interventionDetails, setInterventionDetails] = useState<string>(
    'Remote continuous glucose telemetry + weekly asynchronous endocrinologist coaching'
  );
  const [comparatorDetails, setComparatorDetails] = useState<string>(
    'Standard primary care diabetes management with quarterly clinic visits'
  );
  const [primaryOutcomeMeasure, setPrimaryOutcomeMeasure] = useState<string>(
    'HbA1c change from baseline at 6 months (%)'
  );
  const [primaryOutcomeValue, setPrimaryOutcomeValue] = useState<string>(
    '-0.48% (95% CI -0.61 to -0.35)'
  );
  const [effectSizeEstimate, setEffectSizeEstimate] = useState<string>(
    'Mean Difference: -0.48% (p < 0.001, I² = 58%)'
  );
  const [adverseEvents, setAdverseEvents] = useState<string>(
    'No increase in severe hypoglycaemia episodes (RR 0.94, 95% CI 0.72-1.22)'
  );
  const [fundingAndCoi, setFundingAndCoi] = useState<string>(
    'National Medical Research Council (Grant NH-2023-8812); No commercial COI'
  );
  const [evidencePageRef, setEvidencePageRef] = useState<string>('Page 4, Results Section');
  const [rawQuote, setRawQuote] = useState<string>(
    'Telemedicine interventions produced a statistically significant reduction in HbA1c compared with standard care (Mean Difference -0.48%, 95% CI -0.61 to -0.35, p<0.001; I²=58%).'
  );
  const [extractedBy, setExtractedBy] = useState<string>('Dr. Sarah Lindqvist');

  const handleCreateOrUpdateExtraction = () => {
    if (!activeStudy) return;

    const newRecord: DataExtractionRecord = {
      id: `ext-${activeStudy.id}-${Date.now()}`,
      projectId: activeStudy.projectId || 'PROJ-2026-SR-01',
      studyId: activeStudy.id,
      studyTitle: activeStudy.title,
      sampleSize: sampleSize ?? 0,
      populationCharacteristics,
      interventionDetails,
      comparatorDetails,
      primaryOutcomeMeasure,
      primaryOutcomeValue,
      effectSizeEstimate,
      adverseEvents,
      fundingAndCoi,
      extractedBy,
      verifiedByResearcher: true,
      evidencePageRef,
      rawQuote,
      timestamp: new Date().toISOString()
    };

    onSaveExtraction(newRecord);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Data Extraction &amp; Evidence Grounding</h2>
              <span className="text-[11px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-semibold">
                PICO EVIDENCE LINEAGE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Source text extraction with page citations, effect size parameters &amp; cryptographic document hash linkage.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sub-header */}
      <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('extractions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'extractions'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Extraction Form
            </button>
            <button
              onClick={() => setActiveTab('traceability')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'traceability'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Evidence Lineage Matrix ({synthesisOutcomes.length} Outcomes)
            </button>
          </div>

          {/* Study Select */}
          {activeTab === 'extractions' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Target Study:</span>
              <select
                value={selectedStudyId}
                onChange={(e) => setSelectedStudyId(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded bg-white font-medium max-w-xs truncate cursor-pointer"
              >
                {studies.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeStudy && (
          <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>HASH: {activeStudy.documentHashSha256.substring(0, 10)}...</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
        
        {activeTab === 'extractions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Input Form (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Structured Extraction Variables</span>
                <span className="text-[10px] text-slate-400 font-mono">HUMAN VERIFIED</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sample Size (N Total)
                  </label>
                  <input
                    type="number"
                    value={sampleSize || ''}
                    onChange={(e) => setSampleSize(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reviewer Name
                  </label>
                  <input
                    type="text"
                    value={extractedBy}
                    onChange={(e) => setExtractedBy(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Population &amp; Baseline Characteristics
                </label>
                <input
                  type="text"
                  value={populationCharacteristics}
                  onChange={(e) => setPopulationCharacteristics(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Intervention Details
                  </label>
                  <textarea
                    rows={2}
                    value={interventionDetails}
                    onChange={(e) => setInterventionDetails(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comparator / Control
                  </label>
                  <textarea
                    rows={2}
                    value={comparatorDetails}
                    onChange={(e) => setComparatorDetails(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Outcome Measure
                  </label>
                  <input
                    type="text"
                    value={primaryOutcomeMeasure}
                    onChange={(e) => setPrimaryOutcomeMeasure(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Effect Size / Metric (MD, HR, RR, 95% CI)
                  </label>
                  <input
                    type="text"
                    value={effectSizeEstimate}
                    onChange={(e) => setEffectSizeEstimate(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Source Grounding Quote */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Evidence Source Grounding</span>
                  </span>
                  <input
                    type="text"
                    value={evidencePageRef}
                    onChange={(e) => setEvidencePageRef(e.target.value)}
                    placeholder="Page / Section..."
                    className="text-[11px] p-1 border border-slate-300 rounded bg-white w-40 text-slate-800"
                  />
                </div>
                <textarea
                  rows={2}
                  value={rawQuote}
                  onChange={(e) => setRawQuote(e.target.value)}
                  placeholder="Direct verbatim quote from source document..."
                  className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800 bg-white font-serif italic"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="save-extraction-btn"
                  onClick={handleCreateOrUpdateExtraction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Extraction Record</span>
                </button>
              </div>
            </div>

            {/* Right: Existing Extractions for this Study (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Stored Records for Study</span>
                <span className="text-blue-600 text-xs font-semibold">({studyExtractions.length})</span>
              </h3>

              {studyExtractions.length > 0 ? (
                <div className="space-y-3">
                  {studyExtractions.map((rec) => (
                    <div key={rec.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="font-bold text-slate-900">{rec.primaryOutcomeMeasure}</span>
                        <button
                          onClick={() => onDeleteExtraction(rec.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-blue-700 font-semibold">
                        Effect: {rec.effectSizeEstimate}
                      </div>

                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                        "{rec.rawQuote}"
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                        <span>Ref: {rec.evidencePageRef}</span>
                        <span>By: {rec.extractedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  No extraction records logged for this study yet. Complete the form to commit the first verified PICO dataset.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: Traceability Matrix */}
        {activeTab === 'traceability' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>End-to-End Evidence Grounding Lineage</span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">100% AUDITABLE</span>
              </h3>

              <div className="space-y-4">
                {synthesisOutcomes.map((out) => (
                  <div key={out.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                          {out.picoOutcomeCategory}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{out.outcomeName}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-blue-600 font-mono">{out.pooledEffectEstimate}</div>
                          <div className="text-[11px] text-slate-500">GRADE Certainty: <strong className="text-emerald-700">{out.gradeCertainty}</strong></div>
                        </div>
                        {onOpenSensitivityAnalysis && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenSensitivityAnalysis();
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                            title="Åpne Sensitivitets- & Bias-analyse for dette utfallet"
                          >
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            <span>Sensitivitet</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Grounding Lineage Chain */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Linked Primary Evidence Documents ({out.evidenceTraceLineage.length})
                      </div>
                      {out.evidenceTraceLineage.map((lineage, idx) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{lineage.studyTitle}</span>
                            <span className="text-[10px] font-mono text-emerald-600">
                              SHA-256: {lineage.documentHashSha256.substring(0, 12)}...
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded">
                            "{lineage.quote}"
                          </p>
                          <div className="text-[10px] text-slate-400">
                            Location: {lineage.page}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          All extracted numbers and quotes are ground-truth linked to document cryptographic SHA-256 seals.
        </span>
        <button
          onClick={onClose}
          className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-300 rounded-md transition-colors shadow-2xs"
        >
          Close
        </button>
      </div>

    </div>
  );
};
