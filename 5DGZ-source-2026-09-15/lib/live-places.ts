import { placeDetails, displayValue } from "./place-display";
import type { PlaceRecord } from "./place-record";
import { type Mood, type Place } from "./places";

type DbPlace = Partial<PlaceRecord> & {
  id: number; name: string; branchName: string; category: Place["category"]; fullAddress: string;
  city: string; district: string; themes: Mood[]; environment: string; score: number;
  ageHint: string; summary: string; reasons: string[]; caution: string;
  ticketCandidate: boolean; affiliateUrl: string;
};

function toPublicPlace(row: DbPlace): Place {
  return {
    id: `db-${row.id}`,
    name: `${row.name}${row.branchName ? ` ${row.branchName}` : ""}`,
    region: [row.province, row.city].filter(Boolean).join(" "),
    category: row.category,
    moods: [...(row.environment === "혼합" ? ["실내", "야외"] : row.environment === "실내" || row.environment === "야외" ? [row.environment] : []), ...((row.rarityScore ?? 0) >= 4 ? ["특별한 체험"] : []), ...((row.aestheticScore ?? 0) >= 4 ? ["감성적 휴식"] : [])] as Mood[],
    coreEnvironment: row.environment === "혼합" ? "실내·야외" : displayValue(row.environment) as Place["coreEnvironment"],
    score: (row.aestheticScore ?? 0) + (row.activityScore ?? 0) + (row.rarityScore ?? 0),
    ageHint: row.ageHint,
    summary: displayValue(row.summary),
    reasons: row.reasons,
    caution: row.caution || undefined,
    ticketCandidate: row.ticketCandidate,
    affiliateUrl: row.affiliateUrl || undefined,
    reservationRequired: row.reservationRequired,
    reservationUrl: row.reservationUrl,
    snsUrl: row.snsUrl,
    fullAddress: row.fullAddress,
    details: placeDetails(row),
    prices: row.prices,
    imageUrl: row.imageUrl,
    tagScores: { aestheticScore: row.aestheticScore, activityScore: row.activityScore, rarityScore: row.rarityScore },
  };
}

export async function loadPlaces(location: string, date = ""): Promise<Place[]> {
  try {
    const response = await fetch(`/api/places?location=${encodeURIComponent(location)}&date=${encodeURIComponent(date)}`);
    if (!response.ok) return [];
    const data = await response.json() as { places?: DbPlace[]; excludedFallbackIds?: string[] };
    const live = (data.places ?? []).map(toPublicPlace);
    return live;
  } catch {
    return [];
  }
}
