# 요구사항 — post-detail

## Intent Analysis

- **원 요청**: "메인 화면의 각 item의 넓이를 키우고, 클릭시 detail 화면에 notion의 내용이 포함되는 기능을 추가하려 함."
- **목표**: (1) 홈 화면의 글 목록 아이템이 좁게 보이는 문제를 해결하고, (2) 아이템을 클릭하면 404 대신 Notion 본문이 렌더링된 상세 화면을 보여준다.
- **유형**: 기존 기능 개선(BT1 홈 목록) + 신규 기능(BT2 글 상세). 근거: [business-overview.md](../../../../codekb/ian-blog/business-overview.md)
- **범위**: 홈 카드 컴포넌트, 신규 상세 라우트, 신규 Markdown 렌더링 컴포넌트, 테스트 도구 도입
- **복잡도**: 단순~표준. 데이터 계층(`getPostBySlug`, `getAllSlugs`, notion-to-md 변환)은 이미 구현돼 있다. 근거: [architecture.md](../../../../codekb/ian-blog/architecture.md) BT2
- **깊이**: Minimal

## Functional Requirements

### FR1 홈 아이템 폭 확대 (Q1 = A)

- **FR1.1** 커버 이미지가 없는 글의 카드는 1열 레이아웃으로 렌더링해 제목·메타·설명·태그가 목록 영역의 전체 폭을 사용해야 한다.
  - Given 커버 이미지가 없는 글, When 홈을 sm 이상 폭에서 렌더링하면, Then 카드에 `180px` 이미지 열이 생기지 않는다.
- **FR1.2** 커버 이미지가 있는 글은 지금처럼 이미지 열 + 본문 열의 2열 레이아웃을 유지한다.
  - Given 커버 이미지가 있는 글, When 홈을 렌더링하면, Then 이미지와 본문이 2열로 표시된다.
- **FR1.3** 카드 설명 문단의 폭 제한(`max-w-2xl`)을 제거한다.
- 페이지 컨테이너(`max-w-6xl`)와 왼쪽 Index 사이드바는 바꾸지 않는다(Q1에서 B·C를 선택하지 않음).

### FR2 카드 클릭 시 상세 이동 (Q2 = A)

- **FR2.1** 카드의 어느 부분(태그 제외)을 클릭해도 `/blog/{slug}/` 상세 화면으로 이동한다.
  - Given 홈의 카드, When 제목이 아닌 카드 빈 영역이나 설명을 클릭하면, Then 해당 글의 상세 화면으로 이동한다.
- **FR2.2** 카드 안의 태그는 계속 태그 링크(`/tags/{tag}`)로 동작하며 상세 이동을 일으키지 않는다. 링크 안에 링크가 중첩되는 HTML(`<a>` 안의 `<a>`)을 만들지 않는다.
  - Given 카드 안의 태그, When 태그를 클릭하면, Then 태그 링크로 이동하고 상세로 이동하지 않는다.
- **FR2.3** 키보드 사용자는 카드 링크로 포커스를 이동해 Enter로 상세에 들어갈 수 있다.

### FR3 상세 화면 (Q3 = A)

- **FR3.1** 게시된 모든 글에 대해 `/blog/{slug}/` 정적 페이지를 빌드 시점에 생성한다(`output: 'export'`이므로 `generateStaticParams` 사용).
  - Given 게시된 글 N개, When `yarn build`, Then `out/blog/{slug}/index.html`이 N개 생성된다.
- **FR3.2** 상세 화면에는 제목, 게시일, 카테고리, 읽기 시간(있을 때), 태그를 표시한다.
- **FR3.3** Notion 글의 본문(notion-to-md 변환 결과)을 렌더링한다. 지원 요소는 문단, 제목, 목록, 표, 체크리스트, 인용, 링크, 이미지, 코드 블록이다. 마크다운 원천 글도 같은 방식으로 렌더링한다.
- **FR3.4** 코드 블록은 언어별 문법 하이라이트를 적용한다.
- **FR3.5** 이미지는 Notion이 준 URL을 그대로 사용한다(만료 대응은 범위 외).
- **FR3.6** 존재하지 않는 slug는 404로 처리한다.
- **FR3.7** 상세 화면 제목·설명으로 페이지 메타데이터(`<title>`, description)를 설정한다.
- **FR3.8** 상세 화면에서 홈으로 돌아가는 링크를 제공한다.

## Non-Functional Requirements

- **NFR1 (테스트, Q4 = B)**: Vitest를 도입하고 다음 로직에 단위 테스트를 둔다. 카드 레이아웃 분기(FR1.1/FR1.2), 카드 링크와 태그 링크의 비중첩(FR2.2), Markdown 렌더링의 표·코드·체크리스트 출력(FR3.3/FR3.4). `yarn test`로 실행하며 모두 통과해야 한다.
- **NFR2 (품질 게이트)**: `yarn type-check`, `yarn lint`, `yarn test`, `yarn build`가 모두 성공해야 한다.
- **NFR3 (보안)**: Notion 본문의 raw HTML은 렌더링하지 않는다. 정적 export 모드에서는 `next.config.js`의 `headers()` CSP가 적용되지 않으므로, 임의 HTML 삽입 경로를 만들지 않는다. 근거: [architecture.md](../../../../codekb/ian-blog/architecture.md) Key Design Decisions
- **NFR4 (빌드 성능)**: 상세 페이지 생성은 기존 데이터 계층을 그대로 쓴다. 현재 글 수(수십 개 이하) 기준으로 Notion 속도 제한(평균 초당 3회)에 걸리지 않아야 한다. 빌드 중 429 오류가 나면 이를 실패로 보고한다.
- **NFR5 (접근성)**: 카드 링크에는 글 제목이 접근 가능한 이름으로 노출되어야 한다. 상세 본문은 의미 있는 제목 계층(h1 = 글 제목)을 유지한다.
- **NFR6 (스타일 일관성)**: 기존 디자인 토큰(HSL 변수)과 Tailwind 유틸리티, `@tailwindcss/typography`의 `prose`를 사용하고 다크 모드에서도 읽을 수 있어야 한다.

## Constraints

- Next.js 14.2.5 App Router, React 18, TypeScript, Tailwind 3. `output: 'export'` 정적 빌드. 근거: `package.json`, [code-structure.md](../../../../codekb/ian-blog/code-structure.md)
- 이미 설치된 렌더링 의존성(react-markdown, remark-gfm, shiki, @tailwindcss/typography)을 우선 사용한다. 새 런타임 의존성은 추가하지 않는다. 개발 의존성은 테스트 도구(Vitest와 렌더링 테스트에 필요한 최소 패키지)만 추가한다.
- 상세 데이터는 기존 `getPostBySlug` / `getAllSlugs`를 사용한다.

## Assumptions

- Notion 이미지는 대부분 외부 URL이거나, 만료되더라도 이번 작업에서는 허용한다(Q3 = A). 담당: 블로그 소유자.
- 빌드 환경에 `NOTION_API_KEY`와 DB ID가 설정되어 있다. 설정이 없으면 Notion 어댑터가 비활성화되고 마크다운 글만 상세 페이지가 생성된다.
- 본문에 raw HTML이 필요한 Notion 블록(임베드 등)은 텍스트나 링크로만 보이거나 생략되어도 된다(NFR3).

## Out of Scope

- Notion 이미지 다운로드·재호스팅(만료 대응)
- `/blog` 전체 목록, `/tags/{tag}`, `/about` 라우트
- 페이지 컨테이너 폭 변경, Index 사이드바 제거
- 목차(TOC), 이전/다음 글, 댓글, SEO 구조화 데이터, RSS
- CI 파이프라인 구성

## Open Questions

- 없음. 이미지 만료 대응은 다음 작업 후보로 남긴다.
