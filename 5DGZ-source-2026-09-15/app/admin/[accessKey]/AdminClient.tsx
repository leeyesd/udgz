"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, DAYS, emptyPlace, type PlaceRecord } from "../../../lib/place-record";
import { TAG_FIELDS, TAG_LABELS } from "../../../lib/place-tags";
import { normalizeLinks } from "../../../lib/place-links";
import { normalizePrice } from "../../../lib/place-pricing";
import styles from "./admin.module.css";

type SearchLink = { label: string; url: string };

export default function AdminClient({ adminToken }: { adminToken: string }) {
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [researchCount, setResearchCount] = useState(0);
  const [collectionText, setCollectionText] = useState("");
  const [collectionBusy, setCollectionBusy] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [tab, setTab] = useState("hold");
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
      const data = await response.json() as { error?: string; places: PlaceRecord[]; researchCount: number };
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
    request("/api/admin/upgrade-format", { method: "POST" }).then(async response => {
      const result = await response.json() as { error?: string; changed: number };
      if (!response.ok) throw new Error(result.error);
      if (active && result.changed) setMessage(`기존 ${result.changed}곳을 새 입력 구조로 전환했어요.`);
      return request("/api/admin/places");
    }).then(async (response) => {
      const data = await response.json() as { error?: string; places: PlaceRecord[]; researchCount: number };
      if (!response.ok) throw new Error(data.error);
      if (active) { setPlaces(data.places); setResearchCount(data.researchCount); }
    }).catch((error) => {
      if (active) setMessage(error instanceof Error ? error.message : "DB를 불러오지 못했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request]);

  const counts = useMemo(() => Object.fromEntries(["hold", "incomplete", "review_required", "duplicate"].map((status) => [status, places.filter((place) => (status === "duplicate" ? place.status === "duplicate" : place.status !== "duplicate" && place.researchStatus === status)).length])), [places]);
  const visible = places.filter((place) => (tab === "duplicate" ? place.status === "duplicate" : place.status !== "duplicate" && place.researchStatus === tab));

  const research = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!placeName.trim()) return;
    setResearching(true); setMessage(""); setLinks([]);
    try {
      const response = await request("/api/admin/research", { method: "POST", body: JSON.stringify({ query: placeName }) });
      const data = await response.json() as { error?: string; fallback?: boolean; reason: string; links?: SearchLink[]; place: PlaceRecord; duplicate?: boolean };
      if (!response.ok) throw new Error(data.error);
      if (data.fallback) {
        setMessage(data.reason);
        setLinks(data.links ?? []);
        setDraft(emptyPlace(placeName));
        setMissingFields([]);
      } else {
        setDraft(data.place);
        setMissingFields([]);
        setTab(data.duplicate ? "duplicate" : "hold");
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

  const save = async (action: "save" | "approve" | "reject") => {
    if (!draft) return;
    setSaving(true); setMessage("");
    try {
      const response = await request("/api/admin/places", { method: "POST", body: JSON.stringify({ action, place: draft }) });
      const data = await response.json() as { error?: string; missing?: { key: string; label: string }[]; place: PlaceRecord };
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
      setTab(data.place.status === "duplicate" ? "duplicate" : (data.place.researchStatus ?? "hold"));
      setMessage(data.place.isPublic ? "정식 DB에 공개 등록했어요." : data.place.status === "duplicate" ? "동일한 전체주소를 찾아 중복으로 분류했어요." : "현재 조사 상태로 저장했어요.");
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

  const importCollection = async () => {
    setCollectionBusy(true); setMessage("");
    try {
      const candidates = JSON.parse(collectionText);
      const response = await request("/api/admin/collection", { method: "POST", body: JSON.stringify({ candidates }) });
      const data = await response.json() as { error?: string; results: { name: string; result: string; error?: string }[] };
      if (!response.ok) throw new Error(data.error);
      setMessage(data.results.map((r: { name: string; result: string; error?: string }) => `${r.name}: ${r.result === "created" ? "등록 완료" : r.result === "duplicate_skipped" ? "기존 장소 유지" : r.error}`).join(" / "));
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "수집 자료를 확인해주세요."); }
    finally { setCollectionBusy(false); }
  };

  const update = <K extends keyof PlaceRecord>(key: K, value: PlaceRecord[K]) => {
    setDraft((current) => current && current.id === draft?.id ? (() => { const next = { ...current, [key]: value }; return key === "name" || key === "reservationRequired" ? { ...next, ...normalizeLinks(next) } : next; })() : current);
    setMissingFields((current) => current.filter((item) => item !== key));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- avoids a Vinext client runtime duplication in this route */}
        <a href="/" className={styles.brand}><span>🍆</span> 오디가지</a>
        <div><span className={styles.privateBadge}>SECRET LINK</span><b>장소 DB</b></div>
      </header>

      <section className={styles.shell}>
        <div className={styles.heading}>
          <div><span className={styles.eyebrow}>CURATION DESK</span><h1>좋은 장소를<br />한 곳씩 쌓아요.</h1></div>
          <div className={styles.stats}><div><b>{counts.hold ?? 0}</b><span>보류</span></div><div><b>{places.filter((place) => place.isPublic).length}</b><span>공개</span></div><div><b>{Math.max(0, 10 - researchCount)}</b><span>AI 조사 잔여</span></div></div>
        </div>

        <section className={styles.researchCard}>
          <div><span className={styles.step}>01</span><h2>장소명부터 입력하세요</h2><p>공식 정보를 우선 검색해 검수 가능한 초안을 만들어요.</p></div>
          <form onSubmit={research}>
            <label><span className={styles.srOnly}>장소명</span><input value={placeName} onChange={(event) => setPlaceName(event.target.value)} placeholder="예: 국립과천과학관" /></label>
            <button disabled={!placeName.trim() || researching}>{researching ? "공식 정보 조사 중…" : "웹검색하고 초안 만들기"}</button>
          </form>
          <div className={styles.researchBottom}><p className={styles.researchNote}>첫 10건은 API 조사 · 이후에는 검색 링크 제공</p><button className={styles.manualButton} onClick={() => { setDraft(emptyPlace()); setMissingFields([]); setMessage("빈 초안을 열었어요."); }}>+ 직접 입력</button></div>
        </section>

        <details className={styles.researchCard}><summary>직원 수집 자료 등록</summary><p>확인한 후보를 등록합니다. 기존 장소는 덮어쓰지 않으며 새 장소는 검토 대기로 시작합니다.</p><label>수집 자료 파일<input type="file" accept=".json,application/json" aria-label="수집 자료 파일" onChange={async e => { const file = e.target.files?.[0]; if (file) setCollectionText(await file.text()); }} /></label><label>수집 자료<textarea aria-label="직원 수집 자료" rows={6} value={collectionText} onChange={e => setCollectionText(e.target.value)} /></label><button disabled={collectionBusy || !collectionText.trim()} onClick={importCollection}>{collectionBusy ? "등록 중…" : "수집 후보 등록"}</button></details>
        {message && <div className={styles.notice} role="status">{message}</div>}
        {links.length > 0 && <div className={styles.linkRow}>{links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>}

        <nav className={styles.tabs} aria-label="장소 상태">
          {[{ key: "hold", label: "보류" }, { key: "incomplete", label: "정보 미완료" }, { key: "review_required", label: "검토 대상" }, ...(counts.duplicate ? [{ key: "duplicate", label: "중복" }] : [])].map((item) => <button key={item.key} className={tab === item.key ? styles.active : ""} onClick={() => setTab(item.key)}>{item.label} <b>{counts[item.key] ?? 0}</b></button>)}
        </nav>

        <div className={styles.workspace}>
          <aside className={styles.queue}>
            {loading ? <p className={styles.queueState}>DB를 불러오는 중…</p> : visible.length === 0 ? <div className={styles.queueState}><b>아직 장소가 없어요</b><span>검색하거나 직접 입력해보세요.</span></div> : visible.map((place) => (
              <button key={place.id} className={draft?.id === place.id ? styles.queueActive : styles.queueItem} onClick={() => { setDraft({ ...structuredClone(place), prices: place.prices.map(normalizePrice) }); setMissingFields([]); }}>
                <span>{place.reviewStatus === "approved" ? "승인" : place.reviewStatus === "rejected" ? "거절" : "검토 대기"} · {place.isPublic ? "공개" : "비공개"}</span><b>{place.name}{place.branchName ? ` ${place.branchName}` : ""}</b><small>{place.fullAddress || "찾는중.."}</small>
              </button>
            ))}
          </aside>

          {draft ? <PlaceEditor key={draft.id ?? "new"} draft={draft} update={update} onSave={save} saving={saving} adminToken={adminToken} missingFields={missingFields} /> : <section className={styles.empty}><span>✦</span><h2>검수할 장소를 선택하세요</h2><p>장소명을 검색하거나 직접 입력하면 상세 편집 화면이 열려요.</p></section>}
        </div>
      </section>
    </main>
  );
}

function PlaceEditor({ draft, update, onSave, saving, missingFields, adminToken }: { draft: PlaceRecord; update: <K extends keyof PlaceRecord>(key: K, value: PlaceRecord[K]) => void; onSave: (action: "save" | "approve" | "reject") => void; saving: boolean; missingFields: string[]; adminToken: string }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true); setUploadError("");
    try {
      const response = await fetch("/api/admin/images", { method: "POST", headers: { "x-admin-key": adminToken, "Content-Type": file.type }, body: file });
      const data = await response.json() as { error?: string; url: string };
      if (!response.ok) throw new Error(data.error);
      update("imageUrl", data.url);
    } catch (error) { setUploadError(error instanceof Error ? error.message : "업로드하지 못했습니다."); }
    finally { setUploading(false); }
  };
  const field = (key: keyof PlaceRecord) => ({ value: String(draft[key] ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => update(key, event.target.value as never) });
  const missing = new Set(missingFields);
  return (
    <section className={styles.editor}>
      <div className={styles.editorHeader}><div><span>02 · DOUBLE CHECK</span><h2>{draft.id ? "장소 정보 검수" : "새 장소 입력"}</h2></div><span className={`${styles.status} ${styles[draft.status ?? "pending"]}`}>{draft.status === "published" ? "공개" : draft.status === "duplicate" ? "중복" : "보류"}</span></div>

      <FormSection title="조사 및 검토 상태" description="보류는 비공개, 정보 미완료는 승인 후 공개, 검토 대상은 승인 전에도 공개됩니다. 거절하면 보류로 돌아갑니다.">
        <Field label="조사 상태"><select value={draft.researchStatus ?? "hold"} onChange={(e) => update("researchStatus", e.target.value as PlaceRecord["researchStatus"])}><option value="hold">보류</option><option value="incomplete">정보 미완료</option><option value="review_required">검토 대상</option></select></Field>
        <p>검토: {draft.reviewStatus === "approved" ? "승인" : draft.reviewStatus === "rejected" ? "거절" : "대기"}</p>
      </FormSection>

      <FormSection title="기본 정보" description="주소는 검색 결과 필터링을 위해 계층별로 저장해요.">
        <Field label="장소명" required invalid={missing.has("name")}><input id="field-name" {...field("name")} placeholder="지점명이 있으면 함께 입력" /></Field>
        <div className={styles.grid2}><Field label="카테고리"><select {...field("category")}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="핵심 환경"><select {...field("environment")}><option>미지정</option><option>실내</option><option>야외</option><option>혼합</option></select></Field></div>
        <Field label="전체주소" required invalid={missing.has("fullAddress")}><input id="field-fullAddress" {...field("fullAddress")} placeholder="도로명 주소 전체" /></Field>
        <div className={styles.grid3}><Field label="시/도" required invalid={missing.has("province")}><input id="field-province" {...field("province")} placeholder="경기도" /></Field><Field label="시/군/구" required invalid={missing.has("city")}><input id="field-city" {...field("city")} placeholder="수원시" /></Field></div>
        <div className={styles.grid2}><Field label="예약 필요"><select value={draft.reservationRequired == null ? "unknown" : draft.reservationRequired ? "yes" : "no"} onChange={(e) => update("reservationRequired", e.target.value === "unknown" ? null : e.target.value === "yes")}><option value="unknown">찾는중..</option><option value="no">아니오</option><option value="yes">예</option></select></Field><Field label="예약 오픈 규칙"><input {...field("reservationOpenRule")} placeholder="매달 1일 오전 10시" /></Field></div>
        <Field label="예약 링크"><input type="url" {...field("reservationUrl")} readOnly={draft.reservationRequired === false} placeholder="https://" /></Field>
        {draft.reservationRequired === false && <p>예약이 필요 없으면 장소명 + 아이랑 검색 링크를 자동 입력합니다.</p>}
        <Field label="제휴 링크"><input type="url" {...field("affiliateUrl")} placeholder="직접 입력 · 입력하면 예약 링크보다 우선 표시" /></Field>
        <Field label="SNS 링크"><input type="url" {...field("snsUrl")} placeholder="SNS 후기 링크 · 비우면 네이버 블로그 검색" /></Field>
      </FormSection>

      <FormSection title="운영시간" description="요일별 운영시간과 공휴일 운영 정보를 저장해요.">
        <div className={styles.hours}>{DAYS.map((day) => { const value = draft.weeklyHours[day]; return <div className={styles.hourRow} key={day}><b>{day}</b><label><input type="checkbox" checked={value.closed} onChange={(e) => update("weeklyHours", { ...draft.weeklyHours, [day]: { ...value, closed: e.target.checked } })} /> 휴무</label><input type="time" value={value.open} disabled={value.closed} onChange={(e) => update("weeklyHours", { ...draft.weeklyHours, [day]: { ...value, open: e.target.value } })} /><span>–</span><input type="time" value={value.close} disabled={value.closed} onChange={(e) => update("weeklyHours", { ...draft.weeklyHours, [day]: { ...value, close: e.target.value } })} /><input value={value.note} onChange={(e) => update("weeklyHours", { ...draft.weeklyHours, [day]: { ...value, note: e.target.value } })} placeholder="입장 마감 등" /></div>; })}</div>
        <Field label="공휴일 운영 여부"><input {...field("holidayHours")} placeholder="공휴일 정상 운영 / 설날 당일 휴무" /></Field>

      </FormSection>

      <FormSection title="가격" description="가격 미확인과 무료를 구분해주세요.">
        <Field label="입장 연령 제한"><input {...field("ageRestriction")} placeholder="없음 / 만 36개월 이상" /></Field>
        <div className={styles.rows}>{draft.prices.map((rawPrice, index) => {
          const price = normalizePrice(rawPrice);
          const change = (key: string, value: string) => update("prices", draft.prices.map((row, i) => i === index ? { ...normalizePrice(row), [key]: value } : row));
          return <div className={styles.priceBlock} key={index}>
            <div className={styles.grid3}><Field label="연령/대상"><input value={price.label} onChange={e => change("label", e.target.value)} /></Field><Field label="최소 나이"><input value={price.minAge} onChange={e => change("minAge", e.target.value)} /></Field><Field label="최대 나이"><input value={price.maxAge} onChange={e => change("maxAge", e.target.value)} /></Field></div>
            <div className={styles.grid2}><Field label="평일 가격"><input value={price.weekdayPrice} onChange={e => change("weekdayPrice", e.target.value)} placeholder="무료는 0, 미확인은 빈칸" /></Field><Field label="주말 가격"><input value={price.weekendPrice} onChange={e => change("weekendPrice", e.target.value)} placeholder="토·일 요금" /></Field></div>
            {price.price && !price.weekdayPrice && !price.weekendPrice && <p>기존 공통요금: {price.price}</p>}
            <Field label="요금 참고사항"><input value={price.note} onChange={e => change("note", e.target.value)} placeholder="공휴일·할인·적용 기간 등" /></Field>
            <button type="button" onClick={() => update("prices", draft.prices.filter((_, i) => i !== index))}>가격 행 삭제</button>
          </div>;
        })}</div>
        <button className={styles.addRow} onClick={() => update("prices", [...draft.prices, { label: "", minAge: "", maxAge: "", price: "", free: false, note: "", weekdayPrice: "", weekendPrice: "" }])}>+ 연령별 가격 추가</button>
        <Field label="시간별 추가요금"><textarea {...field("timeSurcharge")} placeholder="2시간 초과 시 30분당 2,000원" /></Field>
        <div className={styles.grid3}><Field label="주차"><select {...field("parkingType")}><option>확인 필요</option><option>무료</option><option>유료</option><option>주차 불가</option></select></Field><Field label="주차 비용"><input {...field("parkingFee")} placeholder="10분당 500원" /></Field><Field label="무료주차 지원"><input {...field("parkingSupport")} placeholder="이용 시 4시간" /></Field></div>
      </FormSection>

      <FormSection title="테마" description="장소 태그를 0~5점으로 평가하고 육아 편의를 기록해요.">
        {TAG_FIELDS.map(key => <div key={key}><Field label={TAG_LABELS[key]}><input type="number" min="0" max="5" step="1" value={draft[key] ?? ""} onChange={e => update(key, e.target.value === "" ? null : Number(e.target.value))} /></Field><Field label={`${TAG_LABELS[key]} 평가 근거`}><input value={draft.tagEvidence?.[key] ?? ""} onChange={e => update("tagEvidence", { ...draft.tagEvidence, [key]: e.target.value })} /></Field></div>)}
        <div className={styles.grid2}><Field label="수유실"><select {...field("nursingRoom")}><option>확인 필요</option><option>있음</option><option>없음</option></select></Field><Field label="기저귀갈이대"><select {...field("changingTable")}><option>확인 필요</option><option>있음</option><option>없음</option></select></Field></div>
      </FormSection>

      <FormSection title="파생 체험 공간" description="독립된 이름과 이용 방식이 있는 체험 공간만 상위 장소를 연결하세요. 일반 장소는 비워둡니다.">
        <Field label="상위 장소 ID"><input type="number" min="1" value={draft.parentPlaceId ?? ""} onChange={e => update("parentPlaceId", e.target.value ? Number(e.target.value) : null)} /></Field>
      </FormSection>

      <FormSection title="공개 카드" description="A와 B 추천 결과에 함께 사용되는 내용이에요.">
        <Field label="한줄 소개" required invalid={missing.has("summary")}><textarea id="field-summary" {...field("summary")} placeholder="이 장소가 가족에게 좋은 이유를 한 문장으로" /></Field>
        <div className={styles.grid2}><Field label="연령 힌트"><input {...field("ageHint")} /></Field><Field label="주의사항"><textarea {...field("caution")} /></Field></div>
      </FormSection>

      <FormSection title="출처와 검수" description="확인한 출처와 검수 기록을 남겨주세요.">
        <div id="field-officialSources" tabIndex={-1} className={`${styles.rows} ${missing.has("officialSources") ? styles.invalidGroup : ""}`}>{draft.officialSources.map((source, index) => <div className={styles.sourceRow} key={index}><input value={source.label} onChange={(e) => update("officialSources", draft.officialSources.map((row, i) => i === index ? { ...row, label: e.target.value } : row))} placeholder="공식 홈페이지" /><input type="url" value={source.url} onChange={(e) => update("officialSources", draft.officialSources.map((row, i) => i === index ? { ...row, url: e.target.value } : row))} placeholder="https://" /><a href={source.url || "#"} target="_blank" rel="noreferrer">열기 ↗</a><button onClick={() => update("officialSources", draft.officialSources.filter((_, i) => i !== index))} aria-label="출처 삭제">×</button></div>)}</div>
        {missing.has("officialSources") && <p className={styles.inlineError}>* 공식 출처 URL을 하나 이상 입력해주세요.</p>}
        <button className={styles.addRow} onClick={() => update("officialSources", [...draft.officialSources, { label: "", url: "" }])}>+ 출처 추가</button>
        <div className={styles.grid2}><Field label="대표 이미지 업로드"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => uploadImage(e.target.files?.[0])} /></Field><Field label="이미지 출처 URL"><input type="url" {...field("imageSourceUrl")} /></Field></div>
        {uploading && <p role="status">이미지 업로드 중…</p>}{uploadError && <p role="alert">{uploadError}</p>}{draft.imageUrl && <img className={styles.imagePreview} src={draft.imageUrl} alt="대표 이미지 미리보기" />}
        <div className={styles.grid2}><Field label="마지막 확인일" required invalid={missing.has("lastVerifiedAt")}><input id="field-lastVerifiedAt" type="date" {...field("lastVerifiedAt")} /></Field></div>
      </FormSection>

      <div className={styles.actionBar}>{missingFields.length > 0 && <p className={styles.validationText}>필수입력값을 채워주세요.</p>}<button className={styles.saveButton} disabled={saving || uploading} onClick={() => onSave("save")}>저장</button><button className={styles.publishButton} disabled={saving || uploading || draft.status === "duplicate"} onClick={() => onSave("approve")}>{saving ? "저장 중…" : "승인"}</button><button className={styles.saveButton} disabled={saving || uploading} onClick={() => onSave("reject")}>거절 · 보류로 이동</button></div>
    </section>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className={styles.formSection}><div className={styles.sectionTitle}><h3>{title}</h3><p>{description}</p></div><div className={styles.sectionBody}>{children}</div></section>;
}

function Field({ label, children, required = false, invalid = false }: { label: string; children: React.ReactNode; required?: boolean; invalid?: boolean }) {
  return <label className={`${styles.field} ${invalid ? styles.fieldInvalid : ""}`}><span>{label}{required && <em className={invalid ? styles.requiredError : styles.required}>*</em>}</span>{children}</label>;
}
