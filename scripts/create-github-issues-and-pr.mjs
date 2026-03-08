#!/usr/bin/env node
/**
 * GitHub 이슈 6개 + PR 1개 생성 스크립트
 * 사용: GITHUB_TOKEN=ghp_xxx node scripts/create-github-issues-and-pr.mjs
 * 토큰: GitHub > Settings > Developer settings > Personal access tokens (repo 권한)
 */
const OWNER = "JJongW";
const REPO = "MOJIP";
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN 환경 변수를 설정하세요. 예: GITHUB_TOKEN=ghp_xxx node scripts/create-github-issues-and-pr.mjs");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

const issues = [
  {
    title: "[웹] Vite + React + TypeScript 기본 세팅 및 라우팅",
    body: `## 개요
MOJIP 웹 클라이언트 기본 구조 구축

## 완료 사항
- [x] Vite 7 + React 19 + TypeScript 프로젝트 생성 (\`web/\`)
- [x] Tailwind CSS v4 적용, \`@\` path alias 설정
- [x] React Router 라우팅 (/, /workspace/:id, 404)
- [x] 모집 목록 페이지, 카드/검색/필터, 상세 다이얼로그
- [x] 모집글 작성 다이얼로그, 지원하기 플로우
- [x] 사이트명 "모여봐요 종원의숲" 반영`,
  },
  {
    title: "[웹] 다크 모드 + 글래스모피즘 UI 적용",
    body: `## 개요
전체 웹 UI를 다크 모드 + 글래스모피즘 스타일로 통일

## 완료 사항
- [x] \`index.html\` dark 클래스, body 그라데이션 배경
- [x] \`index.css\` \`.glass\` 유틸 및 @theme 색상 변수 (success 등)
- [x] 헤더, 카드, 검색/필터, RecruitmentCard, NotFound 글래스 스타일
- [x] 라이트/다크 대비 및 호버·포커스 가이드라인 준수`,
  },
  {
    title: "[웹] 워크스페이스 기능 (입장 gate, 과제 CRUD, 개인별 히트맵)",
    body: `## 개요
모집글별 팀 워크스페이스: 입장 → 과제 관리 → 활동 히트맵

## 완료 사항
- [x] 워크스페이스 입장: 접근 코드(있을 때) + 닉네임, 작성자/지원자만 허용
- [x] 과제 타입·스토어 (WorkspaceTask, 반복 주기, 담당자)
- [x] 새 과제 추가 모달 (제목, 설명, 반복, 시작/마감일, 담당자)
- [x] 진행중/완료 목록, 본인 과제만 완료·되돌리기·삭제
- [x] 개인별 활동 히트맵 + 개인별 색상 선택 (로컬 저장)
- [x] 훅 순서 통일로 입장 후 대시보드 정상 표시`,
  },
  {
    title: "[웹] 새 과제 생성 모달 버그 수정 (담당자 Select)",
    body: `## 개요
Radix Select \`value=""\` 사용 시 발생하던 렌더/동작 오류 수정

## 완료 사항
- [x] 담당자 "선택 안 함" 값을 \`__none__\` 상수로 처리, 제출 시 \`undefined\`로 매핑
- [x] 폼 구조 정리 (form 태그, preventDefault, 버튼 type="button")
- [x] 추가 후 목록 갱신(refreshTasks) 정상 동작`,
  },
  {
    title: "[웹] 완료 버튼 강조, 완료 상태 표시, 반복 주기 초기화, 히트맵 즉시 반영",
    body: `## 개요
완료 UX 개선 및 반복 과제·히트맵 동작 정리

## 완료 사항
- [x] 완료 버튼: CheckCircle2 아이콘 + 초록색(success), 툴팁으로 "히트맵에 반영" 안내
- [x] 완료된 과제 섹션: 왼쪽 테두리·아이콘·건수 뱃지, 행별 "완료" 뱃지·"활동 히트맵에 반영됨" 문구
- [x] 인원별 히트맵 기본 색상 팔레트 (8색 순환)
- [x] 반복 주기별 자동 초기화: 일일/주간/월간 과제는 새 주기 도래 시 진행중으로 리셋
- [x] 완료 시 히트맵 즉시 반영 (refreshTasks로 목록 갱신)`,
  },
  {
    title: "[웹] Supabase DB 연동 및 Vercel 배포 환경 구성",
    body: `## 개요
모집·지원자·워크스페이스 과제·히트맵 색상을 Supabase에 저장하고, env 미설정 시 기존처럼 localStorage 사용

## 완료 사항
- [x] Supabase 클라이언트, .env.example (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [x] DB 스키마: supabase/migrations/001_initial.sql (recruitments, applicants, workspace_tasks, workspace_heatmap_colors, RLS)
- [x] 모집/지원자·워크스페이스 Supabase 레이어, store·workspace-store 연동
- [x] 페이지/다이얼로그 비동기 저장·갱신
- [x] README: Supabase 스키마 적용, 환경 변수, Vercel 배포 절차`,
  },
];

async function createIssue(index) {
  const res = await fetch(`${API}/issues`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(issues[index]),
  });
  if (!res.ok) throw new Error(`Issue ${index + 1}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.number;
}

async function createPR(issueNumbers) {
  const closes = issueNumbers.map((n) => `Closes #${n}`).join("\n");
  const res = await fetch(`${API}/pulls`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "feat(web): MOJIP 웹 앱 + Supabase 연동",
      head: "feature/mojip-web-supabase",
      base: "main",
      body: `## 요약
웹 클라이언트(Vite+React+TS), 워크스페이스, Supabase 연동까지 반영했습니다.

## 관련 이슈
${closes}`,
    }),
  });
  if (!res.ok) throw new Error(`PR: ${res.status} ${await res.text()}`);
  return res.json();
}

(async () => {
  const numbers = [];
  for (let i = 0; i < issues.length; i++) {
    const num = await createIssue(i);
    numbers.push(num);
    console.log(`이슈 #${num} 생성: ${issues[i].title}`);
  }
  const pr = await createPR(numbers);
  console.log(`\nPR 생성: ${pr.html_url}`);
  console.log(`\n완료. 이슈 #${numbers.join(", #")} / PR: ${pr.html_url}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
