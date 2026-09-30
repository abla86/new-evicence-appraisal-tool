/**
 * CanonicalAppraisalService
 *
 * The single authoritative authority for appraisal sessions in the system.
 * Prevents fragmented, unverified, or parallel appraisal sessions.
 *
 * Implements:
 * - Deterministic session indexing by (studyId, instrumentId)
 * - Strict locking on finalization with SHA-256 cryptographic sealing
 * - Mandatory justification and role checks for reopening
 * - Full audit trail integration
 */

import type { 
  AppraisalInstrument, 
  DomainRating, 
  ReviewerProfile, 
  AuditLogEntry 
} from '../types/index.ts';
import { RbacService } from './rbacService.ts';
import { calculateSha256Sync, generateSecureId } from '../utils/crypto.ts';
import type { AppraisalLockValidationResult } from '../utils/appraisalLockValidator.ts';

export interface CanonicalAppraisalSession {
  sessionId: string;
  studyId: string;
  documentId?: string;
  studyDesign?: string;
  screeningDecision?: string;
  instrumentId: AppraisalInstrument;
  instrumentVersion: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  responses: Record<string, DomainRating>;
  evidenceIds: string[];
  provenance?: string[];
  result?: unknown;
  lifecycleState: 'DRAFT' | 'IN_PROGRESS' | 'LOCKED_FINALIZED' | 'REOPENED';
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  finalizedBy?: string;
  sealedSha256?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenJustification?: string;
  auditTrail: AuditLogEntry[];
}

export interface CanonicalAppraisalExport {
  sessionId: string;
  studyId: string;
  documentId?: string;
  studyDesign?: string;
  screeningDecision?: string;
  provenance?: string[];
  result?: unknown;
  lifecycleState: 'DRAFT' | 'IN_PROGRESS' | 'LOCKED_FINALIZED' | 'REOPENED';
  instrumentId: AppraisalInstrument;
  instrumentVersion: string;
  reviewer: {
    id: string;
    name: string;
    role: string;
  };
  isLocked: boolean;
  sealedSha256?: string;
  finalizedAt?: string;
  responses: Record<string, DomainRating>;
  auditTrail: AuditLogEntry[];
  exportedAt: string;
}

const sessionsStore = new Map<string, CanonicalAppraisalSession>();

export class CanonicalAppraisalService {
  /**
   * Clears in-memory session cache (used for clean test isolation).
   */
  public static clearSessions(): void {
    sessionsStore.clear();
  }

  /**
   * Creates a deterministic composite key for a study + instrument session.
   */
  public static getSessionKey(studyId: string, instrumentId: AppraisalInstrument): string {
    return `${studyId}::${instrumentId}`;
  }

  /**
   * Retrieves an existing session or creates a new canonical session.
   */
  public static getOrCreateSession(
    studyId: string,
    instrumentId: AppraisalInstrument,
    reviewer: ReviewerProfile,
    initialResponses?: Record<string, DomainRating>,
    metadata?: {
      documentId?: string;
      studyDesign?: string;
      screeningDecision?: string;
      provenance?: string[];
      result?: unknown;
    }
  ): CanonicalAppraisalSession {
    if (!studyId) {
      throw new Error('Valid studyId is required to access an appraisal session.');
    }
    if (!instrumentId) {
      throw new Error('Valid instrumentId is required to access an appraisal session.');
    }

    const key = this.getSessionKey(studyId, instrumentId);
    let session = sessionsStore.get(key);

    if (!session) {
      const now = new Date().toISOString();
      const hasInitialResponses = Boolean(initialResponses && Object.keys(initialResponses).length > 0);
      session = {
        sessionId: generateSecureId('sess'),
        studyId,
        documentId: metadata?.documentId,
        studyDesign: metadata?.studyDesign,
        screeningDecision: metadata?.screeningDecision,
        instrumentId,
        instrumentVersion: this.getInstrumentStandardVersion(instrumentId),
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
        reviewerRole: reviewer.role,
        responses: initialResponses ? { ...initialResponses } : {},
        evidenceIds: [],
        provenance: metadata?.provenance || [],
        result: metadata?.result,
        lifecycleState: hasInitialResponses ? 'IN_PROGRESS' : 'DRAFT',
        isLocked: false,
        createdAt: now,
        updatedAt: now,
        auditTrail: [
          {
            id: generateSecureId('audit-init'),
            timestamp: now,
            action: 'PERFORM_APPRAISAL',
            entityType: 'AppraisalAssessment',
            entityId: studyId,
            user: reviewer.name,
            details: `Kanonisk appraisal session initialisert for instrument ${instrumentId} av ${reviewer.name} (${reviewer.role})`,
            hashSha256: calculateSha256Sync(`INIT:${studyId}:${instrumentId}:${now}`),
            previousHashSha256: 'GENESIS_APPRAISAL'
          }
        ]
      };
      sessionsStore.set(key, session);
    }

    return session;
  }

  /**
   * Gets session by study and instrument.
   */
  public static getSession(
    studyId: string,
    instrumentId: AppraisalInstrument
  ): CanonicalAppraisalSession | undefined {
    return sessionsStore.get(this.getSessionKey(studyId, instrumentId));
  }

  /**
   * Saves or updates a domain response within a session.
   * Rejects mutations if the session is locked.
   */
  public static saveResponse(
    studyId: string,
    instrumentId: AppraisalInstrument,
    domainId: string,
    rating: DomainRating,
    reviewer: ReviewerProfile
  ): { session: CanonicalAppraisalSession; success: boolean; error?: string } {
    const session = this.getOrCreateSession(studyId, instrumentId, reviewer);

    if (session.isLocked) {
      return {
        session,
        success: false,
        error: 'Vurderingen er låst og forseglet. Modifikasjon er avvist. Sesjonen må gjenåpnes eksplisitt av Lead Reviewer med begrunnelse.'
      };
    }

    const auth = RbacService.authorize(reviewer.role, 'EDIT_APPRAISAL');
    if (!auth.authorized) {
      return {
        session,
        success: false,
        error: auth.reason || 'Rollen din har ikke skriverettigheter til denne vurderingen.'
      };
    }

    session.responses[domainId] = {
      ...rating
    };
    if (session.lifecycleState === 'DRAFT') {
      session.lifecycleState = 'IN_PROGRESS';
    }
    session.updatedAt = new Date().toISOString();

    return {
      session,
      success: true
    };
  }

  /**
   * Finalizes and locks an appraisal session.
   * Requires authorization and complete validation pass.
   */
  public static finalizeAndLockSession(
    studyId: string,
    instrumentId: AppraisalInstrument,
    reviewer: ReviewerProfile,
    validationResult: AppraisalLockValidationResult
  ): { session: CanonicalAppraisalSession; success: boolean; error?: string; blockers?: string[] } {
    const session = this.getOrCreateSession(studyId, instrumentId, reviewer);

    const auth = RbacService.authorize(reviewer.role, 'LOCK_APPRAISAL');
    if (!auth.authorized) {
      return {
        session,
        success: false,
        error: auth.reason || 'Ikke autorisert til å forsegle denne vurderingen.'
      };
    }

    if (!validationResult.canLock) {
      return {
        session,
        success: false,
        error: 'Metodiske forseglingskrav ikke oppfylt.',
        blockers: validationResult.blockers
      };
    }

    const now = new Date().toISOString();
    const payloadForSeal = JSON.stringify({
      studyId,
      instrumentId,
      responses: session.responses,
      evidenceIds: session.evidenceIds,
      finalizedBy: reviewer.name,
      finalizedAt: now
    });
    const sealedHash = calculateSha256Sync(payloadForSeal);
    const prevHash = session.auditTrail[session.auditTrail.length - 1]?.hashSha256 || 'PREV_SEAL';

    session.isLocked = true;
    session.lifecycleState = 'LOCKED_FINALIZED';
    session.finalizedAt = now;
    session.finalizedBy = `${reviewer.name} (${reviewer.role})`;
    session.sealedSha256 = sealedHash;
    session.updatedAt = now;

    session.auditTrail.push({
      id: generateSecureId('audit-lock'),
      timestamp: now,
      action: 'LOCK_STUDY',
      entityType: 'AppraisalAssessment',
      entityId: studyId,
      user: reviewer.name,
      details: `Appraisal forseglet med SHA-256 (${sealedHash.substring(0, 16)}...). Låst mot endring.`,
      hashSha256: sealedHash,
      previousHashSha256: prevHash
    });

    return {
      session,
      success: true
    };
  }

  /**
   * Reopens a locked session with mandatory audit trail logging and justification.
   */
  public static reopenSession(
    studyId: string,
    instrumentId: AppraisalInstrument,
    reviewer: ReviewerProfile,
    justification: string
  ): { session: CanonicalAppraisalSession; success: boolean; error?: string } {
    const session = this.getSession(studyId, instrumentId);
    if (!session) {
      return {
        session: this.getOrCreateSession(studyId, instrumentId, reviewer),
        success: false,
        error: 'Sesjon ikke funnet.'
      };
    }

    if (!session.isLocked) {
      return {
        session,
        success: true
      };
    }

    const auth = RbacService.authorize(reviewer.role, 'REOPEN_APPRAISAL');
    if (!auth.authorized) {
      return {
        session,
        success: false,
        error: auth.reason || 'Rollen har ikke tilgang til å gjenåpne en forseglet vurdering.'
      };
    }

    if (!justification || justification.trim().length < 10) {
      return {
        session,
        success: false,
        error: 'Obligatorisk metodisk begrunnelse (minst 10 tegn) kreves for å gjenåpne en forseglet vurdering.'
      };
    }

    const now = new Date().toISOString();
    const prevHash = session.auditTrail[session.auditTrail.length - 1]?.hashSha256 || 'PREV_REOPEN';
    const reopenHash = calculateSha256Sync(`REOPEN:${studyId}:${now}:${justification}`);

    session.isLocked = false;
    session.lifecycleState = 'REOPENED';
    session.reopenedAt = now;
    session.reopenedBy = `${reviewer.name} (${reviewer.role})`;
    session.reopenJustification = justification.trim();
    session.updatedAt = now;

    session.auditTrail.push({
      id: generateSecureId('audit-reopen'),
      timestamp: now,
      action: 'PERFORM_APPRAISAL',
      entityType: 'AppraisalAssessment',
      entityId: studyId,
      user: reviewer.name,
      details: `Vurdering gjenåpnet av ${reviewer.name}. Begrunnelse: "${justification.trim()}" (Tidligere forsegling: ${session.sealedSha256?.substring(0, 12)}...)`,
      hashSha256: reopenHash,
      previousHashSha256: prevHash
    });

    return {
      session,
      success: true
    };
  }

  /**
   * Exports the appraisal session with complete traceability metadata.
   */
  public static exportSession(
    studyId: string,
    instrumentId: AppraisalInstrument
  ): CanonicalAppraisalExport | undefined {
    const session = this.getSession(studyId, instrumentId);
    if (!session) return undefined;

    return {
      sessionId: session.sessionId,
      studyId: session.studyId,
      documentId: session.documentId,
      studyDesign: session.studyDesign,
      screeningDecision: session.screeningDecision,
      provenance: session.provenance,
      result: session.result,
      lifecycleState: session.lifecycleState,
      instrumentId: session.instrumentId,
      instrumentVersion: session.instrumentVersion,
      reviewer: {
        id: session.reviewerId,
        name: session.reviewerName,
        role: session.reviewerRole
      },
      isLocked: session.isLocked,
      sealedSha256: session.sealedSha256,
      finalizedAt: session.finalizedAt,
      responses: { ...session.responses },
      auditTrail: [...session.auditTrail],
      exportedAt: new Date().toISOString()
    };
  }

  private static getInstrumentStandardVersion(instrument: AppraisalInstrument): string {
    switch (instrument) {
      case 'JBI_QUALITATIVE': return '2017';
      case 'AMSTAR2': return '2017';
      case 'AGREE2': return '2017';
      case 'ROB2': return '2019';
      case 'ROBINS_I': return '2016';
      case 'PRISMA': return '2020';
      case 'CASP': return '2018';
      case 'GRADE': return '2013';
      case 'CFIR': return '2.0';
      case 'KTA': return '2006';
      default: return '1.0';
    }
  }
}
