# 코드 요약 — post-detail

## Files Created / Modified

**신규**
- `src/components/blog/PostContent.tsx` — Markdown 본문 렌더러(react-markdown + remark-gfm, shiki 코드 하이라이트, raw HTML 미사용)
- `src/app/blog/[slug]/page.tsx` — 정적 상세 라우트(`generateStaticParams`, `generateMetadata`, `notFound()`)
- `vitest.config.ts`, `vitest.setup.ts` — Vitest(jsdom) 설정
- 테스트: `src/components/blog/PostCard.test.tsx`, `src/components/blog/PostContent.test.tsx`, `src/app/blog/[slug]/page.test.tsx`

**수정**
- `src/components/blog/PostCard.tsx` — 커버 이미지가 있을 때만 2열, 설명 `max-w-2xl` 제거, stretched link로 카드 전체 클릭(태그는 `z-10`으로 위에), href `/blog/<slug>/`
- `src/styles/globals.css` — 다크 모드에서 shiki 다크 테마 CSS 변수 적용
- `package.json`, `yarn.lock` — `test` 스크립트, 개발 의존성(vitest, @vitejs/plugin-react, vite, jsdom@^27, @testing-library/react, @testing-library/dom, @testing-library/jest-dom)
- `src/lib/content/adapters/notion-adapter.ts` — **계획 외 변경**(아래 Deviations 참조)

## Key Implementation Decisions

- 카드 전체 클릭은 `<a>` 중첩 없이 제목 링크의 `::after` 의사 요소로 구현(FR2.2, NFR5).
- shiki는 `createHighlighter`(shiki 1.29의 `getHighlighter` 후속 이름)로 모듈당 한 번 생성. 코드 펜스의 언어를 미리 로드해 react-markdown 렌더링 안에서 동기 하이라이트. 모르는 언어는 `text`.
- `rehype-raw` 미사용 → react-markdown 9는 raw HTML을 출력하지 않는다(텍스트 이스케이프가 아니라 제거됨). 테스트는 `<script>`/`<iframe>` 요소가 생성되지 않음을 확인(NFR3).
- 저장소 오류(Notion 실패, 429, 슬러그 충돌)는 잡지 않고 빌드 실패로 드러남(NFR4) — 테스트로 확인.
- 테스트 환경에 `__NEXT_TRAILING_SLASH=true`를 넣어 `trailingSlash: true`와 같은 링크(`/tags/<tag>/`)를 검증.
- 개발 의존성 `jsdom`은 `^27`로 고정(최신판이 Node ≥24.15 요구, 현재 24.14.1).

## Test Coverage Summary

| 명령 | 결과 |
|---|---|
| `yarn test` | 3개 파일, 14개 테스트 모두 통과(PostCard 4, PostContent 6, page 4) |
| `yarn type-check` | 통과 |
| `yarn lint` | 경고·오류 없음 |
| `yarn build` | 통과(실제 Notion 연결). `out/blog/*/index.html` 21개 생성(마크다운 1 + 브리핑 20) |

기준선(변경 전): 테스트 0개, type-check·lint 통과.

## Deviations from the Plan

1. **`notion-adapter.ts` 수정(계획 외)**: 첫 빌드에서 상세 페이지 21개 모두 Notion `validation_error`로 실패. 원인은 `getPostBySlug`가 이미 `and → or` 구조인 브리핑 DB의 게시 필터를 다시 `and`로 감싸 Notion의 복합 필터 중첩 한도(2단계)를 넘긴 기존 버그(이전엔 `getPostBySlug`를 쓰는 곳이 없어 드러나지 않음). 게시 필터가 최상위 `and`이면 슬러그 조건을 그 안에 합치도록 6줄 수정. 필터 조건은 그대로이며 약화된 검사는 없음. 이 평탄화 로직에 대한 단위 테스트는 없음.
2. 개발 의존성 3개(`vite`, `@testing-library/dom`, `jsdom` 버전 고정)가 피어 의존성·Node 버전 때문에 추가됨.
3. `vitest.setup.ts`를 별도 파일로 둠(`tsc`가 jest-dom 매처 타입을 인식하도록).
4. 상세 라우트 테스트는 `PostContent`를 동기 스텁으로 대체(React 18 클라이언트 렌더러가 async 서버 컴포넌트를 기다릴 수 없음). `PostContent`는 별도 테스트로 검증.

## Known Concerns

- 빌드 시 상세 페이지마다 `getPostBySlug`가 2회(메타데이터 + 페이지) × 어댑터 3개 호출됨. 연속 빌드 중 429가 한 번 발생함 → 슬러그별 캐시/중복 제거는 후속 작업 후보.
- `welcome-to-blog` 마크다운 본문이 자체 `# Welcome`으로 시작해 해당 페이지에 `<h1>`이 2개(마크다운 어댑터는 선두 제목을 제거하지 않음).
- 카드의 태그 링크(`/tags/<tag>/`) 라우트는 아직 없음(기존부터, 범위 외).
- Notion 업로드 이미지 URL 만료(범위 외, Q3 = A).
