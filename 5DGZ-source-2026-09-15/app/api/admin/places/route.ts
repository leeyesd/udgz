import { normalizeRegion } from "../../../../lib/place-region";
import { normalizeLinks, safeLink } from "../../../../lib/place-links";
import { normalizePrice, mergedPlaceName } from "../../../../lib/place-pricing";
import { and, count, desc, eq, ne, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureDatabase } from "../../../../db/ensure";
import { places, researchRuns } from "../../../../db/schema";
import { isAdminRequest, unauthorized } from "../../../../lib/admin-access";
import { emptyPlace, normalizeAddress, normalizeThemes, type PlaceRecord } from "../../../../lib/place-record";

import { validateTagScores, placeNameKey } from "../../../../lib/place-tags";
import { resolvePlaceStatus } from "../../../../lib/place-status";


function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "장소 DB 처리 중 오류가 발생했습니다.";
  return Response.json({ error: message }, { status: 500 });
}

function cleanPlace(input: Partial<PlaceRecord>): PlaceRecord {
  const base = emptyPlace(input.name?.trim() ?? "");
  return {
    ...base,
    ...input,
    name: mergedPlaceName(input.name ?? "", input.branchName ?? ""),
    branchName: "",
    fullAddress: input.fullAddress?.trim() ?? "",
    ...normalizeRegion(input),
    district: input.district?.trim() ?? "",
    themes: normalizeThemes(input.themes ?? []),
    reviewer: input.reviewer?.trim() ?? "",
    officialSources: (input.officialSources ?? []).filter((source) => source.url.trim()),
    prices: (input.prices?.length ? input.prices : base.prices).map(normalizePrice),
    reasons: (input.reasons ?? []).map((reason) => reason.trim()).filter(Boolean),
    score: Math.max(0, Math.min(100, Number(input.score ?? 80))),
  };
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    await ensureDatabase();
    const db = getDb();
    const url = new URL(request.url);
    if (url.searchParams.get("lookup") === "1") {
      const address = normalizeAddress(url.searchParams.get("address") ?? "");
      if (!address) return Response.json({ places: [] });
      const rows = await db.select({ id: places.id, name: places.name, fullAddress: places.fullAddress }).from(places).where(eq(places.addressKey, address)).limit(30);
      return Response.json({ places: rows });
    }
    const rows = (await db.select().from(places).orderBy(desc(places.updatedAt), desc(places.id)).limit(300))
      .map((place) => ({ ...place, themes: normalizeThemes(place.themes) }));
    const [{ value: researchCount }] = await db.select({ value: count() }).from(researchRuns);
    return Response.json({ places: rows, researchCount });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    await ensureDatabase();
    const payload = await request.json() as { action?: "save" | "approve" | "reject"; place?: Partial<PlaceRecord> };
    const item = cleanPlace(payload.place ?? {});
    if (!item.name) return Response.json({ error: "필수입력값을 채워주세요.", missing: [{ key: "name", label: "장소명" }]  }, { status: 400 });

    for (const key of ["reservationUrl", "affiliateUrl", "snsUrl"] as const) {
      if (item[key]?.trim() && !safeLink(item[key])) return Response.json({ error: "링크는 http:// 또는 https:// 주소로 입력해주세요." }, { status: 400 });
    }
    Object.assign(item, normalizeLinks(item));
    const db = getDb();
    const addressKey = normalizeAddress(item.fullAddress);
    try { validateTagScores(item as unknown as Record<string, unknown>); }
    catch (error) { return Response.json({ error: String(error) }, { status: 400 }); }
    const parentPlaceId = item.parentPlaceId ?? null;
    if (parentPlaceId !== null) {
      if (!Number.isSafeInteger(parentPlaceId) || parentPlaceId <= 0 || parentPlaceId === item.id) return Response.json({ error: "상위 장소를 확인해주세요." }, { status: 400 });
      const [parent] = await db.select({ id: places.id, parentPlaceId: places.parentPlaceId }).from(places).where(eq(places.id, parentPlaceId)).limit(1);
      if (!parent || parent.parentPlaceId !== null) return Response.json({ error: "등록된 일반 장소를 상위 장소로 선택해주세요." }, { status: 400 });
    }
    const nameKey = placeNameKey(item.name);
    const match = parentPlaceId !== null
      ? and(eq(places.parentPlaceId, parentPlaceId), eq(places.nameKey, nameKey))
      : and(eq(places.addressKey, addressKey), isNull(places.parentPlaceId));
    const duplicate = (parentPlaceId !== null || addressKey)
      ? await db.select({ id: places.id, name: places.name }).from(places).where(item.id ? and(match, ne(places.id, item.id)) : match).limit(1)
      : [];
    if (parentPlaceId !== null && duplicate.length) return Response.json({ error: "같은 상위 장소에 이미 등록된 체험 공간입니다.", duplicate: duplicate[0] }, { status: 409 });

    if (payload.action && !["save", "approve", "reject"].includes(payload.action)) return Response.json({ error: "지원하지 않는 작업입니다." }, { status: 400 });
    const existing = item.id ? (await db.select().from(places).where(eq(places.id, item.id)).limit(1))[0] : undefined;
    if (item.id && !existing) return Response.json({ error: "장소를 찾을 수 없습니다." }, { status: 404 });
    const reviewStatus = payload.action === "approve" ? "approved" : payload.action === "reject" ? "rejected" : (existing?.reviewStatus ?? "pending");
    let state;
    try {
      state = resolvePlaceStatus(payload.place?.researchStatus ?? (existing?.researchStatus as PlaceRecord["researchStatus"]) ?? "hold", reviewStatus as "pending" | "approved" | "rejected", Boolean(duplicate.length));
    } catch {
      return Response.json({ error: "올바르지 않은 장소 상태입니다." }, { status: 400 });
    }
    // Keep legacy status compatible until the production duplicate count is verified.
    const status = duplicate.length ? "duplicate" : state.isPublic ? "published" : "pending";

    const values = {
      parentPlaceId, nameKey, aestheticScore: item.aestheticScore ?? null, activityScore: item.activityScore ?? null,
      rarityScore: item.rarityScore ?? null, tagEvidence: item.tagEvidence ?? {},
      name: item.name, branchName: item.branchName, category: item.category, fullAddress: item.fullAddress,
      addressKey, province: item.province, city: item.city, district: item.district,
      weeklyHours: item.weeklyHours, holidayHours: item.holidayHours,
      reservationRequired: item.reservationRequired, reservationOpenRule: item.reservationOpenRule,
      reservationUrl: item.reservationUrl, ageRestriction: item.ageRestriction, prices: item.prices,
      timeSurcharge: item.timeSurcharge, themes: item.themes, environment: item.environment,
      parkingType: item.parkingType, parkingFee: item.parkingFee, parkingSupport: item.parkingSupport,
      nursingRoom: item.nursingRoom, changingTable: item.changingTable, officialSources: item.officialSources,
      imageUrl: item.imageUrl, imageSourceUrl: item.imageSourceUrl, summary: item.summary,
      reasons: item.reasons, caution: item.caution, ageHint: item.ageHint, score: item.score,
      ticketCandidate: item.ticketCandidate, affiliateUrl: item.affiliateUrl, snsUrl: item.snsUrl ?? "", status, ...state,
      duplicateOfId: duplicate[0]?.id ?? null, reviewer: item.reviewer,
      aiResearched: Boolean(item.aiResearched), lastVerifiedAt: item.lastVerifiedAt,
      updatedAt: new Date().toISOString(),
    };

    const [saved] = item.id
      ? await db.update(places).set(values).where(eq(places.id, item.id)).returning()
      : await db.insert(places).values(values).returning();

    return Response.json({ place: saved, duplicate: duplicate[0] ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}
