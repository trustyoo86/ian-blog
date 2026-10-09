# 테스트 결과 — post-detail

실행일: 2026-10-10

## Build Status

| 명령 | 결과 |
|---|---|
| `yarn build` | 성공(종료 코드 0). 실제 Notion 연결, 정적 페이지 25개 생성(`/`, `/_not-found`, `/blog/[slug]` 21개 등). 경고 1건: 정적 export에서는 `headers()`가 적용되지 않음(알려진 제약) |
| `yarn type-check` | 통과 |
| `yarn lint` | 경고·오류 없음 |

빌드 결과 확인:
- `out/blog/*/index.html` 21개(마크다운 1 + Notion 브리핑 20)
- `out/blog/ai-web-dev-briefing-2026-10-09/index.html`에 `data-testid="post-content"`와 글 제목 `<h1>`, 본문 문단 18개 존재
- `out/index.html` 카드 링크가 `/blog/<slug>/` 형식

## Unit Test Results

명령(중복 제거 후 1회 실행):

```bash
yarn vitest run src/components/blog/PostCard.test.tsx src/components/blog/PostContent.test.tsx "src/app/blog/[slug]/page.test.tsx"
```

| 파일 | 테스트 | 통과 | 실패 | 건너뜀 |
|---|---|---|---|---|
| `PostCard.test.tsx` | 4 | 4 | 0 | 0 |
| `PostContent.test.tsx` | 6 | 6 | 0 | 0 |
| `page.test.tsx` | 4 | 4 | 0 | 0 |
| **합계** | **14** | **14** | **0** | **0** |

Vite 설정 로더 경고(ESM을 CommonJS로 로드)는 결과에 영향 없음.

## Failure Details

없음.

## Coverage Report

커버리지 도구는 설정하지 않았다. express/Minimal 전략에는 라인 커버리지 하한이 없다. 요구사항별 검증 여부는 [cross-unit-traceability.md](cross-unit-traceability.md)에 있다.

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| TC-MIN-1 | code-generation-plan.md `## Testing Contract` (strategy_volume 1) | 요구사항당 검증 가능한 테스트 1개 | 단위 테스트 14개가 FR1~FR3, NFR3·NFR4를 검증, 나머지는 빌드·정적 검사로 검증 | 위 Unit Test Results, cross-unit-traceability.md | build-and-test | Met |
| TC-MIN-2 | `## Testing Contract` (strategy_volume 2) | 컴포넌트별 정상 경로 단위 테스트 1개 이상 | PostCard, PostContent, 상세 라우트 각각 정상 경로 테스트 존재 | Unit Test Results | build-and-test | Met |
| TC-FLOOR-1 | `## Testing Contract` (scope_floor 1) | 기존 테스트 스위트 통과 유지 | 기존 테스트 0개, 기준선 type-check·lint 통과 유지 | Build Status | build-and-test | Met |
| UTI-1 | unit-test-instructions.md `## Expected Coverage Targets` | 모든 테스트 통과, 실패·건너뜀 0 | 14/14 통과, 실패 0, 건너뜀 0 | Unit Test Results | build-and-test | Met |
| NFR2 | requirements.md NFR2 | type-check, lint, test, build 모두 성공 | 모두 성공 | Build Status | build-and-test | Met |
