import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Layers, 
  Check, 
  Download, 
  ShieldCheck, 
  GitMerge, 
  FileText, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { StudyRecord } from '../types';
import { 
  DuplicateCandidatePair, 
  findDuplicateCandidates 
} from '../utils/duplicateDetection';
import { triggerFileDownload } from '../utils/exporters';

interface DuplicateDetectorModalProps {
  studies: StudyRecord[];
  onMergeStudies?: (primaryId: string, duplicateId: string, reason: string) => void;
  onConfirmDistinct?: (studyAId: string, studyBId: string) => void;
  onClose: () => void;
}

export const DuplicateDetectorModal: React.FC<DuplicateDetectorModalProps> = ({
  studies,
  onMergeStudies,
  onConfirmDistinct,
  onClose
}) => {
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.75);
  const [resolvedPairs, setResolvedPairs] = useState<Record<string, {
    action: 'merged' | 'confirmed_distinct' | 'dismissed';
    note: string;
    timestamp: string;
  }>>({});
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);

  // Compute candidates without automatic deletion
  const candidates = useMemo(() => {
    return findDuplicateCandidates(studies, similarityThreshold);
  }, [studies, similarityThreshold]);

  const activePair = candidates.find(c => c.id === selectedPairId) || candidates[0];

  const handleMerge = (pair: DuplicateCandidatePair) => {
    const reason = pair.matchReasons.join('; ');
    setResolvedPairs(prev => ({
      ...prev,
      [pair.id]: {
        action: 'merged',
        note: `Slått sammen av forsker: ${reason}`,
        timestamp: new Date().toISOString()
      }
    }));

    if (onMergeStudies) {
      onMergeStudies(pair.studyA.id, pair.studyB.id, reason);
    }
  };

  const handleDistinct = (pair: DuplicateCandidatePair) => {
    setResolvedPairs(prev => ({
      ...prev,
      [pair.id]: {
        action: 'confirmed_distinct',
        note: 'Verifisert som to separate, distinkte publikasjoner.',
        timestamp: new Date().toISOString()
      }
    }));

    if (onConfirmDistinct) {
      onConfirmDistinct(pair.studyA.id, pair.studyB.id);
    }
  };

  const handleDismiss = (pairId: string) => {
    setResolvedPairs(prev => ({
      ...prev,
      [pairId]: {
        action: 'dismissed',
        note: 'Varsel avvist av forsker.',
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleBatchMergeExact = () => {
    const exactPairs = candidates.filter(c => 
      (c.isExactDoiMatch || c.isExactTitleMatch) && !resolvedPairs[c.id]
    );

    exactPairs.forEach(p => handleMerge(p));
  };

  const handleExportDuplicateReport = () => {
    let md = '# Duplikatkandidat- og Skjermingsrapport (PRISMA 2020)\n';
    md += `*Generert: ${new Date().toLocaleDateString('no-NO')}*\n\n`;
    md += `Totalt antall studier undersøkt: ${studies.length}\n`;
    md += `Totalt antall potensielle duplikatkandidater funnet: ${candidates.length}\n\n`;
    md += '| Kandidatpar | Likhetsgrad | Match-kriterier | Status / Tiltak |\n';
    md += '| :--- | :--- | :--- | :--- |\n';

    candidates.forEach((c, idx) => {
      const res = resolvedPairs[c.id];
      const statusText = res 
        ? (res.action === 'merged' ? '✅ Slått sammen (PRISMA duplikat)' : res.action === 'confirmed_distinct' ? '🛡️ Distinkte studier' : 'Ignorert')
        : '⏳ Venter på manuell vurdering';

      md += `| Par #${idx + 1}: ${c.studyA.title.substring(0, 30)}... / ${c.studyB.title.substring(0, 30)}... | ${c.similarityScore}% | ${c.matchReasons.join(', ')} | ${statusText} |\n`;
    });

    triggerFileDownload(md, 'PRISMA-Duplikat-Skjermingsrapport.md', 'text/markdown;charset=utf-8');
  };

  const pendingCount = candidates.filter(c => !resolvedPairs[c.id]).length;
  const mergedCount = Object.values(resolvedPairs).filter(r => r.action === 'merged').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Duplikatdeteksjon &amp; Skjerming</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ingen automatisk sletting
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Identifiserer potensielle duplikater ved DOI, tittel- og forfatterlikhet for manuell forskervurdering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDuplicateReport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksporter Rapport</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors ml-2"
              title="Lukk modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats & Filter Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 font-medium text-slate-700">
            <span>Totalt undersøkt: <strong>{studies.length}</strong> studier</span>
            <span className="text-amber-700">Kandidater: <strong>{candidates.length}</strong> par</span>
            <span className="text-emerald-700">Slått sammen: <strong>{mergedCount}</strong></span>
            <span className="text-blue-700">Ubehandlede: <strong>{pendingCount}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-slate-600 font-medium flex items-center gap-1.5">
              <span>Likhetsgrense:</span>
              <select
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800"
              >
                <option value={0.95}>Streng (95%+ likhet eller identisk DOI)</option>
                <option value={0.78}>Standard (78%+ tekstlikhet)</option>
                <option value={0.65}>Sensitiv (65%+ tekstlikhet / forfattermatch)</option>
              </select>
            </label>

            {candidates.some(c => (c.isExactDoiMatch || c.isExactTitleMatch) && !resolvedPairs[c.id]) && (
              <button
                onClick={handleBatchMergeExact}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded shadow-xs text-xs flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Slå sammen 100% matcher ({candidates.filter(c => (c.isExactDoiMatch || c.isExactTitleMatch) && !resolvedPairs[c.id]).length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {candidates.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <h4 className="text-base font-bold text-slate-800 mb-1">
                Ingen duplikatkandidater identifisert
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Alle {studies.length} studier i prosjektet har unike DOI-er, distinkte forfattersett og unike titler i henhold til gjeldende terskel ({Math.round(similarityThreshold * 100)}%).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((pair, index) => {
                const resolution = resolvedPairs[pair.id];
                const isSelected = (activePair && activePair.id === pair.id);

                return (
                  <div
                    key={pair.id}
                    className={`border rounded-xl p-5 transition-all ${
                      resolution?.action === 'merged'
                        ? 'bg-slate-50 border-slate-300 opacity-75'
                        : resolution?.action === 'confirmed_distinct'
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-white border-amber-200 shadow-sm hover:border-amber-400'
                    }`}
                  >
                    {/* Header info for candidate pair */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-300">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            pair.similarityScore >= 95 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {pair.similarityScore}% Likhetsgrad
                          </span>
                          {pair.isExactDoiMatch && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              Identisk DOI
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status / Actions */}
                      <div>
                        {resolution ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 ${
                            resolution.action === 'merged' 
                              ? 'bg-slate-200 text-slate-800' 
                              : resolution.action === 'confirmed_distinct'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {resolution.action === 'merged' && 'Slått sammen (Duplikat registrert i PRISMA)'}
                              {resolution.action === 'confirmed_distinct' && 'Bekreftet som distinkte studier'}
                              {resolution.action === 'dismissed' && 'Varsel avvist'}
                            </span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleMerge(pair)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Marker den ene som duplikat og registrer i PRISMA-flyten uten sletting"
                            >
                              <GitMerge className="w-3.5 h-3.5" />
                              <span>Slå sammen (Duplikat)</span>
                            </button>
                            <button
                              onClick={() => handleDistinct(pair)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Marker eksplisitt at dette er to ulike artikler"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Behold begge (Distinkte)</span>
                            </button>
                            <button
                              onClick={() => handleDismiss(pair.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded transition-colors cursor-pointer"
                              title="Ignorer dette varselet"
                            >
                              Avvis
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {pair.matchReasons.map((reason, rIdx) => (
                        <span key={rIdx} className="text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                          🔍 {reason}
                        </span>
                      ))}
                    </div>

                    {/* Side-by-side comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Study A */}
                      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="flex items-center gap-1.5 text-blue-700">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Primærpost (Studie A)</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{pair.studyA.id}</span>
                        </div>
                        <p className="font-semibold text-slate-900 text-xs leading-snug">
                          {pair.studyA.title}
                        </p>
                        <div className="space-y-1 text-slate-600 text-[11px]">
                          <div><strong>Forfattere:</strong> {pair.studyA.authors} ({pair.studyA.year || 'N/A'})</div>
                          <div><strong>Tidsskrift:</strong> {pair.studyA.journal || 'N/A'}</div>
                          {pair.studyA.doi && (
                            <div><strong>DOI:</strong> <span className="font-mono text-blue-600">{pair.studyA.doi}</span></div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono">
                            SHA-256: {pair.studyA.documentHashSha256.substring(0, 16)}...
                          </div>
                        </div>
                      </div>

                      {/* Study B */}
                      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="flex items-center gap-1.5 text-amber-700">
                            <Copy className="w-3.5 h-3.5" />
                            <span>Kandidatpost (Studie B)</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{pair.studyB.id}</span>
                        </div>
                        <p className="font-semibold text-slate-900 text-xs leading-snug">
                          {pair.studyB.title}
                        </p>
                        <div className="space-y-1 text-slate-600 text-[11px]">
                          <div><strong>Forfattere:</strong> {pair.studyB.authors} ({pair.studyB.year || 'N/A'})</div>
                          <div><strong>Tidsskrift:</strong> {pair.studyB.journal || 'N/A'}</div>
                          {pair.studyB.doi && (
                            <div><strong>DOI:</strong> <span className="font-mono text-blue-600">{pair.studyB.doi}</span></div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono">
                            SHA-256: {pair.studyB.documentHashSha256.substring(0, 16)}...
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Duplikatbehandling følger PRISMA 2020-standarden og endrer flyttall uten å destruere originaldata.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-semibold transition-colors cursor-pointer"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
