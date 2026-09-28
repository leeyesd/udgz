export default function PlaceDetails({ details }: { details?: { label: string; value: string }[] }) {
  if (!details) return null;
  return <details className="place-details"><summary>이용 정보</summary><dl>{details.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.label === "예약 링크" && /^https?:\/\//i.test(item.value) ? <a href={item.value} target="_blank" rel="noreferrer">예약 페이지 ↗</a> : item.value}</dd></div>)}</dl></details>;
}
