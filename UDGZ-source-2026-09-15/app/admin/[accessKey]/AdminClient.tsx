"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, DAYS, THEMES, emptyPlace, type PlaceRecord } from "../../../lib/place-record";
import styles from "./admin.module.css";

type SearchLink = { label: string; url: string };

export default function AdminClient({ adminToken }: { adminToken: string }) {
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [researchCount, setResearchCount] = useState(0);
  const [placeName, setPlaceName] = useState("");
  const [tab, setTab] = useState("pending");
  const [draft, setDraft] = useState<PlaceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<SearchLink[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const request = useCallback((url: string, init: RequestInit = {}) => fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", "x-admin-key": adminToken, ...(init.headers ?? {}) },
  }), [adminToken]);

  const load = useCallback(async () => {
    try {
      const response = await request("/api/admin/places");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPlaces(data.places);
      setResearchCount(data.researchCount);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "DB를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    request("/api/admin/places").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (active) { setPlaces(data.places); setResearchCount(data.researchCount); }
    }).catch((error) => {
      if (active) setMessage(error instanceof Error ? error.message : "DB를 불러오지 못했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request]);

  const counts = useMemo(() => Object.fromEntries(["pending", "published", "duplicate"].map((status) => [status, places.filter((place) => place.status === status).length])), [places]);
  const visible = places.filter((place) => place.status === tab);

  const research = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!placeName.trim()) return;
    setResearching(true); setMessage(""); setLinks([]);
    try {
      const response = await request("/api/admin/research", { method: "POST", body: JSON.stringify({ query: placeName }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.fallback) {
        setMessage(data.reason);
        setLinks(data.links ?? []);
        setDraft(emptyPlace(placeName));
        setMissingFields([]);
      } else {
        setDraft(data.place);
        setMissingFields([]);
        setTab(data.duplicate ? "duplicate" : "pending");
        setMessage(data.duplicate ? "같은 주소의 장소가 있어 중복으로 분류했어요." : "AI 초안을 만들었어요. 반드시 출처와 내용을 확인해주세요.");
        await load();
      }
      setPlaceName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "조사 중 오류가 발생했습니다.");
    } finally {
      setResearching(false);
    }
  };

  const save = async (action: "save" | "publish") => {
    if (!draft) return;
    setSaving(true); setMessage("");
    try {
      const response = await request("/api/admin/places", { method: "POST", body: JSON.stringify({ action, place: draft }) });
      const data = await response.json();
      if (!response.ok) {
        const missing = Array.isArray(data.missing) ? data.missing as { key: string; label: string }[] : [];
        if (missing.length) {
          const keys = missing.map((item) => item.key);
          setMissingFields(keys);
          setMessage(`필수입력값을 채워주세요: ${missing.map((item) => item.label).join(", ")}`);
          requestAnimationFrame(() => {
            const target = document.getElementById(`field-${keys[0]}`);
            target?.scrollIntoView({ behavior: "smooth", block: "center" });
            const focusTarget = target?.matches("input, select, textarea") ? target : target?.querySelector("input, select, textarea");
            (focusTarget as HTMLElement | null)?.focus();
          });
          return;
        }
        throw new Error(data.error);
      }
      setTab(data.place.status);
      setMessage(data.place.status === "published" ? "정식 DB에 공개 등록했어요." : data.place.status === "duplicate" ? "동일한 전체주소를 찾아 중복으로 분류했어요." : "보류 상태로 저장했어요.");
      setDraft(null);
      setLinks([]);
      setMissingFields([]);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof PlaceRecord>(key: K, value: PlaceRecord[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setMissingFields((current) => current.filter((item) => item !== key));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- avoids a Vinext client runtime duplication in this route */}
        <a href="/" className={styles.brand}><span>🍆</span> 어디가지</a>
        <div><span className={styles.privateBadge}>SECRET LINK</span><b>장소 DB</b></div>
      </header>

      <section className={styles.shell}>
        <div className={styles.heading}>
          <div><span className={styles.eyebrow}>CURATION DESK</span><h1>좋은 장소를<br />한 곳씩 쌓아요.</h1></div>
          <div className={styles.stats}><div><b>{counts.pending ?? 0}</b><span>보류</span></div><div><b>{counts.published ?? 0}</b><span>공개</span></div><div><b>{Math.max(0, 10 - researchCount)}</b><span>AI 조사 잔여</span></div></div>
        </div>

        <section className={styles.researchCard}>
          <div><span className={styles.step}>01</span><h2>장소명부터 입력하세요</h2><p>공식 정보를 우선 검색해 검수 가능한 초안을 만들어요.</p></div>
          <form onSubmit={research}>
            <label><span className={styles.srOnly}>장소명</span><input value={placeName} onChange={(event) => setPlaceName(event.target.value)} placeholder="예: 국립과천과학관" /></label>
            <button disabled={!placeName.trim() || researching}>{researching ? "공식 정보 조사 중…" : "웹검색하고 초안 만들기"}</button>
          </form>
          <div className={styles.researchBottom}><p className={styles.researchNote}>첫 10건은 API 조사 · 이후에는 검색 링크 제공</p><button className={styles.manualButton} onClick={() => { setDraft(emptyPlace()); setMissingFields([]); setMessage("빈 초안을 열었어요."); }}>+ 직접 입력</button></div>
        </section>

        {message && <div className={styles.notice} role="status">{message}</div>}
        {links.length > 0 && <div className={styles.linkRow}>{links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>}

        <nav className={styles.tabs} aria-label="장소 상태">
          {[{ key: "pending", label: "보류" }, { key: "published", label: "공개" }, { key: "duplicate", label: "중복" }].map((item) => <button key={item.key} className={tab === item.key ? styles.active : ""} onClick={() => setTab(item.key)}>{item.label} <b>{counts[item.key] ?? 0}</b></button>)}
        </nav>

        <div className={styles.workspace}>
          <aside className={styles.queue}>
            {loading ? <p className={styles.queueState}>DB를 불러오는 중…</p> : visible.length === 0 ? <div className={styles.queueState}><b>아직 장소가 없어요</b><span>검색하거나 직접 입력해보세요.</span></div> : visible.map((place) => (
              <button key={place.id} className={draft?.id === place.id ? styles.queueActive : styles.queueItem} onClick={() => { setDraft(structuredClone(place)); setMissingFields([]); }}>
                <span>{place.aiResearched ? "AI 초안" : "직접 입력"}</span><b>{place.name}{place.branchName ? ` ${place.branchName}` : ""}</b><small>{place.fullAddress || "주소 확인 필요"}</small>
              </button>
            ))}
          </aside>

          {draft ? <PlaceEditor draft={draft} update={update} onSave={save} saving={saving} missingFields={missingFields} /> : <section className={styles.empty}><span>✦</span><h2>검수할 장소를 선택하세요</h2><p>장소명을 검색하거나 직접 입력하면 상세 편집 화면이 열려요.</p></section>}
        </div>
      </section>
    </main>
  );
}

function PlaceEditor({ draft, update, onSave, saving, missingFields }: { draft: PlaceRecord; update: <K extends keyof PlaceRecord>(key: K, value: PlaceRecord[K]) => void; onSave: (action: "save" | "publish") => void; saving: boolean; missingFields: string[] }) {
  const field = (key: keyof PlaceRecord) => ({ value: String(draft[key] ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => update(key, event.target.value as never) });
  const missing = new Set(missingFields);
  return (
    <section className={styles.editor}>
      <div className={styles.editorHeader}><div><span>02 · DOUBLE CHECK</span><h2>{draft.id ? "장소 정보 검수" : "새 장소 입력"}</h2></div><span className={`${styles.status} ${styles[draft.status ?? "pending"]}`}>{draft.status === "published" ? "공개" : draft.status === "duplicate" ? "중복" : "보류"}</span></div>

      <FormSection title="기본 정보" description="주소는 검색 결과 필터링을 위해 계층별로 저장해요.">
        <div className={styles.grid2}><Field label="장소명" required invalid={missing.has("name")}><input id="field-name" {...field("name")} /></Field><Field label="지점명"><input {...field("branchName")} placeholder="판교점" /></Field></div>
        <div className={styles.grid2}><Field label="카테고리"><select {...field("category")}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="핵심 환경"><select {...field("environment")}><option>미지정</option><option>실내</option><option>야외</option><option>혼합</option></select></Field></div>
        <Field label="전체주소" required invalid={missing.has("fullAddress")}><input id="field-fullAddress" {...field("fullAddress")} placeholder="도로명 주소 전체" /></Field>
        <div className={styles.grid3}><Field label="시/도" required invalid={missing.has("province")}><input id="field-province" {...field("province")} placeholder="경기도" /></Field><Field label="시/군/구" required invalid={missing.has("city")}><input id="field-city" {...field("city")} placeholder="수원시" /></Field><Field label="읍/면/동" required invalid={missing.has("district")}><input id="field-district" {...field("district")} placeholder="영통동" /></Field></div>
      </FormSection>

      <FormSection title="운영시간" description="공휴일과 예약 오픈 규칙은 문장 그대로 저장해요.">
        <div className={styles.hours}>{DAYS.map((day) => { const value = draft.weeklyHours[day]; return <div className={styles.hourRow} key={day}><b>{day}</b><label><input type="checkbox" checked={value.closed} onChange={(e) => update("weeklyHours", { ...draft.weeklyHours, [day]: { ...value, closed: e.target.checked } })} /> 휴무</label><input type="time" value={value.open} disabled={value.closed} onChange={(e) => update("weeklyHours", { ...draft.weeklyHours, [day]: { ...value, open: e.target.value } })} /><span>–</span><input type="time" value={value.close} disabled={value.closed} onChange={(e) => update("weeklyHours", { ...draft.weeklyHours, [day]: { ...value, close: e.target.value } })} /><input value={value.note} onChange={(e) => update("weeklyHours", { ...draft.weeklyHours, [day]: { ...value, note: e.target.value } })} placeholder="입장 마감 등" /></div>; })}</div>
        <Field label="공휴일 운영 여부"><input {...field("holidayHours")} placeholder="공휴일 정상 운영 / 설날 당일 휴무" /></Field>
        <div className={styles.grid2}><Field label="예약 필요"><select value={draft.reservationRequired ? "yes" : "no"} onChange={(e) => update("reservationRequired", e.target.value === "yes")}><option value="no">아니오</option><option value="yes">예</option></select></Field><Field label="예약 오픈 규칙"><input {...field("reservationOpenRule")} placeholder="매달 1일 오전 10시" /></Field></div>
        <Field label="예약 링크"><input type="url" {...field("reservationUrl")} placeholder="https://" /></Field>
      </FormSection>

      <FormSection title="가격과 연령" description="가격 미확인과 무료를 구분해주세요.">
        <Field label="입장 연령 제한"><input {...field("ageRestriction")} placeholder="없음 / 만 36개월 이상" /></Field>
        <div className={styles.rows}>{draft.prices.map((price, index) => <div className={styles.priceRow} key={index}><input value={price.label} onChange={(e) => update("prices", draft.prices.map((row, i) => i === index ? { ...row, label: e.target.value } : row))} placeholder="유아" /><input value={price.minAge} onChange={(e) => update("prices", draft.prices.map((row, i) => i === index ? { ...row, minAge: e.target.value } : row))} placeholder="최소 나이" /><input value={price.maxAge} onChange={(e) => update("prices", draft.prices.map((row, i) => i === index ? { ...row, maxAge: e.target.value } : row))} placeholder="최대 나이" /><input value={price.price} disabled={price.free} onChange={(e) => update("prices", draft.prices.map((row, i) => i === index ? { ...row, price: e.target.value } : row))} placeholder="정가" /><label><input type="checkbox" checked={price.free} onChange={(e) => update("prices", draft.prices.map((row, i) => i === index ? { ...row, free: e.target.checked, price: e.target.checked ? "0" : row.price } : row))} /> 무료</label><button onClick={() => update("prices", draft.prices.filter((_, i) => i !== index))} aria-label="가격 행 삭제">×</button></div>)}</div>
        <button className={styles.addRow} onClick={() => update("prices", [...draft.prices, { label: "", minAge: "", maxAge: "", price: "", free: false, note: "" }])}>+ 연령별 가격 추가</button>
        <Field label="시간별 추가요금"><textarea {...field("timeSurcharge")} placeholder="2시간 초과 시 30분당 2,000원" /></Field>
      </FormSection>

      <FormSection title="테마와 육아 편의" description="테마는 반드시 직접 판단하고 중복 선택할 수 있어요.">
        <div id="field-themes" tabIndex={-1} className={`${styles.themeGrid} ${missing.has("themes") ? styles.invalidGroup : ""}`}>{THEMES.map((theme) => <label className={draft.themes.includes(theme) ? styles.themeChecked : styles.theme} key={theme}><input type="checkbox" checked={draft.themes.includes(theme)} onChange={() => update("themes", draft.themes.includes(theme) ? draft.themes.filter((item) => item !== theme) : [...draft.themes, theme])} /><span>{theme}</span></label>)}</div>
        {missing.has("themes") && <p className={styles.inlineError}>* 테마를 하나 이상 선택해주세요.</p>}
        <div className={styles.grid3}><Field label="주차"><select {...field("parkingType")}><option>확인 필요</option><option>무료</option><option>유료</option><option>주차 불가</option></select></Field><Field label="주차 비용"><input {...field("parkingFee")} placeholder="10분당 500원" /></Field><Field label="무료주차 지원"><input {...field("parkingSupport")} placeholder="이용 시 4시간" /></Field></div>
        <div className={styles.grid2}><Field label="수유실"><select {...field("nursingRoom")}><option>확인 필요</option><option>있음</option><option>없음</option></select></Field><Field label="기저귀갈이대"><select {...field("changingTable")}><option>확인 필요</option><option>있음</option><option>없음</option></select></Field></div>
      </FormSection>

      <FormSection title="공개 카드" description="A와 B 추천 결과에 함께 사용되는 내용이에요.">
        <Field label="한줄 소개" required invalid={missing.has("summary")}><textarea id="field-summary" {...field("summary")} placeholder="이 장소가 가족에게 좋은 이유를 한 문장으로" /></Field>
        <Field label="추천 이유" required invalid={missing.has("reasons")}><textarea id="field-reasons" value={draft.reasons.join("\n")} onChange={(e) => update("reasons", e.target.value.split("\n"))} placeholder={'이유마다 줄바꿈\n예: 실내외를 함께 즐길 수 있음'} /></Field>
        <div className={styles.grid3}><Field label="추천 점수"><input type="number" min="0" max="100" value={draft.score} onChange={(e) => update("score", Number(e.target.value))} /></Field><Field label="연령 힌트"><input {...field("ageHint")} /></Field><Field label="주의사항"><input {...field("caution")} /></Field></div>
        <label className={styles.inlineCheck}><input type="checkbox" checked={draft.ticketCandidate} onChange={(e) => update("ticketCandidate", e.target.checked)} /> 티켓·제휴 연결 후보</label>
        <Field label="제휴 링크"><input type="url" {...field("affiliateUrl")} placeholder="https://" /></Field>
      </FormSection>

      <FormSection title="출처와 검수" description="공식 출처가 최소 한 개 있어야 공개할 수 있어요.">
        <div id="field-officialSources" tabIndex={-1} className={`${styles.rows} ${missing.has("officialSources") ? styles.invalidGroup : ""}`}>{draft.officialSources.map((source, index) => <div className={styles.sourceRow} key={index}><input value={source.label} onChange={(e) => update("officialSources", draft.officialSources.map((row, i) => i === index ? { ...row, label: e.target.value } : row))} placeholder="공식 홈페이지" /><input type="url" value={source.url} onChange={(e) => update("officialSources", draft.officialSources.map((row, i) => i === index ? { ...row, url: e.target.value } : row))} placeholder="https://" /><a href={source.url || "#"} target="_blank" rel="noreferrer">열기 ↗</a><button onClick={() => update("officialSources", draft.officialSources.filter((_, i) => i !== index))} aria-label="출처 삭제">×</button></div>)}</div>
        {missing.has("officialSources") && <p className={styles.inlineError}>* 공식 출처 URL을 하나 이상 입력해주세요.</p>}
        <button className={styles.addRow} onClick={() => update("officialSources", [...draft.officialSources, { label: "", url: "" }])}>+ 출처 추가</button>
        <div className={styles.grid2}><Field label="대표 이미지 URL"><input type="url" {...field("imageUrl")} /></Field><Field label="이미지 출처 URL"><input type="url" {...field("imageSourceUrl")} /></Field></div>
        <div className={styles.grid2}><Field label="마지막 확인일" required invalid={missing.has("lastVerifiedAt")}><input id="field-lastVerifiedAt" type="date" {...field("lastVerifiedAt")} /></Field><Field label="검수자 이름" required invalid={missing.has("reviewer")}><input id="field-reviewer" {...field("reviewer")} placeholder="션디" /></Field></div>
      </FormSection>

      <div className={styles.actionBar}>{missingFields.length > 0 && <p className={styles.validationText}>필수입력값을 채워주세요.</p>}<button className={styles.saveButton} disabled={saving} onClick={() => onSave("save")}>보류로 저장</button><button className={styles.publishButton} disabled={saving || draft.status === "duplicate"} onClick={() => onSave("publish")}>{saving ? "저장 중…" : "검수 완료 · 정식 DB에 추가"}</button></div>
    </section>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className={styles.formSection}><div className={styles.sectionTitle}><h3>{title}</h3><p>{description}</p></div><div className={styles.sectionBody}>{children}</div></section>;
}

function Field({ label, children, required = false, invalid = false }: { label: string; children: React.ReactNode; required?: boolean; invalid?: boolean }) {
  return <label className={`${styles.field} ${invalid ? styles.fieldInvalid : ""}`}><span>{label}{required && <em className={invalid ? styles.requiredError : styles.required}>*</em>}</span>{children}</label>;
}
