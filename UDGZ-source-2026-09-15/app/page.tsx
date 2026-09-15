"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Mood, places } from "../lib/places";
import { loadPlaces } from "../lib/live-places";

const moods: { value: Mood; description: string; icon: string }[] = [
  { value: "실내", description: "날씨 걱정 없이 편안하게", icon: "⌂" },
  { value: "야외", description: "마음껏 움직이고 뛰어놀기", icon: "☀" },
  { value: "특별한 체험", description: "오늘만의 기억을 남기기", icon: "✦" },
  { value: "감성적 휴식", description: "부모도 기분 좋게 쉬어가기", icon: "♧" },
];

const categoryIcons = { 문화: "◫", 체험: "✦", 카페: "☕", 자연: "♧", 테마파크: "★", 식당: "◇", 공공: "▣" };

type EventData = Record<string, string | number | boolean>;

function trackEvent(event: string, data: EventData = {}) {
  if (typeof window === "undefined") return;
  const target = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  target.dataLayer = target.dataLayer || [];
  target.dataLayer.push({ event, ...data });
}

function CreatorFooter() {
  return (
    <footer className="site-footer">
      <p>made by 육아하는 디자이너, 션디네집</p>
      <p><a href="https://www.instagram.com/seandy.zip" target="_blank" rel="noreferrer">션디네집 인스타그램</a> DM으로 숨겨진 명소 / 서비스 오류 제보 환영해요.</p>
    </footer>
  );
}

export default function Home() {
  const [location, setLocation] = useState("");
  const [selectedAges, setSelectedAges] = useState([2]);
  const [mood, setMood] = useState<Mood>("실내");
  const [travelTime, setTravelTime] = useState("30분 이내");
  const [showResults, setShowResults] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState("");
  const [availablePlaces, setAvailablePlaces] = useState(places);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);

  const recommendations = useMemo(() => {
    return [...availablePlaces].sort((a, b) => {
      const aFit = a.score + (a.moods.includes(mood) ? 18 : 0);
      const bFit = b.score + (b.moods.includes(mood) ? 18 : 0);
      return bFit - aFit;
    });
  }, [mood, availablePlaces]);

  const getRecommendations = async () => {
    trackEvent("recommendation_complete", {
      mood,
      selected_ages: selectedAges.join(","),
      travel_time: travelTime,
      elapsed_seconds: Math.round((Date.now() - startedAt.current) / 1000),
    });
    setLoadingPlaces(true);
    setAvailablePlaces(await loadPlaces(location));
    setLoadingPlaces(false);
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleAge = (value: number) => {
    setSelectedAges(current => current.includes(value)
      ? current.filter(age => age !== value)
      : [...current, value].sort((a, b) => a - b));
  };

  const notifyChannel = () => {
    trackEvent("kakao_channel_click", { placement: "header" });
    setToast("카카오톡 채널 주소를 연결하면 바로 열리도록 준비해둘게요.");
    window.setTimeout(() => setToast(""), 3200);
  };

  if (showResults) {
    const visiblePlaces = expanded ? recommendations.slice(0, 9) : recommendations.slice(0, 3);
    return (
      <main className="results-page">
        <header className="topbar">
          <button className="brand brand-button" onClick={() => setShowResults(false)} aria-label="어디가지 처음으로">
            <span className="brand-mark">🍆</span><span>어디가지</span>
          </button>
          <button className="channel-button" onClick={notifyChannel}>공연/행사/할인 알림 받기</button>
        </header>

        <section className="results-shell">
          <button className="back-link" onClick={() => setShowResults(false)}>← 조건 다시 고르기</button>
          <div className="result-heading">
            <div>
              <span className="result-kicker">{location}에서 · {travelTime}</span>
              <h1><strong>{mood}</strong>을 찾았어요</h1>
              <p>{selectedAges.map(age => `만 ${age}세`).join(" · ")} 아이와 가기 좋은 순서예요.</p>
            </div>
            <div className="result-count"><b>{recommendations.length}</b><span>개의 엄선 장소</span></div>
          </div>

          <div className="beta-note">
            <span>i</span>
            <p><b>감도+육아편의+경험희소성 상위 3곳을 먼저 보여드려요!</b></p>
          </div>

          <div className="place-list">
            {visiblePlaces.map((place, index) => (
              <Fragment key={place.id}>
                <article className="place-card">
                  <div className={`place-visual tone-${index % 4}`}>
                    <span className="rank">{index + 1}</span>
                    {index < 3 && <span className="pick-label">UDGZ PICK</span>}
                    <span className="category-icon">{categoryIcons[place.category]}</span>
                    <small>{place.coreEnvironment}</small>
                  </div>
                  <div className="place-content">
                    <div className="place-meta">
                      <span>{place.region}</span><span>·</span><span>{place.category}</span>
                    </div>
                    <h2>{place.name}</h2>
                    <p className="place-summary">{place.summary}</p>
                    <div className="reason-row">
                      {place.reasons.map(reason => <span key={reason}>✓ {reason}</span>)}
                    </div>
                    {place.caution && <p className="caution">확인할 점 · {place.caution}</p>}
                    <div className="place-actions">
                      <a className="action primary-action" href={`https://map.naver.com/p/search/${encodeURIComponent(place.name)}`} target="_blank" rel="noreferrer" onClick={() => trackEvent("route_click", { place: place.name, rank: index + 1 })}>길찾기 <span>↗</span></a>
                      <a className="action secondary-action" href={`https://search.naver.com/search.naver?query=${encodeURIComponent(`${place.name} 아이와`)}`} target="_blank" rel="noreferrer" onClick={() => trackEvent("review_search_click", { place: place.name, rank: index + 1 })}>SNS 후기 보기</a>
                      {place.ticketCandidate && <button className="ticket-chip" onClick={() => trackEvent("ticket_interest_click", { place: place.name })}>티켓 연결 후보</button>}
                    </div>
                  </div>
                </article>
                {index === 0 && <aside className="channel-panel inline-channel">
                  <div><span className="channel-icon">💬</span><p><b>공연·행사·할인 소식을 받아보세요</b><small>티켓 오픈, 기간 한정 할인, 신규 장소를 알려드려요.</small></p></div>
                  <button onClick={notifyChannel}>알림 받기</button>
                </aside>}
              </Fragment>
            ))}
          </div>

          {!expanded && <button className="more-button" onClick={() => { setExpanded(true); trackEvent("more_results_click"); }}>다른 장소도 더 보기</button>}

          <CreatorFooter />
        </section>
        {toast && <div className="toast" role="status">{toast}</div>}
      </main>
    );
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="어디가지 홈"><span className="brand-mark">🍆</span><span>어디가지</span></a>
        <button className="channel-button" onClick={notifyChannel}>공연/행사/할인 알림 받기</button>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> 직접 엄선한 장소, 계속 업데이트 중</div>
        <h1>오늘<br /><strong>어디가지?</strong></h1>
        <p className="hero-copy">SNS에서 좋아보이는 곳들,<br />막상 가려고하면 다시 찾아봐야했죠.<br />당장 갈 수 있는 곳 중에서<br />고르고 바로 출발하세요!</p>

        <div className="finder-card one-page-form">
          <section className="form-section">
            <div className="compact-heading"><span>1</span><div><h2>어디 근처로 찾아볼까요?</h2><p>시간 떼우기용 말고, 추억 만들 공간을 찾아드려요</p></div></div>
            <label className="location-field"><span>⌖</span><input value={location} onChange={e => setLocation(e.target.value)} placeholder="서울 금천구" /></label>
            <div className="quick-locations">{["의왕시", "안양시", "과천시", "수원시", "서울시"].map(city => <button key={city} className={location === city ? "selected" : ""} onClick={() => setLocation(city)}>{city}</button>)}</div>
          </section>

          <section className="form-section">
            <div className="compact-heading"><span>2</span><div><h2>아이 나이는요?</h2><p>만 나이 기준, 두 명 이상 선택 가능해요</p></div></div>
            <div className="age-grid multi-age">{[0,1,2,3,4,5,6,7].map(value => <button key={value} className={selectedAges.includes(value) ? "selected" : ""} aria-pressed={selectedAges.includes(value)} onClick={() => toggleAge(value)}>{value === 0 ? "0세" : `${value}세`}</button>)}</div>
          </section>

          <section className="form-section">
            <div className="compact-heading"><span>3</span><div><h2>오늘은 어떤 시간이 필요한가요?</h2><p>지금은 서울 및 SNS유명 장소들만 우선 볼 수 있어요</p></div></div>
            <div className="mood-grid">{moods.map(item => <button key={item.value} className={`mood-option ${mood === item.value ? "selected" : ""}`} onClick={() => setMood(item.value)} aria-pressed={mood === item.value}>
              <span className="mood-icon">{item.icon}</span><span><b>{item.value}</b><small>{item.description}</small></span>
            </button>)}</div>
          </section>

          <section className="form-section">
            <div className="compact-heading"><span>4</span><div><h2>가까운 곳이 좋나요, 멀어도 괜찮나요?</h2><p>실제 시간은 교통상황에 따라 달라질 수 있어요</p></div></div>
            <div className="time-options compact-time">{[["30분 이내", "오늘은 가까운 곳"], ["30분 이상", "좋은 곳이면 멀어도 괜찮아요"]].map(([time, copy]) => <button key={time} className={travelTime === time ? "selected" : ""} onClick={() => setTravelTime(time)}><span className="time-radio"/><span><b>{time}</b><small>{copy}</small></span></button>)}</div>
          </section>

          <button className="primary-button recommend-button" disabled={!location.trim() || selectedAges.length === 0 || loadingPlaces} onClick={getRecommendations}>{loadingPlaces ? "장소 불러오는 중…" : "🍆 어디가지? 추천받기"}</button>
          {selectedAges.length === 0 && <p className="selection-help">아이 나이를 한 개 이상 골라주세요.</p>}
        </div>

        <CreatorFooter />
      </section>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
