import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  X, 
  FlaskConical, 
  ShieldCheck, 
  Layers, 
  Award, 
  FileText, 
  ExternalLink, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { runFullValidationTestSuite, FullTestSuiteSummary, TestCaseResult } from '../utils/testRunner';

interface ValidationTestRunnerModalProps {
  onClose: () => void;
}

export const ValidationTestRunnerModal: React.FC<ValidationTestRunnerModalProps> = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSummary, setTestSummary] = useState<FullTestSuiteSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'Level 1: Unit Tests' | 'Level 2: Integration Tests' | 'Level 3: Gold Standard Benchmarks'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestIds, setExpandedTestIds] = useState<Set<string>>(new Set());

  // Run tests on mount
  useEffect(() => {
    handleRunTests();
  }, []);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const summary = await runFullValidationTestSuite();
      setTestSummary(summary);
      // Auto-expand all tests by default
      setExpandedTestIds(new Set(summary.testResults.map(t => t.id)));
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTestIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (testSummary) {
      setExpandedTestIds(new Set(testSummary.testResults.map(t => t.id)));
    }
  };

  const collapseAll = () => {
    setExpandedTestIds(new Set());
  };

  const filteredTests = testSummary?.testResults.filter(test => {
    const matchesCategory = selectedCategory === 'ALL' || test.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.instrumentOrDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.assertions.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }) || [];

  const handleExportJson = () => {
    if (!testSummary) return;
    const blob = new Blob([JSON.stringify(testSummary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-test-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Vitenskapelig Testlab & Benchmark Validering
                </h2>
                <span className="bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs px-2 py-0.5 rounded-full font-mono">
                  Level 1–3 Testpyramide
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatisk verifisering av matematiske formler, metodologiske skåringsmotorer og gullstandard-datasett.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="run-all-tests-btn"
              onClick={handleRunTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Kjører tester...' : 'Kjør alle tester'}</span>
            </button>

            <button
              id="export-test-report-btn"
              onClick={handleExportJson}
              disabled={!testSummary}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-300 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              title="Eksporter testrapport som JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eksporter rapport</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {testSummary && (
          <div className="px-6 py-4 bg-slate-800/40 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-xs ${
                testSummary.overallStatus === 'ALL_PASS'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                {testSummary.overallStatus === 'ALL_PASS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {testSummary.overallStatus === 'ALL_PASS' 
                    ? 'Alle tester bestått (100% konformitet)' 
                    : `${testSummary.failedCount} tester feilet`}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                <span>
                  Tester: <strong className="text-white">{testSummary.passedCount}/{testSummary.totalTests}</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span>
                  Asserts: <strong className="text-white">{testSummary.passedAssertions}/{testSummary.totalAssertions}</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {testSummary.durationMs} ms
                </span>
              </div>
            </div>

            {/* Expand / Collapse Controls */}
            <div className="flex items-center gap-2 text-xs">
              <button 
                onClick={expandAll}
                className="text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                Åpne alle
              </button>
              <span className="text-slate-600">•</span>
              <button 
                onClick={collapseAll}
                className="text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                Lukk alle
              </button>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'Level 1: Unit Tests', 'Level 2: Integration Tests', 'Level 3: Gold Standard Benchmarks'] as const).map(cat => {
              const label = cat === 'ALL' ? 'Alle nivåer' : cat.replace(': ', ' — ');
              const count = cat === 'ALL' 
                ? testSummary?.totalTests || 0 
                : testSummary?.testResults.filter(t => t.category === cat).length || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat ? 'bg-blue-700 text-blue-100' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Søk i testnavn & asserts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {filteredTests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FlaskConical className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium">Ingen tester matcher søkekriteriene.</p>
            </div>
          ) : (
            filteredTests.map(test => {
              const isExpanded = expandedTestIds.has(test.id);
              return (
                <div
                  key={test.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    test.passed
                      ? 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
                      : 'bg-rose-950/20 border-rose-800/80'
                  }`}
                >
                  {/* Test Header */}
                  <div
                    onClick={() => toggleExpand(test.id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                        test.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {test.passed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-xs font-semibold text-white truncate">
                            {test.name}
                          </span>
                          <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-mono">
                            {test.instrumentOrDomain}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {test.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {test.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">
                        {test.executionTimeMs} ms
                      </span>
                      <div className="text-slate-400 hover:text-slate-200">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Assertions & Reference Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-700/60 bg-slate-900/40 space-y-3">
                      {/* Reference Citation & DOI */}
                      {test.referenceSource && (
                        <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-300 flex items-start gap-2">
                          <Award className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold text-slate-200">Autoritativ kilde: </span>
                            <span>{test.referenceSource}</span>
                            {test.doi && (
                              <a
                                href={`https://doi.org/${test.doi}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 ml-2 text-blue-400 hover:text-blue-300 underline font-mono text-[11px]"
                              >
                                <span>doi:{test.doi}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Assertion Rows */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                          Testbekreftelser ({test.assertions.filter(a => a.passed).length}/{test.assertions.length} bestått)
                        </div>
                        <div className="bg-slate-950/60 rounded-lg border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
                          {test.assertions.map((assertion, aIdx) => (
                            <div
                              key={aIdx}
                              className="p-2.5 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                {assertion.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <div className="font-medium text-slate-200">
                                    {assertion.name}
                                  </div>
                                  {assertion.details && (
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      {assertion.details}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0 font-mono text-[11px] space-y-0.5">
                                <div className="text-slate-400">
                                  Forventet: <span className="text-slate-300">{String(assertion.expected)}</span>
                                </div>
                                <div className={assertion.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                  Beregnet: <span className="font-bold">{String(assertion.actual)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kvalitetssikret i henhold til WHO & Cochrane Handbook retningslinjer.</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
