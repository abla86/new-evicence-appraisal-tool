import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MasterInstrumentRegistryService } from '../src/services/masterInstrumentRegistry.ts';
import { getFrameworkDomains } from '../src/utils/frameworks.ts';
import { CanonicalAppraisalService } from '../src/services/canonicalAppraisalService.ts';

/**
 * Iron Rule 3 Verification:
 * "Hvert instrument merket IMPLEMENTED skal kjøre i runtime med minst én test.
 *  Ikke komplett? => PARTIALLY_IMPLEMENTED, blokkert i UI."
 */

const ALL_RUNTIME_INSTRUMENTS = [
  'JBI_QUALITATIVE',
  'JBI',
  'AMSTAR2',
  'AGREE2',
  'ROBINS_I',
  'PRISMA',
  'CASP',
  'GRADE',
  'CFIR',
  'KTA'
];

test('Instrument Runtime: All IMPLEMENTED & VERIFIED instruments load valid domains and allow session creation', () => {
  const dummyReviewer = { id: 'rev-lead', name: 'Dr. Lead Reviewer', role: 'Lead Reviewer' };

  for (const instCode of ALL_RUNTIME_INSTRUMENTS) {
    const entry = MasterInstrumentRegistryService.getByCode(instCode);
    assert.ok(entry, `Instrument ${instCode} må finnes i MasterInstrumentRegistry`);
    assert.ok(
      entry.implementationStatus === 'IMPLEMENTED' || entry.implementationStatus === 'VERIFIED',
      `Instrument ${instCode} må ha status IMPLEMENTED eller VERIFIED, fikk: ${entry.implementationStatus}`
    );

    // Verify domains from frameworks.ts
    const domains = getFrameworkDomains(instCode);
    assert.ok(Array.isArray(domains), `Domains for ${instCode} må være et array`);
    assert.ok(domains.length > 0, `Domains for ${instCode} må ha minst 1 domene`);
    assert.ok(
      domains.length >= entry.itemCount,
      `${instCode}: domain count (${domains.length}) må være minst registry itemCount (${entry.itemCount})`
    );

    // Verify domain properties
    for (const d of domains) {
      assert.ok(d.id, `${instCode}: Domene må ha gyldig id`);
      assert.ok(typeof d.number === 'number', `${instCode}: Domene må ha nummer`);
      assert.ok(d.title && d.title.length > 0, `${instCode}: Domene må ha tittel`);
      assert.ok(d.question && d.question.length > 0, `${instCode}: Domene må ha spørsmål`);
      assert.ok(Array.isArray(d.allowedAnswers) && d.allowedAnswers.length > 0, `${instCode}: Domene må ha allowedAnswers`);
    }

    // Verify canonical appraisal session creation & rating in runtime
    const studyId = `study-inst-test-${instCode.toLowerCase()}`;
    const session = CanonicalAppraisalService.getOrCreateSession(studyId, instCode, dummyReviewer);
    assert.equal(session.studyId, studyId);
    assert.equal(session.instrumentId, instCode);

    const firstDomain = domains[0];
    const testAnswer = firstDomain.allowedAnswers[0];
    const saveRes = CanonicalAppraisalService.saveResponse(
      studyId,
      instCode,
      firstDomain.id,
      {
        answer: testAnswer,
        rationale: `Runtime test response for ${instCode}`,
        verifiedByResearcher: true,
        timestamp: new Date().toISOString()
      },
      dummyReviewer
    );

    assert.equal(saveRes.success, true, `saveResponse må lykkes for ${instCode}`);
    assert.equal(saveRes.session.responses[firstDomain.id].answer, testAnswer);
  }
});

test('Instrument Runtime: Cochrane RoB 2 is honestly marked as PARTIALLY_IMPLEMENTED', () => {
  const rob2Entry = MasterInstrumentRegistryService.getByCode('ROB2');
  assert.ok(rob2Entry, 'ROB2 må finnes i registret');
  assert.equal(rob2Entry.implementationStatus, 'PARTIALLY_IMPLEMENTED', 'ROB2 må ha status PARTIALLY_IMPLEMENTED pga. manglende 22 signalskjemaspørsmål');
  assert.ok(rob2Entry.methodologicalCaveat.includes('signalskjemaspørsmål'), 'Må dokumentere metodisk caveat om signalskjema');

  const rob2Domains = getFrameworkDomains('ROB2');
  assert.equal(rob2Domains.length, 5, 'ROB2 har 5 kjernedomener i foreløpig implementasjon');
});

test('Instrument Runtime: Registered non-runtime instruments are marked REGISTERED', () => {
  const registeredCodes = ['ROBIS', 'QUADAS2', 'QUIPS', 'MMAT', 'CERQUAL', 'PROBAST'];
  for (const code of registeredCodes) {
    const entry = MasterInstrumentRegistryService.getByCode(code);
    assert.ok(entry, `Verktøyet ${code} må være registrert for transparens`);
    assert.equal(entry.implementationStatus, 'REGISTERED', `${code} må ha status REGISTERED`);
    assert.ok(entry.methodologicalCaveat.length > 0, `${code} må ha caveat om at det ikke er i aktiv kjøretid`);
  }
});
