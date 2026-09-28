import { places as curatedFallback, type Mood, type Place } from "./places";
import { normalizeThemes } from "./place-record";

type DbPlace = {
  id: number; name: string; branchName: string; category: Place["category"]; fullAddress: string;
  city: string; district: string; themes: Mood[]; environment: string; score: number;
  ageHint: string; summary: string; reasons: string[]; caution: string;
  ticketCandidate: boolean; affiliateUrl: string;
};

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/특별자치|광역|특별|시|군|구|읍|면|동|\s/g, "");
}

function fallbackMatches(place: Place, location: string) {
  const target = normalize(location);
  const region = normalize(place.region);
  return !target || target.includes(region) || region.includes(target);
}

function toPublicPlace(row: DbPlace): Place {
  return {
    id: `db-${row.id}`,
    name: `${row.name}${row.branchName ? ` ${row.branchName}` : ""}`,
    region: [row.city, row.district].filter(Boolean).join(" "),
    category: row.category,
    moods: normalizeThemes(row.themes) as Mood[],
    coreEnvironment: row.environment === "혼합" ? "실내·야외" : row.environment as Place["coreEnvironment"],
    score: row.score,
    ageHint: row.ageHint,
    summary: row.summary,
    reasons: row.reasons,
    caution: row.caution || undefined,
    ticketCandidate: row.ticketCandidate,
    affiliateUrl: row.affiliateUrl || undefined,
    fullAddress: row.fullAddress,
  };
}

export async function loadPlaces(location: string): Promise<Place[]> {
  try {
    const response = await fetch(`/api/places?location=${encodeURIComponent(location)}`);
    if (!response.ok) return curatedFallback;
    const data = await response.json() as { places?: DbPlace[] };
    const live = (data.places ?? []).map(toPublicPlace);
    if (!live.length) return curatedFallback;
    const names = new Set(live.map((place) => place.name.replace(/\s/g, "")));
    const matchingFallback = curatedFallback.filter((place) => fallbackMatches(place, location) && !names.has(place.name.replace(/\s/g, "")));
    return [...live, ...matchingFallback];
  } catch {
    return curatedFallback;
  }
}
