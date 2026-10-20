# 통합 테스트 지침 — post-detail

## Applicability

이번 작업은 express 범위, Minimal 테스트 전략이다. Minimal 전략은 별도 통합 테스트를 만들지 않으며 단위 테스트는 Code Generation의 [unit-test-instructions.md](../code-generation/unit-test-instructions.md)가 다룬다.

## Equivalent Check Performed

컴포넌트 간 통합(저장소 → 상세 라우트 → 본문 렌더러, 홈 카드 → 상세 링크)은 실제 Notion에 연결한 `yarn build` 결과로 확인한다.

```bash
yarn build
ls out/blog            # 게시 글 수만큼 디렉터리
grep -o 'href="/blog/[^"]\+/"' out/index.html | sort -u
```

## Coverage Targets

해당 없음(Minimal 전략).

## Test Data and Environment

`.env.local`의 Notion 자격 증명과 실제 DB 데이터를 사용한다([build-instructions.md](build-instructions.md) 참조).
