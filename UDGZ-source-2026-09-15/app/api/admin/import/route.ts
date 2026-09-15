import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureDatabase } from "../../../../db/ensure";
import { places } from "../../../../db/schema";
import { isAdminRequest, unauthorized } from "../../../../lib/admin-access";
import type { PlaceRecord } from "../../../../lib/place-record";

const MAX_BATCH = 40;

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  try {
    await ensureDatabase();
    const payload = await request.json() as { places?: Array<{ name: string; addressKey: string }>; restoreOriginals?: boolean };
    const db = getDb();
    if (payload.restoreOriginals) {
      await db.delete(places).where(gt(places.id, 2));
      return Response.json({ restored: true });
    }
    const items = payload.places ?? [];
    if (!items.length || items.length > MAX_BATCH) {
      return Response.json({ error: `한 번에 1~${MAX_BATCH}개까지 정리할 수 있어요.` }, { status: 400 });
    }

    const statements = items.map((item) => db.delete(places).where(and(
      eq(places.name, item.name), eq(places.addressKey, item.addressKey),
      eq(places.category, "미지정"), eq(places.environment, "미지정"),
    )));
    await db.batch(statements as [typeof statements[number], ...typeof statements]);
    return Response.json({ cleaned: items.length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "정리에 실패했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  try {
    await ensureDatabase();
    const payload = await request.json() as { places?: PlaceRecord[] };
    const items = payload.places ?? [];
    if (!items.length || items.length > MAX_BATCH) {
      return Response.json({ error: `한 번에 1~${MAX_BATCH}개까지 등록할 수 있어요.` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const db = getDb();
    const statements = items.map((item) => db.insert(places).values({
      name: item.name.trim(), branchName: item.branchName ?? "", category: "미지정",
      fullAddress: item.fullAddress.trim(), addressKey: item.addressKey ?? "",
      province: item.province ?? "", city: item.city ?? "", district: item.district ?? "",
      weeklyHours: item.weeklyHours, holidayHours: item.holidayHours ?? "확인 필요",
      reservationRequired: Boolean(item.reservationRequired), reservationOpenRule: item.reservationOpenRule ?? "",
      reservationUrl: item.reservationUrl ?? "", ageRestriction: item.ageRestriction ?? "확인 필요",
      prices: item.prices ?? [], timeSurcharge: item.timeSurcharge ?? "", themes: [], environment: "미지정",
      parkingType: item.parkingType ?? "확인 필요", parkingFee: item.parkingFee ?? "", parkingSupport: item.parkingSupport ?? "",
      nursingRoom: item.nursingRoom ?? "확인 필요", changingTable: item.changingTable ?? "확인 필요",
      officialSources: item.officialSources ?? [], imageUrl: "", imageSourceUrl: "",
      summary: "", reasons: [], caution: item.caution ?? "", ageHint: item.ageHint ?? "",
      score: 80, ticketCandidate: Boolean(item.ticketCandidate), affiliateUrl: "",
      status: item.status === "duplicate" ? "duplicate" : "pending", duplicateOfId: null,
      reviewer: "", aiResearched: false, lastVerifiedAt: "", updatedAt: now,
    }));

    await db.batch(statements as [typeof statements[number], ...typeof statements]);
    return Response.json({ imported: items.length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "가져오기에 실패했습니다." }, { status: 500 });
  }
}
