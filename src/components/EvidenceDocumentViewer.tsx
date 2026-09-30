import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Search, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink, 
  Highlighter, 
  BookOpen, 
  ZoomIn, 
  ZoomOut, 
  Sliders, 
  Binary, 
  Maximize2, 
  Type, 
  Eye, 
  Layers,
  Palette,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  Sparkle,
  LayoutTemplate,
  AlertTriangle,
  Info,
  HelpCircle
} from 'lucide-react';
import { AppraisalInstrument, DocumentAnalysisFinding, IMRaDAnalysisResult, StudyRecord } from '../types';
import { OcrDiagnosticsModal } from './OcrDiagnosticsModal';
import { DOMAIN_COLOR_PALETTES, getDomainColorByDomainId, getDomainColorPalette } from '../utils/domainColors';
import { parseDocumentPages, scanDocumentForFramework } from '../utils/evidenceScanner';
import { analyzeIMRaDStructure } from '../services/imradAnalysisService';

interface EvidenceDocumentViewerProps {
  study: StudyRecord;
  selectedFinding?: DocumentAnalysisFinding | null;
  activeInstrument?: AppraisalInstrument;
  onSelectFinding?: (finding: DocumentAnalysisFinding) => void;
  onConfirmFinding?: (findingId: string) => void;
  onRunAutoScan?: () => void;
  onOpenDoiVerifier?: () => void;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const EvidenceDocumentViewer: React.FC<EvidenceDocumentViewerProps> = ({
  study,
  selectedFinding,
  activeInstrument = 'AMSTAR2',
  onSelectFinding,
  onConfirmFinding,
  onRunAutoScan,
  onOpenDoiVerifier
}) => {
  const [activeView, setActiveView] = useState<'reader' | 'findings' | 'pages' | 'imrad' | 'raw'>('reader');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showColorLegend, setShowColorLegend] = useState(true);
  const [filterDomainId, setFilterDomainId] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);

  // Compute or obtain IMRaD Structural Reporting Analysis
  const imradAnalysis: IMRaDAnalysisResult = study.imradAnalysis || analyzeIMRaDStructure(
    study.rawContent || study.abstract || '',
    study.fileName,
    study.documentType
  );
  
  // Readability & Usability States
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [lineSpacing, setLineSpacing] = useState<'compact' | 'normal' | 'generous'>('normal');
  const [colorTheme, setColorTheme] = useState<'white' | 'sepia' | 'dark'>('white');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [showReadabilityDrawer, setShowReadabilityDrawer] = useState<boolean>(false);

  const textContainerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(study.documentHashSha256);
      if (isMounted.current) {
        setCopiedHash(true);
        setTimeout(() => {
          if (isMounted.current) setCopiedHash(false);
        }, 2000);
      }
    } catch {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleTriggerAutoScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      if (onRunAutoScan) {
        onRunAutoScan();
      }
      setIsScanning(false);
    }, 400);
  };

  const findingsList = study.findings || [];
  const activeFindings = filterDomainId === 'all' 
    ? findingsList 
    : findingsList.filter(f => f.domainId === filterDomainId);

  // Calculate search matches count
  const fullText = (study.abstract || '') + ' ' + (study.rawContent || '');
  const searchMatchesCount = searchTerm.trim().length > 1
    ? (fullText.match(new RegExp(escapeRegExp(searchTerm.trim()), 'gi')) || []).length
    : 0;

  // Segment study into academic manuscript pages
  const parsedPages = parseDocumentPages(study);

  // Multi-color highlight renderer for paragraph text
  const renderHighlightedContent = (text: string, pageNum: number) => {
    if (!text) return null;

    if (searchTerm.trim().length > 1) {
      const parts = text.split(new RegExp(`(${escapeRegExp(searchTerm.trim())})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) => 
            part.toLowerCase() === searchTerm.trim().toLowerCase() ? (
              <mark key={i} className="bg-amber-300 text-amber-950 px-1 py-0.5 rounded font-bold shadow-2xs">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    }

    // Check which findings match this text or page
    const pageFindings = findingsList.filter(f => {
      if (f.matchedTerm && text.toLowerCase().includes(f.matchedTerm.toLowerCase())) return true;
      if (f.sectionOrPage.includes(`Side ${pageNum}`)) return true;
      return false;
    });

    if (pageFindings.length === 0) {
      return <span>{text}</span>;
    }

    // Multi-term replacement
    let renderedElements: React.ReactNode[] = [text];

    pageFindings.forEach((finding, idx) => {
      const palette = getDomainColorByDomainId(finding.domainId);
      const isSelected = selectedFinding?.id === finding.id;
      const term = finding.matchedTerm;

      if (!term || term.length < 3) return;

      const nextElements: React.ReactNode[] = [];
      renderedElements.forEach((el, elIdx) => {
        if (typeof el !== 'string') {
          nextElements.push(el);
          return;
        }

        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        const chunks = el.split(regex);

        chunks.forEach((chunk, cIdx) => {
          if (chunk.toLowerCase() === term.toLowerCase()) {
            nextElements.push(
              <span
                key={`hl-${finding.id}-${elIdx}-${cIdx}`}
                id={`highlight-mark-${finding.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFinding && onSelectFinding(finding);
                }}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded cursor-pointer transition-all border ${
                  palette.markerClass
                } ${
                  isSelected 
                    ? 'ring-2 ring-blue-600 scale-105 font-bold shadow-sm' 
                    : 'hover:opacity-90'
                }`}
                title={`[${finding.instrument}: ${finding.topic}] Klikk for å inspisere funn`}
              >
                <span className="text-[10px] font-mono font-bold uppercase opacity-80 select-none">
                  [{finding.topic.substring(0, 10)}]
                </span>
                <span>{chunk}</span>
              </span>
            );
          } else if (chunk.length > 0) {
            nextElements.push(chunk);
          }
        });
      });

      renderedElements = nextElements;
    });

    return <span>{renderedElements}</span>;
  };

  // Font size classes
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-xs sm:text-xs leading-relaxed';
      case 'base': return 'text-xs sm:text-sm leading-relaxed';
      case 'lg': return 'text-sm sm:text-base leading-relaxed';
      case 'xl': return 'text-base sm:text-lg leading-loose';
    }
  };

  // Font family classes
  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'serif': return 'font-serif';
      case 'sans': return 'font-sans';
      case 'mono': return 'font-mono';
    }
  };

  // Theme styling for the manuscript container
  const getThemeClass = () => {
    switch (colorTheme) {
      case 'sepia':
        return 'bg-[#fbf7ee] text-[#3d3226] border-[#e7dec7] shadow-xl';
      case 'dark':
        return 'bg-slate-900 text-slate-100 border-slate-700 shadow-2xl';
      case 'white':
      default:
        return 'bg-white text-slate-800 border-slate-300 shadow-xl';
    }
  };

  const formattedFileSize = study.fileSizeBytes > 1024 * 1024 
    ? `${(study.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.round(study.fileSizeBytes / 1024 || 1)} KB`;

  const wordCount = ((study.rawContent || '').match(/[\p{L}\p{N}_\-]+/gu) || []).length;

  return (
    <div className="bg-slate-200/90 flex flex-col h-full overflow-hidden">
      
      {/* Top Document Header & Action Toolbar */}
      <div className="bg-white px-4 py-2.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2 flex-shrink-0 shadow-2xs">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-tight flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Fulltekst &amp; Evidensviewer
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-blue-50 text-blue-900 border border-blue-200 rounded">
            {study.documentType.toUpperCase()}
          </span>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            ({formattedFileSize} • ~{wordCount} ord • {parsedPages.length} sider)
          </span>
        </div>

        {/* Action Controls: Auto-Scan, Color Legend Toggle & Search */}
        <div className="flex items-center flex-wrap gap-1.5">
          
          {/* Run Full Scan Button */}
          <button
            id="run-fulltext-evidence-scan-btn"
            onClick={handleTriggerAutoScan}
            disabled={isScanning}
            className="px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1.5 shadow-xs transition-colors"
            title="Skann hele artikkelen og finn svar på alle spørsmål i det aktive skjemaet"
          >
            {isScanning ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{isScanning ? 'Skanner...' : 'Finn svartekster'}</span>
          </button>

          {/* Color Legend Toggle */}
          <button
            id="toggle-color-legend-btn"
            onClick={() => setShowColorLegend(!showColorLegend)}
            className={`px-2.5 py-1 text-xs font-bold border rounded flex items-center gap-1.5 transition-colors shadow-2xs ${
              showColorLegend 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Vis eller skjul fargekodeliste for spørsmål"
          >
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            <span>Fargekoder ({findingsList.length})</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <button
              id="view-tab-reader"
              onClick={() => setActiveView('reader')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                activeView === 'reader'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Artikkel
            </button>
            <button
              id="view-tab-pages"
              onClick={() => setActiveView('pages')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                activeView === 'pages'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sideoversikt
            </button>
            <button
              id="view-tab-findings"
              onClick={() => setActiveView('findings')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                activeView === 'findings'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Funnliste
            </button>
            <button
              id="view-tab-imrad"
              onClick={() => setActiveView('imrad')}
              className={`px-2.5 py-1 font-medium rounded transition-colors flex items-center gap-1 ${
                activeView === 'imrad'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="IMRaD Rapporteringsstruktur (Introduction, Methods, Results, Discussion)"
            >
              <LayoutTemplate className="w-3 h-3" />
              <span>IMRaD-struktur</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                activeView === 'imrad' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {imradAnalysis.detectedSectionCount}/4
              </span>
            </button>
          </div>

          {/* Readability Drawer button */}
          <button
            id="toggle-readability-drawer-btn"
            onClick={() => setShowReadabilityDrawer(!showReadabilityDrawer)}
            className={`p-1.5 text-xs font-bold border rounded transition-colors ${
              showReadabilityDrawer ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
            title="Typografi og kontrast"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Search Field */}
          <div className="relative w-32 sm:w-40">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="document-text-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søk i tekst..."
              className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Persistent Interactive Color Legend Bar */}
      {showColorLegend && findingsList.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Fargekodede spørsmål i artikkel:
            </span>
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                onClick={() => setFilterDomainId('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  filterDomainId === 'all' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Vis alle ({findingsList.length})
              </button>
              {findingsList.map((f, idx) => {
                const palette = getDomainColorByDomainId(f.domainId);
                const isSelected = selectedFinding?.id === f.id || filterDomainId === f.domainId;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFinding && onSelectFinding(f);
                      setFilterDomainId(f.domainId);
                    }}
                    style={{ borderColor: palette.hex }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                      isSelected 
                        ? 'bg-white text-slate-950 font-black shadow-sm ring-1 ring-white' 
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: palette.hex }} />
                    <span>{f.topic.length > 18 ? f.topic.substring(0, 18) + '...' : f.topic}</span>
                    <span className="opacity-75 font-mono text-[9px] font-normal">({f.sectionOrPage.split(' ')[1] || 'S.1'})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Readability drawer */}
      {showReadabilityDrawer && (
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-600">Tekst:</span>
            <div className="flex bg-white rounded border border-slate-300 p-0.5">
              {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    fontSize === sz ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sz === 'sm' ? '12' : sz === 'base' ? '14' : sz === 'lg' ? '16' : '18'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-600">Font:</span>
            <div className="flex bg-white rounded border border-slate-300 p-0.5">
              <button
                onClick={() => setFontFamily('serif')}
                className={`px-2 py-0.5 text-xs font-serif font-bold rounded ${fontFamily === 'serif' ? 'bg-blue-600 text-white' : 'text-slate-700'}`}
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily('sans')}
                className={`px-2 py-0.5 text-xs font-sans font-bold rounded ${fontFamily === 'sans' ? 'bg-blue-600 text-white' : 'text-slate-700'}`}
              >
                Sans
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-600">Zoom:</span>
            <button onClick={() => setZoomScale(Math.max(75, zoomScale - 15))} className="p-1 rounded bg-white border border-slate-300"><ZoomOut className="w-3 h-3" /></button>
            <span className="font-mono text-xs px-1 font-bold">{zoomScale}%</span>
            <button onClick={() => setZoomScale(Math.min(150, zoomScale + 15))} className="p-1 rounded bg-white border border-slate-300"><ZoomIn className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* Sub-bar: DOI verification & SHA-256 hash seal */}
      <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-300 text-xs flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-mono text-[11px] text-slate-700 truncate select-all">
            SHA-256: {study.documentHashSha256}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {study.doi && (
            <button
              onClick={onOpenDoiVerifier}
              className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded font-medium flex items-center gap-1 transition-colors"
            >
              <span>Verifiser DOI</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={handleCopyHash}
            className="text-[11px] text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1"
          >
            {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedHash ? 'Kopiert' : 'Kopier Hash'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={textContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div style={{ zoom: `${zoomScale}%` }}>
          
          {/* Manuscript Continuous Reader View */}
          {activeView === 'reader' && (
            <div className={`max-w-3xl mx-auto space-y-6 transition-colors`}>
              
              {/* Paper Header / Title Page */}
              <div className={`p-6 sm:p-8 border rounded-xl ${getThemeClass()} ${getFontFamilyClass()} ${getFontSizeClass()}`}>
                <div className="border-b border-slate-200 pb-4 mb-5 font-sans">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {study.journal || study.fileName} {study.year ? `• ${study.year}` : ''}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Dokument-ID: {study.id}
                    </span>
                  </div>
                  <h1 className="text-base sm:text-xl font-bold leading-snug mb-2 text-slate-950">
                    {study.title}
                  </h1>
                  <div className="text-xs text-slate-600 font-medium">
                    {study.authors}
                  </div>
                </div>

                {/* Abstract */}
                {study.abstract && (
                  <div className="mb-6 font-sans">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Strukturert Sammendrag (Side 1)
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs whitespace-pre-line leading-relaxed text-slate-800">
                      {renderHighlightedContent(study.abstract, 1)}
                    </div>
                  </div>
                )}

                {/* Selected Finding Active Excerpt Banner */}
                {selectedFinding && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 text-xs font-sans rounded-r-lg shadow-xs animate-fade-in">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Sparkle className="w-3.5 h-3.5 text-amber-600" />
                        Valgt evidenssted: {selectedFinding.topic}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                        {selectedFinding.sectionOrPage}
                      </span>
                    </div>
                    <p className="italic text-slate-800 font-serif text-sm">
                      "{selectedFinding.excerpt}"
                    </p>
                    {onConfirmFinding && (
                      <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between">
                        <span className="text-[11px] text-amber-900 font-medium">
                          Konfidens: <strong>{selectedFinding.confidence}</strong> • Foreslått vurdering: <strong className="font-mono">{selectedFinding.suggestedAnswer || 'Ja'}</strong>
                        </span>
                        <button
                          onClick={() => onConfirmFinding(selectedFinding.id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>Sett inn i vurderingsskjema</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Full Article Text Broken Across Page Sections */}
                <div className="space-y-6 font-sans">
                  {parsedPages.map((page) => (
                    <div key={page.pageNumber} className="space-y-3 pt-4 border-t border-slate-200/80 first:border-0 first:pt-0">
                      
                      {/* Page Boundary Header Badge */}
                      <div className="flex items-center justify-between py-1 px-2.5 bg-slate-100 text-slate-700 rounded border border-slate-200 text-xs font-bold">
                        <span className="flex items-center gap-2">
                          <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-mono">
                            SIDE {page.pageNumber}
                          </span>
                          <span>{page.sectionTitle}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          Kilde: {study.fileName}
                        </span>
                      </div>

                      {/* Paragraph Content with Highlights */}
                      <div className="whitespace-pre-wrap leading-relaxed text-slate-800 text-xs sm:text-sm font-serif">
                        {renderHighlightedContent(page.content, page.pageNumber)}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* Page-by-Page Cards View */}
          {activeView === 'pages' && (
            <div className="max-w-3xl mx-auto space-y-4 font-sans">
              {parsedPages.map((page) => (
                <div key={page.pageNumber} className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-mono">
                        Side {page.pageNumber}
                      </span>
                      {page.sectionTitle}
                    </span>
                    <span className="text-xs text-slate-500">
                      ~{page.content.split(' ').length} ord
                    </span>
                  </div>
                  <div className="text-xs font-serif leading-relaxed text-slate-700">
                    {renderHighlightedContent(page.content, page.pageNumber)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Findings List View */}
          {activeView === 'findings' && (
            <div className="max-w-3xl mx-auto space-y-3 font-sans">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-950 font-medium flex items-center justify-between">
                <span>Identifiserte evidenssteder og svartekster for <strong>{activeInstrument}</strong>:</span>
                <span className="font-bold font-mono">{activeFindings.length} funn</span>
              </div>

              {activeFindings.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">
                    Ingen evidensfunn generert for {activeInstrument} ennå.
                  </p>
                  <button
                    onClick={handleTriggerAutoScan}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    Kjør fulltekst evidens-skanning
                  </button>
                </div>
              ) : (
                activeFindings.map((finding) => {
                  const palette = getDomainColorByDomainId(finding.domainId);
                  const isSelected = selectedFinding?.id === finding.id;
                  return (
                    <div
                      key={finding.id}
                      onClick={() => onSelectFinding && onSelectFinding(finding)}
                      style={{ borderLeftColor: palette.hex, borderLeftWidth: '4px' }}
                      className={`p-4 rounded-lg border transition-all cursor-pointer bg-white shadow-2xs ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span 
                            style={{ backgroundColor: palette.hex }}
                            className="px-2 py-0.5 text-[10px] font-bold text-white rounded uppercase"
                          >
                            {finding.instrument}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {finding.topic}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                          {finding.sectionOrPage}
                        </span>
                      </div>

                      <p className="text-xs font-serif text-slate-800 bg-slate-50 p-2.5 rounded my-2 border border-slate-200">
                        "{finding.excerpt}"
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Highlighter className="w-3.5 h-3.5 text-blue-600" />
                          Term: <strong className="text-slate-900">{finding.matchedTerm}</strong>
                        </span>
                        {onConfirmFinding && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onConfirmFinding(finding.id);
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Sett inn som begrunnelse</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* IMRaD Structural Reporting Analysis View */}
          {activeView === 'imrad' && (
            <div className="max-w-4xl mx-auto space-y-4 font-sans pb-8">
              
              {/* Top Banner: Methodology Notice & Separation of Reporting vs Appraisal */}
              <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-700 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center">
                      <LayoutTemplate className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>IMRaD Rapporteringsstrukturanalyse</span>
                        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                          imradAnalysis.explicitComplete 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : imradAnalysis.complete
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {imradAnalysis.explicitComplete ? 'Fullstendig (Eksplisitte overskrifter)' : imradAnalysis.complete ? 'Komplett (Inkludert inferens)' : 'Avvikende / Ufullstendig'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        {imradAnalysis.standardDescription}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-400 block">Identifisert</span>
                    <span className="text-base font-mono font-bold text-blue-400">
                      {imradAnalysis.detectedSectionCount}/4 ledd
                    </span>
                  </div>
                </div>

                {/* Crucial Methodological Principle Notice */}
                <div className="mt-2 p-2.5 bg-blue-950/70 border border-blue-800/80 rounded-lg text-xs text-blue-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-blue-100">
                      Viktig metodisk skille: Rapportering ≠ Kritiske kvalitetsvurderinger (Critical Appraisal)
                    </p>
                    <p className="text-[11px] text-blue-200/90 leading-relaxed">
                      {imradAnalysis.methodologicalNotice}
                    </p>
                  </div>
                </div>

                {/* Reporting standard mapping link */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-400">Studiens form:</span>
                    <strong className="text-white">{study.documentType}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-400">Anbefalt rapporteringsstandard:</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                      {imradAnalysis.recommendedReportingStandard || 'General'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Limitations alerts if any */}
              {imradAnalysis.limitations.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Metodiske begrensninger i tekstgrunnlaget:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900 pl-1">
                    {imradAnalysis.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Table / Matrix of IMRaD Sections */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-tight">
                    IMRaD Seksjonsmatrise &amp; Evidensbevis
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    Gjennomsnittlig konfidens: {Math.round(imradAnalysis.confidence * 100)}%
                  </span>
                </div>

                <div className="divide-y divide-slate-200">
                  {imradAnalysis.sections.map((sec) => {
                    const isDetected = sec.status === 'DETECTED';
                    const isInferred = sec.status === 'INFERRED';
                    const isMissing = sec.status === 'MISSING';

                    return (
                      <div key={sec.key} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              isDetected ? 'bg-emerald-500 ring-4 ring-emerald-100' : isInferred ? 'bg-amber-500 ring-4 ring-amber-100' : 'bg-red-500 ring-4 ring-red-100'
                            }`} />
                            <span className="font-bold text-xs text-slate-900 uppercase">
                              {sec.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status badge */}
                            <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded uppercase border ${
                              isDetected 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isInferred
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                              {sec.status}
                            </span>

                            {/* Heading badge */}
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                              sec.explicitHeading 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {sec.explicitHeading ? `Heading: "${sec.detectedHeading}"` : 'Ingen eksplisitt heading'}
                            </span>

                            {/* Confidence rating */}
                            <span className="text-[11px] font-mono text-slate-500">
                              Konfidens: <strong>{Math.round(sec.confidence * 100)}%</strong>
                            </span>
                          </div>
                        </div>

                        {/* Evidence preview box */}
                        {sec.evidencePreview ? (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>Tekstutdrag / evidensgrunnlag ({sec.wordCount} ord):</span>
                              <span>{sec.characterCount} tegn</span>
                            </div>
                            <p className="font-serif italic leading-relaxed text-slate-700">
                              "{sec.evidencePreview}"
                            </p>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded border border-dashed border-slate-200 text-xs text-slate-500 italic">
                            Ingen eksplisitte eller semantiske signaler funnet for denne seksjonen i dokumentet.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanatory footer */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Hvordan tolke IMRaD i evidensvurderingen?</span>
                </h5>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  IMRaD er rapporteringsformatets struktur. Artikkelens metodiske kvalitet og troverdighet (Risk of Bias / CASP / JBI / AMSTAR 2) avhenger av designets stringens, transparens, refleksivitet og analysemetoder. En kvalitativ studie med underkapitler som "Bakgrunn, Metode, Funn og Drøfting" er strukturelt komplett selv om den ikke benytter begrepet "Results".
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* OCR Diagnostics & Character Set Modal */}
      {showOcrModal && (
        <OcrDiagnosticsModal
          study={study}
          onClose={() => setShowOcrModal(false)}
        />
      )}

    </div>
  );
};
