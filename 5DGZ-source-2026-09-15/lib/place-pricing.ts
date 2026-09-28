import type { PriceRow } from "./place-record";

export function normalizePrice(row: PriceRow): PriceRow {
  if (row.weekdayPrice !== undefined && row.weekendPrice !== undefined) return row;
  const weekday = row.price.match(/평일\s*([\d,]+)\s*원/);
  const weekend = row.price.match(/주말(?:·공휴일)?\s*([\d,]+)\s*원/);
  return { ...row,
    weekdayPrice: row.weekdayPrice ?? (row.free ? "0" : weekday?.[1]?.replaceAll(",", "") ?? ""),
    weekendPrice: row.weekendPrice ?? (row.free ? "0" : weekend?.[1]?.replaceAll(",", "") ?? ""),
  };
}

export function isWeekend(date: string): boolean | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const value = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== date) return null;
  return [0, 6].includes(value.getUTCDay());
}

export function priceForDate(input: PriceRow, date: string): string {
  const row = normalizePrice(input);
  const weekend = isWeekend(date);
  const money = (value: string) => value === "0" ? "무료" : /^\d+$/.test(value) ? `${Number(value).toLocaleString("ko-KR")}원` : value;
  if (weekend === null) return `평일 ${money(row.weekdayPrice || "찾는중..")} / 주말 ${money(row.weekendPrice || "찾는중..")}`;
  const value = weekend ? row.weekendPrice : row.weekdayPrice;
  if (value) return money(value);
  return row.price && !/평일|주말/.test(row.price) ? `${money(row.price)} (기존 공통요금·요일별 확인 중)` : "찾는중..";
}

export function mergedPlaceName(name: string, branch: string) {
  const clean = name.trim(), suffix = branch.trim();
  return !suffix || clean.replace(/\s/g, "").endsWith(suffix.replace(/\s/g, "")) ? clean : `${clean} ${suffix}`;
}
