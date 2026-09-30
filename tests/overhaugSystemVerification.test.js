import test from 'node:test';
import assert from 'node:assert/strict';

// Core and lib imports
import { normalizeDoi, doiToUrl } from '../lib/doi.js';
import { buildJournalReference, formatAuthors } from '../lib/apa7.js';
import { parseNorwegianLaw } from '../lib/norskLov.js';

// Reference Engine and types
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
  generateWordCwywDocument,
  generateRichTextHtml
} from '../src/utils/referenceEngine.ts';
import { calculateSha256Sync, createAuditEntry, verifyAuditChain } from '../src/utils/crypto.ts';
import { JBI_QUALITATIVE_DOMAINS } from '../src/utils/frameworks.ts';

// Concrete data from the uploaded BMC Primary Care (2024) article:
const articleMeta = {
  title: "‘There’s a will, but not a way’: Norwegian GPs’ experiences of collaboration with child welfare services – a grounded theory study",
  authors: [
    { family: 'Øverhaug', given: 'Oda Martine Steinsdatter' },
    { family: 'Laue', given: 'Johanna' },
    { family: 'Vis', given: 'Svein Arild' },
    { family: 'Risør', given: 'Mette Bech' }
  ],
  journal: 'BMC Primary Care',
  year: '2024',
  volume: '25',
  issue: '36',
  firstpage: '36',
  doi: 'https://doi.org/10.1186/s12875-024-02269-9',
  abstract: "Background: Adverse childhood experiences can have immediate effects on a child’s wellbeing and health and may also result in disorders and illness in adult life. General practitioners are in a good position to identify and support vulnerable children and parents and to collaborate with other agencies such as child welfare services. There is a need for better integration of relevant services. The aim of this study is to explore GPs’ experiences of the collaboration process with child welfare services. Method: This is a qualitative grounded theory study, with data consisting of ten semi-structured interviews with general practitioners across Norway. Results: The doctors’ main concern was: ‘There’s a will, but not a way’...",
  studyDesign: 'Qualitative grounded theory study',
  sampleSize: 10,
  country: 'Norway',
  referencedLaws: [
    'LOV-1981-04-08-7', // Barnelova (the Children Act)
    'LOV-2008-06-20-44' // Helseforskningsloven
  ]
};

test('Øverhaug (2024): 1. DOI Normalisering og Resolver-URL', () => {
  const norm = normalizeDoi(articleMeta.doi);
  assert.equal(norm.ok, true, 'DOI skal normaliseres med suksess');
  assert.equal(norm.doi, '10.1186/s12875-024-02269-9', 'Kanonisk DOI uten URL-prefiks');
  
  const resolverUrl = doiToUrl(norm.doi);
  assert.equal(resolverUrl, 'https://doi.org/10.1186/s12875-024-02269-9');
});

test('Øverhaug (2024): 2. APA 7 Referansegenerering & Forfatterliste', () => {
  const authorFormatted = formatAuthors(articleMeta.authors);
  assert.equal(
    authorFormatted,
    'Øverhaug, O. M. S., Laue, J., Vis, S. A., & Risør, M. B.',
    'APA 7 skal formatere 4 forfattere med initialer, komma og ampersand'
  );

  const apaResult = buildJournalReference({
    authors: articleMeta.authors,
    citation_title: articleMeta.title,
    citation_journal_title: articleMeta.journal,
    citation_volume: articleMeta.volume,
    citation_firstpage: articleMeta.firstpage,
    citation_doi: articleMeta.doi,
    citation_publication_date: '2024-01-24'
  });

  assert.equal(apaResult.status, 'complete', 'Alle påkrevde felt er til stede');
  assert.equal(apaResult.missing.length, 0);
  assert.ok(apaResult.reference.includes('Øverhaug, O. M. S., Laue, J., Vis, S. A., & Risør, M. B. (2024).'));
  assert.ok(apaResult.reference.includes('‘There’s a will, but not a way’'));
  assert.ok(apaResult.reference.includes('BMC Primary Care, 25, 36.'));
  assert.ok(apaResult.reference.includes('https://doi.org/10.1186/s12875-024-02269-9'));
});

test('Øverhaug (2024): 3. Norsk lovdata-parsing av siterte lover i artikkelen', () => {
  // Artikkelen siterer Barnelova (LOV-1981-04-08-7) og Helseforskningsloven (LOV-2008-06-20-44)
  const barnelov = parseNorwegianLaw(articleMeta.referencedLaws[0]);
  assert.equal(barnelov.ok, true);
  assert.equal(barnelov.officialId, 'LOV-1981-04-08-7');
  assert.equal(barnelov.type, 'lov');

  const helseforskningslov = parseNorwegianLaw(articleMeta.referencedLaws[1]);
  assert.equal(helseforskningslov.ok, true);
  assert.equal(helseforskningslov.officialId, 'LOV-2008-06-20-44');
  assert.equal(helseforskningslov.type, 'lov');
});

test('Øverhaug (2024): 4. Reference Hub Inntak, CWYW Token og In-Text Sitat', () => {
  const refItem = {
    id: 'ref-overhaug-2024',
    title: articleMeta.title,
    authors: articleMeta.authors,
    journal: articleMeta.journal,
    year: articleMeta.year,
    volume: articleMeta.volume,
    issue: articleMeta.issue,
    pages: articleMeta.firstpage,
    doi: '10.1186/s12875-024-02269-9',
    abstract: articleMeta.abstract,
    sourceType: 'JOURNAL_ARTICLE',
    tags: ['Barnevern', 'Fastlege', 'Grounded Theory', 'Kvalitativ'],
    directQuotes: [
      {
        id: 'quote-1',
        text: "The doctors’ main concern was: ‘There’s a will, but not a way’.",
        page: '1',
        category: 'Hovedfunn',
        createdAt: new Date().toISOString()
      },
      {
        id: 'quote-2',
        text: "Three subordinate stages of the collaboration process were identified: (I) Familiar territory... (II) Unfamiliar territory... (III) Fragmented territory.",
        page: '1',
        category: 'Modell',
        createdAt: new Date().toISOString()
      }
    ],
    thoughtMemos: [
      {
        id: 'memo-1',
        title: 'Metodisk refleksjon',
        content: 'Corbin & Strauss grounded theory. 10 intervjuer med fastleger i Norge.',
        category: 'Metode',
        createdAt: new Date().toISOString()
      }
    ],
    collections: ['Barnevern og Primærhelse'],
    status: 'VALIDATED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // EndNote CWYW Token test
  const cwywToken = generateCwywToken(refItem);
  assert.equal(cwywToken, '{Øverhaug, 2024 #2024}', 'Korrekt EndNote Cite While You Write format');

  // In-Text Citation (parenthetical and narrative)
  const inText = generateInTextCitation(refItem);
  assert.equal(inText.parenthetical, '(Øverhaug et al., 2024)');
  assert.equal(inText.narrative, 'Øverhaug et al. (2024)');

  // Multi-style citations
  const apa7 = formatReferenceInStyle(refItem, 'APA7');
  const vancouver = formatReferenceInStyle(refItem, 'Vancouver');
  const harvard = formatReferenceInStyle(refItem, 'Harvard');

  assert.ok(apa7.includes('Øverhaug, O. M. S.'));
  assert.ok(vancouver.includes('Øverhaug OMS') || vancouver.includes('Øverhaug'));
  assert.ok(harvard.includes('Øverhaug, O. M. S. et al.'));

  // Validering
  const valResult = validateReferenceCompleteness(refItem);
  assert.equal(valResult.status, 'VALIDATED');
  assert.equal(valResult.completenessPercent, 100);
});

test('Øverhaug (2024): 5. Opprykk til JBI Kvalitativ Vurdering (StudyRecord)', () => {
  const refItem = {
    id: 'ref-overhaug-2024',
    title: articleMeta.title,
    authors: articleMeta.authors,
    journal: articleMeta.journal,
    year: articleMeta.year,
    volume: articleMeta.volume,
    issue: articleMeta.issue,
    pages: articleMeta.firstpage,
    doi: '10.1186/s12875-024-02269-9',
    abstract: articleMeta.abstract,
    sourceType: 'JOURNAL_ARTICLE',
    tags: ['Barnevern', 'Grounded Theory'],
    directQuotes: [],
    thoughtMemos: [],
    collections: [],
    status: 'VALIDATED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const study = promoteReferenceToStudy(refItem, 'PROJ-NORWAY-CWS');
  assert.equal(study.id, 'study-ref-ref-overhaug-2024');
  assert.equal(study.title, articleMeta.title);
  assert.equal(study.year, '2024');
  assert.equal(study.doi, '10.1186/s12875-024-02269-9');
  assert.equal(study.documentType, 'Qualitative Research');
  assert.ok(study.documentHashSha256.length === 64, 'Skal ha gyldig 64-tegns SHA-256 sjekksum');

  // Verifiser mot JBI Qualitative rammeverket (10 spørsmål)
  assert.equal(JBI_QUALITATIVE_DOMAINS.length, 10, 'JBI Qualitative har 10 kriterier');
  
  // Q1: Filosofisk perspektiv & metodologi (Grounded theory, Corbin & Strauss)
  const q1 = JBI_QUALITATIVE_DOMAINS[0];
  assert.ok(q1.title.includes('Filosofisk perspektiv') || q1.question.includes('philosophical'));
  assert.equal(q1.isCritical, true);

  // Q2: Forskningsspørsmål & metodologi
  const q2 = JBI_QUALITATIVE_DOMAINS[1];
  assert.ok(q2.title.includes('Forskningsspørsmål') || q2.question.includes('methodology'));
  assert.equal(q2.isCritical, true);

  // Q9: Etisk godkjenning (Helseforskningsloven §10 / REK)
  const q9 = JBI_QUALITATIVE_DOMAINS[8];
  assert.ok(q9.title.toLowerCase().includes('etisk') || q9.question.toLowerCase().includes('ethical'));
});

test('Øverhaug (2024): 6. Kryptografisk Integritet & SHA-256 Merkle Audit Trail', async () => {
  const content = `${articleMeta.title}\n${articleMeta.doi}\n${articleMeta.abstract}`;
  const sha = calculateSha256Sync(content);
  assert.equal(typeof sha, 'string');
  assert.equal(sha.length, 64, 'SHA-256 heksadesimal hash må være 64 tegn');

  // Test Merkle-auditkjede
  const entry1 = await createAuditEntry(
    'IMPORT_STUDY',
    'STUDY',
    'ref-overhaug-2024',
    'Researcher-1',
    'Imported Øverhaug et al. 2024 via PDF OCR'
  );
  assert.ok(entry1.hashSha256, 'Skal generere SHA-256 hash');
  assert.equal(entry1.hashSha256.length, 64);

  const entry2 = await createAuditEntry(
    'START_APPRAISAL',
    'ASSESSMENT',
    'ref-overhaug-2024',
    'Reviewer-A',
    'Initiated JBI Qualitative appraisal',
    entry1.hashSha256
  );
  assert.equal(entry2.previousHashSha256, entry1.hashSha256);

  const auditChain = [entry1, entry2];
  const verification = await verifyAuditChain(auditChain);
  assert.equal(verification.isValid, true, 'Auditkjeden må være verifisert uten manipulering');
});

test('Øverhaug (2024): 7. Bibliografisk Eksport (RIS, BibTeX, EndNote XML, Word CWYW, CSV)', () => {
  const refItem = {
    id: 'ref-overhaug-2024',
    title: articleMeta.title,
    authors: articleMeta.authors,
    journal: articleMeta.journal,
    year: articleMeta.year,
    volume: articleMeta.volume,
    issue: articleMeta.issue,
    pages: articleMeta.firstpage,
    doi: '10.1186/s12875-024-02269-9',
    abstract: articleMeta.abstract,
    sourceType: 'JOURNAL_ARTICLE',
    tags: ['Barnevern', 'Grounded Theory'],
    cwywToken: '{Øverhaug, 2024 #2024}',
    directQuotes: [],
    thoughtMemos: [],
    collections: [],
    status: 'VALIDATED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // RIS eksport
  const ris = exportToRis([refItem]);
  assert.ok(ris.includes('TY  - JOUR'));
  assert.ok(ris.includes('TI  - ‘There’s a will, but not a way’'));
  assert.ok(ris.includes('AU  - Øverhaug, Oda Martine Steinsdatter'));
  assert.ok(ris.includes('DO  - 10.1186/s12875-024-02269-9'));
  assert.ok(ris.includes('ER  -'));

  // BibTeX eksport
  const bibtex = exportToBibtex([refItem]);
  assert.ok(bibtex.includes('@article{'));
  assert.ok(bibtex.includes('author = {Øverhaug, Oda Martine Steinsdatter and Laue, Johanna and Vis, Svein Arild and Risør, Mette Bech}'));
  assert.ok(bibtex.includes('doi = {10.1186/s12875-024-02269-9}'));

  // EndNote XML
  const xml = exportToEndNoteXml([refItem]);
  assert.ok(xml.includes('<xml>') && xml.includes('<records>') && xml.includes('<record>'));
  assert.ok(xml.includes('<author>Øverhaug, Oda Martine Steinsdatter</author>'));
  assert.ok(xml.includes('<electronic-resource-num>10.1186/s12875-024-02269-9</electronic-resource-num>'));

  // CSV
  const csv = exportToCsv([refItem]);
  assert.ok(csv.includes('‘There’s a will, but not a way’'));
  assert.ok(csv.includes('10.1186/s12875-024-02269-9'));

  // Word CWYW integrasjonsdokument
  const cwywDoc = generateWordCwywDocument([refItem]);
  assert.ok(cwywDoc.includes('=== WORD CITE WHILE YOU WRITE (CWYW) INTEGRASJONSDOKUMENT ==='));
  assert.ok(cwywDoc.includes('{Øverhaug, 2024 #2024}'));

  // Rik tekst HTML for utklippstavle
  const html = generateRichTextHtml([refItem], 'APA7');
  assert.ok(html.includes('Øverhaug, O. M. S.'));
  assert.ok(html.includes('https://doi.org/10.1186/s12875-024-02269-9'));
});
