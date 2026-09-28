import { DAYS, type PlaceRecord } from "./place-record";
export function displayValue(value: unknown): string {
  if (value === null || value === undefined || ["", "확인 필요", "미지정"].includes(String(value).trim())) return "찾는중..";
  return String(value);
}
export function placeDetails(place: Partial<PlaceRecord>) {
  return [
    { label: "주소", value: displayValue(place.fullAddress) },
    { label: "영업시간", value: DAYS.map(day => {
      const h = place.weeklyHours?.[day];
      return `${day} ${h?.closed ? "휴무" : h?.open && h?.close ? `${h.open}–${h.close}` : "찾는중.."}`;
    }).join(" · ") },
    { label: "연령별 입장료", value: place.prices?.length ? place.prices.map(row => `${row.label || "연령"}${row.minAge || row.maxAge ? ` (${row.minAge || "미만"}–${row.maxAge || "이상"}세)` : ""}: ${row.free ? "무료" : displayValue(row.price)}`).join(" · ") : "찾는중.." },
    { label: "주차", value: displayValue(place.parkingType) },
    { label: "주차 지원시간", value: place.parkingType === "주차 불가" ? "해당 없음" : displayValue(place.parkingSupport) },
    { label: "환경", value: displayValue(place.environment) },
    { label: "카테고리", value: displayValue(place.category) },
    { label: "예약 필요", value: place.reservationRequired === true ? "필요" : place.reservationRequired === false ? "불필요" : "찾는중.." },
    { label: "예약 오픈", value: place.reservationRequired === false ? "해당 없음" : displayValue(place.reservationOpenRule) },
    { label: "예약 링크", value: place.reservationRequired === false ? "해당 없음" : displayValue(place.reservationUrl) },
  ];
}
