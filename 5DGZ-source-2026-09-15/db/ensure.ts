import { runtimeEnv } from "../lib/admin-access";

// Tables are created by deployment migrations, never by a visitor request.
export async function ensureDatabase() {
  if (!runtimeEnv().DB) throw new Error("장소 DB가 아직 연결되지 않았습니다.");
}
