# 개발자 코드 스캔 — ian-blog

- 스캔 일자: 2026-10-09
- 커밋: `485cc13261b0bc9754e111daf4fe8c2f04e35535` (브랜치 `feature/notion-ai-briefing`)
- 스캔 범위: 전체 저장소(`./`), 최초 스캔(NO_STORE)

## Developer Code Scan Results

### Scan Coverage
- **Analyzed deeply**:
  - `src/app/` (`layout.tsx`, `page.tsx`)
  - `src/components/` (`blog/PostCard.tsx`, `blog/PostList.tsx`, `blog/TagBadge.tsx`, `layout/Header.tsx`, `layout/Footer.tsx`, `shared/ThemeToggle.tsx`)
  - `src/lib/` (`content/repository.ts`, `content/types.ts`, `content/normalize.ts`, `content/adapters/notion-adapter.ts`, `content/adapters/markdown-adapter.ts`, `utils.ts`)
  - `src/types/index.ts`
  - `src/styles/globals.css`
  - `content/posts/welcome-to-blog.md`
  - `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`, `.env.example`, `.gitignore`, `next-env.d.ts`
- **Skimmed only**:
  - `yarn.lock` (핵심 패키지의 해석 버전만 확인)
  - `package-lock.json` (존재 여부만 확인 — 이중 lockfile)
  - `skills-lock.json`, `.agents/` (에이전트 스킬 팩, 애플리케이션 코드 아님)
  - `.continue/mcpServers/new-mcp-server.yaml` (빈 MCP 템플릿)
  - `AGENTS.md`, `CLAUDE.md` (루트) — 헤딩만 확인, 전부 구버전 AI-DLC 워크플로 규칙
- **Left out**:
  - `node_modules/` (의존성)
  - `.next/` (Next.js 빌드 캐시)
  - `out/` (정적 export 산출물)
  - `tsconfig.tsbuildinfo` (TypeScript 증분 빌드 산출물)
  - `.claude/`, `aidlc/`, `aidlc.archive/`, `aidlc-docs/`, `.aidlc-rule-details/` (AI-DLC 설치/워크스페이스)
  - `.omc/`, `memory-claude-md` (에이전트 도구 캐시/메모)
  - `.env.local` (비밀값, gitignore 대상)

### Packages Found
- `ian-blog` — Next.js 앱(단일 패키지, 모노레포 아님) — TypeScript/TSX — Notion DB 2개와 로컬 마크다운을 합쳐 정적 export하는 개인 블로그

### Build System
- **Type**: yarn(`yarn.lock`) + Next.js 14 빌드(`next build`, `output: 'export'`), TypeScript `tsc --noEmit` 타입 체크
- **Config Files**: `package.json`, `next.config.js`, `tsconfig.json`(경로 별칭 `@/*` → `./src/*`), `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`
- **Build Dependencies**: `src/app/page.tsx` → `src/lib/content/repository.ts` → (`adapters/markdown-adapter.ts`, `adapters/notion-adapter.ts`, `normalize.ts`) → `src/types`, `src/lib/utils.ts`. 순환 참조 없음.

### APIs Discovered
- 페이지 라우트(App Router) — `src/app/` — 1개(`/`)만 존재. `/blog`, `/blog/[slug]`, `/about`, `/tags/[tag]` 라우트는 없음(링크만 존재)
- 내부 콘텐츠 API(TS 모듈) — `src/lib/content/repository.ts` — 7개 함수(`getPublishedPosts`, `getPostBySlug`, `getAllSlugs`, `getAllTags`, `getAllCategories`, `getPostsByTag`, `getPostsByCategory`)
- 어댑터 계약 — `src/lib/content/types.ts` `ContentSourceAdapter` — 2개 메서드(`listPosts`, `getPostBySlug`), 구현 3개(markdown, Notion 블로그 DB, Notion 브리핑 DB)
- 외부 API 사용 — Notion API(`@notionhq/client` `databases.query`, `notion-to-md` `pageToMarkdown`/`toMarkdownString`) — 빌드 타임에만 호출
- HTTP API 라우트(`route.ts`) — 없음

### Frameworks & Libraries
- next — 14.2.5 — App Router, 정적 export
- react / react-dom — 18.3.1 — UI
- @notionhq/client — 2.3.0(^2.2.15) — Notion DB 조회
- notion-to-md — 3.1.9(^3.1.1) — Notion 블록 → 마크다운 변환
- gray-matter — ^4.0.3 — 마크다운 frontmatter 파싱
- glob — ^13.0.6 — `content/posts/**/*.md` 탐색
- clsx / tailwind-merge — ^2.1.1 / ^2.4.0 — `cn()` 클래스 병합
- react-markdown — 9.1.0 — **설치되었으나 미사용**
- remark-gfm — 4.0.1 — **미사용**
- rehype-raw — 7.0.0 — **미사용**
- shiki — 1.29.2 — **미사용**
- @tailwindcss/typography — 0.5.19 — 플러그인 등록 및 테마 설정은 있으나 `prose` 클래스 사용처 없음
- tailwindcss — 3.4.19, typescript — 5.9.3, eslint — ^8.57.0(next/core-web-vitals + prettier), prettier — ^3.3.3

### Test Coverage
- **Test Directories**: 없음
- **Test Frameworks**: 없음(`package.json`에 test 스크립트/의존성 없음). 컴포넌트에 `data-testid` 속성은 다수 존재
- **Coverage Config**: absent

### Code Quality Indicators
- **Linting**: ESLint(`.eslintrc.json`, `next/core-web-vitals` + `prettier`), `yarn lint`; Prettier 설정 파일 없음(기본값); `tsc --noEmit` 스크립트; `strict: true`
- **CI/CD**: 파이프라인 파일 없음(`.github/` 등 부재)
- **Documentation**: README 없음. 콘텐츠 계층(`types.ts`, `notion-adapter.ts`)의 doc comment는 양호. 루트 `AGENTS.md`/`CLAUDE.md`는 AI-DLC 규칙 문서

### Technical Debt Signals
- `PostCard.tsx:14,17` — `sm:grid-cols-[180px_minmax(0,1fr)]` 2열 그리드가 `coverImage`가 없을 때도 유지되어, 본문 블록이 180px 첫 열에 배치됨(텍스트가 좁게 표시됨)
- `PostCard.tsx:45`, `page.tsx:77,86,133`, `Header.tsx:5-6`, `PostCard.tsx:64` — 존재하지 않는 라우트(`/blog/[slug]`, `/blog`, `/about`, `/tags/...`)로 링크 → 정적 export 결과에서 404
- `package.json:22-25` — react-markdown, remark-gfm, rehype-raw, shiki 미사용 의존성
- `next.config.js:8-34` — `output: 'export'`에서는 `headers()`가 적용되지 않음(보안 헤더는 CloudFront 등 호스팅 계층에서 별도 설정 필요)
- `notion-adapter.ts:143-147` — notion-to-md 결과의 Notion 업로드 이미지 URL은 만료되는 서명 URL이므로 정적 export 시 일정 시간 후 깨짐
- `notion-adapter.ts:185`, `content/posts/welcome-to-blog.md:33` — 삭제된 `aidlc-docs/construction/blog-v2/notion-setup-guide.md` 참조
- `package-lock.json` + `yarn.lock` 이중 lockfile; `tsconfig.tsbuildinfo` git 추적
- `layout.tsx:46` — `lang="en"`이지만 콘텐츠는 한국어 위주
- `Footer.tsx:17,26` — GitHub 링크 placeholder(`https://github.com`), 존재하지 않는 `/feed.xml`
- `src/types/index.ts:17` `SiteConfig`, `repository.ts`의 `getAllSlugs`/`getAllTags`/`getAllCategories`/`getPostsByTag`/`getPostsByCategory` — 현재 호출처 없음
- 테스트·CI 전무
- TODO/FIXME/HACK/eslint-disable 주석 0건

## Handoff Summary
- **Intent-relevant finding**: (1) 상세 화면이 없다 — `PostCard.tsx:45`가 `/blog/${post.slug}`로 링크하지만 `src/app/blog/[slug]/` 라우트가 없음. 데이터 계층은 이미 준비됨: `repository.ts:25-38` `getPostBySlug`가 Notion 어댑터(`notion-adapter.ts:165-181`)를 통해 `notion-to-md`로 본문 마크다운(`content`)을 가져오고, `getAllSlugs`(`repository.ts:40-43`)는 `generateStaticParams`에 바로 쓸 수 있음. 렌더링 의존성(react-markdown, remark-gfm, rehype-raw, shiki, @tailwindcss/typography)은 설치·설정만 되어 있고 미사용. (2) 아이템 폭 — `page.tsx:21`의 `max-w-6xl` + `lg:grid-cols-[220px_minmax(0,1fr)]` 사이드바 레이아웃과 `PostCard.tsx:14`의 `sm:grid-cols-[180px_minmax(0,1fr)]`, `PostCard.tsx:52`의 `max-w-2xl`가 폭을 제한하며, 커버 이미지가 없는 경우 본문이 180px 열에 갇히는 결함이 있음.
- **Risks / follow-up**: `next.config.js:3` `output: 'export'` → 상세 라우트는 `generateStaticParams` 필수(`dynamicParams = false` 권장), 빌드 시 슬러그마다 Notion 쿼리 3회(어댑터별) + 블록 조회가 발생하므로 Notion API 속도 제한(평균 3 req/s)에 유의. Notion 업로드 이미지 서명 URL 만료. rehype-raw 사용 시 원시 HTML 통과(CSP는 `unsafe-inline` 허용이며, 그마저 export에서는 미적용). `trailingSlash: true`로 상세 경로는 `/blog/<slug>/`. 기존 테스트가 없어 회귀 기준선이 없음.
