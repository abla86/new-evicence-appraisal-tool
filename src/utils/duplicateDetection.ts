import { StudyRecord } from '../types';

export interface DuplicateCandidatePair {
  id: string;
  studyA: StudyRecord;
  studyB: StudyRecord;
  similarityScore: number; // 0 - 100%
  matchReasons: string[];
  isExactDoiMatch: boolean;
  isExactTitleMatch: boolean;
  status: 'pending_review' | 'merged' | 'confirmed_distinct' | 'dismissed';
  detectedAt: string;
  resolutionNote?: string;
}

/**
 * Normalizes title string for robust academic fuzzy comparison:
 * Lowercases, strips punctuation, normalizes unicode spaces and diacritics.
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ') // replace special chars with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Jaccard Word-Token Similarity between two titles (0.0 to 1.0)
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;

  const words1 = new Set(norm1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(norm2.split(' ').filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) {
    return norm1 === norm2 ? 1.0 : 0;
  }

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  const jaccard = intersection.size / union.size;

  // Exact substring check bonus
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return Math.max(jaccard, 0.88);
  }

  return jaccard;
}

/**
 * Scans a collection of studies for potential duplicate candidates.
 * CRITICAL RULE: This function ONLY identifies candidates for researcher review.
 * It NEVER automatically deletes or modifies any study records.
 */
export function findDuplicateCandidates(
  studies: StudyRecord[],
  threshold: number = 0.78
): DuplicateCandidatePair[] {
  const candidates: DuplicateCandidatePair[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < studies.length; i++) {
    for (let j = i + 1; j < studies.length; j++) {
      const s1 = studies[i];
      const s2 = studies[j];

      const pairKey = [s1.id, s2.id].sort().join(':::');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const matchReasons: string[] = [];
      let isExactDoi = false;
      let isExactTitle = false;
      let similarityScore = 0;

      // 1. Check DOI match
      if (s1.doi && s2.doi) {
        const cleanDoi1 = s1.doi.trim().toLowerCase().replace(/^https?:\/\/doi\.org\//i, '');
        const cleanDoi2 = s2.doi.trim().toLowerCase().replace(/^https?:\/\/doi\.org\//i, '');
        if (cleanDoi1 === cleanDoi2 && cleanDoi1.length > 4) {
          isExactDoi = true;
          similarityScore = 1.0;
          matchReasons.push(`Identisk DOI: ${s1.doi}`);
        }
      }

      // 2. Check Title Similarity
      const titleSim = calculateTitleSimilarity(s1.title, s2.title);
      if (titleSim > similarityScore) {
        similarityScore = titleSim;
      }

      if (titleSim >= 0.98) {
        isExactTitle = true;
        matchReasons.push('Identisk artikkeltittel (100% ord-match)');
      } else if (titleSim >= threshold) {
        matchReasons.push(`Høy tittellikhet (${Math.round(titleSim * 100)}% tekstlikhet)`);
      }

      // 3. Check Author & Publication Year
      if (s1.year && s2.year && s1.year === s2.year) {
        const a1First = s1.authors?.split(/[\s,]+/)[0]?.toLowerCase() || '';
        const a2First = s2.authors?.split(/[\s,]+/)[0]?.toLowerCase() || '';
        if (a1First && a2First && (a1First === a2First || a1First.includes(a2First) || a2First.includes(a1First))) {
          matchReasons.push(`Samme førsteforfatter (${s1.authors.split(',')[0]}) og publiseringsår (${s1.year})`);
          if (titleSim >= 0.65) {
            similarityScore = Math.max(similarityScore, 0.85);
          }
        }
      }

      // If matched criteria meet threshold or exact identifiers
      if (isExactDoi || isExactTitle || similarityScore >= threshold) {
        candidates.push({
          id: `dup-${s1.id}-${s2.id}`,
          studyA: s1,
          studyB: s2,
          similarityScore: Math.round(similarityScore * 100),
          matchReasons,
          isExactDoiMatch: isExactDoi,
          isExactTitleMatch: isExactTitle,
          status: 'pending_review',
          detectedAt: new Date().toISOString()
        });
      }
    }
  }

  // Sort highest similarity candidates first
  return candidates.sort((a, b) => b.similarityScore - a.similarityScore);
}
