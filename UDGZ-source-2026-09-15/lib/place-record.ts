export const THEMES = ["실내", "야외", "특별한 체험", "감성적 휴식"] as const;
export const CATEGORIES = ["미지정", "문화", "체험", "카페", "자연", "테마파크", "식당", "공공"] as const;
export const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export type DayHours = { closed: boolean; open: string; close: string; note: string };
export type WeeklyHours = Record<(typeof DAYS)[number], DayHours>;
export type PriceRow = { label: string; minAge: string; maxAge: string; price: string; free: boolean; note: string };
export type OfficialSource = { label: string; url: string };

export type PlaceRecord = {
  id?: number;
  name: string;
  branchName: string;
  category: string;
  fullAddress: string;
  addressKey?: string;
  province: string;
  city: string;
  district: string;
  weeklyHours: WeeklyHours;
  holidayHours: string;
  reservationRequired: boolean;
  reservationOpenRule: string;
  reservationUrl: string;
  ageRestriction: string;
  prices: PriceRow[];
  timeSurcharge: string;
  themes: string[];
  environment: string;
  parkingType: string;
  parkingFee: string;
  parkingSupport: string;
  nursingRoom: string;
  changingTable: string;
  officialSources: OfficialSource[];
  imageUrl: string;
  imageSourceUrl: string;
  summary: string;
  reasons: string[];
  caution: string;
  ageHint: string;
  score: number;
  ticketCandidate: boolean;
  affiliateUrl: string;
  status?: string;
  duplicateOfId?: number | null;
  reviewer: string;
  aiResearched?: boolean;
  lastVerifiedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export function emptyHours(): WeeklyHours {
  return Object.fromEntries(DAYS.map((day) => [day, { closed: false, open: "10:00", close: "18:00", note: "" }])) as WeeklyHours;
}

export function emptyPlace(name = ""): PlaceRecord {
  return {
    name, branchName: "", category: "체험", fullAddress: "", province: "", city: "", district: "",
    weeklyHours: emptyHours(), holidayHours: "확인 필요", reservationRequired: false,
    reservationOpenRule: "", reservationUrl: "", ageRestriction: "없음",
    prices: [{ label: "전체", minAge: "", maxAge: "", price: "", free: false, note: "확인 필요" }],
    timeSurcharge: "", themes: [], environment: "혼합", parkingType: "확인 필요",
    parkingFee: "", parkingSupport: "", nursingRoom: "확인 필요", changingTable: "확인 필요",
    officialSources: [{ label: "공식 홈페이지", url: "" }], imageUrl: "", imageSourceUrl: "",
    summary: "", reasons: [""], caution: "", ageHint: "영유아부터", score: 80,
    ticketCandidate: false, affiliateUrl: "", reviewer: "", lastVerifiedAt: new Date().toISOString().slice(0, 10),
  };
}

export function normalizeAddress(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[()[\],.·-]/g, " ").replace(/\s+/g, "").trim();
}

export function normalizeThemes(values: string[]) {
  const legacyMap: Record<string, (typeof THEMES)[number]> = {
    "실내 즐길거리": "실내",
    "야외 즐길거리": "야외",
    "감각적 공간": "감성적 휴식",
    "한적한 자연휴식": "감성적 휴식",
  };
  return [...new Set(values.map((value) => legacyMap[value] ?? value).filter((value): value is (typeof THEMES)[number] => THEMES.includes(value as (typeof THEMES)[number])))];
}

export function searchLinks(query: string) {
  const q = encodeURIComponent(query.trim());
  return [
    { label: "네이버 검색", url: `https://search.naver.com/search.naver?query=${q}` },
    { label: "Google 검색", url: `https://www.google.com/search?q=${q}` },
    { label: "네이버 지도", url: `https://map.naver.com/p/search/${q}` },
  ];
}
