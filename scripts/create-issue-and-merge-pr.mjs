#!/usr/bin/env node
/**
 * 카카오 공유 이슈 생성 + PR #7 머지
 * 사용: GITHUB_TOKEN=ghp_xxx node scripts/create-issue-and-merge-pr.mjs
 */
const OWNER = "JJongW";
const REPO = "MOJIP";
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN 환경 변수를 설정하세요.");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

async function main() {
  // 1. 이슈 생성
  const issueRes = await fetch(`${API}/issues`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "[웹] 카카오톡 공유 및 공유 전용 페이지",
      body: `## 개요
카카오톡 방에 모집글 링크를 공유하고, 링크 클릭 시 바로 지원하기까지 진행 가능하도록 연동

## 완료 사항
- [x] 공유 전용 라우트 \`/r/:id\`, \`?apply=1\` 시 지원하기 자동 오픈
- [x] RecruitmentSharePage (공유 전용 상세·지원하기)
- [x] 카카오 공유: Kakao SDK / 링크 복사 / Web Share API 폴백
- [x] 모집 상세 다이얼로그에 '카카오톡으로 공유' 버튼
- [x] vercel.json SPA rewrites (404 방지)
- [x] .env.example VITE_KAKAO_JAVASCRIPT_KEY, README 안내`,
    }),
  });
  if (!issueRes.ok) {
    console.error("Issue create failed", await issueRes.text());
    process.exit(1);
  }
  const issue = await issueRes.json();
  const issueNum = issue.number;
  console.log(`Created issue #${issueNum}`);

  // 2. 열린 PR 목록에서 feature/mojip-web-supabase -> main 찾기
  const prsRes = await fetch(`${API}/pulls?state=open&head=JJongW:feature/mojip-web-supabase`, { headers });
  if (!prsRes.ok) {
    console.error("PR list failed", await prsRes.text());
    process.exit(1);
  }
  const prs = await prsRes.json();
  const pr = prs[0];
  if (!pr) {
    console.error("No open PR for feature/mojip-web-supabase");
    process.exit(1);
  }
  const prNum = pr.number;
  const currentBody = pr.body || "";
  const closeLine = `\n\nCloses #${issueNum}`;
  const newBody = currentBody.includes(`Closes #${issueNum}`) ? currentBody : currentBody + closeLine;

  await fetch(`${API}/pulls/${prNum}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ body: newBody }),
  });

  // 3. 머지
  const mergeRes = await fetch(`${API}/pulls/${prNum}/merge`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ merge_method: "merge" }),
  });
  if (!mergeRes.ok) {
    console.error("Merge failed", await mergeRes.text());
    process.exit(1);
  }
  console.log(`Merged PR #${prNum}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
