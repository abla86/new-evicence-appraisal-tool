import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildSourceRecord, validateSourceRecord } from '../src/services/sourceRecordService.ts';
import { buildSourceRecord as buildSourceRecordJs } from '../lib/buildSourceRecord.js';

test('SourceRecord Contract: buildSourceRecord from raw browser extension metadata', () => {
  const extensionMeta = {
    url: 'https://academic.oup.com/jamia/article/30/1/12/6762341',
    detectedAt: '2026-09-02T10:30:00.000Z',
    citation_title: 'Artificial intelligence in evidence synthesis and systematic reviews',
    citation_journal_title: 'Journal of the American Medical Informatics Association',
    citation_volume: '30',
    citation_issue: '1',
    citation_firstpage: '12',
    citation_lastpage: '21',
    citation_doi: 'https://doi.org/10.1093/jamia/ocac198',
    citation_publication_date: '2023/01/15',
    authors: [
      { family: 'Marshall', given: 'Iain J' },
      { family: 'Wallace', given: 'Byron C' }
    ],
    og_title: 'Artificial intelligence in evidence synthesis',
    og_description: 'Overview of machine learning techniques in health research'
  };

  const record = buildSourceRecord(extensionMeta);

  assert.ok(record.id.startsWith('SRC'));
  assert.equal(record.title, 'Artificial intelligence in evidence synthesis and systematic reviews');
  assert.deepEqual(record.authors, ['Marshall, Iain J', 'Wallace, Byron C']);
  assert.equal(record.journal, 'Journal of the American Medical Informatics Association');
  assert.equal(record.volume, '30');
  assert.equal(record.issue, '1');
  assert.equal(record.pages, '12–21');
  assert.equal(record.doi, '10.1093/jamia/ocac198');
  assert.equal(record.year, '2023');
  assert.equal(record.sourceOrigin, 'Browser Extension');
  assert.equal(record.screeningStatus, 'UNSCREENED');
  assert.ok(record.provenanceHashSha256 && record.provenanceHashSha256.length === 64);

  const validation = validateSourceRecord(record);
  assert.equal(validation.valid, true);
  assert.equal(validation.errors.length, 0);
});

test('SourceRecord Contract: buildSourceRecord from structured manual input', () => {
  const manualInput = {
    title: 'Nurses Experiences in Intensive Care',
    authors: ['Hansen, Kari', 'Olsen, Per'],
    journal: 'Nordic Journal of Nursing Research',
    year: '2024',
    sourceOrigin: 'Manual Import',
    doi: 'doi:10.1177/2057158524123456',
    abstract: 'Qualitative phenomenological interview study.'
  };

  const record = buildSourceRecord(manualInput);

  assert.equal(record.title, 'Nurses Experiences in Intensive Care');
  assert.deepEqual(record.authors, ['Hansen, Kari', 'Olsen, Per']);
  assert.equal(record.doi, '10.1177/2057158524123456');
  assert.equal(record.sourceOrigin, 'Manual Import');
  assert.equal(record.screeningStatus, 'UNSCREENED');

  const validation = validateSourceRecord(record);
  assert.equal(validation.valid, true);
});

test('SourceRecord Contract: throws if title is missing or empty', () => {
  assert.throws(() => {
    buildSourceRecord({ title: '' });
  }, /Tittel er påkrevd/);

  assert.throws(() => {
    buildSourceRecord({ authors: ['Smith, J'] });
  }, /Tittel er påkrevd/);
});

test('SourceRecord Contract: lib/buildSourceRecord.js produces identical contract fields', () => {
  const rawData = {
    citation_title: 'Evidence-Based Practice Implementation Study',
    citation_journal_title: 'Implementation Science',
    citation_doi: '10.1186/s13012-024-01300-1',
    citation_publication_date: '2024-05-10',
    authors: [{ family: 'Damschroder', given: 'Laura' }]
  };

  const jsRecord = buildSourceRecordJs(rawData);
  assert.equal(jsRecord.title, 'Evidence-Based Practice Implementation Study');
  assert.equal(jsRecord.doi, '10.1186/s13012-024-01300-1');
  assert.equal(jsRecord.year, '2024');
  assert.equal(jsRecord.sourceOrigin, 'Browser Extension');
  assert.equal(jsRecord.screeningStatus, 'UNSCREENED');
  assert.ok(jsRecord.provenanceHashSha256.length === 64);
});

test('SourceRecord Contract: validateSourceRecord detects malformed records', () => {
  const badRecord = {
    id: '',
    projectId: '',
    title: '',
    authors: 'not an array',
    sourceOrigin: 'InvalidOrigin',
    screeningStatus: 'UNKNOWN_STATUS',
    provenanceHashSha256: 'short',
    importedAt: 'not-a-date'
  };

  const res = validateSourceRecord(badRecord);
  assert.equal(res.valid, false);
  assert.ok(res.errors.length >= 6);
});
