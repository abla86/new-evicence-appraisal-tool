export type AppraisalInstrument = 
  | 'AMSTAR2' 
  | 'CASP' 
  | 'AGREE2' 
  | 'GRADE' 
  | 'ROB2' 
  | 'CFIR' 
  | 'KTA' 
  | 'PRISMA'
  | 'JBI'
  | 'JBI_QUALITATIVE'
  | 'ROBINS_I';

export type ActiveTab = 
  | 'appraisal'          // JBI Qualitative & multi-framework appraisal workspace
  | 'source_workflow'    // SourceRecord Workflow: Ingestion, proveniens, screening & overgang til JBI
  | 'reference_hub'       // Unified Reference Hub: EndNote, Zotero, Mendeley, Paperpile, Citavi synthesis
  | 'library'            // Artikkelbibliotek & oversikt over studier
  | 'synthesis'          // Syntese, PICO dataekstraksjon & meta-utfall
  | 'governance_audit'   // Personvern, Data Governance Gate & Merkle Audit Trail
  | 'validation_lab'     // Vitenskapelig testlab & metodisk kontroll
  | 'research_search'    // Forskningssøk: PubMed, Europe PMC, OpenAlex, PICO-builder
  | 'thesis_output'      // Oppgaveskriving, metodekapittel & referanselister
  | 'meta_research';     // Forsk på forskning, integritetsanalyse & metodiske mønstre

export type ReferenceItemType = 
  | 'journalArticle'
  | 'book'
  | 'bookSection'
  | 'statute'
  | 'regulation'
  | 'thesis'
  | 'conferencePaper'
  | 'report'
  | 'webpage';

export type CitationStyle = 
  | 'APA7' 
  | 'Vancouver' 
  | 'Harvard' 
  | 'Chicago' 
  | 'MLA' 
  | 'IEEE' 
  | 'NorwegianLaw';

export interface ReferenceAuthor {
  family: string;
  given?: string;
  affiliation?: string;
}

export interface ReferenceDirectQuote {
  id: string;
  text: string;
  page: string;
  category?: string;
  tags: string[];
  comment?: string;
  linkedPicoOutcome?: string;
  createdAt: string;
}

export interface ReferenceThoughtMemo {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  createdAt: string;
}

export interface ReferenceMergeEvent {
  id: string;
  mergedAt: string;
  mergedFromId: string;
  mergedFromTitle: string;
  user: string;
  reason: string;
}

export interface ReferenceItem {
  id: string;
  projectId?: string;
  title: string;
  authors: ReferenceAuthor[];
  year?: string;
  publicationDate?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  isbn?: string;
  issn?: string;
  url?: string;
  abstract?: string;
  itemType: ReferenceItemType;
  publisher?: string;
  place?: string;
  status: 'VALIDATED' | 'VALIDATION_REQUIRED' | 'RETRACTED';
  validationIssues?: string[];
  retractionAlert?: {
    isRetracted: boolean;
    reason?: string;
    noticeUrl?: string;
    date?: string;
  };
  collections: string[]; // Mapper som EndNote Groups / Zotero Collections / Mendeley Folders
  tags: string[];
  categories: string[]; // Citavi emner/kategorier for prosjektstruktur
  directQuotes: ReferenceDirectQuote[]; // Citavi sitatpassasjer
  thoughtMemos: ReferenceThoughtMemo[]; // Citavi tanker/notater
  mergeHistory?: ReferenceMergeEvent[]; // Paperpile flettehistorikk
  provenanceHashSha256: string;
  linkedStudyId?: string; // Direkte kobling til JBI Kvalitativ studie
  linkedSourceRecordId?: string;
  cwywToken: string; // EndNote Cite While You Write token, f.eks. {Hansen, 2024 #101}
  inTextCitation: string; // F.eks. (Hansen & Berg, 2024)
  pdfAvailable?: boolean;
  pdfFileName?: string;
  notes?: string;
  importedAt: string;
  updatedAt: string;
}

export interface SourceRecord {
  id: string;
  projectId: string;
  sourceOrigin: 'PubMed' | 'Embase' | 'Web of Science' | 'Cochrane Library' | 'Lovdata' | 'CrossRef' | 'Manual Import' | 'Browser Extension';
  sourceId?: string; // e.g. PMID, DOI, Lovdata ID
  title: string;
  authors: string[];
  year?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  publicationType?: string;
  language?: string;
  screeningStatus: 'UNSCREENED' | 'TITLE_ABSTRACT_ACCEPTED' | 'TITLE_ABSTRACT_REJECTED' | 'FULL_TEXT_PENDING' | 'ELIGIBLE_INCLUDED' | 'EXCLUDED';
  exclusionReason?: string;
  provenanceHashSha256: string;
  importedAt: string;
  linkedStudyId?: string;
  assignedReviewer?: string;
  notes?: string;
  tags?: string[];
  pdfAvailable?: boolean;
}

export type RatingAnswer = 
  | '1' 
  | '2' 
  | '3' 
  | '4' 
  | '5' 
  | '6' 
  | '7' 
  | 'yes' 
  | 'no' 
  | 'partial' 
  | 'unclear' 
  | 'not_applicable' 
  | 'low' 
  | 'some_concerns' 
  | 'high'
  | 'ja'
  | 'delvis'
  | 'nei';

export interface ResearchProject {
  id: string; // e.g. PROJ-2026-SR-01
  title: string;
  shortCode: string;
  leadInvestigator: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
  status: 'Drafting Protocol' | 'Screening & Extraction' | 'Dual Appraisal Phase' | 'Consensus Harmonization' | 'Research Sealed & Frozen';
  activeVersion: string;
  protocol: ResearchProtocol;
  governanceGate: DataGovernanceGate;
  reviewers: ReviewerProfile[];
  snapshots: ResearchFreezeSnapshot[];
}

export interface ReviewerProfile {
  id: string;
  name: string;
  role: 'Lead Reviewer' | 'Independent Reviewer' | 'Consensus Arbiter' | 'Methodology Auditor' | 'Clinical Specialist' | 'Biostatistician' | 'PhD Research Fellow' | 'External Peer Reviewer';
  email: string;
  affiliation: string;
  isBlinded: boolean;
  avatarColor?: string;
}

export interface ResearchProtocol {
  projectId: string;
  registrationNumber: string; // e.g. PROSPERO CRD42026889211
  registrationStatus: 'Registered' | 'Published' | 'Pending Institutional Review';
  researchQuestion: string;
  pico: PICOData;
  eligibilityCriteria: {
    inclusion: string[];
    exclusion: string[];
  };
  searchStrategy: {
    databases: string[];
    searchTerms: string;
    dateRange: string;
    languageRestrictions: string;
  };
  synthesisApproach: 'Random-Effects Meta-Analysis' | 'Narrative Synthesis' | 'Qualitative Comparative Analysis';
  discrepancyProtocol: string;
}

export interface PICOData {
  population: string;
  intervention: string;
  comparator: string;
  outcomes: string;
  studyDesigns: string[];
}

export interface DataGovernanceGate {
  projectId: string;
  verifiedBy: string;
  verifiedAt: string;
  containsIdentifiablePersonalData: boolean;
  containsHealthData: boolean;
  hasDirectIdentifiers: boolean;
  hasIndirectIdentifiers: boolean;
  legalBasisRegistered: boolean;
  legalBasisNotes: string; // e.g. Helseforskningsloven §§ 5-7 / GDPR Art. 6(1)(e) & 9(2)(j)
  rekEthicsStatus: 'REK Pre-Approval Registered' | 'Exempt / Open Access Scientific Publications' | 'Institutional Review Board Verified' | 'Not Applicable';
  rekReferenceNumber?: string;
  dataMinimizationFulfilled: boolean;
  storageLocationApproved: boolean;
  storageLocationName: string;
  retentionPolicy: string;
  isGatePassed: boolean;
}

export interface ScreeningEvent {
  id: string;
  projectId: string;
  studyId: string;
  studyTitle: string;
  previousStage: 'Database Retrieval' | 'Title/Abstract' | 'Full-Text Retrieval' | 'Eligibility';
  newStage: 'Title/Abstract' | 'Full-Text Retrieval' | 'Eligibility' | 'Included' | 'Excluded';
  decision: 'INCLUDED' | 'EXCLUDED' | 'PENDING_DUAL_REVIEW';
  exclusionReason?: string;
  reviewer: string;
  timestamp: string;
  documentHashSha256?: string;
}

export interface DataExtractionRecord {
  id: string;
  projectId: string;
  studyId: string;
  studyTitle: string;
  sampleSize: number;
  populationCharacteristics: string;
  interventionDetails: string;
  comparatorDetails: string;
  primaryOutcomeMeasure: string;
  primaryOutcomeValue: string;
  effectSizeEstimate: string; // e.g. MD -0.48 (95% CI -0.61 to -0.35)
  adverseEvents: string;
  fundingAndCoi: string;
  extractedBy: string;
  verifiedByResearcher: boolean;
  evidencePageRef: string;
  rawQuote: string;
  timestamp: string;
}

export interface SynthesisOutcome {
  id: string;
  projectId: string;
  outcomeName: string;
  picoOutcomeCategory: string;
  includedStudiesCount: number;
  totalParticipants: number;
  pooledEffectEstimate: string;
  heterogeneityI2: string;
  gradeCertainty: 'High' | 'Moderate' | 'Low' | 'Very Low';
  evidenceTraceLineage: {
    studyId: string;
    studyTitle: string;
    extractionId: string;
    documentHashSha256: string;
    page: string;
    quote: string;
  }[];
  effectMetric?: 'MD' | 'SMD' | 'HR' | 'RR' | 'OR';
  tau2?: number;
  cochranQ?: number;
  heterogeneityPValue?: number;
  eggersPValue?: number;
  eggersIntercept?: number;
  funnelAsymmetry?: string;
  biasRiskProfile?: 'Low' | 'Moderate' | 'High';
  sensitivityScenario?: string;
  activeStudyIds?: string[];
  excludedStudyIds?: string[];
  lastSensitivityTimestamp?: string;
}

export interface ResearchFreezeSnapshot {
  snapshotId: string;
  versionTag: string; // e.g. V1.0-FINAL-SEAL
  timestamp: string;
  sealedBy: string;
  protocolHashSha256: string;
  methodologyHashSha256: string;
  manifestRootHashSha256: string;
  totalStudiesSealed: number;
  status: 'IMMUTABLE_LOCKED' | 'ARCHIVED';
  notes: string;
}

export interface StudyRecord {
  id: string;
  projectId?: string;
  title: string;
  authors: string;
  year?: string;
  journal?: string;
  doi?: string;
  abstract?: string;
  documentType: 
    | 'Systematic Review / Meta-Analysis' 
    | 'Cochrane Systematic Review' 
    | 'Randomized Controlled Trial' 
    | 'Observational Cohort' 
    | 'Clinical Practice Guideline' 
    | 'Qualitative Research' 
    | 'Qualitative Systematic Review' 
    | 'Qualitative Empirical Study' 
    | 'Diagnostic Accuracy Study'
    | 'Case Report'
    | 'Quality Improvement Study'
    | 'Non-randomised Intervention'
    | 'General Research Document'
    | 'Unspecified / Unknown';
  fileName: string;
  fileSizeBytes: number;
  fileExtension: string;
  rawContent: string;
  documentHashSha256: string;
  importedAt: string;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  finalHash?: string;
  tags?: string[];
  sourceRefId?: string;
  findings?: DocumentAnalysisFinding[];
  extraction?: DataExtractionRecord;
  imradAnalysis?: IMRaDAnalysisResult;
  classificationVerifiedByResearcher?: boolean;
  evidenceVerified?: boolean;
}

export interface DocumentAnalysisFinding {
  id: string;
  instrument: string;
  domainId: string;
  topic: string;
  sectionOrPage: string;
  matchedTerm: string;
  excerpt: string;
  confidence: 'High' | 'Medium' | 'Low';
  suggestedAnswer?: RatingAnswer;
  researcherConfirmed?: boolean;
}

export interface AppraisalDomain {
  id: string;
  number: number;
  title: string;
  question: string;
  description: string;
  isCritical?: boolean; // For AMSTAR 2 critical flaws
  category?: string;
  allowedAnswers: RatingAnswer[];
  helpNotes?: string;
  guidanceCriteria?: string[];
}

export interface DomainRating {
  answer: RatingAnswer;
  rationale: string;
  quoteLocation?: string;
  verifiedByResearcher: boolean;
  timestamp: string;
}

export interface AppraisalAssessment {
  id: string;
  projectId?: string;
  studyId: string;
  instrument: AppraisalInstrument;
  reviewerId?: string;
  reviewerName: string;
  reviewerRole: string;
  ratings: Record<string, DomainRating>; // key is domainId
  overallScore?: number;
  overallConfidence?: 'High' | 'Moderate' | 'Low' | 'Critically Low';
  summaryNotes?: string;
  updatedAt: string;
  isConsensus?: boolean;
}

export interface DiscrepancyItem {
  domainId: string;
  domainName: string;
  isCritical?: boolean;
  reviewerAAnswer: RatingAnswer;
  reviewerBAnswer: RatingAnswer;
  resolvedAnswer?: RatingAnswer;
  resolutionNote?: string;
  isResolved: boolean;
}

export interface InterRaterComparison {
  reviewerA: AppraisalAssessment;
  reviewerB: AppraisalAssessment;
  totalDomains: number;
  agreedDomains: number;
  agreementPercentage: number;
  cohensKappa: number;
  kappaInterpretation: 'Poor' | 'Slight' | 'Fair' | 'Moderate' | 'Substantial' | 'Almost Perfect';
  discrepancies: DiscrepancyItem[];
}

export interface MultiRaterDomainRow {
  domainId: string;
  domainNumber: number;
  domainTitle: string;
  isCritical?: boolean;
  ratingsByReviewer: Record<string, {
    reviewerId: string;
    reviewerName: string;
    answer: RatingAnswer;
    rationale?: string;
    verifiedByResearcher?: boolean;
    quoteLocation?: string;
  }>;
  distribution: Record<string, number>; // e.g. { yes: 4, no: 1, partial: 1 }
  status: 'unanimous' | 'majority' | 'split';
  majorityAnswer?: RatingAnswer;
  majorityPercentage: number;
  resolvedAnswer?: RatingAnswer;
  resolutionNote?: string;
  isResolved: boolean;
}

export interface PairwiseAgreement {
  reviewer1Id: string;
  reviewer1Name: string;
  reviewer2Id: string;
  reviewer2Name: string;
  kappa: number;
  agreementPercentage: number;
  interpretation: string;
}

export interface PairwiseReliabilityDetail {
  reviewerAId: string;
  reviewerAName: string;
  reviewerBId: string;
  reviewerBName: string;
  cohensKappa: number;
  observedAgreement: number; // percentage (0-100)
  expectedAgreement: number; // percentage (0-100)
  standardError: number;
  ci95Lower: number;
  ci95Upper: number;
  zScore: number;
  pValue: number;
  pabak: number;
  kappaInterpretation: 'Poor' | 'Slight' | 'Fair' | 'Moderate' | 'Substantial' | 'Almost Perfect';
  agreedDomainsCount: number;
  totalDomainsCount: number;
}

export interface StudyReliabilityRecord {
  studyId: string;
  studyTitle: string;
  studyYear: string;
  studyAuthors: string;
  instrument: AppraisalInstrument;
  totalReviewers: number;
  reviewerNames: string[];
  assessmentIds: string[];
  totalDomains: number;
  agreedDomains: number;
  observedAgreement: number; // 0 - 100%
  expectedAgreement: number; // 0 - 100%
  cohensKappa: number; // primary or average pairwise Cohen's Kappa
  kappaInterpretation: 'Poor' | 'Slight' | 'Fair' | 'Moderate' | 'Substantial' | 'Almost Perfect';
  standardError: number;
  ci95Lower: number;
  ci95Upper: number;
  zScore: number;
  pValue: number;
  pabak: number; // Prevalence and Bias Adjusted Kappa
  fleissKappa?: number;
  hasConsensus: boolean;
  discrepanciesCount: number;
  criticalDiscrepanciesCount: number;
  resolvedDiscrepanciesCount: number;
  pairwiseComparisons: PairwiseReliabilityDetail[];
  domainDetails: {
    domainId: string;
    domainNumber: number;
    domainTitle: string;
    isCritical?: boolean;
    ratings: Record<string, RatingAnswer>;
    rationales: Record<string, string>;
    isAgreed: boolean;
    consensusAnswer?: RatingAnswer;
  }[];
}

export interface ProjectReliabilitySummary {
  totalStudiesWithMultipleReviewers: number;
  totalStudiesInProject: number;
  multiReviewerCoveragePercentage: number;
  totalPairedDomainEvaluations: number;
  pooledCohensKappa: number;
  meanStudyKappa: number;
  meanObservedAgreement: number;
  pooledInterpretation: 'Poor' | 'Slight' | 'Fair' | 'Moderate' | 'Substantial' | 'Almost Perfect';
  tierDistribution: {
    almostPerfect: number; // κ > 0.80
    substantial: number;   // 0.60 < κ ≤ 0.80
    moderate: number;      // 0.40 < κ ≤ 0.60
    fair: number;          // 0.20 < κ ≤ 0.40
    slight: number;        // 0.0 < κ ≤ 0.20
    poor: number;          // κ ≤ 0.0
  };
  totalDiscrepancies: number;
  criticalDiscrepancies: number;
  resolvedDiscrepancies: number;
  resolutionRatePercentage: number;
  studies: StudyReliabilityRecord[];
}

export interface MultiRaterComparison {
  reviewers: ReviewerProfile[];
  assessments: AppraisalAssessment[];
  totalDomains: number;
  unanimousCount: number;
  majorityCount: number;
  splitCount: number;
  unanimityPercentage: number;
  fleissKappa: number;
  fleissInterpretation: 'Poor' | 'Slight' | 'Fair' | 'Moderate' | 'Substantial' | 'Almost Perfect';
  pairwiseMatrix: PairwiseAgreement[];
  domainRows: MultiRaterDomainRow[];
}

export interface PrismaFlowData {
  projectId?: string;
  // Identification
  databasesSearched: string;
  recordsIdentifiedDatabases: number;
  recordsIdentifiedRegisters: number;
  recordsIdentifiedOther: number;
  duplicatesRemoved: number;
  // Screening
  recordsScreened: number;
  recordsExcludedScreening: number;
  exclusionReasonsScreening: Record<string, number>;
  // Eligibility
  reportsSoughtForRetrieval: number;
  reportsNotRetrieved: number;
  reportsAssessedForEligibility: number;
  reportsExcludedEligibility: number;
  exclusionReasonsEligibility: Record<string, number>;
  // Included
  newStudiesIncluded: number;
  totalStudiesIncluded: number;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  projectId?: string;
  timestamp: string;
  action: 'IMPORT_DOCUMENT' | 'PERFORM_APPRAISAL' | 'RESOLVE_DISCREPANCY' | 'LOCK_STUDY' | 'INTEGRITY_VERIFIED' | 'EXPORT_DATA' | 'TAMPER_DETECTED' | 'ROLLBACK_STATE' | 'GOVERNANCE_GATE_VERIFIED' | 'RESEARCH_FREEZE_SEALED' | 'EXTRACTION_RECORDED' | 'UPDATE_SYNTHESIS_OUTCOME' | 'DUPLICATE_RESOLVED' | 'DUPLICATE_CONFIRMED_DISTINCT';
  entityType: 'StudyRecord' | 'AppraisalAssessment' | 'ConsensusReport' | 'AuditChain' | 'ResearchProtocol' | 'DataGovernanceGate' | 'DataExtraction' | 'ResearchFreeze' | 'SynthesisOutcome';
  entityId: string;
  user: string;
  details: string;
  hashSha256: string;
  previousHashSha256: string;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'degraded';
  memoryState: 'optimal' | 'moderate' | 'high';
  storageAvailable: boolean;
  autoSaveHealthy: boolean;
  auditChainIntegrity: boolean;
  activeStudiesCount: number;
  lastBackupTime: string;
}

export type UserRole = 
  | 'Lead Reviewer'
  | 'Independent Reviewer'
  | 'Second Reviewer'
  | 'Consensus Arbiter'
  | 'Methodology Auditor'
  | 'Adjudicator'
  | 'Researcher'
  | 'Read-only';

export interface WorkspaceSecurityConfig {
  isLocked: boolean;
  hasPasscode: boolean;
  passcodeHint?: string;
  activeRole: UserRole;
  activeUserName: string;
  projectSecretToken: string;
  allowedCollaboratorEmails: string[];
  sharingMode: 'private_repo' | 'link_with_passcode' | 'offline_bundle';
  githubRepoUrl?: string;
  githubRepoVisibility: 'private' | 'internal' | 'public';
}

export interface ResearchSearchResult {
  id: string;
  database: 'PubMed' | 'Europe PMC' | 'OpenAlex' | 'CrossRef';
  title: string;
  authors: string[];
  year: string;
  journal: string;
  doi?: string;
  pmid?: string;
  abstract: string;
  studyDesignSuggested?: string;
  alreadyInLibrary: boolean;
  alreadyInSourceRecords: boolean;
  imported: boolean;
}

export interface SavedSearchStrategy {
  id: string;
  name: string;
  database: string;
  query: string;
  hitsCount: number;
  executedAt: string;
  picoContext?: {
    population: string;
    intervention: string;
    comparator: string;
    outcome: string;
  };
}

export interface StudyDesignRecommendation {
  detectedDesign: string;
  confidence: 'High' | 'Medium' | 'Low';
  recommendedInstrument: AppraisalInstrument;
  instrumentFullName: string;
  rationale: string;
  alternativeInstruments: AppraisalInstrument[];
  reportingChecklist?: 'PRISMA' | 'CONSORT' | 'STROBE' | 'COREQ' | 'SRQR';
}

export interface ThesisDraftSection {
  id: string;
  title: string;
  content: string;
  sourceTokens: string[];
  isLocked: boolean;
  updatedAt: string;
}

// ===========================================================================
// IMRaD STRUCTURAL REPORTING ARCHITECTURE
// Standardized structural layer: Introduction, Methods, Results, Discussion
// ===========================================================================

export type IMRaDSectionKey =
  | 'introduction'
  | 'methods'
  | 'results'
  | 'discussion';

export type IMRaDSectionStatus =
  | 'DETECTED'
  | 'INFERRED'
  | 'MISSING'
  | 'OCR_REQUIRED';

export interface IMRaDSectionAnalysis {
  key: IMRaDSectionKey;
  label: string;
  detected: boolean;
  explicitHeading: boolean;
  confidence: number; // 0 to 1
  characterCount: number;
  wordCount: number;
  evidencePreview: string;
  status: IMRaDSectionStatus;
  detectedHeading?: string;
  subsections?: string[];
}

export interface IMRaDAnalysisResult {
  fileName: string;
  standard: 'IMRaD';
  standardDescription: string;
  analyzedAt: string;
  complete: boolean;
  explicitComplete: boolean;
  detectedSectionCount: number;
  explicitHeadingCount: number;
  confidence: number; // 0 to 1
  sections: IMRaDSectionAnalysis[];
  missingSections: string[];
  limitations: string[];
  methodologicalNotice: string;
  expectedStructureRationale?: string;
  recommendedReportingStandard?: 'CONSORT' | 'PRISMA' | 'STROBE' | 'COREQ' | 'SRQR' | 'STARD' | 'CARE' | 'SQUIRE' | 'RIGHT' | 'General';
  isOcrRequired?: boolean;
}

export type RetractionIntegrityStatus = 
  | 'Clean / Verified Active'
  | 'Retracted'
  | 'Expression of Concern'
  | 'Correction Published'
  | 'Updated'
  | 'Unknown / Unverified'
  | 'Not Found';


