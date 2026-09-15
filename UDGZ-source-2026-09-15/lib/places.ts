export type Mood = "실내" | "야외" | "특별한 체험" | "감성적 휴식";

export type Place = {
  id: string;
  name: string;
  region: string;
  category: "문화" | "체험" | "카페" | "자연" | "테마파크" | "식당" | "공공";
  moods: Mood[];
  coreEnvironment: "실내" | "야외" | "실내·야외";
  score: number;
  ageHint: string;
  summary: string;
  reasons: string[];
  caution?: string;
  ticketCandidate?: boolean;
  affiliateUrl?: string;
  fullAddress?: string;
};

export const places: Place[] = [
  {
    id: "gwacheon-science",
    name: "국립과천과학관",
    region: "과천",
    category: "문화",
    moods: ["실내", "야외", "특별한 체험"],
    coreEnvironment: "실내·야외",
    score: 96,
    ageHint: "영유아부터",
    summary: "계획 없이 가도 실내외에서 오래 머물기 좋은 과학 나들이",
    reasons: ["상설전시와 야외공간", "교육적인 유아놀이실", "부담 낮은 기본 입장료"],
    caution: "유아놀이실은 사전 예약 필요",
    ticketCandidate: true,
  },
  {
    id: "movement-lab-uiwang",
    name: "무브먼트랩 의왕",
    region: "의왕",
    category: "카페",
    moods: ["감성적 휴식", "야외"],
    coreEnvironment: "실내·야외",
    score: 91,
    ageHint: "걷기 시작한 아이부터",
    summary: "가구 쇼룸과 야외마당을 함께 즐기는 부모 취향의 공간",
    reasons: ["부모가 즐거운 쇼룸", "아이와 머물 야외마당", "카페와 전시 동선 결합"],
  },
  {
    id: "seoul-grand-park",
    name: "서울대공원",
    region: "과천",
    category: "자연",
    moods: ["야외", "특별한 체험", "감성적 휴식"],
    coreEnvironment: "야외",
    score: 94,
    ageHint: "전 연령",
    summary: "동물원을 보거나 산책만 해도 하루가 채워지는 넓은 야외",
    reasons: ["선택 가능한 다양한 동선", "충분한 야외 활동", "아이와 부모 모두 만족"],
    caution: "날씨와 보행량 확인 권장",
    ticketCandidate: true,
  },
  {
    id: "agriculture-museum",
    name: "농업박물관",
    region: "서울",
    category: "문화",
    moods: ["실내", "특별한 체험"],
    coreEnvironment: "실내·야외",
    score: 93,
    ageHint: "영유아부터",
    summary: "체계적인 영유아 놀이와 상설전시를 함께 즐기는 도심 박물관",
    reasons: ["컨셉별 영유아 놀이", "교육적인 상설전시", "실내외 활동 가능"],
    caution: "영유아 놀이공간 예약 난도가 높음",
  },
  {
    id: "mayfield-hotel-cafe",
    name: "메이필드호텔 카페",
    region: "서울 강서",
    category: "카페",
    moods: ["감성적 휴식", "야외"],
    coreEnvironment: "실내·야외",
    score: 95,
    ageHint: "영유아부터",
    summary: "호텔의 조경과 여유를 예상보다 합리적으로 누리는 나들이",
    reasons: ["고급스럽고 탁 트인 조경", "아이와 오래 머물기 편한 동선", "주차 부담이 낮은 편"],
  },
  {
    id: "seven-seasons",
    name: "세븐시즌스",
    region: "경기 광주",
    category: "체험",
    moods: ["특별한 체험", "감성적 휴식", "야외"],
    coreEnvironment: "실내·야외",
    score: 97,
    ageHint: "유아부터",
    summary: "이국적인 공간감과 아이 체험이 함께 살아있는 UDGZ형 장소",
    reasons: ["부모가 만족하는 감도", "아이의 분명한 체험", "사진과 기억이 남는 희소성"],
  },
  {
    id: "seoseoul-art-museum",
    name: "서서울미술관",
    region: "서울 서남권",
    category: "문화",
    moods: ["실내", "야외", "감성적 휴식"],
    coreEnvironment: "실내·야외",
    score: 92,
    ageHint: "영유아부터",
    summary: "새 미술관과 앞마당 피크닉을 한 번에 누리는 가벼운 나들이",
    reasons: ["새로 생긴 쾌적한 공간", "탁 트인 미니공원", "주변 식사·카페 선택지"],
  },
  {
    id: "mirinae-healing-club",
    name: "미리내힐빙클럽",
    region: "경기 양평",
    category: "체험",
    moods: ["실내", "특별한 체험", "감성적 휴식"],
    coreEnvironment: "실내·야외",
    score: 94,
    ageHint: "영유아부터",
    summary: "리조트처럼 꾸민 조경 속에서 온 가족이 오래 쉬는 공간",
    reasons: ["영유아도 즐길 요소", "부모의 휴식 경험", "다양한 체류 콘텐츠"],
    ticketCandidate: true,
  },
  {
    id: "anseong-farmland",
    name: "안성팜랜드",
    region: "안성",
    category: "테마파크",
    moods: ["야외", "특별한 체험"],
    coreEnvironment: "야외",
    score: 91,
    ageHint: "유아부터",
    summary: "동물·놀이기구·계절 풍경을 하루에 경험하는 대형 야외 나들이",
    reasons: ["가까이 보는 동물 경험", "계절마다 달라지는 풍경", "주차와 먹거리 동선"],
    caution: "입장료 외 일부 체험은 추가 유료",
    ticketCandidate: true,
  },
  {
    id: "the-magu",
    name: "더마구",
    region: "경기 남부",
    category: "테마파크",
    moods: ["야외", "특별한 체험", "감성적 휴식"],
    coreEnvironment: "야외",
    score: 94,
    ageHint: "유아부터",
    summary: "해외여행 같은 분위기와 공연, 야외 놀이가 결합된 공간",
    reasons: ["강한 이국적 분위기", "부모와 아이의 동시 만족", "공연과 야외 활동"],
    caution: "실내시설이 있어도 핵심 경험은 야외",
    ticketCandidate: true,
  },
  {
    id: "picture-book-dreammaru",
    name: "그림책꿈마루",
    region: "의왕",
    category: "문화",
    moods: ["실내", "감성적 휴식"],
    coreEnvironment: "실내",
    score: 90,
    ageHint: "영유아부터",
    summary: "조용히만 있어야 한다는 부담 없이 머무는 그림책 공간",
    reasons: ["잘 구성된 영유아 공간", "깨끗하고 정돈된 환경", "움직여도 편한 중앙공간"],
  },
  {
    id: "slow-us",
    name: "슬로우어스",
    region: "서울 잠실",
    category: "카페",
    moods: ["실내", "특별한 체험", "감성적 휴식"],
    coreEnvironment: "실내",
    score: 91,
    ageHint: "영유아부터",
    summary: "감각적인 도심 공간에서 아이가 거북이를 만나는 카페",
    reasons: ["부모 취향의 인테리어", "아이에게 분명한 관찰거리", "도심 접근성"],
  },
];

export const rejectedExamples = [
  { names: ["나랑노랑 의왕", "힐링점프 방방", "닥터방방 방배", "레인보우 몰리스", "슈필렌키즈룸", "리틀치프"], reason: "차별점·교육성·공간 만족 없이 비용만 드는 시간 소진형 키즈카페" },
  { names: ["사이숲", "루트205", "해든부엌"], reason: "감성을 표방하지만 노후·조잡함·정돈 부족으로 실제 공간 품질이 낮음" },
  { names: ["노원 스윗레시피 카페"], reason: "유모차 접근과 영유아 동선이 불편하고 청결·체류 품질 우려가 큼" },
];
