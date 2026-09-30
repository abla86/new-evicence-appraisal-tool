import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { encryptEvidencePayload, decryptEvidencePayload, calculateSha256, verifyAuditChain, createAuditEntry } from '../src/utils/crypto.ts';

describe('Cryptographic Privacy & Zero-Knowledge E2E Encryption', () => {
  test('Encrypts and decrypts research evidence payload without data loss', async () => {
    const researchData = {
      projectId: 'proj-covid-review-2026',
      title: 'Systematic Review on Long-term Outcomes',
      articles: [
        { id: 'art-1', title: 'Clinical Trial A', verdict: 'Inkluder', complianceScore: 92 }
      ],
      auditRoot: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    const passphrase = 'Ultra-Secure-Password-Nordic-Health-2026!';
    const encrypted = await encryptEvidencePayload(researchData, passphrase);

    assert.ok(typeof encrypted === 'string');
    assert.ok(encrypted.length > 50);
    // Ensure plaintext is NOT visible in ciphertext
    assert.ok(!encrypted.includes('Systematic Review'));
    assert.ok(!encrypted.includes('proj-covid-review-2026'));

    const decrypted = await decryptEvidencePayload(encrypted, passphrase);
    assert.deepEqual(decrypted, researchData);
  });

  test('Rejects decryption with incorrect password', async () => {
    const payload = { secretFindings: 'Sensitive Clinical Trial Data' };
    const encrypted = await encryptEvidencePayload(payload, 'CorrectPassphrase123');

    await assert.rejects(
      async () => {
        await decryptEvidencePayload(encrypted, 'WrongPassphrase!');
      },
      /Dekryptering feilet/
    );
  });

  test('Rejects corrupted or tampered ciphertext', async () => {
    const payload = { confidential: true };
    const encrypted = await encryptEvidencePayload(payload, 'ValidKey999');

    // Tamper with one character in base64
    const tampered = encrypted.substring(0, 30) + (encrypted[30] === 'A' ? 'B' : 'A') + encrypted.substring(31);

    await assert.rejects(
      async () => {
        await decryptEvidencePayload(tampered, 'ValidKey999');
      },
      /Dekryptering feilet|Ugyldig/
    );
  });

  test('Creates and verifies SHA-256 Merkle audit trail for zero-tamper record', async () => {
    const entry1 = await createAuditEntry('CREATE_APPRAISAL', 'ASSESSMENT', 'item-101', 'Researcher-A', 'First JBI checklist completed');
    const entry2 = await createAuditEntry('SUBMIT_REVIEW', 'ASSESSMENT', 'item-101', 'Researcher-B', 'Second blind review submitted', entry1.hashSha256);

    const auditChain = [entry1, entry2];
    const verification = await verifyAuditChain(auditChain);

    assert.equal(verification.isValid, true);
    assert.equal(verification.corruptedIndex, undefined);
  });
});
