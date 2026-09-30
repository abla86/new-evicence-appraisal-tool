import test from 'node:test';
import assert from 'node:assert/strict';

import { validateStudyAppraisalLock } from '../src/utils/appraisalLockValidator.ts';
import { getFrameworkDomains } from '../src/utils/frameworks.ts';

test('Appraisal Lock Validator: Avviser låsing dersom studiedesign er uavklart', () => {
  const mockStudy = {
    id: 'study-test-1',
    title: 'Test study',
    documentType: 'Unspecified / Unknown',
    documentHashSha256: 'a'.repeat(64),
    importedAt: '2026-03-01T12:00:00Z',
    findings: []
  };

  const mockAssessment = {
    id: 'ass-1',
    studyId: 'study-test-1',
    instrument: 'AMSTAR2',
    reviewerId: 'rev-1',
    reviewerName: 'Dr. Test',
    reviewerRole: 'Reviewer',
    ratings: {},
    updatedAt: '2026-03-01T12:00:00Z'
  };

  const result = validateStudyAppraisalLock(mockStudy, mockAssessment);
  assert.equal(result.canLock, false, 'Skal ikke tillate låsing uten validert studiedesign');
  assert.ok(result.blockers.some(b => b.includes('Studiedesign mangler')));
});

test('Appraisal Lock Validator: Avviser låsing dersom obligatoriske kritiske domener mangler svar', () => {
  const mockStudy = {
    id: 'study-test-2',
    title: 'Systematic review of interventions',
    documentType: 'Systematic Review / Meta-Analysis',
    documentHashSha256: 'b'.repeat(64),
    importedAt: '2026-03-01T12:00:00Z',
    findings: []
  };

  // AMSTAR 2 has critical domains: q2, q4, q7, q9, q11, q13, q15
  const mockAssessment = {
    id: 'ass-2',
    studyId: 'study-test-2',
    instrument: 'AMSTAR2',
    reviewerId: 'rev-1',
    reviewerName: 'Dr. Test',
    reviewerRole: 'Reviewer',
    ratings: {
      'amstar2-q1': { answer: 'yes', verifiedByResearcher: true }
      // critical items missing
    },
    updatedAt: '2026-03-01T12:00:00Z'
  };

  const result = validateStudyAppraisalLock(mockStudy, mockAssessment);
  assert.equal(result.canLock, false);
  assert.ok(result.blockers.some(b => b.includes('kritiske')));
});

test('Appraisal Lock Validator: Avviser låsing dersom Human Verification mangler', () => {
  const mockStudy = {
    id: 'study-test-3',
    title: 'Clinical trial',
    documentType: 'Randomized Controlled Trial',
    documentHashSha256: 'c'.repeat(64),
    importedAt: '2026-03-01T12:00:00Z',
    findings: []
  };

  const domains = getFrameworkDomains('ROB2');
  const ratings = {};
  for (const d of domains) {
    ratings[d.id] = { answer: 'yes', verifiedByResearcher: false }; // No human verification!
  }

  const mockAssessment = {
    id: 'ass-3',
    studyId: 'study-test-3',
    instrument: 'ROB2',
    reviewerId: 'rev-bot',
    reviewerName: 'Automated Bot',
    reviewerRole: 'System',
    ratings,
    updatedAt: '2026-03-01T12:00:00Z'
  };

  const result = validateStudyAppraisalLock(mockStudy, mockAssessment, domains);
  assert.equal(result.canLock, false);
  assert.ok(result.blockers.some(b => b.includes('Human Verification mangler')));
});

test('Appraisal Lock Validator: Avviser låsing ved feilaktig evidence ownership', () => {
  const mockStudy = {
    id: 'study-correct-id',
    title: 'Qualitative study',
    documentType: 'Qualitative Research',
    documentHashSha256: 'd'.repeat(64),
    importedAt: '2026-03-01T12:00:00Z',
    findings: [
      { id: 'f-1', studyId: 'foreign-study-999', text: 'Text from another study' }
    ]
  };

  const domains = getFrameworkDomains('JBI_QUALITATIVE');
  const ratings = {};
  for (const d of domains) {
    ratings[d.id] = { answer: 'yes', verifiedByResearcher: true };
  }

  const mockAssessment = {
    id: 'ass-4',
    studyId: 'study-correct-id',
    instrument: 'JBI_QUALITATIVE',
    reviewerId: 'rev-lead',
    reviewerName: 'Dr. Sarah',
    reviewerRole: 'Lead',
    ratings,
    summaryNotes: 'Verified independently by lead researcher with exhaustive reading.',
    updatedAt: '2026-03-01T12:00:00Z'
  };

  const result = validateStudyAppraisalLock(mockStudy, mockAssessment, domains);
  assert.equal(result.canLock, false);
  assert.ok(result.blockers.some(b => b.includes('Evidensproveniensfeil')));
});

test('Appraisal Lock Validator: Godkjenner forsegling når alle metodiske krav og proveniens er oppfylt', () => {
  const mockStudy = {
    id: 'study-valid-id',
    title: 'Helsepersonells erfaringer med tverrsektorielt samarbeid',
    documentType: 'Qualitative Research',
    documentHashSha256: 'e'.repeat(64),
    importedAt: '2026-03-01T12:00:00Z',
    findings: [
      { id: 'f-1', studyId: 'study-valid-id', text: 'Strukturelle barrierer mellom etater' }
    ]
  };

  const domains = getFrameworkDomains('JBI_QUALITATIVE');
  const ratings = {};
  for (const d of domains) {
    ratings[d.id] = { answer: 'yes', verifiedByResearcher: true };
  }

  const mockAssessment = {
    id: 'ass-5',
    studyId: 'study-valid-id',
    instrument: 'JBI_QUALITATIVE',
    reviewerId: 'rev-lead',
    reviewerName: 'Dr. Sarah Lindqvist',
    reviewerRole: 'Lead Reviewer',
    ratings,
    summaryNotes: 'Fullstendig uavhengig kvalitetsvurdering utført i henhold til JBI 2017 metodikk.',
    updatedAt: '2026-03-01T12:00:00Z'
  };

  const result = validateStudyAppraisalLock(mockStudy, mockAssessment, domains);
  assert.equal(result.canLock, true, 'Skal godkjenne forsegling når alle kriterier er oppfylt');
  assert.equal(result.blockers.length, 0);
  assert.equal(result.metrics.humanVerified, true);
  assert.equal(result.metrics.criticalItemsAnswered, true);
  assert.equal(result.metrics.provenanceValid, true);
});

test('Frameworks: ROBINS-I og PRISMA domener er registrert og returnerer ikke AMSTAR2 fallback', () => {
  const robinsDomains = getFrameworkDomains('ROBINS_I');
  assert.equal(robinsDomains.length, 7, 'ROBINS-I skal ha 7 domener');
  assert.ok(robinsDomains.some(d => d.id === 'robins-i-d1'));

  const prismaDomains = getFrameworkDomains('PRISMA');
  assert.equal(prismaDomains.length, 12, 'PRISMA skal ha 12 domener');
  assert.ok(prismaDomains.some(d => d.id === 'prisma-d1'));
});
