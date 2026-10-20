# Build and Test 요약 — post-detail

## Overall Build Status

**성공.** `yarn type-check`, `yarn lint`, `yarn test`, `yarn build`가 모두 통과했다(2026-10-10, 실제 Notion 연결). 전제 조건과 환경 변수는 [build-instructions.md](build-instructions.md) 참조.

## Test Type Inventory

| 유형 | 상태 | 문서 |
|---|---|---|
| 단위 테스트(Vitest) | 14개 실행, 모두 통과 | [unit-test-instructions.md](../code-generation/unit-test-instructions.md) |
| 통합 | Minimal 전략이라 별도 테스트 없음. 실제 빌드 결과로 대체 확인 | [integration-test-instructions.md](integration-test-instructions.md) |
| 성능 | 수치 목표 없음, 빌드 시간만 관찰 | [performance-test-instructions.md](performance-test-instructions.md) |
| 보안 | NFR3을 단위 테스트로 검증 | [security-test-instructions.md](security-test-instructions.md) |

## Coverage Expectations

Unit 없는 단일 구현. express/Minimal 전략: 요구사항당 테스트 1개 수준, 컴포넌트별 정상 경로 1개 이상, 라인 커버리지 하한 없음.

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| TC-MIN-1 | code-generation-plan.md `## Testing Contract` (strategy_volume 1) | 요구사항당 검증 가능한 테스트 1개 | 14개 테스트 + 빌드·정적 검사로 FR/NFR 전부 검증 | test-results.md, cross-unit-traceability.md | build-and-test | Met |
| TC-MIN-2 | `## Testing Contract` (strategy_volume 2) | 컴포넌트별 정상 경로 테스트 1개 이상 | 3개 컴포넌트 모두 존재 | test-results.md | build-and-test | Met |
| TC-FLOOR-1 | `## Testing Contract` (scope_floor 1) | 기존 스위트 통과 유지 | 기존 테스트 0개, type-check·lint 기준선 유지 | test-results.md | build-and-test | Met |
| UTI-1 | unit-test-instructions.md `## Expected Coverage Targets` | 전부 통과, 실패·건너뜀 0 | 14/14, 0, 0 | test-results.md | build-and-test | Met |
| NFR2 | requirements.md NFR2 | type-check·lint·test·build 성공 | 모두 성공 | test-results.md | build-and-test | Met |

## Readiness Assessment

| 항목 | 판단 |
|---|---|
| Build-ready | 예 |
| Test-ready | 예 |
| Deployment-ready | 예(정적 `out/` 생성). 단, 보안 헤더는 호스팅 계층에서 별도 설정 필요 |

## Known Limitations / Outstanding Items

- Notion 호출량: 상세 페이지마다 `getPostBySlug` 2회 × 어댑터 3개 + 블록 조회. 연속 빌드 시 429 가능 → 슬러그별 캐시 후속 검토
- `notion-adapter.ts` 필터 평탄화 로직에 단위 테스트 없음
- `welcome-to-blog` 페이지 `<h1>` 중복(본문 선두 `# Welcome`)
- `/tags/<tag>/` 라우트 없음(기존부터, 범위 외)
- Notion 업로드 이미지 서명 URL 만료(범위 외)
- 정적 export에서 `next.config.js` `headers()` 미적용(기존 제약)
