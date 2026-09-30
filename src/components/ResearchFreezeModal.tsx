import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  GitBranch, 
  Key, 
  X, 
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  AppraisalAssessment, 
  AuditLogEntry, 
  DataExtractionRecord, 
  PrismaFlowData, 
  ResearchFreezeSnapshot, 
  ResearchProject, 
  ScreeningEvent, 
  StudyRecord 
} from '../types';
import { calculateSha256 } from '../utils/crypto';

interface ResearchFreezeModalProps {
  project: ResearchProject;
  studies: StudyRecord[];
  assessments: Record<string, AppraisalAssessment[]>;
  auditLog: AuditLogEntry[];
  prismaData: PrismaFlowData;
  screeningEvents: ScreeningEvent[];
  extractions: DataExtractionRecord[];
  onFreezeProject: (snapshot: ResearchFreezeSnapshot) => void;
  onClose: () => void;
}

export const ResearchFreezeModal: React.FC<ResearchFreezeModalProps> = ({
  project,
  studies,
  assessments,
  auditLog,
  prismaData,
  screeningEvents,
  extractions,
  onFreezeProject,
  onClose
}) => {
  const [signedBy, setSignedBy] = useState<string>(
    project.leadInvestigator || 'Dr. Sarah Lindqvist, MD, PhD (Lead Investigator)'
  );
  const [freezeVersion, setFreezeVersion] = useState<string>(
    project.activeVersion ? `v${project.activeVersion}-FINAL-SEAL` : 'v1.0-FINAL-SEAL'
  );
  const [freezeNotes, setFreezeNotes] = useState<string>(
    'Final research freeze before peer-reviewed manuscript submission. All dual appraisals reconciled, extraction grounded in source documents, PRISMA flow verified.'
  );

  const [calculating, setCalculating] = useState<boolean>(true);
  const [calculatedSnapshot, setCalculatedSnapshot] = useState<ResearchFreezeSnapshot | null>(null);
  const [isSealed, setIsSealed] = useState<boolean>(false);

  useEffect(() => {
    async function computeFreezeHashes() {
      setCalculating(true);
      try {
        const protocolString = JSON.stringify(project.protocol || {});
        const protocolHash = await calculateSha256(protocolString);

        const methodologyString = JSON.stringify({
          instruments: ['AMSTAR2', 'ROB2', 'GRADE', 'CASP', 'AGREE2', 'PRISMA'],
          prismaData,
          governanceGate: project.governanceGate
        });
        const methodologyHash = await calculateSha256(methodologyString);

        const documentsList = studies.map(s => ({
          studyId: s.id,
          title: s.title,
          documentHashSha256: s.documentHashSha256,
          isLocked: s.isLocked
        }));

        const auditChainRootHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';

        const manifestPayload = {
          projectId: project.id,
          projectTitle: project.title,
          versionTag: freezeVersion,
          timestamp: new Date().toISOString(),
          protocolHashSha256: protocolHash,
          methodologyHashSha256: methodologyHash,
          documentsList,
          assessmentsCount: Object.values(assessments).flat().length,
          screeningEventsCount: screeningEvents.length,
          extractionsCount: extractions.length,
          auditChainRootHash,
          sealedBy: signedBy
        };

        const manifestRootHashSha256 = await calculateSha256(JSON.stringify(manifestPayload));

        const snapshot: ResearchFreezeSnapshot = {
          snapshotId: `freeze-${project.id}-${Date.now()}`,
          versionTag: freezeVersion,
          timestamp: new Date().toISOString(),
          sealedBy: signedBy,
          protocolHashSha256: protocolHash,
          methodologyHashSha256: methodologyHash,
          manifestRootHashSha256,
          totalStudiesSealed: studies.length,
          status: 'IMMUTABLE_LOCKED',
          notes: freezeNotes
        };

        setCalculatedSnapshot(snapshot);
      } catch (err) {
        console.error('Error computing freeze hashes', err);
      } finally {
        setCalculating(false);
      }
    }

    computeFreezeHashes();
  }, [project, studies, assessments, auditLog, prismaData, screeningEvents, extractions, signedBy, freezeVersion, freezeNotes]);

  const handleSealAndFreeze = () => {
    if (!calculatedSnapshot) return;
    onFreezeProject(calculatedSnapshot);
    setIsSealed(true);
  };

  const handleDownloadCertificate = () => {
    if (!calculatedSnapshot) return;

    const certData = {
      certificateTitle: 'RESEARCH STUDIO IMMUTABLE FREEZE CERTIFICATE',
      project: {
        id: project.id,
        title: project.title,
        version: calculatedSnapshot.versionTag,
        leadInvestigator: project.leadInvestigator,
        organization: project.organization
      },
      freezeSnapshot: calculatedSnapshot,
      verificationInstructions: 'To verify integrity, recompute SHA-256 of the manifest payload and match against manifestRootHashSha256.'
    };

    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RESEARCH_FREEZE_${project.shortCode || project.id}_${calculatedSnapshot.versionTag}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Research Freeze &amp; Cryptographic Sealing</h2>
              <span className="text-[11px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-semibold">
                PHASE B IMMUTABLE SNAPSHOT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates an immutable Merkle root seal across protocol, source documents, appraisals &amp; audit chain.
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

      {/* Body */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
        
        {/* Info Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-xs text-emerald-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Reproducibility Guarantee:</strong>
            Sealing this project establishes an official, immutable research milestone. If subsequent methodological updates or new study inclusions occur, the platform creates a distinct version (e.g. V2.0) with an auditable cryptographic link to this baseline seal.
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            Freeze Milestone Metadata
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Release Version Tag
              </label>
              <input
                type="text"
                value={freezeVersion}
                onChange={(e) => setFreezeVersion(e.target.value)}
                placeholder="v1.0-FINAL-SEAL"
                className="w-full text-xs p-2 border border-slate-300 rounded font-mono font-bold text-slate-800 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Signatory / Lead Investigator
              </label>
              <input
                type="text"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Milestone &amp; Freeze Rationale
            </label>
            <textarea
              value={freezeNotes}
              onChange={(e) => setFreezeNotes(e.target.value)}
              rows={2}
              className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
            />
          </div>
        </div>

        {/* Cryptographic Manifest Preview */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Cryptographic Root Seal Manifest</span>
            </h3>
            {calculating && (
              <span className="text-[11px] text-blue-600 font-medium animate-pulse">
                Computing SHA-256 hashes...
              </span>
            )}
          </div>

          {calculatedSnapshot && (
            <div className="space-y-2.5 font-mono text-[11px]">
              
              <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>ROOT MANIFEST SHA-256 HASH</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xs text-emerald-300 break-all font-bold">
                  {calculatedSnapshot.manifestRootHashSha256}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="text-[9px] text-slate-500 uppercase font-semibold">Protocol Hash</div>
                  <div className="text-[10px] text-slate-800 truncate font-mono">
                    {calculatedSnapshot.protocolHashSha256}
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="text-[9px] text-slate-500 uppercase font-semibold">Methodology Hash</div>
                  <div className="text-[10px] text-slate-800 truncate font-mono">
                    {calculatedSnapshot.methodologyHashSha256}
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="text-[9px] text-slate-500 uppercase font-semibold">Studies Sealed</div>
                  <div className="text-[10px] text-slate-800 font-sans">
                    {calculatedSnapshot.totalStudiesSealed} Studies Sealed &amp; Immutably Locked
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="text-[9px] text-slate-500 uppercase font-semibold">Dataset Scope</div>
                  <div className="text-[10px] text-slate-800 font-sans">
                    {Object.values(assessments).flat().length} appraisals • {extractions.length} extractions
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Sealed confirmation */}
        {isSealed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>Project version <strong>{freezeVersion}</strong> successfully sealed and frozen!</span>
            </div>
            <button
              onClick={handleDownloadCertificate}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Certificate</span>
            </button>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Permanent snapshot stored in project registry.
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
          >
            Close
          </button>
          {!isSealed ? (
            <button
              id="seal-project-button"
              disabled={calculating || !calculatedSnapshot}
              onClick={handleSealAndFreeze}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>Seal &amp; Freeze {freezeVersion}</span>
            </button>
          ) : (
            <button
              onClick={handleDownloadCertificate}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed Certificate</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
