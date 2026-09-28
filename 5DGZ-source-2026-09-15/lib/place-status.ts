export const RESEARCH_STATUSES = ["hold", "incomplete", "review_required"] as const;
export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ResearchStatus = typeof RESEARCH_STATUSES[number];
export type ReviewStatus = typeof REVIEW_STATUSES[number];

export function resolvePlaceStatus(researchStatus: ResearchStatus, reviewStatus: ReviewStatus, duplicate = false) {
  if (!RESEARCH_STATUSES.includes(researchStatus) || !REVIEW_STATUSES.includes(reviewStatus)) throw new Error("올바르지 않은 장소 상태입니다.");
  if (reviewStatus === "rejected") researchStatus = "hold";
  const isPublic = !duplicate && (researchStatus === "review_required" || (researchStatus === "incomplete" && reviewStatus === "approved"));
  return { researchStatus, reviewStatus, isPublic };
}
