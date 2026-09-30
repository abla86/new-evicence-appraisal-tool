import React, { useState, useEffect } from 'react';
import { AuditLogEntry, StudyRecord } from '../types';
import { verifyAuditChain } from '../utils/crypto';
import { 
  ShieldCheck, 
  ShieldAlert, 
  History, 
  Lock, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  FileCheck, 
  AlertTriangle, 
  Fingerprint 
} from 'lucide-react';

interface IntegrityAuditTrailProps {
  auditLog: AuditLogEntry[];
  studies: StudyRecord[];
  activeStudyId: string;
  onClose: () => void;
}

export const IntegrityAuditTrail: React.FC<IntegrityAuditTrailProps> = ({
  auditLog,
  studies,
  activeStudyId,
  onClose
}) => {
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    corruptedIndex?: number;
    reason?: string;
  }>({ isValid: true });
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperedState, setTamperedState] = useState<AuditLogEntry[] | null>(null);

  const currentLog = tamperedState || auditLog;
  const activeStudy = studies.find(s => s.id === activeStudyId);

  const runVerification = async (logToVerify: AuditLogEntry[]) => {
    setIsVerifying(true);
    const res = await verifyAuditChain(logToVerify);
    setVerificationResult(res);
    setIsVerifying(false);
  };

  useEffect(() => {
    runVerification(currentLog);
  }, [tamperedState, auditLog]);

  const handleSimulateTamper = () => {
    if (currentLog.length === 0) return;
    const clone = JSON.parse(JSON.stringify(currentLog));
    const targetIdx = Math.min(1, clone.length - 1);
    clone[targetIdx].details = '[TAMPERED VIA UNAUTHORIZED INJECTION] ' + clone[targetIdx].details;
    setTamperedState(clone);
  };

  const handleResetTamper = () => {
    setTamperedState(null);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-2xl overflow-hidden max-w-3xl w-full flex flex-col max-h-[85vh]">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-700 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded flex items-center justify-center">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Evidence Traceability &amp; Cryptographic Audit Ledger
            </h3>
            <p className="text-xs text-slate-400">
              SHA-256 mathematical hash verification and immutable reviewer activity log
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Verification Status Banner */}
      <div className={`p-4 border-b ${
        verificationResult.isValid
          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
          : 'bg-rose-50 text-rose-900 border-rose-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {verificationResult.isValid ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <div className="font-bold text-sm">
                {verificationResult.isValid
                  ? 'Audit Chain Integrity: 100% Cryptographically Valid'
                  : 'INTEGRITY BREACH DETECTED: Tamper Detected in Audit Block'}
              </div>
              <div className="text-xs opacity-90 mt-0.5">
                {verificationResult.isValid
                  ? `All ${currentLog.length} chained Merkle entries match computed SHA-256 signatures.`
                  : verificationResult.reason}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tamperedState ? (
              <button
                onClick={handleResetTamper}
                className="px-2.5 py-1 text-xs font-semibold bg-white text-slate-800 border border-slate-300 rounded hover:bg-slate-100"
              >
                Reset Tamper Test
              </button>
            ) : (
              <button
                onClick={handleSimulateTamper}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded border border-rose-200 transition-colors"
              >
                Test Tamper Detector
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Study Fingerprint Card */}
      {activeStudy && (
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs">
          <span className="font-bold text-slate-700 block mb-1">Active Study SHA-256 Fingerprint:</span>
          <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-900 truncate">
            {activeStudy.documentHashSha256}
          </div>
        </div>
      )}

      {/* Ledger History List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Chained Audit Log Entries ({currentLog.length})
        </h4>

        {currentLog.map((entry, idx) => {
          const isCorrupted = !verificationResult.isValid && verificationResult.corruptedIndex === idx;

          return (
            <div
              key={entry.id}
              className={`p-3.5 rounded border text-xs transition-all ${
                isCorrupted
                  ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white rounded">
                    {entry.action.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-slate-900">{entry.user}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-slate-700 my-1 font-medium">{entry.details}</p>

              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-slate-500 gap-1">
                <span className="truncate">Prev: {entry.previousHashSha256.substring(0, 16)}...</span>
                <span className="truncate text-blue-700 font-bold">Hash: {entry.hashSha256.substring(0, 16)}...</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <span>Compliant with open science reproducibility &amp; auditability mandates.</span>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs"
        >
          Close Ledger
        </button>
      </div>

    </div>
  );
};
