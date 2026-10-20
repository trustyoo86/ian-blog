# 코드 구조 — ian-blog

## 디렉터리 구성

```text
ian-blog/
├── content/posts/            마크다운 글 원천 (welcome-to-blog.md 1개)
├── src/
│   ├── app/                  App Router: layout.tsx, page.tsx (라우트는 "/" 하나)
│   ├── components/
│   │   ├── blog/             PostList, PostCard, TagBadge
│   │   ├── layout/           Header, Footer
│   │   └── shared/           ThemeToggle (유일한 "use client")
│   ├── lib/
│   │   ├── content/          repository, types, normalize
│   │   │   └── adapters/     markdown-adapter, notion-adapter
│   │   └── utils.ts          cn, formatDate, estimateReadingTime
│   ├── styles/globals.css    디자인 토큰(HSL CSS 변수), 라이트/다크
│   └── types/index.ts        BlogPost, ContentSource, SiteConfig
├── next.config.js            output: 'export', trailingSlash, images.unoptimized, headers
├── tailwind.config.ts        darkMode: class, 토큰 색상, typography 플러그인
└── package.json / yarn.lock / package-lock.json
```

## 파일 분류

| 분류 | 파일 |
|---|---|
| Controller/Handler(페이지) | `src/app/page.tsx`, `src/app/layout.tsx` |
| UI 컴포넌트(Static/Asset 성격) | `src/components/**/*.tsx` |
| Repository/DAO | `src/lib/content/repository.ts`, `adapters/markdown-adapter.ts`, `adapters/notion-adapter.ts` |
| Service(도메인 규칙) | `src/lib/content/normalize.ts` |
| Model/Entity | `src/types/index.ts`, `src/lib/content/types.ts` |
| Utility | `src/lib/utils.ts` |
| Configuration | `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `.eslintrc.json`, `.env.example` |
| Static/Asset | `src/styles/globals.css`, `content/posts/*.md` |
| Test / Migration | 없음 |

## 코드 패턴과 관례

- **서버 컴포넌트 기본**: `ThemeToggle`만 클라이언트 컴포넌트. 페이지는 `async` 함수로 빌드 시 데이터를 가져온다.
- **경로 별칭**: `@/*` → `src/*`.
- **어댑터 패턴**: 원천마다 `ContentSourceAdapter`(`source`, `enabled`, `listPosts`, `getPostBySlug`) 구현, 저장소의 `ADAPTERS` 배열에 등록.
- **RawPost → BlogPost 정규화** 2단계 모델.
- **스타일**: Tailwind 유틸리티 + HSL 토큰(`bg-background`, `text-muted-foreground`, `border-border`), 임의값 그리드(`grid-cols-[220px_minmax(0,1fr)]`), `cn()`로 클래스 병합.
- **테스트 훅**: 컴포넌트에 `data-testid` 일관 부여(테스트 코드는 없음).
- **포맷 관례 혼재**: `src/lib/**`·`src/types`는 세미콜론 없음+작은따옴표, `src/app/**`·`src/components/**`는 세미콜론+큰따옴표. Prettier 설정 파일이 없어 `yarn format` 실행 시 전체가 기본값(세미콜론, 큰따옴표)으로 바뀐다.

## 의도 관련 위치

- 홈 레이아웃 폭: `src/app/page.tsx:21`(`max-w-6xl`, 사이드바 `220px` 열), `:53`(히어로 내부 `220px` 열)
- 카드 레이아웃: `src/components/blog/PostCard.tsx:14`(`sm:grid-cols-[180px_minmax(0,1fr)]`), `:18`(커버 이미지 박스), `:52`(`max-w-2xl` 설명)
- 상세 라우트 신설 위치(관례상): `src/app/blog/[slug]/page.tsx`
