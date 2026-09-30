/**
 * ScreeningGateService
 * 
 * Enforces canonical pre-appraisal requirements:
 * 1. Research document exists
 * 2. Classification exists
 * 3. Classification is human verified
 * 4. Appraisal instrument is selected
 * 5. Selected instrument is compatible with study design
 * 6. Screening has valid INCLUDED decision for this specific study
 * 7. Minimum required evidence is verified
 * 8. Workflow state is consistent
 */

import type { 
  StudyRecord, 
  AppraisalInstrument, 
  ScreeningEvent 
} from '../types/index.ts';
import { StudyDesignGateService } from './studyDesignGateService.ts';
import { MasterInstrumentRegistryService } from './masterInstrumentRegistry.ts';
import { generateSecureId } from '../utils/crypto.ts';

export type ScreeningDecisionType = 'INCLUDED' | 'EXCLUDED' | 'MAYBE' | 'PENDING';

export interface ScreeningRecord {
  id: string;
  studyId: string;
  reviewerId: string;
  decision: ScreeningDecisionType;
  rationale: string;
  timestamp: string;
}

export interface ScreeningGateResult {
  canAppraise: boolean;
  blockers: string[];
  warnings: string[];
  metrics: {
    hasDocument: boolean;
    hasClassification: boolean;
    isHumanVerified: boolean;
    hasInstrument: boolean;
    isCompatibleInstrument: boolean;
    hasValidIncludedDecision: boolean;
    isEvidenceVerified: boolean;
    isWorkflowConsistent: boolean;
  };
  latestDecision?: ScreeningRecord;
}

// In-memory canonical store for screening records
const screeningStore = new Map<string, ScreeningRecord[]>();

export class ScreeningGateService {
  /**
   * Resets all in-memory screening decisions (used for test isolation).
   */
  public static clearState(): void {
    screeningStore.clear();
  }

  /**
   * Records a screening decision for a study.
   */
  public static recordDecision(
    studyId: string,
    decision: ScreeningDecisionType,
    reviewerId: string = 'reviewer-default',
    rationale: string = ''
  ): ScreeningRecord {
    if (!studyId || typeof studyId !== 'string') {
      throw new Error('Valid studyId is required to record a screening decision.');
    }

    const record: ScreeningRecord = {
      id: generateSecureId('scr-dec'),
      studyId,
      reviewerId,
      decision,
      rationale,
      timestamp: new Date().toISOString()
    };

    const existing = screeningStore.get(studyId) || [];
    existing.push(record);
    screeningStore.set(studyId, existing);

    return record;
  }

  /**
   * Gets the latest screening decision for a specific study.
   * Optionally filters by reviewerId.
   */
  public static getLatestDecision(
    studyId: string,
    reviewerId?: string
  ): ScreeningRecord | undefined {
    const list = screeningStore.get(studyId) || [];
    if (list.length === 0) return undefined;

    if (reviewerId) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].reviewerId === reviewerId) {
          return list[i];
        }
      }
      return undefined;
    }

    return list[list.length - 1];
  }

  /**
   * Syncs existing screening events into the canonical gatekeeper store.
   */
  public static syncExternalScreeningEvents(events: ScreeningEvent[]): void {
    if (!Array.isArray(events)) return;

    for (const ev of events) {
      if (!ev.studyId) continue;
      const decision: ScreeningDecisionType = 
        ev.decision === 'INCLUDED' ? 'INCLUDED' :
        ev.decision === 'EXCLUDED' ? 'EXCLUDED' : 'MAYBE';

      const record: ScreeningRecord = {
        id: ev.id,
        studyId: ev.studyId,
        reviewerId: ev.reviewer || 'reviewer-default',
        decision,
        rationale: ev.exclusionReason || '',
        timestamp: ev.timestamp
      };

      const existing = screeningStore.get(ev.studyId) || [];
      // avoid exact duplicates
      if (!existing.some(r => r.id === record.id)) {
        existing.push(record);
        screeningStore.set(ev.studyId, existing);
      }
    }
  }

  /**
   * Validates all 8 screening and pre-appraisal requirements before appraisal can be opened or saved.
   */
  public static validateScreeningGate(
    study?: Partial<StudyRecord> | null,
    instrumentId?: AppraisalInstrument | string,
    options?: {
      reviewerId?: string;
      isHumanVerified?: boolean;
      evidenceVerified?: boolean;
      screeningEvents?: ScreeningEvent[];
    }
  ): ScreeningGateResult {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Sync external events if passed
    if (options?.screeningEvents) {
      this.syncExternalScreeningEvents(options.screeningEvents);
    }

    // 1. Research document and identity check
    const hasIdentity = Boolean(study && typeof study.id === 'string' && study.id.trim().length > 0);
    if (!hasIdentity) {
      blockers.push('Study identity is missing.');
    }

    const hasDocument = Boolean(
      hasIdentity && study && 
      (study.title?.trim() || study.rawContent?.trim() || study.fileName?.trim())
    );
    if (!hasDocument) {
      blockers.push('Research document is missing or empty.');
    }

    // 2. Classification check
    const docType = study?.documentType?.trim();
    const hasClassification = Boolean(
      docType && 
      docType !== 'Unspecified / Unknown' &&
      docType !== 'unknown-uncertain'
    );
    if (!hasClassification) {
      blockers.push('Study classification is missing or unspecified.');
    }

    // 3. Human verification check
    const isHumanVerified = Boolean(
      options?.isHumanVerified === true ||
      study?.classificationVerifiedByResearcher === true ||
      study?.findings?.some(f => f.researcherConfirmed === true)
    );
    if (!isHumanVerified) {
      blockers.push('Human verification of study design classification is required.');
    }

    // 4. Instrument selected check & implementation check
    const hasInstrument = Boolean(instrumentId && String(instrumentId).trim().length > 0);
    if (!hasInstrument) {
      blockers.push('No appraisal instrument selected.');
    } else {
      const regEntry = MasterInstrumentRegistryService.getByCode(String(instrumentId));
      if (regEntry && regEntry.implementationStatus === 'REGISTERED') {
        blockers.push(`Selected instrument "${regEntry.name}" is only REGISTERED and not implemented for active appraisal.`);
      }
    }

    // 5. Instrument compatibility with study design check
    let isCompatibleInstrument = false;
    if (hasClassification && hasInstrument) {
      const mappedDesign = StudyDesignGateService.normalizeDesignString(docType || '');
      const compatibility = StudyDesignGateService.validateCompatibility(
        mappedDesign,
        String(instrumentId).toLowerCase()
      );
      isCompatibleInstrument = compatibility.canAppraise;
      if (!isCompatibleInstrument) {
        blockers.push(
          `Selected instrument "${instrumentId}" is incompatible with study design "${docType}". ` +
          compatibility.message
        );
      }
    } else if (!hasClassification) {
      blockers.push('Instrument compatibility cannot be verified before study design is classified.');
    }

    // 6. Screening decision check for THIS study ID
    const studyId = study?.id || '';
    const latestDecision = studyId ? this.getLatestDecision(studyId, options?.reviewerId) : undefined;

    let hasValidIncludedDecision = false;
    if (!latestDecision) {
      blockers.push('INCLUDED screening decision required before appraisal.');
    } else if (latestDecision.decision === 'EXCLUDED') {
      blockers.push('Study is EXCLUDED in screening. Appraisal not permitted.');
    } else if (latestDecision.decision !== 'INCLUDED') {
      blockers.push('Screening decision is pending resolution. INCLUDED decision required before appraisal.');
    } else {
      hasValidIncludedDecision = true;
    }

    // 7. Evidence verification check
    const isEvidenceVerified = Boolean(
      options?.evidenceVerified === true ||
      (study?.findings && study.findings.length > 0 && study.findings.some(f => f.researcherConfirmed)) ||
      (study?.rawContent && study.rawContent.length > 50)
    );
    if (!isEvidenceVerified) {
      blockers.push('At least minimum required evidence must be verified by researcher.');
    }

    // 8. Workflow consistency check
    const isWorkflowConsistent = Boolean(
      study &&
      (!study.isLocked || study.documentHashSha256)
    );
    if (!isWorkflowConsistent) {
      blockers.push('Workflow state is inconsistent.');
    }

    return {
      canAppraise: blockers.length === 0,
      blockers,
      warnings,
      metrics: {
        hasDocument,
        hasClassification,
        isHumanVerified,
        hasInstrument,
        isCompatibleInstrument,
        hasValidIncludedDecision,
        isEvidenceVerified,
        isWorkflowConsistent
      },
      latestDecision
    };
  }
}
