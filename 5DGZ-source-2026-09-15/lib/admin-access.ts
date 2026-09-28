import { env } from "cloudflare:workers";

type RuntimeEnv = { ADMIN_ACCESS_KEY?: string; OPENAI_API_KEY?: string; DB?: D1Database };

export function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export function isAdminRequest(request: Request) {
  const key = request.headers.get("x-admin-key") ?? new URL(request.url).searchParams.get("access_key");
  const configured = runtimeEnv().ADMIN_ACCESS_KEY;
  return Boolean(configured && key && key === configured);
}

export function unauthorized() {
  return Response.json({ error: "접근할 수 없는 어드민 링크입니다." }, { status: 404 });
}
