# 빌드 지침 — post-detail

## Prerequisites

- Node.js 24.14.1 이상(개발 의존성 `jsdom@^27` 기준. 최신 jsdom은 Node ≥24.15 필요)
- yarn

## Dependency Installation

```bash
yarn install
```

## Environment Setup

`.env.local`(커밋하지 않음)에 다음을 설정하면 Notion 글의 상세 페이지가 생성된다. 값이 없으면 Notion 어댑터가 비활성화되고 마크다운 글만 빌드된다.

| 변수 | 용도 |
|---|---|
| `NOTION_API_KEY` | Notion 통합 토큰 |
| `NOTION_DATABASE_ID` | "Blog Posts" DB |
| `NOTION_BRIEFING_DATABASE_ID` | "AI Web Dev Researches" DB |
| `NOTION_BRIEFING_STATUSES` | (선택) 게시로 간주할 상태 목록, 기본 `Researched,Published` |

## Build Commands

```bash
yarn type-check   # tsc --noEmit
yarn lint         # next lint
yarn test         # vitest run
yarn build        # next build → out/ (output: 'export')
```

## Build Verification

- `yarn build` 종료 코드 0
- 라우트 표에 `● /blog/[slug]`(SSG)가 보인다
- `out/blog/<slug>/index.html`이 게시된 글 수만큼 존재한다
- `out/index.html`의 카드 링크가 `/blog/<slug>/`를 가리킨다

## Troubleshooting

| 증상 | 원인 / 대응 |
|---|---|
| Notion `rate_limited`(429)로 빌드 실패 | 빌드마다 슬러그당 Notion 조회가 여러 번 일어남. 잠시 후 다시 빌드. 반복되면 슬러그별 캐시 도입 검토(후속 작업) |
| Notion `validation_error` (filter 중첩) | `notion-adapter.ts`의 필터 평탄화가 되돌려졌는지 확인 |
| `w3c-xmlserializer` Node 버전 오류로 테스트 실패 | `jsdom`을 `^27`로 유지하거나 Node ≥24.15로 업그레이드 |
| Vite의 "ESM syntax in a file loaded as CommonJS" 경고 | 현재 동작에 영향 없음. `VITE_CONFIG_NATIVE_IGNORE_WARNING=true`로 숨길 수 있음 |
| "headers are not applied when exporting" 경고 | 정적 export의 알려진 제약. 보안 헤더는 호스팅 계층(CloudFront)에서 설정 필요 |
