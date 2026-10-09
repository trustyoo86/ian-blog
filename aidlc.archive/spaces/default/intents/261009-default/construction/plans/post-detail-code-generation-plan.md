# Code Generation Plan - post-detail

## Unit Context
- **Unit**: post-detail
- **목표**: (1) 메인 화면 포스트 아이템 넓이 확대, (2) 아이템 클릭 시 Notion 본문이 포함된 상세 화면 제공
- **관련 계획**: blog-v2 Phase K Step 15 (`PostContent`), Step 18 (`blog/[slug]`) 선행 구현
- **의존성**: 기존 content repository (`getPostBySlug`, `getAllSlugs`) — Notion 본문은 `notion-to-md`로 이미 markdown 변환됨

## 요구사항 (minimal)
- FR-1: 메인 화면 각 포스트 아이템이 현재보다 넓게 표시된다.
- FR-2: 아이템(제목) 클릭 시 `/blog/{slug}/` 상세 화면으로 이동한다.
- FR-3: 상세 화면은 Notion 페이지 본문(markdown)을 렌더링한다 (GFM 표/체크리스트, 코드 블록 하이라이트 포함).
- NFR-1: `output: 'export'` 정적 빌드 유지 — `generateStaticParams`로 모든 slug 사전 생성.

## Step-by-Step Plan
- [ ] Step 1: `src/app/page.tsx` — 컨테이너 `max-w-6xl` → `max-w-7xl`, 좌측 aside 220px → 180px로 축소하여 본문 영역 확대
- [ ] Step 2: `src/components/blog/PostCard.tsx` — 이미지 열 180px → 240px, 설명 `max-w-2xl` 제한 제거, 카드 전체 클릭 영역 확대
- [ ] Step 3: `src/components/blog/PostContent.tsx` (신규) — react-markdown + remark-gfm + rehype-raw, 코드 블록은 shiki로 서버 사이드 하이라이트, `prose` 타이포그래피 적용
- [ ] Step 4: `src/app/blog/[slug]/page.tsx` (신규) — `generateStaticParams`, `generateMetadata`, `getPostBySlug`로 Notion 본문 로드, 없으면 `notFound()`
- [ ] Step 5: 품질 게이트 실행 (`yarn type-check`, `yarn lint`, `yarn build`) 및 `out/blog/<slug>/index.html` 생성 확인
- [ ] Step 6: aidlc-state.md / audit.md 갱신, blog-v2 계획의 Step 15, 18 체크

## Acceptance Criteria
- [ ] 데스크톱(1440px)에서 포스트 아이템 폭이 기존 대비 확대됨
- [ ] 제목 클릭 시 404 없이 상세 페이지로 이동
- [ ] 상세 페이지에 Notion 본문이 렌더링됨
- [ ] type-check / lint / build 통과

## 범위 외
- `/blog` 목록 페이지, 카테고리/태그 라우트 (Phase K Step 16-17, Phase L)
- Notion 이미지 URL 만료 대응 (signed URL 1시간 만료 — 정적 빌드 시점 URL 사용)
