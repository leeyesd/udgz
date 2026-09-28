import { normalizeLinks } from "../../../../lib/place-links";
import { isAdminRequest, runtimeEnv, unauthorized } from "../../../../lib/admin-access";
import { normalizePrice, mergedPlaceName } from "../../../../lib/place-pricing";
import { placeNameKey } from "../../../../lib/place-tags";
import type { PriceRow } from "../../../../lib/place-record";

// Explicit, repeatable data backfill. Old columns remain available for recovery.
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const db = runtimeEnv().DB;
  if (!db) return Response.json({ error: "DB에 연결하지 못했습니다." }, { status: 503 });
  try {
    let cursor = 0, changed = 0;
    while (true) {
      const { results } = await db.prepare("SELECT id,name,branch_name,prices,reservation_required,reservation_url,sns_url FROM places WHERE id > ? ORDER BY id LIMIT 50").bind(cursor).all<{ id: number; name: string; branch_name: string; prices: string; reservation_required: number | null; reservation_url: string; sns_url: string }>();
      if (!results.length) break;
      const updates = results.flatMap(row => {
        const name = mergedPlaceName(row.name, row.branch_name);
        const prices = JSON.stringify((JSON.parse(row.prices) as PriceRow[]).map(normalizePrice));
        const links = normalizeLinks({ name, reservationRequired: row.reservation_required === null ? null : Boolean(row.reservation_required), reservationUrl: row.reservation_url, snsUrl: row.sns_url });
        if (links.reservationUrl === row.reservation_url && links.snsUrl === row.sns_url && name === row.name && !row.branch_name && prices === row.prices) return [];
        return [db.prepare("UPDATE places SET name=?,name_key=?,branch_name='',prices=?,reservation_url=?,sns_url=? WHERE id=? AND name=? AND branch_name=? AND prices=? AND reservation_url=? AND sns_url=? AND reservation_required IS ?")
          .bind(name, placeNameKey(name), prices, links.reservationUrl, links.snsUrl, row.id, row.name, row.branch_name, row.prices, row.reservation_url, row.sns_url, row.reservation_required)];
      });
      if (updates.length) { const responses = await db.batch(updates); changed += responses.reduce((n, result) => n + (result.meta.changes ?? 0), 0); }
      cursor = results[results.length - 1].id;
    }
    return Response.json({ changed });
  } catch (error) { console.error("Format upgrade failed", error); return Response.json({ error: "기존 자료 전환을 완료하지 못했습니다. 다시 시도해주세요." }, { status: 500 }); }
}
