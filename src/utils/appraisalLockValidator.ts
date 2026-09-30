import type { 
  StudyRecord, 
  AppraisalAssessment, 
  AppraisalDomain,
  AppraisalInstrument
} from '../types/index.ts';
import { getFrameworkDomains } from './frameworks.ts';

export interface AppraisalLockValidationResult {
  canLock: boolean;
  blockers: string[];
  warnings: string[];
  metrics: {
    hasValidDesign: boolean;
    hasValidInstrument: boolean;
    criticalItemsAnswered: boolean;
    unansweredCriticalDomains: string[];
    humanVerified: boolean;
    evidenceOwnershipValid: boolean;
    provenanceValid: boolean;
    completionPercentage: number;
  };
}

/**
 * Validates the methodological and cryptographic integrity of a study appraisal
 * before it can be sealed with SHA-256 and locked against tampering.
 *
 * LOCK INTEGRITY REQUIREMENTS:
 * 1. Valid study design must be specified (not 'Unspecified / Unknown' or missing).
 * 2. An appraisal assessment must exist for the study with a validated instrument.
 * 3. All critical methodological domains (or all mandatory domains) must have an explicit answer.
 * 4. Human Verification: At least the critical domains or overall assessment must have been
 *    explicitly reviewed and verified by a human researcher (verifiedByResearcher === true).
 * 5. Evidence Ownership: All findings and extracted data points must belong to this specific studyId.
 * 6. Workflow Provenance: Valid SHA-256 document hash and import timestamp must be present.
 */
export function validateStudyAppraisalLock(
  study: StudyRecord,
  assessment?: AppraisalAssessment,
  frameworkDomains?: AppraisalDomain[]
): AppraisalLockValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Study Design Check
  const validDesigns = [
    'Systematic Review / Meta-Analysis',
    'Cochrane Systematic Review',
    'Randomized Controlled Trial',
    'Observational Cohort',
    'Clinical Practice Guideline',
    'Qualitative Research',
    'Qualitative Systematic Review',
    'Qualitative Empirical Study',
    'Diagnostic Accuracy Study',
    'Case Report',
    'Quality Improvement Study',
    'Non-randomised Intervention',
    'General Research Document'
  ];

  const hasValidDesign = Boolean(
    study.documentType && 
    study.documentType !== 'Unspecified / Unknown' &&
    validDesigns.includes(study.documentType)
  );

  if (!hasValidDesign) {
    blockers.push('Studiedesign mangler eller er uavklart. Artikkelen må klassifiseres metodisk før forsegling.');
  }

  // 2. Assessment & Instrument Check
  if (!assessment) {
    blockers.push('Ingen metodisk vurdering (AppraisalAssessment) er registrert for denne studien.');
    return {
      canLock: false,
      blockers,
      warnings,
      metrics: {
        hasValidDesign,
        hasValidInstrument: false,
        criticalItemsAnswered: false,
        unansweredCriticalDomains: [],
        humanVerified: false,
        evidenceOwnershipValid: false,
        provenanceValid: false,
        completionPercentage: 0
      }
    };
  }

  const validInstruments: AppraisalInstrument[] = [
    'AMSTAR2', 'CASP', 'AGREE2', 'GRADE', 'ROB2', 'CFIR', 'KTA', 'PRISMA', 'JBI', 'JBI_QUALITATIVE', 'ROBINS_I'
  ];

  const hasValidInstrument = validInstruments.includes(assessment.instrument);
  if (!hasValidInstrument) {
    blockers.push(`Ugyldig eller uregistrert appraisal-instrument: "${assessment.instrument}".`);
  }

  // Retrieve domains for the instrument
  const domains = frameworkDomains && frameworkDomains.length > 0
    ? frameworkDomains
    : getFrameworkDomains(assessment.instrument);

  if (domains.length === 0) {
    blockers.push(`Instrumentet "${assessment.instrument}" har ingen registrerte evalueringsdomener.`);
  }

  // 3. Mandatory / Critical Items Check
  const unansweredCriticalDomains: string[] = [];
  let answeredCount = 0;
  let criticalCount = 0;
  let answeredCriticalCount = 0;

  for (const domain of domains) {
    const rating = assessment.ratings[domain.id];
    const isAnswered = Boolean(rating && rating.answer && rating.answer !== '' as any);

    if (isAnswered) {
      answeredCount++;
    }

    if (domain.isCritical) {
      criticalCount++;
      if (isAnswered) {
        answeredCriticalCount++;
      } else {
        unansweredCriticalDomains.push(`Q${domain.number}: ${domain.title}`);
      }
    }
  }

  const criticalItemsAnswered = unansweredCriticalDomains.length === 0;
  if (!criticalItemsAnswered) {
    blockers.push(
      `Obligatoriske kritiske metodiske domener mangler svar (${unansweredCriticalDomains.length} gjenstår): ${unansweredCriticalDomains.slice(0, 3).join(', ')}${unansweredCriticalDomains.length > 3 ? '...' : ''}.`
    );
  }

  const completionPercentage = domains.length > 0 ? Math.round((answeredCount / domains.length) * 100) : 0;
  if (completionPercentage < 50) {
    blockers.push(`Vurderingen er under 50% fullført (${completionPercentage}% besvart). Minimum 50% og 100% av kritiske domener kreves for forsegling.`);
  } else if (completionPercentage < 100) {
    warnings.push(`Vurderingen er delvis utfylt (${completionPercentage}%). Ubesvarte ikke-kritiske domener forsegles som "Ubesvart".`);
  }

  // 4. Human Verification Check
  // At least one rating must be explicitly verified by a researcher, or overall assessment verified
  const hasHumanVerifiedRating = Object.values(assessment.ratings).some(r => r.verifiedByResearcher === true);
  const isHumanVerified = hasHumanVerifiedRating || Boolean(assessment.summaryNotes && assessment.summaryNotes.trim().length > 10);

  if (!isHumanVerified) {
    blockers.push('Human Verification mangler: Vurderingen må gjennomgås og bekreftes av en forsker før forsegling (ingen helautomatisk forsegling er tillatt).');
  }

  // 5. Evidence Ownership Check
  let evidenceOwnershipValid = true;
  if (study.findings && study.findings.length > 0) {
    // If findings are present, verify they originate from this study and contain valid references
    const foreignFindings = study.findings.filter(f => (f as any).studyId && (f as any).studyId !== study.id);
    if (foreignFindings.length > 0) {
      evidenceOwnershipValid = false;
      blockers.push(`Evidensproveniensfeil: ${foreignFindings.length} tekstelementer tilhører en annen studieID.`);
    }
  }

  // 6. Workflow Provenance Check
  const hasValidSha256 = Boolean(
    study.documentHashSha256 && 
    study.documentHashSha256.length === 64 && 
    /^[0-9a-fA-F]{64}$/.test(study.documentHashSha256)
  );
  const hasImportDate = Boolean(study.importedAt);
  const provenanceValid = hasValidSha256 && hasImportDate;

  if (!hasValidSha256) {
    blockers.push('Kildeteksten mangler gyldig SHA-256 kryptografisk sjekksum. Integritet kan ikke garanteres.');
  }
  if (!hasImportDate) {
    blockers.push('Import-tidsstempel (importedAt) mangler i studiens workflow-proveniens.');
  }

  return {
    canLock: blockers.length === 0,
    blockers,
    warnings,
    metrics: {
      hasValidDesign,
      hasValidInstrument,
      criticalItemsAnswered,
      unansweredCriticalDomains,
      humanVerified: isHumanVerified,
      evidenceOwnershipValid,
      provenanceValid,
      completionPercentage
    }
  };
}
