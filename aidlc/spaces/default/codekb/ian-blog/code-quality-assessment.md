# 코드 품질 평가 — ian-blog

## 요약 평가(good / fair / poor)

| 항목 | 평가 | 근거 |
|---|---|---|
| 명명 명확성 | good | `getPostBySlug`, `assertNoSlugCollisions`, `mapPageToRawPost` 등 자기 설명적 |
| 함수 크기 | good | 대부분 30줄 미만, 단일 책임. 가장 큰 것은 `HomePage`(JSX 위주) |
| 오류 처리 | fair | frontmatter 필수값·슬러그 충돌은 명시적 예외. Notion API 오류는 재시도/로깅 없이 전파 |
| 테스트 존재 | poor | 테스트 파일·프레임워크·커버리지 설정 전무 |
| 중복 | good | Notion 두 DB를 설정 기반 팩토리로 통합 |
| 죽은 코드 | fair | 미사용 함수 5개, 미사용 타입 1개, 미사용 의존성 4개 |

## 테스트·CI·문서

- **테스트**: 없음. `data-testid`는 다수 있어 향후 컴포넌트/E2E 테스트 도입은 용이. 기존 회귀 기준선 없음 → express 범위의 요구사항 기반 단위 테스트는 테스트 프레임워크 도입부터 필요.
- **린트/타입**: ESLint(`next/core-web-vitals` + `prettier`), `tsc --noEmit`, `strict: true`. CI에서 강제되지 않음.
- **포맷**: Prettier 설정 파일 없음. `src/lib`(세미콜론 없음, 작은따옴표)와 `src/app`·`src/components`(세미콜론, 큰따옴표) 스타일 혼재.
- **CI/CD**: 파이프라인 파일 없음.
- **문서**: README 없음. 콘텐츠 계층 doc comment 양호. 코드와 샘플 글이 삭제된 `aidlc-docs/construction/blog-v2/notion-setup-guide.md`를 참조(`notion-adapter.ts:185`, `content/posts/welcome-to-blog.md:33`).
- TODO/FIXME/HACK/eslint-disable: 0건.

## 기술 부채 및 결함(우선순위순)

| # | 내용 | 위치 | 의도 관련 |
|---|---|---|---|
| D1 | 상세 라우트 부재 — 카드 제목 링크가 export 결과에서 404 | `PostCard.tsx:45`, `src/app/` | **예** |
| D2 | 커버 이미지가 없으면 카드 본문이 `sm` 이상에서 180px 첫 열에 배치됨(2열 그리드 고정). Notion 브리핑 DB는 `coverImage` 매핑이 없고 샘플 마크다운도 비어 있어 현재 모든 카드에 해당 | `PostCard.tsx:14,17` | **예**(폭 확대) |
| D3 | 폭 제약 누적: `max-w-6xl` 컨테이너 + 220px 사이드바 + `max-w-2xl` 설명 | `page.tsx:21`, `PostCard.tsx:52` | **예** |
| D4 | Notion 업로드 이미지(본문·파일 속성)는 만료되는 서명 URL → 정적 페이지에서 시간이 지나면 깨짐 | `notion-adapter.ts:143-147` | **예**(상세 본문) |
| D5 | 상세 조회가 모든 어댑터에 질의 + 블록 재귀 조회 → 빌드 시 슬러그 수에 비례한 Notion 호출, 속도 제한(평균 3 req/s)·429 처리 없음 | `repository.ts:25-38`, `notion-adapter.ts:165-181` | **예** |
| D6 | 미사용 링크: `/blog`, `/about`, `/tags/<tag>`, `/feed.xml`, GitHub placeholder | `page.tsx`, `Header.tsx`, `PostCard.tsx:64`, `Footer.tsx` | 일부(태그 링크가 카드에 있음) |
| D7 | `output: 'export'`에서 `headers()`(CSP, HSTS 등) 미적용 — 보안 헤더가 실제로 나가지 않을 수 있음 | `next.config.js:8-34` | 간접(상세 본문에 원시 HTML 허용 시 영향) |
| D8 | 미사용 의존성(react-markdown, remark-gfm, rehype-raw, shiki), `prose` 미사용 | `package.json` | 간접(상세 렌더링에 재사용 가능) |
| D9 | 이중 lockfile, `tsconfig.tsbuildinfo` git 추적 | 루트 | 아니오 |
| D10 | `lang="en"`인데 콘텐츠는 한국어 위주; `formatDate`는 `en-US` 고정 | `layout.tsx:46`, `utils.ts:16` | 아니오 |
| D11 | 마크다운 어댑터 `getPostBySlug`가 `this.listPosts()`에 의존 — 메서드를 분리 참조하면 `this` 유실 | `markdown-adapter.ts:81-84` | 아니오(현재 호출 방식은 안전) |
| D12 | 목록에서 Notion 글은 `readingTime`이 없고 마크다운 글만 있음 → 카드 메타 표시 불일치 | `normalize.ts:26` | 낮음 |

## 보안 관찰

- `NOTION_API_KEY`는 서버 전용으로 관리(`.env.example` 경고). 클라이언트 번들 노출 경로 없음.
- `dangerouslySetInnerHTML`은 테마 인라인 스크립트(정적 문자열) 1곳뿐.
- 상세 본문에 `rehype-raw`를 쓰면 Notion/마크다운의 원시 HTML이 그대로 렌더링됨. 작성자만 편집하는 원천이지만 CSP가 export에서 적용되지 않으므로(D7) 채택 시 검토 필요.
