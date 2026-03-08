# GitHub 이슈 정리 (복사해서 사용)

아래 각 이슈를 GitHub 저장소 **Issues > New issue**에서 제목과 본문을 붙여넣어 생성한 뒤, 원하면 이슈 번호를 PR 설명에 링크하세요.

---

## 이슈 1: 웹 앱 기본 세팅 (Vite + React + TypeScript)

**제목:** `[웹] Vite + React + TypeScript 기본 세팅 및 라우팅`

**본문:**

```markdown
## 개요
MOJIP 웹 클라이언트 기본 구조 구축

## 완료 사항
- [x] Vite 7 + React 19 + TypeScript 프로젝트 생성 (`web/`)
- [x] Tailwind CSS v4 적용, `@` path alias 설정
- [x] React Router 라우팅 (/, /workspace/:id, 404)
- [x] 모집 목록 페이지, 카드/검색/필터, 상세 다이얼로그
- [x] 모집글 작성 다이얼로그, 지원하기 플로우
- [x] 사이트명 "모여봐요 종원의숲" 반영

## 관련 PR
- (PR 링크)
```

---

## 이슈 2: 다크 모드 및 글래스모피즘 UI

**제목:** `[웹] 다크 모드 + 글래스모피즘 UI 적용`

**본문:**

```markdown
## 개요
전체 웹 UI를 다크 모드 + 글래스모피즘 스타일로 통일

## 완료 사항
- [x] `index.html` dark 클래스, body 그라데이션 배경
- [x] `index.css` `.glass` 유틸 및 @theme 색상 변수 (success 등)
- [x] 헤더, 카드, 검색/필터, RecruitmentCard, NotFound 글래스 스타일
- [x] 라이트/다크 대비 및 호버·포커스 가이드라인 준수

## 관련 PR
- (PR 링크)
```

---

## 이슈 3: 워크스페이스 기능 (입장, 과제, 히트맵)

**제목:** `[웹] 워크스페이스 기능 (입장 gate, 과제 CRUD, 개인별 히트맵)`

**본문:**

```markdown
## 개요
모집글별 팀 워크스페이스: 입장 → 과제 관리 → 활동 히트맵

## 완료 사항
- [x] 워크스페이스 입장: 접근 코드(있을 때) + 닉네임, 작성자/지원자만 허용
- [x] 과제 타입·스토어 (WorkspaceTask, 반복 주기, 담당자)
- [x] 새 과제 추가 모달 (제목, 설명, 반복, 시작/마감일, 담당자)
- [x] 진행중/완료 목록, 본인 과제만 완료·되돌리기·삭제
- [x] 개인별 활동 히트맵 + 개인별 색상 선택 (로컬 저장)
- [x] 훅 순서 통일로 입장 후 대시보드 정상 표시

## 관련 PR
- (PR 링크)
```

---

## 이슈 4: 새 과제 생성 모달 수정 (Select 등)

**제목:** `[웹] 새 과제 생성 모달 버그 수정 (담당자 Select)`

**본문:**

```markdown
## 개요
Radix Select `value=""` 사용 시 발생하던 렌더/동작 오류 수정

## 완료 사항
- [x] 담당자 "선택 안 함" 값을 `__none__` 상수로 처리, 제출 시 `undefined`로 매핑
- [x] 폼 구조 정리 (form 태그, preventDefault, 버튼 type="button")
- [x] 추가 후 목록 갱신(refreshTasks) 정상 동작

## 관련 PR
- (PR 링크)
```

---

## 이슈 5: 완료 버튼 강조 및 반복 주기·히트맵

**제목:** `[웹] 완료 버튼 강조, 완료 상태 표시, 반복 주기 초기화, 히트맵 즉시 반영`

**본문:**

```markdown
## 개요
완료 UX 개선 및 반복 과제·히트맵 동작 정리

## 완료 사항
- [x] 완료 버튼: CheckCircle2 아이콘 + 초록색(success), 툴팁으로 "히트맵에 반영" 안내
- [x] 완료된 과제 섹션: 왼쪽 테두리·아이콘·건수 뱃지, 행별 "완료" 뱃지·"활동 히트맵에 반영됨" 문구
- [x] 인원별 히트맵 기본 색상 팔레트 (8색 순환)
- [x] 반복 주기별 자동 초기화: 일일/주간/월간 과제는 새 주기 도래 시 진행중으로 리셋 (getWorkspaceTasksWithResets)
- [x] 완료 시 히트맵 즉시 반영 (refreshTasks로 목록 갱신)

## 관련 PR
- (PR 링크)
```

---

## 이슈 6: Supabase DB 연동 및 Vercel 배포 준비

**제목:** `[웹] Supabase DB 연동 및 Vercel 배포 환경 구성`

**본문:**

```markdown
## 개요
모집·지원자·워크스페이스 과제·히트맵 색상을 Supabase에 저장하고, env 미설정 시 기존처럼 localStorage 사용

## 완료 사항
- [x] Supabase 클라이언트 (`web/src/lib/supabase.ts`), `.env.example` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [x] DB 스키마: `supabase/migrations/001_initial.sql` (recruitments, applicants, workspace_tasks, workspace_heatmap_colors, RLS 정책)
- [x] 모집/지원자 Supabase 레이어 (`supabase-recruitments.ts`), store 캐시 + fetchRecruitments 연동
- [x] 워크스페이스 Supabase 레이어 (`supabase-workspace.ts`), *Async 함수 및 반복 주기 리셋 연동
- [x] 페이지/다이얼로그 비동기 저장·갱신 (fetchRecruitments, getWorkspaceTasksWithResetsAsync 등)
- [x] README: Supabase 스키마 적용 방법, 환경 변수, Vercel 배포 절차

## 관련 PR
- (PR 링크)
```

---

## PR 시 참고

- 브랜치: `feature/mojip-web-supabase` (또는 이슈별 브랜치)
- 커밋 메시지 예: `feat(web): Supabase 연동 및 워크스페이스·모집 기능`
- PR 설명에 위 이슈 번호를 "Closes #1, #2, ..." 형태로 넣으면 이슈 자동 연결 가능
