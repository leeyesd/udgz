export const TAG_FIELDS = ["aestheticScore", "activityScore", "rarityScore"] as const;
export const TAG_LABELS = { aestheticScore: "감도", activityScore: "체력빼기", rarityScore: "경험희소성" } as const;
export function validateTagScores(input: Record<string, unknown>) {
  for (const key of TAG_FIELDS) {
    const score = input[key];
    if (score != null && (!Number.isInteger(score) || Number(score) < 0 || Number(score) > 5)) throw new Error("태그 점수는 0~5 사이 정수여야 합니다.");
  }
}
export function placeNameKey(name: string) {
  return name.normalize("NFKC").toLowerCase().replace(/[\s()[\],.·-]/g, "");
}
