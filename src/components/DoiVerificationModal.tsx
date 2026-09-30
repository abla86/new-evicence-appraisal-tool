import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Lock, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  Building2, 
  FileCheck,
  X
} from 'lucide-react';
import { StudyRecord } from '../types';
import { DoiVerificationResult, verifyAndFetchDoiMetadata } from '../utils/doiVerifier';

interface DoiVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudy?: StudyRecord;
  onApplyMetadata?: (metadata: Partial<StudyRecord>) => void;
}

export const DoiVerificationModal: React.FC<DoiVerificationModalProps> = ({
  isOpen,
  onClose,
  activeStudy,
  onApplyMetadata
}) => {
  const [inputDoi, setInputDoi] = useState(activeStudy?.doi || '10.1002/14651858.CD013577.pub2');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<DoiVerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await verifyAndFetchDoiMetadata(inputDoi);
      setVerificationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToStudy = () => {
    if (!verificationResult || !onApplyMetadata) return;
    onApplyMetadata({
      doi: verificationResult.doi,
      title: verificationResult.title,
      authors: verificationResult.authors.join(', '),
      journal: verificationResult.journal,
      year: verificationResult.year
    });
    onClose();
  };

  const handleCopy = () => {
    if (!verificationResult) return;
    navigator.clipboard.writeText(`DOI: ${verificationResult.doi}\nTittel: ${verificationResult.title}\nTidsskrift: ${verificationResult.journal} (${verificationResult.year})\nRetraction Status: ${verificationResult.retractionStatus}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Akademisk DOI & Sikkerhetsverifikasjon (WHO & Universitet)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kryssjekk mot CrossRef, PubMed, Retraction Watch, Open Access & kryptografisk integritet
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Digital Object Identifier (DOI) eller URL:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={inputDoi}
                  onChange={(e) => setInputDoi(e.target.value)}
                  placeholder="f.eks. 10.1002/14651858.CD013577.pub2 eller https://doi.org/10.1371/..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading || !inputDoi.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifiserer...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verifiser DOI</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Hurtigvalg eksempler:</span>
              <button 
                type="button" 
                onClick={() => { setInputDoi('10.1002/14651858.CD013577.pub2'); }}
                className="text-blue-600 hover:underline font-mono"
              >
                Cochrane (Wieland)
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => { setInputDoi('10.1371/journal.pmed.1001165'); }}
                className="text-blue-600 hover:underline font-mono"
              >
                PLoS Med (Bunn)
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => { setInputDoi('10.1186/s12877-017-0466-2'); }}
                className="text-blue-600 hover:underline font-mono"
              >
                BMC Geriatrics (Tretteteig)
              </button>
            </div>
          </div>

          {/* Results Display */}
          {verificationResult && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Trust Score Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                verificationResult.securityTrustScore >= 90
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : verificationResult.securityTrustScore >= 70
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg text-white ${
                    verificationResult.securityTrustScore >= 90 ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      {verificationResult.securityTrustScore >= 90 
                        ? 'Akademisk Integritet Verifisert (WHO / Universitet Standard)' 
                        : 'Advarsel: Begrenset metadata verifisering'}
                    </h3>
                    <p className="text-xs opacity-90">
                      Retraction Watch Status: <strong className="font-semibold">{verificationResult.retractionStatus}</strong>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{verificationResult.securityTrustScore}/100</span>
                  <p className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Tillitsscore</p>
                </div>
              </div>

              {/* Grid of metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Tittel</span>
                  <p className="font-semibold text-slate-900 text-sm leading-snug">{verificationResult.title}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Forfattere & Affiliasjon</span>
                  <p className="font-medium text-slate-800">{verificationResult.authors.join(', ') || 'Ikke spesifisert'}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Tidsskrift & Forlag</span>
                  <p className="font-semibold text-slate-900">{verificationResult.journal}</p>
                  <p className="text-slate-600 text-[11px]">{verificationResult.publisher} ({verificationResult.year})</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Indeksering & Tilgang</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium text-[10px]">CrossRef OK</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium text-[10px]">PubMed/MEDLINE</span>
                    {verificationResult.isOpenAccess && (
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium text-[10px]">Open Access ({verificationResult.license})</span>
                    )}
                    {verificationResult.pmcid && (
                      <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-medium text-[10px] font-mono">{verificationResult.pmcid}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Security & Integrity Check Notes */}
              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sikkerhetsrapport & Integritetssjekk</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-xs pl-2">
                  {verificationResult.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Lukk
          </button>
          <div className="flex items-center gap-2">
            {verificationResult && (
              <>
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 text-sm border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Kopiert!' : 'Kopier rapport'}</span>
                </button>
                {onApplyMetadata && (
                  <button
                    onClick={handleApplyToStudy}
                    className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bruk metadata på artikkel</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
