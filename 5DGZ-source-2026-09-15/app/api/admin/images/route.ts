import { isAdminRequest, runtimeEnv, unauthorized } from "../../../../lib/admin-access";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const bucket = runtimeEnv().PLACE_IMAGES;
  if (!bucket) return Response.json({ error: "이미지 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
  const limit = 5 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > limit) return Response.json({ error: "5MB 이하 이미지를 선택해주세요." }, { status: 413 });
  try {
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "이미지를 선택해주세요." }, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); return Response.json({ error: "5MB 이하 이미지를 선택해주세요." }, { status: 413 }); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const png = [137,80,78,71,13,10,26,10].every((b, i) => bytes[i] === b);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
    const type = png ? "image/png" : jpeg ? "image/jpeg" : webp ? "image/webp" : null;
    if (!type) return Response.json({ error: "JPG, PNG, WebP 이미지만 업로드할 수 있습니다." }, { status: 400 });
    const key = `${crypto.randomUUID()}.${png ? "png" : jpeg ? "jpg" : "webp"}`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: type } });
    return Response.json({ url: `/api/images/${key}` });
  } catch (error) {
    console.error("Image upload failed", error);
    return Response.json({ error: "이미지 업로드에 실패했습니다. 다시 시도해주세요." }, { status: 503 });
  }
}
