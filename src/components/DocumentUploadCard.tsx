import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  ClipboardList,
  Layers,
  FileSpreadsheet,
  Check,
  Tag
} from 'lucide-react';
import { StudyRecord } from '../types';
import { parseMultiRecordDocument, parseAndAnalyzeDocument, identifyArticleCharacteristics } from '../utils/parsers';

interface DocumentUploadCardProps {
  onDocumentImported: (study: StudyRecord) => void;
  onClose?: () => void;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  onDocumentImported,
  onClose
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedFormat, setPastedFormat] = useState<'ris' | 'bib' | 'jats' | 'csv' | 'text'>('ris');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const files = Array.from(fileList);
      let totalImported = 0;
      let lastStudy: StudyRecord | null = null;

      for (const file of files) {
        const multiResult = await parseMultiRecordDocument(file);
        if (multiResult.studies.length > 0) {
          for (const s of multiResult.studies) {
            onDocumentImported(s);
            lastStudy = s;
            totalImported++;
          }
        }
      }

      if (totalImported > 1) {
        setSuccessMessage(`Importerte ${totalImported} forskningsartikler/studier med kryptografiske SHA-256 integritetssegl.`);
      } else if (lastStudy) {
        setSuccessMessage(`Importerte "${lastStudy.title.substring(0, 45)}..." (${lastStudy.documentType}).`);
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 900);
    } catch (err: unknown) {
      console.error('Document parsing error:', err);
      const msg = err instanceof Error ? err.message : 'Ukjent formatfeil';
      setErrorMessage(`Feil under lesing av dokument: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handlePastedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const ext = pastedFormat === 'ris' ? 'ris' : pastedFormat === 'bib' ? 'bib' : pastedFormat === 'csv' ? 'csv' : pastedFormat === 'jats' ? 'xml' : 'txt';
      const fakeName = `${pastedTitle.trim() || 'Pasted_Research_Document'}.${ext}`;
      const virtualFile = new File([pastedText], fakeName, { type: 'text/plain' });

      const multiResult = await parseMultiRecordDocument(virtualFile, pastedText);
      
      if (multiResult.studies.length > 0) {
        multiResult.studies.forEach(s => {
          if (pastedTitle.trim() && multiResult.studies.length === 1) {
            s.title = pastedTitle.trim();
          }
          onDocumentImported(s);
        });

        if (multiResult.studies.length > 1) {
          setSuccessMessage(`Importerte ${multiResult.studies.length} studier fra innlimt tekst.`);
        } else {
          setSuccessMessage(`Importerte "${multiResult.studies[0].title.substring(0, 45)}..."`);
        }

        setTimeout(() => {
          if (onClose) onClose();
        }, 900);
      } else {
        const single = await parseAndAnalyzeDocument(virtualFile, pastedText);
        if (pastedTitle.trim()) single.study.title = pastedTitle.trim();
        onDocumentImported(single.study);
        setSuccessMessage(`Importerte "${single.study.title.substring(0, 45)}..."`);
        setTimeout(() => {
          if (onClose) onClose();
        }, 900);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ukjent formatfeil';
      setErrorMessage(`Kunne ikke analysere innlimt tekst: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Live preview characteristics for pasted text
  const liveCharacteristics = pastedText.length > 30 
    ? identifyArticleCharacteristics(pastedText, pastedTitle) 
    : null;

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-xl overflow-hidden max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white p-2 rounded flex items-center justify-center">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Importer &amp; Identifiser Forskningsartikkel</h3>
            <p className="text-xs text-slate-400">PDF, DOCX, RIS, BibTeX, JATS/XML, CSV, JSON, TXT &amp; KTA-artikler</p>
          </div>
        </div>
        {onClose && (
          <button
            id="close-upload-modal-button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex border-b border-slate-200 px-6 bg-slate-50">
        <button
          id="upload-tab-file"
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'upload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Last opp filer (Enkelt eller Batch)</span>
        </button>
        <button
          id="upload-tab-paste"
          type="button"
          onClick={() => setActiveTab('paste')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'paste'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Lim inn tekst / RIS / BibTeX / XML</span>
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'upload' ? (
          <div
            id="dropzone-area"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-600 bg-blue-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-blue-600 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="scientific-file-input"
              multiple
              className="hidden"
              accept=".pdf,.xml,.jats,.ris,.bib,.bibtex,.txt,.docx,.csv,.json,.html"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />

            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-bold text-slate-900 mb-1">
              Dra &amp; slipp forskningsartikler eller referansebibliotek her
            </p>
            <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
              Støtter flervalg og batch-innlesing av hele RIS/BibTeX biblioteker, PDF-artikler, DOCX-manuskripter, CSV og JATS/XML. Automatisk artikkeltype-identifikasjon, PICO-utvinning og SHA-256 forsegling.
            </p>

            <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
              {[
                { label: '.ris (EndNote/Zotero)', type: 'Bibliografi' },
                { label: '.bib (BibTeX/LaTeX)', type: 'Referanser' },
                { label: '.pdf (Artikler)', type: 'Fulltekst' },
                { label: '.docx (Word)', type: 'Manuskript' },
                { label: '.xml / .jats', type: 'Strukturert' },
                { label: '.csv / .json', type: 'Datasett' }
              ].map((fmt) => (
                <span key={fmt.label} className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                  {fmt.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handlePastedSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Artikkel / Dokumenttittel (Valgfritt)
              </label>
              <input
                id="paste-doc-title-input"
                type="text"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                placeholder="f.eks. Telemedicine for Diabetes: Systematic Review and Meta-Analysis"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Format:</span>
              {(['ris', 'bib', 'jats', 'csv', 'text'] as const).map((fmt) => (
                <label key={fmt} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="pasteFormat"
                    value={fmt}
                    checked={pastedFormat === fmt}
                    onChange={() => setPastedFormat(fmt)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="uppercase font-semibold">{fmt}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lim inn råtekst, RIS, BibTeX eller CSV
              </label>
              <textarea
                id="paste-content-textarea"
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={pastedFormat === 'bib' 
                  ? `@article{Smith2024,\n  title={Clinical decision support in healthcare},\n  author={Smith, J. and Johnson, M.},\n  year={2024},\n  journal={BMJ}\n}`
                  : `TY  - JOUR\nTI  - Effectiveness of Telemedicine Interventions\nAU  - Lindqvist, S.\nPY  - 2024\nAB  - We conducted a systematic review registered in PROSPERO...\nER  -`
                }
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Live Identification Badge */}
            {liveCharacteristics && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Identifisert Artikkeltype:</span>
                  </span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded">
                    {liveCharacteristics.studyType}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span>Anbefalt verktøy: <strong>{liveCharacteristics.recommendedFramework}</strong></span>
                  {liveCharacteristics.sampleSize && (
                    <span>Utvalg: <strong>N = {liveCharacteristics.sampleSize}</strong></span>
                  )}
                  {liveCharacteristics.prosperoOrRegistry && (
                    <span>Register: <strong>{liveCharacteristics.prosperoOrRegistry}</strong></span>
                  )}
                  {liveCharacteristics.ktaPhase && (
                    <span className="text-emerald-700 font-semibold">KTA: {liveCharacteristics.ktaPhase.phaseName}</span>
                  )}
                </div>
              </div>
            )}

            <button
              id="submit-pasted-doc-button"
              type="submit"
              disabled={isProcessing || !pastedText.trim()}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyser &amp; Importer Studier</span>
            </button>
          </form>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-xs font-medium">
              Kjører universell parser, PICO-signalminer og SHA-256 forsegling...
            </span>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 text-rose-800 rounded border border-rose-200 flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
