import type { 
  AppraisalAssessment, 
  AuditLogEntry, 
  DataExtractionRecord, 
  PrismaFlowData, 
  ReferenceItem,
  ResearchProject, 
  ScreeningEvent, 
  SourceRecord,
  StudyRecord, 
  SynthesisOutcome 
} from '../types/index.ts';
import { calculateSha256, calculateSha256Sync } from './crypto.ts';

const STORAGE_KEYS = {
  PROJECT: 'evidence_appraisal_project_v3',
  STUDIES: 'evidence_appraisal_studies_v3',
  ASSESSMENTS: 'evidence_appraisal_assessments_v3',
  PRISMA: 'evidence_appraisal_prisma_v3',
  AUDIT: 'evidence_appraisal_audit_v3',
  SCREENING_EVENTS: 'evidence_appraisal_screening_events_v3',
  EXTRACTIONS: 'evidence_appraisal_extractions_v3',
  SYNTHESIS: 'evidence_appraisal_synthesis_v3',
  ACTIVE_STUDY_ID: 'evidence_appraisal_active_study_id_v3',
  SOURCE_RECORDS: 'evidence_appraisal_source_records_v3',
  REFERENCES: 'evidence_appraisal_references_v3'
};

// In-memory crash resilience fallback cache
let memoryProjectCache: ResearchProject | null = null;
let memoryStudiesCache: StudyRecord[] | null = null;
let memoryAssessmentsCache: Record<string, AppraisalAssessment[]> | null = null;

export function loadSavedProject(): ResearchProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        memoryProjectCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read project from localStorage', err);
    if (memoryProjectCache) return memoryProjectCache;
  }
  return getInitialSampleProject();
}

export function saveProject(project: ResearchProject): boolean {
  memoryProjectCache = project;
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
    return true;
  } catch (err) {
    console.warn('LocalStorage save project failed', err);
    return false;
  }
}

export function loadSavedStudies(): StudyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDIES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryStudiesCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read studies from localStorage, checking memory cache', err);
    if (memoryStudiesCache) return memoryStudiesCache;
  }
  return getInitialSampleStudies();
}

export function saveStudies(studies: StudyRecord[]): boolean {
  memoryStudiesCache = studies;
  try {
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(studies));
    return true;
  } catch (err) {
    console.warn('LocalStorage save failed, persisted in memory', err);
    return false;
  }
}

export function loadSavedAssessments(): Record<string, AppraisalAssessment[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        memoryAssessmentsCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read assessments from localStorage', err);
    if (memoryAssessmentsCache) return memoryAssessmentsCache;
  }
  return getInitialSampleAssessments();
}

export function saveAssessments(assessments: Record<string, AppraisalAssessment[]>): boolean {
  memoryAssessmentsCache = assessments;
  try {
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
    return true;
  } catch (err) {
    console.warn('LocalStorage save assessments failed', err);
    return false;
  }
}

export function loadSavedScreeningEvents(): ScreeningEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCREENING_EVENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Screening events load fallback', e);
  }
  return getInitialSampleScreeningEvents();
}

export function saveScreeningEvents(events: ScreeningEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCREENING_EVENTS, JSON.stringify(events));
  } catch (e) {
    console.warn('Screening events save failed', e);
  }
}

export function loadSavedExtractions(): DataExtractionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXTRACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Extractions load fallback', e);
  }
  return getInitialSampleExtractions();
}

export function saveExtractions(extractions: DataExtractionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXTRACTIONS, JSON.stringify(extractions));
  } catch (e) {
    console.warn('Extractions save failed', e);
  }
}

export function loadSavedSynthesisOutcomes(): SynthesisOutcome[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNTHESIS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Synthesis load fallback', e);
  }
  return getInitialSampleSynthesisOutcomes();
}

export function saveSynthesisOutcomes(outcomes: SynthesisOutcome[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNTHESIS, JSON.stringify(outcomes));
  } catch (e) {
    console.warn('Synthesis save failed', e);
  }
}

export function loadSavedSourceRecords(): SourceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOURCE_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Source records load fallback', e);
  }
  return getInitialSampleSourceRecords();
}

export function saveSourceRecords(records: SourceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SOURCE_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.warn('Source records save failed', e);
  }
}

export function loadSavedReferences(): ReferenceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REFERENCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('References load fallback', e);
  }
  return getInitialSampleReferences();
}

export function saveReferences(references: ReferenceItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REFERENCES, JSON.stringify(references));
  } catch (e) {
    console.warn('References save failed', e);
  }
}

export function loadSavedPrisma(): PrismaFlowData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRISMA);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Prisma load fallback', e);
  }
  return {
    projectId: 'PROJ-2026-SR-01',
    databasesSearched: 'PubMed/MEDLINE, Embase, Cochrane CENTRAL, Web of Science',
    recordsIdentifiedDatabases: 1842,
    recordsIdentifiedRegisters: 124,
    recordsIdentifiedOther: 45,
    duplicatesRemoved: 412,
    recordsScreened: 1599,
    recordsExcludedScreening: 1420,
    exclusionReasonsScreening: {
      'Wrong study population': 680,
      'Non-interventional design': 430,
      'Duplicate / Animal model': 310
    },
    reportsSoughtForRetrieval: 179,
    reportsNotRetrieved: 11,
    reportsAssessedForEligibility: 168,
    reportsExcludedEligibility: 144,
    exclusionReasonsEligibility: {
      'Insufficient outcome reporting': 62,
      'No concurrent control group': 48,
      'Non-English / Full text unavailable': 34
    },
    newStudiesIncluded: 24,
    totalStudiesIncluded: 24,
    notes: 'PRISMA 2020 Flow verified against PROSPERO registration CRD42026889211'
  };
}

export function savePrisma(data: PrismaFlowData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRISMA, JSON.stringify(data));
  } catch (e) {
    console.warn('Prisma save failed', e);
  }
}

export function loadSavedAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Audit load failed', e);
  }
  return [
    {
      id: 'audit-init-0',
      projectId: 'PROJ-2026-SR-01',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      action: 'GOVERNANCE_GATE_VERIFIED',
      entityType: 'DataGovernanceGate',
      entityId: 'gov-gate-PROJ-2026-SR-01',
      user: 'Dr. Sarah Lindqvist (Lead Investigator)',
      details: 'Research Data Governance Gate verified: GDPR Art. 6/9 and Helseforskningsloven §§ 5-7 compliance recorded. No unprotected direct identifiers.',
      hashSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
      previousHashSha256: '0000000000000000000000000000000000000000000000000000000000000000'
    },
    {
      id: 'audit-init-1',
      projectId: 'PROJ-2026-SR-01',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      action: 'IMPORT_DOCUMENT',
      entityType: 'StudyRecord',
      entityId: 'study-sample-amstar2',
      user: 'Dr. Sarah Lindqvist (Lead)',
      details: 'Ingested JATS XML full-text for Telemedicine Systematic Review. Document SHA-256 integrity seal calculated.',
      hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      previousHashSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'
    },
    {
      id: 'audit-init-2',
      projectId: 'PROJ-2026-SR-01',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      action: 'PERFORM_APPRAISAL',
      entityType: 'AppraisalAssessment',
      entityId: 'study-sample-amstar2',
      user: 'Dr. Sarah Lindqvist (Lead)',
      details: 'Completed AMSTAR 2 Reviewer A assessment. Rated 16 domains. Overall confidence: High.',
      hashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      previousHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    },
    {
      id: 'audit-init-3',
      projectId: 'PROJ-2026-SR-01',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      action: 'PERFORM_APPRAISAL',
      entityType: 'AppraisalAssessment',
      entityId: 'study-sample-amstar2',
      user: 'Dr. Marcus Vance (Independent)',
      details: 'Completed AMSTAR 2 Reviewer B assessment. Identified 2 minor discrepancies on Q7 and Q10.',
      hashSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      previousHashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    }
  ];
}

export function saveAuditLog(log: AuditLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(log));
  } catch (e) {
    console.warn('Audit save failed', e);
  }
}

export function getInitialSampleProject(): ResearchProject {
  return {
    id: 'PROJ-2026-SR-01',
    title: 'Digital Health & Telemedicine in Glycaemic Management: Systematic Review & GRADE Synthesis',
    shortCode: 'TELE-DIAB-2026',
    leadInvestigator: 'Dr. Sarah Lindqvist, MD, PhD',
    organization: 'Center for Evidence-Based Clinical Practice & Health Informatics',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'Dual Appraisal Phase',
    activeVersion: '1.2.0',
    protocol: {
      projectId: 'PROJ-2026-SR-01',
      registrationNumber: 'PROSPERO CRD42026889211',
      registrationStatus: 'Registered',
      researchQuestion: 'How effective and methodologically robust are digital telemedicine and remote glucose monitoring platforms compared with standard care in adults with type 2 diabetes?',
      pico: {
        population: 'Adult outpatients (aged >= 18 years) with diagnosed Type 2 Diabetes Mellitus',
        intervention: 'Digital telemedicine, remote continuous glucose monitoring (CGM), and asynchronous clinical coaching',
        comparator: 'Usual outpatient standard of care or active paper-based self-monitoring of blood glucose',
        outcomes: 'Primary: HbA1c reduction (%) at 6 and 12 months; Secondary: severe hypoglycaemic events, quality of life (EQ-5D)',
        studyDesigns: ['Systematic Reviews', 'Randomized Controlled Trials', 'Cluster RCTs']
      },
      eligibilityCriteria: {
        inclusion: [
          'Randomized controlled trials or systematic reviews of RCTs',
          'Adult participants diagnosed with Type 2 Diabetes',
          'Intervention duration of at least 12 weeks',
          'Reporting baseline and endpoint HbA1c with variance measures'
        ],
        exclusion: [
          'Type 1 diabetes or gestational diabetes cohorts',
          'Non-randomized observational cohorts with high confounding',
          'Absence of concurrent control comparison group',
          'Pilot feasibility studies with n < 20 per arm'
        ]
      },
      searchStrategy: {
        databases: ['PubMed/MEDLINE', 'Embase', 'Cochrane CENTRAL', 'Web of Science'],
        searchTerms: '("Telemedicine"[Mesh] OR "Digital Health" OR "Remote Monitoring") AND ("Diabetes Mellitus, Type 2"[Mesh] OR "T2D") AND ("Glycated Hemoglobin A"[Mesh] OR "HbA1c")',
        dateRange: '2015-01-01 to 2026-08-01',
        languageRestrictions: 'English and Nordic languages'
      },
      synthesisApproach: 'Random-Effects Meta-Analysis',
      discrepancyProtocol: 'Dual independent blinded appraisal with third-party consensus panel resolution.'
    },
    governanceGate: {
      projectId: 'PROJ-2026-SR-01',
      verifiedBy: 'Dr. Sarah Lindqvist (Principal Investigator)',
      verifiedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      containsIdentifiablePersonalData: false,
      containsHealthData: true,
      hasDirectIdentifiers: false,
      hasIndirectIdentifiers: false,
      legalBasisRegistered: true,
      legalBasisNotes: 'Helseforskningsloven §§ 5–7 / GDPR Art. 6(1)(e) & Art. 9(2)(j) (Scientific Research). De-identified aggregate trial data.',
      rekEthicsStatus: 'Exempt / Open Access Scientific Publications',
      rekReferenceNumber: 'REK-NORD-2026-EXEMPT-04',
      dataMinimizationFulfilled: true,
      storageLocationApproved: true,
      storageLocationName: 'Secure Sandboxed Research Enclave (AES-256 at rest, TLS 1.3 in transit)',
      retentionPolicy: '10 years post-publication in compliance with National Research Ethics norms',
      isGatePassed: true
    },
    reviewers: [
      {
        id: 'rev-sarah',
        name: 'Dr. Sarah Lindqvist',
        role: 'Lead Reviewer',
        email: 'sarah.lindqvist@evidence-research.org',
        affiliation: 'Dept. of Clinical Epidemiology, OUS',
        isBlinded: false,
        avatarColor: 'bg-blue-600'
      },
      {
        id: 'rev-marcus',
        name: 'Dr. Marcus Vance',
        role: 'Independent Reviewer',
        email: 'marcus.vance@trial-review.ac.uk',
        affiliation: 'Biostatistics Institute, Oxford',
        isBlinded: true,
        avatarColor: 'bg-indigo-600'
      },
      {
        id: 'rev-elena',
        name: 'Prof. Elena Rostova',
        role: 'Consensus Arbiter',
        email: 'e.rostova@cochrane-panel.org',
        affiliation: 'Evidence Synthesis Review Board',
        isBlinded: false,
        avatarColor: 'bg-purple-600'
      },
      {
        id: 'rev-henrik',
        name: 'Prof. Henrik Holm',
        role: 'Clinical Specialist',
        email: 'henrik.holm@helse-nord.no',
        affiliation: 'Endocrinology & Internal Medicine',
        isBlinded: true,
        avatarColor: 'bg-emerald-600'
      },
      {
        id: 'rev-ingrid',
        name: 'Dr. Ingrid Dahl',
        role: 'Methodology Auditor',
        email: 'ingrid.dahl@fhi.no',
        affiliation: 'Norwegian Institute of Public Health',
        isBlinded: true,
        avatarColor: 'bg-teal-600'
      },
      {
        id: 'rev-david',
        name: 'Dr. David Chen',
        role: 'Biostatistician',
        email: 'd.chen@meta-analysis-lab.org',
        affiliation: 'Division of Medical Statistics',
        isBlinded: true,
        avatarColor: 'bg-amber-600'
      }
    ],
    snapshots: []
  };
}

export function getInitialSampleScreeningEvents(): ScreeningEvent[] {
  return [
    {
      id: 'scr-evt-1',
      projectId: 'PROJ-2026-SR-01',
      studyId: 'study-sample-amstar2',
      studyTitle: 'Effectiveness of Digital Health & Telemedicine Interventions for Type 2 Diabetes Management',
      previousStage: 'Title/Abstract',
      newStage: 'Eligibility',
      decision: 'INCLUDED',
      reviewer: 'Dr. Sarah Lindqvist (Lead)',
      timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
      documentHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    },
    {
      id: 'scr-evt-2',
      projectId: 'PROJ-2026-SR-01',
      studyId: 'study-sample-rob2',
      studyTitle: 'Efficacy of Direct Oral Anticoagulants vs Antiplatelet Monotherapy for Secondary Stroke Prevention',
      previousStage: 'Title/Abstract',
      newStage: 'Eligibility',
      decision: 'INCLUDED',
      reviewer: 'Dr. Marcus Vance (Independent)',
      timestamp: new Date(Date.now() - 3600000 * 50).toISOString(),
      documentHashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    }
  ];
}

export function getInitialSampleExtractions(): DataExtractionRecord[] {
  return [
    {
      id: 'ext-1',
      projectId: 'PROJ-2026-SR-01',
      studyId: 'study-sample-amstar2',
      studyTitle: 'Effectiveness of Digital Health & Telemedicine Interventions for Type 2 Diabetes Management',
      sampleSize: 4820,
      populationCharacteristics: 'Adults with T2D, baseline HbA1c 8.2% ± 1.1%, mean age 58.4 years',
      interventionDetails: 'Remote continuous glucose telemetry + weekly asynchronous endocrinologist coaching',
      comparatorDetails: 'Standard primary care diabetes management with quarterly clinic visits',
      primaryOutcomeMeasure: 'HbA1c change from baseline at 6 months (%)',
      primaryOutcomeValue: '-0.48% (95% CI -0.61 to -0.35)',
      effectSizeEstimate: 'Mean Difference: -0.48% (p < 0.001, I² = 58%)',
      adverseEvents: 'No increase in severe hypoglycaemia episodes (RR 0.94, 95% CI 0.72-1.22)',
      fundingAndCoi: 'National Medical Research Council (Grant NH-2023-8812); No commercial COI',
      extractedBy: 'Dr. Sarah Lindqvist',
      verifiedByResearcher: true,
      evidencePageRef: 'Page 4, Results Section',
      rawQuote: 'Telemedicine interventions produced a statistically significant reduction in HbA1c compared with standard care (Mean Difference -0.48%, 95% CI -0.61 to -0.35, p<0.001; I²=58%).',
      timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    {
      id: 'ext-2',
      projectId: 'PROJ-2026-SR-01',
      studyId: 'study-sample-rob2',
      studyTitle: 'Efficacy of Direct Oral Anticoagulants vs Antiplatelet Monotherapy for Secondary Stroke Prevention',
      sampleSize: 1240,
      populationCharacteristics: 'Embolic stroke of undetermined source (ESUS), mean age 64.2 years (48% female)',
      interventionDetails: 'DOAC oral monotherapy daily',
      comparatorDetails: 'Aspirin antiplatelet monotherapy 100mg daily',
      primaryOutcomeMeasure: 'Recurrent ischemic stroke at 12 months (ITT)',
      primaryOutcomeValue: '26 (4.2%) vs 48 (7.7%)',
      effectSizeEstimate: 'Hazard Ratio 0.54 (95% CI 0.34 to 0.86, p = 0.009)',
      adverseEvents: 'Major bleeding: 1.8% vs 1.6% (p = 0.76, not significant)',
      fundingAndCoi: 'Medical Research Council; Non-commercial investigator-initiated trial',
      extractedBy: 'Dr. Marcus Vance',
      verifiedByResearcher: true,
      evidencePageRef: 'Page 3, Outcomes',
      rawQuote: 'Primary endpoint occurred in 26 patients (4.2%) in the DOAC group vs 48 (7.7%) in the control group (Hazard Ratio 0.54, 95% CI 0.34 to 0.86, p=0.009).',
      timestamp: new Date(Date.now() - 3600000 * 15).toISOString()
    }
  ];
}

export function getInitialSampleSynthesisOutcomes(): SynthesisOutcome[] {
  return [
    {
      id: 'outcome-1',
      projectId: 'PROJ-2026-SR-01',
      outcomeName: 'Glycated Hemoglobin (HbA1c) Reduction at 6 Months',
      picoOutcomeCategory: 'Primary Clinical Efficacy',
      includedStudiesCount: 24,
      totalParticipants: 4820,
      pooledEffectEstimate: 'MD -0.48% (95% CI -0.61 to -0.35, p < 0.001)',
      heterogeneityI2: '58% (Moderate)',
      gradeCertainty: 'High',
      evidenceTraceLineage: [
        {
          studyId: 'study-sample-amstar2',
          studyTitle: 'Effectiveness of Digital Health & Telemedicine Interventions for Type 2 Diabetes Management',
          extractionId: 'ext-1',
          documentHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          page: 'Page 4, Results',
          quote: 'Pooled effect showed significant HbA1c reduction (MD -0.48%, 95% CI -0.61 to -0.35).'
        }
      ]
    },
    {
      id: 'outcome-2',
      projectId: 'PROJ-2026-SR-01',
      outcomeName: 'Secondary Stroke Recurrence at 12 Months',
      picoOutcomeCategory: 'Primary Clinical Efficacy',
      includedStudiesCount: 1,
      totalParticipants: 1240,
      pooledEffectEstimate: 'HR 0.54 (95% CI 0.34 to 0.86, p = 0.009)',
      heterogeneityI2: '0% (Single Trial)',
      gradeCertainty: 'Moderate',
      evidenceTraceLineage: [
        {
          studyId: 'study-sample-rob2',
          studyTitle: 'Efficacy of Direct Oral Anticoagulants vs Antiplatelet Monotherapy for Secondary Stroke Prevention',
          extractionId: 'ext-2',
          documentHashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          page: 'Page 3, Outcomes',
          quote: 'Primary endpoint occurred in 26 patients (4.2%) in the DOAC group vs 48 (7.7%) in the control group (HR 0.54).'
        }
      ]
    }
  ];
}

/**
 * Pre-built scientific benchmark studies
 */
export function getInitialSampleStudies(): StudyRecord[] {
  return [
    {
      id: 'study-agree2-stroke-2025',
      projectId: 'PROJ-2026-SR-01',
      title: 'Nasjonal faglig retningslinje for behandling og rehabilitering ved hjerneslag: Systematisk svelgescreening og dysfagihåndtering',
      authors: 'Helsedirektoratet',
      year: '2025',
      journal: 'Helsedirektoratet retningslinjer (IS-2025-SLAG)',
      doi: '10.8214/helsedir.retningslinje.hjerneslag.2025',
      abstract: 'Formål: Retningslinjen gir nasjonale faglige anbefalinger for tidlig identifikasjon, diagnostikk, akuttbehandling og tverrfaglig rehabilitering ved hjerneslag i spesialist- og primærhelsetjenesten.\n\nMålgruppe og omfang: Pasienter med akutt hjerneslag eller TIA, deres pårørende, samt helsepersonell i prehospitale tjenester, slagsentre og kommunal rehabilitering.\n\nMetode: Utviklet i henhold til Helsedirektoratets veileder for retningslinjeutvikling med tverrfaglig arbeidsgruppe og brede høringsrunder. Systematiske litteratursøk i MEDLINE, Embase, Cochrane og internasjonale kunnskapsbaser (f.eks. ESO/AHA/ASA guidelines). Evidensgradering med GRADE og konsensusprosesser.\n\nSentrale anbefalinger for dysfagi/svelgfunksjon:\n1. Alle pasienter med mistenkt akutt hjerneslag skal screenes for dysfagi med en validert svelgetest (f.eks. vannsvelgetest/GUSS) av opplært helsepersonell før inntak av mat, drikke eller perorale medikamenter (Sterk anbefaling).\n2. Ved positiv screening eller mistanke om aspirasjon skal pasienten holdes fastende for peroralt inntak og henvises til logoped/spesialist for fullverdig klinisk og/eller instrumentell svelgevurdering (FES/VFS).\n3. Tverrfaglig tiltaksplan for ernæring, munnpleie og svelgetrening etableres umiddelbart for å forebygge aspirasjonspneumoni og underernæring.',
      documentType: 'Clinical Practice Guideline',
      fileName: 'Helsedirektoratet_2025_Nasjonal_Retningslinje_Hjerneslag.pdf',
      fileSizeBytes: 642000,
      fileExtension: 'pdf',
      documentHashSha256: 'a7c92f14e3b1c67d890123456789abcdef0123456789abcdef0123456789abcdef',
      importedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      isLocked: false,
      rawContent: `Nasjonal faglig retningslinje for behandling og rehabilitering ved hjerneslag (Helsedirektoratet 2025)

Kapittel 4: Akutt utredning og håndtering av svelgvansker (dysfagi)
Formål og målgruppe:
Formålet er å redusere mortalitet, aspirasjonspneumoni og feilernæring hos voksne pasienter med akutt hjerneslag.

Arbeidsgruppe og interessenter:
Tverrfaglig arbeidsgruppe bestående av nevrologer, slagspesialister, sykepleiere, ergoterapeuter, fysioterapeuter, logopeder og brukerrepresentanter (LHL Hjerneslag). Brukermedvirkning ivaretatt på overordnet nivå.

Metodikk og kunnskapsgrunnlag:
Systematiske søk etter kunnskapsoppsummeringer og internasjonale retningslinjer i MEDLINE, Embase og Epistemonikos. GRADE-metodikk benyttet. Konsensus i tverrfaglig panel.

Anbefaling 4.1 (Sterk anbefaling):
Alle pasienter med mistanke om akutt hjerneslag skal screenes for svelgevansker med en standardisert og validert svelgetest før første inntak av peroral væske, mat eller legemidler.

Implementering og barrierer:
Krever sertifisering og opplæring av pleiepersonell i slagsenger og akuttmottak. Sykehusene må etablere lokale prosedyrer og logistikk for logopedressurser.

Redaksjonell uavhengighet:
Utgitt av Helsedirektoratet som offentlig fagorgan. Ingen eksterne kommersielle midler. Alle medlemmer har levert habilitetserklæringer.`,
      findings: [
        {
          id: 'find-agree-1',
          instrument: 'AGREE2',
          domainId: 'agree2-q1',
          topic: 'Formål og målsetting',
          sectionOrPage: 'Kapittel 1 & 4',
          matchedTerm: 'Formålet er å redusere mortalitet, aspirasjonspneumoni og feilernæring',
          excerpt: '...Formålet med retningslinjen er tydelig beskrevet for helsetjenesten...',
          confidence: 'High',
          suggestedAnswer: '7',
          researcherConfirmed: true
        },
        {
          id: 'find-agree-2',
          instrument: 'AGREE2',
          domainId: 'agree2-q4',
          topic: 'Tverrfaglig arbeidsgruppe',
          sectionOrPage: 'Metodekapittel',
          matchedTerm: 'Tverrfaglig arbeidsgruppe bestående av nevrologer, slagspesialister, sykepleiere, logopeder',
          excerpt: '...Tverrfaglig arbeidsgruppe; brukermedvirkning ivaretatt, men ikke spesifikt for dysfagi...',
          confidence: 'High',
          suggestedAnswer: '6',
          researcherConfirmed: true
        },
        {
          id: 'find-agree-3',
          instrument: 'AGREE2',
          domainId: 'agree2-q7',
          topic: 'Systematiske søkemetoder',
          sectionOrPage: 'Metodekapittel',
          matchedTerm: 'Systematiske søk etter kunnskapsoppsummeringer i MEDLINE, Embase og Epistemonikos',
          excerpt: '...Systematiske litteratursøk og bruk av internasjonale retningslinjer...',
          confidence: 'High',
          suggestedAnswer: '6',
          researcherConfirmed: true
        }
      ]
    },
    {
      id: 'study-cochrane-yoga-2022',
      projectId: 'PROJ-2026-SR-01',
      title: 'Yoga for chronic non-specific low back pain: A Cochrane Systematic Review and Meta-Analysis',
      authors: 'Wieland LS, Skoetz N, Pilkington K, Harbin S, Vempati R, Berman BM',
      year: '2022',
      journal: 'Cochrane Database of Systematic Reviews',
      doi: '10.1002/14651858.CD010671.pub3',
      abstract: 'Background: Yoga is commonly used for chronic non-specific low back pain. This is an update of a Cochrane Review first published in 2017.\n\nObjectives: To assess the effects of yoga in people with chronic non-specific low back pain.\n\nSearch methods: We searched CENTRAL, MEDLINE, Embase, PsycINFO, and trial registers up to July 2022 without language restrictions.\n\nSelection criteria: Randomized controlled trials (RCTs) comparing yoga with non-exercise controls, back exercise, or as an adjunct treatment.\n\nData collection and analysis: Two review authors independently selected trials, extracted data, and assessed risk of bias with RoB 2. GRADE was used to assess certainty of evidence.\n\nMain results: 21 trials (2223 participants) were included. Yoga resulted in small-to-moderate improvements in back-related function at 3 to 6 months (Roland-Morris Disability Questionnaire MD -1.69, 95% CI -2.57 to -0.81; moderate-certainty evidence) and pain reduction (MD -0.44 points on 0-10 scale, 95% CI -0.73 to -0.15; moderate-certainty evidence). Yoga was not associated with serious adverse events.',
      documentType: 'Cochrane Systematic Review',
      fileName: 'Wieland_2022_Yoga_Low_Back_Pain_Cochrane.pdf',
      fileSizeBytes: 520000,
      fileExtension: 'pdf',
      documentHashSha256: 'c8230b42f1a99876543210fedcba9876543210fedcba9876543210fedcba9876',
      importedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      isLocked: false,
      rawContent: `Cochrane Systematic Review: Yoga for chronic non-specific low back pain (Wieland et al. 2022)
Protocol registered on Cochrane Library. Comprehensive searches of CENTRAL, MEDLINE, Embase, ClinicalTrials.gov, WHO ICTRP.
Dual independent screening and data extraction. Risk of bias assessed using Cochrane RoB 2. Certainty of evidence graded using GRADE.
21 RCTs (2223 participants). Moderate-certainty evidence of benefit for back function (MD -1.69).`,
      findings: [
        {
          id: 'find-cochrane-1',
          instrument: 'AMSTAR2',
          domainId: 'amstar2-q2',
          topic: 'Protocol Registration',
          sectionOrPage: 'Methods',
          matchedTerm: 'Protocol registered on Cochrane Library',
          excerpt: '...Protocol was published a priori in Cochrane Library...',
          confidence: 'High',
          suggestedAnswer: 'yes',
          researcherConfirmed: true
        },
        {
          id: 'find-cochrane-2',
          instrument: 'AMSTAR2',
          domainId: 'amstar2-q4',
          topic: 'Comprehensive Search Strategy',
          sectionOrPage: 'Methods',
          matchedTerm: 'CENTRAL, MEDLINE, Embase, PsycINFO, ClinicalTrials.gov, WHO ICTRP',
          excerpt: '...Comprehensive search across multiple databases and registries without language restrictions...',
          confidence: 'High',
          suggestedAnswer: 'yes',
          researcherConfirmed: true
        }
      ]
    },
    {
      id: 'study-plos-bunn-2012',
      projectId: 'PROJ-2026-SR-01',
      title: 'Psychosocial Factors That Shape Patient and Carer Experiences of Dementia Diagnosis and Treatment: A Systematic Review of Qualitative Studies',
      authors: 'Bunn F, Goodman C, Sworn K, Rait G, Brayne C, Robinson L, McNeilly E, Iliffe S',
      year: '2012',
      journal: 'PLoS Medicine',
      doi: '10.1371/journal.pmed.1001331',
      abstract: 'Background: Timely diagnosis of dementia is a clinical priority, yet diagnostic delays remain widespread. We synthesized qualitative evidence exploring the psychosocial experiences of people with dementia and family carers across diagnostic and treatment trajectories.\n\nMethods and Findings: We searched electronic databases (PubMed, CINAHL, PsycINFO, Social Science Citation Index) from 1990 to 2011 for qualitative empirical research. Two reviewers independently screened titles/abstracts and assessed methodological quality using CASP qualitative appraisal criteria. Meta-ethnography and thematic synthesis were applied to 102 qualitative studies (n=3,095 participants).\n\nKey Themes: Three overarching conceptual themes emerged: (1) Pathways to diagnosis (normalization of symptoms, gatekeeping, crisis triggers), (2) Resolving conflicts between autonomy and safety, and (3) Re-negotiating relationships and living with dementia post-diagnosis.\n\nConclusions: Improving early diagnostic pathways requires addressing emotional barriers and destigmatizing dementia services for families.',
      documentType: 'Qualitative Systematic Review',
      fileName: 'Bunn_2012_Dementia_Qualitative_Synthesis_PLoSMed.pdf',
      fileSizeBytes: 410000,
      fileExtension: 'pdf',
      documentHashSha256: 'd9182345e6f70123456789abcdef0123456789abcdef0123456789abcdef0123',
      importedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      isLocked: false,
      rawContent: `PLoS Medicine Qualitative Synthesis: Psychosocial Factors in Dementia (Bunn et al. 2012)
Searched PubMed, CINAHL, PsycINFO, SSCI. 102 qualitative studies included.
Appraised using CASP qualitative checklist. Thematic synthesis and meta-ethnography.`,
      findings: [
        {
          id: 'find-casp-1',
          instrument: 'CASP',
          domainId: 'casp-q1',
          topic: 'Clear statement of aims',
          sectionOrPage: 'Introduction',
          matchedTerm: 'synthesized qualitative evidence exploring the psychosocial experiences',
          excerpt: '...A clear research question addressing patient and carer perspectives on dementia diagnosis...',
          confidence: 'High',
          suggestedAnswer: 'yes',
          researcherConfirmed: true
        }
      ]
    },
    {
      id: 'study-fonhus-2018',
      projectId: 'PROJ-2026-SR-01',
      title: 'Patient-mediated interventions to improve professional practice: A Cochrane Systematic Review',
      authors: 'Fønhus MS, Dalsbø TK, Johansen M, Fretheim A, Skirbekk H, Flottorp SA',
      year: '2018',
      journal: 'Cochrane Database of Systematic Reviews',
      doi: '10.1002/14651858.CD012472.pub2',
      abstract: 'Background: Patient-mediated interventions (such as patient-reported health information, patient education, or decision aids) aim to influence healthcare professional practice through patient interaction.\n\nObjectives: To assess the effects of patient-mediated interventions on healthcare professional practice and patient clinical outcomes.\n\nSearch methods: Searched CENTRAL, MEDLINE, Embase, CINAHL up to 2018. Two review authors independently screened studies, extracted data, and assessed risk of bias (EPOC RoB criteria).\n\nMain results: 42 randomized and non-randomized studies. Moderate-certainty evidence that patient-led information and decision aids slightly improve clinician adherence to recommended guidelines and patient satisfaction.',
      documentType: 'Cochrane Systematic Review',
      fileName: 'Fonhus_2018_Patient_Mediated_Interventions_Cochrane.pdf',
      fileSizeBytes: 480000,
      fileExtension: 'pdf',
      documentHashSha256: 'e8234567f890123456789abcdef0123456789abcdef0123456789abcdef01234',
      importedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
      isLocked: false,
      rawContent: `Cochrane Review: Patient-mediated interventions to improve professional practice (Fønhus et al. 2018).
Comprehensive search strategy, protocol registered, duplicate extraction, EPOC Cochrane criteria, GRADE assessment.`,
      findings: [
        {
          id: 'find-fonhus-1',
          instrument: 'AMSTAR2',
          domainId: 'amstar2-q1',
          topic: 'PICO research question',
          sectionOrPage: 'Objectives',
          matchedTerm: 'effects of patient-mediated interventions on professional practice',
          excerpt: '...Clear PICO framing healthcare professional adherence and clinical outcomes...',
          confidence: 'High',
          suggestedAnswer: 'yes',
          researcherConfirmed: true
        }
      ]
    },
    {
      id: 'study-tretteteig-2017',
      projectId: 'PROJ-2026-SR-01',
      title: 'The influence of day care centres designed for people with dementia on family caregivers – a qualitative study',
      authors: 'Tretteteig S, Vatne S, Rokstad AMM',
      year: '2017',
      journal: 'BMC Geriatrics',
      doi: '10.1186/s12877-016-0403-2',
      abstract: 'Background: Day care services tailored for people with dementia can relieve caregiver burden and enable individuals to live at home longer. This qualitative study explores family caregivers’ experiences of tailored day care centres.\n\nMethods: Semi-structured qualitative in-depth interviews with 17 family caregivers of people with dementia attending day care in Norway. Data analyzed using Malterud’s systematic text condensation (STC).\n\nResults: Day care centres provided caregivers with vital respite, reduced anxiety regarding safety, and facilitated an improved everyday rhythm. Clear communication and flexible transport arrangements were essential facilitators.\n\nConclusions: Specialized day care provides significant psychosocial support for family caregivers.',
      documentType: 'Qualitative Empirical Study',
      fileName: 'Tretteteig_2017_Dementia_DayCare_Caregivers_BMCGeriatrics.pdf',
      fileSizeBytes: 310000,
      fileExtension: 'pdf',
      documentHashSha256: 'f9345678a90123456789abcdef0123456789abcdef0123456789abcdef012345',
      importedAt: new Date(Date.now() - 3600000 * 42).toISOString(),
      isLocked: false,
      rawContent: `BMC Geriatrics Qualitative Study: Day care centres for dementia (Tretteteig et al. 2017).
Qualitative semi-structured interviews with 17 family caregivers. Analyzed with Malterud's systematic text condensation.
Ethical approval by Regional Ethics Committee (REK).`,
      findings: [
        {
          id: 'find-tret-1',
          instrument: 'CASP',
          domainId: 'casp-q1',
          topic: 'Qualitative Aim',
          sectionOrPage: 'Methods',
          matchedTerm: 'explore family caregivers’ experiences of tailored day care centres',
          excerpt: '...Clear qualitative aim investigating caregiver experiences with tailored dementia day care...',
          confidence: 'High',
          suggestedAnswer: 'yes',
          researcherConfirmed: true
        }
      ]
    },
    {
      id: 'study-sample-amstar2',
      projectId: 'PROJ-2026-SR-01',
      title: 'Effectiveness of Digital Health & Telemedicine Interventions for Type 2 Diabetes Management: A Systematic Review and Meta-Analysis',
      authors: 'Lindqvist S, Vance M, Chen H, Thorne E',
      year: '2024',
      journal: 'The Lancet Digital Health',
      doi: '10.1016/S2589-7500(24)00118-2',
      abstract: 'Background: Digital telemedicine platforms are increasingly deployed to enhance glycaemic control in adults with type 2 diabetes. We systematically synthesized randomized controlled trials evaluating remote monitoring and asynchronous messaging on HbA1c reduction.\n\nMethods: We searched MEDLINE/PubMed, Embase, Cochrane CENTRAL, and Web of Science from inception through March 2024. The protocol was registered a priori in PROSPERO (CRD42023918234). Two independent reviewers screened citations and extracted data in duplicate. Risk of bias was appraised using the Cochrane RoB 2 tool. Random-effects meta-analyses were conducted, and heterogeneity was explored via meta-regression and subgroup analysis. Publication bias was evaluated with funnel plots and Egger’s test.\n\nFindings: 24 randomized trials (n=4,820 participants) were included. Telemedicine interventions produced a statistically significant reduction in HbA1c compared with standard care (Mean Difference -0.48%, 95% CI -0.61 to -0.35, p<0.001; I²=58%). Sensitivity analyses restricted to low risk of bias trials confirmed stability of effect. Excluded full-text studies are provided with specific methodological justifications in Supplementary Table S2.\n\nInterpretation: Remote digital monitoring demonstrates meaningful improvements in glycaemic control. High-quality trial designs and rigorous outcome measurement support clinical implementation.',
      documentType: 'Systematic Review / Meta-Analysis',
      fileName: 'Lindqvist_2024_Telemedicine_Diabetes_SR.jats.xml',
      fileSizeBytes: 148520,
      fileExtension: 'xml',
      documentHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      importedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      isLocked: false,
      rawContent: `<?xml version="1.0" encoding="UTF-8"?>
<article article-type="research-article" dtd-version="1.2">
  <front>
    <article-meta>
      <article-title>Effectiveness of Digital Health &amp; Telemedicine Interventions for Type 2 Diabetes Management: A Systematic Review and Meta-Analysis</article-title>
      <contrib-group>
        <contrib contrib-type="author"><name><surname>Lindqvist</surname><given-names>Sarah</given-names></name></contrib>
        <contrib contrib-type="author"><name><surname>Vance</surname><given-names>Marcus</given-names></name></contrib>
        <contrib contrib-type="author"><name><surname>Chen</surname><given-names>Hui</given-names></name></contrib>
      </contrib-group>
      <pub-date><year>2024</year></pub-date>
      <abstract>
        <p>Background: We evaluated randomized trials on telemedicine and continuous glucose monitoring. Protocol registered with PROSPERO (CRD42023918234).</p>
      </abstract>
    </article-meta>
  </front>
  <body>
    <sec id="sec-methods">
      <title>Methods &amp; Search Strategy</title>
      <p>A comprehensive search strategy was developed with a medical research librarian across MEDLINE, Embase, Cochrane CENTRAL, and Web of Science. Two independent reviewers independently screened all titles and abstracts in duplicate, and disagreements were resolved through consensus with a third arbiter.</p>
      <p>Data extraction was conducted in duplicate using a standardized pilot-tested form. Methodological quality and risk of bias were evaluated using the Cochrane Risk of Bias 2 (RoB 2) tool.</p>
      <p>Statistical synthesis employed DerSimonian-Laird random-effects models. Heterogeneity was quantified using the I² statistic. Small-study effects and publication bias were formally evaluated using funnel plot inspection and Egger’s linear regression test (p=0.42).</p>
      <p>A comprehensive list of all excluded full-text articles with detailed individual reasons for exclusion is provided in Supplementary Appendix Table S2.</p>
    </sec>
    <sec id="sec-results">
      <title>Results &amp; Synthesis</title>
      <p>A total of 24 trials were synthesized. Overall pooled effect showed significant HbA1c reduction (MD -0.48%, 95% CI -0.61 to -0.35). Heterogeneity was moderate (I² = 58%). Sensitivity analyses excluding high risk of bias studies yielded consistent conclusions (MD -0.45%, 95% CI -0.58 to -0.32).</p>
    </sec>
    <sec id="sec-funding">
      <title>Funding and Conflict of Interest</title>
      <p>This work was supported by Grant NH-2023-8812 from the National Medical Research Council. All authors declare no competing financial or non-financial interests.</p>
    </sec>
  </body>
</article>`,
      findings: [
        {
          id: 'find-1',
          instrument: 'AMSTAR2',
          domainId: 'amstar2-q2',
          topic: 'Protocol Registration (PROSPERO)',
          sectionOrPage: 'Methods',
          matchedTerm: 'PROSPERO (CRD42023918234)',
          excerpt: '...Protocol was registered a priori in PROSPERO (CRD42023918234). Two independent reviewers screened citations...',
          confidence: 'High',
          suggestedAnswer: 'yes',
          researcherConfirmed: true
        },
        {
          id: 'find-2',
          instrument: 'AMSTAR2',
          domainId: 'amstar2-q4',
          topic: 'Comprehensive Search Strategy',
          sectionOrPage: 'Methods',
          matchedTerm: 'MEDLINE, Embase, Cochrane CENTRAL, and Web of Science',
          excerpt: '...comprehensive search strategy across MEDLINE, Embase, Cochrane CENTRAL, and Web of Science...',
          confidence: 'High',
          suggestedAnswer: 'yes',
          researcherConfirmed: true
        },
        {
          id: 'find-3',
          instrument: 'AMSTAR2',
          domainId: 'amstar2-q5',
          topic: 'Duplicate Screening (Study Selection)',
          sectionOrPage: 'Methods',
          matchedTerm: 'Two independent reviewers screened citations and extracted data in duplicate',
          excerpt: '...Two independent reviewers independently screened all titles and abstracts in duplicate, and disagreements were resolved through consensus...',
          confidence: 'High',
          suggestedAnswer: 'yes',
          researcherConfirmed: true
        }
      ]
    },
    {
      id: 'study-sample-rob2',
      projectId: 'PROJ-2026-SR-01',
      title: 'Efficacy of Direct Oral Anticoagulants vs Antiplatelet Monotherapy for Secondary Stroke Prevention: The DEFINE Multicenter Double-Blind Randomized Trial',
      authors: 'Kowalski J, Nygård P, Moreau C, Al-Mansoor K',
      year: '2023',
      journal: 'New England Journal of Clinical Science',
      doi: '10.1056/NEJMoa2304911',
      abstract: 'Background: Optimal antithrombotic regimens in non-cardioembolic embolic strokes of undetermined source remain debated.\n\nMethods: In a double-blind, parallel-group, placebo-controlled trial across 32 academic medical centres, patients were randomly assigned in a 1:1 ratio using a centralized computer-generated permuted block algorithm with concealed allocation envelopes. Participants, investigators, trial coordinators, and outcome adjudicators were fully blinded throughout follow-up. Primary outcome was recurrent ischemic stroke at 12 months, analyzed according to the intention-to-treat principle.\n\nResults: Among 1,240 randomized patients (mean age 64.2 years; 48% female), 620 received DOAC and 620 received antiplatelet. Complete 1-year follow-up was obtained in 98.4% of participants. Primary endpoint occurred in 26 patients (4.2%) in the DOAC group vs 48 (7.7%) in the control group (Hazard Ratio 0.54, 95% CI 0.34 to 0.86, p=0.009). Major bleeding did not differ significantly.\n\nConclusion: DOAC therapy provided superior protection against recurrent ischemic stroke with comparable safety profiles.',
      documentType: 'Randomized Controlled Trial',
      fileName: 'Kowalski_2023_DEFINE_Trial_RCT.pdf',
      fileSizeBytes: 284000,
      fileExtension: 'pdf',
      documentHashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      importedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      isLocked: true,
      lockedBy: 'Dr. Sarah Lindqvist (Lead Reviewer)',
      lockedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      rawContent: `Efficacy of Direct Oral Anticoagulants vs Antiplatelet Monotherapy: The DEFINE Trial.
Methods: Computer-generated random sequence with block sizes of 4 and 8. Central web-based randomization ensured allocation concealment. Double-blinded with matching placebos. Intention-to-treat analysis applied to all 1240 patients.
Funding: Independent grant from Medical Research Council.`,
      findings: [
        {
          id: 'find-r1',
          instrument: 'ROB2',
          domainId: 'rob2-d1',
          topic: 'Randomization Sequence Generation & Concealment',
          sectionOrPage: 'Methods',
          matchedTerm: 'centralized computer-generated permuted block algorithm with concealed allocation envelopes',
          excerpt: '...randomly assigned in a 1:1 ratio using a centralized computer-generated permuted block algorithm with concealed allocation envelopes...',
          confidence: 'High',
          suggestedAnswer: 'low',
          researcherConfirmed: true
        }
      ]
    }
  ];
}

export function getInitialSampleAssessments(): Record<string, AppraisalAssessment[]> {
  const agreeStudyId = 'study-agree2-stroke-2025';
  const amstarStudyId = 'study-sample-amstar2';
  const robStudyId = 'study-sample-rob2';

  const reviewerA_AGREE2: AppraisalAssessment = {
    id: 'assess-agree2-rev-a',
    projectId: 'PROJ-2026-SR-01',
    studyId: agreeStudyId,
    instrument: 'AGREE2',
    reviewerId: 'rev-sarah',
    reviewerName: 'Dr. Sarah Lindqvist',
    reviewerRole: 'Lead Reviewer',
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    overallConfidence: 'High',
    overallScore: 89,
    ratings: {
      'agree2-q1': { answer: '7', rationale: 'Formålet med retningslinjen er tydelig beskrevet for helsetjenesten.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q2': { answer: '7', rationale: 'Kliniske problemstillinger (screening, utredning, tiltak) er eksplisitt formulert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q3': { answer: '7', rationale: 'Målgruppen av pasienter (akutt hjerneslag/TIA) er klart definert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q4': { answer: '6', rationale: 'Bred tverrfaglig arbeidsgruppe med alle relevante spesialiteter representert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q5': { answer: '7', rationale: 'Pasientperspektiv ivaretatt via brukerorganisasjoner (LHL Hjerneslag).', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q6': { answer: '7', rationale: 'Målgruppen av brukere/helsepersonell er tydelig beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q7': { answer: '6', rationale: 'Systematiske søk etter kunnskapsoppsummeringer og guidelines dokumentert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q8': { answer: '6', rationale: 'Kriterier for utvelgelse av evidens er tydelig beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q9': { answer: '6', rationale: 'Styrker og begrensninger ved evidensgrunnlaget er drøftet med GRADE.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q10': { answer: '6', rationale: 'Metoder for å utforme anbefalingene er klart beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q11': { answer: '7', rationale: 'Helsegevinster, bivirkninger og risiko er eksplisitt vurdert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q12': { answer: '6', rationale: 'Eksplisitt kobling mellom anbefalinger og underliggende kunnskapsgrunnlag.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q13': { answer: '5', rationale: 'Retningslinjen har vært på bred høring, men ekstern fagfellevurdering kunne vært mer detaljert dokumentert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q14': { answer: '6', rationale: 'Prosedyre for oppdatering er angitt.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q15': { answer: '7', rationale: 'Anbefalingene er spesifikke og entydige.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q16': { answer: '7', rationale: 'De ulike alternativene for håndtering av tilstanden er tydelig presentert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q17': { answer: '7', rationale: 'Nøkkelanbefalingene er lette å identifisere i egne uthevede bokser.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q18': { answer: '5', rationale: 'Fasilitatorer og barrierer for implementering er overordnet beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q19': { answer: '6', rationale: 'Råd og verktøy for implementering er tilgjengeliggjort.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q20': { answer: '5', rationale: 'Potensielle ressurskonsekvenser er drøftet, men mangler full helseøkonomisk analyse.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q21': { answer: '6', rationale: 'Retningslinjen gir konkrete kvalitetsindikatorer og revisjonskriterier.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q22': { answer: '7', rationale: 'Helsedirektoratet har full redaksjonell uavhengighet fra finansieringskilder.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q23': { answer: '7', rationale: 'Interessekonflikter og habilitet for alle medlemmer er registrert og adressert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-overall-1': { answer: '7', rationale: 'Samlet metodisk kvalitet vurderes som svært høy (7/7).', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-overall-2': { answer: 'yes', rationale: 'Anbefales til klinisk bruk i spesialist- og primærhelsetjenesten.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  const reviewerB_AGREE2: AppraisalAssessment = {
    id: 'assess-agree2-rev-b',
    projectId: 'PROJ-2026-SR-01',
    studyId: agreeStudyId,
    instrument: 'AGREE2',
    reviewerId: 'rev-marcus',
    reviewerName: 'Dr. Marcus Vance',
    reviewerRole: 'Independent Reviewer',
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    overallConfidence: 'High',
    overallScore: 86,
    ratings: {
      'agree2-q1': { answer: '7', rationale: 'Klart definert formål og populasjon.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q2': { answer: '7', rationale: 'Spesifikke kliniske spørsmål formulert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q3': { answer: '7', rationale: 'Tydelig målgruppe.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q4': { answer: '6', rationale: 'Tverrfaglig representasjon god.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q5': { answer: '6', rationale: 'Brukermedvirkning ivaretatt på overordnet nivå, men ikke spesifikt for svelgvansker.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q6': { answer: '7', rationale: 'Målgruppe helsepersonell klart definert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q7': { answer: '6', rationale: 'Systematiske litteratursøk benyttet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q8': { answer: '6', rationale: 'Kriterier for seleksjon beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q9': { answer: '6', rationale: 'Evidensgrunnlag vurdert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q10': { answer: '6', rationale: 'Strukturert konsensusprosess.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q11': { answer: '6', rationale: 'Nytte/risiko drøftet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q12': { answer: '6', rationale: 'Tydelig kobling mellom kunnskapsgrunnlag og råd.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q13': { answer: '5', rationale: 'Ekstern høringsrunde dokumentert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q14': { answer: '6', rationale: 'Revisjonsintervall oppgitt.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q15': { answer: '7', rationale: 'Klare og utvetydige råd.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q16': { answer: '6', rationale: 'Håndteringsalternativer redegjort for.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q17': { answer: '7', rationale: 'Nøkkelanbefalinger lett gjenkjennelige.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q18': { answer: '5', rationale: 'Barrierer diskutert kort.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q19': { answer: '6', rationale: 'Flytskjema og svelgetester vedlagt.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q20': { answer: '5', rationale: 'Økonomiske aspekter mangler detaljer.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q21': { answer: '6', rationale: 'Revisjonskriterier spesifisert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q22': { answer: '7', rationale: 'Uavhengig offentlig helsemyndighet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q23': { answer: '7', rationale: 'Habilitetserklæringer innhentet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-overall-1': { answer: '6', rationale: 'Svært god retningslinje.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-overall-2': { answer: 'yes', rationale: 'Anbefales til klinisk bruk.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  const consensus_AGREE2: AppraisalAssessment = {
    id: 'assess-agree2-consensus',
    projectId: 'PROJ-2026-SR-01',
    studyId: agreeStudyId,
    instrument: 'AGREE2',
    reviewerId: 'rev-consensus',
    reviewerName: 'Konsensuspanel (Dr. Lindqvist & Dr. Vance)',
    reviewerRole: 'Consensus Decision',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    overallConfidence: 'High',
    overallScore: 88,
    isConsensus: true,
    ratings: {
      'agree2-q1': { answer: '7', rationale: 'Konsensus: 7/7 – Formålet med retningslinjen er entydig og klart formulert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q2': { answer: '7', rationale: 'Konsensus: 7/7 – Spesifikke kliniske spørsmål for dysfagi og slagbehandling.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q3': { answer: '7', rationale: 'Konsensus: 7/7 – Målgruppen av pasienter er presist definert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q4': { answer: '6', rationale: 'Konsensus: 6/7 – Tverrfaglig arbeidsgruppe med bred klinisk forankring.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q5': { answer: '7', rationale: 'Konsensus: 7/7 – Pasientperspektivet er ivaretatt gjennom brukerorganisasjoner.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q6': { answer: '7', rationale: 'Konsensus: 7/7 – Målgruppen for retningslinjen er tydelig beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q7': { answer: '6', rationale: 'Konsensus: 6/7 – Systematiske litteratursøk og bruk av internasjonale retningslinjer.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q8': { answer: '6', rationale: 'Konsensus: 6/7 – Kriterier for utvelgelse av kunnskapsgrunnlag er tydelig beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q9': { answer: '6', rationale: 'Konsensus: 6/7 – GRADE-vurdering av evidensens styrke og begrensninger.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q10': { answer: '6', rationale: 'Konsensus: 6/7 – Metodene for utforming av anbefalinger er klart beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q11': { answer: '7', rationale: 'Konsensus: 7/7 – Helsegevinster, bivirkninger og risiko er eksplisitt vurdert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q12': { answer: '6', rationale: 'Konsensus: 6/7 – Tydelig kobling mellom anbefalinger og kunnskapsgrunnlag.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q13': { answer: '5', rationale: 'Konsensus: 5/7 – Bred offentlig høring, ekstern fagfellevurdering kunne vært mer detaljert dokumentert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q14': { answer: '6', rationale: 'Konsensus: 6/7 – Prosedyre for oppdatering er beskrevet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q15': { answer: '7', rationale: 'Konsensus: 7/7 – Anbefalingene er spesifikke og entydige.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q16': { answer: '7', rationale: 'Konsensus: 7/7 – Ulike håndteringsalternativer tydelig presentert.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q17': { answer: '7', rationale: 'Konsensus: 7/7 – Nøkkelanbefalingene er lette å identifisere.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q18': { answer: '5', rationale: 'Konsensus: 5/7 – Fasilitatorer og barrierer er drøftet på overordnet systemnivå.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q19': { answer: '6', rationale: 'Konsensus: 6/7 – Retningslinjen gir råd, flytskjema og verktøy for implementering.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q20': { answer: '5', rationale: 'Konsensus: 5/7 – Potensielle ressurskonsekvenser drøftet uten helseøkonomisk modellering.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q21': { answer: '6', rationale: 'Konsensus: 6/7 – Tydelige kvalitetsindikatorer og revisjonskriterier for helseforetakene.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q22': { answer: '7', rationale: 'Konsensus: 7/7 – Full redaksjonell uavhengighet for Helsedirektoratet.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-q23': { answer: '7', rationale: 'Konsensus: 7/7 – Interessekonflikter og habilitet for arbeidsgruppen registrert og ivaretatt.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-overall-1': { answer: '7', rationale: 'Konsensus: 7/7 – Samlet metodisk kvalitet er fremragende.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'agree2-overall-2': { answer: 'yes', rationale: 'Konsensus: Anbefales uten forbehold til klinisk bruk i hele helsetjenesten.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  const reviewerA_AMSTAR2: AppraisalAssessment = {
    id: 'assess-amstar-rev-a',
    projectId: 'PROJ-2026-SR-01',
    studyId: amstarStudyId,
    instrument: 'AMSTAR2',
    reviewerId: 'rev-sarah',
    reviewerName: 'Dr. Sarah Lindqvist',
    reviewerRole: 'Lead Reviewer',
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    overallConfidence: 'High',
    overallScore: 94,
    ratings: {
      'amstar2-q1': { answer: 'yes', rationale: 'Explicit PICO stated in introduction and abstract.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q2': { answer: 'yes', rationale: 'PROSPERO registration CRD42023918234 documented.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q3': { answer: 'yes', rationale: 'Justified inclusion of RCTs due to intervention precision.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q4': { answer: 'yes', rationale: 'Searched MEDLINE, Embase, Cochrane CENTRAL, and Web of Science + trial registers.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q5': { answer: 'yes', rationale: 'Two independent reviewers screened in duplicate with arbiter.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q6': { answer: 'yes', rationale: 'Data extracted in duplicate with standardized pilot form.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q7': { answer: 'yes', rationale: 'Supplementary Appendix S2 contains list of excluded studies with justifications.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q8': { answer: 'yes', rationale: 'Complete baseline patient demographics and dosage tables provided.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q9': { answer: 'yes', rationale: 'Used Cochrane RoB 2 tool across all 5 domains.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q10': { answer: 'yes', rationale: 'Funding sources of included trials recorded in summary table.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q11': { answer: 'yes', rationale: 'DerSimonian-Laird random effects model properly justified.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q12': { answer: 'yes', rationale: 'Sensitivity analysis restricted to low RoB trials confirmed robustness.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q13': { answer: 'yes', rationale: 'Discussion thoroughly contextualized risk of bias implications.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q14': { answer: 'yes', rationale: 'Investigated I²=58% heterogeneity using meta-regression.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q15': { answer: 'yes', rationale: 'Funnel plot and Egger’s test (p=0.42) reported.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q16': { answer: 'yes', rationale: 'Full grant disclosure and COI statement included.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  const reviewerB_AMSTAR2: AppraisalAssessment = {
    id: 'assess-amstar-rev-b',
    projectId: 'PROJ-2026-SR-01',
    studyId: amstarStudyId,
    instrument: 'AMSTAR2',
    reviewerId: 'rev-marcus',
    reviewerName: 'Dr. Marcus Vance',
    reviewerRole: 'Independent Reviewer',
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    overallConfidence: 'Moderate',
    overallScore: 88,
    ratings: {
      'amstar2-q1': { answer: 'yes', rationale: 'PICO is clear.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q2': { answer: 'yes', rationale: 'Registered in PROSPERO.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q3': { answer: 'yes', rationale: 'Study design explained.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q4': { answer: 'yes', rationale: '4 databases searched.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q5': { answer: 'yes', rationale: 'Duplicate screening reported.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q6': { answer: 'yes', rationale: 'Duplicate extraction done.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q7': { answer: 'partial', rationale: 'Excluded list is in appendix, could have included more detail on borderline exclusions.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q8': { answer: 'yes', rationale: 'Good tables.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q9': { answer: 'yes', rationale: 'RoB 2 tool used.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q10': { answer: 'no', rationale: 'Not all trial funding sources were explicitly itemized in main text.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q11': { answer: 'yes', rationale: 'Meta-analysis methods appropriate.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q12': { answer: 'yes', rationale: 'Sensitivity analysis conducted.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q13': { answer: 'yes', rationale: 'RoB taken into account.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q14': { answer: 'yes', rationale: 'Heterogeneity discussed.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q15': { answer: 'yes', rationale: 'Egger test and funnel plot included.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q16': { answer: 'yes', rationale: 'Conflicts of interest declared.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  const reviewerC_AMSTAR2: AppraisalAssessment = {
    id: 'assess-amstar-rev-c',
    projectId: 'PROJ-2026-SR-01',
    studyId: amstarStudyId,
    instrument: 'AMSTAR2',
    reviewerId: 'rev-henrik',
    reviewerName: 'Prof. Henrik Holm',
    reviewerRole: 'Clinical Specialist',
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    overallConfidence: 'High',
    overallScore: 92,
    ratings: {
      'amstar2-q1': { answer: 'yes', rationale: 'PICO criteria well specified for diabetes clinical cohort.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q2': { answer: 'yes', rationale: 'Prior PROSPERO protocol registered.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q3': { answer: 'yes', rationale: 'RCT design justification provided.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q4': { answer: 'yes', rationale: 'Comprehensive database retrieval strategy.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q5': { answer: 'yes', rationale: 'Duplicate study screening verified.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q6': { answer: 'yes', rationale: 'Duplicate data extraction verified.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q7': { answer: 'yes', rationale: 'Full exclusion table in appendix.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q8': { answer: 'yes', rationale: 'Baseline patient characteristics adequately described.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q9': { answer: 'yes', rationale: 'Cochrane RoB 2 applied.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q10': { answer: 'yes', rationale: 'Trial funding documented in table.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q11': { answer: 'yes', rationale: 'Random effects models appropriate.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q12': { answer: 'yes', rationale: 'Robust sensitivity analysis.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q13': { answer: 'yes', rationale: 'RoB accounted for in interpretation.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q14': { answer: 'yes', rationale: 'Clinical and statistical heterogeneity explored.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q15': { answer: 'yes', rationale: 'Funnel plot analysis reported.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q16': { answer: 'yes', rationale: 'No competing interests declared.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  const reviewerD_AMSTAR2: AppraisalAssessment = {
    id: 'assess-amstar-rev-d',
    projectId: 'PROJ-2026-SR-01',
    studyId: amstarStudyId,
    instrument: 'AMSTAR2',
    reviewerId: 'rev-ingrid',
    reviewerName: 'Dr. Ingrid Dahl',
    reviewerRole: 'Methodology Auditor',
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    overallConfidence: 'High',
    overallScore: 90,
    ratings: {
      'amstar2-q1': { answer: 'yes', rationale: 'Protocol conforms with PRISMA-P and Cochrane standards.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q2': { answer: 'yes', rationale: 'Registered in PROSPERO prior to formal screening.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q3': { answer: 'yes', rationale: 'Eligibility criteria clear.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q4': { answer: 'yes', rationale: 'High sensitivity search filter applied.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q5': { answer: 'yes', rationale: 'Dual screening performed.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q6': { answer: 'yes', rationale: 'Dual extraction performed.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q7': { answer: 'yes', rationale: 'Excluded studies list available in supplementary material.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q8': { answer: 'yes', rationale: 'Detailed intervention & comparator details.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q9': { answer: 'yes', rationale: 'RoB 2 properly implemented.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q10': { answer: 'yes', rationale: 'Individual trial funding tabulated.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q11': { answer: 'yes', rationale: 'Statistical pooling methods sound.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q12': { answer: 'yes', rationale: 'Low-RoB subgroup analysis conducted.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q13': { answer: 'yes', rationale: 'RoB impact evaluated.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q14': { answer: 'yes', rationale: 'Subgroup analysis for clinical variance.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q15': { answer: 'yes', rationale: 'Publication bias test reported.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'amstar2-q16': { answer: 'yes', rationale: 'COI fully disclosed.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  const reviewerA_ROB2: AppraisalAssessment = {
    id: 'assess-rob2-rev-a',
    projectId: 'PROJ-2026-SR-01',
    studyId: robStudyId,
    instrument: 'ROB2',
    reviewerId: 'rev-sarah',
    reviewerName: 'Dr. Sarah Lindqvist',
    reviewerRole: 'Lead Reviewer',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    overallConfidence: 'High',
    isConsensus: true,
    ratings: {
      'rob2-d1': { answer: 'low', rationale: 'Centralized computer sequence with concealed envelopes.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'rob2-d2': { answer: 'low', rationale: 'Double-blinded placebo-controlled trial with ITT analysis.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'rob2-d3': { answer: 'low', rationale: '98.4% 1-year follow-up rate achieved.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'rob2-d4': { answer: 'low', rationale: 'Outcome adjudicators blinded to allocation.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'rob2-d5': { answer: 'low', rationale: 'All pre-specified endpoints reported in registry concordance.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  const reviewerB_ROB2: AppraisalAssessment = {
    id: 'assess-rob2-rev-b',
    projectId: 'PROJ-2026-SR-01',
    studyId: robStudyId,
    instrument: 'ROB2',
    reviewerId: 'rev-marcus',
    reviewerName: 'Dr. Marcus Vance',
    reviewerRole: 'Independent Reviewer',
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    overallConfidence: 'High',
    ratings: {
      'rob2-d1': { answer: 'low', rationale: 'Permuted block sequence with central allocation.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'rob2-d2': { answer: 'low', rationale: 'Double-blind design adhered to protocol.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'rob2-d3': { answer: 'low', rationale: 'Minimal attrition bias (<2%).', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'rob2-d4': { answer: 'low', rationale: 'Blinded outcome assessment.', verifiedByResearcher: true, timestamp: new Date().toISOString() },
      'rob2-d5': { answer: 'low', rationale: 'No selective reporting detected.', verifiedByResearcher: true, timestamp: new Date().toISOString() }
    }
  };

  return {
    [agreeStudyId]: [reviewerA_AGREE2, reviewerB_AGREE2, consensus_AGREE2],
    [amstarStudyId]: [reviewerA_AMSTAR2, reviewerB_AMSTAR2, reviewerC_AMSTAR2, reviewerD_AMSTAR2],
    [robStudyId]: [reviewerA_ROB2, reviewerB_ROB2]
  };
}

export function getInitialSampleSourceRecords(): SourceRecord[] {
  return [
    {
      id: 'src-qual-001',
      projectId: 'PROJ-2026-SR-01',
      sourceOrigin: 'PubMed',
      sourceId: 'PMID:37891245',
      title: 'Lived experiences of older adults receiving home reablement services: A phenomenological study',
      authors: ['Kari Hansen', 'Per Arne Olsen', 'Ingrid Johansen'],
      year: '2024',
      journal: 'International Journal of Qualitative Studies in Health and Well-being',
      volume: '19',
      issue: '1',
      pages: '2294101',
      doi: '10.1080/17482631.2023.2294101',
      abstract: 'Purpose: To explore the lived experiences of older community-dwelling adults participating in an interdisciplinary reablement program. Methods: A qualitative phenomenological approach using semi-structured in-depth interviews with 18 participants aged 68-89 years. Thematic analysis was guided by Giorgi\'s descriptive phenomenological method. Results: Four core themes emerged: (1) Navigating the tension between autonomy and vulnerability, (2) Meaningful goal setting as motivation for physical effort, (3) The relational bond with health professionals as emotional security, and (4) Sustaining everyday competence after program discharge. Conclusion: Reablement fosters self-efficacy and agency when goals reflect older adults\' personal priorities rather than purely functional milestones.',
      screeningStatus: 'ELIGIBLE_INCLUDED',
      provenanceHashSha256: calculateSha256Sync('Lived experiences of older adults receiving home reablement services|Hansen|2024'),
      importedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      linkedStudyId: 'study-sample-jbi-qual-1',
      tags: ['Reablement', 'Fenomenologi', 'Eldreomsorg', 'JBI Inkludert']
    },
    {
      id: 'src-qual-002',
      projectId: 'PROJ-2026-SR-01',
      sourceOrigin: 'Lovdata',
      sourceId: 'HR-2023-145-A',
      title: 'Høyesteretts vurdering av rettskrav på nødvendige helse- og omsorgstjenester i hjemmet',
      authors: ['Norges Høyesterett'],
      year: '2023',
      journal: 'Norsk Retstidende / Lovdata Pro',
      pages: '1-14',
      doi: 'HR-2023-145-A',
      abstract: 'Saken gjaldt prøving av kommunalt vedtak om tildeling av praktisk bistand og hjemmesykepleie etter helse- og omsorgstjenesteloven § 3-2 første ledd nr. 6. Høyesterett drøftet forsvarlighetskravet i § 4-1 og pasientens medvirkningsrett etter pasient- og brukerrettighetsloven § 3-1. Dommen klargjør grensene for kommunens skjønnsutøvelse ved tildeling av individuelt tilpassede tjenester.',
      screeningStatus: 'TITLE_ABSTRACT_ACCEPTED',
      provenanceHashSha256: calculateSha256Sync('Høyesteretts vurdering av rettskrav|Lovdata|2023'),
      importedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      tags: ['Juridisk kilde', 'Helse- og omsorgstjenesteloven', 'Forsvarlighet']
    },
    {
      id: 'src-qual-003',
      projectId: 'PROJ-2026-SR-01',
      sourceOrigin: 'Web of Science',
      sourceId: 'WOS:000982341200003',
      title: 'Healthcare workers\' perceptions of ethical dilemmas in acute geriatric care: A grounded theory investigation',
      authors: ['Astrid Berg', 'Torstein Moe', 'Elena Rostova'],
      year: '2023',
      journal: 'BMC Medical Ethics',
      volume: '24',
      issue: '38',
      pages: '1-12',
      doi: '10.1186/s12910-023-00918-4',
      abstract: 'Background: Complex decision-making in acute geriatric units presents significant ethical challenges. Methods: Constructivist grounded theory with 26 healthcare professionals (nurses, physicians, social workers). Data collected through focus groups and individual interviews. Results: The core category "Balancing safety and dignity under institutional constraints" explained how clinicians navigate conflicting moral imperatives. Subcategories include moral distress from time constraints, surrogate decision-maker conflict, and discharge pressures. Conclusions: Interprofessional ethical reflection spaces are essential to mitigate compassion fatigue and moral injury.',
      screeningStatus: 'FULL_TEXT_PENDING',
      provenanceHashSha256: calculateSha256Sync('Healthcare workers perceptions ethical dilemmas|Berg|2023'),
      importedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
      tags: ['Grounded Theory', 'Etikk', 'Akuttgeriatri']
    },
    {
      id: 'src-qual-004',
      projectId: 'PROJ-2026-SR-01',
      sourceOrigin: 'PubMed',
      sourceId: 'PMID:36512890',
      title: 'Pharmacokinetics of Subcutaneous vs Intravenous Immunoglobulin in Secondary Immunodeficiency: A Quantitative RCT',
      authors: ['David Miller', 'Clara Smith', 'Robert Chen'],
      year: '2022',
      journal: 'Journal of Clinical Immunology',
      volume: '42',
      issue: '8',
      pages: '1680-1692',
      doi: '10.1007/s10875-022-01367-2',
      abstract: 'Randomized controlled trial evaluating serum IgG trough levels between SCIG and IVIG in 120 patients with secondary immunodeficiency. Pharmacokinetic profiling showed non-inferiority with fewer systemic adverse events in the subcutaneous cohort.',
      screeningStatus: 'EXCLUDED',
      exclusionReason: 'Feil forskningsdesign: Kvantitativ farmakokinetisk RCT, ikke kvalitativ studie.',
      provenanceHashSha256: calculateSha256Sync('Pharmacokinetics RCT|Miller|2022'),
      importedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      tags: ['Kvantitativ', 'Ekskludert']
    }
  ];
}

export function getInitialSampleReferences(): ReferenceItem[] {
  return [
    {
      id: 'ref-jamia-2023',
      projectId: 'PROJ-2026-SR-01',
      title: 'Artificial intelligence in evidence synthesis: A systematic scoping review',
      authors: [
        { family: 'Marshall', given: 'Iain J' },
        { family: 'Wallace', given: 'Byron C' }
      ],
      year: '2023',
      journal: 'Journal of the American Medical Informatics Association',
      volume: '30',
      issue: '1',
      pages: '12-21',
      doi: '10.1093/jamia/ocac198',
      pmid: '36377759',
      abstract: 'Background: Evidence synthesis is labor intensive. Methods: Scoping review examining machine learning and NLP in screening and extraction. Results: Semi-automated screening reduces workload while maintaining high recall. Conclusion: Transparent audit trails are critical for regulatory acceptance.',
      itemType: 'journalArticle',
      status: 'VALIDATED',
      collections: ['Metodologi', 'AI & Evidens'],
      tags: ['Evidenssyntese', 'Maskinlæring', 'Validering'],
      categories: ['1. Systematiske oversikter', '3. Teknologistøtte'],
      directQuotes: [
        {
          id: 'q-jamia-01',
          text: 'Semi-automated screening pipelines reduce reviewer workload by up to 50% without compromising recall when calibration thresholds are prespecified.',
          page: '16',
          tags: ['Screening', 'Presisjon'],
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ],
      thoughtMemos: [
        {
          id: 'm-jamia-01',
          title: 'Metodisk refleksjon vedrørende blinding',
          content: 'Dual screening med uavhengig blinding er avgjørende når AI-kandidater vurderes.',
          tags: ['Metode', 'JBI'],
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
        }
      ],
      cwywToken: '{Marshall, 2023 #101}',
      inTextCitation: '(Marshall & Wallace, 2023)',
      provenanceHashSha256: calculateSha256Sync('Marshall|Wallace|2023|AI Evidence Synthesis'),
      importedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'ref-tong-coreq-2007',
      projectId: 'PROJ-2026-SR-01',
      title: 'Consolidated criteria for reporting qualitative research (COREQ): a 32-item checklist for interviews and focus groups',
      authors: [
        { family: 'Tong', given: 'Allison' },
        { family: 'Sainsbury', given: 'Peter' },
        { family: 'Craig', given: 'Jonathan' }
      ],
      year: '2007',
      journal: 'International Journal for Quality in Health Care',
      volume: '19',
      issue: '6',
      pages: '349-357',
      doi: '10.1093/intqhc/mzm042',
      pmid: '17872937',
      abstract: 'Objective: To promote complete and transparent reporting among researchers and facilitate critical appraisal of qualitative research. Design: Comprehensive search and review of 22 reporting checklists followed by consolidated framework design. Results: The COREQ checklist consists of 32 items across three domains: research team and reflexivity, study design, and analysis and findings.',
      itemType: 'journalArticle',
      status: 'VALIDATED',
      collections: ['Metodologi', 'JBI Kvalitativ'],
      tags: ['Kvalitativ metode', 'Rapporteringsstandard', 'COREQ'],
      categories: ['1. Metodiske sjekklister'],
      directQuotes: [
        {
          id: 'q-coreq-01',
          text: 'Researchers must explicitly describe their reflexivity, preconceptions, and relationship with study participants to ensure methodological congruence.',
          page: '351',
          tags: ['Refleksivitet', 'JBI Kriterium 6 & 7'],
          createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
        }
      ],
      thoughtMemos: [
        {
          id: 'm-coreq-01',
          title: 'Harmonisering med JBI 2017',
          content: 'COREQ punkt 1-8 korresponderer direkte med JBI Q6 og Q7 om forskerens posisjonalitet.',
          tags: ['JBI Harmonization'],
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
        }
      ],
      cwywToken: '{Tong, 2007 #102}',
      inTextCitation: '(Tong et al., 2007)',
      provenanceHashSha256: calculateSha256Sync('Tong|Sainsbury|Craig|2007|COREQ'),
      importedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'ref-page-prisma-2021',
      projectId: 'PROJ-2026-SR-01',
      title: 'The PRISMA 2020 statement: an updated guideline for reporting systematic reviews',
      authors: [
        { family: 'Page', given: 'Matthew J' },
        { family: 'McKenzie', given: 'Joanne E' },
        { family: 'Bossuyt', given: 'Patrick M' },
        { family: 'Boutron', given: 'Isabelle' },
        { family: 'Hoffmann', given: 'Tammy C' },
        { family: 'Mulrow', given: 'Cynthia D' },
        { family: 'Shamseer', given: 'Larissa' },
        { family: 'Tetzlaff', given: 'Jennifer M' },
        { family: 'Akl', given: 'Elie A' },
        { family: 'Brennan', given: 'Sue E' },
        { family: 'Chou', given: 'Roger' },
        { family: 'Glanville', given: 'Julie' },
        { family: 'Grimshaw', given: 'Jeremy M' },
        { family: 'Hróbjartsson', given: 'Asbjørn' },
        { family: 'Lalu', given: 'Manoj M' },
        { family: 'Li', given: 'Tianjing' },
        { family: 'Loder', given: 'Elizabeth W' },
        { family: 'Mayo-Wilson', given: 'Evan' },
        { family: 'McDonald', given: 'Steve' },
        { family: 'McGuinness', given: 'Luke A' },
        { family: 'Stewart', given: 'Lesley A' },
        { family: 'Thomas', given: 'James' },
        { family: 'Tricco', given: 'Andrea C' },
        { family: 'Welch', given: 'Vivian A' },
        { family: 'Whiting', given: 'Penny' },
        { family: 'Moher', given: 'David' }
      ],
      year: '2021',
      journal: 'BMJ',
      volume: '372',
      pages: 'n71',
      doi: '10.1136/bmj.n71',
      pmid: '33782057',
      abstract: 'The PRISMA 2020 statement replaces the 2009 statement and includes new reporting guidance that reflects advances in methods to identify, select, appraise, and synthesise studies.',
      itemType: 'journalArticle',
      status: 'VALIDATED',
      collections: ['Retningslinjer', 'PRISMA'],
      tags: ['PRISMA 2020', 'Rapporteringsveiledning', 'Systematisk oversikt'],
      categories: ['1. Retningslinjer'],
      directQuotes: [],
      thoughtMemos: [],
      cwywToken: '{Page, 2021 #103}',
      inTextCitation: '(Page et al., 2021)',
      provenanceHashSha256: calculateSha256Sync('Page|McKenzie|PRISMA 2020'),
      importedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export function resetToDefaults(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROJECT);
    localStorage.removeItem(STORAGE_KEYS.STUDIES);
    localStorage.removeItem(STORAGE_KEYS.ASSESSMENTS);
    localStorage.removeItem(STORAGE_KEYS.PRISMA);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.SCREENING_EVENTS);
    localStorage.removeItem(STORAGE_KEYS.EXTRACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SYNTHESIS);
    localStorage.removeItem(STORAGE_KEYS.SOURCE_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.REFERENCES);
  } catch (e) {
    console.warn(e);
  }
}
