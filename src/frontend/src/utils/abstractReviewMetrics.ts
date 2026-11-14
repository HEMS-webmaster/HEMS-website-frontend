import {
  AbstractReviewRecord,
  AbstractSubmissionRecord,
  RESEARCH_TRACK_OPTIONS,
  ResearchTrack,
  ReviewDecision,
} from "@/types/abstractSubmission";

export type RecommendationDecisionKey = Exclude<ReviewDecision, "Pending">;

export type RecommendationCounts = Record<RecommendationDecisionKey, number>;

export interface SubmissionReviewSummary {
  submissionId: string;
  reviews: AbstractReviewRecord[];
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

export function buildReviewId(submissionId: string, reviewerEmail: string): string {
  const safeSubId = submissionId.trim();
  const safeEmail =
    reviewerEmail
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._+-]/g, "_") || "reviewer";
  return `rev_${safeSubId}_${safeEmail}`;
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

export function summarizeSubmissionReviews(
  submission: AbstractSubmissionRecord,
  allReviews: readonly AbstractReviewRecord[]
): SubmissionReviewSummary {
  const matched = allReviews
    .filter((r) => r.submissionId === submission.id)
    .sort((a, b) => {
      const tA = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      const tB = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      return tB - tA;
    });

  let effectiveReviews: AbstractReviewRecord[] = matched;

  // Backwards compatibility for legacy single-review submissions before multi-review records exist
  if (
    effectiveReviews.length === 0 &&
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
    effectiveReviews = [
      {
        reviewId: buildReviewId(submission.id, fallbackEmail),
        submissionId: submission.id,
        reviewerEmail: fallbackEmail,
        score: submission.score,
        hemsFitness: fallbackFitness,
        decision: submission.decision,
        reviewerComments: submission.reviewerComments || "",
        privateNotes: "",
        createdAt: fallbackTs,
        updatedAt: fallbackTs,
        ...(submission.isSampleSeed ? { isSampleSeed: true } : {}),
      },
    ];
  }

  const counts = emptyRecommendationCounts();
  const scores: number[] = [];
  const fitnessScores: number[] = [];
  const combinedScores: number[] = [];

  for (const rev of effectiveReviews) {
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

  const activeParts = RECOMMENDATION_PRIORITY.filter(
    (key) => counts[key] > 0
  ).map((key) => `${counts[key]} ${RECOMMENDATION_SHORT_LABEL[key]}`);

  const recommendationSummaryText =
    activeParts.length > 0 ? activeParts.join(" • ") : "Pending Review";

  return {
    submissionId: submission.id,
    reviews: effectiveReviews,
    reviewCount: effectiveReviews.length,
    medianScore,
    medianHemsFitness,
    medianCombined,
    minScore,
    maxScore,
    minHemsFitness,
    maxHemsFitness,
    recommendationCounts: counts,
    consensusDecision,
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

  // Filter visibleGroupIds in currentGlobalIds sequence
  const scopeOrder = currentGlobalIds.filter((id) => groupSet.has(id));
  const fromIdx = scopeOrder.indexOf(movingId);
  const toIdx = scopeOrder.indexOf(targetId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
    return [...currentGlobalIds];
  }

  const nextScopeOrder = [...scopeOrder];
  const [moved] = nextScopeOrder.splice(fromIdx, 1);
  nextScopeOrder.splice(toIdx, 0, moved);

  // Put updated scopeOrder items back into their original slot positions inside currentGlobalIds
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
    const track = row.submission.researchTrack;
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

