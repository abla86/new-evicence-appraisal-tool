import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { ScreeningGateService } from '../src/services/screeningGateService.ts';
import { CanonicalAppraisalService } from '../src/services/canonicalAppraisalService.ts';
import { RbacService } from '../src/services/rbacService.ts';
import { DocumentParserService } from '../src/services/documentParserService.ts';
import { MasterInstrumentRegistryService } from '../src/services/masterInstrumentRegistry.ts';
import { buildSourceRecord } from '../src/services/sourceRecordService.ts';

// Test Suite 1: Screening Gate & Decision Model
test('Screening Gate: Blocker when no screening decision exists', () => {
  ScreeningGateService.clearState();

  const study = {
    id: 'study-int-01',
    title: 'Trial on Digital Health Interventions',
    documentType: 'Randomized Controlled Trial',
    classificationVerifiedByResearcher: true,
    rawContent: 'A detailed randomized controlled trial evaluating health interventions with full reporting.'
  };

  const result = ScreeningGateService.validateScreeningGate(study, 'ROB2', {
    isHumanVerified: true,
    evidenceVerified: true
  });

  assert.equal(result.canAppraise, false);
  assert.ok(
    result.blockers.includes('INCLUDED screening decision required before appraisal.'),
    'Må inneholde den eksplisitte feilmeldingen om INCLUDED-krav'
  );
});

test('Screening Gate: Passes when valid INCLUDED decision exists for the study', () => {
  ScreeningGateService.clearState();

  const study = {
    id: 'study-int-02',
    title: 'Qualitative Exploration of Patient Experiences',
    documentType: 'Qualitative Research',
    classificationVerifiedByResearcher: true,
    rawContent: 'A comprehensive qualitative interview study following thematic analysis guidelines.'
  };

  // Record an INCLUDED screening decision
  ScreeningGateService.recordDecision(study.id, 'INCLUDED', 'reviewer-sarah', 'Meets full PICO criteria');

  const result = ScreeningGateService.validateScreeningGate(study, 'JBI_QUALITATIVE', {
    isHumanVerified: true,
    evidenceVerified: true
  });

  assert.equal(result.canAppraise, true);
  assert.equal(result.blockers.length, 0);
  assert.equal(result.metrics.hasValidIncludedDecision, true);
});

test('Screening Gate: Blocks appraisal when study is EXCLUDED in screening', () => {
  ScreeningGateService.clearState();

  const study = {
    id: 'study-int-03',
    title: 'Irrelevant Population Cohort',
    documentType: 'Observational Cohort',
    classificationVerifiedByResearcher: true,
    rawContent: 'Observational cohort study outside population criteria.'
  };

  ScreeningGateService.recordDecision(study.id, 'EXCLUDED', 'reviewer-sarah', 'Wrong target demographic');

  const result = ScreeningGateService.validateScreeningGate(study, 'CASP', {
    isHumanVerified: true,
    evidenceVerified: true
  });

  assert.equal(result.canAppraise, false);
  assert.ok(
    result.blockers.some(b => b.includes('Study is EXCLUDED in screening')),
    'Ekskludert studie skal blokkeres'
  );
});

test('Screening Gate: Requires human verification of study design', () => {
  ScreeningGateService.clearState();

  const study = {
    id: 'study-int-04',
    title: 'Unverified Automated Intake Study',
    documentType: 'Randomized Controlled Trial',
    classificationVerifiedByResearcher: false,
    rawContent: 'Trial text without human confirmation.'
  };

  ScreeningGateService.recordDecision(study.id, 'INCLUDED', 'reviewer-sarah');

  const result = ScreeningGateService.validateScreeningGate(study, 'ROB2', {
    isHumanVerified: false,
    evidenceVerified: true
  });

  assert.equal(result.canAppraise, false);
  assert.ok(
    result.blockers.some(b => b.includes('Human verification of study design classification is required.')),
    'Mangler human verification'
  );
});

// Test Suite 2: Canonical Appraisal Session & Sealing
test('Canonical Appraisal: Session is singular and enforces locking & reopening', () => {
  CanonicalAppraisalService.clearSessions();

  const studyId = 'study-session-01';
  const reviewerLead = { id: 'rev-lead', name: 'Dr. Lead', role: 'Lead Reviewer' };
  const reviewerReader = { id: 'rev-read', name: 'Observer', role: 'Read-only' };

  // 1. Get or create session
  const session = CanonicalAppraisalService.getOrCreateSession(studyId, 'JBI_QUALITATIVE', reviewerLead);
  assert.equal(session.studyId, studyId);
  assert.equal(session.isLocked, false);

  // 2. Save a response as Lead
  const saveRes = CanonicalAppraisalService.saveResponse(
    studyId,
    'JBI_QUALITATIVE',
    'jbi-q1',
    {
      answer: 'yes',
      rationale: 'Klar filosofisk forankring i hermeneutisk fenomenologi.',
      verifiedByResearcher: true,
      timestamp: new Date().toISOString()
    },
    reviewerLead
  );
  assert.equal(saveRes.success, true);
  assert.equal(saveRes.session.responses['jbi-q1'].answer, 'yes');

  // 3. Read-only cannot mutate response
  const readRes = CanonicalAppraisalService.saveResponse(
    studyId,
    'JBI_QUALITATIVE',
    'jbi-q1',
    {
      answer: 'no',
      rationale: 'Forsøk på endring fra read-only.',
      verifiedByResearcher: false,
      timestamp: new Date().toISOString()
    },
    reviewerReader
  );
  assert.equal(readRes.success, false);

  // 4. Finalize and Lock Session
  const lockRes = CanonicalAppraisalService.finalizeAndLockSession(
    studyId,
    'JBI_QUALITATIVE',
    reviewerLead,
    {
      canLock: true,
      blockers: [],
      warnings: [],
      metrics: {
        hasValidDesign: true,
        hasValidInstrument: true,
        criticalItemsAnswered: true,
        unansweredCriticalDomains: [],
        humanVerified: true,
        evidenceOwnershipValid: true,
        provenanceValid: true,
        completionPercentage: 100
      }
    }
  );
  assert.equal(lockRes.success, true);
  assert.equal(lockRes.session.isLocked, true);
  assert.ok(lockRes.session.sealedSha256 && lockRes.session.sealedSha256.length === 64);

  // 5. Attempting to mutate locked session fails
  const mutateLocked = CanonicalAppraisalService.saveResponse(
    studyId,
    'JBI_QUALITATIVE',
    'jbi-q2',
    {
      answer: 'yes',
      rationale: 'Forsøk på skriving i låst sesjon.',
      verifiedByResearcher: true,
      timestamp: new Date().toISOString()
    },
    reviewerLead
  );
  assert.equal(mutateLocked.success, false);
  assert.ok(mutateLocked.error && mutateLocked.error.includes('låst og forseglet'));

  // 6. Reopening requires explicit justification
  const emptyJustify = CanonicalAppraisalService.reopenSession(
    studyId,
    'JBI_QUALITATIVE',
    reviewerLead,
    'Kort'
  );
  assert.equal(emptyJustify.success, false);

  const validReopen = CanonicalAppraisalService.reopenSession(
    studyId,
    'JBI_QUALITATIVE',
    reviewerLead,
    'Tilleggsinformasjon innhentet fra korresponderende forfatter angående datametning.'
  );
  assert.equal(validReopen.success, true);
  assert.equal(validReopen.session.isLocked, false);
  assert.equal(validReopen.session.reopenJustification?.includes('Tilleggsinformasjon'), true);
});

// Test Suite 3: RBAC Service
test('RBAC: Strictly enforces role boundaries without trusting raw strings', () => {
  assert.equal(RbacService.authorize('Lead Reviewer', 'LOCK_APPRAISAL').authorized, true);
  assert.equal(RbacService.authorize('Consensus Arbiter', 'LOCK_APPRAISAL').authorized, true);
  assert.equal(RbacService.authorize('Independent Reviewer', 'LOCK_APPRAISAL').authorized, false);
  assert.equal(RbacService.authorize('Read-only', 'EDIT_APPRAISAL').authorized, false);

  // Reopen authorization
  assert.equal(RbacService.authorize('Lead Reviewer', 'REOPEN_APPRAISAL').authorized, true);
  assert.equal(RbacService.authorize('Methodology Auditor', 'REOPEN_APPRAISAL').authorized, true);
  assert.equal(RbacService.authorize('Researcher', 'REOPEN_APPRAISAL').authorized, false);

  // Server-side header verification
  assert.equal(RbacService.verifyServerAuthorization(undefined, 'LOCK_APPRAISAL').authorized, false);
  assert.equal(RbacService.verifyServerAuthorization('HackerRole', 'LOCK_APPRAISAL').authorized, false);
  assert.equal(RbacService.verifyServerAuthorization('Lead Reviewer', 'LOCK_APPRAISAL').authorized, true);
});

// Test Suite 4: Document Parser & Honest OCR Status
test('Document Parser: Rejects empty or corrupt inputs and handles scanned files honestly', async () => {
  // Empty content
  const emptyRes = await DocumentParserService.parseFile('empty.txt', 0, '');
  assert.equal(emptyRes.success, false);
  assert.equal(emptyRes.error?.code, 'FILE_EMPTY');

  // Scanned PDF simulation (binary PDF signature without text)
  const scannedRes = await DocumentParserService.parseFile(
    'scanned_doc.pdf',
    400,
    '%PDF-1.4 %%EOF scanned image only'
  );
  assert.equal(scannedRes.success, true);
  assert.equal(scannedRes.isOcrRequired, true);
  assert.equal(scannedRes.ocrStatus, 'OCR_REQUIRED');
  assert.equal(scannedRes.ocrConfidence, null, 'Ingen falsk numerisk ocrConfidence skal genereres');

  // Valid text document with DOI
  const validText = `Title: Digital Health in Chronic Disease Management
DOI: 10.1016/j.jamia.2024.01.002
Abstract: This randomized controlled trial evaluates the efficacy of remote digital coaching.
Introduction: Telemedicine has transformed healthcare delivery.`;

  const validRes = await DocumentParserService.parseFile('article.txt', validText.length, validText);
  assert.equal(validRes.success, true);
  assert.equal(validRes.extractedDoi, '10.1016/j.jamia.2024.01.002');
  assert.equal(validRes.suggestedStudyDesign, 'Randomized Controlled Trial');
  assert.equal(validRes.ocrStatus, 'NOT_NEEDED');
});

// Test Suite 5: Master Instrument Registry Integrity
test('Master Instrument Registry: Honest implementation status and no fake cut-offs', () => {
  const all = MasterInstrumentRegistryService.getAll();
  assert.ok(all.length >= 10, 'Registry skal inneholde alle etablerte instrumenter');

  const jbi = MasterInstrumentRegistryService.getByCode('JBI_QUALITATIVE');
  assert.ok(jbi);
  assert.equal(jbi.hasOfficialNumericalCutoff, false, 'JBI har ingen offisiell numerisk cut-off');
  assert.equal(jbi.implementationStatus, 'VERIFIED');

  const agree2 = MasterInstrumentRegistryService.getByCode('AGREE2');
  assert.ok(agree2);
  assert.equal(agree2.itemCount, 23);
  assert.equal(agree2.scoringModel, 'STANDARDIZED_DOMAINS');

  const amstar2 = MasterInstrumentRegistryService.getByCode('AMSTAR2');
  assert.ok(amstar2);
  assert.equal(amstar2.criticalItemCount, 7);
  assert.equal(amstar2.scoringModel, 'CRITICAL_FLAWS_CONFIDENCE');

  const rob2 = MasterInstrumentRegistryService.getByCode('ROB2');
  assert.ok(rob2);
  assert.equal(rob2.implementationStatus, 'PARTIALLY_IMPLEMENTED', 'RoB 2 er ærlig merket som delvis implementert');

  const grade = MasterInstrumentRegistryService.getByCode('GRADE');
  assert.ok(grade);
  assert.equal(grade.hasOfficialNumericalCutoff, false, 'GRADE har ingen uoffisiell magisk kalkulator');
});

// Test Suite 6: Cross-Platform Dev Launcher Safety
test('Dev launcher: scripts/dev.mjs is structured to prevent Windows spawn EFTYPE', () => {
  const devMjsPath = path.resolve('./scripts/dev.mjs');
  assert.ok(fs.existsSync(devMjsPath), 'scripts/dev.mjs må eksistere');

  const content = fs.readFileSync(devMjsPath, 'utf-8');
  assert.ok(content.includes('process.execPath'), 'Dev launcher må bruke process.execPath for å hindre EFTYPE');
  assert.ok(content.includes('shell: false'), 'Dev launcher må ikke bruke shell: true på Windows');
  assert.ok(content.includes('SIGINT') && content.includes('SIGTERM'), 'Dev launcher må håndtere ren terminering');
});

// Test Suite 7: Canonical SourceRecord Builder Contract
test('SourceRecord Builder: Generates consistent IDs, parsed authors, defaults, and deterministic SHA-256', () => {
  const record = buildSourceRecord({
    projectId: 'proj-123',
    sourceOrigin: 'PubMed',
    sourceId: '38291024',
    title: 'Digital Health Interventions in Clinical Practice',
    authors: 'Lindqvist, Sarah; Hansen, Thomas',
    year: '2024',
    journal: 'Journal of Medical Internet Research',
    doi: '10.2196/45120'
  });

  assert.ok(record.id.startsWith('SRC'), 'ID skal genereres med sikker SRC-prefix');
  assert.equal(record.projectId, 'proj-123');
  assert.equal(record.sourceOrigin, 'PubMed');
  assert.equal(record.sourceId, '38291024');
  assert.equal(record.screeningStatus, 'UNSCREENED');
  assert.deepEqual(record.authors, ['Lindqvist, Sarah', 'Hansen, Thomas']);
  assert.ok(record.provenanceHashSha256 && record.provenanceHashSha256.length === 64, 'Skal generere gyldig 64-tegns SHA-256');

  // Verify deterministic hash for identical content and provenance baseline
  const fixedImportedAt = '2026-09-01T12:00:00.000Z';
  const baselineA = buildSourceRecord({
    id: 'SRC-fixed-01',
    projectId: 'proj-123',
    sourceOrigin: 'PubMed',
    title: 'Digital Health Interventions in Clinical Practice',
    authors: ['Lindqvist, Sarah', 'Hansen, Thomas'],
    year: '2024',
    doi: '10.2196/45120',
    importedAt: fixedImportedAt
  });
  const baselineB = buildSourceRecord({
    id: 'SRC-fixed-01',
    projectId: 'proj-123',
    sourceOrigin: 'PubMed',
    title: 'Digital Health Interventions in Clinical Practice',
    authors: 'Lindqvist, Sarah; Hansen, Thomas',
    year: '2024',
    doi: '10.2196/45120',
    importedAt: fixedImportedAt
  });
  assert.equal(baselineA.provenanceHashSha256, baselineB.provenanceHashSha256, 'Deterministisk hash må stemme for identisk innhold');
});

