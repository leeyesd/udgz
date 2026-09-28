export type PlaceLinks = { name: string; reservationRequired?: boolean | null; reservationUrl?: string; affiliateUrl?: string; snsUrl?: string };
export function searchUrl(name: string, blogs = false) {
  return `https://search.naver.com/search.naver?${blogs ? "where=blog&" : ""}query=${encodeURIComponent(`${name.trim()} 아이랑`)}`;
}
export function safeLink(value?: string) {
  try { const url = new URL(value?.trim() ?? ""); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}
export function normalizeLinks(place: PlaceLinks) {
  const search = searchUrl(place.name);
  const booking = safeLink(place.reservationUrl);
  return {
    reservationUrl: place.reservationRequired === false ? search : place.reservationRequired === true && booking === search ? "" : booking,
    snsUrl: safeLink(place.snsUrl) || searchUrl(place.name, true),
  };
}
export function cardLinks(place: PlaceLinks) {
  const links = normalizeLinks(place);
  const affiliate = safeLink(place.affiliateUrl);
  return {
    primary: affiliate ? { label: "예약하기", url: affiliate } : place.reservationRequired === true
      ? { label: "예약하기", url: links.reservationUrl }
      : { label: "더보기", url: links.reservationUrl || searchUrl(place.name) },
    sns: links.snsUrl,
  };
}
