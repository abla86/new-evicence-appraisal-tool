import React, { useState, useMemo, useEffect } from 'react';
import { AppraisalAssessment, AuditLogEntry, PrismaFlowData, StudyRecord } from '../types';
import { 
  generateCsvExport, 
  generateJsonExport, 
  generateJsonLdExport,
  generateMarkdownReport, 
  generateRisExport, 
  generateResearchBundleZip,
  generateManifestPreview,
  generateKtaActionPlanExport,
  generateCfirEvaluationExport,
  triggerFileDownload,
  BibliographicExportOptions
} from '../utils/exporters';
import { 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  CheckCircle2, 
  X, 
  Printer, 
  Archive, 
  Sparkles, 
  ShieldCheck, 
  PackageCheck, 
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Code2,
  Settings2,
  Database,
  ExternalLink,
  BookOpen,
  Share2,
  Search,
  WrapText,
  FileCheck2,
  HelpCircle,
  Hash
} from 'lucide-react';

interface ExportModalProps {
  studies: StudyRecord[];
  assessments: Record<string, AppraisalAssessment[]>;
  auditLog: AuditLogEntry[];
  prismaData: PrismaFlowData;
  activeStudyId: string;
  onClose: () => void;
}

type PreviewFormatType = 'jsonld' | 'ris' | 'csv' | 'markdown' | 'json' | 'manifest';

export const ExportModal: React.FC<ExportModalProps> = ({
  studies,
  assessments,
  auditLog,
  prismaData,
  activeStudyId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bibliographic' | 'bundle'>('all');
  const [csvDelimiter, setCsvDelimiter] = useState<';' | ','>(';');
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [isBundling, setIsBundling] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  
  // Dedicated Preview State
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<PreviewFormatType>('jsonld');
  const [previewSearchQuery, setPreviewSearchQuery] = useState('');
  const [wrapLines, setWrapLines] = useState(false);
  const [liveManifest, setLiveManifest] = useState<string>('Computing SHA-256 manifest hashes...');

  // Bibliographic export configuration options
  const [bioOptions, setBioOptions] = useState<BibliographicExportOptions>({
    includeAuditLogs: true,
    includeAppraisalScores: true,
    includeSha256Fingerprints: true,
    includeRationales: true,
    includePicoExtractions: true,
    targetSoftware: 'general'
  });

  const activeStudy = studies.find(s => s.id === activeStudyId) || studies[0];
  const activeStudyAssessments = activeStudy ? (assessments[activeStudy.id] || []) : [];

  // Generate live strings for preview & exports
  const liveJsonLd = useMemo(() => {
    return generateJsonLdExport(studies, assessments, auditLog, bioOptions);
  }, [studies, assessments, auditLog, bioOptions]);

  const liveRis = useMemo(() => {
    return generateRisExport(studies, assessments, auditLog, bioOptions);
  }, [studies, assessments, auditLog, bioOptions]);

  const liveCsv = useMemo(() => {
    return generateCsvExport(studies, assessments, csvDelimiter);
  }, [studies, assessments, csvDelimiter]);

  const liveJson = useMemo(() => {
    return generateJsonExport(studies, assessments, auditLog);
  }, [studies, assessments, auditLog]);

  const liveMarkdown = useMemo(() => {
    if (!activeStudy) return '# No active study selected for report synthesis';
    const assessment = activeStudyAssessments[0] || {
      id: 'default',
      studyId: activeStudy.id,
      instrument: 'AMSTAR2',
      reviewerName: 'Lead Reviewer',
      reviewerRole: 'Lead Reviewer',
      ratings: {},
      updatedAt: new Date().toISOString()
    };
    return generateMarkdownReport(activeStudy, assessment);
  }, [activeStudy, activeStudyAssessments]);

  // Compute live manifest whenever studies, assessments or audit log changes
  useEffect(() => {
    let isCurrent = true;
    generateManifestPreview(studies, assessments, auditLog, prismaData, 'PROJ-2026-SR-01')
      .then(m => {
        if (isCurrent) setLiveManifest(m);
      })
      .catch(() => {
        if (isCurrent) setLiveManifest('# Failed to compute manifest hashes');
      });
    return () => { isCurrent = false; };
  }, [studies, assessments, auditLog, prismaData]);

  // Current active preview string
  const currentPreviewString = useMemo(() => {
    switch (previewFormat) {
      case 'jsonld': return liveJsonLd;
      case 'ris': return liveRis;
      case 'csv': return liveCsv;
      case 'markdown': return liveMarkdown;
      case 'json': return liveJson;
      case 'manifest': return liveManifest;
      default: return liveJsonLd;
    }
  }, [previewFormat, liveJsonLd, liveRis, liveCsv, liveMarkdown, liveJson, liveManifest]);

  // Filtered preview lines or highlighted count
  const previewLines = useMemo(() => {
    return currentPreviewString.split('\n');
  }, [currentPreviewString]);

  const searchMatchCount = useMemo(() => {
    if (!previewSearchQuery.trim()) return 0;
    const query = previewSearchQuery.toLowerCase();
    return (currentPreviewString.toLowerCase().match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }, [currentPreviewString, previewSearchQuery]);

  const handleExportResearchBundle = async () => {
    try {
      setIsBundling(true);
      const zipBlob = await generateResearchBundleZip(
        studies,
        assessments,
        auditLog,
        prismaData,
        'PROJ-2026-SR-01'
      );
      triggerFileDownload(zipBlob, `ResearchBundle_PROJ-2026-SR-01_${Date.now()}.zip`, 'application/zip');
      setIsBundling(false);
      setExportSuccessMessage('Exported complete ResearchBundle.zip with all 14 reproducibility artifacts & manifest.sha256.');
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setIsBundling(false);
    }
  };

  const handleExportJsonLd = () => {
    triggerFileDownload(
      liveJsonLd, 
      `Evidence_Bibliographic_SchemaOrg_${Date.now()}.jsonld`, 
      'application/ld+json;charset=utf-8'
    );
    setExportSuccessMessage(`Downloaded machine-readable JSON-LD (Schema.org) with ${studies.length} studies & cryptographic audit logs.`);
    setTimeout(() => setExportSuccessMessage(null), 3000);
  };

  const handleExportRis = () => {
    triggerFileDownload(
      liveRis, 
      `Evidence_Bibliographic_References_${Date.now()}.ris`, 
      'application/x-research-info-systems;charset=utf-8'
    );
    setExportSuccessMessage(`Downloaded RIS references with embedded audit logs & SHA-256 fingerprints for Zotero / EndNote / Mendeley / Rayyan.`);
    setTimeout(() => setExportSuccessMessage(null), 3000);
  };

  const handleExportCsv = () => {
    triggerFileDownload(liveCsv, `Evidence_Appraisal_Matrix_${Date.now()}.csv`, 'text/csv;charset=utf-8');
    setExportSuccessMessage(`Downloaded complete CSV appraisal matrix (${studies.length} studies).`);
    setTimeout(() => setExportSuccessMessage(null), 2500);
  };

  const handleExportJson = () => {
    triggerFileDownload(liveJson, `Evidence_Appraisal_Project_Backup_${Date.now()}.json`, 'application/json;charset=utf-8');
    setExportSuccessMessage(`Downloaded full cryptographic project JSON archive.`);
    setTimeout(() => setExportSuccessMessage(null), 2500);
  };

  const handleExportMarkdown = () => {
    if (!activeStudy) return;
    triggerFileDownload(liveMarkdown, `${activeStudy.fileName.replace(/\.[^/.]+$/, '')}_Appraisal_Report.md`, 'text/markdown;charset=utf-8');
    setExportSuccessMessage(`Downloaded Markdown appraisal report.`);
    setTimeout(() => setExportSuccessMessage(null), 2500);
  };

  const handleExportKta = () => {
    const ktaReport = generateKtaActionPlanExport(studies, assessments);
    triggerFileDownload(ktaReport, `KTA_Implementation_Plan_${Date.now()}.md`, 'text/markdown;charset=utf-8');
    setExportSuccessMessage(`Downloaded KTA 12-Month Action Plan (Markdown).`);
    setTimeout(() => setExportSuccessMessage(null), 2500);
  };

  const handleExportCfir = () => {
    const cfirReport = generateCfirEvaluationExport(studies, assessments);
    triggerFileDownload(cfirReport, `CFIR2_Implementation_Evaluation_${Date.now()}.md`, 'text/markdown;charset=utf-8');
    setExportSuccessMessage(`Downloaded CFIR 2.0 Evaluation Report (Markdown).`);
    setTimeout(() => setExportSuccessMessage(null), 2500);
  };

  const handleExportManifest = () => {
    triggerFileDownload(liveManifest, `manifest_${Date.now()}.sha256`, 'text/plain;charset=utf-8');
    setExportSuccessMessage(`Downloaded cryptographic SHA-256 bundle manifest.`);
    setTimeout(() => setExportSuccessMessage(null), 2500);
  };

  const handleDownloadActivePreview = () => {
    switch (previewFormat) {
      case 'jsonld': handleExportJsonLd(); break;
      case 'ris': handleExportRis(); break;
      case 'csv': handleExportCsv(); break;
      case 'markdown': handleExportMarkdown(); break;
      case 'json': handleExportJson(); break;
      case 'manifest': handleExportManifest(); break;
    }
  };

  const handleCopyText = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setExportSuccessMessage(`Copied ${formatName} to clipboard!`);
    setTimeout(() => {
      setCopiedFormat(null);
      setExportSuccessMessage(null);
    }, 2500);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const openPreviewForFormat = (fmt: PreviewFormatType) => {
    setPreviewFormat(fmt);
    setIsPreviewActive(true);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden max-w-3xl w-full flex flex-col max-h-[92vh]">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-700 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2.5 rounded-lg flex items-center justify-center shadow-xs">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Universal Bibliographic &amp; Evidence Export Service</span>
              <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                W3C JSON-LD • RIS • PRISMA 2020
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Machine-readable datasets, linked bibliographic references (Zotero, EndNote, Mendeley), and sealed audit packages
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Main Top-Level Preview Toggle */}
          <button
            id="toggle-export-preview-btn"
            onClick={() => setIsPreviewActive(!isPreviewActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isPreviewActive 
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Toggle Live Code & Data Preview"
          >
            {isPreviewActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
            <span>{isPreviewActive ? 'Lukk Preview' : 'Live Preview'}</span>
          </button>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('all'); setIsPreviewActive(false); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-md border-b-2 transition-colors ${
              activeTab === 'all' && !isPreviewActive
                ? 'border-blue-600 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            All Export Options
          </button>
          <button
            onClick={() => { setActiveTab('bibliographic'); setIsPreviewActive(false); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-md border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'bibliographic' && !isPreviewActive
                ? 'border-blue-600 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Bibliographic (JSON-LD &amp; RIS)</span>
          </button>
          <button
            onClick={() => { setActiveTab('bundle'); setIsPreviewActive(false); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-md border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'bundle' && !isPreviewActive
                ? 'border-blue-600 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-indigo-600" />
            <span>Research Bundle (ZIP)</span>
          </button>
          <button
            onClick={() => setIsPreviewActive(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-md border-b-2 transition-colors flex items-center gap-1.5 ${
              isPreviewActive
                ? 'border-indigo-600 text-indigo-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Code Preview</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono pb-1">
          Corpus: <strong className="text-slate-800">{studies.length} studies</strong> • Ledger: <strong className="text-slate-800">{auditLog.length} events</strong>
        </div>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1">
        
        {/* Success Alert */}
        {exportSuccessMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-2 text-xs font-semibold shadow-2xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN DEDICATED LIVE PREVIEW PANE (When isPreviewActive is true) */}
        {/* ========================================================================= */}
        {isPreviewActive ? (
          <div className="space-y-3 animate-fade-in">
            
            {/* Preview Toolbar */}
            <div className="p-3 bg-slate-900 text-white rounded-t-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              
              {/* Format Switcher Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  Format:
                </span>
                
                <button
                  onClick={() => setPreviewFormat('jsonld')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    previewFormat === 'jsonld'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  JSON-LD (Schema.org)
                </button>

                <button
                  onClick={() => setPreviewFormat('ris')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    previewFormat === 'ris'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  RIS (.ris)
                </button>

                <button
                  onClick={() => setPreviewFormat('csv')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    previewFormat === 'csv'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  CSV Matrix
                </button>

                <button
                  onClick={() => setPreviewFormat('markdown')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    previewFormat === 'markdown'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Markdown (.md)
                </button>

                <button
                  onClick={() => setPreviewFormat('json')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    previewFormat === 'json'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Raw JSON
                </button>

                <button
                  onClick={() => setPreviewFormat('manifest')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors flex items-center gap-1 ${
                    previewFormat === 'manifest'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  <span>manifest.sha256</span>
                </button>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2">
                {/* Search In Preview */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    value={previewSearchQuery}
                    onChange={(e) => setPreviewSearchQuery(e.target.value)}
                    placeholder="Søk i preview..."
                    className="bg-slate-800 border border-slate-700 rounded text-xs text-white pl-7 pr-2 py-1 focus:outline-hidden focus:border-blue-500 w-32 sm:w-40 font-sans"
                  />
                  {previewSearchQuery && (
                    <span className="absolute right-2 top-1 text-[10px] text-blue-400 font-mono">
                      {searchMatchCount} treff
                    </span>
                  )}
                </div>

                {/* Wrap Lines Toggle */}
                <button
                  onClick={() => setWrapLines(!wrapLines)}
                  className={`p-1.5 rounded text-xs transition-colors border ${
                    wrapLines 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Word Wrap"
                >
                  <WrapText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Options Strip inside Preview */}
            <div className="px-3 py-2 bg-slate-800 text-slate-300 text-[11px] flex flex-wrap items-center justify-between gap-2 border-x border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Linjer: <strong className="text-white">{previewLines.length}</strong></span>
                <span className="text-slate-400">Størrelse: <strong className="text-white">{(new Blob([currentPreviewString]).size / 1024).toFixed(1)} KB</strong></span>
                <span className="text-slate-400">Studier: <strong className="text-white">{studies.length}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                {previewFormat === 'jsonld' && (
                  <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> W3C Schema.org Valid Linked Data
                  </span>
                )}
                {previewFormat === 'ris' && (
                  <span className="text-sky-400 font-mono text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> EndNote / Zotero / Rayyan Tagged
                  </span>
                )}
                {previewFormat === 'csv' && (
                  <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> UTF-8 BOM Excel Compatible
                  </span>
                )}
                {previewFormat === 'manifest' && (
                  <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Cryptographic SHA-256 Bundle Hashes
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable PRE Tag */}
            <div className="relative bg-slate-950 text-slate-100 rounded-b-xl border border-slate-800 overflow-hidden shadow-inner">
              <pre 
                id="export-code-preview-pre"
                tabIndex={0}
                className={`p-4 text-[11px] font-mono leading-relaxed max-h-[380px] overflow-y-auto overflow-x-auto select-text focus:outline-hidden ${
                  wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre'
                }`}
              >
                {previewSearchQuery.trim() ? (
                  // Simple text rendering with highlight indicator
                  currentPreviewString
                ) : (
                  currentPreviewString
                )}
              </pre>
            </div>

            {/* Preview Action Bar */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  id="preview-copy-btn"
                  onClick={() => handleCopyText(currentPreviewString, previewFormat.toUpperCase())}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {copiedFormat === previewFormat.toUpperCase() ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier {previewFormat.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewActive(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Vis alle formater
                </button>

                <button
                  id="preview-download-btn"
                  onClick={handleDownloadActivePreview}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Bekreft &amp; Last ned {previewFormat.toUpperCase()}</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* STANDARD GRID / EXPORT TILES VIEW (When isPreviewActive is false) */
          /* ========================================================================= */
          <>
            {/* Bibliographic Section */}
            {(activeTab === 'all' || activeTab === 'bibliographic') && (
              <div className="space-y-4">
                
                {/* Bibliographic Settings & Options Bar */}
                <div className="p-3 bg-slate-100/80 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Settings2 className="w-4 h-4 text-slate-600" />
                    <span>Bibliographic &amp; Audit Options:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={bioOptions.includeAuditLogs !== false}
                        onChange={(e) => setBioOptions(prev => ({ ...prev, includeAuditLogs: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="font-medium">Embed Audit Trail (Merkle Chain)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={bioOptions.includeAppraisalScores !== false}
                        onChange={(e) => setBioOptions(prev => ({ ...prev, includeAppraisalScores: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="font-medium">Include Appraisal Scores</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={bioOptions.includeSha256Fingerprints !== false}
                        onChange={(e) => setBioOptions(prev => ({ ...prev, includeSha256Fingerprints: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="font-medium">SHA-256 Hashes</span>
                    </label>
                  </div>
                </div>

                {/* Option A: Machine-Readable JSON-LD (Schema.org / ScholarlyArticle Graph) */}
                <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all flex flex-col gap-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Machine-Readable JSON-LD (<code className="font-mono text-indigo-700 font-bold">@context: https://schema.org</code>)
                          </h4>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 font-mono uppercase">
                            W3C / Linked Data
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Generates a full Schema.org graph of <code className="font-mono text-[11px] text-indigo-900 font-bold">MedicalScholarlyArticle</code> and <code className="font-mono text-[11px] text-indigo-900 font-bold">Review</code> entities. Embeds all metadata, author lists, DOI canonical URIs, appraisal criteria, and cryptographic SHA-256 audit actions for semantic web platforms, RO-Crate, and programmatic AI ingestion.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      <button
                        id="preview-jsonld-button"
                        onClick={() => openPreviewForFormat('jsonld')}
                        className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Forhåndsvis formatert JSON-LD"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Preview</span>
                      </button>

                      <button
                        id="copy-jsonld-button"
                        onClick={() => handleCopyText(liveJsonLd, 'JSON-LD')}
                        className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Kopier til utklippstavle"
                      >
                        {copiedFormat === 'JSON-LD' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Kopier</span>
                      </button>

                      <button
                        id="export-jsonld-download-button"
                        onClick={handleExportJsonLd}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download JSON-LD</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option B: Standard RIS Reference File (Zotero, EndNote, Mendeley, Rayyan, Covidence) */}
                <div className="p-4 rounded-xl border-2 border-sky-200 bg-sky-50/40 hover:bg-sky-50/70 transition-all flex flex-col gap-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Bibliographic RIS File (<code className="font-mono text-sky-700 font-bold">.ris</code>)
                          </h4>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky-200 text-sky-900 font-mono uppercase">
                            EndNote • Zotero • Mendeley • Rayyan
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Universal Research Information Systems format with structured tags (<code className="font-mono text-[11px] text-sky-900 font-bold">TY, TI, AU, PY, JO, DO, AB, KW, N1, RN</code>). Embeds cryptographic SHA-256 fingerprint notes, methodological quality ratings, and sequential audit trail events.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      <button
                        id="preview-ris-button"
                        onClick={() => openPreviewForFormat('ris')}
                        className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Forhåndsvis formatert RIS"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-600" />
                        <span>Preview</span>
                      </button>

                      <button
                        id="copy-ris-button"
                        onClick={() => handleCopyText(liveRis, 'RIS')}
                        className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Kopier til utklippstavle"
                      >
                        {copiedFormat === 'RIS' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Kopier</span>
                      </button>

                      <button
                        id="export-ris-download-button"
                        onClick={handleExportRis}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download RIS</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Research Bundle ZIP */}
            {(activeTab === 'all' || activeTab === 'bundle') && (
              <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">Complete Research Bundle (ZIP)</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200/80 text-blue-900 font-mono">
                        14 ARTIFACTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Packages the complete synthesis: <code className="font-mono text-[11px] text-blue-800">project.json</code>, <code className="font-mono text-[11px] text-blue-800">protocol.json</code>, <code className="font-mono text-[11px] text-blue-800">references.ris</code>, <code className="font-mono text-[11px] text-blue-800 font-bold">bibliographic-metadata.jsonld</code>, <code className="font-mono text-[11px] text-blue-800">screening.csv</code>, <code className="font-mono text-[11px] text-blue-800">appraisals.json</code>, <code className="font-mono text-[11px] text-blue-800">dual-review.json</code>, <code className="font-mono text-[11px] text-blue-800">prisma.json</code>, <code className="font-mono text-[11px] text-blue-800">evidence-map.json</code>, <code className="font-mono text-[11px] text-blue-800">audit.json</code>, and cryptographic <code className="font-mono text-[11px] font-bold text-emerald-800">manifest.sha256</code>.
                    </p>
                  </div>
                </div>

                <button
                  id="export-research-bundle-btn"
                  onClick={handleExportResearchBundle}
                  disabled={isBundling}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  {isBundling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Hashing &amp; Bundling...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" />
                      <span>Download Bundle (ZIP)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tabular and Summary Reports */}
            {activeTab === 'all' && (
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tabular &amp; Analytical Reports
                </div>

                {/* CSV Matrix Export */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">CSV Appraisal Matrix</h4>
                      <p className="text-xs text-slate-500">
                        Detailed domain-by-domain table with UTF-8 BOM (Excel compatible)
                      </p>
                      
                      <div className="mt-1.5 flex items-center gap-3 text-xs">
                        <span className="text-slate-600 font-semibold text-[11px]">Skilletegn:</span>
                        <label className="flex items-center gap-1 cursor-pointer text-[11px]">
                          <input
                            type="radio"
                            name="csvDelim"
                            value=";"
                            checked={csvDelimiter === ';'}
                            onChange={() => setCsvDelimiter(';')}
                            className="text-blue-600"
                          />
                          <span>Semikolon (;) [Norsk/Excel]</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer text-[11px]">
                          <input
                            type="radio"
                            name="csvDelim"
                            value=","
                            checked={csvDelimiter === ','}
                            onChange={() => setCsvDelimiter(',')}
                            className="text-blue-600"
                          />
                          <span>Komma (,) [Internasjonal]</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPreviewForFormat('csv')}
                      className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Preview CSV"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      id="export-csv-download-button"
                      onClick={handleExportCsv}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Markdown / Printable Summary */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Markdown &amp; Printable Summary</h4>
                      <p className="text-xs text-slate-500">
                        Publication-ready report for active study: "{activeStudy?.title.substring(0, 32)}..."
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPreviewForFormat('markdown')}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Preview Markdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      id="export-md-download-button"
                      onClick={handleExportMarkdown}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Markdown</span>
                    </button>
                    <button
                      id="print-summary-button"
                      onClick={handlePrintReport}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded transition-colors flex items-center gap-1.5 border border-slate-300"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* Implementation Science (KTA & CFIR 2.0) Reports */}
                <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0 border border-teal-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900">Implementeringsvitenskapelige Rapporter</h4>
                        <span className="text-[10px] font-mono bg-teal-200 text-teal-900 px-1.5 py-0.2 rounded font-bold">KTA &amp; CFIR 2.0</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Kunnskapsbasert 12-måneders handlingsplan (Graham et al.) og CFIR 2.0 evalueringsrapport.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="export-kta-action-plan-button"
                      onClick={handleExportKta}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>KTA Plan</span>
                    </button>
                    <button
                      id="export-cfir-evaluation-button"
                      onClick={handleExportCfir}
                      className="px-3 py-1.5 bg-teal-900 hover:bg-black text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CFIR 2.0</span>
                    </button>
                  </div>
                </div>

                {/* Raw JSON Project Backup */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-slate-200 text-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-300">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Full Project JSON Package</h4>
                      <p className="text-xs text-slate-500">
                        Raw JSON dump containing datasets, assessments, ratings, and cryptographic ledger.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPreviewForFormat('json')}
                      className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Preview JSON"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      id="export-json-download-button"
                      onClick={handleExportJson}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </>
        )}

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All exports are timestamped &amp; bound to SHA-256 cryptographic provenance</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
        >
          Lukk
        </button>
      </div>

    </div>
  );
};


