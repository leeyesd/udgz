import { TAG_FIELDS, TAG_LABELS } from "../lib/place-tags";
export default function PlaceTags({ scores }: { scores?: Partial<Record<typeof TAG_FIELDS[number], number | null>> }) {
  return <div className="place-tags" aria-label="장소 태그 점수">{TAG_FIELDS.map(key => {
    const value = scores?.[key];
    return <span key={key} className={value != null && value >= 4 ? "place-tag strong" : "place-tag dimmed"}>{TAG_LABELS[key]} {value == null ? "찾는중.." : `${value}/5`}</span>;
  })}</div>;
}
