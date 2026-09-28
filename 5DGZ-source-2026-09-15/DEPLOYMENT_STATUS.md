# 5DGZ 새 계정 배포 인수인계

- 작업 폴더: `udgz-site` (현재 폴더)
- GitHub 원본: https://github.com/leeyesd/udgz
- 새 Sites project_id: `.openai/hosting.json` 참조
- Sites 등록 및 소스 연결 완료. 동일 사이트를 재사용하고 새로 생성하지 말 것.
- 기존 공개 사이트와 기존 DB에는 변경 없음.
- 새 DB는 비어 있음. GitHub에는 운영 데이터 백업이 없음. 코드의 정적 추천 장소는 별도 fallback이며 DB 레코드가 아님.
- 관리자 `ADMIN_ACCESS_KEY`는 새로 생성하여 Sites secret으로 설정 완료. 키를 소스·Git·채팅에 기록하지 말 것.
- `OPENAI_API_KEY`는 미설정. 설정 전에는 기존 조사 기능이 검색 링크로 대체됨.
- 새로운 DB용 schema baseline은 `drizzle/0000_silky_silver_centurion.sql`과 meta에 있음. 요청마다 테이블을 생성하는 로직은 제거됨.
- 기존 DB용 상태 변환 SQL은 `tests/fixtures/legacy-drizzle`에 테스트 fixture로만 보관. 새 DB 배포에 실행하지 말 것.
- 상태/전환/기존 데이터 보존/기본 화면 테스트 통과. 빌드 통과.
- TypeScript 독립 검사는 원본에서 빠진 Cloudflare runtime 타입 정의로 실패. 빌드는 성공하나 타입 정의 보완 필요.
- 중복 판별용 주소 정규화 및 DB 조회 조건은 기존 코드 유지. 중복 레코드는 공개되지 않음.
- 기존 legacy status는 호환용으로 남아 있음. 중복 큐는 0건일 때 숨김. 기존 운영 DB의 duplicate 건수는 확인되지 않음.

## 2026-09-28 배포 완료

- URL: https://odigaji-5dgz.leeyesd.chatgpt.site
- 접근: 소유자 비공개
- 배포: appgdep_6ab9e52806b881919c15bc9183614800 (succeeded)
- Sites 소스 커밋: 84620029994eaa2776c9aeaa8c0fc6ff97e9ed9d
- GitHub main에 이름 및 상태 관리 변경 반영 완료.
- 빌드, 린트, 상태 규칙/이전 데이터 보존 테스트 통과. 로컬 API에서 생성·승인·거절·주소 중복·공개 필터와 A/B 렌더링 통과.
- 새 운영 DB에는 기존 장소 데이터를 가져오지 않았음.
- GitHub main 업로드가 Sites를 자동 배포하는 연결은 없음. 현재는 Sites 도구로 별도 배포함.

## 2026-09-28 장소 수집 v1.2
- Sites source: `7ebdbaa1fcffcdae15e7b181990be395555bbc94`
- Deployment: `appgdep_6ab9f132a7588191b5946d9c22737b29` (succeeded)
- URL: https://odigaji-5dgz.leeyesd.chatgpt.site
- 세 점수 저장·카드 표시, 동일 주소의 부모/자식 체험시설, 직원 수집 JSON 등록.
- 후보 30곳 검토: 26곳 등록, 주소 중복 1곳 건너뜀, 보류 2곳, 상업 키즈카페 1곳 제외.
- 신규 26곳 모두 pending. review_required 2곳 공개, incomplete 24곳 비공개.
- 사진은 점수 근거로만 확인·출처 저장; 사이트에 재게시하지 않음.
- 반복 실행·Slack 전송·상시 자동 조사 워커는 아직 활성화하지 않음.
