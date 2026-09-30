import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  formatReferenceInStyle, 
  generateCwywToken, 
  generateInTextCitation, 
  validateReferenceCompleteness, 
  detectDuplicates, 
  mergeReferenceItems, 
  promoteReferenceToStudy,
  exportToRis,
  exportToBibtex,
  exportToEndNoteXml,
  exportToCslJson,
  exportToCsv,
  parseRis
} from '../utils/referenceEngine.ts';

const sampleRefA = {
  id: 'ref-test-01',
  projectId: 'PROJ-TEST',
  title: 'Artificial Intelligence in Evidence Synthesis',
  authors: [
    { family: 'Marshall', given: 'Iain J' },
    { family: 'Wallace', given: 'Byron C' }
  ],
  year: '2023',
  journal: 'JAMIA',
  volume: '30',
  issue: '1',
  pages: '12-21',
  doi: '10.1093/jamia/ocac198',
  abstract: 'Review of machine learning in reviews.',
  itemType: 'journalArticle',
  status: 'VALIDATED',
  collections: ['AI & Reviews'],
  tags: ['MachineLearning'],
  categories: ['3.1 Automatiserte metoder'],
  directQuotes: [
    {
      id: 'q1',
      text: 'Semi-automated pipelines reduce reviewer workload.',
      page: '15',
      tags: ['Screening']
    }
  ],
  thoughtMemos: [
    {
      id: 'm1',
      title: 'PRISMA notat',
      content: 'Må rapporteres i henhold til PRISMA 2020.',
      tags: ['PRISMA']
    }
  ],
  cwywToken: '{Marshall, 2023 #102}',
  inTextCitation: '(Marshall & Wallace, 2023)',
  provenanceHashSha256: 'sha256-test-hash-a',
  importedAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z'
};

const sampleRefB = {
  id: 'ref-test-02',
  projectId: 'PROJ-TEST',
  title: 'Artificial Intelligence in Evidence Synthesis',
  authors: [
    { family: 'Marshall', given: 'Iain J.' },
    { family: 'Wallace', given: 'Byron C.' }
  ],
  year: '2023',
  journal: 'Journal of the American Medical Informatics Association',
  volume: '30',
  issue: '1',
  pages: '12-21',
  doi: '10.1093/jamia/ocac198',
  abstract: 'Pre-print duplicate entry with identical DOI.',
  itemType: 'journalArticle',
  status: 'VALIDATED',
  collections: ['Duplicates'],
  tags: ['Candidate'],
  categories: [],
  directQuotes: [
    {
      id: 'q2',
      text: 'Additional quote from duplicate file.',
      page: '18',
      tags: ['Secondary']
    }
  ],
  thoughtMemos: [],
  cwywToken: '{Marshall, 2023 #106}',
  inTextCitation: '(Marshall & Wallace, 2023)',
  provenanceHashSha256: 'sha256-test-hash-b',
  importedAt: '2026-03-01T11:00:00.000Z',
  updatedAt: '2026-03-01T11:00:00.000Z'
};

test('Reference Hub: EndNote CWYW Token generation', () => {
  const token = generateCwywToken(sampleRefA, 102);
  assert.equal(token, '{Marshall, 2023 #102}');
});

test('Reference Hub: Citation Styles (APA 7, Vancouver, Harvard, Chicago, MLA, IEEE)', () => {
  const apa = formatReferenceInStyle(sampleRefA, 'APA7');
  assert.ok(apa.includes('Marshall, I. J. & Wallace, B. C. (2023). Artificial Intelligence in Evidence Synthesis.'));
  assert.ok(apa.includes('https://doi.org/10.1093/jamia/ocac198'));

  const vancouver = formatReferenceInStyle(sampleRefA, 'Vancouver');
  assert.ok(vancouver.includes('Marshall IJ, Wallace BC. Artificial Intelligence in Evidence Synthesis.'));

  const ieee = formatReferenceInStyle(sampleRefA, 'IEEE');
  assert.ok(ieee.includes('[1] I. J. Marshall and B. C. Wallace, "Artificial Intelligence in Evidence Synthesis,"'));

  const mla = formatReferenceInStyle(sampleRefA, 'MLA');
  assert.ok(mla.includes('Marshall, Iain J, and Byron C Wallace. "Artificial Intelligence in Evidence Synthesis."'));
});

test('Reference Hub: Paperpile-style duplicate detection with similarity score', () => {
  const dups = detectDuplicates([sampleRefA, sampleRefB]);
  assert.equal(dups.length, 1);
  assert.equal(dups[0].type, 'EXACT_DOI');
  assert.equal(dups[0].similarityScore, 1.0);
  assert.equal(dups[0].source.id, sampleRefA.id);
  assert.equal(dups[0].target.id, sampleRefB.id);
});

test('Reference Hub: Paperpile safe merge preserves quotes, memos, tags, and audit history', () => {
  const merged = mergeReferenceItems(sampleRefA, sampleRefB, 'Lead Researcher');
  
  // Both quotes must be retained
  assert.equal(merged.directQuotes.length, 2);
  assert.ok(merged.directQuotes.some(q => q.id === 'q1'));
  assert.ok(merged.directQuotes.some(q => q.id === 'q2'));

  // Tags combined
  assert.ok(merged.tags.includes('MachineLearning'));
  assert.ok(merged.tags.includes('Candidate'));

  // Merge history audit trail is created
  assert.equal(merged.mergeHistory?.length, 1);
  assert.equal(merged.mergeHistory?.[0].mergedFromId, sampleRefB.id);
  assert.equal(merged.mergeHistory?.[0].user, 'Lead Researcher');
});

test('Reference Hub: Validation completeness catches missing fields', () => {
  const incompleteRef = {
    ...sampleRefA,
    id: 'incomplete-1',
    year: '',
    pages: undefined,
    journal: undefined
  };
  const val = validateReferenceCompleteness(incompleteRef);
  assert.equal(val.status, 'VALIDATION_REQUIRED');
  assert.ok(val.issues.length >= 2);
});

test('Reference Hub: Interoperability Export (RIS, BibTeX, EndNote XML, CSL-JSON, CSV)', () => {
  const ris = exportToRis([sampleRefA]);
  assert.ok(ris.includes('TY  - JOUR'));
  assert.ok(ris.includes('TI  - Artificial Intelligence in Evidence Synthesis'));
  assert.ok(ris.includes('AU  - Marshall, Iain J'));
  assert.ok(ris.includes('DO  - 10.1093/jamia/ocac198'));
  assert.ok(ris.includes('ER  -'));

  const parsedRis = parseRis(ris);
  assert.equal(parsedRis.length, 1);
  assert.equal(parsedRis[0].title, 'Artificial Intelligence in Evidence Synthesis');

  const bibtex = exportToBibtex([sampleRefA]);
  assert.ok(bibtex.includes('@article{Marshall2023'));
  assert.ok(bibtex.includes('title = {Artificial Intelligence in Evidence Synthesis}'));

  const endNoteXml = exportToEndNoteXml([sampleRefA]);
  assert.ok(endNoteXml.includes('<xml>') && endNoteXml.includes('<records>') && endNoteXml.includes('<record>'));
  assert.ok(endNoteXml.includes('<electronic-resource-num>10.1093/jamia/ocac198</electronic-resource-num>'));

  const cslJson = exportToCslJson([sampleRefA]);
  const parsedCsl = JSON.parse(cslJson);
  assert.equal(parsedCsl[0].type, 'article-journal');
  assert.equal(parsedCsl[0].DOI, '10.1093/jamia/ocac198');

  const csv = exportToCsv([sampleRefA]);
  assert.ok(csv.includes('Marshall Iain J; Wallace Byron C'));
});

test('Reference Hub: Promotion from ReferenceItem to JBI StudyRecord', () => {
  const study = promoteReferenceToStudy(sampleRefA, 'PROJ-TEST');
  assert.equal(study.title, sampleRefA.title);
  assert.equal(study.year, '2023');
  assert.equal(study.doi, '10.1093/jamia/ocac198');
  assert.equal(study.sourceRefId, sampleRefA.id);
  assert.ok(study.findings.length > 0, 'Should have scanned findings initialized');
  assert.ok(study.documentHashSha256, 'Must have cryptographic SHA-256 seal');
});
