# UDGZ 어디가지 — 작업 인수인계

마지막 정리일: 2026-09-15 (Asia/Seoul)

이 문서는 다른 컴퓨터의 Codex에서 UDGZ 개발을 이어가기 위한 기준 문서다. 새 작업을 시작할 때 아래처럼 요청하면 된다.

> 이 저장소의 `UDGZ_HANDOFF.md`와 `AGENTS.md`를 먼저 읽고, 현재 코드와 Git 상태를 확인한 뒤 이어서 작업해줘. 비밀값은 출력하거나 커밋하지 마.

## 1. 제품 목표

UDGZ(어디가지)는 미취학 자녀와 외출하는 부모가 여러 정보를 다시 검색하는 시간을 줄이고, 지금 가족이 실제로 갈 수 있는 장소를 빠르게 결정하도록 돕는 모바일 우선 웹 서비스다.

- 핵심 성공 경험: 서비스 진입 후 15분 안에 장소 결정
- 핵심 행동: 추천 결과의 `티켓예매` 또는 `길찾기` 클릭
- 초기 목표: MAU 1,000명, 이용자 100명 중 10명 핵심 행동
- 운영 지역: 서울 및 경기남부 중심, SNS에서 화제가 된 장소는 지역 외 개별 추가
- 브랜드: UDGZ / 어디가지, 가지(🍆), 진한 보라색
- 제작자 표기: 육아하는 디자이너 션디네집
- 인스타그램: https://www.instagram.com/seandy.zip

## 2. 현재 공개 서비스

- 공개 주소: https://udgz.riankr.chatgpt.site
- A안: `/`
- B안: `/b`
- 어드민: `/admin/{ADMIN_ACCESS_KEY}`

어드민 주소의 키와 API 키는 절대 이 문서, Git 커밋, 이슈 또는 채팅에 원문으로 남기지 않는다.

## 3. 현재 구현 상태

### 사용자 화면

- A/B 디자인 모두 공개
- 모바일 우선 원페이지 추천 입력
- 나이 0~7세 복수 선택
- 이동거리 의도: `30분 이내`, `30분 이상`
- 사용자 테마 4종: `실내`, `야외`, `특별한 체험`, `감성적 휴식`
- 추천 결과 상위 3곳에만 UDGZ Pick 표시
- 길찾기 및 SNS 후기 검색 링크 제공
- DB의 공개 장소와 코드 내 엄선 장소를 함께 추천

### 장소 어드민

- 팀원이 장소 후보 생성·수정·공개 가능
- 상태: `pending`(보류), `published`(공개), `duplicate`(중복)
- 전체주소를 정규화하여 중복 감지
- 시/도 → 시/군/구 → 읍/면/동 계층 저장
- 요일별 운영시간, 휴무·공휴일, 예약, 연령, 가격, 주차, 수유실, 기저귀갈이대, 출처, 이미지, 검수자 저장
- 공개 등록 시 누락된 필수값 표시 및 첫 누락 항목으로 이동
- 저장 성공 시 입력창 닫힘
- 장소명 기반 AI 조사는 성공 10건까지만 허용하고, 키가 없거나 한도를 쓰면 검색 링크 제공
- 현재 AI 조사 구현은 OpenAI Responses API를 사용함 (`app/api/admin/research/route.ts`)

### DB 상태

- Cloudflare D1 바인딩 이름: `DB`
- 과거 대량 가져오기 자료는 사용자 요청으로 삭제됨
- 마지막 확인 기준 공개 장소는 기존에 수동 등록했던 2곳만 복구된 상태
- 로컬 코드의 엄선 장소 fallback은 `lib/places.ts`에 별도로 존재

DB 숫자는 운영 중 변할 수 있으므로 작업 시작 시 어드민 또는 API에서 다시 확인한다.

## 4. 기술 구성

- React 19 + TypeScript
- vinext / Vite
- Cloudflare Worker 런타임
- Cloudflare D1 + Drizzle ORM
- OpenAI Sites 설정: `.openai/hosting.json`
- Node.js 요구 버전: 22.13 이상

주요 파일:

- `app/page.tsx`: A안 사용자 화면
- `app/b/page.tsx`: B안 사용자 화면
- `app/admin/[accessKey]/`: 어드민 화면
- `app/api/places/route.ts`: 공개 장소 조회
- `app/api/admin/places/route.ts`: 장소 저장·공개·중복 검사
- `app/api/admin/research/route.ts`: 장소명 기반 AI 조사
- `db/schema.ts`: 장소 DB 스키마
- `lib/place-record.ts`: 장소 타입, 테마, 주소 정규화
- `lib/live-places.ts`: D1 공개 장소와 fallback 결합
- `docs/curation-rubric.md`: 좋은 장소 선별 기준
- `scripts/import-legacy-venues.mjs`: 과거 DB 가져오기 도구(현재는 재실행 금지)

## 5. 로컬 실행과 검증

```bash
npm install
npm run dev
```

기본 확인 명령:

```bash
npm run build
npm test
npm run lint
```

`npm run dev`는 `.openai/hosting.json`의 바인딩을 로컬에서 모사한다. 실제 어드민 접근에는 로컬 비밀값 설정이 별도로 필요하다.

## 6. 비밀값과 보안

필요한 런타임 비밀값:

- `ADMIN_ACCESS_KEY`: 비공개 어드민 URL 및 API 인증
- `OPENAI_API_KEY`: 장소명 기반 AI 조사 기능(선택)

로컬 비밀값은 프로젝트 루트의 `.dev.vars`에 저장할 수 있지만, 이 파일은 `.gitignore` 대상이다. GitHub에는 이름만 문서화하고 값은 각 배포 환경과 노트북에 따로 등록한다.

커밋 전에는 반드시 다음을 확인한다.

```bash
git status
git diff --cached
```

## 7. GitHub 연결 및 노트북 이동

현재 로컬 저장소:

- 브랜치: `main`
- 기존 커밋 이력 있음
- GitHub 원격 저장소는 아직 연결되지 않음
- 현재 컴퓨터에는 GitHub CLI(`gh`)가 설치되어 있지 않음

### 현재 컴퓨터에서 한 번만 할 일

1. GitHub 웹사이트에서 **Private** 저장소 `udgz`를 빈 저장소로 생성한다.
2. README, `.gitignore`, 라이선스 자동 생성을 선택하지 않는다.
3. GitHub가 보여주는 주소를 사용해 아래 명령을 실행한다.

```bash
git remote add origin https://github.com/본인계정/udgz.git
git push -u origin main
```

이미 `origin`이 있다고 나오면 새로 추가하지 말고 먼저 `git remote -v`로 대상을 확인한다.

### 노트북에서 할 일

```bash
git clone https://github.com/본인계정/udgz.git
cd udgz
npm install
npm run dev
```

그다음 노트북의 Codex에서 이 문서 상단의 요청문을 붙여 넣는다. `.dev.vars`의 실제 값은 안전한 별도 경로로 옮겨 직접 만든다.

## 8. 제품 판단 기준

좋은 장소는 단순히 아이를 잠깐 놀리는 곳이 아니라 부모의 감도, 육아 편의, 경험의 희소성을 함께 만족해야 한다.

- 선호: 감각적이고 정돈된 공간, 부모도 만족하는 분위기, 실내외 선택지, 교육적이거나 기억에 남는 경험, 합리적인 비용
- 배제: 차별점 없는 상업 키즈카페, 시간 때우기용 공간, 낡고 조잡하거나 위생이 우려되는 공간, 일반적인 근린·어린이·소공원
- 예외: 특별한 경험 또는 제휴 수익 가능성이 명확한 키즈카페는 포함 가능
- 추천 노출: 적합성을 우선하되 제휴 가능한 티켓 장소를 적절히 상위 노출

세부 기준은 `docs/curation-rubric.md`를 따른다.

## 9. 다음 우선순위

1. 수동 등록된 2개 공개 장소가 사용자 추천 결과에 정상 노출되는지 확인
2. 사용자 추천 필터와 D1 필드의 실제 매칭 품질 검증
3. 클릭 측정 연결: 추천 실행, 길찾기, 티켓예매, SNS 후기, 카카오 채널 추가
4. 엄선된 200개 장소의 검수·등록 흐름 확정
5. 제휴 링크 우선순위가 추천 품질을 해치지 않는 범위에서 작동하도록 점수 정책 구체화
6. GitHub와 실제 배포 환경의 자동 배포 연결 여부 확정

## 10. 작업 시 주의

- 사용자가 요청하지 않은 대량 DB 가져오기를 실행하지 않는다.
- `근린공원`류의 일반 공원은 자동 등록하지 않는다.
- 운영시간·가격을 추측해서 확정값으로 저장하지 않는다.
- 가격 정보가 없다는 이유로 무료로 처리하지 않는다.
- 기존 사용자 변경사항을 덮어쓰거나 DB를 초기화하지 않는다.
- 배포 전 A안과 B안, 모바일 화면, 어드민 저장·공개 흐름을 모두 확인한다.
