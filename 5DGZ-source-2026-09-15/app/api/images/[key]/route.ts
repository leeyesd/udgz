import { runtimeEnv } from "../../../../lib/admin-access";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(key)) return new Response("Not found", { status: 404 });
  try {
    const image = await runtimeEnv().PLACE_IMAGES?.get(key);
    if (!image) return new Response("Not found", { status: 404 });
    return new Response(image.body, { headers: { "Content-Type": image.httpMetadata?.contentType ?? "application/octet-stream", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Image unavailable", { status: 503 }); }
}
