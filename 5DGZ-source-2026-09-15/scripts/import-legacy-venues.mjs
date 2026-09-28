import fs from "node:fs";

const sourcePath = process.argv[2];
const siteUrl = process.argv[3];
const startAt = Number(process.argv[4] ?? 0);
if (!sourcePath || !siteUrl) throw new Error("JSON 경로와 사이트 URL이 필요합니다.");

const vars = fs.readFileSync(".dev.vars", "utf8");
const adminKey = vars.match(/^ADMIN_ACCESS_KEY=(.+)$/m)?.[1]?.trim();
if (!adminKey) throw new Error("ADMIN_ACCESS_KEY를 찾지 못했습니다.");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const days = ["월", "화", "수", "목", "금", "토", "일"];
const genericParkName = /(근린공원|어린이공원|소공원|쌈지공원|마을공원|체육공원|수변공원|완충녹지|경관녹지|연결녹지)/;

function parseJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function addressKey(value) {
  return value.normalize("NFKC").toLowerCase().replace(/[()[\],.·-]/g, " ").replace(/\s+/g, "").trim();
}

function addressParts(value) {
  const tokens = value.trim().split(/\s+/);
  const province = tokens[0] ?? "";
  const city = tokens.slice(1).find((token) => /(?:시|군|구)$/.test(token)) ?? "";
  const cityIndex = tokens.indexOf(city);
  const district = tokens.slice(cityIndex + 1).find((token) => /(?:읍|면|동)$/.test(token)) ?? "";
  return { province, city, district };
}

function weeklyHours(row) {
  const openDays = parseJson(row.open_days, []);
  const hasDayData = Array.isArray(openDays) && openDays.length > 0;
  const match = String(row.hours ?? "").match(/(\d{1,2}:\d{2})\s*[~–-]\s*(\d{1,2}:\d{2})/);
  const note = [row.hours, row.open_note].filter(Boolean).join(" · ") || "확인 필요";
  return Object.fromEntries(days.map((day, index) => [day, {
    closed: hasDayData ? !openDays.includes(index) : false,
    open: match?.[1] ?? "10:00", close: match?.[2] ?? "18:00", note,
  }]));
}

function prices(row) {
  const fee = String(row.fee ?? "").trim();
  const result = fee
    ? [{ label: "원본 요금", minAge: "", maxAge: "", price: /무료/.test(fee) ? "0" : fee, free: /무료/.test(fee), note: "기존 DB 표기" }]
    : [{ label: "전체", minAge: "", maxAge: "", price: "", free: false, note: "확인 필요" }];
  const months = Number(row.free_age_months);
  if (Number.isFinite(months) && months > 0 && months < 999) {
    result.push({ label: `${months}개월 미만`, minAge: "0개월", maxAge: `${months - 1}개월`, price: "0", free: true, note: "기존 DB 표기" });
  }
  return result;
}

function transform(row, seen) {
  const fullAddress = String(row.area ?? "").trim();
  const key = addressKey(fullAddress);
  const duplicate = seen.has(key);
  seen.add(key);
  const reserve = parseJson(row.reserve, {});
  const min = Number(row.ages_min);
  const max = Number(row.ages_max);
  const ageHint = Number.isFinite(min) && Number.isFinite(max) ? `만 ${min}~${max}세 추천` : "확인 필요";
  return {
    name: String(row.name ?? "").trim(), branchName: "", category: "미지정", fullAddress,
    addressKey: key, ...addressParts(fullAddress), weeklyHours: weeklyHours(row), holidayHours: "확인 필요",
    reservationRequired: Boolean(reserve.need), reservationOpenRule: String(reserve.note ?? ""), reservationUrl: "",
    ageRestriction: "확인 필요", prices: prices(row), timeSurcharge: "", themes: [], environment: "미지정",
    parkingType: row.parking ? "주차 가능(요금 확인)" : "주차 불가", parkingFee: "", parkingSupport: "",
    nursingRoom: row.nursing ? "있음" : "없음", changingTable: "확인 필요",
    officialSources: row.link ? [{ label: "기존 DB 링크", url: String(row.link) }] : [], imageUrl: "", imageSourceUrl: "",
    summary: "", reasons: [], caution: String(row.tip ?? ""), ageHint, score: 80,
    ticketCandidate: Boolean(row.aff), affiliateUrl: "", status: duplicate ? "duplicate" : "pending",
    reviewer: "", aiResearched: false, lastVerifiedAt: "",
  };
}

async function cleanBatch(batch) {
  const response = await fetch(`${siteUrl}/api/admin/import`, {
    method: "DELETE", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ places: batch }),
  });
  if (!response.ok) throw new Error(`기존 공원 정리 실패 (${await response.text()})`);
}

const alreadyImportedGenericParks = source.slice(0, startAt).filter((row) => genericParkName.test(String(row.name ?? ""))).map((row) => ({
  name: String(row.name ?? "").trim(), addressKey: addressKey(String(row.area ?? "").trim()),
}));
for (let index = 0; index < alreadyImportedGenericParks.length; index += 40) {
  await cleanBatch(alreadyImportedGenericParks.slice(index, index + 40));
}
if (alreadyImportedGenericParks.length) console.log(`공원 ${alreadyImportedGenericParks.length}건 정리`);

const currentResponse = await fetch(`${siteUrl}/api/admin/places`, { headers: { "x-admin-key": adminKey } });
if (!currentResponse.ok) throw new Error("기존 DB를 확인하지 못했습니다.");
const current = await currentResponse.json();
const seen = new Set((current.places ?? []).map((place) => place.addressKey).filter(Boolean));
const records = [];
for (const [sourceIndex, row] of source.entries()) {
  if (genericParkName.test(String(row.name ?? ""))) continue;
  const record = transform(row, seen);
  if (sourceIndex >= startAt) records.push(record);
}

async function sendBatch(index) {
  const batch = records.slice(index, index + 40);
  const response = await fetch(`${siteUrl}/api/admin/import`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ places: batch }),
  });
  if (!response.ok) throw new Error(`가져오기 실패: ${index + 1}번째부터 (${await response.text()})`);
}

for (let index = 0; index < records.length; index += 240) {
  const starts = Array.from({ length: 6 }, (_, offset) => index + offset * 40).filter((value) => value < records.length);
  await Promise.all(starts.map(sendBatch));
  console.log(`${Math.min(index + 240, records.length)}/${records.length}`);
}
