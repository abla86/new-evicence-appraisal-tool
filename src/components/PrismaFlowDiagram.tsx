import React, { useState } from 'react';
import { PrismaFlowData } from '../types';
import { 
  GitBranch, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Plus, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { triggerFileDownload } from '../utils/exporters';

interface PrismaFlowDiagramProps {
  data: PrismaFlowData;
  onSavePrisma: (data: PrismaFlowData) => void;
  onClose: () => void;
}

export const PrismaFlowDiagram: React.FC<PrismaFlowDiagramProps> = ({
  data,
  onSavePrisma,
  onClose
}) => {
  const [formData, setFormData] = useState<PrismaFlowData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Excluded reasons state
  const [screeningReasonKey, setScreeningReasonKey] = useState('');
  const [screeningReasonVal, setScreeningReasonVal] = useState<number>(10);

  const [eligibilityReasonKey, setEligibilityReasonKey] = useState('');
  const [eligibilityReasonVal, setEligibilityReasonVal] = useState<number>(10);

  const handleUpdateField = <K extends keyof PrismaFlowData>(field: K, value: PrismaFlowData[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'number' ? Math.max(0, value) : value
    }));
  };

  const handleAddScreeningReason = () => {
    if (!screeningReasonKey.trim()) return;
    setFormData(prev => ({
      ...prev,
      exclusionReasonsScreening: {
        ...prev.exclusionReasonsScreening,
        [screeningReasonKey.trim()]: screeningReasonVal
      }
    }));
    setScreeningReasonKey('');
  };

  const handleRemoveScreeningReason = (key: string) => {
    setFormData(prev => {
      const next = { ...prev.exclusionReasonsScreening };
      delete next[key];
      return { ...prev, exclusionReasonsScreening: next };
    });
  };

  const handleAddEligibilityReason = () => {
    if (!eligibilityReasonKey.trim()) return;
    setFormData(prev => ({
      ...prev,
      exclusionReasonsEligibility: {
        ...prev.exclusionReasonsEligibility,
        [eligibilityReasonKey.trim()]: eligibilityReasonVal
      }
    }));
    setEligibilityReasonKey('');
  };

  const handleRemoveEligibilityReason = (key: string) => {
    setFormData(prev => {
      const next = { ...prev.exclusionReasonsEligibility };
      delete next[key];
      return { ...prev, exclusionReasonsEligibility: next };
    });
  };

  const handleSave = () => {
    onSavePrisma(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportSvg = () => {
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 800" width="100%" height="100%" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <style>
    .box { fill: #f8fafc; stroke: #2563eb; stroke-width: 2; rx: 6; }
    .box-side { fill: #fef2f2; stroke: #dc2626; stroke-width: 1.5; rx: 6; }
    .title { font-size: 13px; font-weight: bold; fill: #0f172a; }
    .text { font-size: 12px; fill: #334155; }
    .arrow { stroke: #2563eb; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
    .side-arrow { stroke: #dc2626; stroke-width: 1.5; fill: none; marker-end: url(#side-arrowhead); }
  </style>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
    </marker>
    <marker id="side-arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
    </marker>
  </defs>

  <!-- Identification Header -->
  <text x="40" y="40" font-size="16" font-weight="bold" fill="#0f172a">PRISMA 2020 Flow Diagram for Systematic Reviews</text>
  
  <!-- Identification Boxes -->
  <rect x="50" y="70" width="380" height="90" class="box" />
  <text x="70" y="95" class="title">Identification of studies via databases and registers</text>
  <text x="70" y="120" class="text">Records identified from databases: n = ${formData.recordsIdentifiedDatabases}</text>
  <text x="70" y="140" class="text">Records identified from registers: n = ${formData.recordsIdentifiedRegisters}</text>

  <!-- Duplicates Removed -->
  <rect x="500" y="70" width="340" height="70" class="box-side" />
  <text x="520" y="95" class="title" fill="#991b1b">Duplicate records removed</text>
  <text x="520" y="120" class="text">Duplicates removed before screening: n = ${formData.duplicatesRemoved}</text>
  <path d="M 430 115 L 500 115" class="side-arrow" />

  <!-- Arrow down to Screening -->
  <path d="M 240 160 L 240 210" class="arrow" />

  <!-- Screening Box -->
  <rect x="50" y="210" width="380" height="75" class="box" />
  <text x="70" y="235" class="title">Screening</text>
  <text x="70" y="260" class="text">Records screened (Title/Abstract): n = ${formData.recordsScreened}</text>

  <!-- Records Excluded Screening -->
  <rect x="500" y="210" width="340" height="75" class="box-side" />
  <text x="520" y="235" class="title" fill="#991b1b">Records excluded during screening</text>
  <text x="520" y="260" class="text">Excluded: n = ${formData.recordsExcludedScreening}</text>
  <path d="M 430 245 L 500 245" class="side-arrow" />

  <!-- Arrow down to Eligibility -->
  <path d="M 240 285 L 240 335" class="arrow" />

  <!-- Reports sought -->
  <rect x="50" y="335" width="380" height="75" class="box" />
  <text x="70" y="360" class="title">Eligibility Assessment</text>
  <text x="70" y="385" class="text">Reports sought for retrieval: n = ${formData.reportsSoughtForRetrieval}</text>

  <!-- Reports not retrieved -->
  <rect x="500" y="335" width="340" height="75" class="box-side" />
  <text x="520" y="360" class="title" fill="#991b1b">Reports not retrieved</text>
  <text x="520" y="385" class="text">Full text reports not retrieved: n = ${formData.reportsNotRetrieved}</text>
  <path d="M 430 370 L 500 370" class="side-arrow" />

  <!-- Arrow down to Assessed -->
  <path d="M 240 410 L 240 460" class="arrow" />

  <!-- Reports assessed -->
  <rect x="50" y="460" width="380" height="75" class="box" />
  <text x="70" y="485" class="title">Full-text reports assessed for eligibility</text>
  <text x="70" y="510" class="text">Assessed for eligibility: n = ${formData.reportsAssessedForEligibility}</text>

  <!-- Reports Excluded with reasons -->
  <rect x="500" y="460" width="340" height="120" class="box-side" />
  <text x="520" y="485" class="title" fill="#991b1b">Reports excluded (with reasons): n = ${formData.reportsExcludedEligibility}</text>
  ${Object.entries(formData.exclusionReasonsEligibility || {}).map(([reason, count], idx) => `
  <text x="520" y="${510 + (idx * 20)}" class="text">• ${reason}: n = ${count}</text>
  `).join('')}
  <path d="M 430 500 L 500 500" class="side-arrow" />

  <!-- Arrow down to Included -->
  <path d="M 240 535 L 240 610" class="arrow" />

  <!-- Included -->
  <rect x="50" y="610" width="380" height="90" class="box" style="fill: #ecfdf5; stroke: #059669; stroke-width: 2.5;" />
  <text x="70" y="640" class="title" fill="#065f46" font-size="14">Included Studies in Synthesis</text>
  <text x="70" y="665" class="text" font-weight="bold">Total new studies included: n = ${formData.newStudiesIncluded}</text>
  <text x="70" y="685" class="text">Synthesized in meta-analysis: n = ${formData.totalStudiesIncluded}</text>
</svg>
`;
    triggerFileDownload(svgContent, 'PRISMA_2020_Flow_Diagram.svg', 'image/svg+xml;charset=utf-8');
  };

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col max-h-[88vh]">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-700 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded flex items-center justify-center">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              PRISMA 2020 Flow Diagram Builder &amp; Validator
            </h3>
            <p className="text-xs text-slate-400">
              Interactive flow counts across Identification, Screening, Eligibility, and Synthesis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="export-prisma-svg-btn"
            onClick={handleExportSvg}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export SVG</span>
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Flow Editor */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* Phase 1: Identification */}
        <div className="p-4 rounded border border-slate-200 bg-slate-50">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            1. Identification of Studies
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Database Records</label>
              <input
                type="number"
                value={formData.recordsIdentifiedDatabases}
                onChange={(e) => handleUpdateField('recordsIdentifiedDatabases', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Trial Registers</label>
              <input
                type="number"
                value={formData.recordsIdentifiedRegisters}
                onChange={(e) => handleUpdateField('recordsIdentifiedRegisters', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Duplicates Removed</label>
              <input
                type="number"
                value={formData.duplicatesRemoved}
                onChange={(e) => handleUpdateField('duplicatesRemoved', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-semibold text-rose-700"
              />
            </div>
          </div>
        </div>

        {/* Phase 2: Screening */}
        <div className="p-4 rounded border border-slate-200 bg-slate-50">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            2. Title &amp; Abstract Screening
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Records Screened</label>
              <input
                type="number"
                value={formData.recordsScreened}
                onChange={(e) => handleUpdateField('recordsScreened', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Records Excluded</label>
              <input
                type="number"
                value={formData.recordsExcludedScreening}
                onChange={(e) => handleUpdateField('recordsExcludedScreening', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-semibold text-rose-700"
              />
            </div>
          </div>

          {/* Exclusion breakdown */}
          <div className="bg-white p-3 rounded border border-slate-200 text-xs">
            <div className="font-semibold text-slate-700 mb-2">Exclusion Reasons (Screening):</div>
            <div className="space-y-1.5 mb-2">
              {Object.entries(formData.exclusionReasonsScreening || {}).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-800">{reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">n = {count}</span>
                    <button
                      onClick={() => handleRemoveScreeningReason(reason)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Reason (e.g. Non-RCT study design)"
                value={screeningReasonKey}
                onChange={(e) => setScreeningReasonKey(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded"
              />
              <input
                type="number"
                value={screeningReasonVal}
                onChange={(e) => setScreeningReasonVal(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
              />
              <button
                onClick={handleAddScreeningReason}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Phase 3: Eligibility */}
        <div className="p-4 rounded border border-slate-200 bg-slate-50">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            3. Full-Text Eligibility Assessment
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Reports Sought</label>
              <input
                type="number"
                value={formData.reportsSoughtForRetrieval}
                onChange={(e) => handleUpdateField('reportsSoughtForRetrieval', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Not Retrieved</label>
              <input
                type="number"
                value={formData.reportsNotRetrieved}
                onChange={(e) => handleUpdateField('reportsNotRetrieved', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-semibold text-rose-700"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Excluded (Full-Text)</label>
              <input
                type="number"
                value={formData.reportsExcludedEligibility}
                onChange={(e) => handleUpdateField('reportsExcludedEligibility', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-semibold text-rose-700"
              />
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200 text-xs">
            <div className="font-semibold text-slate-700 mb-2">Exclusion Reasons (Eligibility):</div>
            <div className="space-y-1.5 mb-2">
              {Object.entries(formData.exclusionReasonsEligibility || {}).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-800">{reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">n = {count}</span>
                    <button
                      onClick={() => handleRemoveEligibilityReason(reason)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Reason (e.g. Insufficient outcome reporting)"
                value={eligibilityReasonKey}
                onChange={(e) => setEligibilityReasonKey(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded"
              />
              <input
                type="number"
                value={eligibilityReasonVal}
                onChange={(e) => setEligibilityReasonVal(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
              />
              <button
                onClick={handleAddEligibilityReason}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Phase 4: Included */}
        <div className="p-4 rounded border border-emerald-300 bg-emerald-50/50">
          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3">
            4. Included Studies in Synthesis
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-emerald-900 font-semibold mb-1">New Studies Included</label>
              <input
                type="number"
                value={formData.newStudiesIncluded}
                onChange={(e) => handleUpdateField('newStudiesIncluded', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-emerald-900 font-semibold mb-1">Total in Meta-Analysis</label>
              <input
                type="number"
                value={formData.totalStudiesIncluded}
                onChange={(e) => handleUpdateField('totalStudiesIncluded', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-800 text-sm"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {savedSuccess && (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved PRISMA dataset
            </span>
          )}
        </div>
        <button
          id="save-prisma-flow-btn"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs transition-colors"
        >
          Save PRISMA Configuration
        </button>
      </div>

    </div>
  );
};
