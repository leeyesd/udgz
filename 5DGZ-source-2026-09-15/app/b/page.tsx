"use client";

import { seoulToday, thisWeekend } from "../../lib/visit-calendar";
import VisitDatePicker from "../VisitDatePicker";
import { rankPlaces, type VisitMood } from "../../lib/recommendations";
import { useTopRegions } from "../../lib/use-top-regions";
import PlaceActions from "../PlaceActions";
import PlaceTags from "../PlaceTags";
import PlaceDetails from "../PlaceDetails";
import { Fragment, useMemo, useState } from "react";
import { places } from "../../lib/places";
import { loadPlaces } from "../../lib/live-places";
import styles from "./b.module.css";

const ages = [0, 1, 2, 3, 4, 5, 6, 7];
const moods: { value: VisitMood; title: string; description: string; icon: string }[] = [
 {value:"감성적 휴식",title:"감성적 휴식",description:"눈이 즐거운 곳에서 쉬어가기",icon:"♧"},
 {value:"특별한 체험",title:"특별한 체험",description:"평소와 다른 경험 만나기",icon:"✦"},
 {value:"신나게 놀기",title:"신나게 놀기",description:"몸을 움직이며 마음껏 놀기",icon:"☀"},
 {value:"실내 활동",title:"실내 활동",description:"실내 공간만 모아보기",icon:"⌂"},
];

function Logo() {
  return <span className={styles.logo}><span aria-hidden="true">🍆</span> 오디가지</span>;
}

export default function VariantB() {
  const [visitDate, setVisitDate] = useState(() => { const today = seoulToday(); return thisWeekend(today).find(day => day >= today) ?? today; });
  const topRegions = useTopRegions();
  const [location, setLocation] = useState("");
  const [selectedAges, setSelectedAges] = useState([2]);
  const [mood, setMood] = useState<VisitMood>("실내 활동");
  const [distance, setDistance] = useState("30분 이내");
  const [results, setResults] = useState(false);
  const [toast, setToast] = useState("");
  const [availablePlaces, setAvailablePlaces] = useState(places);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const canRecommend = Boolean(visitDate) && location.trim().length > 0 && selectedAges.length > 0;

  const recommendations = useMemo(() => rankPlaces(availablePlaces, mood).slice(0, 3), [mood, availablePlaces]);

  const recommend = async () => {
    if (!canRecommend) return;
    setLoadingPlaces(true);
    setAvailablePlaces(await loadPlaces(location, visitDate));
    setLoadingPlaces(false);
    setResults(true);
    window.scrollTo({ top: 0 });
  };

  const toggleAge = (age: number) => setSelectedAges(current => current.includes(age)
    ? current.filter(item => item !== age)
    : [...current, age].sort((a, b) => a - b));

  const notify = () => {
    setToast("카카오톡 채널 주소를 연결하면 이 버튼에서 바로 추가할 수 있어요.");
    window.setTimeout(() => setToast(""), 3000);
  };

  if (results) {
    return (
      <main className={styles.page}>
        <header className={styles.appBar}>
          <button className={styles.logoButton} onClick={() => setResults(false)} aria-label="조건 선택으로 돌아가기"><Logo /></button>
          <span className={styles.variantBadge}>B · PREVIEW</span>
          <button className={styles.alertButton} onClick={notify}>알림 받기</button>
        </header>

        <section className={styles.resultsShell}>
          <button className={styles.backButton} onClick={() => setResults(false)}>← 조건 수정</button>
          <div className={styles.resultsHeader}>
            <span className={styles.overline}>5DGZ TOP 3</span>
            <h1>오늘의 세 곳을<br />골라봤어요.</h1>
            <p>{location} 근처 · {selectedAges.map(age => `${age}세`).join(", ")} · {distance}</p>
          </div>

          <div className={styles.resultNotice}><span>i</span><p><b>선택한 활동에 맞는 장소</b>를 먼저 보여드려요!</p></div>

          {recommendations.length === 0 && <p role="status">선택한 지역·날짜·활동에 맞는 장소가 아직 없어요. 조건을 바꿔보세요.</p>}
          <div className={styles.resultGrid}>
            {recommendations.map((place, index) => (
              <Fragment key={place.id}>
                <article className={styles.resultCard}>
                  <div className={`${styles.resultArt} ${styles[`art${index + 1}`]}`}>
                    {place.imageUrl && <img className="place-photo" src={place.imageUrl} alt={place.name} />}
                    <span className={styles.resultRank}>0{index + 1}</span>
                    <span className={styles.pick}>5DGZ PICK</span>
                    <span className={styles.environment}>{place.coreEnvironment}</span>
                  </div>
                  <div className={styles.resultBody}>
                    <span className={styles.placeMeta}>{place.region} · {place.category}</span>
                    <h2>{place.name}</h2>
                    <p>{place.summary}</p>
                    <p>연령 · {place.ageHint || "찾는중.."}</p>
                    <PlaceTags scores={place.tagScores} />
                    <PlaceDetails details={place.details} prices={place.prices} date={visitDate} />
                    <p className={styles.caution}>확인 · {place.caution || "찾는중.."}</p>
                    <div className={styles.resultActions}>
                      <PlaceActions place={place} primaryClass={styles.routeButton} secondaryClass={styles.reviewButton} />
                    </div>
                  </div>
                </article>
                {index === 0 && (
                  <aside className={styles.kakaoBanner}>
                    <div><span aria-hidden="true">💬</span><p><b>이번 주말 소식, 대신 챙겨드릴게요</b><small>공연·행사·할인·새 장소 알림</small></p></div>
                    <button onClick={notify}>알림 받기</button>
                  </aside>
                )}
              </Fragment>
            ))}
          </div>
          <Footer />
        </section>
        {toast && <div className={styles.toast} role="status">{toast}</div>}
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.appBar}>
        <Logo />
        <span className={styles.variantBadge}>B · PREVIEW</span>
        <button className={styles.alertButton} onClick={notify}>알림 받기</button>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.overline}>직접 엄선하고, 계속 업데이트 중</span>
          <h1>이번 주말의 정답을<br /><strong>30초 안에.</strong></h1>
          <p>SNS에서 좋아보이는 곳들,<br />막상 가려고하면 다시 찾아봐야했죠.<br />5가지만 답하고, 당장 갈 수 있는 곳<br />고르고 바로 출발하세요!</p>
        </div>
      </section>

      <section className={styles.workspace}>
        <form className={styles.formCard} onSubmit={event => { event.preventDefault(); recommend(); }}>
          <div className={styles.formIntro}>
            <span>방문 조건을 알려주세요</span>
            <p>선택은 저장되지 않아요.</p>
          </div>

          <fieldset className={styles.fieldset}>
            <legend><span>01</span><b>어디 근처로 찾아볼까요?</b></legend>
            <p className={styles.help}>시간 떼우기용 말고, 추억 만들 공간을 찾아드려요.</p>
            <label className={styles.locationLabel}>
              <span className={styles.srOnly}>지역</span>
              <span aria-hidden="true">⌖</span>
              <input value={location} onChange={event => setLocation(event.target.value)} placeholder="서울 금천구" autoComplete="address-level2" />
            </label>
            <div className={styles.quickRow} aria-label="빠른 지역 선택">{topRegions.map(city => <button type="button" key={city} className={location === city ? styles.chipSelected : styles.chip} onClick={() => setLocation(city)}>{city}</button>)}</div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend><span>02</span><b>아이 나이는요?</b></legend>
            <p className={styles.help}>다둥이라면 중복 선택 가능해요. 만 나이 기준.</p>
            <div className={styles.ageGrid}>{ages.map(age => <button type="button" key={age} aria-pressed={selectedAges.includes(age)} className={selectedAges.includes(age) ? styles.ageSelected : styles.age} onClick={() => toggleAge(age)}>{age}세</button>)}</div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend><span>03</span><b>어떤 시간이 필요하세요?</b></legend>
            <p className={styles.help}>지금은 서울 및 SNS 유명 장소를 우선 보여드려요.</p>
            <div className={styles.moodGrid}>{moods.map(item => <button type="button" key={item.value} aria-pressed={mood === item.value} className={mood === item.value ? styles.moodSelected : styles.mood} onClick={() => setMood(item.value)}><span aria-hidden="true">{item.icon}</span><b>{item.title}</b><small>{item.description}</small></button>)}</div>
          </fieldset>

          <fieldset className={`${styles.fieldset} ${styles.lastField}`}>
            <legend><span>04</span><b>얼마나 이동할까요?</b></legend>
            <p className={styles.help}>교통상황을 고려해 경계 지역도 함께 추천해요.</p>
            <div className={styles.distanceGrid}>{["30분 이내", "30분 이상"].map(value => <button type="button" key={value} aria-pressed={distance === value} className={distance === value ? styles.distanceSelected : styles.distance} onClick={() => setDistance(value)}><span className={styles.radio} /><b>{value}</b><small>{value === "30분 이내" ? "가볍게 가까운 곳" : "좋다면 멀어도 괜찮아요"}</small></button>)}</div>
          </fieldset>

          <fieldset className={styles.fieldset}><legend><span>05</span><b>언제 놀러가세요?</b></legend><p className={styles.help}>평일 선택시 평일요금, 주말 선택시 주말 요금으로 나옵니다. 공휴일 선택시 운영 중인 장소만 나옵니다.</p><VisitDatePicker value={visitDate} onChange={setVisitDate} /></fieldset>
          <button className={styles.mobileSubmit} disabled={!canRecommend || loadingPlaces}>{loadingPlaces ? "장소 불러오는 중…" : "🍆 오디가지? 추천받기"}</button>
        </form>

        <aside className={styles.summaryCard}>
          <span className={styles.summaryLabel}>선택한 조건</span>
          <dl>
            <div><dt>지역</dt><dd>{location || "지역을 입력해주세요"}</dd></div>
            <div><dt>아이</dt><dd>{selectedAges.length ? selectedAges.map(age => `${age}세`).join(", ") : "나이를 골라주세요"}</dd></div>
            <div><dt>기분</dt><dd>{mood}</dd></div>
            <div><dt>이동</dt><dd>{distance}</dd></div>
          </dl>
          <button disabled={!canRecommend || loadingPlaces} onClick={recommend}>{loadingPlaces ? "장소 불러오는 중…" : "🍆 오디가지? 추천받기"}</button>
          <small>조건에 맞는 장소 중 상위 3곳을 먼저 보여드려요.</small>
        </aside>
      </section>

      <Footer />
      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </main>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <span>made by 육아하는 디자이너, 션디네집</span>
      <span><a href="https://www.instagram.com/seandy.zip" target="_blank" rel="noreferrer">션디네집 인스타그램</a> · DM으로 숨겨진 명소 / 서비스 오류 제보 환영해요.</span>
    </footer>
  );
}
