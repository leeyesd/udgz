import type { Place } from './places';
export type VisitMood = '감성적 휴식' | '특별한 체험' | '신나게 놀기' | '실내 활동';
export function rankPlaces(places: Place[], mood: VisitMood): Place[] {
  const key = mood === '감성적 휴식' ? 'aestheticScore' : mood === '특별한 체험' ? 'rarityScore' : 'activityScore';
  const selected = mood === '실내 활동' ? places.filter(p => p.coreEnvironment === '실내') : [...places];
  return selected.sort((a, b) => {
    const aScore = a.tagScores?.[key] ?? 0, bScore = b.tagScores?.[key] ?? 0;
    return Number(bScore >= 4) - Number(aScore >= 4) || bScore - aScore || b.score - a.score;
  });
}
