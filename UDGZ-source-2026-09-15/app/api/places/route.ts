import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureDatabase } from "../../../db/ensure";
import { places } from "../../../db/schema";

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/특별자치|광역|특별|시|군|구|읍|면|동|\s/g, "");
}

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const location = new URL(request.url).searchParams.get("location")?.trim() ?? "";
    const key = normalize(location);
    const db = getDb();
    const rows = await db.select().from(places).where(eq(places.status, "published")).orderBy(desc(places.score), desc(places.updatedAt)).limit(500);
    const matched = key ? rows.filter((row) => normalize(`${row.province}${row.city}${row.district}${row.fullAddress}`).includes(key) || key.includes(normalize(row.city)) || key.includes(normalize(row.district))) : rows;
    return Response.json({ places: matched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "장소를 불러오지 못했습니다.";
    return Response.json({ error: message, places: [] }, { status: 500 });
  }
}
