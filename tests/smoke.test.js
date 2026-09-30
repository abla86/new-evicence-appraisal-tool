import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Smoke 1: DOI regex accepts valid DOI and rejects invalid DOI', () => {
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
  assert.equal(doiRegex.test('10.1234/abcd.ef'), true, 'DOI regex must accept 10.1234/abcd.ef');
  assert.equal(doiRegex.test('not-a-doi'), false, 'DOI regex must reject not-a-doi');
});

test('Smoke 2: Importing src/utils/storage.ts does not throw', async () => {
  await assert.doesNotReject(async () => {
    const storage = await import('../src/utils/storage.ts');
    assert.ok(storage, 'storage module should export functions');
  }, 'Importing storage module must not throw');
});
