# 블로그 상세 화면 구현 계획 — `/blog/[slug]`

## 1. 요구사항 요약

`/blog/[slug]` 동적 라우트를 신설해 단일 글 상세 화면을 구현한다. 콘텐츠 추상화 계층([repository.ts](../../src/lib/content/repository.ts))은 이미 완성되어 있어 데이터 조회는 그대로 재사용하고, **렌더링 계층(라우트 + Markdown 렌더 + 부가 UI)만** 추가한다.

### 확정된 결정 사항 (사용자 승인)
| 항목 | 결정 |
|---|---|
| 작업 범위 | **상세 화면만** (`/blog` 목록 인덱스는 별도 작업으로 분리) |
| 코드 구문 강조 | **shiki 서버 사전 렌더** (빌드 타임 HTML 변환) |
| 부가 요소 | 커버 이미지 + 메타 헤더, SEO/OG 메타데이터, 목차(TOC) |
| 제외 | 이전/다음 글 네비게이션 (이번 범위 밖) |

### 환경 제약 (코드베이스 확인 사실)
- **정적 내보내기**: [next.config.js](../../next.config.js)에 `output: 'export'` → 모든 경로는 `yarn build` 시점에 사전 생성. 런타임 SSR/ISR 없음 → `generateStaticParams()`가 **완전(exhaustive)**해야 함, `dynamicParams`는 사실상 `false`.
- **이미지**: `images.unoptimized: true` → `next/image` 그대로 사용 가능 (PostCard와 동일 패턴).
- **CSP**: `style-src 'self' 'unsafe-inline'` 설정됨 → shiki가 생성하는 인라인 `style` 속성 허용됨. 외부 스크립트/스타일은 차단되므로 인라인 CSS만 사용.
- **Next.js 14.2.5 / React 18.3.1** (App Router) — `package.json` 기준. (CLAUDE.md의 16/19 표기는 실제와 불일치, 실제 버전 기준으로 구현.)
- **typography 플러그인** 등록됨([tailwind.config.ts:33-45](../../tailwind.config.ts)), `prose` 색상은 CSS 변수(`--foreground` 등)로 다크모드 대응 중.
- **shiki 설치 버전**: `package.json`은 `^1.12.1`이나 `node_modules` 실제 해석 버전은 **1.29.2**. 신규 shiki 관련 dep은 이 버전에 맞춰 핀 고정해야 함(§Step 9, R7).

## 2. 아키텍처 / 핵심 설계 결정

### 결정 D1 — Markdown 렌더링: react-markdown 대신 unified 파이프라인 사용
**문제**: shiki의 `codeToHtml`는 **비동기**인데 `react-markdown`은 **동기 렌더**라 rehype 단계에서 async shiki 플러그인을 직접 끼울 수 없다.

**채택**: Server Component(빌드 타임)에서 unified 파이프라인을 직접 구성해 Markdown → HTML 문자열로 변환하고 `prose` 컨테이너에 `dangerouslySetInnerHTML`로 주입한다.

```
remark-parse → remark-gfm → (H1 데모트 plugin) → remark-rehype(allowDangerousHtml)
  → rehype-raw → rehype-slug → @shikijs/rehype → (TOC 수집 plugin) → rehype-stringify(allowDangerousHtml)
```

- `remark-gfm`, `rehype-raw`는 CLAUDE.md 가이드라인대로 **유지** (테이블/체크박스 + 원시 HTML 지원).
- 정적 내보내기라 비동기 변환이 **빌드 시 1회** 실행 → 런타임 비용 0, 클라이언트 JS 0. (Server Component가 `output: 'export'`에서 빌드 타임 실행되므로 async shiki 정상 동작 — 검증됨.)
- **가이드라인 편차 명시**: CLAUDE.md는 "본문은 react-markdown 사용"을 권장하지만, `output: 'export'` + async shiki 제약상 본문 본체에 한해 unified 파이프라인을 사용한다. (목록/카드 등 동기 렌더 영역은 기존 방식 유지.)
- **대안(편차 회피)**: react-markdown을 유지하려면 코드 블록을 사전 하이라이트해 content-key 맵으로 주입해야 하는데, 공백/이스케이프 불일치로 깨지기 쉬워 비권장. → §리스크 R1.
- **플러그인 순서는 load-bearing — 재배치 금지** (Critic MAJOR#3):
  - `rehype-raw`가 `rehype-slug`보다 **먼저** 와야 함: 원시 HTML 내 heading이 hast 트리로 재파싱된 뒤에야 slug가 id를 부여할 수 있음. 순서가 바뀌면 원시 HTML heading의 TOC 앵커가 누락됨.
  - `@shikijs/rehype`는 `rehype-raw` 뒤(코드 펜스가 hast에 존재한 후), `rehype-stringify` 앞.
  - `remark-rehype`는 `{ allowDangerousHtml: true }`, **그리고** `rehype-stringify`도 `{ allowDangerousHtml: true }` **둘 다 필수** — 후자를 빠뜨리면 원시 HTML이 출력 단계에서 이스케이프됨.
- **본문 H1 처리** (Critic MAJOR#1): 제목은 `PostHeader`가 `h1`으로 렌더하므로, 본문에 H1이 있으면 한 페이지에 H1이 둘 생겨 SEO/a11y 결함. 마크다운 샘플 [content/posts/welcome-to-blog.md:14](../../content/posts/welcome-to-blog.md)가 `# Welcome`으로 시작함.
  - **계약**: 본문 H1 금지(제목은 frontmatter/PostHeader 담당).
  - **방어**: 파이프라인에 소형 remark 플러그인을 넣어 본문 `h1`을 `h2`로 데모트(이후 depth는 그대로). Notion `pageToMarkdown`은 페이지 제목을 블록으로 내보내지 않아 보통 H1 미생성이나, 두 소스 모두에 동일 적용해 안전.
  - TOC는 데모트 후 `h2/h3` 수집이므로 데모트된 H1이 최상위 TOC 항목으로 표시됨.

### 결정 D2 — TOC ID 일치
`rehype-slug`가 부여한 heading `id`를 **그 다음 단계의 소형 rehype 플러그인**이 hast를 순회하며 수집한다. 별도 slugger를 쓰지 않으므로 앵커 링크(`#id`)와 본문 heading id가 100% 일치한다. 수집 대상은 `h2`, `h3`.

### 결정 D3 — shiki 듀얼 테마
`@shikijs/rehype`를 다음으로 설정한다:
```ts
{ themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false }
```
- **`defaultColor: false` 필수** (Critic MAJOR#2): 이 옵션이 없으면 shiki는 light 색상을 인라인 `color:`로 박고 dark는 일부만 변수로 내보내, `.dark .shiki` 토글이 동작하지 않는다. `defaultColor: false`일 때만 `--shiki`/`--shiki-dark`(전경), `--shiki-bg`/`--shiki-dark-bg`(배경) 변수가 일관되게 출력된다.
- `globals.css`에서 `.dark` 컨텍스트일 때 `--shiki-dark*`를 사용하도록 토글(§Step 8). 다크모드는 기존 `darkMode: 'class'`와 일관.
- shiki 버전별로 변수 출력 형태가 다르므로 **버전 핀(§Step 9, R7) 후** 실제 산출 HTML의 변수명을 확인하고 CSS 셀렉터를 맞춘다.

### 결정 D4 — shiki highlighter 싱글톤
`createHighlighter()`는 비용이 크므로 모듈 레벨 캐시(Promise memo)로 1회만 생성. 빌드 시 여러 글을 렌더해도 재초기화 방지.

## 3. 구현 단계

> 체크박스는 실행 단계에서 업데이트.

### Step 1 — 타입 추가
- [ ] [src/types/index.ts](../../src/types/index.ts)에 `TocItem` 추가:
  ```ts
  export interface TocItem { id: string; text: string; depth: 2 | 3 }
  ```

### Step 2 — Markdown 렌더 유틸 (신규)
- [ ] `src/lib/content/markdown-render.ts` 생성.
  - `export async function renderMarkdown(content: string): Promise<{ html: string; toc: TocItem[] }>`
  - unified 파이프라인 구성(§D1). `toc` 배열은 클로저로 캡처해 수집 플러그인이 push.
  - `rehype-stringify`에 `{ allowDangerousHtml: true }` 명시(§D1, 누락 시 원시 HTML 이스케이프됨).
  - shiki highlighter는 모듈 레벨 `let highlighterPromise` 메모이즈(§D4). `@shikijs/rehype`는 내부적으로 highlighter를 관리하므로, 옵션에 사용 테마만 지정하면 됨(별도 createHighlighter 불필요할 수 있음 — 구현 중 `@shikijs/rehype` API 확인).
  - **H1 데모트 remark 플러그인**(인라인, ~8줄): `unist-util-visit`로 `heading` 노드 중 `depth === 1`을 `depth = 2`로 변경(§D1 본문 H1 처리).
  - **TOC 수집 rehype 플러그인**(인라인): hast를 순회하며 `h2`/`h3` 요소의 `properties.id`와 **전체 하위 텍스트**를 추출. 텍스트는 **`hast-util-to-string` 사용**(Critic MAJOR#4) — 단순 `children` join은 `## \`useState\`` 같은 inline code/링크/강조가 든 heading에서 빈/잘린 텍스트가 됨. (`hast-util-to-string`은 `@shikijs/rehype` 전이 의존이나, 명시적 직접 추가 권장.)

### Step 3 — 본문 렌더 컴포넌트 (신규)
- [ ] `src/components/blog/MarkdownContent.tsx` 생성 (Server Component).
  - props: `{ html: string }`
  - `<div className="prose prose-neutral max-w-none dark:prose-invert ..." dangerouslySetInnerHTML={{ __html: html }} />`
  - prose의 기본 `pre`/`code` 배경이 shiki 배경을 가리지 않도록 클래스 조정(§리스크 R3, globals.css에서 보강).

### Step 4 — 목차 컴포넌트 (신규)
- [ ] `src/components/blog/TableOfContents.tsx` 생성.
  - props: `{ items: TocItem[] }`. `items`가 비면 `null` 반환.
  - `h2`/`h3` 들여쓰기 구분, `<a href={'#'+id}>` 앵커 목록. 데스크탑에서 `lg:` 사이드 표시, 모바일에서는 본문 상단 접이식 또는 숨김(Tailwind 반응형).
  - 기본은 **정적 앵커 리스트**(서버 컴포넌트). 스크롤 스파이(활성 강조)는 선택적 후속 — 필요 시 `"use client"` 분리. 이번 범위는 정적.

### Step 5 — 상세 헤더 컴포넌트 (신규)
- [ ] `src/components/blog/PostHeader.tsx` 생성 (Server Component).
  - props: `{ post: BlogPost }`
  - 커버 이미지(`next/image`, `post.coverImage` 있을 때만, PostCard와 동일 패턴), 카테고리 배지, 제목(`h1`), 메타(발행일 `formatDate`, `readingTime` "min read"), 태그(`TagBadge`, `href={/tags/...}` — 기존 PostCard와 동일 링크 규칙).
  - `readingTime`은 [PostCard.tsx:59](../../src/components/blog/PostCard.tsx#L59)와 동일하게 `post.readingTime && (...)` 가드로 렌더(상세 페이지는 항상 content가 있어 정의되지만 0/undefined 안전망 유지).

### Step 6 — 동적 라우트 페이지 (신규, 핵심)
- [ ] `src/app/blog/[slug]/page.tsx` 생성 (async Server Component).
  - `export async function generateStaticParams()` → `(await getAllSlugs()).map((slug) => ({ slug }))` (§정적 내보내기 필수).
  - `export const dynamicParams = false`
  - `export async function generateMetadata({ params }): Promise<Metadata>`:
    - `getPostBySlug(decodeURIComponent(params.slug))`. null이면 최소 메타(`title: 'Not Found'`) 반환.
    - `title`(layout 템플릿 `%s | SITE_NAME`과 결합), `description`, `openGraph`(title/description/`type:'article'`/`publishedTime`/`images:[coverImage]`), `twitter`(`summary_large_image`).
    - **OG 이미지 URL 주의**(Critic minor#1): [layout.tsx:16](../../src/app/layout.tsx#L16)는 `NEXT_PUBLIC_SITE_URL`이 있을 때만 `metadataBase`를 설정. 미설정 시 상대 `coverImage`가 그대로 출력되고 Next가 빌드 경고. `coverImage`는 보통 절대 URL(Notion CDN)이라 안전하나, 상대 경로 가능성 있으면 `metadataBase` 의존 또는 절대화 필요 — 구현 시 확인.
  - 기본 export `Page({ params })`:
    1. `const post = await getPostBySlug(decodeURIComponent(params.slug))`
    2. `if (!post) notFound()`
    3. `const { html, toc } = await renderMarkdown(post.content ?? '')` (빈 content면 `html === ''` → `MarkdownContent`가 빈 prose div 렌더, 정상)
    4. 레이아웃: `<article>` 컨테이너(`mx-auto max-w-3xl px-4 py-16`, 홈과 동일 규격) → `<PostHeader>` + (`<TableOfContents>` aside + `<MarkdownContent>`). TOC는 `lg` 이상에서 좌/우 배치. **TOC가 `null`(heading 없음)일 때 `<article>`이 전체 폭으로 reflow되어 빈 거터가 남지 않도록** 레이아웃 구성(예: TOC 존재 여부로 grid 컬럼 조건 분기).
  - **slug 인코딩**(Critic 미확인 항목): `generateStaticParams`는 raw slug를 넘기고 Page는 `decodeURIComponent` 사용. 현 slug는 ASCII(`welcome-to-blog`)라 즉시 위험 낮으나, 한글 등 non-ASCII slug 도입 시 `generateStaticParams` ↔ `decodeURIComponent` 왕복을 명시 검증할 것.

### Step 7 — 글 없음 처리 (신규, 선택)
- [ ] `src/app/blog/[slug]/not-found.tsx` 생성: 간단한 "글을 찾을 수 없습니다" + **`/` 링크만**(Critic minor#3 — `/blog`는 아직 404이므로 이번엔 홈 링크만). (정적 내보내기에서도 404 페이지로 생성됨.)

### Step 8 — 스타일 보강
- [ ] [src/styles/globals.css](../../src/styles/globals.css)에 추가:
  - shiki 듀얼 테마 토글(§D3, `defaultColor: false` 전제):
    ```css
    .shiki, .shiki span { color: var(--shiki); background-color: var(--shiki-bg); }
    .dark .shiki, .dark .shiki span { color: var(--shiki-dark); background-color: var(--shiki-dark-bg); }
    ```
    실제 산출 HTML의 변수명을 빌드 후 확인해 정확히 맞출 것(버전 의존, R7).
  - `prose pre`의 기본 배경/패딩이 shiki와 충돌하지 않도록 `prose :where(pre) { background: transparent; padding: 0 }` 류 보정(shiki `pre.shiki`가 자체 배경/패딩 가짐). **정확한 셀렉터는 구현 중 확인 — `.shiki` 대비 specificity 고려**(Critic 모호성 지적).

### Step 9 — 의존성 설치 (버전 핀 필수)
- [ ] **shiki 1.29.2에 맞춰 핀 고정** (Critic CRITICAL#1 — 무제약 설치 시 `@shikijs/rehype@4`가 설치되어 shiki v4를 끌어와 충돌):
  ```bash
  yarn add @shikijs/rehype@^1.29.0 hast-util-to-string@^3 rehype-slug@^6 rehype-stringify@^10 \
           remark-parse@^11 remark-rehype@^11 unified@^11 unist-util-visit@^5
  ```
  - **이미 설치됨(재사용)**: `remark-gfm`, `rehype-raw`, `shiki`(1.29.2). `unified`/`remark-parse`/`remark-rehype`는 react-markdown 전이 의존으로 이미 `node_modules`에 11.x 존재 — 직접 추가 시 동일 11.x 유지.
  - 설치 후 `node_modules/shiki/package.json`이 **1.x 단일 버전**인지 확인(v4 중복 유입 없을 것).
  - 대안: `@shikijs/rehype` 대신 기존 `shiki`(1.29.2)의 `codeToHast`로 ~20줄 커스텀 rehype 변환기를 작성하면 dep 1개 절감 + 버전 충돌 원천 차단 가능(트레이드오프: 직접 유지보수).

### Step 10 — 검증
- [ ] §6 검증 절차 수행.

## 4. 신규 의존성

| 패키지 | 용도 | 비고 |
|---|---|---|
| `unified` | 파이프라인 코어 | react-markdown 전이 의존이나 직접 추가 |
| `remark-parse` | MD 파싱 | |
| `remark-rehype` | mdast→hast | |
| `rehype-stringify` | hast→HTML 문자열 | |
| `rehype-slug` | heading id 부여(TOC 앵커) | |
| `@shikijs/rehype` | shiki 코드 하이라이트 | 커스텀 변환기로 대체 가능 |

이미 설치됨(재사용): `remark-gfm`, `rehype-raw`, `shiki`, `@tailwindcss/typography`, `clsx`, `tailwind-merge`.

## 5. 인수 기준 (테스트 가능)

1. `yarn build` 성공, `out/` 아래 발행된 각 slug에 대해 `out/blog/<slug>/index.html`이 생성된다(`trailingSlash: true` 기준).
2. 존재하는 slug의 상세 페이지가 제목·발행일·읽기 시간·태그·(있으면)커버 이미지를 렌더한다.
3. 본문 Markdown이 HTML로 렌더되며, fenced code block이 shiki 클래스(`.shiki`)와 인라인 색상 `style`을 포함한다(빌드 산출 HTML에서 `class="shiki` 문자열 검색으로 확인).
4. GFM 테이블/체크박스가 정상 렌더된다(`remark-gfm` 동작 확인).
5. TOC가 본문의 `h2`/`h3`만큼 항목을 가지며, 각 앵커 `href="#id"`가 본문 heading의 `id`와 정확히 일치한다(클릭 시 해당 위치로 이동).
6. 다크모드 토글 시 코드 블록 색상이 다크 테마로 전환된다(`.dark .shiki` 규칙 적용).
7. `generateMetadata`가 글 제목을 `<title>`(`%s | SITE_NAME`)에, description/OG image를 `<head>`에 출력한다(빌드 HTML `<meta property="og:*">` 확인).
8. `yarn type-check` 통과(`tsc --noEmit` 오류 0).
9. `yarn lint` 통과(신규 파일 ESLint 오류 0).
10. 발행되지 않은/존재하지 않는 slug는 `generateStaticParams`에서 제외되어 빌드 산출물에 없다(`notFound()` 경로는 타입/안전망 용도).
11. **(H1)** 렌더된 상세 페이지 HTML에 `<h1>`이 **정확히 1개**(PostHeader 제목)다. 본문에 `# ...`가 있어도 `<h2>`로 데모트된다(빌드 HTML에서 `<h1` 개수 = 1 확인).
12. **(dep 핀)** 설치 후 `node_modules`에 shiki가 **1.x 단일 버전**만 존재(`yarn why shiki` 또는 `node_modules/shiki/package.json` 확인). v4 중복 없음.
13. **(다크모드 변수)** 산출 HTML의 `.shiki` 마크업이 `--shiki`/`--shiki-dark`(+ `*-bg`) 변수를 포함한다(`defaultColor: false` 적용 확인 — grep).

## 6. 검증 단계

```bash
yarn type-check     # tsc --noEmit
yarn lint           # eslint
yarn build          # 정적 내보내기 — 모든 slug 사전 생성 성공 확인
# 산출물 확인 (markdown 어댑터의 published 글이 최소 1개 있을 때)
ls out/blog/        # slug 디렉토리 존재
grep -l "class=\"shiki" out/blog/*/index.html   # shiki 하이라이트 적용 확인
```
- 로컬 시각 확인: `yarn dev` → `/blog/<slug>` 접속해 헤더/본문/TOC/다크모드 육안 검증.
- 마크다운 published 글이 없으면 `content/posts/`에 검증용 임시 글(테이블·코드블록·h2/h3 포함) 추가 후 확인, 검증 끝나면 제거 여부 결정.

## 7. 리스크 및 완화

| ID | 리스크 | 영향 | 완화 |
|---|---|---|---|
| R1 | react-markdown 가이드라인 편차 | 컨벤션 불일치 우려 | §D1에 사유 명시(async shiki + static export). remark-gfm/rehype-raw는 유지. 사용자가 react-markdown 고수 원하면 사전 하이라이트 방식으로 전환 가능(비권장). |
| R2 | shiki `dangerouslySetInnerHTML` 주입 | XSS 우려 | 콘텐츠 출처가 본인 Notion/markdown(신뢰 소스). rehype-raw가 원시 HTML 허용하므로 신뢰 소스 전제 유지. 외부 기여 콘텐츠 도입 시 `rehype-sanitize` 추가 검토. |
| R3 | prose 기본 `pre/code` 스타일과 shiki 배경 충돌 | 코드 블록 이중 배경/여백 | §Step 8에서 prose pre 배경/패딩 초기화. |
| R4 | shiki 번들/빌드 시간 증가 | 빌드 지연 | highlighter 싱글톤(§D4) + 사용 언어 lazy 로딩으로 완화. 정적 빌드라 런타임 영향 0. |
| R5 | 깨진 링크(`/blog` 목록 부재) | 홈 CTA·PostCard·not-found 링크가 여전히 404 | 이번 범위 밖임을 명시. `/blog` 목록은 후속 작업으로 분리(권장 즉시 후속). |
| R6 | Notion 미설정 환경에서 빌드 | markdown 어댑터만 동작 | 어댑터가 `enabled` 가드 보유([notion-adapter.ts:28-30](../../src/lib/content/adapters/notion-adapter.ts)) → markdown 글만으로도 빌드 성공. |
| R7 | **`@shikijs/rehype` 버전 충돌** (Critic CRITICAL) | 무제약 설치 시 v4가 shiki v4를 끌어와 D3/D4 설정과 불일치 → 빌드/렌더 분기 | §Step 9 버전 핀(`@shikijs/rehype@^1.29.0`), 설치 후 shiki 단일 1.x 검증(인수기준#12). |
| R8 | **본문/제목 이중 H1** (Critic MAJOR) | SEO/a11y 결함, 제목 중복 | H1 데모트 remark 플러그인(§D1/Step 2), 인수기준#11. |
| R9 | **듀얼테마 CSS 미작동** (Critic MAJOR) | 다크모드 코드색 전환 실패(그린 게이트 통과해도 육안 결함) | `defaultColor: false`(§D3) + 변수명 검증(인수기준#13). |
| R10 | TOC 텍스트 추출 누락 (Critic MAJOR) | inline code/링크 든 heading의 TOC 항목 공란 | `hast-util-to-string`로 깊은 텍스트 추출(§Step 2). |

## 8. 범위 밖 / 후속 권장

- `/blog` 목록 인덱스 페이지 (홈/PostCard 링크 정상화 — **가장 우선되는 후속**)
- `/tags/[tag]`, `/categories/[category]` 라우트 (TagBadge가 `/tags/...` 링크 중)
- TOC 스크롤 스파이(활성 항목 강조), 코드 복사 버튼, 이전/다음 글 네비게이션

## 9. 리뷰 반영 변경 이력 (Critic --review, 2026-06-01)

**판정: REVISE** → 아래 반영 후 APPROVE 기준 충족.

| 등급 | 지적 | 반영 |
|---|---|---|
| CRITICAL | `@shikijs/rehype` 무제약 설치 → shiki v4 충돌 | Step 9 버전 핀, R7, 인수기준#12 |
| MAJOR | 본문/제목 이중 H1 | D1 H1 데모트 플러그인, Step 2, R8, 인수기준#11 |
| MAJOR | 듀얼테마 CSS 미작동(`defaultColor` 누락) | D3 `defaultColor: false`, Step 8 CSS 수정, R9, 인수기준#13 |
| MAJOR | 플러그인 순서 근거 부재 + `rehype-stringify` allowDangerousHtml 누락 | D1 순서 lock 명시 + Step 2 stringify 옵션 |
| MAJOR | TOC 텍스트 추출(inline 자식) 미흡 | Step 2 `hast-util-to-string` |
| minor | OG 이미지 절대 URL/`metadataBase` | Step 6 generateMetadata 주의 |
| minor | not-found가 404인 `/blog` 링크 | Step 7 `/` 링크만 |
| minor | shiki 해석 버전 미기재 | §1에 1.29.2 명기 |
| gap | 빈 content / heading 없는 글 레이아웃 reflow | Step 6 |
| gap | non-ASCII slug 왕복 | Step 6 |

**검증자가 확인한 정확성**: 콘텐츠 계층 재사용(getPostBySlug/getAllSlugs), PostCard 링크/이미지 패턴, typography 플러그인, 정적 내보내기 빌드타임 async shiki 동작, react-markdown 편차 정당성 — 모두 정확함으로 확인됨.
