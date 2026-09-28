import type { PriceRow } from "../lib/place-record";
import { priceForDate, isWeekend } from "../lib/place-pricing";
export default function PlaceDetails({ details, prices, date }: { details?: { label: string; value: string }[]; prices?: PriceRow[]; date: string }) {
  return <><p className="visit-price"><b>{isWeekend(date) ? "주말" : "평일"} 입장료</b> · {prices?.length ? prices.map(row => `${row.label || "연령"}: ${priceForDate(row, date)}`).join(" · ") : "찾는중.."}</p>
    <details className="place-details"><summary>이용 정보</summary><dl>{prices?.filter(row => row.note && !["찾는중..", "확인 필요"].includes(row.note)).map((row, i) => <div key={`price-${i}`}><dt>{row.label} 요금 참고</dt><dd>{row.note}</dd></div>)}{details?.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.label === "예약 링크" && /^https?:\/\//i.test(item.value) ? <a href={item.value} target="_blank" rel="noreferrer">예약 페이지 ↗</a> : item.value}</dd></div>)}</dl></details></>;
}
