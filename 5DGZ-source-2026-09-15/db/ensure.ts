import { runtimeEnv } from "../lib/admin-access";

let ready: Promise<void> | null = null;

export function ensureDatabase() {
  if (ready) return ready;
  ready = initialize().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

async function initialize() {
  const db = runtimeEnv().DB;
  if (!db) throw new Error("장소 DB가 아직 연결되지 않았습니다.");
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      branch_name TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '체험',
      full_address TEXT NOT NULL DEFAULT '',
      address_key TEXT NOT NULL DEFAULT '',
      province TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT '',
      weekly_hours TEXT NOT NULL,
      holiday_hours TEXT NOT NULL DEFAULT '확인 필요',
      reservation_required INTEGER NOT NULL DEFAULT 0,
      reservation_open_rule TEXT NOT NULL DEFAULT '',
      reservation_url TEXT NOT NULL DEFAULT '',
      age_restriction TEXT NOT NULL DEFAULT '없음',
      prices TEXT NOT NULL,
      time_surcharge TEXT NOT NULL DEFAULT '',
      themes TEXT NOT NULL,
      environment TEXT NOT NULL DEFAULT '혼합',
      parking_type TEXT NOT NULL DEFAULT '확인 필요',
      parking_fee TEXT NOT NULL DEFAULT '',
      parking_support TEXT NOT NULL DEFAULT '',
      nursing_room TEXT NOT NULL DEFAULT '확인 필요',
      changing_table TEXT NOT NULL DEFAULT '확인 필요',
      official_sources TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      image_source_url TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      reasons TEXT NOT NULL,
      caution TEXT NOT NULL DEFAULT '',
      age_hint TEXT NOT NULL DEFAULT '영유아부터',
      score INTEGER NOT NULL DEFAULT 80,
      ticket_candidate INTEGER NOT NULL DEFAULT 0,
      affiliate_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      duplicate_of_id INTEGER,
      reviewer TEXT NOT NULL DEFAULT '',
      ai_researched INTEGER NOT NULL DEFAULT 0,
      last_verified_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS research_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_places_status ON places(status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_places_address_key ON places(address_key)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_places_region ON places(province, city, district)"),
  ]);
}
