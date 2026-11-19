import type {
  AbstractReviewRecord,
  AbstractSubmissionRecord,
  CommitteeSelection,
  PresenterCategory,
  ResearchTrack,
  ReviewDecision,
} from "@/types/abstractSubmission";
import { RESEARCH_TRACK_OPTIONS } from "@/types/abstractSubmission";

export type RecommendationDecisionKey = Exclude<ReviewDecision, "Pending">;

export type RecommendationCounts = Record<RecommendationDecisionKey, number>;

export interface SubmissionCohortClassification {
  category: PresenterCategory;
  isCorporate: boolean;
  isStudent: boolean;
  isStudentAward: boolean;
}

export interface SubmissionReviewSummary {
  submissionId: string;
  reviews: AbstractReviewRecord[];
  allReviewerRecords: AbstractReviewRecord[];
  reviewCount: number;
  medianScore: number | null;
  medianHemsFitness: number | null;
  medianCombined: number | null;
  minScore: number | null;
  maxScore: number | null;
  minHemsFitness: number | null;
  maxHemsFitness: number | null;
  recommendationCounts: RecommendationCounts;
  consensusDecision: ReviewDecision;
  consensusRecommendedTrack: ResearchTrack;
  recommendationSummaryText: string;
}

export type OverviewSortMode =
  | "manual"
  | "combined_desc"
  | "combined_asc"
  | "score_desc"
  | "score_asc"
  | "fitness_desc"
  | "fitness_asc"
  | "reviews_desc";

export interface AbstractOverviewRow {
  submission: AbstractSubmissionRecord;
  summary: SubmissionReviewSummary;
}

export interface TrackOverviewGroup {
  track: ResearchTrack;
  rows: AbstractOverviewRow[];
  medianScore: number | null;
  medianHemsFitness: number | null;
  medianCombined: number | null;
}

export const RECOMMENDATION_PRIORITY: readonly RecommendationDecisionKey[] = [
  "Accept (Oral)",
  "Accept (Poster)",
  "Revision Requested",
  "Decline",
];

export const RECOMMENDATION_SHORT_LABEL: Record<RecommendationDecisionKey, string> = {
  "Accept (Oral)": "Oral",
  "Accept (Poster)": "Poster",
  "Revision Requested": "Revision",
  Decline: "Decline",
};

const CORPORATE_AFFILIATION_REGEX =
  /\b(?:inc\.?|corp\.?|corporation|llc|ltd\.?|limited|gmbh|plc|technologies|instruments|analytics|aerospace|solutions|systems)\b/i;

const STUDENT_BIO_REGEX =
  /\b(?:ph\.?d\.?\s*candidate|ph\.?d\.?\s*student|doctoral\s+(?:candidate|student|fellow)|graduate\s+(?:student|research\s+assistant)|master'?s\s+student|m\.?s\.?\s+student|undergraduate\s+student)\b/i;

export function buildReviewId(submissionId: string, reviewerEmail: string): string {
  const safeSubId = submissionId.trim();
  const safeEmail =
    reviewerEmail
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._+-]/g, "_") || "reviewer";
  return `rev_${safeSubId}_${safeEmail}`;
}

export function isValidResearchTrack(raw: unknown): raw is ResearchTrack {
  return (
    typeof raw === "string" &&
    (RESEARCH_TRACK_OPTIONS as readonly string[]).includes(raw)
  );
}

/**
 * Classifies whether a submission is Corporate, Student (or Student Travel Award), or Academic/Gov.
 */
export function classifySubmissionCohort(
  sub: AbstractSubmissionRecord
): SubmissionCohortClassification {
  const isStudentAward = Boolean(sub.studentTravelAwardApplicant);
  if (sub.presenterCategory === "corporate") {
    return {
      category: "corporate",
      isCorporate: true,
      isStudent: isStudentAward,
      isStudentAward,
    };
  }
  if (sub.presenterCategory === "student" || isStudentAward) {
    return {
      category: "student",
      isCorporate: false,
      isStudent: true,
      isStudentAward,
    };
  }
  if (sub.presenterCategory === "academic") {
    return {
      category: "academic",
      isCorporate: false,
      isStudent: false,
      isStudentAward: false,
    };
  }

  // Legacy record inference when presenterCategory was not explicitly stored
  const affText = [
    sub.affiliation || "",
    ...(sub.affiliations || []).map((a) => a.institution || ""),
  ]
    .join(" ")
    .trim();
  const bioText = (sub.presenterBio || "").trim();

  if (affText && CORPORATE_AFFILIATION_REGEX.test(affText)) {
    return {
      category: "corporate",
      isCorporate: true,
      isStudent: false,
      isStudentAward: false,
    };
  }
  if (bioText && STUDENT_BIO_REGEX.test(bioText)) {
    return {
      category: "student",
      isCorporate: false,
      isStudent: true,
      isStudentAward: false,
    };
  }

  return {
    category: "academic",
    isCorporate: false,
    isStudent: false,
    isStudentAward: false,
  };
}

/**
 * Resolves the official Program Committee selection for an abstract, keeping backward
 * compatibility with seed/legacy records before `committeeSelection` existed.
 */
export function resolveOfficialSelection(
  sub: AbstractSubmissionRecord
): CommitteeSelection {
  if (
    sub.committeeSelection === "accept_oral" ||
    sub.committeeSelection === "accept_poster" ||
    sub.committeeSelection === "decline" ||
    sub.committeeSelection === "pending"
  ) {
    return sub.committeeSelection;
  }

  if (sub.decision === "Accept (Oral)") return "accept_oral";
  if (sub.decision === "Accept (Poster)") return "accept_poster";
  if (sub.decision === "Decline") return "decline";
  return "pending";
}

/**
 * Finds the evaluation record belonging to a specific reviewer (including unscored `Completed` toggles).
 */
export function findReviewerEvaluation(
  allReviews: readonly AbstractReviewRecord[],
  submissionId: string,
  reviewerEmail: string
): AbstractReviewRecord | undefined {
  const cleanEmail = reviewerEmail.trim().toLowerCase();
  if (!cleanEmail) return undefined;
  return allReviews.find(
    (r) =>
      r.submissionId === submissionId &&
      r.reviewerEmail.trim().toLowerCase() === cleanEmail
  );
}

/**
 * Resolves the effective research track, preferring committee/reviewer consensus `recommendedTrack`
 * when reviewers modified it, and falling back to the author's original `researchTrack`.
 */
export function resolveEffectiveTrack(
  submission: AbstractSubmissionRecord,
  summary?: SubmissionReviewSummary
): ResearchTrack {
  if (summary && isValidResearchTrack(summary.consensusRecommendedTrack)) {
    return summary.consensusRecommendedTrack;
  }
  if (isValidResearchTrack(submission.recommendedTrack)) {
    return submission.recommendedTrack;
  }
  if (isValidResearchTrack(submission.researchTrack)) {
    return submission.researchTrack;
  }
  return "Miscellaneous";
}

export function computeMedian(values: readonly number[]): number | null {
  const valid = values
    .filter((v) => typeof v === "number" && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  const raw =
    valid.length % 2 === 1 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
  return Math.round(raw * 100) / 100;
}

export function formatMedianScore(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(1)
    : "—";
}

function emptyRecommendationCounts(): RecommendationCounts {
  return {
    "Accept (Oral)": 0,
    "Accept (Poster)": 0,
    "Revision Requested": 0,
    Decline: 0,
  };
}

function isRecommendationKey(
  decision: ReviewDecision
): decision is RecommendationDecisionKey {
  return decision !== "Pending";
}

function resolveConsensusRecommendedTrack(
  submission: AbstractSubmissionRecord,
  recordsNewestFirst: readonly AbstractReviewRecord[]
): ResearchTrack {
  const tally = new Map<ResearchTrack, { count: number; latestTs: number }>();

  for (const rev of recordsNewestFirst) {
    if (!isValidResearchTrack(rev.recommendedTrack)) continue;
    const ts = Date.parse(rev.updatedAt || rev.createdAt || "") || 0;
    const prev = tally.get(rev.recommendedTrack);
    if (prev) {
      prev.count += 1;
      if (ts > prev.latestTs) prev.latestTs = ts;
    } else {
      tally.set(rev.recommendedTrack, { count: 1, latestTs: ts });
    }
  }

  if (tally.size > 0) {
    const ranked = Array.from(tally.entries()).sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return b[1].latestTs - a[1].latestTs;
    });
    return ranked[0][0];
  }

  if (isValidResearchTrack(submission.recommendedTrack)) {
    return submission.recommendedTrack;
  }
  if (isValidResearchTrack(submission.researchTrack)) {
    return submission.researchTrack;
  }
  return "Miscellaneous";
}

export function summarizeSubmissionReviews(
  submission: AbstractSubmissionRecord,
  allReviews: readonly AbstractReviewRecord[]
): SubmissionReviewSummary {
  const matchedAll = allReviews
    .filter((r) => r.submissionId === submission.id)
    .sort((a, b) => {
      const tA = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      const tB = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      return tB - tA;
    });

  // Only count records that have actual numeric scores / non-pending evaluation data in committee medians
  let scoredReviews: AbstractReviewRecord[] = matchedAll.filter(
    (r) =>
      (typeof r.score === "number" && Number.isFinite(r.score)) ||
      (typeof r.hemsFitness === "number" && Number.isFinite(r.hemsFitness)) ||
      r.decision !== "Pending"
  );

  // Backwards compatibility for legacy single-review submissions before multi-review records exist
  if (
    scoredReviews.length === 0 &&
    submission.status === "Reviewed" &&
    typeof submission.score === "number" &&
    Number.isFinite(submission.score)
  ) {
    const fallbackFitness =
      typeof submission.hemsFitness === "number" &&
      Number.isFinite(submission.hemsFitness)
        ? submission.hemsFitness
        : submission.score;
    const fallbackEmail = submission.reviewedBy || "reviewer@hems-workshop.org";
    const fallbackTs =
      submission.reviewedAt || submission.updatedAt || submission.submittedAt;
    scoredReviews = [
      {
        reviewId: buildReviewId(submission.id, fallbackEmail),
        submissionId: submission.id,
        reviewerEmail: fallbackEmail,
        score: submission.score,
        hemsFitness: fallbackFitness,
        decision: submission.decision,
        recommendedTrack: submission.recommendedTrack || submission.researchTrack,
        reviewerComments: submission.reviewerComments || "",
        privateNotes: "",
        createdAt: fallbackTs,
        updatedAt: fallbackTs,
        ...(submission.isSampleSeed ? { isSampleSeed: true } : {}),
      },
    ];
  }

  const allReviewerRecords =
    matchedAll.length > 0 ? matchedAll : scoredReviews;

  const counts = emptyRecommendationCounts();
  const scores: number[] = [];
  const fitnessScores: number[] = [];
  const combinedScores: number[] = [];

  for (const rev of scoredReviews) {
    if (typeof rev.score === "number" && Number.isFinite(rev.score)) {
      scores.push(rev.score);
    }
    const fit =
      typeof rev.hemsFitness === "number" && Number.isFinite(rev.hemsFitness)
        ? rev.hemsFitness
        : rev.score;
    if (typeof fit === "number" && Number.isFinite(fit)) {
      fitnessScores.push(fit);
    }
    if (
      typeof rev.score === "number" &&
      Number.isFinite(rev.score) &&
      typeof fit === "number" &&
      Number.isFinite(fit)
    ) {
      combinedScores.push((rev.score + fit) / 2);
    }
    if (isRecommendationKey(rev.decision)) {
      counts[rev.decision] += 1;
    }
  }

  const medianScore = computeMedian(scores);
  const medianHemsFitness = computeMedian(fitnessScores);
  const medianCombined = computeMedian(combinedScores);

  const minScore = scores.length > 0 ? Math.min(...scores) : null;
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;
  const minHemsFitness =
    fitnessScores.length > 0 ? Math.min(...fitnessScores) : null;
  const maxHemsFitness =
    fitnessScores.length > 0 ? Math.max(...fitnessScores) : null;

  let consensusDecision: ReviewDecision = "Pending";
  let bestCount = 0;
  for (const key of RECOMMENDATION_PRIORITY) {
    if (counts[key] > bestCount) {
      bestCount = counts[key];
      consensusDecision = key;
    }
  }

  if (consensusDecision === "Pending" && submission.decision !== "Pending") {
    consensusDecision = submission.decision;
  }

  const consensusRecommendedTrack = resolveConsensusRecommendedTrack(
    submission,
    allReviewerRecords
  );

  const activeParts = RECOMMENDATION_PRIORITY.filter(
    (key) => counts[key] > 0
  ).map((key) => `${counts[key]} ${RECOMMENDATION_SHORT_LABEL[key]}`);

  const recommendationSummaryText =
    activeParts.length > 0 ? activeParts.join(" • ") : "Pending Review";

  return {
    submissionId: submission.id,
    reviews: scoredReviews,
    allReviewerRecords,
    reviewCount: scoredReviews.length,
    medianScore,
    medianHemsFitness,
    medianCombined,
    minScore,
    maxScore,
    minHemsFitness,
    maxHemsFitness,
    recommendationCounts: counts,
    consensusDecision,
    consensusRecommendedTrack,
    recommendationSummaryText,
  };
}

export function normalizeManualOrder(
  manualIds: readonly string[],
  submissions: readonly AbstractSubmissionRecord[]
): string[] {
  const validSet = new Set(submissions.map((s) => s.id));
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const id of manualIds) {
    if (validSet.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }

  const remaining = submissions
    .filter((s) => !seen.has(s.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const item of remaining) {
    ordered.push(item.id);
  }

  return ordered;
}

function compareNullableNumbers(
  a: number | null,
  b: number | null,
  direction: "asc" | "desc"
): number {
  const aValid = typeof a === "number" && Number.isFinite(a);
  const bValid = typeof b === "number" && Number.isFinite(b);
  if (!aValid && !bValid) return 0;
  // Unreviewed (null) medians always sort to the bottom regardless of direction
  if (!aValid) return 1;
  if (!bValid) return -1;
  if (a === b) return 0;
  return direction === "desc" ? b - a : a - b;
}

function compareRowTieBreakers(
  a: AbstractOverviewRow,
  b: AbstractOverviewRow
): number {
  const comb = compareNullableNumbers(
    a.summary.medianCombined,
    b.summary.medianCombined,
    "desc"
  );
  if (comb !== 0) return comb;

  const sci = compareNullableNumbers(
    a.summary.medianScore,
    b.summary.medianScore,
    "desc"
  );
  if (sci !== 0) return sci;

  const fit = compareNullableNumbers(
    a.summary.medianHemsFitness,
    b.summary.medianHemsFitness,
    "desc"
  );
  if (fit !== 0) return fit;

  if (a.summary.reviewCount !== b.summary.reviewCount) {
    return b.summary.reviewCount - a.summary.reviewCount;
  }

  return a.submission.id.localeCompare(b.submission.id);
}

export function sortOverviewRows(
  rows: readonly AbstractOverviewRow[],
  sortMode: OverviewSortMode,
  manualOrderIds: readonly string[]
): AbstractOverviewRow[] {
  if (sortMode === "manual") {
    const normalized = normalizeManualOrder(
      manualOrderIds,
      rows.map((r) => r.submission)
    );
    const indexMap = new Map<string, number>();
    normalized.forEach((id, idx) => indexMap.set(id, idx));
    return [...rows].sort((a, b) => {
      const idxA = indexMap.get(a.submission.id) ?? Number.MAX_SAFE_INTEGER;
      const idxB = indexMap.get(b.submission.id) ?? Number.MAX_SAFE_INTEGER;
      if (idxA !== idxB) return idxA - idxB;
      return a.submission.id.localeCompare(b.submission.id);
    });
  }

  return [...rows].sort((a, b) => {
    let primary = 0;
    if (sortMode === "combined_desc") {
      primary = compareNullableNumbers(
        a.summary.medianCombined,
        b.summary.medianCombined,
        "desc"
      );
    } else if (sortMode === "combined_asc") {
      primary = compareNullableNumbers(
        a.summary.medianCombined,
        b.summary.medianCombined,
        "asc"
      );
    } else if (sortMode === "score_desc") {
      primary = compareNullableNumbers(
        a.summary.medianScore,
        b.summary.medianScore,
        "desc"
      );
    } else if (sortMode === "score_asc") {
      primary = compareNullableNumbers(
        a.summary.medianScore,
        b.summary.medianScore,
        "asc"
      );
    } else if (sortMode === "fitness_desc") {
      primary = compareNullableNumbers(
        a.summary.medianHemsFitness,
        b.summary.medianHemsFitness,
        "desc"
      );
    } else if (sortMode === "fitness_asc") {
      primary = compareNullableNumbers(
        a.summary.medianHemsFitness,
        b.summary.medianHemsFitness,
        "asc"
      );
    } else if (sortMode === "reviews_desc") {
      primary = b.summary.reviewCount - a.summary.reviewCount;
    }

    if (primary !== 0) return primary;
    return compareRowTieBreakers(a, b);
  });
}

export function reorderWithinScope(
  currentGlobalIds: readonly string[],
  visibleGroupIds: readonly string[],
  movingId: string,
  targetId: string
): string[] {
  if (movingId === targetId) return [...currentGlobalIds];
  const groupSet = new Set(visibleGroupIds);
  if (!groupSet.has(movingId) || !groupSet.has(targetId)) {
    return [...currentGlobalIds];
  }

  const scopeOrder = currentGlobalIds.filter((id) => groupSet.has(id));
  const fromIdx = scopeOrder.indexOf(movingId);
  const toIdx = scopeOrder.indexOf(targetId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
    return [...currentGlobalIds];
  }

  const nextScopeOrder = [...scopeOrder];
  const [moved] = nextScopeOrder.splice(fromIdx, 1);
  nextScopeOrder.splice(toIdx, 0, moved);

  let cursor = 0;
  return currentGlobalIds.map((id) => {
    if (!groupSet.has(id)) return id;
    const replacement = nextScopeOrder[cursor];
    cursor += 1;
    return replacement ?? id;
  });
}

export function nudgeWithinScope(
  currentGlobalIds: readonly string[],
  visibleGroupIds: readonly string[],
  movingId: string,
  direction: "up" | "down"
): string[] {
  const fromIdx = visibleGroupIds.indexOf(movingId);
  if (fromIdx === -1) return [...currentGlobalIds];
  const targetIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
  if (targetIdx < 0 || targetIdx >= visibleGroupIds.length) {
    return [...currentGlobalIds];
  }
  const targetId = visibleGroupIds[targetIdx];
  return reorderWithinScope(currentGlobalIds, visibleGroupIds, movingId, targetId);
}

export function groupOverviewRowsByTrack(
  sortedRows: readonly AbstractOverviewRow[]
): TrackOverviewGroup[] {
  const byTrack = new Map<ResearchTrack, AbstractOverviewRow[]>();
  for (const track of RESEARCH_TRACK_OPTIONS) {
    byTrack.set(track, []);
  }

  for (const row of sortedRows) {
    const track = resolveEffectiveTrack(row.submission, row.summary);
    const list = byTrack.get(track);
    if (list) {
      list.push(row);
    } else {
      byTrack.set(track, [row]);
    }
  }

  const groups: TrackOverviewGroup[] = [];
  for (const [track, trackRows] of byTrack.entries()) {
    if (trackRows.length === 0) continue;
    const medScores = trackRows
      .map((r) => r.summary.medianScore)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const medFitnesses = trackRows
      .map((r) => r.summary.medianHemsFitness)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const medCombineds = trackRows
      .map((r) => r.summary.medianCombined)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

    groups.push({
      track,
      rows: trackRows,
      medianScore: computeMedian(medScores),
      medianHemsFitness: computeMedian(medFitnesses),
      medianCombined: computeMedian(medCombineds),
    });
  }

  return groups;
}
