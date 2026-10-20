# 단위 테스트 지침 — post-detail

## Test Framework Setup

- 러너: Vitest(개발 의존성), 환경 `jsdom`
- 렌더링: `@testing-library/react`, 단언 확장 `@testing-library/jest-dom`(`vitest.config.ts`의 `setupFiles`에서 `@testing-library/jest-dom/vitest` 로드)
- JSX 변환: `@vitejs/plugin-react`
- 경로 별칭: `@/` → `src/`(`tsconfig.json`과 동일)
- 테스트 위치: 대상 파일 옆 `*.test.tsx`, `vitest.config.ts`의 `include: ["src/**/*.test.{ts,tsx}"]`

## How to Run This Work's Tests

이 작업의 테스트만 실행하는 정확한 명령(파일 경로 지정):

```bash
yarn vitest run src/components/blog/PostCard.test.tsx src/components/blog/PostContent.test.tsx "src/app/blog/[slug]/page.test.tsx"
```

첫 테스트를 작성하기 전 러너 준비 확인(Step 1):

```bash
yarn vitest run --passWithNoTests
```

개별 실행:

```bash
yarn vitest run src/components/blog/PostCard.test.tsx
yarn vitest run src/components/blog/PostContent.test.tsx
yarn vitest run "src/app/blog/[slug]/page.test.tsx"
```

## Test Scope (Minimal 전략)

요구사항 기반, 요구사항당 1개 수준, 컴포넌트별 정상 경로 최소 1개 + 단계 규칙상 오류/경계 2개 이상.

| 파일 | 테스트 | 요구사항 |
|---|---|---|
| `PostCard.test.tsx` | 커버 없음 → 1열 / 커버 있음 → 2열 / 설명 폭 제한 없음 / 카드 링크·태그 링크 비중첩 및 접근 가능한 이름 | FR1.1, FR1.2, FR1.3, FR2.1~FR2.3 |
| `PostContent.test.tsx` | 표 / 체크리스트 / 인용·이미지 / 코드 하이라이트 / raw HTML 미생성 | FR3.3, FR3.4, FR3.5, NFR3 |
| `page.test.tsx` | 정적 파라미터 / 없는 슬러그 404 / 메타데이터·본문 렌더링 | FR3.1, FR3.6, FR3.7, FR3.2 |

오류·경계 사례: 커버 이미지 없음(경계), 알 수 없는 코드 언어(대체), raw HTML 입력(보안), 존재하지 않는 슬러그(404).

## Expected Coverage Targets

- express/Minimal 전략에는 라인 커버리지 하한이 없다. 위 표의 모든 요구사항이 최소 1개 테스트로 검증되어야 한다.
- 모든 테스트 통과, 실패·건너뜀 0개.

## Mocking and Stubbing

- `page.test.tsx`: `vi.mock("@/lib/content/repository")`로 `getAllSlugs`, `getPostBySlug`를 모킹. Notion API를 호출하지 않는다.
- `next/navigation`의 `notFound`를 `vi.fn()`(호출 시 throw)으로 모킹해 호출 여부를 검증.
- `next/link`, `next/image`는 jsdom에서 그대로 렌더링 가능. 문제가 있으면 단순 `<a>`/`<img>`로 모킹.
- `PostContent`는 async 서버 컴포넌트이므로 `render(await PostContent({ content }))` 형태로 테스트. shiki는 실제 하이라이터를 사용(네트워크 불필요).

## Test Data Management

- 테스트 내 고정 `BlogPost` 픽스처(파일 내부 팩토리 함수)를 사용한다.
- Markdown 본문 픽스처는 테스트 파일 안에 문자열로 둔다(표, `- [x]` 체크리스트, 인용, 이미지, ```ts 코드 블록, `<script>` 포함).
- 외부 파일·환경 변수에 의존하지 않는다.
