# 보안 테스트 지침 — post-detail

## Applicability

보안 요구사항은 NFR3(Notion 본문의 raw HTML을 렌더링하지 않음) 하나다. 이 요구사항은 단위 테스트로 검증한다. Minimal 전략이라 SAST/DAST 지침은 만들지 않는다.

## How to Run

```bash
yarn vitest run src/components/blog/PostContent.test.tsx
```

`<script>`·`<iframe>`이 들어간 Markdown 픽스처를 렌더링해 해당 요소가 생성되지 않는지 확인한다.

## Additional Notes

- `PostContent`는 `rehype-raw`를 쓰지 않는다. 코드 블록은 shiki가 이스케이프한 HTML만 삽입한다.
- 정적 export에서는 `next.config.js`의 `headers()`(CSP 등)가 적용되지 않는다. 배포 시 CloudFront 응답 헤더 정책으로 설정해야 한다(범위 외).
- 비밀 값은 `.env.local`에만 두고 커밋하지 않는다.

## Coverage Targets

NFR3 검증 테스트 1개 이상 통과.
