import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureDatabase } from "../../../db/ensure";
import { places } from "../../../db/schema";

import { places as curatedFallback } from "../../../lib/places";

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/특별자치|광역|특별|시|군|구|읍|면|동|\s/g, "");
}

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const location = new URL(request.url).searchParams.get("location")?.trim() ?? "";
    const key = normalize(location);
    const db = getDb();
    const rows = await db.select().from(places).where(eq(places.isPublic, true)).orderBy(desc(places.updatedAt)).limit(500);
    const matched = key ? rows.filter((row) => normalize(`${row.province}${row.city}${row.fullAddress}`).includes(key) || (Boolean(row.city) && key.includes(normalize(row.city)))) : rows;
    const hidden = await db.select({ name: places.name, branchName: places.branchName }).from(places).where(eq(places.isPublic, false));
    const hiddenNames = new Set(hidden.map(row => `${row.name}${row.branchName}`.replace(/\s/g, "")));
    const excludedFallbackIds = curatedFallback.filter(place => hiddenNames.has(place.name.replace(/\s/g, ""))).map(place => place.id);
    return Response.json({ places: matched, excludedFallbackIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "장소를 불러오지 못했습니다.";
    return Response.json({ error: message, places: [] }, { status: 500 });
  }
}
