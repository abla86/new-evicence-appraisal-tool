import test from 'node:test';
import assert from 'node:assert/strict';
import { StudyDesignGateService } from '../src/services/studyDesignGateService.ts';

test('StudyDesignGateService: unknown-uncertain returnerer ingen automatisk instrumentanbefaling', () => {
  const rec = StudyDesignGateService.getDesignRecommendation('unknown-uncertain');
  
  assert.equal(rec.designId, 'unknown-uncertain');
  assert.equal(rec.primaryInstrumentId, undefined, 'primaryInstrumentId skal være undefined for unknown-uncertain');
  assert.equal(rec.primaryInstrumentLabel, undefined);
  assert.equal(rec.isClarified, false, 'isClarified skal være false');
});

test('StudyDesignGateService: validateCompatibility() returnerer UNKNOWN ved ukjent/uavklart design', () => {
  // Test med eksplisitt 'unknown-uncertain'
  const res1 = StudyDesignGateService.validateCompatibility('unknown-uncertain', 'JBI_QUALITATIVE');
  assert.equal(res1.status, 'UNKNOWN', 'Status skal være UNKNOWN ved unknown-uncertain');
  assert.equal(res1.canAppraise, false);
  assert.equal(res1.primaryInstrumentId, undefined);

  // Test med undefined design
  const res2 = StudyDesignGateService.validateCompatibility(undefined, 'AMSTAR2');
  assert.equal(res2.status, 'UNKNOWN', 'Status skal være UNKNOWN ved udefinert design');
  assert.equal(res2.canAppraise, false);

  // Test med tomt design
  const res3 = StudyDesignGateService.validateCompatibility('', 'CASP');
  assert.equal(res3.status, 'UNKNOWN', 'Status skal være UNKNOWN ved tomt design');
});

test('StudyDesignGateService: Kasus-kontroll er koblet mot casp-case-control (aldri casp-cohort)', () => {
  const rec = StudyDesignGateService.getDesignRecommendation('case-control');
  
  assert.equal(rec.primaryInstrumentId, 'casp-case-control', 'Skal koble til casp-case-control');
  assert.notEqual(rec.primaryInstrumentId, 'casp-cohort', 'Skal ALDRI koble kasus-kontroll til casp-cohort');

  // Test inkompatibilitet ved bruk av kohort-verktøy på kasus-kontroll
  const compatWithCohort = StudyDesignGateService.validateCompatibility('case-control', 'casp-cohort');
  assert.equal(compatWithCohort.status, 'INCOMPATIBLE', 'Bruk av casp-cohort på kasus-kontroll skal være inkompatibel');
  assert.equal(compatWithCohort.canAppraise, false);

  // Test kompatibilitet ved bruk av rett verktøy
  const compatWithCorrect = StudyDesignGateService.validateCompatibility('case-control', 'casp-case-control');
  assert.equal(compatWithCorrect.status, 'COMPATIBLE');
  assert.equal(compatWithCorrect.canAppraise, true);
});

test('StudyDesignGateService: Scoping review er koblet mot prisma-scr (ikke prisma-2020)', () => {
  const rec = StudyDesignGateService.getDesignRecommendation('scoping-review');
  
  assert.equal(rec.primaryInstrumentId, 'prisma-scr', 'Skal koble til prisma-scr');
  assert.notEqual(rec.primaryInstrumentId, 'prisma-2020');

  // Standard PRISMA 2020 gir kun delvis match med veiledning om PRISMA-ScR
  const compatPrisma = StudyDesignGateService.validateCompatibility('scoping-review', 'prisma-2020');
  assert.equal(compatPrisma.status, 'PARTIAL');
  assert.match(compatPrisma.message, /PRISMA-ScR/);
});

test('StudyDesignGateService: Kvalitativ syntese har casp-systematic-review som primærvalg, med CERQual som alternativt certainty-framework', () => {
  const rec = StudyDesignGateService.getDesignRecommendation('qualitative-synthesis');
  
  assert.equal(rec.primaryInstrumentId, 'casp-systematic-review', 'Primærinstrument for review-prosessen skal være CASP systematic review');
  assert.notEqual(rec.primaryInstrumentId, 'grade-cerqual', 'GRADE-CERQual skal ikke være primært appraisal for review-metodikk');

  // Sjekk at CERQual finnes blant alternativeFrameworks som certainty framework
  const cerqualFramework = rec.alternativeFrameworks.find(f => f.id === 'grade-cerqual');
  assert.ok(cerqualFramework, 'GRADE-CERQual må finnes som alternativt rammeverk');
  assert.equal(cerqualFramework.role, 'certainty_framework');

  // Validering av CERQual mot kvalitativ syntese
  const res = StudyDesignGateService.validateCompatibility('qualitative-synthesis', 'grade-cerqual');
  assert.equal(res.status, 'PARTIAL');
  assert.match(res.message, /certainty of qualitative findings/);
});
