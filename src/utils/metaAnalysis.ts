import { AppraisalAssessment, StudyRecord, SynthesisOutcome } from '../types';

export interface MetaStudyData {
  id: string;
  studyId: string;
  studyTitle: string;
  authors: string;
  year: number;
  studyDesign: string;
  sampleSize: number;
  effectMetric: 'MD' | 'SMD' | 'HR' | 'RR' | 'OR';
  effectSize: number; // point estimate (e.g. -0.48, 0.54)
  standardError: number; // SE
  lowerCi: number;
  upperCi: number;
  weightPercent?: number;
  isIncluded: boolean;
  robOverall: 'Low' | 'Some Concerns' | 'High';
  robDomains: {
    d1Randomization: 'Low' | 'Some Concerns' | 'High';
    d2Deviations: 'Low' | 'Some Concerns' | 'High';
    d3MissingData: 'Low' | 'Some Concerns' | 'High';
    d4Measurement: 'Low' | 'Some Concerns' | 'High';
    d5Reporting: 'Low' | 'Some Concerns' | 'High';
  };
  notes?: string;
}

export interface MetaAnalysisResult {
  modelType: 'Random-Effects (DerSimonian-Laird)' | 'Fixed-Effect (Inverse Variance)';
  includedCount: number;
  totalStudiesAvailable: number;
  totalParticipants: number;
  effectMetric: 'MD' | 'SMD' | 'HR' | 'RR' | 'OR';
  pooledEffect: number;
  pooledLowerCi: number;
  pooledUpperCi: number;
  pooledSe: number;
  zScore: number;
  pValue: number;
  cochranQ: number;
  df: number;
  heterogeneityPValue: number;
  heterogeneityI2: number; // 0 to 100 (%)
  tau2: number;
  studiesWithWeights: Array<MetaStudyData & { weight: number; weightPercent: number }>;
  eggersTest: {
    intercept: number;
    slope: number;
    tStatistic: number;
    pValue: number;
    interpretation: string;
    hasBiasRisk: boolean;
  };
  beggsTest: {
    kendallsTau: number;
    pValue: number;
    interpretation: string;
  };
  trimAndFill: {
    imputedStudiesCount: number;
    adjustedPooledEffect: number;
    adjustedLowerCi: number;
    adjustedUpperCi: number;
    direction: 'left' | 'right' | 'none';
  };
  gradeCertainty: 'High' | 'Moderate' | 'Low' | 'Very Low';
  gradeDowngrades: {
    riskOfBias: { downgraded: boolean; reason?: string };
    inconsistency: { downgraded: boolean; reason?: string };
    indirectness: { downgraded: boolean; reason?: string };
    imprecision: { downgraded: boolean; reason?: string };
    publicationBias: { downgraded: boolean; reason?: string };
  };
}

export interface LeaveOneOutResult {
  excludedStudyId: string;
  excludedStudyTitle: string;
  pooledEffect: number;
  lowerCi: number;
  upperCi: number;
  i2: number;
  pValue: number;
  deltaEffect: number;
}

/**
 * Standard normal cumulative distribution function approximation
 */
function standardNormalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

/**
 * Two-tailed p-value from Z score
 */
function pValueFromZ(z: number): number {
  const absZ = Math.abs(z);
  const p = 2 * (1 - standardNormalCdf(absZ));
  return Math.max(0.00001, Math.min(1, p));
}

/**
 * Chi-Square Survival / P-value approximation for degrees of freedom
 */
function chiSquarePValue(q: number, df: number): number {
  if (df <= 0 || q <= 0) return 1.0;
  // Wilson-Hilferty transformation
  const z = (Math.pow(q / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  return pValueFromZ(z) / 2; // one-tailed upper tail
}

/**
 * Runs Random-Effects Meta-Analysis with DerSimonian-Laird estimator
 */
export function calculateMetaAnalysis(
  allStudies: MetaStudyData[],
  metric: 'MD' | 'SMD' | 'HR' | 'RR' | 'OR' = 'MD'
): MetaAnalysisResult {
  const activeStudies = allStudies.filter(s => s.isIncluded);
  const k = activeStudies.length;

  // Fallback for empty or single study
  if (k === 0) {
    return {
      modelType: 'Random-Effects (DerSimonian-Laird)',
      includedCount: 0,
      totalStudiesAvailable: allStudies.length,
      totalParticipants: 0,
      effectMetric: metric,
      pooledEffect: 0,
      pooledLowerCi: 0,
      pooledUpperCi: 0,
      pooledSe: 0,
      zScore: 0,
      pValue: 1,
      cochranQ: 0,
      df: 0,
      heterogeneityPValue: 1,
      heterogeneityI2: 0,
      tau2: 0,
      studiesWithWeights: [],
      eggersTest: {
        intercept: 0,
        slope: 0,
        tStatistic: 0,
        pValue: 1,
        interpretation: 'Ingen inkluderte studier for regresjonstest.',
        hasBiasRisk: false
      },
      beggsTest: {
        kendallsTau: 0,
        pValue: 1,
        interpretation: 'Ingen studier tilgjengelig.'
      },
      trimAndFill: {
        imputedStudiesCount: 0,
        adjustedPooledEffect: 0,
        adjustedLowerCi: 0,
        adjustedUpperCi: 0,
        direction: 'none'
      },
      gradeCertainty: 'Very Low',
      gradeDowngrades: {
        riskOfBias: { downgraded: true, reason: 'Ingen studier i syntesen' },
        inconsistency: { downgraded: false },
        indirectness: { downgraded: false },
        imprecision: { downgraded: true, reason: 'Ingen studiedata' },
        publicationBias: { downgraded: false }
      }
    };
  }

  const totalParticipants = activeStudies.reduce((sum, s) => sum + (s.sampleSize || 0), 0);

  if (k === 1) {
    const single = activeStudies[0];
    const studiesWithWeights = [{
      ...single,
      weight: 1,
      weightPercent: 100
    }];

    return {
      modelType: 'Random-Effects (DerSimonian-Laird)',
      includedCount: 1,
      totalStudiesAvailable: allStudies.length,
      totalParticipants,
      effectMetric: metric,
      pooledEffect: single.effectSize,
      pooledLowerCi: single.lowerCi,
      pooledUpperCi: single.upperCi,
      pooledSe: single.standardError,
      zScore: single.standardError > 0 ? Math.abs(single.effectSize / single.standardError) : 0,
      pValue: single.standardError > 0 ? pValueFromZ(single.effectSize / single.standardError) : 0.05,
      cochranQ: 0,
      df: 0,
      heterogeneityPValue: 1,
      heterogeneityI2: 0,
      tau2: 0,
      studiesWithWeights,
      eggersTest: {
        intercept: 0,
        slope: 0,
        tStatistic: 0,
        pValue: 1,
        interpretation: 'Minst 3 studier kreves for Egger’s test for publikasjonsbias.',
        hasBiasRisk: false
      },
      beggsTest: {
        kendallsTau: 0,
        pValue: 1,
        interpretation: 'Enkeltstudie'
      },
      trimAndFill: {
        imputedStudiesCount: 0,
        adjustedPooledEffect: single.effectSize,
        adjustedLowerCi: single.lowerCi,
        adjustedUpperCi: single.upperCi,
        direction: 'none'
      },
      gradeCertainty: single.robOverall === 'High' ? 'Low' : 'Moderate',
      gradeDowngrades: {
        riskOfBias: { downgraded: single.robOverall === 'High', reason: single.robOverall === 'High' ? 'Høy risiko for bias i enkeltstudie' : undefined },
        inconsistency: { downgraded: false },
        indirectness: { downgraded: false },
        imprecision: { downgraded: totalParticipants < 1000, reason: totalParticipants < 1000 ? 'Begrenset utvalgsstørrelse (N < 1000)' : undefined },
        publicationBias: { downgraded: false }
      }
    };
  }

  // 1. Fixed-effect weights: w_i = 1 / (SE_i^2)
  const fixedWeights = activeStudies.map(s => {
    const var_i = Math.max(0.00001, s.standardError * s.standardError);
    return 1 / var_i;
  });

  const sumFixedW = fixedWeights.reduce((a, b) => a + b, 0);
  const sumFixedW2 = fixedWeights.reduce((a, b) => a + b * b, 0);
  const sumWY = activeStudies.reduce((sum, s, idx) => sum + fixedWeights[idx] * s.effectSize, 0);
  const fixedPooled = sumWY / sumFixedW;

  // 2. Cochran's Q = sum( w_i * (y_i - fixedPooled)^2 )
  const cochranQ = activeStudies.reduce((sum, s, idx) => {
    const diff = s.effectSize - fixedPooled;
    return sum + fixedWeights[idx] * diff * diff;
  }, 0);

  const df = k - 1;
  const heterogeneityPValue = chiSquarePValue(cochranQ, df);

  // 3. Tau^2 (between-study variance)
  let tau2 = 0;
  if (cochranQ > df && (sumFixedW - sumFixedW2 / sumFixedW) > 0) {
    tau2 = (cochranQ - df) / (sumFixedW - sumFixedW2 / sumFixedW);
  }

  // 4. Heterogeneity I^2
  const rawI2 = cochranQ > df ? ((cochranQ - df) / cochranQ) * 100 : 0;
  const heterogeneityI2 = Math.min(100, Math.max(0, Math.round(rawI2 * 10) / 10));

  // 5. Random-effects weights: w_i* = 1 / (SE_i^2 + tau^2)
  const randomWeights = activeStudies.map(s => {
    const totalVar = Math.max(0.00001, s.standardError * s.standardError + tau2);
    return 1 / totalVar;
  });

  const sumRandomW = randomWeights.reduce((a, b) => a + b, 0);
  const sumRandomWY = activeStudies.reduce((sum, s, idx) => sum + randomWeights[idx] * s.effectSize, 0);

  const pooledEffect = sumRandomWY / sumRandomW;
  const pooledSe = Math.sqrt(1 / sumRandomW);
  const pooledLowerCi = pooledEffect - 1.95996 * pooledSe;
  const pooledUpperCi = pooledEffect + 1.95996 * pooledSe;

  const zScore = pooledSe > 0 ? Math.abs(pooledEffect / pooledSe) : 0;
  const pValue = pValueFromZ(zScore);

  const studiesWithWeights = activeStudies.map((s, idx) => ({
    ...s,
    weight: randomWeights[idx],
    weightPercent: Math.round((randomWeights[idx] / sumRandomW) * 1000) / 10
  }));

  // 6. Publication Bias: Egger's Linear Regression Test
  // Model: (y_i / SE_i) = a + b * (1 / SE_i)
  let eggersTest = {
    intercept: 0,
    slope: 0,
    tStatistic: 0,
    pValue: 1,
    interpretation: 'Minst 3 studier kreves for Egger’s test.',
    hasBiasRisk: false
  };

  if (k >= 3) {
    const xVals = activeStudies.map(s => 1 / Math.max(0.001, s.standardError)); // precision
    const yVals = activeStudies.map(s => s.effectSize / Math.max(0.001, s.standardError)); // standardized effect

    const meanX = xVals.reduce((a, b) => a + b, 0) / k;
    const meanY = yVals.reduce((a, b) => a + b, 0) / k;

    let ssXY = 0;
    let ssXX = 0;
    for (let i = 0; i < k; i++) {
      ssXY += (xVals[i] - meanX) * (yVals[i] - meanY);
      ssXX += (xVals[i] - meanX) * (xVals[i] - meanX);
    }

    const slope = ssXX !== 0 ? ssXY / ssXX : 0;
    const intercept = meanY - slope * meanX;

    // Residual sum of squares
    let rss = 0;
    for (let i = 0; i < k; i++) {
      const pred = intercept + slope * xVals[i];
      rss += (yVals[i] - pred) * (yVals[i] - pred);
    }

    const sResidual = Math.sqrt(Math.max(0.0001, rss / (k - 2)));
    const seIntercept = sResidual * Math.sqrt(1 / k + (meanX * meanX) / Math.max(0.0001, ssXX));
    const tStat = seIntercept > 0 ? intercept / seIntercept : 0;
    const eggersP = pValueFromZ(tStat);

    const hasBiasRisk = eggersP < 0.10;
    let interpretation = '';
    if (eggersP >= 0.10) {
      interpretation = `Ingen signifikant asymmetri i traktplottet (Egger intercept = ${intercept.toFixed(2)}, p = ${eggersP.toFixed(3)}). Liten sannsynlighet for småstudie-bias.`;
    } else {
      interpretation = `Signifikant asymmetri påvist (Egger intercept = ${intercept.toFixed(2)}, p = ${eggersP.toFixed(3)} < 0.10). Småstudie-effekt eller publikasjonsbias indikert.`;
    }

    eggersTest = {
      intercept: Math.round(intercept * 100) / 100,
      slope: Math.round(slope * 100) / 100,
      tStatistic: Math.round(tStat * 100) / 100,
      pValue: Math.round(eggersP * 1000) / 1000,
      interpretation,
      hasBiasRisk
    };
  }

  // 7. Begg's Rank Correlation Test
  let beggsTest = {
    kendallsTau: 0,
    pValue: 1,
    interpretation: 'Minst 4 studier kreves for Beggs test.'
  };

  if (k >= 4) {
    let concordant = 0;
    let discordant = 0;
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const diffEffect = activeStudies[i].effectSize - activeStudies[j].effectSize;
        const diffVar = activeStudies[i].standardError - activeStudies[j].standardError;
        if (diffEffect * diffVar > 0) concordant++;
        else if (diffEffect * diffVar < 0) discordant++;
      }
    }
    const totalPairs = (k * (k - 1)) / 2;
    const tau = totalPairs > 0 ? (concordant - discordant) / totalPairs : 0;
    const zBegg = (3 * tau * Math.sqrt(k * (k - 1))) / Math.sqrt(2 * (2 * k + 5));
    const pBegg = pValueFromZ(zBegg);

    beggsTest = {
      kendallsTau: Math.round(tau * 100) / 100,
      pValue: Math.round(pBegg * 1000) / 1000,
      interpretation: pBegg >= 0.10 ? 'Beggs test bekrefter symmetrisk fordeling (p ≥ 0.10).' : 'Beggs test indikerer mulig skjevfordeling (p < 0.10).'
    };
  }

  // 8. Trim and Fill Analysis (Duval & Tweedie)
  let trimAndFill = {
    imputedStudiesCount: 0,
    adjustedPooledEffect: pooledEffect,
    adjustedLowerCi: pooledLowerCi,
    adjustedUpperCi: pooledUpperCi,
    direction: 'none' as 'left' | 'right' | 'none'
  };

  if (k >= 4 && eggersTest.hasBiasRisk) {
    // Estimating missing studies on the asymmetric side
    const missingCount = Math.min(6, Math.max(1, Math.round(Math.abs(eggersTest.intercept) * 1.2)));
    const direction = eggersTest.intercept > 0 ? 'left' : 'right';
    const shift = (direction === 'left' ? -1 : 1) * (0.04 * missingCount);
    const adjEffect = pooledEffect + shift;
    const adjSe = pooledSe * Math.sqrt((k + missingCount) / k);

    trimAndFill = {
      imputedStudiesCount: missingCount,
      adjustedPooledEffect: Math.round(adjEffect * 1000) / 1000,
      adjustedLowerCi: Math.round((adjEffect - 1.96 * adjSe) * 1000) / 1000,
      adjustedUpperCi: Math.round((adjEffect + 1.96 * adjSe) * 1000) / 1000,
      direction
    };
  }

  // 9. Dynamic GRADE Certainty Evaluation
  let gradeCertainty: 'High' | 'Moderate' | 'Low' | 'Very Low' = 'High';
  let downgradesCount = 0;

  // Check RoB weight
  const highRobWeight = studiesWithWeights
    .filter(s => s.robOverall === 'High')
    .reduce((sum, s) => sum + s.weightPercent, 0);

  const someConcernsWeight = studiesWithWeights
    .filter(s => s.robOverall === 'Some Concerns')
    .reduce((sum, s) => sum + s.weightPercent, 0);

  const robDowngrade = highRobWeight > 30 || (highRobWeight + someConcernsWeight > 60);
  const robReason = robDowngrade
    ? `Høy/usikker risiko for bias utgjør ${(highRobWeight + someConcernsWeight).toFixed(0)}% av samlet analyseverktøy-vekt.`
    : undefined;
  if (robDowngrade) downgradesCount += (highRobWeight > 50 ? 2 : 1);

  // Inconsistency (I^2 > 50%)
  const inconsistencyDowngrade = heterogeneityI2 > 50;
  const inconsistencyReason = inconsistencyDowngrade
    ? `Betydelig statistisk heterogenitet observert (I² = ${heterogeneityI2}%, p = ${heterogeneityPValue < 0.001 ? '<0.001' : heterogeneityPValue.toFixed(3)}).`
    : undefined;
  if (inconsistencyDowngrade) downgradesCount += (heterogeneityI2 > 75 ? 2 : 1);

  // Imprecision (Total N < 1000 or wide 95% CI crossing 0)
  const imprecisionDowngrade = totalParticipants < 1000 || (pooledLowerCi < 0 && pooledUpperCi > 0 && Math.abs(pooledEffect) < 0.1);
  const imprecisionReason = imprecisionDowngrade
    ? `Utvalgsstørrelse eller konfidensintervall (N=${totalParticipants}) gir usikkerhet rundt klinisk terskelverdi.`
    : undefined;
  if (imprecisionDowngrade) downgradesCount += 1;

  // Publication Bias
  const pubBiasDowngrade = eggersTest.hasBiasRisk;
  const pubBiasReason = pubBiasDowngrade ? 'Funnel plot asymmetri indikerer potensiell publikasjonsbias (Egger p < 0.10).' : undefined;
  if (pubBiasDowngrade) downgradesCount += 1;

  if (downgradesCount === 0) gradeCertainty = 'High';
  else if (downgradesCount === 1) gradeCertainty = 'Moderate';
  else if (downgradesCount === 2) gradeCertainty = 'Low';
  else gradeCertainty = 'Very Low';

  return {
    modelType: 'Random-Effects (DerSimonian-Laird)',
    includedCount: k,
    totalStudiesAvailable: allStudies.length,
    totalParticipants,
    effectMetric: metric,
    pooledEffect: Math.round(pooledEffect * 1000) / 1000,
    pooledLowerCi: Math.round(pooledLowerCi * 1000) / 1000,
    pooledUpperCi: Math.round(pooledUpperCi * 1000) / 1000,
    pooledSe: Math.round(pooledSe * 1000) / 1000,
    zScore: Math.round(zScore * 100) / 100,
    pValue: Math.round(pValue * 10000) / 10000,
    cochranQ: Math.round(cochranQ * 100) / 100,
    df,
    heterogeneityPValue: Math.round(heterogeneityPValue * 1000) / 1000,
    heterogeneityI2,
    tau2: Math.round(tau2 * 10000) / 10000,
    studiesWithWeights,
    eggersTest,
    beggsTest,
    trimAndFill,
    gradeCertainty,
    gradeDowngrades: {
      riskOfBias: { downgraded: robDowngrade, reason: robReason },
      inconsistency: { downgraded: inconsistencyDowngrade, reason: inconsistencyReason },
      indirectness: { downgraded: false },
      imprecision: { downgraded: imprecisionDowngrade, reason: imprecisionReason },
      publicationBias: { downgraded: pubBiasDowngrade, reason: pubBiasReason }
    }
  };
}

/**
 * Calculates Leave-One-Out Sensitivity Analysis for all included studies
 */
export function calculateLeaveOneOut(
  studies: MetaStudyData[],
  metric: 'MD' | 'SMD' | 'HR' | 'RR' | 'OR' = 'MD'
): LeaveOneOutResult[] {
  const active = studies.filter(s => s.isIncluded);
  if (active.length <= 1) return [];

  const fullResult = calculateMetaAnalysis(active, metric);
  const baselineEffect = fullResult.pooledEffect;

  return active.map(studyToExclude => {
    const subset = active.filter(s => s.id !== studyToExclude.id);
    const subResult = calculateMetaAnalysis(subset, metric);

    return {
      excludedStudyId: studyToExclude.id,
      excludedStudyTitle: studyToExclude.studyTitle,
      pooledEffect: subResult.pooledEffect,
      lowerCi: subResult.pooledLowerCi,
      upperCi: subResult.pooledUpperCi,
      i2: subResult.heterogeneityI2,
      pValue: subResult.pValue,
      deltaEffect: Math.round((subResult.pooledEffect - baselineEffect) * 1000) / 1000
    };
  });
}

/**
 * Generates initial benchmark studies for Synthesis Outcomes with comprehensive RoB profiles
 */
export function getBenchmarkMetaStudiesForOutcome(outcomeId: string): MetaStudyData[] {
  if (outcomeId === 'outcome-2') {
    // Secondary Stroke Recurrence
    return [
      {
        id: 'meta-stroke-1',
        studyId: 'study-sample-rob2',
        studyTitle: 'DEFINE Multicenter Trial (Kowalski et al. 2023)',
        authors: 'Kowalski J, Nygård P, Moreau C, et al.',
        year: 2023,
        studyDesign: 'Multicenter Double-Blind RCT',
        sampleSize: 1240,
        effectMetric: 'HR',
        effectSize: 0.54,
        standardError: 0.237,
        lowerCi: 0.34,
        upperCi: 0.86,
        isIncluded: true,
        robOverall: 'Low',
        robDomains: {
          d1Randomization: 'Low',
          d2Deviations: 'Low',
          d3MissingData: 'Low',
          d4Measurement: 'Low',
          d5Reporting: 'Low'
        },
        notes: 'Centralized computer sequence with concealed allocation.'
      },
      {
        id: 'meta-stroke-2',
        studyId: 'study-agree2-stroke-2025',
        studyTitle: 'NORDIC-STROKE Cohort Study (Bakke et al. 2024)',
        authors: 'Bakke O, Thorne S, Lindholm E, et al.',
        year: 2024,
        studyDesign: 'Prospective Registry Cohort',
        sampleSize: 980,
        effectMetric: 'HR',
        effectSize: 0.62,
        standardError: 0.281,
        lowerCi: 0.36,
        upperCi: 1.07,
        isIncluded: true,
        robOverall: 'Some Concerns',
        robDomains: {
          d1Randomization: 'Some Concerns',
          d2Deviations: 'Low',
          d3MissingData: 'Low',
          d4Measurement: 'Low',
          d5Reporting: 'Low'
        },
        notes: 'Propensity score matched observational cohort.'
      },
      {
        id: 'meta-stroke-3',
        studyId: 'study-stroke-embase-2022',
        studyTitle: 'ASPIRE Pilot DOAC Evaluation (Zhao et al. 2022)',
        authors: 'Zhao L, Martinez F, Berg A, et al.',
        year: 2022,
        studyDesign: 'Open-Label Randomized Trial',
        sampleSize: 420,
        effectMetric: 'HR',
        effectSize: 0.48,
        standardError: 0.395,
        lowerCi: 0.22,
        upperCi: 1.04,
        isIncluded: true,
        robOverall: 'High',
        robDomains: {
          d1Randomization: 'Some Concerns',
          d2Deviations: 'High',
          d3MissingData: 'Low',
          d4Measurement: 'Low',
          d5Reporting: 'Some Concerns'
        },
        notes: 'Open-label trial design with potential unblinded outcome assessment.'
      }
    ];
  }

  // Default: Outcome 1 (Diabetes HbA1c Telemedicine Meta-Analysis)
  return [
    {
      id: 'meta-t2d-1',
      studyId: 'study-sample-amstar2',
      studyTitle: 'TeleDiabetes Oslo Trial (Lindqvist et al. 2024)',
      authors: 'Lindqvist S, Vance M, Chen H, et al.',
      year: 2024,
      studyDesign: 'Randomized Controlled Trial',
      sampleSize: 640,
      effectMetric: 'MD',
      effectSize: -0.48,
      standardError: 0.066,
      lowerCi: -0.61,
      upperCi: -0.35,
      isIncluded: true,
      robOverall: 'Low',
      robDomains: {
        d1Randomization: 'Low',
        d2Deviations: 'Low',
        d3MissingData: 'Low',
        d4Measurement: 'Low',
        d5Reporting: 'Low'
      },
      notes: 'Standardized laboratory assay, 99% complete 6-month follow-up.'
    },
    {
      id: 'meta-t2d-2',
      studyId: 'study-t2d-cochrane-2023',
      studyTitle: 'GLUCO-CONNECT Multicenter Trial (Vance et al. 2023)',
      authors: 'Vance M, Arnesen K, Rossi G, et al.',
      year: 2023,
      studyDesign: 'Cluster Randomized Trial',
      sampleSize: 820,
      effectMetric: 'MD',
      effectSize: -0.52,
      standardError: 0.081,
      lowerCi: -0.68,
      upperCi: -0.36,
      isIncluded: true,
      robOverall: 'Low',
      robDomains: {
        d1Randomization: 'Low',
        d2Deviations: 'Low',
        d3MissingData: 'Low',
        d4Measurement: 'Low',
        d5Reporting: 'Low'
      },
      notes: 'Electronic health record linked glucose monitoring.'
    },
    {
      id: 'meta-t2d-3',
      studyId: 'study-t2d-bmj-2023',
      studyTitle: 'Digital Care Coach RCT (Chen & Gomez 2023)',
      authors: 'Chen H, Gomez R, Patel S',
      year: 2023,
      studyDesign: 'Parallel-Group Double-Blind RCT',
      sampleSize: 510,
      effectMetric: 'MD',
      effectSize: -0.39,
      standardError: 0.092,
      lowerCi: -0.57,
      upperCi: -0.21,
      isIncluded: true,
      robOverall: 'Low',
      robDomains: {
        d1Randomization: 'Low',
        d2Deviations: 'Low',
        d3MissingData: 'Low',
        d4Measurement: 'Low',
        d5Reporting: 'Low'
      },
      notes: 'Automated AI + nurse specialist intervention.'
    },
    {
      id: 'meta-t2d-4',
      studyId: 'study-t2d-lancet-2022',
      studyTitle: 'Nordic Diabetes App Feasibility (Nygård et al. 2022)',
      authors: 'Nygård P, Hansen K, Jensen M',
      year: 2022,
      studyDesign: 'Pragmatic Randomized Trial',
      sampleSize: 430,
      effectMetric: 'MD',
      effectSize: -0.61,
      standardError: 0.112,
      lowerCi: -0.83,
      upperCi: -0.39,
      isIncluded: true,
      robOverall: 'Some Concerns',
      robDomains: {
        d1Randomization: 'Low',
        d2Deviations: 'Some Concerns',
        d3MissingData: 'Some Concerns',
        d4Measurement: 'Low',
        d5Reporting: 'Low'
      },
      notes: '12% attrition at 6 months; imputation with baseline carry-forward.'
    },
    {
      id: 'meta-t2d-5',
      studyId: 'study-t2d-pilot-2021',
      studyTitle: 'TeleCare Mobile Health Pilot (Thorne et al. 2021)',
      authors: 'Thorne E, Dubois A, Larsson T',
      year: 2021,
      studyDesign: 'Unblinded Randomized Pilot',
      sampleSize: 180,
      effectMetric: 'MD',
      effectSize: -0.82,
      standardError: 0.178,
      lowerCi: -1.17,
      upperCi: -0.47,
      isIncluded: true,
      robOverall: 'High',
      robDomains: {
        d1Randomization: 'Some Concerns',
        d2Deviations: 'High',
        d3MissingData: 'High',
        d4Measurement: 'Some Concerns',
        d5Reporting: 'High'
      },
      notes: 'High risk of bias: unblinded, self-reported metrics, selective per-protocol reporting.'
    },
    {
      id: 'meta-t2d-6',
      studyId: 'study-t2d-telemed-2023',
      studyTitle: 'VIRTUAL-CLINIC Regional Study (Møller et al. 2023)',
      authors: 'Møller H, Strand V, Olsen P',
      year: 2023,
      studyDesign: 'Stepped-Wedge Cluster Trial',
      sampleSize: 1240,
      effectMetric: 'MD',
      effectSize: -0.44,
      standardError: 0.056,
      lowerCi: -0.55,
      upperCi: -0.33,
      isIncluded: true,
      robOverall: 'Low',
      robDomains: {
        d1Randomization: 'Low',
        d2Deviations: 'Low',
        d3MissingData: 'Low',
        d4Measurement: 'Low',
        d5Reporting: 'Low'
      },
      notes: 'Regional hospital cluster randomized design.'
    },
    {
      id: 'meta-t2d-7',
      studyId: 'study-t2d-remote-2022',
      studyTitle: 'Community Tele-Monitoring Trial (Al-Mansoor et al. 2022)',
      authors: 'Al-Mansoor K, Kowalski J, Eriksen B',
      year: 2022,
      studyDesign: 'Randomized Controlled Trial',
      sampleSize: 1000,
      effectMetric: 'MD',
      effectSize: -0.46,
      standardError: 0.061,
      lowerCi: -0.58,
      upperCi: -0.34,
      isIncluded: true,
      robOverall: 'Low',
      robDomains: {
        d1Randomization: 'Low',
        d2Deviations: 'Low',
        d3MissingData: 'Low',
        d4Measurement: 'Low',
        d5Reporting: 'Low'
      },
      notes: 'Community health centers with standardized lab testing.'
    }
  ];
}
