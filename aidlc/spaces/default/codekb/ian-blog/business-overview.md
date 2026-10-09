# 비즈니스 개요 — ian-blog

## 비즈니스 도메인

개인 기술 블로그. 저자(Ian)가 소프트웨어 개발, 클라우드 인프라에 관한 글을 게시한다. 글의 원천은 세 곳이다.

- Notion "Blog Posts" 데이터베이스(`Status = Published`)
- Notion "AI Web Dev Researches" 데이터베이스(AI 웹 개발 기술 브리핑; `Status`가 `NOTION_BRIEFING_STATUSES` 중 하나이거나 `Blog Ready` 체크, 그리고 `Slug` 존재)
- 저장소 내 마크다운 파일 `content/posts/**/*.md`(`status: published`)

사이트는 빌드 시점에 모든 원천을 읽어 정적 HTML로 export하고(`next.config.js` `output: 'export'`), AWS(CloudFront) 정적 호스팅으로 배포하는 것을 전제로 한다(`page.tsx`의 "AWS static export" 표기, `next.config.js` 주석).

## 비즈니스 트랜잭션

| ID | 트랜잭션 | 현재 상태 |
|---|---|---|
| BT1 | 홈 화면에서 최근 글 목록(최대 6개) 보기 | 구현됨(`src/app/page.tsx`) |
| BT2 | 글 상세(본문) 보기 — `/blog/<slug>/` | **미구현**: 링크만 있고 라우트 없음. 데이터 조회 함수(`getPostBySlug`)는 구현됨 |
| BT3 | 전체 글 목록(`/blog`), 태그별 목록(`/tags/<tag>`), 소개(`/about`) | **미구현**: 링크만 존재 |
| BT4 | 테마(라이트/다크) 전환 | 구현됨(`ThemeToggle`) |
| BT5 | 콘텐츠 게시(Notion에서 상태 변경 또는 마크다운 커밋 후 재빌드) | 빌드 파이프라인 외부 절차, 저장소에 CI 없음 |

## 핵심 기능

- 다중 콘텐츠 원천 통합과 슬러그 충돌 검출(`SlugCollisionError`)
- 원천별 Notion 속성 이름 매핑(`NotionSourceConfig`)
- 게시일 내림차순 정렬, 카테고리 기본값(`Uncategorized`), 읽기 시간 추정(본문이 있을 때)
- 라이트/다크 테마, FOUC 방지 인라인 스크립트

## 현재 의도와의 관계

이번 의도(홈 아이템 폭 확대, 클릭 시 Notion 본문이 포함된 상세 화면)는 BT1 개선과 BT2 신규 구현에 해당한다. 상세 근거는 [architecture.md](architecture.md)와 [code-quality-assessment.md](code-quality-assessment.md) 참조.
