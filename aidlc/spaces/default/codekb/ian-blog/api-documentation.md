# API 문서 — ian-blog

HTTP API(`route.ts`)는 없다. 정적 export 사이트이므로 "API"는 (1) 페이지 라우트, (2) 내부 콘텐츠 모듈 API, (3) 외부 Notion API 사용으로 구성된다.

## 1. 페이지 라우트

`trailingSlash: true`이므로 export 경로는 `/<path>/index.html`.

| 경로 | 파일 | 상태 | 데이터 |
|---|---|---|---|
| `/` | `src/app/page.tsx` | 존재 | `getPublishedPosts()` 상위 6개 |
| `/blog/<slug>/` | — | **없음**(`PostCard.tsx:45`에서 링크) | 예정: `getPostBySlug(slug)`, `generateStaticParams` ← `getAllSlugs()` |
| `/blog/` | — | **없음**(`page.tsx:77,133`, `Header.tsx:5`) | 후보: `getPublishedPosts()` |
| `/tags/<tag>/` | — | **없음**(`PostCard.tsx:64`) | 후보: `getPostsByTag()`, `getAllTags()` |
| `/about/` | — | **없음**(`page.tsx:86`, `Header.tsx:6`) | — |
| `/feed.xml` | — | **없음**(`Footer.tsx:26`) | — |

인증·속도 제한·미들웨어: 없음(정적 파일).

## 2. 내부 콘텐츠 API — `src/lib/content/repository.ts`

| 함수 | 시그니처 | 동작 | 현재 호출처 |
|---|---|---|---|
| `getPublishedPosts` | `() => Promise<BlogPost[]>` | 활성 어댑터 `listPosts()` 병합 → 충돌 검사 → 정규화 → 게시일 내림차순 | `page.tsx` |
| `getPostBySlug` | `(slug: string) => Promise<BlogPost \| null>` | 활성 어댑터 전부에 질의. 0건 `null`, 2건 이상 `SlugCollisionError`. Notion은 `content`(마크다운) 포함 | 없음 |
| `getAllSlugs` | `() => Promise<string[]>` | 게시글 슬러그 목록 | 없음 |
| `getAllTags` | `() => Promise<string[]>` | 정렬된 고유 태그 | 없음 |
| `getAllCategories` | `() => Promise<string[]>` | 정렬된 고유 카테고리 | 없음 |
| `getPostsByTag` | `(tag: string) => Promise<BlogPost[]>` | 태그 필터 | 없음 |
| `getPostsByCategory` | `(category: string) => Promise<BlogPost[]>` | 카테고리 필터 | 없음 |

### 계약: `ContentSourceAdapter` (`src/lib/content/types.ts`)

```ts
interface ContentSourceAdapter {
  readonly source: ContentSource      // 'notion' | 'markdown'
  readonly enabled: boolean
  listPosts(): Promise<RawPost[]>
  getPostBySlug(slug: string): Promise<RawPost | null>
}
```

### 데이터 모델

- `RawPost`: `id, title, slug, description, category: string|null, tags, publishedDate, coverImage: string|null, source, content?`
- `BlogPost`(`src/types/index.ts`): `RawPost`와 같고 `category: string`(기본 `Uncategorized`), `publishedDate`는 ISO 문자열, `readingTime?`(본문 있을 때만), `content?`(상세에서만 채워진다는 주석)
- 오류: `SlugCollisionError`(슬러그 중복), 마크다운 frontmatter의 `title`/`publishedDate` 누락 시 `Error`, 슬러그 누락 시 `Error`

## 3. 외부 API — Notion

| 호출 | 위치 | 용도 |
|---|---|---|
| `notion.databases.query` (페이지네이션, `start_cursor`) | `notion-adapter.ts:120-141` | 목록(게시 필터 + 게시일 정렬), 상세(슬러그 `rich_text equals` + 게시 필터) |
| `NotionToMarkdown.pageToMarkdown` / `toMarkdownString(...).parent` | `notion-adapter.ts:143-147` | 상세 본문 마크다운 변환(내부적으로 블록 children 재귀 조회) |

### Notion 속성 매핑

| 필드 | Blog Posts DB (`NOTION_DATABASE_ID`) | Briefing DB (`NOTION_BRIEFING_DATABASE_ID`) |
|---|---|---|
| title | `Title` | `Name` |
| slug | `Slug` (rich_text) | `Slug` (rich_text) |
| description | `Description` | `Description` |
| category | `Category` (select) | `Category` (select) |
| tags | `Tags` (multi_select) | `Tags` (multi_select) |
| publishedDate | `PublishedDate` (date) | `Date` (date) |
| coverImage | `CoverImage` (url) | 없음 |
| 게시 조건 | `Status` select = `Published` | `Slug` 비어있지 않음 AND (`Status` ∈ `NOTION_BRIEFING_STATUSES` OR `Blog Ready` = true) |
| 선두 제목 제거 | 아니오 | 예(`stripLeadingTitle`) |

인증: `NOTION_API_KEY`(서버 전용, `NEXT_PUBLIC_` 접두사 금지 — `.env.example` 명시). 환경 변수 목록은 [technology-stack.md](technology-stack.md) 참조.
