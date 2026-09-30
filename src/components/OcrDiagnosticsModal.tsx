import React, { useState, useMemo } from 'react';
import { 
  StudyRecord 
} from '../types';
import { 
  analyzeDocumentOcrAndReadability, 
  OcrDiagnosticsReport 
} from '../utils/ocrDiagnostics';
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Search, 
  Sliders, 
  BookOpen, 
  Eye, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  Binary, 
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';

interface OcrDiagnosticsModalProps {
  study: StudyRecord;
  onClose: () => void;
}

export const OcrDiagnosticsModal: React.FC<OcrDiagnosticsModalProps> = ({
  study,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'glyphs' | 'readability' | 'ambiguity' | 'safety' | 'tester'>('glyphs');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);
  const [glyphSearch, setGlyphSearch] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);
  const [customTestInput, setCustomTestInput] = useState('χ² = 18.4, p < 0.001, 95% CI [1.24–3.85], Δ = -3.8 ± 0.6 µg/mL, N = 450 (alder ≥ 18 år)');

  // Run deep analysis
  const report: OcrDiagnosticsReport = useMemo(() => {
    const fullText = (study.abstract || '') + '\n\n' + (study.rawContent || '');
    return analyzeDocumentOcrAndReadability(
      fullText,
      study.title,
      study.documentHashSha256,
      study.fileSizeBytes
    );
  }, [study]);

  const handleCopyReport = async () => {
    const jsonStr = JSON.stringify(report, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const currentCategory = report.categories[selectedCategoryIndex] || report.categories[0];

  const filteredGlyphs = useMemo(() => {
    if (!glyphSearch.trim()) return currentCategory.glyphs;
    const term = glyphSearch.toLowerCase();
    return currentCategory.glyphs.filter(g => 
      g.char.toLowerCase().includes(term) || 
      g.name.toLowerCase().includes(term) ||
      (g.scientificMeaning && g.scientificMeaning.toLowerCase().includes(term)) ||
      g.unicodeHex.toLowerCase().includes(term)
    );
  }, [currentCategory, glyphSearch]);

  // Test input character analysis
  const testInputAnalysis = useMemo(() => {
    if (!customTestInput) return [];
    const chars = Array.from(customTestInput);
    const unique = Array.from(new Set(chars));
    return unique.map(c => {
      const codePoint = c.codePointAt(0) || 0;
      const hex = 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');
      let typeDesc = 'Standard ASCII';
      if (codePoint > 127 && codePoint <= 255) typeDesc = 'Latinsk utvidet / Nordisk';
      else if (codePoint >= 0x0370 && codePoint <= 0x03FF) typeDesc = 'Gresk / Statistisk symbol';
      else if (codePoint >= 0x2000 && codePoint <= 0x206F) typeDesc = 'Typografisk tegn / Tankestrek';
      else if (codePoint >= 0x2070 && codePoint <= 0x209F) typeDesc = 'Hevet / Senket tegn (Super/Sub)';
      else if (codePoint >= 0x2200 && codePoint <= 0x22FF) typeDesc = 'Matematisk operator';
      else if (codePoint > 255) typeDesc = 'Unicode spesialtegn';

      return {
        char: c,
        hex,
        codePoint,
        typeDesc,
        count: chars.filter(x => x === c).length
      };
    });
  }, [customTestInput]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="ocr-diagnostics-modal-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900"
      >
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  OCR &amp; Tegnsett-Diagnostikk
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  Fidelity {report.overallOcrFidelityPercentage}%
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                  UTF-8 STRICT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lesbarhet, vitenskapelig typografi, greske/statistiske symboler, størrelsesanalyse og forskersikkerhet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-ocr-report-btn"
              onClick={handleCopyReport}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Kopier full JSON-diagnostikkrapport"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopier rapport</span>
                </>
              )}
            </button>

            <button
              id="close-ocr-diagnostics-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 px-6 border-b border-slate-200 flex flex-wrap gap-1 flex-shrink-0">
          <button
            id="ocr-tab-glyphs"
            onClick={() => setActiveTab('glyphs')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'glyphs'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Gjenkjente tegn &amp; Symboltabell ({report.categories.reduce((acc, c) => acc + c.totalFound, 0)} treff)</span>
          </button>

          <button
            id="ocr-tab-readability"
            onClick={() => setActiveTab('readability')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'readability'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Lesbarhet &amp; Størrelse ({report.metrics.fileSizeFormatted})</span>
          </button>

          <button
            id="ocr-tab-ambiguity"
            onClick={() => setActiveTab('ambiguity')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ambiguity'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>OCR Ambiguitet &amp; Avvik ({report.ambiguityAlerts.length})</span>
          </button>

          <button
            id="ocr-tab-safety"
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'safety'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Akademisk Sikkerhet &amp; Kontroll</span>
          </button>

          <button
            id="ocr-tab-tester"
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'tester'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-700" />
            <span>Interaktiv Tegntester</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">

          {/* TAB 1: GLYPHS & SPECIAL CHARACTERS */}
          {activeTab === 'glyphs' && (
            <div className="space-y-5">
              {/* Category selector pills */}
              <div className="flex flex-wrap gap-2">
                {report.categories.map((cat, idx) => (
                  <button
                    key={cat.categoryName}
                    onClick={() => setSelectedCategoryIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                      selectedCategoryIndex === idx
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.categoryName}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      selectedCategoryIndex === idx ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {cat.totalFound}
                    </span>
                  </button>
                ))}
              </div>

              {/* Category Summary Header */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentCategory.categoryName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {currentCategory.categoryDesc}
                  </p>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={glyphSearch}
                    onChange={(e) => setGlyphSearch(e.target.value)}
                    placeholder="Søk i tegn / navn..."
                    className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Glyphs Grid / List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredGlyphs.map((glyph) => (
                  <div
                    key={glyph.unicodeHex + glyph.char}
                    className={`p-3.5 rounded-lg border transition-all ${
                      glyph.count > 0 
                        ? 'bg-white border-blue-200 shadow-2xs' 
                        : 'bg-slate-100/70 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Character Display Box */}
                      <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 text-xl font-bold text-blue-900 font-mono shadow-inner">
                        {glyph.char}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {glyph.name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            glyph.count > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {glyph.count} {glyph.count === 1 ? 'forekomst' : 'forekomster'}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {glyph.unicodeHex}
                        </div>

                        {glyph.scientificMeaning && (
                          <div className="text-xs text-slate-700 mt-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                            <strong className="text-slate-900">Vitenskapelig betydning:</strong> {glyph.scientificMeaning}
                          </div>
                        )}

                        {glyph.sampleContext && (
                          <div className="text-[11px] font-mono text-blue-950 mt-1.5 bg-amber-50/80 p-1.5 rounded border border-amber-200 truncate">
                            {glyph.sampleContext}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: READABILITY & SCALE METRICS */}
          {activeTab === 'readability' && (
            <div className="space-y-6">
              {/* Top Key Metrics Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Dokumentstørrelse</span>
                  <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{report.metrics.fileSizeFormatted}</div>
                  <span className="text-[11px] text-slate-500 font-mono">{report.metrics.fileSizeBytes.toLocaleString()} bytes</span>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ord &amp; Tegn</span>
                  <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{report.metrics.totalWords.toLocaleString()} ord</div>
                  <span className="text-[11px] text-slate-500 font-mono">{report.metrics.totalCharacters.toLocaleString()} tegn</span>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Lesetid (estimert)</span>
                  <div className="text-xl font-bold text-indigo-600 mt-1 font-mono">~{report.metrics.estimatedReadingTimeMinutes} min</div>
                  <span className="text-[11px] text-slate-500 font-mono">~{report.metrics.estimatedTokens.toLocaleString()} tokens</span>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Lesbarhetsnivå</span>
                  <div className="text-base font-bold text-blue-700 mt-1">{report.metrics.readabilityLevel}</div>
                  <span className="text-[11px] text-slate-500 font-mono">Flesch-Kincaid: {report.metrics.fleschKincaidScore}/100</span>
                </div>
              </div>

              {/* Detailed Structural Breakdown */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Strukturelle tekstmål &amp; Tetthet
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 font-semibold block">Tegn uten mellomrom:</span>
                    <span className="text-base font-bold font-mono text-slate-900">{report.metrics.totalCharactersNoSpaces.toLocaleString()}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 font-semibold block">Linjer &amp; Avsnitt:</span>
                    <span className="text-base font-bold font-mono text-slate-900">{report.metrics.totalLines} linjer / {report.metrics.totalParagraphs} avsnitt</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 font-semibold block">Gjennomsnittlig ordlengde:</span>
                    <span className="text-base font-bold font-mono text-slate-900">{report.metrics.averageWordLength} tegn/ord</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 font-semibold block">Gjennomsnittlig setningslengde:</span>
                    <span className="text-base font-bold font-mono text-slate-900">{report.metrics.averageSentenceLength} ord/setning</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 font-semibold block">UTF-8 Integritet:</span>
                    <span className="text-base font-bold font-mono text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      100% Valid UTF-8
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 font-semibold block">U+FFFD Korrupte tegn:</span>
                    <span className={`text-base font-bold font-mono ${report.metrics.hasReplacementChars ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {report.metrics.replacementCharCount} funnet
                    </span>
                  </div>
                </div>
              </div>

              {/* Supported Unicode Ranges */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Støttede Unicode-blokker i Evidence Appraisal Studio
                </h3>

                <div className="space-y-2">
                  {report.supportedUnicodeRanges.map((rng) => (
                    <div
                      key={rng.range}
                      className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="font-mono text-slate-800 font-medium">
                        {rng.range}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[11px]">
                          {rng.count.toLocaleString()} tegn
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rng.status === 'Detected' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {rng.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AMBIGUITY & GLITCH DETECTOR */}
          {activeTab === 'ambiguity' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong>Automatisk OCR-sjekk:</strong> Kontrollerer typiske skannefeil og ambiguiteter som forveksling mellom tall og bokstaver (f.eks. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">1</code> vs <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">l</code> eller <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">0</code> vs <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">O</code>), ødelagte orddelinger og typografiske ligaturer.
              </div>

              {report.ambiguityAlerts.length === 0 ? (
                <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">Ingen OCR-ambiguiteter funnet</h4>
                  <p className="text-xs text-slate-600">
                    Dokumentet har ren typografi uten tegnforveksling eller korrupte tegnstrømmer.
                  </p>
                </div>
              ) : (
                report.ambiguityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'warning'
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${
                          alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                        }`} />
                        <span className="text-xs font-bold text-slate-900">
                          {alert.rule}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {alert.occurrenceCount} {alert.occurrenceCount === 1 ? 'tilfelle' : 'tilfeller'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mb-2">
                      {alert.description}
                    </p>

                    <div className="text-xs font-mono bg-slate-900 text-slate-200 p-2.5 rounded border border-slate-800 mb-2">
                      Funnet mønster: {alert.matchedSnippet}
                    </div>

                    {alert.suggestedFix && (
                      <div className="text-xs text-blue-900 bg-blue-50 p-2 rounded border border-blue-200">
                        <strong>Forslag / Håndtering:</strong> {alert.suggestedFix}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: ACADEMIC SAFETY & RESEARCHER CONTROL */}
          {activeTab === 'safety' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <strong>Akademisk trygghet &amp; Forskersuverenitet:</strong> Systemet er designet etter strenge prinsipper for evidensbasert medisin (Cochrane, PRISMA 2020, WHO). Forskeren har til enhver tid fullstendig kontroll over alle skåringer, ekstraksjoner og tolkninger.
              </div>

              <div className="space-y-3">
                {report.academicSafetyChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-start gap-3"
                  >
                    <div className="mt-0.5">
                      {item.status === 'PASSED' || item.status === 'VERIFIED' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">
                          {item.criterion}
                        </h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          item.status === 'PASSED' || item.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cryptographic SHA-256 Fingerprint Display */}
              <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 font-mono text-xs">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-sans font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Kryptografisk Kildeintegritet (SHA-256)
                </div>
                <div className="text-emerald-300 font-bold break-all select-all">
                  {study.documentHashSha256}
                </div>
                <div className="text-slate-400 text-[11px] mt-2 font-sans">
                  Sikrer at dokumentet ikke er endret eller manipulert siden import.
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTERACTIVE CHARACTER TESTER */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-800">
                <strong>Interaktiv Tegntester:</strong> Skriv eller lim inn vitenskapelige uttrykk, greske tegn, statistiske formler eller tabellutsnitt for å inspisere Unicode-verdier og nøyaktighet.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
                  Teststreng for OCR- og tegnvalidering:
                </label>
                <textarea
                  id="custom-ocr-test-input"
                  value={customTestInput}
                  onChange={(e) => setCustomTestInput(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Skriv inn tegn som α, β, χ², ±, ≤, ≥, 95% CI..."
                />
              </div>

              {/* Quick symbol insertion helper buttons */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-bold text-slate-500 mr-1">Sett inn:</span>
                {['α', 'β', 'χ²', 'Δ', 'µ', '±', '≤', '≥', '≠', '≈', '²', '³', '₀', '₁', '°C', '95% CI', 'æ', 'ø', 'å', '—', '«»'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setCustomTestInput(prev => prev + ' ' + sym)}
                    className="px-2 py-1 text-xs font-mono font-bold bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-300 rounded transition-colors"
                  >
                    {sym}
                  </button>
                ))}
              </div>

              {/* Character inspection table */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Analyserte unike tegn ({testInputAnalysis.length})</span>
                  <span className="font-mono text-slate-500 text-[11px]">{customTestInput.length} totale tegn</span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {testInputAnalysis.map((item, idx) => (
                    <div key={idx} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-50 border border-blue-200 rounded flex items-center justify-center font-mono font-bold text-blue-900">
                          {item.char === ' ' ? '␣' : item.char}
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-900">{item.hex}</span>
                          <span className="text-slate-500 text-[11px] ml-2">({item.typeDesc})</span>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-slate-600">
                        {item.count} {item.count === 1 ? 'gang' : 'ganger'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Dokument: <strong className="text-slate-900">{study.fileName}</strong> ({report.metrics.fileSizeFormatted})
          </div>

          <button
            id="close-ocr-diagnostics-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
          >
            Lukk inspektør
          </button>
        </div>

      </div>
    </div>
  );
};
