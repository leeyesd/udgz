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

    { label: "주차", value: displayValue(place.parkingType) },
    { label: "주차 비용", value: displayValue(place.parkingFee) },
    { label: "수유실", value: displayValue(place.nursingRoom) },
    { label: "기저귀갈이대", value: displayValue(place.changingTable) },
    { label: "주차 지원시간", value: place.parkingType === "주차 불가" ? "해당 없음" : displayValue(place.parkingSupport) },
    { label: "환경", value: displayValue(place.environment) },
    { label: "카테고리", value: displayValue(place.category) },
    { label: "예약 필요", value: place.reservationRequired === true ? "필요" : place.reservationRequired === false ? "불필요" : "찾는중.." },
    { label: "예약 오픈", value: place.reservationRequired === false ? "해당 없음" : displayValue(place.reservationOpenRule) },
  ];
}
