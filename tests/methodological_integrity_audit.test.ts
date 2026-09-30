import test from 'node:test';
import assert from 'node:assert/strict';
import { CsvParser } from '../src/utils/csvParser.ts';
import { EvidenceTraceabilityService } from '../src/services/evidenceTraceabilityService.ts';
import { generateDocxBlob } from '../src/utils/docxExporter.ts';
import { calculateCohensKappa, evaluateAgree2DomainScores } from '../src/utils/statistics.ts';
import { MasterInstrumentRegistryService } from '../src/services/masterInstrumentRegistry.ts';

test('Audit Suite 1: CsvParser handles standard and RFC 4180 edge cases', () => {
  const csvData = `id,title,authors,"abstract, with comma"\n1,"Study A","Smith, J.","Here is a quoted text with, comma"\n2,"Study B","Doe, A.","Second quote"`;
  const result = CsvParser.parse(csvData);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0]['id'], '1');
  assert.equal(result.rows[0]['title'], 'Study A');
  assert.equal(result.rows[0]['abstract, with comma'], 'Here is a quoted text with, comma');
  assert.equal(result.rows[1]['title'], 'Study B');
});

test('Audit Suite 2: EvidenceTraceabilityService verifies exact, normalized, and rejects invalid quotes', () => {
  const docText = `
    Introduction
    Patient autonomy in geriatric healthcare is a paramount ethical imperative.
    Methods
    A qualitative phenomenological approach was used with 15 participants across three nursing homes.
    Results
    Participants expressed fear of losing control over daily medication schedules.
    Discussion
    The findings align with previous Scandinavian studies.
  `;

  // 1. Exact match
  const exact = EvidenceTraceabilityService.verifyQuote(docText, 'Patient autonomy in geriatric healthcare');
  assert.equal(exact.isVerified, true);
  assert.equal(exact.matchType, 'EXACT_MATCH');
  assert.equal(exact.confidence, 1.0);

  // 2. Normalized match (extra spaces and lower/upper case)
  const normalized = EvidenceTraceabilityService.verifyQuote(docText, '  patient   autonomy   in  geriatric  healthcare  ');
  assert.equal(normalized.isVerified, true);
  assert.equal(normalized.matchType, 'NORMALIZED_MATCH');

  // 3. Not found
  const notFound = EvidenceTraceabilityService.verifyQuote(docText, 'A double-blind randomized clinical trial of 5000 patients');
  assert.equal(notFound.isVerified, false);
  assert.equal(notFound.matchType, 'NOT_FOUND');

  // 4. Empty quote handling
  const empty = EvidenceTraceabilityService.verifyQuote(docText, '   ');
  assert.equal(empty.isVerified, false);
});

test('Audit Suite 3: Cohen\'s Kappa ignores unrated/unclear domains rather than counting as agreement', () => {
  const reviewer1Assessment: any = {
    reviewerName: 'R1',
    ratings: {
      d1: { answer: 'yes' },
      d2: { answer: 'no' },
      d3: { answer: 'unclear' } // Unrated by r1
    }
  };
  const reviewer2Assessment: any = {
    reviewerName: 'R2',
    ratings: {
      d1: { answer: 'yes' },
      d2: { answer: 'no' },
      d3: { answer: 'unclear' } // Unrated by r2
    }
  };
  const domains: any = [
    { id: 'd1', title: 'D1' },
    { id: 'd2', title: 'D2' },
    { id: 'd3', title: 'D3' }
  ];

  const kappaResult = calculateCohensKappa(reviewer1Assessment, reviewer2Assessment, domains);
  // Total domains evaluated is 3, agreed domains is 2 (d1 and d2 agreed, d3 was both unrated so not positive agreement)
  assert.equal(kappaResult.totalDomains, 3);
  assert.equal(kappaResult.agreedDomains, 2);
});

test('Audit Suite 4: AGREE II domain scores calculation produces honest percentages without hardcoded defaults', () => {
  const ratings: Record<string, any> = {
    'agree2-q1': { answer: '7' },
    'agree2-q2': { answer: '7' },
    'agree2-q3': { answer: '7' },
  };

  const evalResult = evaluateAgree2DomainScores(ratings);
  const domain1 = evalResult.domains.find(d => d.domainKey === 'D1');
  assert.ok(domain1);
  assert.equal(domain1.standardizedPercentage, 100);
  assert.equal(evalResult.overallQualityScore, 0); // Must not default to fake 6
  assert.equal(evalResult.overallRecommendation, 'Ikke vurdert'); // Must not default to fake 'Ja'
});

test('Audit Suite 5: MasterInstrumentRegistry contains CERQual and PROBAST without fake thresholds', () => {
  const cerqual = MasterInstrumentRegistryService.getByCode('CERQual');
  assert.ok(cerqual);
  assert.equal(cerqual?.hasOfficialNumericalCutoff, false);

  const probast = MasterInstrumentRegistryService.getByCode('PROBAST');
  assert.ok(probast);
  assert.equal(probast?.hasOfficialNumericalCutoff, false);
});

test('Audit Suite 6: DocxExporter produces a genuine zip blob with OpenXML components', async () => {
  const blob = await generateDocxBlob({
    title: 'Systematic Review Protocol',
    subtitle: 'Methods Section',
    sections: [
      { title: 'Search Strategy', content: 'Database search was conducted in Medline and Embase.' },
      { title: 'Inclusion Criteria', content: 'Randomized controlled trials published in English.' }
    ]
  });

  assert.ok(blob);
  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.ok(blob.size > 1000); // Authentic zip archive has non-trivial size
});
