import type { 
  AppraisalAssessment, 
  AppraisalDomain, 
  AppraisalInstrument,
  InterRaterComparison, 
  MultiRaterComparison, 
  MultiRaterDomainRow, 
  PairwiseAgreement, 
  PairwiseReliabilityDetail,
  ProjectReliabilitySummary,
  RatingAnswer, 
  ReviewerProfile,
  StudyRecord,
  StudyReliabilityRecord
} from '../types/index.ts';
import { getFrameworkDomains } from './frameworks.ts';

/**
 * Calculates mathematical Cohen's Kappa coefficient (κ) between two reviewers.
 * Formula: κ = (Po - Pe) / (1 - Pe)
 * where Po is observed agreement and Pe is hypothetical probability of chance agreement.
 */
export function calculateCohensKappa(
  reviewerA: AppraisalAssessment,
  reviewerB: AppraisalAssessment,
  domains: AppraisalDomain[]
): InterRaterComparison {
  const discrepancies = [];
  let agreedCount = 0;
  let totalEvaluatedDomains = 0;
  const totalDomains = domains.length;

  // Track rating distribution for chance agreement calculation
  const countsA: Record<string, number> = {};
  const countsB: Record<string, number> = {};
  const allCategories = new Set<string>();

  for (const domain of domains) {
    const rawA = reviewerA.ratings?.[domain.id]?.answer;
    const rawB = reviewerB.ratings?.[domain.id]?.answer;

    const hasA = Boolean(rawA && rawA !== 'unclear');
    const hasB = Boolean(rawB && rawB !== 'unclear');

    // Default missing to 'unclear' for discrepancy reporting, but only count agreement if actually rated
    const ratingA = (rawA || 'unclear') as RatingAnswer;
    const ratingB = (rawB || 'unclear') as RatingAnswer;

    allCategories.add(ratingA);
    allCategories.add(ratingB);
    countsA[ratingA] = (countsA[ratingA] || 0) + 1;
    countsB[ratingB] = (countsB[ratingB] || 0) + 1;

    if (hasA || hasB) {
      totalEvaluatedDomains++;
    }

    // Both must have actually rated or explicitly chosen the same answer
    // If neither reviewer has entered any valid rating for a domain (or both left it unclear/unrated),
    // it does NOT count as positive agreement!
    const isBothUnrated = (!rawA || rawA === 'unclear') && (!rawB || rawB === 'unclear');
    const isAgreed = !isBothUnrated && ratingA === ratingB;

    if (isAgreed) {
      agreedCount++;
    }

    discrepancies.push({
      domainId: domain.id,
      domainName: domain.title,
      isCritical: domain.isCritical,
      reviewerAAnswer: ratingA,
      reviewerBAnswer: ratingB,
      isResolved: isAgreed,
      resolvedAnswer: isAgreed ? ratingA : undefined
    });
  }

  // If no items have been rated by either reviewer, agreement is 0% and kappa is 0.0
  if (totalDomains === 0 || totalEvaluatedDomains === 0) {
    return {
      reviewerA,
      reviewerB,
      totalDomains,
      agreedDomains: 0,
      agreementPercentage: 0,
      cohensKappa: 0,
      kappaInterpretation: 'Poor',
      discrepancies
    };
  }

  // Observed agreement Po
  const Po = totalDomains > 0 ? agreedCount / totalDomains : 0;

  // Expected chance agreement Pe
  let Pe = 0;
  if (totalDomains > 0) {
    for (const cat of allCategories) {
      const pA = (countsA[cat] || 0) / totalDomains;
      const pB = (countsB[cat] || 0) / totalDomains;
      Pe += (pA * pB);
    }
  }

  // Cohen's Kappa κ = (Po - Pe) / (1 - Pe)
  let kappa = 0.0;
  if (Pe < 1.0) {
    kappa = (Po - Pe) / (1.0 - Pe);
  } else if (Po === 1.0 && Pe === 1.0) {
    // Kappa paradox / Homogeneous marginals: Perfect observed agreement with identical single category
    kappa = 1.0;
  }

  // Clamp between -1.0 and 1.0
  kappa = Math.max(-1.0, Math.min(1.0, kappa));

  // Landis & Koch (1977) interpretation
  const kappaInterpretation = getKappaInterpretation(kappa);
  const agreementPercentage = Math.round(Po * 100);

  return {
    reviewerA,
    reviewerB,
    totalDomains,
    agreedDomains: agreedCount,
    agreementPercentage,
    cohensKappa: Math.round(kappa * 100) / 100,
    kappaInterpretation,
    discrepancies
  };
}

export function getKappaInterpretation(kappa: number): 'Poor' | 'Slight' | 'Fair' | 'Moderate' | 'Substantial' | 'Almost Perfect' {
  if (kappa > 0.80) return 'Almost Perfect';
  if (kappa > 0.60) return 'Substantial';
  if (kappa > 0.40) return 'Moderate';
  if (kappa > 0.20) return 'Fair';
  if (kappa > 0.0) return 'Slight';
  return 'Poor';
}

/**
 * Calculates Fleiss' Multi-Rater Kappa (κ) and pairwise agreement matrix across 2 to 8 raters.
 * Fleiss' Kappa evaluates inter-rater concordance when fixed N raters classify items into M categories.
 */
export function calculateFleissKappa(
  assessments: AppraisalAssessment[],
  domains: AppraisalDomain[],
  reviewers: ReviewerProfile[]
): MultiRaterComparison {
  const N = domains.length; // number of subjects / domains
  const n = assessments.length; // number of raters (e.g. 2 to 8)

  if (N === 0 || n === 0) {
    return {
      reviewers,
      assessments,
      totalDomains: 0,
      unanimousCount: 0,
      majorityCount: 0,
      splitCount: 0,
      unanimityPercentage: 100,
      fleissKappa: 1.0,
      fleissInterpretation: 'Almost Perfect',
      pairwiseMatrix: [],
      domainRows: []
    };
  }

  // If only 1 reviewer, perfect agreement with self
  if (n === 1) {
    const domainRows: MultiRaterDomainRow[] = domains.map(d => {
      const ans = assessments[0].ratings[d.id]?.answer || 'unclear';
      return {
        domainId: d.id,
        domainNumber: d.number,
        domainTitle: d.title,
        isCritical: d.isCritical,
        ratingsByReviewer: {
          [assessments[0].reviewerId || 'rev-0']: {
            reviewerId: assessments[0].reviewerId || 'rev-0',
            reviewerName: assessments[0].reviewerName,
            answer: ans,
            rationale: assessments[0].ratings[d.id]?.rationale,
            verifiedByResearcher: assessments[0].ratings[d.id]?.verifiedByResearcher,
            quoteLocation: assessments[0].ratings[d.id]?.quoteLocation
          }
        },
        distribution: { [ans]: 1 },
        status: 'unanimous',
        majorityAnswer: ans,
        majorityPercentage: 100,
        resolvedAnswer: ans,
        isResolved: true
      };
    });

    return {
      reviewers,
      assessments,
      totalDomains: N,
      unanimousCount: N,
      majorityCount: 0,
      splitCount: 0,
      unanimityPercentage: 100,
      fleissKappa: 1.0,
      fleissInterpretation: 'Almost Perfect',
      pairwiseMatrix: [],
      domainRows
    };
  }

  // Determine all rating categories used across all domains & raters
  const allCategoriesSet = new Set<string>();
  domains.forEach(d => {
    d.allowedAnswers.forEach(a => allCategoriesSet.add(a));
  });
  assessments.forEach(ass => {
    Object.values(ass.ratings).forEach(r => {
      if (r?.answer) allCategoriesSet.add(r.answer);
    });
  });
  const categories = Array.from(allCategoriesSet);
  const k = categories.length; // number of categories

  // Matrix of counts n_ij: number of raters who assigned i-th domain to j-th category
  // Table: rows = domains (i = 0..N-1), cols = categories (j = 0..k-1)
  const nij: number[][] = [];
  const domainRows: MultiRaterDomainRow[] = [];

  let unanimousCount = 0;
  let majorityCount = 0;
  let splitCount = 0;

  for (let i = 0; i < N; i++) {
    const domain = domains[i];
    const rowCounts: number[] = new Array(k).fill(0);
    const ratingsByReviewer: MultiRaterDomainRow['ratingsByReviewer'] = {};
    const distribution: Record<string, number> = {};

    assessments.forEach((ass, rIdx) => {
      const reviewerProfile = reviewers.find(r => r.id === ass.reviewerId || r.name === ass.reviewerName);
      const revId = reviewerProfile?.id || ass.reviewerId || `rev-${rIdx}`;
      const revName = reviewerProfile?.name || ass.reviewerName || `Reviewer ${rIdx + 1}`;
      const r = ass.ratings[domain.id];
      const answer = (r?.answer || 'unclear') as RatingAnswer;

      ratingsByReviewer[revId] = {
        reviewerId: revId,
        reviewerName: revName,
        answer,
        rationale: r?.rationale,
        verifiedByResearcher: r?.verifiedByResearcher,
        quoteLocation: r?.quoteLocation
      };

      distribution[answer] = (distribution[answer] || 0) + 1;

      const catIdx = categories.indexOf(answer);
      if (catIdx >= 0) {
        rowCounts[catIdx]++;
      }
    });

    nij.push(rowCounts);

    // Find majority
    let maxVotes = 0;
    let majorityAns: RatingAnswer | undefined = undefined;
    for (const [ans, count] of Object.entries(distribution)) {
      if (count > maxVotes) {
        maxVotes = count;
        majorityAns = ans as RatingAnswer;
      }
    }

    const majorityPercentage = Math.round((maxVotes / n) * 100);
    let status: 'unanimous' | 'majority' | 'split' = 'split';

    if (maxVotes === n) {
      status = 'unanimous';
      unanimousCount++;
    } else if (majorityPercentage >= 50) {
      status = 'majority';
      majorityCount++;
    } else {
      status = 'split';
      splitCount++;
    }

    const isAgreed = status === 'unanimous';

    domainRows.push({
      domainId: domain.id,
      domainNumber: domain.number,
      domainTitle: domain.title,
      isCritical: domain.isCritical,
      ratingsByReviewer,
      distribution,
      status,
      majorityAnswer: majorityAns,
      majorityPercentage,
      resolvedAnswer: isAgreed ? majorityAns : undefined,
      isResolved: isAgreed
    });
  }

  // Calculate Fleiss' Kappa formula
  // p_j = (1 / (N * n)) * sum_{i=1}^N n_{ij}
  const pj: number[] = new Array(k).fill(0);
  for (let j = 0; j < k; j++) {
    let sumCol = 0;
    for (let i = 0; i < N; i++) {
      sumCol += nij[i][j];
    }
    pj[j] = sumCol / (N * n);
  }

  // P_i = (1 / (n * (n - 1))) * (sum_{j=1}^k (n_{ij}^2) - n)
  const Pi: number[] = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    let sumSq = 0;
    for (let j = 0; j < k; j++) {
      sumSq += (nij[i][j] * nij[i][j]);
    }
    Pi[i] = (sumSq - n) / (n * (n - 1));
  }

  // P_bar (mean of Pi)
  const Pbar = Pi.reduce((acc, v) => acc + v, 0) / N;

  // P_bar_e (sum of pj^2)
  const Pbar_e = pj.reduce((acc, v) => acc + (v * v), 0);

  // Fleiss Kappa κ = (P_bar - P_bar_e) / (1 - P_bar_e)
  let fleissKappa = 1.0;
  if (Pbar_e < 1.0) {
    fleissKappa = (Pbar - Pbar_e) / (1.0 - Pbar_e);
  }
  fleissKappa = Math.max(-1.0, Math.min(1.0, fleissKappa));
  const roundedKappa = Math.round(fleissKappa * 100) / 100;
  const fleissInterpretation = getKappaInterpretation(roundedKappa);

  // Calculate Pairwise Cohen's Kappa Matrix for every pair of reviewers (A vs B)
  const pairwiseMatrix: PairwiseAgreement[] = [];
  for (let a = 0; a < assessments.length; a++) {
    for (let b = a + 1; b < assessments.length; b++) {
      const assA = assessments[a];
      const assB = assessments[b];
      const revA = reviewers.find(r => r.id === assA.reviewerId || r.name === assA.reviewerName);
      const revB = reviewers.find(r => r.id === assB.reviewerId || r.name === assB.reviewerName);
      
      const comp = calculateCohensKappa(assA, assB, domains);
      pairwiseMatrix.push({
        reviewer1Id: revA?.id || assA.reviewerId || `rev-${a}`,
        reviewer1Name: revA?.name || assA.reviewerName || `Reviewer ${a + 1}`,
        reviewer2Id: revB?.id || assB.reviewerId || `rev-${b}`,
        reviewer2Name: revB?.name || assB.reviewerName || `Reviewer ${b + 1}`,
        kappa: comp.cohensKappa,
        agreementPercentage: comp.agreementPercentage,
        interpretation: comp.kappaInterpretation
      });
    }
  }

  const unanimityPercentage = N > 0 ? Math.round((unanimousCount / N) * 100) : 100;

  return {
    reviewers,
    assessments,
    totalDomains: N,
    unanimousCount,
    majorityCount,
    splitCount,
    unanimityPercentage,
    fleissKappa: roundedKappa,
    fleissInterpretation,
    pairwiseMatrix,
    domainRows
  };
}

/**
 * Calculates Shea et al. (2017) AMSTAR 2 Overall Confidence Rating.
 * Critical domains: 2, 4, 7, 9, 11, 13, 15.
 */
export function evaluateAmstar2OverallConfidence(
  ratings: Record<string, { answer: RatingAnswer }>,
  domains: AppraisalDomain[]
): {
  overallConfidence: 'High' | 'Moderate' | 'Low' | 'Critically Low';
  criticalFlawsCount: number;
  nonCriticalFlawsCount: number;
  criticalFlawDomainNumbers: number[];
  scorePercentage: number;
} {
  let criticalFlawsCount = 0;
  let nonCriticalFlawsCount = 0;
  const criticalFlawDomainNumbers: number[] = [];
  let positiveScore = 0;
  let maxPossibleScore = 0;

  for (const domain of domains) {
    const rating = ratings[domain.id]?.answer;
    maxPossibleScore += 1;

    if (rating === 'yes') {
      positiveScore += 1;
    } else if (rating === 'partial') {
      positiveScore += 0.5;
      if (domain.isCritical) {
        // In AMSTAR 2, partial on critical domains 2 or 7 may not be a fatal flaw depending on guidance,
        // but generally non-yes on critical domains counts as a concern
        criticalFlawsCount += 0.5;
      } else {
        nonCriticalFlawsCount += 0.5;
      }
    } else if (rating === 'no') {
      if (domain.isCritical) {
        criticalFlawsCount += 1;
        criticalFlawDomainNumbers.push(domain.number);
      } else {
        nonCriticalFlawsCount += 1;
      }
    } else if (rating === 'not_applicable') {
      maxPossibleScore -= 1; // Don't penalize N/A meta-analysis domains
    }
  }

  const scorePercentage = maxPossibleScore > 0 ? Math.round((positiveScore / maxPossibleScore) * 100) : 0;

  let overallConfidence: 'High' | 'Moderate' | 'Low' | 'Critically Low';

  if (criticalFlawsCount > 1) {
    overallConfidence = 'Critically Low';
  } else if (criticalFlawsCount === 1) {
    overallConfidence = 'Low';
  } else if (nonCriticalFlawsCount > 1) {
    overallConfidence = 'Moderate';
  } else {
    overallConfidence = 'High';
  }

  return {
    overallConfidence,
    criticalFlawsCount: Math.ceil(criticalFlawsCount),
    nonCriticalFlawsCount: Math.ceil(nonCriticalFlawsCount),
    criticalFlawDomainNumbers,
    scorePercentage
  };
}

export interface Agree2DomainScore {
  domainKey: string;
  domainName: string;
  domainNameNorwegian: string;
  itemCount: number;
  obtainedScore: number;
  minPossibleScore: number;
  maxPossibleScore: number;
  standardizedPercentage: number;
  meanItemScore: number;
  consensusSummary: string;
}

export interface Agree2EvaluationResult {
  domains: Agree2DomainScore[];
  overallQualityScore: number; // 1-7
  overallRecommendation: string; // 'Ja', 'Delvis', 'Nei'
  overallStandardizedPercentage: number;
}

/**
 * Calculates official AGREE II standardized domain scores (%) according to Brouwers et al. (2010, 2016):
 * Standardized Domain Score = (Obtained - Min) / (Max - Min) * 100
 */
export function evaluateAgree2DomainScores(
  ratings: Record<string, { answer: RatingAnswer; rationale?: string }>
): Agree2EvaluationResult {
  const domainDefinitions = [
    {
      key: 'D1',
      name: 'Scope and Purpose',
      nameNorwegian: 'Domene 1: Omfang og formål',
      itemIds: ['agree2-q1', 'agree2-q2', 'agree2-q3']
    },
    {
      key: 'D2',
      name: 'Stakeholder Involvement',
      nameNorwegian: 'Domene 2: Involvering av interessenter',
      itemIds: ['agree2-q4', 'agree2-q5', 'agree2-q6']
    },
    {
      key: 'D3',
      name: 'Rigour of Development',
      nameNorwegian: 'Domene 3: Rigor i utvikling',
      itemIds: ['agree2-q7', 'agree2-q8', 'agree2-q9', 'agree2-q10', 'agree2-q11', 'agree2-q12', 'agree2-q13', 'agree2-q14']
    },
    {
      key: 'D4',
      name: 'Clarity of Presentation',
      nameNorwegian: 'Domene 4: Klarhet i presentasjon',
      itemIds: ['agree2-q15', 'agree2-q16', 'agree2-q17']
    },
    {
      key: 'D5',
      name: 'Applicability',
      nameNorwegian: 'Domene 5: Anvendbarhet',
      itemIds: ['agree2-q18', 'agree2-q19', 'agree2-q20', 'agree2-q21']
    },
    {
      key: 'D6',
      name: 'Editorial Independence',
      nameNorwegian: 'Domene 6: Redaksjonell uavhengighet',
      itemIds: ['agree2-q22', 'agree2-q23']
    }
  ];

  let totalObtainedAll = 0;
  let totalMinAll = 0;
  let totalMaxAll = 0;

  const domainScores: Agree2DomainScore[] = domainDefinitions.map(def => {
    let obtained = 0;
    const itemCount = def.itemIds.length;
    const minPossible = itemCount * 1;
    const maxPossible = itemCount * 7;

    for (const id of def.itemIds) {
      const val = ratings[id]?.answer;
      const numericVal = parseInt(val as string, 10);
      if (!isNaN(numericVal) && numericVal >= 1 && numericVal <= 7) {
        obtained += numericVal;
      } else if (val === 'yes' || val === 'ja') {
        obtained += 7;
      } else if (val === 'partial' || val === 'delvis') {
        obtained += 4;
      } else if (val === 'no' || val === 'nei') {
        obtained += 1;
      } else {
        obtained += 4; // neutral midpoint fallback
      }
    }

    const standardizedPercentage = maxPossible > minPossible
      ? Math.round(((obtained - minPossible) / (maxPossible - minPossible)) * 100)
      : 100;
    const meanItemScore = Math.round((obtained / itemCount) * 10) / 10;

    totalObtainedAll += obtained;
    totalMinAll += minPossible;
    totalMaxAll += maxPossible;

    return {
      domainKey: def.key,
      domainName: def.name,
      domainNameNorwegian: def.nameNorwegian,
      itemCount,
      obtainedScore: obtained,
      minPossibleScore: minPossible,
      maxPossibleScore: maxPossible,
      standardizedPercentage,
      meanItemScore,
      consensusSummary: `${meanItemScore}/7 (${standardizedPercentage}%)`
    };
  });

  const overallQualityRaw = ratings['agree2-overall-quality']?.answer;
  const overallQualityScore = overallQualityRaw ? parseInt(overallQualityRaw as string, 10) || 0 : 0;

  const overallRecRaw = ratings['agree2-overall-recommend']?.answer;
  let overallRecommendation = 'Ikke vurdert';
  if (overallRecRaw === 'ja' || overallRecRaw === 'yes') {
    overallRecommendation = 'Ja';
  } else if (overallRecRaw === 'delvis' || overallRecRaw === 'partial') {
    overallRecommendation = 'Delvis / med modifikasjoner';
  } else if (overallRecRaw === 'nei' || overallRecRaw === 'no') {
    overallRecommendation = 'Nei';
  }

  // NOTE: AGREE II methodology (Brouwers et al.) explicitly forbids aggregating domain scores
  // into a single composite quality score. Each domain score is independent.
  const overallStandardizedPercentage = totalMaxAll > totalMinAll
    ? Math.round(((totalObtainedAll - totalMinAll) / (totalMaxAll - totalMinAll)) * 100)
    : 0;

  return {
    domains: domainScores,
    overallQualityScore,
    overallRecommendation,
    overallStandardizedPercentage
  };
}

/**
  * Standard Normal Cumulative Distribution Function (CDF) approximation.
  */
export function normalCdf(z: number): number {
  if (isNaN(z)) return 0.5;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
  const cdf = 1.0 - c * Math.exp(-absZ * absZ / 2.0) * poly;
  return z >= 0 ? cdf : 1.0 - cdf;
}

/**
 * Calculates comprehensive pairwise Cohen's Kappa, SE, 95% CI, z-score, p-value, and PABAK.
 */
export function calculatePairwiseReliabilityDetail(
  assA: AppraisalAssessment,
  assB: AppraisalAssessment,
  domains: AppraisalDomain[]
): PairwiseReliabilityDetail {
  const N = domains.length;
  if (N === 0) {
    return {
      reviewerAId: assA.reviewerId || 'rev-a',
      reviewerAName: assA.reviewerName || 'Reviewer A',
      reviewerBId: assB.reviewerId || 'rev-b',
      reviewerBName: assB.reviewerName || 'Reviewer B',
      cohensKappa: 1.0,
      observedAgreement: 100,
      expectedAgreement: 100,
      standardError: 0,
      ci95Lower: 1.0,
      ci95Upper: 1.0,
      zScore: 0,
      pValue: 1.0,
      pabak: 1.0,
      kappaInterpretation: 'Almost Perfect',
      agreedDomainsCount: 0,
      totalDomainsCount: 0
    };
  }

  let agreedCount = 0;
  const countsA: Record<string, number> = {};
  const countsB: Record<string, number> = {};
  const allCategories = new Set<string>();

  for (const domain of domains) {
    const ratingA = assA.ratings[domain.id]?.answer || 'unclear';
    const ratingB = assB.ratings[domain.id]?.answer || 'unclear';

    allCategories.add(ratingA);
    allCategories.add(ratingB);
    countsA[ratingA] = (countsA[ratingA] || 0) + 1;
    countsB[ratingB] = (countsB[ratingB] || 0) + 1;

    if (ratingA === ratingB) {
      agreedCount++;
    }
  }

  const Po = agreedCount / N;
  let Pe = 0;
  let sumPABSum = 0;

  for (const cat of allCategories) {
    const pA = (countsA[cat] || 0) / N;
    const pB = (countsB[cat] || 0) / N;
    Pe += (pA * pB);
    sumPABSum += (pA * pB * (pA + pB));
  }

  let kappa = 1.0;
  if (Pe < 1.0) {
    kappa = (Po - Pe) / (1.0 - Pe);
  }
  kappa = Math.max(-1.0, Math.min(1.0, kappa));

  // Large-sample standard error
  let standardError = 0;
  if (Pe < 1.0) {
    const varPo = (Po * (1.0 - Po)) / (N * Math.pow(1.0 - Pe, 2));
    standardError = Math.sqrt(Math.max(0, varPo));
    if (standardError === 0 && Po < 1.0) {
      standardError = Math.sqrt(1 / (N * (1.0 - Pe)));
    }
  }

  // Null hypothesis SE0
  let se0 = 0.05;
  if (Pe < 1.0) {
    const numerator = Pe + (Pe * Pe) - sumPABSum;
    const denominator = N * Math.pow(1.0 - Pe, 2);
    if (denominator > 0) {
      se0 = Math.sqrt(Math.max(0.0001, numerator / denominator));
    }
  }

  const zScore = se0 > 0 ? kappa / se0 : 0;
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));

  const ci95Lower = Math.max(-1.0, Math.min(1.0, kappa - 1.96 * (standardError || se0)));
  const ci95Upper = Math.max(-1.0, Math.min(1.0, kappa + 1.96 * (standardError || se0)));
  const pabak = Math.round((2 * Po - 1) * 100) / 100;

  return {
    reviewerAId: assA.reviewerId || 'rev-a',
    reviewerAName: assA.reviewerName || 'Reviewer A',
    reviewerBId: assB.reviewerId || 'rev-b',
    reviewerBName: assB.reviewerName || 'Reviewer B',
    cohensKappa: Math.round(kappa * 100) / 100,
    observedAgreement: Math.round(Po * 100),
    expectedAgreement: Math.round(Pe * 100),
    standardError: Math.round(standardError * 1000) / 1000,
    ci95Lower: Math.round(ci95Lower * 100) / 100,
    ci95Upper: Math.round(ci95Upper * 100) / 100,
    zScore: Math.round(zScore * 100) / 100,
    pValue: Math.round(pValue * 10000) / 10000,
    pabak,
    kappaInterpretation: getKappaInterpretation(kappa),
    agreedDomainsCount: agreedCount,
    totalDomainsCount: N
  };
}

/**
 * Calculates project-wide multi-study inter-rater reliability report,
 * assessing Cohen's Kappa, Fleiss' Kappa, and agreement metrics for all studies with >= 2 reviewers.
 */
export function calculateProjectReliabilityReport(
  studies: StudyRecord[],
  assessmentsMap: Record<string, AppraisalAssessment[]>,
  reviewers: ReviewerProfile[]
): ProjectReliabilitySummary {
  const multiReviewerStudies: StudyReliabilityRecord[] = [];
  let totalPairedDomainCount = 0;
  let totalAgreedDomainCount = 0;
  let totalDiscrepancies = 0;
  let criticalDiscrepancies = 0;
  let resolvedDiscrepancies = 0;

  const tierDistribution = {
    almostPerfect: 0,
    substantial: 0,
    moderate: 0,
    fair: 0,
    slight: 0,
    poor: 0
  };

  for (const study of studies) {
    const studyAssessments = assessmentsMap[study.id] || [];
    const individualAssessments = studyAssessments.filter(a => !a.isConsensus);
    const consensusAssessment = studyAssessments.find(a => a.isConsensus);

    if (individualAssessments.length >= 2) {
      const instrument = individualAssessments[0].instrument;
      const domains = getFrameworkDomains(instrument);

      const pairwiseDetails: PairwiseReliabilityDetail[] = [];
      let sumKappa = 0;
      let sumObserved = 0;
      let sumExpected = 0;
      let pairCount = 0;

      for (let i = 0; i < individualAssessments.length; i++) {
        for (let j = i + 1; j < individualAssessments.length; j++) {
          const detail = calculatePairwiseReliabilityDetail(
            individualAssessments[i],
            individualAssessments[j],
            domains
          );
          pairwiseDetails.push(detail);
          sumKappa += detail.cohensKappa;
          sumObserved += detail.observedAgreement;
          sumExpected += detail.expectedAgreement;
          pairCount++;
        }
      }

      const meanKappa = pairCount > 0 ? sumKappa / pairCount : 1.0;
      const meanObserved = pairCount > 0 ? sumObserved / pairCount : 100;
      const meanExpected = pairCount > 0 ? sumExpected / pairCount : 0;
      const roundedMeanKappa = Math.round(meanKappa * 100) / 100;
      const interpretation = getKappaInterpretation(roundedMeanKappa);

      const primaryPair = pairwiseDetails[0] || {
        standardError: 0,
        ci95Lower: roundedMeanKappa,
        ci95Upper: roundedMeanKappa,
        zScore: 0,
        pValue: 0,
        pabak: Math.round((2 * (meanObserved / 100) - 1) * 100) / 100
      };

      let fleissK: number | undefined = undefined;
      if (individualAssessments.length > 2) {
        const fleissRes = calculateFleissKappa(individualAssessments, domains, reviewers);
        fleissK = fleissRes.fleissKappa;
      }

      let studyDiscrepancies = 0;
      let studyCriticalDiscrepancies = 0;
      let studyResolvedDiscrepancies = 0;
      let studyAgreedDomains = 0;

      const domainDetails = domains.map(d => {
        const ratings: Record<string, RatingAnswer> = {};
        const rationales: Record<string, string> = {};
        const answersSet = new Set<string>();

        individualAssessments.forEach(ass => {
          const ans = ass.ratings[d.id]?.answer || 'unclear';
          ratings[ass.reviewerName] = ans;
          rationales[ass.reviewerName] = ass.ratings[d.id]?.rationale || '';
          answersSet.add(ans);
        });

        const isAgreed = answersSet.size <= 1;
        if (isAgreed) {
          studyAgreedDomains++;
        } else {
          studyDiscrepancies++;
          if (d.isCritical) studyCriticalDiscrepancies++;
          if (consensusAssessment?.ratings[d.id]?.answer) {
            studyResolvedDiscrepancies++;
          }
        }

        return {
          domainId: d.id,
          domainNumber: d.number,
          domainTitle: d.title,
          isCritical: d.isCritical,
          ratings,
          rationales,
          isAgreed,
          consensusAnswer: consensusAssessment?.ratings[d.id]?.answer
        };
      });

      totalPairedDomainCount += (domains.length * pairCount);
      totalAgreedDomainCount += (studyAgreedDomains * pairCount);
      totalDiscrepancies += studyDiscrepancies;
      criticalDiscrepancies += studyCriticalDiscrepancies;
      resolvedDiscrepancies += (consensusAssessment ? studyDiscrepancies : studyResolvedDiscrepancies);

      if (roundedMeanKappa > 0.80) tierDistribution.almostPerfect++;
      else if (roundedMeanKappa > 0.60) tierDistribution.substantial++;
      else if (roundedMeanKappa > 0.40) tierDistribution.moderate++;
      else if (roundedMeanKappa > 0.20) tierDistribution.fair++;
      else if (roundedMeanKappa > 0.0) tierDistribution.slight++;
      else tierDistribution.poor++;

      multiReviewerStudies.push({
        studyId: study.id,
        studyTitle: study.title,
        studyYear: study.year || 'N/A',
        studyAuthors: study.authors,
        instrument,
        totalReviewers: individualAssessments.length,
        reviewerNames: individualAssessments.map(a => a.reviewerName),
        assessmentIds: individualAssessments.map(a => a.id),
        totalDomains: domains.length,
        agreedDomains: studyAgreedDomains,
        observedAgreement: Math.round(meanObserved),
        expectedAgreement: Math.round(meanExpected),
        cohensKappa: roundedMeanKappa,
        kappaInterpretation: interpretation,
        standardError: primaryPair.standardError,
        ci95Lower: primaryPair.ci95Lower,
        ci95Upper: primaryPair.ci95Upper,
        zScore: primaryPair.zScore,
        pValue: primaryPair.pValue,
        pabak: primaryPair.pabak,
        fleissKappa: fleissK,
        hasConsensus: !!consensusAssessment,
        discrepanciesCount: studyDiscrepancies,
        criticalDiscrepanciesCount: studyCriticalDiscrepancies,
        resolvedDiscrepanciesCount: consensusAssessment ? studyDiscrepancies : studyResolvedDiscrepancies,
        pairwiseComparisons: pairwiseDetails,
        domainDetails
      });
    }
  }

  const multiCount = multiReviewerStudies.length;
  const totalStudiesCount = studies.length;
  const coverage = totalStudiesCount > 0 ? Math.round((multiCount / totalStudiesCount) * 100) : 0;

  const meanStudyKappa = multiCount > 0
    ? Math.round((multiReviewerStudies.reduce((sum, s) => sum + s.cohensKappa, 0) / multiCount) * 100) / 100
    : 1.0;

  const meanObservedAgreement = multiCount > 0
    ? Math.round(multiReviewerStudies.reduce((sum, s) => sum + s.observedAgreement, 0) / multiCount)
    : 100;

  const pooledPo = totalPairedDomainCount > 0 ? totalAgreedDomainCount / totalPairedDomainCount : 1.0;
  const meanPeDecimal = multiCount > 0
    ? multiReviewerStudies.reduce((sum, s) => sum + (s.expectedAgreement / 100), 0) / multiCount
    : 0.3;
  
  let pooledKappa = meanStudyKappa;
  if (meanPeDecimal < 1.0) {
    pooledKappa = (pooledPo - meanPeDecimal) / (1.0 - meanPeDecimal);
  }
  pooledKappa = Math.max(-1.0, Math.min(1.0, Math.round(pooledKappa * 100) / 100));

  const pooledInterpretation = getKappaInterpretation(pooledKappa);
  const resolutionRate = totalDiscrepancies > 0
    ? Math.round((resolvedDiscrepancies / totalDiscrepancies) * 100)
    : 100;

  return {
    totalStudiesWithMultipleReviewers: multiCount,
    totalStudiesInProject: totalStudiesCount,
    multiReviewerCoveragePercentage: coverage,
    totalPairedDomainEvaluations: totalPairedDomainCount,
    pooledCohensKappa: pooledKappa,
    meanStudyKappa,
    meanObservedAgreement,
    pooledInterpretation,
    tierDistribution,
    totalDiscrepancies,
    criticalDiscrepancies,
    resolvedDiscrepancies,
    resolutionRatePercentage: resolutionRate,
    studies: multiReviewerStudies
  };
}

