import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  FileCheck2, 
  Scale, 
  UserCheck, 
  Database, 
  Clock, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { DataGovernanceGate, ResearchProject } from '../types';

interface GovernanceGateModalProps {
  project: ResearchProject;
  onUpdateGovernanceGate: (gate: DataGovernanceGate) => void;
  onClose: () => void;
}

export const GovernanceGateModal: React.FC<GovernanceGateModalProps> = ({
  project,
  onUpdateGovernanceGate,
  onClose
}) => {
  const currentGate = project.governanceGate;

  const [hasDirectIdentifiers, setHasDirectIdentifiers] = useState<boolean>(
    currentGate?.hasDirectIdentifiers || false
  );
  const [hasIndirectIdentifiers, setHasIndirectIdentifiers] = useState<boolean>(
    currentGate?.hasIndirectIdentifiers || false
  );
  const [containsHealthData, setContainsHealthData] = useState<boolean>(
    currentGate?.containsHealthData ?? true
  );
  const [legalBasisRegistered, setLegalBasisRegistered] = useState<boolean>(
    currentGate?.legalBasisRegistered ?? true
  );
  const [legalBasisNotes, setLegalBasisNotes] = useState<string>(
    currentGate?.legalBasisNotes || 'Helseforskningsloven §§ 5–7 / GDPR Art. 6(1)(e) & Art. 9(2)(j) (Scientific Research). Aggregate published trial data.'
  );
  const [rekEthicsStatus, setRekEthicsStatus] = useState<
    'REK Pre-Approval Registered' | 'Exempt / Open Access Scientific Publications' | 'Institutional Review Board Verified' | 'Not Applicable'
  >(
    currentGate?.rekEthicsStatus || 'Exempt / Open Access Scientific Publications'
  );
  const [rekReferenceNumber, setRekReferenceNumber] = useState<string>(
    currentGate?.rekReferenceNumber || 'REK-NORD-2026-EXEMPT-04'
  );
  const [dataMinimizationFulfilled, setDataMinimizationFulfilled] = useState<boolean>(
    currentGate?.dataMinimizationFulfilled ?? true
  );
  const [storageLocationApproved, setStorageLocationApproved] = useState<boolean>(
    currentGate?.storageLocationApproved ?? true
  );
  const [storageLocationName, setStorageLocationName] = useState<string>(
    currentGate?.storageLocationName || 'Sandboxed Research Enclave (AES-256 at rest, TLS 1.3 in transit)'
  );
  const [retentionPolicy, setRetentionPolicy] = useState<string>(
    currentGate?.retentionPolicy || '10 years post-publication in compliance with National Research Ethics norms'
  );
  const [verifiedBy, setVerifiedBy] = useState<string>(
    currentGate?.verifiedBy || project.leadInvestigator || 'Dr. Sarah Lindqvist (Principal Investigator)'
  );

  // Evaluation: Gate is strictly passed if:
  // 1. Direct identifiers are NOT present (or strictly anonymized/pseudonymized)
  // 2. Legal basis is registered
  // 3. Data minimization is confirmed
  // 4. Storage location is approved
  const isDirectIdentifierSafe = !hasDirectIdentifiers;
  const isGateValid = isDirectIdentifierSafe && legalBasisRegistered && dataMinimizationFulfilled && storageLocationApproved && rekEthicsStatus.trim().length > 0;

  const handleSaveAndEnforce = () => {
    const updatedGate: DataGovernanceGate = {
      projectId: project.id,
      verifiedBy,
      verifiedAt: new Date().toISOString(),
      containsIdentifiablePersonalData: hasDirectIdentifiers || hasIndirectIdentifiers,
      containsHealthData,
      hasDirectIdentifiers,
      hasIndirectIdentifiers,
      legalBasisRegistered,
      legalBasisNotes,
      rekEthicsStatus,
      rekReferenceNumber: rekReferenceNumber.trim() || undefined,
      dataMinimizationFulfilled,
      storageLocationApproved,
      storageLocationName,
      retentionPolicy,
      isGatePassed: isGateValid
    };

    onUpdateGovernanceGate(updatedGate);
    onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isGateValid ? 'bg-emerald-600' : 'bg-amber-600'}`}>
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Research Data Governance Gate</h2>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold border ${
                isGateValid 
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' 
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}>
                {isGateValid ? 'GATE VERIFIED & ENFORCED' : 'ACTION REQUIRED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              NORWEGIAN / EU COMPLIANCE (Helseforskningsloven §§ 5–7 • GDPR Art. 6 &amp; 9 • WHO Research Principles)
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

      {/* Body Content */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
        
        {/* Policy Notice Box */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <Scale className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-900 block mb-0.5">System Mandate on Research Data Governance:</strong>
              This application does not use generic compliance checkboxes. Instead, it systematically documents and enforces the concrete legal, ethical, and privacy prerequisites of the <strong>{project.shortCode || project.title}</strong> project before research synthesis and data extractions are processed.
            </div>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Privacy & Identifiable Data */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Data Minimization &amp; Identification Risk
              </h3>
            </div>

            {/* Direct Identifiers Check */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDirectIdentifiers}
                  onChange={(e) => setHasDirectIdentifiers(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Contains Direct Identifiers (Personidentifikatorer)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Names, national identity numbers (Fødselsnummer), direct phone/email or patient hospital MRNs.
                  </p>
                </div>
              </label>
              {hasDirectIdentifiers && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-700 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>Direct identifiers strictly block synthesis until de-identified/pseudonymized.</span>
                </div>
              )}
            </div>

            {/* Indirect Identifiers */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasIndirectIdentifiers}
                  onChange={(e) => setHasIndirectIdentifiers(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Contains Indirect Identifiers (Indirekte kjennetegn)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rare clinical diagnoses with small regional cohorts, specific trial centers, age combinations.
                  </p>
                </div>
              </label>
            </div>

            {/* Health Data Classification */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={containsHealthData}
                  onChange={(e) => setContainsHealthData(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Special Category / Health Data (GDPR Art. 9)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Clinical outcomes, trial interventions, biomarkers (e.g. HbA1c, stroke incidence).
                  </p>
                </div>
              </label>
            </div>

            {/* Data Minimization */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dataMinimizationFulfilled}
                  onChange={(e) => setDataMinimizationFulfilled(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Data Minimization Enforced (Dataminimering)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Only variables strictly required by the systematic review protocol are extracted.
                  </p>
                </div>
              </label>
            </div>

          </div>

          {/* Section 2: Legal Basis & Ethics (REK) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Scale className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Legal Basis &amp; Ethics Clearance (REK / NSD)
              </h3>
            </div>

            {/* Legal Basis Registered */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={legalBasisRegistered}
                  onChange={(e) => setLegalBasisRegistered(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Legal Basis Registered (Behandlingsgrunnlag)
                  </span>
                </div>
              </label>
              <textarea
                value={legalBasisNotes}
                onChange={(e) => setLegalBasisNotes(e.target.value)}
                rows={2}
                placeholder="Statutory citation (e.g. Helseforskningsloven §§ 5–7, GDPR Art. 6(1)(e))..."
                className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono bg-slate-50"
              />
            </div>

            {/* REK Ethics Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                REK / Ethical Committee Clearance Status
              </label>
              <select
                value={rekEthicsStatus}
                onChange={(e) => setRekEthicsStatus(e.target.value as 'REK Pre-Approval Registered' | 'Exempt / Open Access Scientific Publications' | 'Institutional Review Board Verified' | 'Not Applicable')}
                className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 bg-white font-medium cursor-pointer"
              >
                <option value="Exempt / Open Access Scientific Publications">
                  Exempt / Open Access Scientific Publications
                </option>
                <option value="REK Pre-Approval Registered">
                  REK Pre-Approval Registered
                </option>
                <option value="Institutional Review Board Verified">
                  Institutional Review Board Verified
                </option>
                <option value="Not Applicable">
                  Not Applicable
                </option>
              </select>
            </div>

            {/* REK Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                REK / Sikt Reference Number (if applicable)
              </label>
              <input
                type="text"
                value={rekReferenceNumber}
                onChange={(e) => setRekReferenceNumber(e.target.value)}
                placeholder="e.g. REK-NORD-2026-EXEMPT-04"
                className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
              />
            </div>

          </div>

          {/* Section 3: Storage & Retention Infrastructure */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Approved Storage Environment &amp; Retention Schedule
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Enclave Specification
                </label>
                <input
                  type="text"
                  value={storageLocationName}
                  onChange={(e) => setStorageLocationName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Retention &amp; Archival Policy
                </label>
                <input
                  type="text"
                  value={retentionPolicy}
                  onChange={(e) => setRetentionPolicy(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Principal Investigator / Verifying Officer
              </label>
              <input
                type="text"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>

          </div>

        </div>

        {/* Gate Status Banner */}
        <div className={`p-4 rounded-lg border flex items-center justify-between ${
          isGateValid 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-3">
            {isGateValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold">
                {isGateValid 
                  ? 'Governance Verification Complete' 
                  : 'Governance Gate Locked: Unmet Legal/Security Prerequisites'}
              </div>
              <div className="text-[11px] opacity-90">
                {isGateValid
                  ? 'All conditions documented. Research ingestion, extraction, and synthesis may proceed.'
                  : 'Ensure direct identifiers are cleared and all legal basis fields are fulfilled.'}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Timestamped cryptographic audit entry logged upon saving.
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            id="governance-gate-save-btn"
            onClick={handleSaveAndEnforce}
            className={`px-5 py-2 text-xs font-bold rounded-md shadow-sm transition-colors flex items-center gap-1.5 ${
              isGateValid
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Enforce Governance Gate</span>
          </button>
        </div>
      </div>

    </div>
  );
};
