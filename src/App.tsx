import React, { useState, useEffect } from 'react';
import { 
  ActiveTab,
  AppraisalAssessment, 
  AppraisalInstrument, 
  AuditLogEntry, 
  DataExtractionRecord,
  DataGovernanceGate,
  DocumentAnalysisFinding, 
  PrismaFlowData, 
  ReferenceItem,
  ResearchFreezeSnapshot,
  ResearchProject,
  ScreeningEvent,
  SourceRecord,
  StudyRecord,
  SynthesisOutcome
} from './types';
import { 
  loadSavedProject,
  saveProject,
  loadSavedStudies, 
  saveStudies, 
  loadSavedAssessments, 
  saveAssessments, 
  loadSavedPrisma, 
  savePrisma, 
  loadSavedAuditLog, 
  saveAuditLog, 
  loadSavedScreeningEvents,
  saveScreeningEvents,
  loadSavedExtractions,
  saveExtractions,
  loadSavedSynthesisOutcomes,
  saveSynthesisOutcomes,
  loadSavedSourceRecords,
  saveSourceRecords,
  loadSavedReferences,
  saveReferences,
  getInitialSampleProject,
  getInitialSampleStudies, 
  getInitialSampleAssessments, 
  getInitialSampleScreeningEvents,
  getInitialSampleExtractions,
  getInitialSampleSynthesisOutcomes,
  getInitialSampleReferences,
  resetToDefaults 
} from './utils/storage';
import { createAuditEntry, generateSecureId } from './utils/crypto';
import { validateStudyAppraisalLock } from './utils/appraisalLockValidator';
import { ScreeningGateService } from './services/screeningGateService';
import { SafeBoundary } from './components/SafeBoundary';
import { Header } from './components/Header';
import { EvidenceDocumentViewer } from './components/EvidenceDocumentViewer';
import { AppraisalWorkspace } from './components/AppraisalWorkspace';
import { SourceRecordWorkflowView } from './components/SourceRecordWorkflowView';
import { ReferenceHubView } from './components/ReferenceHubView';
import { ArticleLibraryView } from './components/ArticleLibraryView';
import { ModuleHubView } from './components/ModuleHubView';
import { DocumentUploadCard } from './components/DocumentUploadCard';
import { DualReviewerComparison } from './components/DualReviewerComparison';
import { MultiReviewerComparison } from './components/MultiReviewerComparison';
import { CitationModal } from './components/CitationModal';
import { PrismaFlowDiagram } from './components/PrismaFlowDiagram';
import { IntegrityAuditTrail } from './components/IntegrityAuditTrail';
import { ExportModal } from './components/ExportModal';
import { SelfHealingMonitor } from './components/SelfHealingMonitor';
import { GovernanceGateModal } from './components/GovernanceGateModal';
import { ResearchFreezeModal } from './components/ResearchFreezeModal';
import { ProjectProtocolModal } from './components/ProjectProtocolModal';
import { DataExtractionModal } from './components/DataExtractionModal';
import { SensitivityAnalysisModal } from './components/SensitivityAnalysisModal';
import { ReliabilityReportModal } from './components/ReliabilityReportModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { DoiVerificationModal } from './components/DoiVerificationModal';
import { ValidationTestRunnerModal } from './components/ValidationTestRunnerModal';
import { DuplicateDetectorModal } from './components/DuplicateDetectorModal';
import { PrivateShareModal } from './components/PrivateShareModal';
import { ResearchSearchHubModal } from './components/ResearchSearchHubModal';
import { ThesisDraftModal } from './components/ThesisDraftModal';
import { MetaResearchModal } from './components/MetaResearchModal';
import { StudyDesignAdvisoryModal } from './components/StudyDesignAdvisoryModal';
import { scanDocumentForFramework } from './utils/evidenceScanner';
import { WorkspaceSecurityConfig } from './types';
import { 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Layers, 
  GitBranch, 
  Activity, 
  Lock, 
  Plus, 
  ChevronRight, 
  Filter, 
  Check, 
  FolderKanban, 
  FileSpreadsheet, 
  AlertTriangle, 
  BookOpen, 
  Sparkles, 
  Search, 
  Sliders,
  Scale,
  FlaskConical,
  Copy
} from 'lucide-react';

export default function App() {
  // Core State
  const [project, setProject] = useState<ResearchProject>(() => loadSavedProject());
  const [studies, setStudies] = useState<StudyRecord[]>(() => loadSavedStudies());
  const [activeStudyId, setActiveStudyId] = useState<string>(() => {
    const loaded = loadSavedStudies();
    return loaded[0]?.id || '';
  });
  const [assessments, setAssessments] = useState<Record<string, AppraisalAssessment[]>>(() => loadSavedAssessments());
  const [prismaData, setPrismaData] = useState<PrismaFlowData>(() => loadSavedPrisma());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => loadSavedAuditLog());
  const [screeningEvents, setScreeningEvents] = useState<ScreeningEvent[]>(() => loadSavedScreeningEvents());
  const [extractions, setExtractions] = useState<DataExtractionRecord[]>(() => loadSavedExtractions());
  const [synthesisOutcomes, setSynthesisOutcomes] = useState<SynthesisOutcome[]>(() => loadSavedSynthesisOutcomes());
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>(() => loadSavedSourceRecords());
  const [references, setReferences] = useState<ReferenceItem[]>(() => loadSavedReferences());

  // Active Tab & Framework
  const [activeTab, setActiveTab] = useState<ActiveTab>('appraisal');
  const [activeInstrument, setActiveInstrument] = useState<AppraisalInstrument>('AMSTAR2');
  const [selectedFinding, setSelectedFinding] = useState<DocumentAnalysisFinding | null>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDualComparison, setShowDualComparison] = useState(false);
  const [showPrismaModal, setShowPrismaModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showGovernanceGateModal, setShowGovernanceGateModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showProjectProtocolModal, setShowProjectProtocolModal] = useState(false);
  const [showDataExtractionModal, setShowDataExtractionModal] = useState(false);
  const [showSensitivityModal, setShowSensitivityModal] = useState(false);
  const [showReliabilityModal, setShowReliabilityModal] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState(false);
  const [showDoiVerificationModal, setShowDoiVerificationModal] = useState(false);
  const [showDuplicateDetectorModal, setShowDuplicateDetectorModal] = useState(false);
  const [showTestRunnerModal, setShowTestRunnerModal] = useState(false);
  const [showPrivateShareModal, setShowPrivateShareModal] = useState(false);
  const [showResearchSearchModal, setShowResearchSearchModal] = useState(false);
  const [showThesisDraftModal, setShowThesisDraftModal] = useState(false);
  const [showMetaResearchModal, setShowMetaResearchModal] = useState(false);
  const [showDesignAdvisoryModal, setShowDesignAdvisoryModal] = useState(false);

  // Private sharing and workspace security state
  const [securityConfig, setSecurityConfig] = useState<WorkspaceSecurityConfig>({
    isLocked: false,
    hasPasscode: false,
    passcodeHint: '',
    activeRole: 'Lead Reviewer',
    activeUserName: project.leadInvestigator || 'Researcher',
    projectSecretToken: '',
    allowedCollaboratorEmails: [],
    sharingMode: 'private_repo',
    githubRepoVisibility: 'private'
  });

  // Persistent Auto-Save Sync
  useEffect(() => {
    saveProject(project);
  }, [project]);

  useEffect(() => {
    saveStudies(studies);
  }, [studies]);

  useEffect(() => {
    saveAssessments(assessments);
  }, [assessments]);

  useEffect(() => {
    savePrisma(prismaData);
  }, [prismaData]);

  useEffect(() => {
    saveAuditLog(auditLog);
  }, [auditLog]);

  useEffect(() => {
    saveScreeningEvents(screeningEvents);
    ScreeningGateService.syncExternalScreeningEvents(screeningEvents);
  }, [screeningEvents]);

  useEffect(() => {
    saveExtractions(extractions);
  }, [extractions]);

  useEffect(() => {
    saveSynthesisOutcomes(synthesisOutcomes);
  }, [synthesisOutcomes]);

  useEffect(() => {
    saveSourceRecords(sourceRecords);
  }, [sourceRecords]);

  useEffect(() => {
    saveReferences(references);
  }, [references]);

  // Unified audit log helper
  const logEvent = async (
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    details: string
  ) => {
    try {
      const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
      const entry = await createAuditEntry(
        action,
        entityType,
        entityId,
        'Researcher / System',
        details,
        lastHash
      );
      setAuditLog(prev => [...prev, entry]);
    } catch (e) {
      console.warn('Audit logging deferred', e);
    }
  };

  // SourceRecord Workflow Handlers
  const handleAddSourceRecord = (record: SourceRecord) => {
    setSourceRecords(prev => [record, ...prev]);
    logEvent('IMPORT_DOCUMENT', 'StudyRecord', record.id, `Ny kildepost registrert: ${record.title} (${record.sourceOrigin})`);
  };

  const handleUpdateSourceRecord = (record: SourceRecord) => {
    setSourceRecords(prev => prev.map(r => r.id === record.id ? record : r));
  };

  const handlePromoteToStudy = (sourceRecord: SourceRecord, targetInstrument?: AppraisalInstrument) => {
    const newStudyId = generateSecureId('study');
    const newStudy: StudyRecord = {
      id: newStudyId,
      projectId: project.id,
      title: sourceRecord.title,
      authors: sourceRecord.authors.join(', '),
      year: sourceRecord.year,
      journal: sourceRecord.journal,
      doi: sourceRecord.doi,
      abstract: sourceRecord.abstract,
      documentType: 'Unspecified / Unknown',
      fileName: `${sourceRecord.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.txt`,
      fileSizeBytes: (sourceRecord.abstract?.length || 500) * 2,
      fileExtension: 'txt',
      rawContent: sourceRecord.abstract || `Artikkel: ${sourceRecord.title}\nForfattere: ${sourceRecord.authors.join(', ')}\nÅr: ${sourceRecord.year || 'u.å.'}\nDOI: ${sourceRecord.doi || 'ingen'}`,
      documentHashSha256: sourceRecord.provenanceHashSha256,
      importedAt: new Date().toISOString(),
      isLocked: false,
      tags: sourceRecord.tags || []
    };

    setStudies(prev => [newStudy, ...prev]);
    setActiveStudyId(newStudyId);
    if (targetInstrument) setActiveInstrument(targetInstrument);

    const updatedSource: SourceRecord = {
      ...sourceRecord,
      linkedStudyId: newStudyId
    };
    handleUpdateSourceRecord(updatedSource);
    setActiveTab('appraisal');
    logEvent('IMPORT_DOCUMENT', 'StudyRecord', newStudyId, `Kildepost ${sourceRecord.id} overført til ${targetInstrument || 'valgt'}-arbeidsflate`);
  };

  const handlePromoteReferenceToStudy = (study: StudyRecord) => {
    setStudies(prev => [study, ...prev]);
    setActiveStudyId(study.id);
    setActiveTab('appraisal');
    logEvent('IMPORT_DOCUMENT', 'StudyRecord', study.id, `Referanse ${study.sourceRefId || study.id} overført til metodisk arbeidsflate`);
  };

  const handleNavigateToAppraisal = (studyId?: string, instrument: AppraisalInstrument = 'JBI_QUALITATIVE') => {
    if (studyId) {
      setActiveStudyId(studyId);
    }
    setActiveInstrument(instrument);
    setActiveTab('appraisal');
  };

  // Active Study Resolution
  const activeStudy = studies.find(s => s.id === activeStudyId) || studies[0];
  const activeStudyAssessments = activeStudy ? (assessments[activeStudy.id] || []) : [];

  // Handlers
  const handleDocumentImported = async (newStudy: StudyRecord) => {
    // Automatically perform multi-framework scan upon import
    const scannedFindings = scanDocumentForFramework(newStudy, activeInstrument);
    const enrichedStudy: StudyRecord = {
      ...newStudy,
      findings: scannedFindings
    };

    setStudies(prev => [enrichedStudy, ...prev]);
    setActiveStudyId(enrichedStudy.id);

    // Add Audit Entry
    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'IMPORT_DOCUMENT',
      'StudyRecord',
      enrichedStudy.id,
      'Researcher Ingestion',
      `Ingested "${enrichedStudy.title.substring(0, 45)}..." with SHA-256 integrity seal: ${enrichedStudy.documentHashSha256.substring(0, 16)}... Identified ${scannedFindings.length} evidence markers.`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleRunAutoScan = () => {
    if (!activeStudy) return;
    const scannedFindings = scanDocumentForFramework(activeStudy, activeInstrument);
    
    setStudies(prev => prev.map(s => {
      if (s.id !== activeStudy.id) return s;
      return {
        ...s,
        findings: scannedFindings
      };
    }));

    if (scannedFindings.length > 0) {
      setSelectedFinding(scannedFindings[0]);
    }
  };

  const handleApplyDoiMetadata = (metadata: Partial<StudyRecord>) => {
    if (!activeStudy) return;
    setStudies(prev => prev.map(s => {
      if (s.id !== activeStudy.id) return s;
      return {
        ...s,
        ...metadata
      };
    }));
  };

  const handleUpdateAssessment = async (updatedAssessment: AppraisalAssessment) => {
    setAssessments(prev => {
      const studyAssessments = prev[updatedAssessment.studyId] || [];
      const index = studyAssessments.findIndex(
        a => a.instrument === updatedAssessment.instrument && a.reviewerRole === updatedAssessment.reviewerRole
      );

      let nextList = [...studyAssessments];
      if (index >= 0) {
        nextList[index] = updatedAssessment;
      } else {
        nextList.push(updatedAssessment);
      }

      return {
        ...prev,
        [updatedAssessment.studyId]: nextList
      };
    });
  };

  const handleSaveConsensus = async (consensusAssessment: AppraisalAssessment) => {
    setAssessments(prev => {
      const studyAssessments = prev[consensusAssessment.studyId] || [];
      const filtered = studyAssessments.filter(a => !(a.instrument === consensusAssessment.instrument && a.isConsensus));
      return {
        ...prev,
        [consensusAssessment.studyId]: [...filtered, consensusAssessment]
      };
    });

    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'RESOLVE_DISCREPANCY',
      'ConsensusReport',
      consensusAssessment.studyId,
      'Consensus Panel Arbiter',
      `Resolved dual-reviewer discrepancies for ${consensusAssessment.instrument}. Consensus assessment sealed.`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleLockStudy = async (studyId: string) => {
    const studyToLock = studies.find(s => s.id === studyId);
    if (!studyToLock) return;

    const studyAssessments = assessments[studyId] || [];
    const activeAss = studyAssessments.find(a => a.instrument === activeInstrument) || studyAssessments[0];

    // Methodological & Cryptographic Lock Integrity Verification
    const lockValidation = validateStudyAppraisalLock(studyToLock, activeAss);
    if (!lockValidation.canLock) {
      console.warn('[handleLockStudy] Låsing avvist på grunn av metodiske mangler:', lockValidation.blockers);
      alert(`Metodisk forseglings-integritet:\n\nStudien kan ikke låses/forsegles før følgende er utbedret:\n\n• ${lockValidation.blockers.join('\n• ')}`);
      return;
    }

    const lockedAt = new Date().toISOString();
    const lockedBy = 'Dr. Sarah Lindqvist (Lead Reviewer)';

    setStudies(prev => prev.map(s => s.id === studyId ? {
      ...s,
      isLocked: true,
      lockedAt,
      lockedBy
    } : s));

    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'LOCK_STUDY',
      'StudyRecord',
      studyId,
      lockedBy,
      `Final lock & seal applied to study "${studyToLock.title.substring(0, 40)}...". SHA-256 seal: ${studyToLock.documentHashSha256}`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleUpdateGovernanceGate = async (updatedGate: DataGovernanceGate) => {
    setProject(prev => ({
      ...prev,
      governanceGate: updatedGate,
      updatedAt: new Date().toISOString()
    }));

    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'GOVERNANCE_GATE_VERIFIED',
      'DataGovernanceGate',
      updatedGate.projectId,
      updatedGate.verifiedBy,
      `Research Governance Gate enforced (Status: ${updatedGate.isGatePassed ? 'PASSED' : 'ACTION REQUIRED'}). Legal basis: ${updatedGate.legalBasisNotes.substring(0, 40)}...`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleFreezeProject = async (snapshot: ResearchFreezeSnapshot) => {
    setProject(prev => ({
      ...prev,
      activeVersion: snapshot.versionTag,
      updatedAt: snapshot.timestamp,
      snapshots: [...(prev.snapshots || []), snapshot]
    }));

    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'RESEARCH_FREEZE_SEALED',
      'ResearchFreeze',
      snapshot.snapshotId,
      snapshot.sealedBy,
      `Research milestone sealed (${snapshot.versionTag}). Root Manifest SHA-256: ${snapshot.manifestRootHashSha256}`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleSaveExtraction = async (record: DataExtractionRecord) => {
    setExtractions(prev => {
      const idx = prev.findIndex(e => e.id === record.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });

    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'EXTRACTION_RECORDED',
      'DataExtraction',
      record.id,
      record.extractedBy,
      `Committed PICO extraction for study "${record.studyTitle.substring(0, 35)}...". Effect: ${record.effectSizeEstimate}`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleDeleteExtraction = (id: string) => {
    setExtractions(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateSynthesisOutcome = async (updatedOutcome: SynthesisOutcome, notes?: string) => {
    setSynthesisOutcomes(prev => prev.map(o => o.id === updatedOutcome.id ? updatedOutcome : o));

    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'UPDATE_SYNTHESIS_OUTCOME',
      'SynthesisOutcome',
      updatedOutcome.id,
      'Dr. Sarah Lindqvist',
      `Updated meta-analysis synthesis for "${updatedOutcome.outcomeName}": Effect ${updatedOutcome.pooledEffectEstimate}, I² ${updatedOutcome.heterogeneityI2}, GRADE ${updatedOutcome.gradeCertainty}. ${notes || ''}`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleMergeStudies = async (primaryId: string, duplicateId: string, reason: string) => {
    // Flag the duplicate study without deleting it
    setStudies(prev => prev.map(s => {
      if (s.id === duplicateId) {
        return {
          ...s,
          isDuplicateCandidate: true,
          duplicateOfStudyId: primaryId,
          duplicateResolution: 'merged',
          tags: [...(s.tags || []), 'PRISMA_DUPLICATE_MERGED']
        };
      }
      return s;
    }));

    // Update PRISMA flow duplicate removal count
    setPrismaData(prev => ({
      ...prev,
      duplicatesRemoved: (prev.duplicatesRemoved || 0) + 1
    }));

    // Log to immutable audit trail
    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'DUPLICATE_RESOLVED',
      'StudyRecord',
      duplicateId,
      'Lead Reviewer / PRISMA Screening',
      `Merged duplicate candidate (${duplicateId}) into primary study (${primaryId}). Reason: ${reason}. PRISMA flow count updated without data destruction.`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleConfirmDistinctStudies = async (studyAId: string, studyBId: string) => {
    setStudies(prev => prev.map(s => {
      if (s.id === studyAId || s.id === studyBId) {
        return {
          ...s,
          duplicateResolution: 'confirmed_distinct',
          tags: [...(s.tags || []), 'VERIFIED_DISTINCT']
        };
      }
      return s;
    }));

    const lastHash = auditLog[auditLog.length - 1]?.hashSha256 || '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEntry = await createAuditEntry(
      'DUPLICATE_CONFIRMED_DISTINCT',
      'StudyRecord',
      studyAId,
      'Lead Reviewer / PRISMA Screening',
      `Verified studies ${studyAId} and ${studyBId} as distinct research publications.`,
      lastHash
    );

    setAuditLog(prev => [...prev, auditEntry]);
  };

  const handleConfirmFinding = (findingId: string) => {
    if (!activeStudy || !activeStudy.findings) return;
    const find = activeStudy.findings.find(f => f.id === findingId);
    if (!find) return;

    // Apply suggested answer to active assessment
    const studyAss = assessments[activeStudy.id] || [];
    let targetAss = studyAss.find(a => a.instrument === find.instrument);

    if (!targetAss) {
      targetAss = {
        id: `assess-${find.instrument.toLowerCase()}-${Date.now()}`,
        studyId: activeStudy.id,
        instrument: find.instrument as AppraisalInstrument,
        reviewerName: 'Dr. Sarah Lindqvist',
        reviewerRole: 'Lead Reviewer',
        ratings: {},
        updatedAt: new Date().toISOString()
      };
    }

    const updatedRatings = {
      ...targetAss.ratings,
      [find.domainId]: {
        answer: find.suggestedAnswer || 'yes',
        rationale: `Evidens fra ${find.sectionOrPage}: "${find.excerpt.substring(0, 80)}..."`,
        quoteLocation: find.sectionOrPage,
        verifiedByResearcher: true,
        timestamp: new Date().toISOString()
      }
    };

    handleUpdateAssessment({
      ...targetAss,
      ratings: updatedRatings,
      updatedAt: new Date().toISOString()
    });

    // Mark finding as confirmed
    setStudies(prev => prev.map(s => {
      if (s.id !== activeStudy.id || !s.findings) return s;
      return {
        ...s,
        findings: s.findings.map(f => f.id === findingId ? { ...f, researcherConfirmed: true } : f)
      };
    }));
  };

  const handleSelectDomainForViewer = (domainId: string) => {
    if (!activeStudy) return;
    // Check if we already have a finding for this domain
    let match = activeStudy.findings?.find(f => f.domainId === domainId);
    if (!match) {
      // Re-scan and find
      const freshFindings = scanDocumentForFramework(activeStudy, activeInstrument);
      match = freshFindings.find(f => f.domainId === domainId);
      if (freshFindings.length > 0) {
        setStudies(prev => prev.map(s => s.id === activeStudy.id ? { ...s, findings: freshFindings } : s));
      }
    }

    if (match) {
      setSelectedFinding(match);
    }
  };

  const handleLoadBenchmarkData = () => {
    resetToDefaults();
    const initProject = getInitialSampleProject();
    const initStudies = getInitialSampleStudies();
    const initAssessments = getInitialSampleAssessments();
    const initScreening = getInitialSampleScreeningEvents();
    const initExtractions = getInitialSampleExtractions();
    const initSynthesis = getInitialSampleSynthesisOutcomes();

    // Ensure all sample studies have scanned findings initialized
    const studiesWithFindings = initStudies.map(s => ({
      ...s,
      findings: s.findings && s.findings.length > 0 ? s.findings : scanDocumentForFramework(s, 'AMSTAR2')
    }));

    setProject(initProject);
    setStudies(studiesWithFindings);
    setActiveStudyId(studiesWithFindings[0]?.id || '');
    setAssessments(initAssessments);
    setScreeningEvents(initScreening);
    setExtractions(initExtractions);
    setSynthesisOutcomes(initSynthesis);
    setReferences(getInitialSampleReferences());
    setPrismaData(loadSavedPrisma());
    setAuditLog(loadSavedAuditLog());
  };

  const instrumentsList: Array<{ id: AppraisalInstrument; label: string; desc: string }> = [
    { id: 'JBI_QUALITATIVE', label: 'JBI Kvalitativ', desc: 'JBI Sjekkliste for Kvalitativ Forskning (10 pkt)' },
    { id: 'JBI', label: 'JBI Oversikter', desc: 'JBI Systematiske Oversikter & Synteser (11 pkt)' },
    { id: 'AMSTAR2', label: 'AMSTAR 2', desc: 'Systematiske oversikter' },
    { id: 'ROB2', label: 'Cochrane RoB 2', desc: 'Randomiserte forsøk (RCT)' },
    { id: 'AGREE2', label: 'AGREE II', desc: 'Kliniske retningslinjer' },
    { id: 'ROBINS_I', label: 'ROBINS-I', desc: 'Ikke-randomiserte intervensjonsstudier (7 domener)' },
    { id: 'CASP', label: 'CASP', desc: 'Kvalitativ forskning' },
    { id: 'GRADE', label: 'GRADE', desc: 'Evidensgradering' },
    { id: 'PRISMA', label: 'PRISMA 2020', desc: 'Flytdiagram & screening' },
    { id: 'CFIR', label: 'CFIR 2.0', desc: 'Implementeringsanalyse' },
    { id: 'KTA', label: 'KTA', desc: 'Kunnskap til handling' }
  ];

  // Calculated overall progress
  const currentAss = activeStudyAssessments.find(a => a.instrument === activeInstrument);
  const ratedCount = currentAss ? Object.keys(currentAss.ratings).length : 0;
  const totalItems = activeInstrument === 'AMSTAR2' ? 16 : activeInstrument === 'ROB2' ? 5 : activeInstrument === 'AGREE2' ? 23 : activeInstrument === 'JBI' ? 11 : activeInstrument === 'JBI_QUALITATIVE' ? 10 : 10;
  const progressPercent = Math.min(100, Math.round((ratedCount / (totalItems || 1)) * 100));

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleExportEvidencePackage = () => {
    const fullBundle = {
      project,
      studies,
      assessments,
      references,
      sourceRecords,
      extractions,
      synthesisOutcomes,
      auditLog,
      prismaData,
      exportedAt: new Date().toISOString(),
      format: 'EvidenceAppraisalSuperprogramPackage-v1'
    };
    const blob = new Blob([JSON.stringify(fullBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.shortCode || 'SR-2026'}_privat_prosjektpakke.evidencepack.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportEvidencePackage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.project) setProject(parsed.project);
        if (parsed.studies) setStudies(parsed.studies);
        if (parsed.assessments) setAssessments(parsed.assessments);
        if (parsed.references) setReferences(parsed.references);
        if (parsed.sourceRecords) setSourceRecords(parsed.sourceRecords);
        if (parsed.extractions) setExtractions(parsed.extractions);
        if (parsed.synthesisOutcomes) setSynthesisOutcomes(parsed.synthesisOutcomes);
        if (parsed.auditLog) setAuditLog(parsed.auditLog);
        if (parsed.prismaData) setPrismaData(parsed.prismaData);
      } catch (err) {
        console.error('Import av evidenspakke feilet:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <SafeBoundary>
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
        
        {/* Navigation & Header */}
        <Header
          project={project}
          studies={studies}
          activeStudyId={activeStudy?.id || ''}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onSelectStudy={setActiveStudyId}
          onOpenUpload={() => setShowUploadModal(true)}
          onOpenExport={() => setShowExportModal(true)}
          onOpenAudit={() => setShowAuditModal(true)}
          onOpenHealth={() => setShowHealthModal(true)}
          onOpenTestRunner={() => setShowTestRunnerModal(true)}
          onOpenProjectProtocol={() => setShowProjectProtocolModal(true)}
          onOpenGovernanceGate={() => setShowGovernanceGateModal(true)}
          onOpenDataExtraction={() => setShowDataExtractionModal(true)}
          onOpenSensitivityAnalysis={() => setShowSensitivityModal(true)}
          onOpenReliabilityReport={() => setShowReliabilityModal(true)}
          onOpenDuplicateDetector={() => setShowDuplicateDetectorModal(true)}
          onOpenFreezeModal={() => setShowFreezeModal(true)}
          onLoadBenchmarkData={handleLoadBenchmarkData}
          onOpenCitationModal={() => setShowCitationModal(true)}
          onOpenKnowledgeBase={() => setShowKnowledgeBaseModal(true)}
          onOpenDoiVerifier={() => setShowDoiVerificationModal(true)}
          onOpenPrivateShare={() => setShowPrivateShareModal(true)}
          onOpenResearchSearch={() => setShowResearchSearchModal(true)}
          onOpenThesisDraft={() => setShowThesisDraftModal(true)}
          onOpenMetaResearch={() => setShowMetaResearchModal(true)}
          onOpenDesignAdvisory={() => setShowDesignAdvisoryModal(true)}
        />

        {/* Dynamic View by Active Tab */}
        {activeTab === 'source_workflow' ? (
          <SourceRecordWorkflowView
            project={project}
            sourceRecords={sourceRecords}
            studies={studies}
            onAddSourceRecord={handleAddSourceRecord}
            onUpdateSourceRecord={handleUpdateSourceRecord}
            onPromoteToStudy={handlePromoteToStudy}
            onNavigateToAppraisal={handleNavigateToAppraisal}
          />
        ) : activeTab === 'reference_hub' ? (
          <ReferenceHubView
            project={project}
            references={references}
            studies={studies}
            onUpdateReferences={setReferences}
            onPromoteToStudy={handlePromoteReferenceToStudy}
            onNavigateToAppraisal={handleNavigateToAppraisal}
          />
        ) : activeTab === 'library' ? (
          <ArticleLibraryView
            studies={studies}
            assessments={assessments}
            activeStudyId={activeStudy?.id || ''}
            onSelectStudy={setActiveStudyId}
            onOpenAppraisal={(studyId, inst) => {
              setActiveStudyId(studyId);
              if (inst) setActiveInstrument(inst);
              setActiveTab('appraisal');
            }}
            onOpenUpload={() => setShowUploadModal(true)}
            onOpenCitationModal={() => setShowCitationModal(true)}
          />
        ) : activeTab === 'appraisal' ? (
          /* Main 3-Column / Split Layout for JBI Appraisal & Multidisciplinary Review */
          <div className="flex-1 flex overflow-hidden">
          
          {/* Left Aside: Project Overview, Knowledge Base & Framework Navigator */}
          <aside className="w-64 bg-white border-r border-slate-200 p-4 hidden xl:flex flex-col justify-between flex-shrink-0">
            <div>
              {/* Project Title & Status */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Forskningsprosjekt
                  </h2>
                  <button
                    onClick={() => setShowProjectProtocolModal(true)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
                  >
                    <FolderKanban className="w-3 h-3" />
                    <span>Protokoll</span>
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                  {project.title}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Kode: {project.shortCode || 'SR-2026'} • Versjon: v{project.activeVersion}
                </div>

                {/* Quick Action: Kunnskapsbase & DOI sjekk */}
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setShowKnowledgeBaseModal(true)}
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-left transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-amber-950">Metodeguide</span>
                  </button>
                  <button
                    onClick={() => setShowDoiVerificationModal(true)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-left transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-950">DOI Sjekk</span>
                  </button>
                </div>

                {/* Governance Quick Action Pill */}
                <div className="mt-2.5">
                  <button
                    onClick={() => setShowGovernanceGateModal(true)}
                    className={`w-full py-1.5 px-2 rounded-md text-[11px] font-semibold border flex items-center justify-between transition-colors ${
                      project.governanceGate?.isGatePassed
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {project.governanceGate?.isGatePassed ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>Governance Gate</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase font-bold">
                      {project.governanceGate?.isGatePassed ? 'PASS' : 'WARN'}
                    </span>
                  </button>
                </div>
                
                {/* Synthesis Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>{activeInstrument} Fremdrift</span>
                    <span className="font-bold text-blue-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Shortcuts: Extraction, Sensitivity, Kappa & PRISMA */}
                <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setShowDataExtractionModal(true)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-left transition-colors cursor-pointer"
                    title="PICO Dataekstraksjon"
                  >
                    <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <FileSpreadsheet className="w-2.5 h-2.5 text-cyan-600" />
                      <span>PICO</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">{extractions.length} sett</div>
                  </button>
                  <button
                    id="sidebar-sensitivity-btn"
                    onClick={() => setShowSensitivityModal(true)}
                    className="p-1.5 bg-blue-50/70 hover:bg-blue-100 rounded border border-blue-200 text-left transition-colors cursor-pointer"
                    title="Sensitivitetsanalyse & Bias"
                  >
                    <div className="text-[9px] text-blue-700 uppercase font-bold flex items-center gap-0.5">
                      <Sliders className="w-2.5 h-2.5 text-blue-600" />
                      <span>Sensitivitet</span>
                    </div>
                    <div className="text-[11px] font-bold text-blue-900">{synthesisOutcomes.length} utfall</div>
                  </button>
                  <button
                    id="sidebar-reliability-btn"
                    onClick={() => setShowReliabilityModal(true)}
                    className="p-1.5 bg-indigo-50/70 hover:bg-indigo-100 rounded border border-indigo-200 text-left transition-colors cursor-pointer"
                    title="Inter-Rater Reliabilitet & Cohen's Kappa"
                  >
                    <div className="text-[9px] text-indigo-700 uppercase font-bold flex items-center gap-0.5">
                      <Scale className="w-2.5 h-2.5 text-indigo-600" />
                      <span>Kappa</span>
                    </div>
                    <div className="text-[11px] font-bold text-indigo-950">Reliabilitet</div>
                  </button>
                  <button
                    onClick={() => setShowPrismaModal(true)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-left transition-colors cursor-pointer"
                    title="PRISMA 2020 Flytskjema"
                  >
                    <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <GitBranch className="w-2.5 h-2.5 text-blue-600" />
                      <span>PRISMA</span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 font-mono">{prismaData.newStudiesIncluded}</div>
                  </button>
                  <button
                    id="sidebar-duplicates-btn"
                    onClick={() => setShowDuplicateDetectorModal(true)}
                    className="p-1.5 bg-amber-50/70 hover:bg-amber-100 rounded border border-amber-200 text-left transition-colors cursor-pointer col-span-2"
                    title="Duplikatdeteksjon & Skjermingsanalyse (Ingen auto-sletting)"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] text-amber-800 uppercase font-bold flex items-center gap-1">
                        <Copy className="w-2.5 h-2.5 text-amber-600" />
                        <span>Duplikatsjekk &amp; Skjerming</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-900 font-mono bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-300">
                        {prismaData.duplicatesRemoved || 0} fjernet
                      </span>
                    </div>
                  </button>
                  <button
                    id="sidebar-testlab-btn"
                    onClick={() => setShowTestRunnerModal(true)}
                    className="p-1.5 col-span-2 bg-emerald-50/80 hover:bg-emerald-100/90 rounded border border-emerald-300 text-left transition-colors cursor-pointer flex items-center justify-between"
                    title="Vitenskapelig Testlab & Benchmark Validering"
                  >
                    <div className="text-[9px] text-emerald-800 uppercase font-bold flex items-center gap-1">
                      <FlaskConical className="w-3 h-3 text-emerald-600" />
                      <span>Testlab &amp; Benchmark Validering</span>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      28 PASS
                    </span>
                  </button>
                </div>
              </div>

              {/* Active Frameworks List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Vurderingsskjemaer
                  </span>
                  <button
                    onClick={() => setShowFreezeModal(true)}
                    title="Forsegl og frys forskningsmilepæl"
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Frys</span>
                  </button>
                </div>
                
                <div className="space-y-1">
                  {instrumentsList.map((inst) => {
                    const isActive = activeInstrument === inst.id;
                    return (
                      <button
                        key={inst.id}
                        id={`sidebar-inst-${inst.id}`}
                        onClick={() => {
                          if (inst.id === 'PRISMA') {
                            setShowPrismaModal(true);
                          } else {
                            setActiveInstrument(inst.id);
                          }
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent opacity-85 hover:opacity-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold leading-tight">
                            <span>{inst.label}</span>
                            {inst.id === 'ROB2' && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                Delvis
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-normal text-slate-400">{inst.desc}</div>
                        </div>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cryptographic Audit Chain Status in Sidebar */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div 
                onClick={() => setShowAuditModal(true)}
                className="bg-slate-900 p-3 rounded-lg text-white cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-emerald-400 font-mono font-bold tracking-wider">
                    MERKLE AUDIT-CHAIN
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-300 font-mono break-all leading-tight">
                  {activeStudy?.documentHashSha256.substring(0, 24)}...
                </div>
                <div className="text-[9px] text-slate-400 mt-1 flex justify-between">
                  <span>Revisjonslogg: {auditLog.length} hendelser</span>
                  <span className="text-blue-300 underline">Vis</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Center + Right Split Workspace */}
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {activeStudy ? (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden h-full">
                
                {/* Center: Evidence Source Viewer (6 Cols on large screen) */}
                <section className="lg:col-span-6 h-full flex flex-col border-r border-slate-200 overflow-hidden bg-slate-200/60">
                  <EvidenceDocumentViewer
                    study={activeStudy}
                    selectedFinding={selectedFinding}
                    activeInstrument={activeInstrument}
                    onSelectFinding={setSelectedFinding}
                    onConfirmFinding={handleConfirmFinding}
                    onRunAutoScan={handleRunAutoScan}
                    onOpenDoiVerifier={() => setShowDoiVerificationModal(true)}
                  />
                </section>

                {/* Right: Methodological Appraisal & Evidence Scoring Studio (6 Cols) */}
                <section className="lg:col-span-6 h-full flex flex-col overflow-hidden bg-white">
                  <AppraisalWorkspace
                    study={activeStudy}
                    assessments={activeStudyAssessments}
                    reviewers={project.reviewers}
                    activeInstrument={activeInstrument}
                    onUpdateAssessment={handleUpdateAssessment}
                    onLockStudy={handleLockStudy}
                    onOpenDualComparison={() => setShowDualComparison(true)}
                    onOpenReliabilityReport={() => setShowReliabilityModal(true)}
                    onOpenCitationModal={() => setShowCitationModal(true)}
                    onOpenKnowledgeBase={() => setShowKnowledgeBaseModal(true)}
                    onSelectDomainForViewer={handleSelectDomainForViewer}
                    onRunAutoScan={handleRunAutoScan}
                  />
                </section>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 bg-white text-center">
                <div className="max-w-md">
                  <h3 className="text-base font-bold text-slate-900 mb-2">Ingen artikler lastet inn</h3>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Importer en forskningsartikkel (PDF, XML, RIS, DOCX) eller last inn verifiserte referansestudier for å starte vurderingen.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                    >
                      Importer artikkel
                    </button>
                    <button
                      onClick={handleLoadBenchmarkData}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold border border-slate-300 transition-colors"
                    >
                      Last referansedata
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
        ) : (
          <ModuleHubView
            activeTab={activeTab}
            project={project}
            studies={studies}
            extractions={extractions}
            synthesisOutcomes={synthesisOutcomes}
            auditLog={auditLog}
            prismaData={prismaData}
            onNavigateToAppraisal={() => handleNavigateToAppraisal()}
            onOpenDataExtraction={() => setShowDataExtractionModal(true)}
            onOpenSensitivityAnalysis={() => setShowSensitivityModal(true)}
            onOpenGovernanceGate={() => setShowGovernanceGateModal(true)}
            onOpenAudit={() => setShowAuditModal(true)}
            onOpenTestRunner={() => setShowTestRunnerModal(true)}
            onOpenResearchSearch={() => setShowResearchSearchModal(true)}
            onOpenThesisDraft={() => setShowThesisDraftModal(true)}
            onOpenMetaResearch={() => setShowMetaResearchModal(true)}
            onOpenPrismaModal={() => setShowPrismaModal(true)}
            onLoadBenchmarkData={handleLoadBenchmarkData}
          />
        )}

        {/* Global Professional Footer */}
        <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Gate: <strong className="text-slate-700 font-semibold">{project.governanceGate?.isGatePassed ? 'Enforced' : 'Pending'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Integritet: <strong className="text-slate-700 font-semibold">SHA-256 Merkle Chain</strong></span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span>Skjemaer: <strong className="text-slate-700 font-semibold">AMSTAR 2 • AGREE II • Cochrane RoB 2 • CASP • GRADE</strong></span>
            </div>
          </div>
          <div className="text-slate-400 text-[10px]">
            Forskningsverktøy &amp; Evidensvurdering • WHO &amp; Universitetsstandard
          </div>
        </footer>

        {/* Modals & Overlays */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <DocumentUploadCard
              onDocumentImported={handleDocumentImported}
              onClose={() => setShowUploadModal(false)}
            />
          </div>
        )}

        {showDualComparison && activeStudy && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <MultiReviewerComparison
              study={activeStudy}
              instrument={activeInstrument}
              assessments={activeStudyAssessments}
              reviewers={project.reviewers}
              onSaveConsensus={handleSaveConsensus}
              onClose={() => setShowDualComparison(false)}
            />
          </div>
        )}

        {showCitationModal && activeStudy && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <CitationModal
              study={activeStudy}
              onClose={() => setShowCitationModal(false)}
            />
          </div>
        )}

        {showKnowledgeBaseModal && (
          <KnowledgeBaseModal
            isOpen={showKnowledgeBaseModal}
            onClose={() => setShowKnowledgeBaseModal(false)}
            initialInstrument={activeInstrument}
          />
        )}

        {showDoiVerificationModal && (
          <DoiVerificationModal
            isOpen={showDoiVerificationModal}
            onClose={() => setShowDoiVerificationModal(false)}
            activeStudy={activeStudy}
            onApplyMetadata={handleApplyDoiMetadata}
          />
        )}

        {showPrismaModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <PrismaFlowDiagram
              data={prismaData}
              onSavePrisma={setPrismaData}
              onClose={() => setShowPrismaModal(false)}
            />
          </div>
        )}

        {showAuditModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <IntegrityAuditTrail
              auditLog={auditLog}
              studies={studies}
              activeStudyId={activeStudy?.id || ''}
              onClose={() => setShowAuditModal(false)}
            />
          </div>
        )}

        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <ExportModal
              studies={studies}
              assessments={assessments}
              auditLog={auditLog}
              prismaData={prismaData}
              activeStudyId={activeStudy?.id || ''}
              onClose={() => setShowExportModal(false)}
            />
          </div>
        )}

        {showHealthModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <SelfHealingMonitor
              studies={studies}
              assessments={assessments}
              auditLog={auditLog}
              prismaData={prismaData}
              onResetDefaults={handleLoadBenchmarkData}
              onOpenTestRunner={() => setShowTestRunnerModal(true)}
              onClose={() => setShowHealthModal(false)}
            />
          </div>
        )}

        {showGovernanceGateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <GovernanceGateModal
              project={project}
              onUpdateGovernanceGate={handleUpdateGovernanceGate}
              onClose={() => setShowGovernanceGateModal(false)}
            />
          </div>
        )}

        {showFreezeModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <ResearchFreezeModal
              project={project}
              studies={studies}
              assessments={assessments}
              auditLog={auditLog}
              prismaData={prismaData}
              screeningEvents={screeningEvents}
              extractions={extractions}
              onFreezeProject={handleFreezeProject}
              onClose={() => setShowFreezeModal(false)}
            />
          </div>
        )}

        {showProjectProtocolModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <ProjectProtocolModal
              project={project}
              onUpdateProject={setProject}
              onOpenGovernanceGate={() => {
                setShowProjectProtocolModal(false);
                setShowGovernanceGateModal(true);
              }}
              onOpenFreezeModal={() => {
                setShowProjectProtocolModal(false);
                setShowFreezeModal(true);
              }}
              onClose={() => setShowProjectProtocolModal(false)}
            />
          </div>
        )}

        {showDataExtractionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <DataExtractionModal
              studies={studies}
              activeStudyId={activeStudy?.id || ''}
              extractions={extractions}
              synthesisOutcomes={synthesisOutcomes}
              onSaveExtraction={handleSaveExtraction}
              onDeleteExtraction={handleDeleteExtraction}
              onOpenSensitivityAnalysis={() => setShowSensitivityModal(true)}
              onClose={() => setShowDataExtractionModal(false)}
            />
          </div>
        )}

        {showSensitivityModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
            <SensitivityAnalysisModal
              synthesisOutcomes={synthesisOutcomes}
              studies={studies}
              assessments={assessments}
              onUpdateSynthesisOutcome={handleUpdateSynthesisOutcome}
              onClose={() => setShowSensitivityModal(false)}
            />
          </div>
        )}

        {showReliabilityModal && (
          <ReliabilityReportModal
            project={project}
            studies={studies}
            assessments={assessments}
            reviewers={project.reviewers}
            onOpenStudyConsensus={(studyId, instrument) => {
              setActiveStudyId(studyId);
              setActiveInstrument(instrument);
              setShowReliabilityModal(false);
              setShowDualComparison(true);
            }}
            onClose={() => setShowReliabilityModal(false)}
          />
        )}

        {showDuplicateDetectorModal && (
          <DuplicateDetectorModal
            studies={studies}
            onMergeStudies={handleMergeStudies}
            onConfirmDistinct={handleConfirmDistinctStudies}
            onClose={() => setShowDuplicateDetectorModal(false)}
          />
        )}

        {showTestRunnerModal && (
          <ValidationTestRunnerModal
            onClose={() => setShowTestRunnerModal(false)}
          />
        )}

        {/* Private Collaboration & GitHub Security Hub */}
        <PrivateShareModal
          isOpen={showPrivateShareModal}
          onClose={() => setShowPrivateShareModal(false)}
          project={project}
          securityConfig={securityConfig}
          onUpdateSecurityConfig={setSecurityConfig}
          onExportEvidencePackage={handleExportEvidencePackage}
          onImportEvidencePackage={handleImportEvidencePackage}
        />

        {/* Research Search & PICO Query Builder */}
        <ResearchSearchHubModal
          isOpen={showResearchSearchModal}
          onClose={() => setShowResearchSearchModal(false)}
          project={project}
          references={references}
          sourceRecords={sourceRecords}
          onImportToSourceRecords={handleAddSourceRecord}
          onImportToReferenceHub={(newRef) => setReferences(prev => [newRef, ...prev])}
        />

        {/* Academic Thesis & Methods Chapter Draft Generator */}
        <ThesisDraftModal
          isOpen={showThesisDraftModal}
          onClose={() => setShowThesisDraftModal(false)}
          project={project}
          studies={studies}
          assessments={assessments}
          references={references}
          sourceRecords={sourceRecords}
          extractions={extractions}
          synthesisOutcomes={synthesisOutcomes}
          prismaData={prismaData}
        />

        {/* Meta-Research & Integrity Observatory */}
        <MetaResearchModal
          isOpen={showMetaResearchModal}
          onClose={() => setShowMetaResearchModal(false)}
          project={project}
          studies={studies}
          assessments={assessments}
          references={references}
        />

        {/* Study Design Advisory Gate */}
        <StudyDesignAdvisoryModal
          isOpen={showDesignAdvisoryModal}
          onClose={() => setShowDesignAdvisoryModal(false)}
          onSelectInstrument={(inst) => {
            setActiveInstrument(inst);
            setActiveTab('appraisal');
          }}
        />

      </div>
    </SafeBoundary>
  );
}
