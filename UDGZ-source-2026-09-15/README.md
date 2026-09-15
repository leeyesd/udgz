# UDGZ 어디가지

미취학 자녀와 외출하는 가족이 오늘 실제로 갈 수 있는 장소를 빠르게 고르도록 돕는 모바일 우선 추천 서비스입니다.

- 공개 서비스: https://udgz.riankr.chatgpt.site
- 디자인 B: https://udgz.riankr.chatgpt.site/b
- 다른 컴퓨터에서 이어서 작업하기: [UDGZ_HANDOFF.md](./UDGZ_HANDOFF.md)
- 장소 선별 기준: [docs/curation-rubric.md](./docs/curation-rubric.md)

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

## 검증

```bash
npm run build
npm test
npm run lint
```

## 구성

- React 19 + TypeScript
- vinext / Vite
- Cloudflare Worker
- Cloudflare D1 + Drizzle ORM
- OpenAI Sites hosting configuration

## 비밀값

어드민과 AI 조사 기능에는 아래 런타임 환경변수가 사용됩니다.

- `ADMIN_ACCESS_KEY`
- `OPENAI_API_KEY` (선택)

값은 `.dev.vars` 또는 배포 환경의 비밀값으로만 관리합니다. `.env*`, `.dev.vars*`는 Git에서 제외되어 있습니다.
