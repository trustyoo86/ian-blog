# 기술 스택 — ian-blog

버전은 `yarn.lock`의 해석 버전(괄호 안은 `package.json` 범위).

## 언어·런타임

| 항목 | 버전 | 비고 |
|---|---|---|
| TypeScript | 5.9.3 (^5.5.4) | `strict: true`, `moduleResolution: bundler`, 별칭 `@/*` |
| Node.js | 명시 없음 | `engines`/`.nvmrc` 없음; `@types/node` ^20.14.11 |
| 패키지 매니저 | yarn(`yarn.lock`) | `package-lock.json`도 공존 |

## 프레임워크

| 항목 | 버전 | 용도 |
|---|---|---|
| Next.js | 14.2.5 | App Router, `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true` |
| React / React DOM | 18.3.1 | UI(서버 컴포넌트 위주) |
| Tailwind CSS | 3.4.19 (^3.4.7) | 스타일, `darkMode: 'class'`, HSL 토큰 |
| @tailwindcss/typography | 0.5.19 | 플러그인 등록·`typography` 테마 설정됨, `prose` 사용처 없음 |
| PostCSS / autoprefixer | ^8.4.40 / ^10.4.19 | Tailwind 처리 |

## 콘텐츠

| 항목 | 버전 | 사용 여부 |
|---|---|---|
| @notionhq/client | 2.3.0 | 사용(`databases.query`) |
| notion-to-md | 3.1.9 | 사용(상세 본문 변환) |
| gray-matter | ^4.0.3 | 사용 |
| glob | ^13.0.6 | 사용 |
| react-markdown | 9.1.0 | **미사용** |
| remark-gfm | 4.0.1 | **미사용** |
| rehype-raw | 7.0.0 | **미사용** |
| shiki | 1.29.2 | **미사용** |

## 품질 도구

| 항목 | 버전 | 설정 |
|---|---|---|
| ESLint | ^8.57.0 | `.eslintrc.json`: `next/core-web-vitals`, `prettier` |
| eslint-config-next | 14.2.5 | — |
| Prettier | ^3.3.3 | 설정 파일 없음(기본값) |
| 테스트 프레임워크 | 없음 | — |

## 스크립트

`dev`(`next dev`), `build`(`next build`), `start`(`next start`, export 모드에서는 의미 없음), `lint`, `type-check`(`tsc --noEmit`), `format`(`prettier --write .`).

## 환경 변수(`.env.example`)

| 변수 | 범위 | 용도 |
|---|---|---|
| `NOTION_API_KEY` | 서버(빌드) | Notion 인증. 없으면 Notion 어댑터 비활성 |
| `NOTION_DATABASE_ID` | 서버 | Blog Posts DB |
| `NOTION_BRIEFING_DATABASE_ID` | 서버 | AI 브리핑 DB(선택) |
| `NOTION_BRIEFING_STATUSES` | 서버 | 기본 `Researched,Published` |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_SITE_NAME` / `NEXT_PUBLIC_AUTHOR_NAME` | 클라이언트 노출 | 메타데이터·표시 |

## 배포 대상

정적 export(`out/`) → AWS(CloudFront 전제, `next.config.js` 주석 및 홈 화면 "AWS static export"). 저장소 안에 IaC·CI 정의는 없다(`.gitignore`에 `terraform/` 항목만 존재, 디렉터리는 없음).
