# 컴포넌트 인벤토리 — ian-blog

총 14개 컴포넌트. 각 항목: 위치 / 종류 / 책임 / 의존 대상 / 의도 영향.

## 페이지

### RootLayout
- 위치: `src/app/layout.tsx` / 서버 레이아웃
- 책임: `<html lang="en">`, 폰트(Inter→`--font-degular`, Lora→`--font-blanco`), 메타데이터 템플릿(`%s | SITE_NAME`), 테마 FOUC 방지 인라인 스크립트, `Header`/`main`/`Footer` 골격
- 의존: `Header`, `Footer`, `globals.css`, `next/font/google`
- 의도 영향: 없음(상세 페이지도 이 레이아웃을 공유)

### HomePage
- 위치: `src/app/page.tsx` / async 서버 페이지(`/`)
- 책임: 사이드바 인덱스 + 히어로 + 최근 글 6개(`RECENT_POSTS_LIMIT`)
- 의존: `ContentRepository`(`getPublishedPosts`), `PostList`
- 의도 영향: **높음** — 폭을 제한하는 `max-w-6xl`과 `lg:grid-cols-[220px_minmax(0,1fr)]` 사이드바 레이아웃 보유

## 블로그 UI

### PostList
- 위치: `src/components/blog/PostList.tsx` / 서버 컴포넌트
- 책임: 빈 상태 메시지 또는 `PostCard` 세로 목록(`grid`)
- 의존: `PostCard`
- 의도 영향: 중간 — 아이템 배치(1열 목록) 변경 시 수정

### PostCard
- 위치: `src/components/blog/PostCard.tsx` / 서버 컴포넌트
- 책임: 커버 이미지(선택), 날짜/카테고리/읽기 시간, 제목 링크(`/blog/<slug>`), 설명, 태그
- 의존: `TagBadge`, `Utils`(`formatDate`), `next/image`, `next/link`
- 의도 영향: **높음** — 카드 폭(`sm:grid-cols-[180px_minmax(0,1fr)]`, `max-w-2xl`)과 클릭 영역(현재 제목만 링크) 결정. 커버 없을 때 본문이 180px 열에 갇히는 결함

### TagBadge
- 위치: `src/components/blog/TagBadge.tsx` / 서버 컴포넌트
- 책임: 태그 칩(링크 또는 span, `active` 스타일)
- 의존: `Utils`(`cn`), `next/link`
- 의도 영향: 낮음 — 카드 전체를 링크로 만들 경우 중첩 `<a>` 회피 필요

## 레이아웃/공유

### Header
- 위치: `src/components/layout/Header.tsx` / 서버 컴포넌트
- 책임: 로고(`/`), 내비게이션(`/blog`, `/about`), `ThemeToggle`
- 의존: `ThemeToggle`
- 의도 영향: 없음

### Footer
- 위치: `src/components/layout/Footer.tsx` / 서버 컴포넌트
- 책임: 저작권, GitHub(placeholder), RSS(`/feed.xml`, 미존재) 링크
- 의존: 없음
- 의도 영향: 없음

### ThemeToggle
- 위치: `src/components/shared/ThemeToggle.tsx` / 클라이언트 컴포넌트
- 책임: `localStorage.theme` + `prefers-color-scheme` 기반 다크 클래스 토글
- 의존: React `useState`/`useEffect`
- 의도 영향: 없음(상세 본문 스타일은 다크 모드 토큰을 따라야 함)

## 콘텐츠 계층

### ContentRepository
- 위치: `src/lib/content/repository.ts` / Repository
- 책임: 어댑터 등록(`ADAPTERS`), 병합·충돌 검사·정규화·정렬, 7개 조회 함수 제공([api-documentation.md](api-documentation.md))
- 의존: `MarkdownAdapter`, `NotionAdapter`, `Normalize`, `ContentTypes`
- 의도 영향: **높음** — 상세 페이지가 `getPostBySlug`, `getAllSlugs` 사용(변경 없이 재사용 가능)

### NotionAdapter
- 위치: `src/lib/content/adapters/notion-adapter.ts` / Repository 어댑터(팩토리 `createNotionAdapter` + 인스턴스 `notionAdapter`, `notionBriefingAdapter`)
- 책임: Notion DB 페이지네이션 조회, 속성 매핑(`mapPageToRawPost`), 상세 본문 `notion-to-md` 변환, 선두 제목 제거(`stripLeadingTitle`)
- 의존: `@notionhq/client`, `notion-to-md`, `ContentTypes`
- 의도 영향: **높음** — 상세 본문의 원천. 이미지 서명 URL 만료, 속도 제한 리스크 보유

### MarkdownAdapter
- 위치: `src/lib/content/adapters/markdown-adapter.ts` / Repository 어댑터
- 책임: `content/posts/**/*.md` 탐색, frontmatter 검증(`status: published`, `title`·`publishedDate` 필수), 본문 포함 `RawPost` 반환
- 의존: `gray-matter`, `glob`, `node:fs/promises`
- 의도 영향: 중간 — 상세 페이지가 마크다운 글도 같은 렌더러로 보여줘야 함

### Normalize
- 위치: `src/lib/content/normalize.ts` / 도메인 규칙
- 책임: `RawPost → BlogPost`(카테고리 기본값, ISO 날짜, `readingTime`), `assertNoSlugCollisions`, `sortByPublishedDateDesc`
- 의존: `Utils`(`estimateReadingTime`), `ContentTypes`
- 의도 영향: 낮음

### ContentTypes
- 위치: `src/lib/content/types.ts`, `src/types/index.ts` / 모델
- 책임: `RawPost`, `ContentSourceAdapter`, `SlugCollisionError`, `BlogPost`, `ContentSource`, `SiteConfig`(미사용)
- 의존: 없음
- 의도 영향: 낮음 — `BlogPost.content`가 이미 상세 본문용으로 정의됨

### Utils
- 위치: `src/lib/utils.ts` / 유틸리티
- 책임: `cn`(clsx+tailwind-merge), `formatDate`(en-US 장문 날짜), `estimateReadingTime`(200 wpm, 공백 기준 단어 수)
- 의존: `clsx`, `tailwind-merge`
- 의도 영향: 낮음 — 상세 페이지 메타 표시에 재사용
