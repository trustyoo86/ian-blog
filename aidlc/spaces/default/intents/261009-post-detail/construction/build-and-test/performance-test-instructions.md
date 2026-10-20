# 성능 테스트 지침 — post-detail

## Applicability

요구사항에 수치형 성능 목표가 없고(NFR4는 빌드 중 Notion 속도 제한 오류를 실패로 드러내라는 요구), 정적 사이트라 런타임 부하 테스트 대상이 없다. Minimal 전략에 따라 별도 성능 테스트는 만들지 않는다.

## Build-Time Observation

- 빌드 소요: 약 9초(글 21개, 실제 Notion 연결, 2026-10-10 측정)
- 연속 빌드 중 Notion 429가 1회 발생 → NFR4대로 빌드 실패로 드러남

## How to Re-check

```bash
time yarn build
```

## Coverage Targets

해당 없음.
