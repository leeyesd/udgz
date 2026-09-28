import { cardLinks, type PlaceLinks } from "../lib/place-links";

export default function PlaceActions({ place, primaryClass, secondaryClass }: { place: PlaceLinks; primaryClass: string; secondaryClass: string }) {
  const links = cardLinks(place);
  return <>
    {links.primary.url ? <a className={primaryClass} href={links.primary.url} target="_blank" rel="noopener noreferrer">{links.primary.label} ↗</a> : <span className={primaryClass} aria-disabled="true">예약하기 · 링크 찾는중..</span>}
    <a className={secondaryClass} href={links.sns} target="_blank" rel="noopener noreferrer">SNS후기 보기</a>
  </>;
}
