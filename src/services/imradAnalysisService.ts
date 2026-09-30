import type {
  IMRaDAnalysisResult,
  IMRaDSectionAnalysis,
  IMRaDSectionKey,
  IMRaDSectionStatus,
  StudyRecord
} from '../types/index.ts';

/**
 * Structural definition for an IMRaD section including explicit heading matchers
 * and semantic content signals (Norwegian and English).
 */
/**
 * Negative sentence/prose indicators that disqualify a line from being an explicit section heading.
 */
const PROSE_SENTENCE_INDICATORS = [
  /\b(?:were|was|are|is|have\s+been|had\s+been|has\s+been)\b/i,
  /\b(?:showed|show|shows|indicated|indicates|suggested|suggests|demonstrated|demonstrates|revealed|reveals|reported|reports)\b/i,
  /\b(?:found\s+that|noted\s+that|concluded\s+that|viste|viser|indikerte|antok|ble\s+funnet|ble\s+drøftet)\b/i,
  /\b(?:in\s+the\s+meeting|in\s+this\s+cohort|of\s+the\s+study|in\s+this\s+study|from\s+the\s+study|av\s+studien|i\s+denne\s+studien)\b/i,
  /^(?:the|this|these|our|we|denne|disse|våre|vi)\s+/i
];

function isProseSentence(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (PROSE_SENTENCE_INDICATORS.some(regex => regex.test(trimmed))) {
    return true;
  }
  // If line ends with a period and contains 4 or more words, it's almost certainly a narrative sentence
  const words = (trimmed.match(/[\p{L}\p{N}_\-]+/gu) || []).length;
  if (/\.$/.test(trimmed) && words >= 4 && !/^\d+\.\s+[A-Z]/.test(trimmed)) {
    return true;
  }
  return false;
}

interface SectionMatcher {
  key: IMRaDSectionKey;
  label: string;
  // Regexes matching explicit section headings (strictly anchored to title/subheading syntax)
  headingPatterns: RegExp[];
  // Semantic signals for inferring section presence when heading is missing or subtle
  semanticSignals: RegExp[];
  // Negative patterns that indicate this heading is actually another section
  negativePatterns?: RegExp[];
}

const IMRAD_MATCHERS: SectionMatcher[] = [
  {
    key: 'introduction',
    label: 'Introduction (Innledning / Bakgrunn)',
    headingPatterns: [
      /^(?:(?:1\.?)+\s*)?(?:introduction|background|innledning|bakgrunn)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:aim|aims|objectives?|purpose|formål|hensikt|problemstilling)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:background\s+and\s+(?:aims?|purpose|rationale))\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:kunnskapsstatus|teoretisk\s+(?:rammeverk|bakgrunn))\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i
    ],
    semanticSignals: [
      /\b(?:little\s+is\s+known|remains\s+unclear|knowledge\s+gap|kunnskapshull)\b/i,
      /\b(?:the\s+aim\s+of\s+this\s+study|we\s+aimed\s+to|hensikten\s+med\s+denne\s+studien|formålet\s+med\s+studien)\b/i,
      /\b(?:research\s+question|forskningsspørsmål|hypotes(?:is|e))\b/i,
      /\b(?:previous\s+studies\s+have\s+shown|tidligere\s+forskning\s+har\s+vist)\b/i
    ]
  },
  {
    key: 'methods',
    label: 'Methods (Metode / Metodologi)',
    headingPatterns: [
      /^(?:(?:2\.?)+\s*)?(?:methods?|methodology|materials?\s+and\s+methods?|methods?\s+and\s+materials?)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:metode|metodologi|studiedesign|research\s+design|study\s+design)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:data\s+collection|datainnsamling|participants|deltakere|sample|utvalg)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:data\s+analysis|analysemetode|statistical\s+analysis|statistiske\s+analyser)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:ethics?|ethical\s+considerations?|etiske\s+vurderinger|etikk)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i
    ],
    semanticSignals: [
      /\b(?:semi-structured\s+interviews?|focus\s+groups?|halvstrukturerte\s+intervjuer|fokusgrupper)\b/i,
      /\b(?:grounded\s+theory|thematic\s+analysis|tematisk\s+analyse|fenomenolog(?:y|i))\b/i,
      /\b(?:inclusion\s+criteria|exclusion\s+criteria|inklusjonskriterier|eksklusjonskriterier)\b/i,
      /\b(?:randomized|randomised|cohort|cross-sectional|intervensjon|kontrollgruppe)\b/i,
      /\b(?:statistical\s+significance|p\s*[<=]\s*0\.\d+|etisk\s+godkjenning|rek\s*[-–]\s*\d+|samtykke)\b/i
    ]
  },
  {
    key: 'results',
    label: 'Results (Resultater / Funn)',
    headingPatterns: [
      /^(?:(?:3\.?)+\s*)?(?:results?|findings|resultater|funn)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:main\s+results?|hovedfunn|empiriske\s+funn)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:results?\s+and\s+discussion|resultater\s+og\s+diskusjon)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i
    ],
    semanticSignals: [
      /\b(?:table\s+\d+|tabell\s+\d+|figure\s+\d+|figur\s+\d+)\b/i,
      /\b(?:a\s+total\s+of\s+\d+\s+participants|totalt\s+\d+\s+deltakere|n\s*=\s*\d+)\b/i,
      /\b(?:theme\s+\d+|kategori\s+\d+|hovedtema|sub-theme)\b/i,
      /\b(?:statistically\s+significant|statistisk\s+signifikant|ci\s*[:=]|95%\s*ki|hazard\s+ratio|odds\s+ratio)\b/i,
      /\b(?:the\s+participants\s+reported|informantene\s+uttrykte|legene\s+beskrev)\b/i
    ]
  },
  {
    key: 'discussion',
    label: 'Discussion (Diskusjon / Drøfting)',
    headingPatterns: [
      /^(?:(?:4\.?)+\s*)?(?:discussion|interpretation|diskusjon|drøfting)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:strengths?\s+and\s+limitations?|styrker\s+og\s+svakheter|begrensninger|limitations?)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i,
      /^(?:conclusions?|konklusjon|clinical\s+implications?|implikasjoner)\s*(?:[:—–-]\s*[A-ZÆØÅa-zæøå0-9\s]+)?$/i
    ],
    semanticSignals: [
      /\b(?:in\s+this\s+study,\s+we\s+found|denne\s+studien\s+viser\s+at|our\s+findings\s+indicate)\b/i,
      /\b(?:in\s+line\s+with\s+previous|samsvarer\s+med\s+tidligere|i\s+motsetning\s+til)\b/i,
      /\b(?:a\s+main\s+strength\s+of\s+this\s+study|en\s+styrke\s+ved\s+studien)\b/i,
      /\b(?:limitations?\s+of\s+our\s+study|studiens\s+begrensninger|transferability|overførbarhet)\b/i,
      /\b(?:implications\s+for\s+practice|implikasjoner\s+for\s+praksis|further\s+research\s+is\s+needed)\b/i
    ]
  }
];

interface ExtractedBlock {
  headingText?: string;
  isHeading: boolean;
  content: string;
  startLine: number;
}

/**
 * Normalizes text lines and identifies potential headings and paragraph blocks.
 */
function extractBlocks(text: string): ExtractedBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: ExtractedBlock[] = [];
  let currentBlockContent: string[] = [];
  let currentHeading: string | undefined = undefined;

  const isHeadingLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 90) return false;
    if (isProseSentence(trimmed)) return false;
    // Check markdown style headers (# Heading)
    if (/^#{1,4}\s+\S+/.test(trimmed)) return true;
    // Check HTML header tags (<h1..>)
    if (/^<h[1-4][^>]*>.*<\/h[1-4]>$/i.test(trimmed)) return true;
    // Check numbered sections (1. Methods, 2.1 Study Design)
    if (/^(?:\d+\.?)+\s+[A-ZÆØÅ][a-zA-ZæøåÆØÅ\s]{2,50}$/.test(trimmed)) return true;
    // Check uppercase standalone headings
    if (/^[A-ZÆØÅ\s]{3,40}$/.test(trimmed) && trimmed.length < 40) return true;
    // Short line without trailing punctuation
    if (/^[A-ZÆØÅ][a-zA-ZæøåÆØÅ\s]{2,45}$/.test(trimmed) && !/[.,;:]$/.test(trimmed)) {
      return true;
    }
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isHeadingLine(trimmed)) {
      if (currentBlockContent.length > 0) {
        blocks.push({
          headingText: currentHeading,
          isHeading: false,
          content: currentBlockContent.join('\n'),
          startLine: i - currentBlockContent.length
        });
        currentBlockContent = [];
      }
      currentHeading = trimmed.replace(/^#{1,4}\s+/, '').replace(/^<\/?h[1-4][^>]*>/gi, '').trim();
    } else {
      if (trimmed) {
        currentBlockContent.push(line);
      }
    }
  }

  if (currentBlockContent.length > 0) {
    blocks.push({
      headingText: currentHeading,
      isHeading: false,
      content: currentBlockContent.join('\n'),
      startLine: lines.length - currentBlockContent.length
    });
  }

  return blocks;
}

/**
 * Recommended reporting standard mapping by study design
 */
export function getRecommendedReportingStandard(
  documentType?: StudyRecord['documentType']
): {
  standard: 'CONSORT' | 'PRISMA' | 'STROBE' | 'COREQ' | 'SRQR' | 'STARD' | 'CARE' | 'SQUIRE' | 'RIGHT' | 'General';
  rationale: string;
} {
  switch (documentType) {
    case 'Randomized Controlled Trial':
      return {
        standard: 'CONSORT',
        rationale: 'CONSORT 2010 er den etablerte standarden for rapportering av randomiserte kontrollerte studier (RCT).'
      };
    case 'Systematic Review / Meta-Analysis':
    case 'Cochrane Systematic Review':
      return {
        standard: 'PRISMA',
        rationale: 'PRISMA 2020 er den internasjonale gullstandarden for transparente oversiktsartikler og meta-analyser.'
      };
    case 'Observational Cohort':
      return {
        standard: 'STROBE',
        rationale: 'STROBE er standarden for rapportering av observasjonsstudier (kohort, kasus-kontroll og tverrsnitt).'
      };
    case 'Qualitative Research':
    case 'Qualitative Empirical Study':
    case 'Qualitative Systematic Review':
      return {
        standard: 'COREQ',
        rationale: 'COREQ (32 ledd for intervjuer/fokusgrupper) eller SRQR er standardene for transparent kvalitativ forskning.'
      };
    case 'Clinical Practice Guideline':
      return {
        standard: 'RIGHT',
        rationale: 'RIGHT (Reporting Items for Practice Guidelines in Healthcare) / AGREE-S for faglige retningslinjer.'
      };
    case 'Diagnostic Accuracy Study':
      return {
        standard: 'STARD',
        rationale: 'STARD 2015 er standarden for transparent rapportering av diagnostiske nøyaktighetsstudier.'
      };
    case 'Case Report':
      return {
        standard: 'CARE',
        rationale: 'CARE-retningslinjene sikrer transparent og komplett kasusrapportering.'
      };
    case 'Quality Improvement Study':
      return {
        standard: 'SQUIRE',
        rationale: 'SQUIRE 2.0 (Standards for QUality Improvement Reporting Excellence) for systematiske kvalitetsforbedringsprosjekter.'
      };
    case 'Non-randomised Intervention':
      return {
        standard: 'STROBE',
        rationale: 'STROBE / TREND for transparente ikke-randomiserte intervensjonsstudier.'
      };
    default:
      return {
        standard: 'General',
        rationale: 'Generell vitenskapelig IMRaD-struktur. Spesifiser studiedesign for målrettet sjekkliste.'
      };
  }
}

/**
 * Analyzes the structural integrity and reporting architecture of a research manuscript
 * according to the canonical IMRaD standard (Introduction, Methods, Results, Discussion).
 *
 * CRITICAL METHODOLOGICAL PRINCIPLE:
 * - Differentiates between DETECTED (explicit heading), INFERRED (content signals without explicit heading), and MISSING.
 * - Missing or inferred sections NEVER imply methodological bias or poor research quality.
 * - Empty, short, or noisy OCR documents are marked with explicit limitations without false positive completions.
 */
export function analyzeIMRaDStructure(
  text: string,
  fileName: string = 'manuscript.txt',
  documentType?: StudyRecord['documentType']
): IMRaDAnalysisResult {
  const trimmed = (text || '').trim();
  const wordCountTotal = (trimmed.match(/[\p{L}\p{N}_\-]+/gu) || []).length;
  const limitations: string[] = [];

  // Guard 0: Explicit OCR_REQUIRED condition
  if (trimmed.includes('OCR_REQUIRED') || trimmed.startsWith('[OCR_REQUIRED')) {
    const ocrSections: IMRaDSectionAnalysis[] = IMRAD_MATCHERS.map(m => ({
      key: m.key,
      label: m.label,
      detected: false,
      explicitHeading: false,
      confidence: 0,
      characterCount: 0,
      wordCount: 0,
      evidencePreview: '',
      status: 'OCR_REQUIRED' as IMRaDSectionStatus
    }));

    return {
      fileName,
      standard: 'IMRaD',
      standardDescription: 'Klassisk vitenskapelig rapporteringsstruktur: Introduction, Methods, Results, Discussion.',
      analyzedAt: new Date().toISOString(),
      complete: false,
      explicitComplete: false,
      detectedSectionCount: 0,
      explicitHeadingCount: 0,
      confidence: 0,
      sections: ocrSections,
      missingSections: ['introduction', 'methods', 'results', 'discussion'],
      limitations: ['Dokumentet krever OCR (ingen lesbar digital tekststrøm tilgjengelig). Optisk tegngjenkjenning må kjøres før strukturanalyse.'],
      methodologicalNotice: 'OCR_REQUIRED: Parseren fant ingen lesbar digital tekststrøm. Dette skyldes skannet bilde/PDF eller manglende tekstlag, og er IKKE en metodisk mangel ved selve studien.',
      expectedStructureRationale: getRecommendedReportingStandard(documentType).rationale,
      recommendedReportingStandard: getRecommendedReportingStandard(documentType).standard,
      isOcrRequired: true
    };
  }

  // Guard 1: Empty or whitespace-only document
  if (!trimmed) {
    const emptySections: IMRaDSectionAnalysis[] = IMRAD_MATCHERS.map(m => ({
      key: m.key,
      label: m.label,
      detected: false,
      explicitHeading: false,
      confidence: 0,
      characterCount: 0,
      wordCount: 0,
      evidencePreview: '',
      status: 'MISSING'
    }));

    return {
      fileName,
      standard: 'IMRaD',
      standardDescription: 'Klassisk vitenskapelig rapporteringsstruktur: Introduction, Methods, Results, Discussion.',
      analyzedAt: new Date().toISOString(),
      complete: false,
      explicitComplete: false,
      detectedSectionCount: 0,
      explicitHeadingCount: 0,
      confidence: 0,
      sections: emptySections,
      missingSections: ['introduction', 'methods', 'results', 'discussion'],
      limitations: ['Dokumentet er tomt eller inneholder ingen lesbar tekst.'],
      methodologicalNotice: 'Strukturanalyse kan ikke gjennomføres på tomt dokument. Ingen metodiske kvalitetsvurderinger kan foretas.',
      expectedStructureRationale: getRecommendedReportingStandard(documentType).rationale,
      recommendedReportingStandard: getRecommendedReportingStandard(documentType).standard
    };
  }

  // Guard 2: Extremely short text (< 120 characters or < 25 words)
  if (trimmed.length < 120 || wordCountTotal < 25) {
    limitations.push('Dokumentet har svært lite tekstgrunnlag (< 25 ord). Strukturanalyse gir lav metodisk sikkerhet.');
  }

  // Guard 3: Suspected OCR noise or poor PDF text extraction
  const nonAsciiOrSymbolCount = (trimmed.match(/[^\w\s\u00C0-\u024F.,;:'"()\-–—?!/]/g) || []).length;
  const symbolRatio = nonAsciiOrSymbolCount / Math.max(1, trimmed.length);
  if (symbolRatio > 0.18) {
    limitations.push('Høy andel uregelmessige tegn/støy detektert (OCR/PDF ekstraksjonsartefakter). Kan påvirke overskriftsgjenkjenning.');
  }

  const blocks = extractBlocks(trimmed);
  const sections: IMRaDSectionAnalysis[] = [];

  for (const matcher of IMRAD_MATCHERS) {
    let explicitHeadingFound: string | undefined = undefined;
    let explicitBlockContent = '';
    let inferredBlockContent = '';
    let signalCount = 0;

    // Step 1: Search for explicit headings
    for (const block of blocks) {
      if (block.headingText) {
        const matchesHeading = matcher.headingPatterns.some(p => p.test(block.headingText!));
        if (matchesHeading) {
          explicitHeadingFound = block.headingText;
          explicitBlockContent += (explicitBlockContent ? '\n\n' : '') + block.content;
        }
      }
    }

    // Step 2: If no explicit block was matched via extracted blocks, check raw text for line headings
    if (!explicitHeadingFound) {
      const lines = trimmed.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length > 0 && line.length < 80) {
          if (isProseSentence(line)) continue;
          const matches = matcher.headingPatterns.some(p => p.test(line));
          if (matches) {
            explicitHeadingFound = line;
            // Gather succeeding lines up to next heading or end
            const slice = lines.slice(i + 1, Math.min(lines.length, i + 40)).join('\n');
            explicitBlockContent = slice;
            break;
          }
        }
      }
    }

    // Step 3: Semantic signal analysis for paragraph fallback / inferred detection
    for (const sig of matcher.semanticSignals) {
      const match = trimmed.match(sig);
      if (match) {
        signalCount++;
        if (!inferredBlockContent && match.index !== undefined) {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(trimmed.length, match.index + 250);
          inferredBlockContent = trimmed.substring(start, end).trim();
        }
      }
    }

    // Determine status & confidence
    let status: IMRaDSectionStatus = 'MISSING';
    let confidence = 0;
    let detected = false;
    let explicitHeading = false;
    let evidenceText = '';

    if (explicitHeadingFound) {
      status = 'DETECTED';
      detected = true;
      explicitHeading = true;
      // Confidence is high for explicit headings in substantial text
      confidence = wordCountTotal < 25 ? 0.35 : wordCountTotal < 80 ? 0.65 : 0.95;
      evidenceText = explicitBlockContent || `Overskrift identifisert: "${explicitHeadingFound}"`;
    } else if (signalCount >= 2 && wordCountTotal >= 50) {
      // Inferred based on multiple distinct semantic markers
      status = 'INFERRED';
      detected = true;
      explicitHeading = false;
      confidence = Math.min(0.70, 0.40 + (signalCount * 0.10));
      evidenceText = inferredBlockContent || 'Semantiske tekstmarkører identifisert i brødteksten.';
    } else if (signalCount === 1 && wordCountTotal >= 80) {
      // Weak inference
      status = 'INFERRED';
      detected = true;
      explicitHeading = false;
      confidence = 0.40;
      evidenceText = inferredBlockContent || 'Enkelt semantisk signal observert.';
    } else {
      status = 'MISSING';
      detected = false;
      explicitHeading = false;
      confidence = 0.05;
      evidenceText = '';
    }

    const words = evidenceText ? (evidenceText.match(/[\p{L}\p{N}_\-]+/gu) || []).length : 0;
    const preview = evidenceText.length > 280 ? evidenceText.substring(0, 277) + '...' : evidenceText;

    sections.push({
      key: matcher.key,
      label: matcher.label,
      detected,
      explicitHeading,
      confidence: Number(confidence.toFixed(2)),
      characterCount: evidenceText.length,
      wordCount: words,
      evidencePreview: preview,
      status,
      detectedHeading: explicitHeadingFound
    });
  }

  const detectedCount = sections.filter(s => s.status === 'DETECTED' || s.status === 'INFERRED').length;
  const explicitCount = sections.filter(s => s.status === 'DETECTED').length;
  const missingKeys = sections.filter(s => s.status === 'MISSING').map(s => s.key);
  const meanConfidence = sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length;

  const reportingGuidance = getRecommendedReportingStandard(documentType);

  return {
    fileName,
    standard: 'IMRaD',
    standardDescription: 'Klassisk vitenskapelig rapporteringsstruktur: Introduction, Methods, Results, Discussion.',
    analyzedAt: new Date().toISOString(),
    complete: detectedCount === 4,
    explicitComplete: explicitCount === 4,
    detectedSectionCount: detectedCount,
    explicitHeadingCount: explicitCount,
    confidence: Number(meanConfidence.toFixed(2)),
    sections,
    missingSections: missingKeys,
    limitations,
    methodologicalNotice: 'IMRaD vurderer dokumentets rapporteringsstruktur og transparens. Identifisering eller fravær av IMRaD-ledd er IKKE en kritisk vurdering av metodisk kvalitet eller risiko for skjevhet (Risk of Bias).',
    expectedStructureRationale: reportingGuidance.rationale,
    recommendedReportingStandard: reportingGuidance.standard
  };
}
