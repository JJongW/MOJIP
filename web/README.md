# MOJIP 웹 (Vite + React + TypeScript)

MOJIP 프로젝트용 Vite 기반 웹사이트입니다. 코드 복사 후 이 폴더에서 개발·빌드하면 됩니다.

## 환경

- **Vite** 7.x
- **React** 19.x
- **TypeScript** 5.9.x

## 사용 방법

```bash
# 의존성 설치 (최초 1회)
npm install

# 개발 서버 (HMR)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview

# 린트
npm run lint
```

## 폴더 구조

| 경로 | 설명 |
|------|------|
| `src/` | 소스 코드 (진입: `main.tsx`, 루트 컴포넌트: `App.tsx`) |
| `public/` | 정적 파일 (그대로 배포에 포함) |
| `index.html` | HTML 진입점 |
| `vite.config.ts` | Vite 설정 |
| `tsconfig*.json` | TypeScript 설정 |

## 코드 붙여넣기 후

- 페이지/라우팅 코드는 `src/App.tsx` 또는 `src/` 아래에 새 파일로 추가
- 공통 스타일은 `src/index.css` 또는 별도 CSS/SCSS 파일 사용
- 환경 변수는 `VITE_` 접두사로 선언 후 `import.meta.env.VITE_*` 로 참조 (참고: [Vite env](https://vite.dev/guide/env-and-mode))

---

## Supabase 연동 (DB)

데이터는 기본적으로 브라우저 localStorage/sessionStorage를 사용합니다. Supabase를 쓰면 모집글·지원자·워크스페이스 과제·히트맵 색상을 DB에 저장합니다.

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 로그인 후 새 프로젝트 생성
2. **Settings > API**에서 **Project URL**과 **anon public** 키 복사

### 2. 스키마 적용

프로젝트 루트의 `supabase/migrations/001_initial.sql` 내용을 Supabase 대시보드 **SQL Editor**에 붙여넣고 **Run**으로 실행합니다.

- `recruitments`: 모집글
- `applicants`: 지원자 (모집글 FK)
- `workspace_tasks`: 워크스페이스 과제 (workspace_id = recruitment.id)
- `workspace_heatmap_colors`: 개인별 히트맵 색상

### 3. 환경 변수

`web/.env` 파일 생성 (또는 Vercel 환경 변수에 설정):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

- `.env`는 `web/.env.example`을 참고해 작성
- **주의**: `VITE_` 접두사가 있어야 클라이언트에서 사용 가능

이렇게 설정하면 앱이 자동으로 Supabase를 사용하고, 미설정 시에는 기존처럼 localStorage를 사용합니다.

---

## Vercel 배포

1. [Vercel](https://vercel.com)에 저장소 연결
2. **Root Directory**: `web` 지정
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**에 Supabase 값 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

배포 후 빌드가 성공하면 해당 URL에서 서비스됩니다.

---

## 카카오톡 공유 (모집글 공유)

모집글 상세에서 **카카오톡으로 공유** 버튼을 누르면 링크를 카카오톡 방에 올릴 수 있고, 수신자가 링크를 클릭하면 **지원하기**까지 바로 진행할 수 있습니다.

### 공유 링크 형식

- **일반**: `https://도메인/r/모집글ID` (모집 상세 페이지)
- **지원하기 바로 열기**: `https://도메인/r/모집글ID?apply=1` (공유 시 기본 사용)

### 카카오 공유 창 사용 (선택)

[Kakao Developers](https://developers.kakao.com)에서 앱을 만들고 **앱 키 > JavaScript 키**를 발급한 뒤, 환경 변수에 넣으면 **카카오톡 공유** 버튼 클릭 시 카카오 공유 창이 열립니다.

- **로컬**: `web/.env`에 `VITE_KAKAO_JAVASCRIPT_KEY=발급받은_JavaScript_키`
- **Vercel**: 프로젝트 설정 > Environment Variables에 `VITE_KAKAO_JAVASCRIPT_KEY` 추가

키를 넣지 않으면 **링크 복사** 또는 (지원 시) **Web Share API**로 동작합니다.
