import { count, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureDatabase } from "../../../../db/ensure";
import { places, researchRuns } from "../../../../db/schema";
import { isAdminRequest, runtimeEnv, unauthorized } from "../../../../lib/admin-access";
import { emptyPlace, normalizeAddress, searchLinks, type PlaceRecord, type WeeklyHours } from "../../../../lib/place-record";

const LIMIT = 10;

function schema() {
  const day = { type: "object", additionalProperties: false, properties: { day: { type: "string" }, closed: { type: "boolean" }, open: { type: "string" }, close: { type: "string" }, note: { type: "string" } }, required: ["day", "closed", "open", "close", "note"] };
  const price = { type: "object", additionalProperties: false, properties: { label: { type: "string" }, minAge: { type: "string" }, maxAge: { type: "string" }, price: { type: "string" }, free: { type: "boolean" }, note: { type: "string" } }, required: ["label", "minAge", "maxAge", "price", "free", "note"] };
  const source = { type: "object", additionalProperties: false, properties: { label: { type: "string" }, url: { type: "string" } }, required: ["label", "url"] };
  return {
    type: "object", additionalProperties: false,
    properties: {
      name: { type: "string" }, branchName: { type: "string" }, category: { type: "string" },
      fullAddress: { type: "string" }, province: { type: "string" }, city: { type: "string" }, district: { type: "string" },
      weeklyHours: { type: "array", items: day }, holidayHours: { type: "string" }, ageRestriction: { type: "string" },
      prices: { type: "array", items: price }, timeSurcharge: { type: "string" }, parkingType: { type: "string" },
      parkingFee: { type: "string" }, parkingSupport: { type: "string" }, reservationRequired: { type: "boolean" },
      reservationOpenRule: { type: "string" }, reservationUrl: { type: "string" }, nursingRoom: { type: "string" }, changingTable: { type: "string" },
      officialSources: { type: "array", items: source }, imageUrl: { type: "string" }, imageSourceUrl: { type: "string" },
      summary: { type: "string" }, reasons: { type: "array", items: { type: "string" } }, caution: { type: "string" }, ageHint: { type: "string" },
    },
    required: ["name", "branchName", "category", "fullAddress", "province", "city", "district", "weeklyHours", "holidayHours", "ageRestriction", "prices", "timeSurcharge", "parkingType", "parkingFee", "parkingSupport", "reservationRequired", "reservationOpenRule", "reservationUrl", "nursingRoom", "changingTable", "officialSources", "imageUrl", "imageSourceUrl", "summary", "reasons", "caution", "ageHint"],
  };
}

function toHours(rows: Array<{ day: string; closed: boolean; open: string; close: string; note: string }>, fallback: WeeklyHours) {
  const copy = structuredClone(fallback);
  for (const row of rows) if (row.day in copy) copy[row.day as keyof WeeklyHours] = { closed: row.closed, open: row.open, close: row.close, note: row.note };
  return copy;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const { query = "" } = await request.json() as { query?: string };
  const placeName = query.trim();
  if (!placeName) return Response.json({ error: "장소명을 입력해주세요." }, { status: 400 });

  await ensureDatabase();
  const db = getDb();
  const [{ value: used }] = await db.select({ value: count() }).from(researchRuns).where(eq(researchRuns.status, "success"));
  const apiKey = runtimeEnv().OPENAI_API_KEY;
  if (used >= LIMIT || !apiKey) {
    return Response.json({ fallback: true, reason: used >= LIMIT ? "AI 조사 10건을 모두 사용했어요." : "API 키 연결 전에는 검색 링크를 제공해요.", links: searchLinks(placeName), remaining: Math.max(0, LIMIT - used) });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.4-nano",
        store: false,
        tools: [{ type: "web_search" }],
        include: ["web_search_call.action.sources"],
        max_tool_calls: 4,
        input: `한국의 가족 나들이 장소 '${placeName}'를 조사해 주세요. 공식 홈페이지, 공공기관, 공식 예약 페이지를 최우선으로 사용하세요. 현재 확인할 수 없는 정보는 추측하지 말고 '확인 필요' 또는 빈 문자열로 표시하세요. 가격 정보가 없다는 이유만으로 무료라고 판단하지 마세요. 주소는 전체주소와 시/도, 시/군/구, 읍/면/동으로 분리하세요. 공개 카드 문구는 사실에 근거해 간결하게 작성하세요.`,
        text: { format: { type: "json_schema", name: "udgz_place_research", strict: true, schema: schema() } },
      }),
    });
    if (!response.ok) throw new Error(`API 조사 실패 (${response.status})`);
    const data = await response.json() as { output_text?: string };
    const researched = JSON.parse(data.output_text ?? "{}") as Partial<PlaceRecord> & { weeklyHours?: Array<{ day: string; closed: boolean; open: string; close: string; note: string }> };
    const base = emptyPlace(researched.name || placeName);
    const item: PlaceRecord = {
      ...base, ...researched,
      weeklyHours: Array.isArray(researched.weeklyHours) ? toHours(researched.weeklyHours, base.weeklyHours) : base.weeklyHours,
      themes: [], reviewer: "", score: 80, ticketCandidate: false, affiliateUrl: "",
      aiResearched: true, lastVerifiedAt: new Date().toISOString().slice(0, 10),
    };
    const addressKey = normalizeAddress(item.fullAddress);
    const duplicate = addressKey ? await db.select({ id: places.id }).from(places).where(eq(places.addressKey, addressKey)).orderBy(desc(places.id)).limit(1) : [];
    const status = duplicate.length ? "duplicate" : "pending";
    const [saved] = await db.insert(places).values({
      ...item, id: undefined, addressKey, status, duplicateOfId: duplicate[0]?.id ?? null,
      officialSources: item.officialSources ?? [], prices: item.prices ?? [], reasons: item.reasons ?? [], themes: [],
    }).returning();
    await db.insert(researchRuns).values({ query: placeName, status: "success" });
    return Response.json({ place: saved, remaining: Math.max(0, LIMIT - used - 1), duplicate: Boolean(duplicate.length) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "API 조사에 실패했습니다.";
    await db.insert(researchRuns).values({ query: placeName, status: "failed", errorMessage: message });
    return Response.json({ fallback: true, reason: `${message} 검색 링크로 전환했어요.`, links: searchLinks(placeName), remaining: Math.max(0, LIMIT - used) });
  }
}
