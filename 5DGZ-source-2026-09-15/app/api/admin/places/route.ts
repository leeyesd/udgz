import { and, count, desc, eq, ne } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureDatabase } from "../../../../db/ensure";
import { places, researchRuns } from "../../../../db/schema";
import { isAdminRequest, unauthorized } from "../../../../lib/admin-access";
import { emptyPlace, normalizeAddress, normalizeThemes, type PlaceRecord } from "../../../../lib/place-record";

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
    name: input.name?.trim() ?? "",
    branchName: input.branchName?.trim() ?? "",
    fullAddress: input.fullAddress?.trim() ?? "",
    province: input.province?.trim() ?? "",
    city: input.city?.trim() ?? "",
    district: input.district?.trim() ?? "",
    themes: normalizeThemes(input.themes ?? []),
    reviewer: input.reviewer?.trim() ?? "",
    officialSources: (input.officialSources ?? []).filter((source) => source.url.trim()),
    prices: input.prices?.length ? input.prices : base.prices,
    reasons: (input.reasons ?? []).map((reason) => reason.trim()).filter(Boolean),
    score: Math.max(0, Math.min(100, Number(input.score ?? 80))),
  };
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    await ensureDatabase();
    const db = getDb();
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

    const db = getDb();
    const addressKey = normalizeAddress(item.fullAddress);
    const duplicate = addressKey
      ? await db.select({ id: places.id, name: places.name }).from(places).where(
          item.id ? and(eq(places.addressKey, addressKey), ne(places.id, item.id)) : eq(places.addressKey, addressKey)
        ).limit(1)
      : [];

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
      ticketCandidate: item.ticketCandidate, affiliateUrl: item.affiliateUrl, status, ...state,
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
