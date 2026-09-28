import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { places } from "../../../../db/schema";
import { isAdminRequest, unauthorized } from "../../../../lib/admin-access";
import { normalizeAddress, CATEGORIES, type PlaceRecord } from "../../../../lib/place-record";
import { placeNameKey } from "../../../../lib/place-tags";
import { POST as savePlace } from "../places/route";

type Candidate = Partial<PlaceRecord> & { referenceKey?: string; parentReferenceKey?: string };
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const { candidates } = await request.json() as { candidates?: Candidate[] };
  if (!Array.isArray(candidates) || candidates.length < 1 || candidates.length > 30) return Response.json({ error: "1~30개 후보를 전달해주세요." }, { status: 400 });
  const results: { name: string; id?: number; result: string; error?: string }[] = [];
  const ids = new Map<string, number>();
  const db = getDb();
  for (const input of candidates) {
    const name = input.name?.trim() ?? "";
    try {
      if (!name || !input.fullAddress?.trim() || !input.summary?.trim() || !CATEGORIES.includes(input.category as typeof CATEGORIES[number]) || input.category === "미지정" || !input.officialSources?.some(s => /^https?:\/\//.test(s.url))) throw new Error("장소명·주소·분류·한줄설명·출처를 확인해주세요.");
      if (input.category === "자연" && input.environment !== "야외") throw new Error("자연 카테고리는 야외만 가능합니다.");
      const parentPlaceId = input.parentReferenceKey ? ids.get(input.parentReferenceKey) : input.parentPlaceId ?? null;
      if (input.parentReferenceKey && !parentPlaceId) throw new Error("상위 장소를 먼저 등록해주세요.");
      const condition = parentPlaceId ? and(eq(places.parentPlaceId, parentPlaceId), eq(places.nameKey, placeNameKey(name))) : and(eq(places.addressKey, normalizeAddress(input.fullAddress)), isNull(places.parentPlaceId));
      const [existing] = await db.select({ id: places.id }).from(places).where(condition).limit(1);
      if (existing) {
        if (input.referenceKey) ids.set(input.referenceKey, existing.id);
        results.push({ name, id: existing.id, result: "duplicate_skipped" }); continue;
      }
      const response = await savePlace(new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({ action: "save", place: { ...input, id: undefined, parentPlaceId, aiResearched: true, reviewStatus: "pending", reviewer: "" } }) }));
      const body = await response.json() as { error?: string; place?: PlaceRecord };
      if (!response.ok || !body.place?.id) throw new Error(body.error ?? "등록 실패");
      if (input.referenceKey) ids.set(input.referenceKey, body.place.id);
      results.push({ name, id: body.place.id, result: "created" });
    } catch (error) { results.push({ name, result: "failed", error: error instanceof Error ? error.message : "등록 실패" }); }
  }
  return Response.json({ results });
}
