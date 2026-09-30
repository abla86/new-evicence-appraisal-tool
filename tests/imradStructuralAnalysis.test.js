import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeIMRaDStructure, getRecommendedReportingStandard } from '../src/services/imradAnalysisService.ts';

test('IMRaD Test 1: Komplett IMRaD med eksplisitte overskrifter', () => {
  const manuscript = `
Introduction
General practitioners play a pivotal role in identifying childhood adversity. Little is known about collaboration mechanisms, representing a clear knowledge gap. The aim of this study is to explore the clinical consultation process.

Methods
This was a prospective study. Inclusion criteria were established before sampling. Data collection was carried out using semi-structured interviews. Data analysis followed rigorous qualitative procedures. Ethical approval was obtained from REK.

Results
A total of 10 participants were included. Table 1 shows baseline characteristics. The doctors described substantial structural obstacles. Statistically significant differences were observed across regions.

Discussion
In this study, we found that collaboration between GPs and child welfare services is hindered by structural barriers. Our findings are in line with previous national surveys. A main strength of this study was the broad geographical sampling, while limitations include potential recall bias. Clinical implications for general practice are highlighted.
  `;

  const result = analyzeIMRaDStructure(manuscript, 'complete_article.txt', 'Randomized Controlled Trial');

  assert.equal(result.complete, true, 'Skal være komplett når alle 4 ledd er tilstede');
  assert.equal(result.explicitComplete, true, 'Skal være eksplisitt komplett');
  assert.equal(result.detectedSectionCount, 4, 'Skal ha detektert nøyaktig 4 ledd');
  assert.equal(result.explicitHeadingCount, 4, 'Skal ha 4 eksplisitte overskrifter');
  assert.equal(result.missingSections.length, 0, 'Ingen seksjoner skal mangle');
  assert.equal(result.recommendedReportingStandard, 'CONSORT', 'RCT skal anbefale CONSORT rapporteringsstandard');

  const intro = result.sections.find(s => s.key === 'introduction');
  assert.equal(intro?.status, 'DETECTED');
  assert.equal(intro?.explicitHeading, true);
  assert.ok(intro && intro.confidence >= 0.85);

  const methods = result.sections.find(s => s.key === 'methods');
  assert.equal(methods?.status, 'DETECTED');

  const results = result.sections.find(s => s.key === 'results');
  assert.equal(results?.status, 'DETECTED');

  const discussion = result.sections.find(s => s.key === 'discussion');
  assert.equal(discussion?.status, 'DETECTED');
});

test('IMRaD Test 2: Manglende Results skal registreres som MISSING uten feilaktig metodisk forhåndsdømming', () => {
  const manuscript = `
Introduction
Background on healthcare interventions. The aim of this research report is to outline our clinical protocol.

Methods
Study design and data collection procedures were standardized. Ethical approval and consent were acquired.

Discussion
In this protocol paper, we discuss expected clinical implications and prospective limitations of the intended design.
  `;

  const result = analyzeIMRaDStructure(manuscript, 'protocol_without_results.txt', 'Systematic Review / Meta-Analysis');

  assert.equal(result.complete, false, 'Skal ikke være komplett når Results mangler');
  assert.equal(result.explicitComplete, false);
  assert.ok(result.missingSections.includes('results'), 'missingSections skal inneholde results');

  const resultsSec = result.sections.find(s => s.key === 'results');
  assert.equal(resultsSec?.status, 'MISSING', 'Results skal ha status MISSING');
  assert.equal(resultsSec?.detected, false);

  // Metodisk sjekk: At IMRaD mangler skal gi metodisk notice, ikke bias-poeng
  assert.ok(result.methodologicalNotice.includes('IKKE en kritisk vurdering av metodisk kvalitet'));
  assert.equal(result.recommendedReportingStandard, 'PRISMA');
});

test('IMRaD Test 3: Inferert struktur uten overskrifter skal gi INFERRED, ikke DETECTED', () => {
  const manuscriptWithoutHeadings = `
Adverse childhood experiences can have severe lifetime consequences. However, a significant knowledge gap remains regarding primary care coordination. The aim of this study is to explore general practitioners experiences.

We conducted semi-structured interviews with general practitioners. Participants were recruited across Norway. Thematic analysis was applied, and ethical approval was formally granted by REK.

A total of 10 participants described their everyday practice. Participants reported substantial organizational hesitation. Key themes emerged around communication barriers.

In this study, we found persistent structural silos between primary care and child welfare agencies. Our findings indicate a need for systematic coordination. A major strength is the national spread of informants. Limitations of our study include self-selection.
  `;

  const result = analyzeIMRaDStructure(manuscriptWithoutHeadings, 'continuous_prose.txt');

  assert.equal(result.explicitComplete, false, 'Skal IKKE være eksplisitt komplett');
  assert.equal(result.explicitHeadingCount, 0, 'Skal ha 0 eksplisitte overskrifter');
  
  // Alle funn i tekstblokker skal være INFERRED eller MISSING, aldri falsk DETECTED
  result.sections.forEach(sec => {
    assert.notEqual(sec.status, 'DETECTED', `Seksjon ${sec.key} skal aldri markeres som DETECTED uten overskrift`);
  });

  const intro = result.sections.find(s => s.key === 'introduction');
  assert.equal(intro?.status, 'INFERRED');
  assert.equal(intro?.explicitHeading, false);
});

test('IMRaD Test 4: Kvalitativ artikkel med Background, Methods, Findings, Discussion', () => {
  const qualitativeManuscript = `
Background
General practitioners are in a key position to identify vulnerable children. The aim of this study is to investigate inter-professional collaboration.

Methods
This is a qualitative grounded theory study. Data collection consisted of ten semi-structured interviews with Norwegian general practitioners.

Findings
The doctors main concern was summarized as: There is a will, but not a way. Informants described conflicting institutional mandates.

Discussion
In this study, we found that collaboration processes require dedicated institutional resources. A key strength of the study is the in-depth reflections. Transferability to other Scandinavian primary care contexts is plausible.
  `;

  const result = analyzeIMRaDStructure(qualitativeManuscript, 'qualitative_study.txt', 'Qualitative Research');

  assert.equal(result.complete, true, 'Kvalitativ artikkel med Findings skal være komplett');
  assert.equal(result.explicitComplete, true);
  assert.equal(result.detectedSectionCount, 4);

  const resultsSec = result.sections.find(s => s.key === 'results');
  assert.equal(resultsSec?.status, 'DETECTED', 'Findings skal gjenkjennes som gyldig resultatoverskrift');
  assert.ok(resultsSec?.detectedHeading?.toLowerCase().includes('findings'));
  assert.equal(result.recommendedReportingStandard, 'COREQ');
});

test('IMRaD Test 5: Norsk vitenskapelig artikkel med Bakgrunn, Metode, Resultater, Diskusjon', () => {
  const norwegianManuscript = `
Bakgrunn
Fastlegers samhandling med barnevernstjenesten er lite utforsket. Formålet med denne studien var å kartlegge fastlegers erfaringer og barrierer i samhandlingen.

Metode
Studien har et kvalitativt forskningsdesign. Utvalget besto av 12 fastleger. Datainnsamling ble gjennomført med individuelle intervjuer. Forskningsetisk vurdering ble innhentet fra REK.

Resultater
Fastlegene beskrev stor usikkerhet rundt taushetsplikt og meldeplikt. Tabell 1 oppsummerer deltakernes praksiskarakteristika. Informantene uttrykte ønske om faste kontaktpunkter.

Diskusjon
Denne studien viser at uklarhet om regelverk svekker samhandlingen. Resultatene samsvarer med tidligere tilsynsrapporter. Studiens styrker er bred geografisk spredning, mens begrensninger knytter seg til utvalgets størrelse.
  `;

  const result = analyzeIMRaDStructure(norwegianManuscript, 'norsk_artikkel.txt', 'Qualitative Empirical Study');

  assert.equal(result.complete, true, 'Norsk IMRaD skal være komplett');
  assert.equal(result.explicitComplete, true);
  assert.equal(result.detectedSectionCount, 4);
  assert.equal(result.explicitHeadingCount, 4);

  const intro = result.sections.find(s => s.key === 'introduction');
  assert.equal(intro?.status, 'DETECTED');
  assert.ok(intro?.detectedHeading?.toLowerCase().includes('bakgrunn'));

  const methods = result.sections.find(s => s.key === 'methods');
  assert.equal(methods?.status, 'DETECTED');
  assert.ok(methods?.detectedHeading?.toLowerCase().includes('metode'));

  const results = result.sections.find(s => s.key === 'results');
  assert.equal(results?.status, 'DETECTED');
  assert.ok(results?.detectedHeading?.toLowerCase().includes('resultater'));

  const disc = result.sections.find(s => s.key === 'discussion');
  assert.equal(disc?.status, 'DETECTED');
  assert.ok(disc?.detectedHeading?.toLowerCase().includes('diskusjon'));
});

test('IMRaD Test 6: Tomt dokument gir ingen falske deteksjoner', () => {
  const result = analyzeIMRaDStructure('', 'empty.txt');

  assert.equal(result.complete, false);
  assert.equal(result.explicitComplete, false);
  assert.equal(result.detectedSectionCount, 0);
  assert.equal(result.explicitHeadingCount, 0);
  assert.equal(result.confidence, 0);
  assert.equal(result.missingSections.length, 4);
  assert.ok(result.limitations.some(l => l.includes('tomt')));
});

test('IMRaD Test 7: Svært kort tekst skal gi lav konfidens og eksplisitt metodisk begrensning', () => {
  const shortText = 'Introduction\nThis is a tiny note with some brief words.';
  const result = analyzeIMRaDStructure(shortText, 'short_note.txt');

  assert.equal(result.complete, false);
  assert.ok(result.limitations.some(l => l.includes('svært lite tekstgrunnlag')));
  
  // Konfidens for overskrift i ekstremt kort tekst skal være dempet (< 0.50)
  const intro = result.sections.find(s => s.key === 'introduction');
  assert.ok(intro && intro.confidence <= 0.50);
});

test('IMRaD Test 8: OCR-støy eller ødelagt PDF-tekst flagges i begrensninger', () => {
  const noisyOcr = `
    Introduction
    The aim was clear.
    Methods
    §§§§ %%%%% |||||| &&&&&& $$$$$$ @@@@@@ ###### ^^^^^^ ***** ///// \\\\\\\\
    Results
    §§§§ %%%%% |||||| &&&&&& $$$$$$ @@@@@@ ###### ^^^^^^ ***** ///// \\\\\\\\
    Discussion
    §§§§ %%%%% |||||| &&&&&& $$$$$$ @@@@@@ ###### ^^^^^^ ***** ///// \\\\\\\\
  `;

  const result = analyzeIMRaDStructure(noisyOcr, 'ocr_damaged.pdf');
  assert.ok(result.limitations.some(l => l.includes('OCR/PDF')));
});

test('IMRaD Test 9: Narrativ prosa som starter med "The results were discussed..." skal IKKE gi falsk DETECTED overskrift', () => {
  const narrativeProse = `
    Introduction
    The aim of this study is to examine hospital inter-departmental communication routines.

    Methods
    Data was collected via retrospective observation of morning rounds across three surgical wards.

    The results were discussed in the meeting with the senior medical officers on Tuesday.
    We noticed that several participants experienced delays.

    Discussion
    In this study, we found that inter-departmental communication requires structured handover protocols.
  `;

  const result = analyzeIMRaDStructure(narrativeProse, 'narrative_prose.txt');
  const resultsSection = result.sections.find(s => s.key === 'results');

  assert.equal(resultsSection?.explicitHeading, false, 'Narrativ setning skal IKKE flagges som explicitHeading');
  assert.notEqual(resultsSection?.status, 'DETECTED', 'Status skal ikke være DETECTED når overskrift mangler');
});

test('IMRaD Test 10: OCR_REQUIRED payload gir isOcrRequired flagg og alle seksjoner OCR_REQUIRED status', () => {
  const ocrPayload = '[OCR_REQUIRED: PDF-dokumentet (scanned_article.pdf) inneholder ingen uttrekkbar digital tekststrøm. Skannet bilde detektert.]';
  const result = analyzeIMRaDStructure(ocrPayload, 'scanned_article.pdf');

  assert.equal(result.isOcrRequired, true, 'isOcrRequired skal være true');
  assert.equal(result.complete, false);
  assert.equal(result.explicitComplete, false);
  assert.equal(result.detectedSectionCount, 0);
  assert.ok(result.methodologicalNotice.includes('OCR_REQUIRED'));
  assert.ok(result.sections.every(s => s.status === 'OCR_REQUIRED'));
});

