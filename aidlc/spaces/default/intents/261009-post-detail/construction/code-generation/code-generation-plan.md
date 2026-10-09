# 코드 생성 계획 — post-detail

## Summary

- Builds: 홈 카드 폭 확대·카드 전체 클릭, Notion 본문을 렌더링하는 `/blog/[slug]` 상세 페이지, Vitest 테스트 환경
- Touches: `src/components/blog/PostCard.tsx`, `src/components/blog/PostContent.tsx`(신규), `src/app/blog/[slug]/page.tsx`(신규), `package.json`, `vitest.config.ts`(신규), `src/**/*.test.tsx`(신규)
- Tests: Vitest 단위 테스트 약 12개(카드 4, 본문 렌더링 5, 상세 라우트 3)

## Context

- 범위: express, Minimal 깊이, Unit 없음(단일 구현 반복)
- 요구사항: [requirements.md](../../inception/requirements-analysis/requirements.md) — FR1(폭 확대), FR2(카드 클릭), FR3(상세 화면), NFR1~NFR6
- 코드 지식 기반: `aidlc/spaces/default/codekb/ian-blog/`
- 스택: Next.js 14.2.5 App Router(`output: 'export'`), React 18, TypeScript, Tailwind 3 + `@tailwindcss/typography`. 렌더링 의존성(react-markdown 9, remark-gfm 4, shiki 1)은 이미 설치됨. 새 런타임 의존성은 추가하지 않는다.
- 관례: `src/app/**`·`src/components/**`는 세미콜론 + 큰따옴표, `cn()`으로 클래스 병합, 상호작용 요소에 `data-testid`

## Blast Radius

| 파일 | 변경 | 영향 |
|---|---|---|
| `src/components/blog/PostCard.tsx` | 수정 | 낮음 — `PostList`만 사용, 홈 화면 표시만 바뀜 |
| `src/components/blog/PostContent.tsx` | 신규 | 없음(신규) |
| `src/app/blog/[slug]/page.tsx` | 신규 | 빌드 시 슬러그마다 `getPostBySlug` 호출(Notion API 호출 증가, NFR4) |
| `package.json`, `vitest.config.ts` | 수정/신규 | 개발 도구만, 런타임 영향 없음 |

Test Baseline: 기존 테스트 없음(0개). `yarn type-check`, `yarn lint`가 변경 전 통과하는지 Step 1에서 기록한다.

## Steps

### Step 1: 기준선 기록과 테스트 러너 준비 (NFR1, NFR2)
- [x] 변경 전 `yarn type-check`, `yarn lint` 결과를 기록한다(기준선).
- [x] 개발 의존성 추가: `yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`
- [x] `vitest.config.ts` 작성: `@vitejs/plugin-react`, `environment: "jsdom"`, `@/` → `src/` 별칭, `setupFiles`로 `@testing-library/jest-dom/vitest` 로드, `include: ["src/**/*.test.{ts,tsx}"]`
- [x] `package.json` scripts에 `"test": "vitest run"` 추가
- [x] `yarn vitest run --passWithNoTests`로 러너가 실행되는지 확인한다.

### Step 2: 카드 레이아웃 폭 확대 구현 (FR1.1, FR1.2, FR1.3)
- [x] `PostCard.tsx`의 `sm:grid-cols-[180px_minmax(0,1fr)]`를 `post.coverImage`가 있을 때만 적용(`cn()` 조건부)
- [x] 설명 문단의 `max-w-2xl` 제거

### Step 3: 카드 전체 클릭 구현 (FR2.1, FR2.2, FR2.3, NFR5)
- [x] 제목 링크를 "stretched link"로 만든다: `article`에 `relative`, 제목 `Link`에 `after:absolute after:inset-0` 의사 요소로 카드 전체를 덮는다. 링크의 접근 가능한 이름은 글 제목.
- [x] 태그 영역은 `relative z-10`으로 의사 요소 위에 올려 태그 링크가 그대로 동작하게 한다. `<a>` 중첩 없음.
- [x] 링크 `href`는 `/blog/${encodeURIComponent(post.slug)}/`(trailingSlash 설정과 일치), `focus-visible` 스타일 유지
- [x] 카드 `data-testid="post-card"`, 링크 `data-testid="post-card-title-link"` 유지

### Step 4: 카드 테스트 작성·실행 (FR1, FR2)
- [x] `src/components/blog/PostCard.test.tsx`
  - 커버 이미지 없음 → 2열 클래스 없음(FR1.1)
  - 커버 이미지 있음 → 2열 클래스와 이미지 렌더링(FR1.2)
  - 설명에 `max-w-2xl` 없음(FR1.3)
  - 카드 링크 href가 `/blog/<slug>/`이고 접근 가능한 이름이 제목, 태그 링크는 `/tags/<tag>`이며 어떤 `<a>`도 다른 `<a>` 안에 있지 않음(FR2.1~FR2.3)
- [x] `yarn vitest run src/components/blog/PostCard.test.tsx` 통과

### Step 5: Markdown 본문 렌더링 컴포넌트 구현 (FR3.3, FR3.4, FR3.5, NFR3, NFR6)
- [x] `src/components/blog/PostContent.tsx`(서버 컴포넌트, `async`) 작성
  - `react-markdown` + `remark-gfm`(표, 체크리스트, 취소선, 자동 링크)
  - `rehype-raw`는 사용하지 않는다 → raw HTML은 텍스트로 이스케이프됨(NFR3)
  - 코드 블록: shiki `getHighlighter`(모듈 단위로 한 번 생성해 재사용)로 서버에서 하이라이트. 라이트/다크 테마 2종(`github-light`/`github-dark`) CSS 변수 방식, 모르는 언어는 `text`로 대체. 출력 HTML은 shiki가 이스케이프한 결과만 삽입
  - 이미지: Notion URL을 그대로 `<img loading="lazy">`로 렌더링(FR3.5), `alt` 유지
  - 외부 링크는 `target="_blank" rel="noopener noreferrer"`
  - 래퍼: `prose dark:prose-invert max-w-none` + 기존 토큰 색상, `data-testid="post-content"`
- [x] 다크 모드에서 shiki 다크 테마가 적용되도록 `src/styles/globals.css`에 `.dark .shiki` CSS 변수 전환 규칙 추가

### Step 6: 본문 렌더링 테스트 작성·실행 (FR3.3, FR3.4, NFR3)
- [x] `src/components/blog/PostContent.test.tsx`
  - 표가 `<table>`로 렌더링됨
  - 체크리스트가 체크박스 입력으로 렌더링됨
  - 인용·이미지(src 유지) 렌더링
  - 코드 블록이 shiki 하이라이트 마크업(`.shiki`)으로 렌더링되고 원문 코드가 보존됨
  - 본문 속 `<script>` 등 raw HTML은 요소로 생성되지 않음
- [x] `yarn vitest run src/components/blog/PostContent.test.tsx` 통과

### Step 7: 상세 라우트 구현 (FR3.1, FR3.2, FR3.6, FR3.7, FR3.8)
- [x] `src/app/blog/[slug]/page.tsx`
  - `generateStaticParams`: `getAllSlugs()` → `{ slug }[]`, `export const dynamicParams = false`
  - `generateMetadata`: 글 제목·설명, 글이 없으면 빈 메타데이터
  - 페이지: `getPostBySlug(slug)` → 없으면 `notFound()`(FR3.6). 제목(h1), 게시일, 카테고리, 읽기 시간(있을 때), 태그(`TagBadge`), 커버 이미지(있을 때), `PostContent`, 홈으로 돌아가는 링크(`data-testid="back-to-home-link"`)
  - 오류 처리: 저장소 오류(Notion API 실패, 429, 슬러그 충돌)는 잡지 않고 빌드 실패로 드러낸다(NFR4)
  - 레이아웃: 홈과 같은 토큰·여백, 본문 폭은 가독성을 위한 `max-w-3xl`

### Step 8: 상세 라우트 테스트 작성·실행 (FR3.1, FR3.6, FR3.7)
- [x] `src/app/blog/[slug]/page.test.tsx` (`@/lib/content/repository`와 `next/navigation` 모킹)
  - `generateStaticParams`가 모든 슬러그를 반환
  - 없는 슬러그에서 `notFound()` 호출
  - `generateMetadata`가 제목·설명을 반환하고, 페이지가 h1 제목과 본문을 렌더링
- [x] `yarn vitest run "src/app/blog/[slug]/page.test.tsx"` 통과

### Step 9: 품질 게이트와 빌드 확인 (NFR2, FR3.1)
- [x] `yarn test`, `yarn type-check`, `yarn lint` 모두 통과
- [x] `yarn build` 성공, `out/blog/<slug>/index.html`이 게시 글 수만큼 생성됐는지 확인(최소 `out/blog/welcome-to-blog/index.html`). Notion 환경 변수가 없는 환경이면 마크다운 글만 생성되는 것이 정상

### Step 10: 문서와 추적성
- [x] 변경 파일의 공개 컴포넌트에 짧은 JSDoc 주석(기존 주석 밀도에 맞춤)
- [x] 요구사항 ↔ 구현/테스트 매핑은 이 단계의 `traceability.json`에 기록(오케스트레이터가 Step 5에서 작성)

## Requirement Traceability

| 요구사항 | 계획 단계 |
|---|---|
| FR1.1, FR1.2, FR1.3 | Step 2, Step 4 |
| FR2.1, FR2.2, FR2.3 | Step 3, Step 4 |
| FR3.1 | Step 7, Step 8, Step 9 |
| FR3.2, FR3.8 | Step 7 |
| FR3.3, FR3.4, FR3.5 | Step 5, Step 6 |
| FR3.6, FR3.7 | Step 7, Step 8 |
| NFR1, NFR2 | Step 1, Step 9 |
| NFR3 | Step 5, Step 6 |
| NFR4 | Step 7, Step 9 |
| NFR5 | Step 3, Step 7 |
| NFR6 | Step 5, Step 7 |

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "express",
  "test_strategy": "minimal",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "minimal",
    "strategy_volume": [
      "One verifiable test per requirement at the narrowest effective level.",
      "At least one happy-path unit test per component.",
      "Unit tests are the default; a bugfix/security scope floor may require an integration or E2E regression when that is the narrowest level that reproduces the defect."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:c8f84e35190e007d9863fad236154d0269ab9bf633fc2a3ff106ed965ba4a9b9",
  "contract_sha256": "sha256:bb76c1b22f8307be6e5780d50cabab891684449d5b164bd0e825e9e4e5c61e5b"
}
```
