import { isSupabaseConfigured } from "./supabase";
import {
  getRecruitmentsFromSupabase,
  saveRecruitmentToSupabase,
  updateRecruitmentInSupabase,
  deleteRecruitmentFromSupabase,
} from "./supabase-recruitments";
import type { Recruitment, RecruitmentCategory } from "./types";

const STORAGE_KEY = "recruitments";

/** Supabase 사용 시 메모리 캐시 (fetchRecruitments로 갱신) */
let recruitmentsCache: Recruitment[] = [];

const sampleData: Recruitment[] = [
  {
    id: "1",
    title: "React 스터디 모집합니다",
    description: "React와 TypeScript를 함께 공부할 멤버를 모집합니다. 매주 토요일 오후 2시에 온라인으로 진행합니다. 기초부터 심화까지 함께 성장해요!",
    category: "스터디",
    status: "모집중",
    currentMembers: 3,
    maxMembers: 6,
    deadline: "2026-03-31",
    createdAt: "2026-03-05",
    tags: ["React", "TypeScript", "프론트엔드"],
    contact: "study@example.com",
    author: "김개발",
  },
  {
    id: "2",
    title: "환경보호 봉사활동 함께해요",
    description: "주말마다 한강 주변 환경 정화 봉사활동을 진행합니다. 관심 있으신 분들 누구나 환영합니다.",
    category: "봉사활동",
    status: "모집중",
    currentMembers: 8,
    maxMembers: 20,
    deadline: "2026-04-15",
    createdAt: "2026-03-01",
    tags: ["봉사", "환경", "주말활동"],
    contact: "volunteer@example.com",
    author: "이봉사",
  },
  {
    id: "3",
    title: "AI 해커톤 팀원 모집",
    description: "다음 달에 있는 AI 해커톤에 참가할 팀원을 찾습니다. 백엔드, 디자이너 각 1명씩 모집합니다.",
    category: "대회/공모전",
    status: "모집완료",
    currentMembers: 4,
    maxMembers: 4,
    deadline: "2026-03-10",
    createdAt: "2026-02-20",
    tags: ["AI", "해커톤", "팀프로젝트"],
    contact: "hackathon@example.com",
    author: "박인공",
  },
  {
    id: "4",
    title: "독서 동아리 신입 모집",
    description: "매월 1권의 책을 선정하여 함께 읽고 토론합니다. 장르 불문, 다양한 분야의 책을 다룹니다.",
    category: "동아리",
    status: "모집중",
    currentMembers: 5,
    maxMembers: 12,
    deadline: "2026-04-01",
    createdAt: "2026-03-03",
    tags: ["독서", "토론", "자기계발"],
    contact: "bookclub@example.com",
    author: "최독서",
  },
  {
    id: "5",
    title: "사이드 프로젝트: 반려동물 커뮤니티 앱",
    description: "반려동물 주인들을 위한 커뮤니티 앱을 만들 팀원을 모집합니다. 기획자, 디자이너, 개발자 모두 환영합니다!",
    category: "프로젝트",
    status: "모집중",
    currentMembers: 2,
    maxMembers: 5,
    deadline: "2026-03-25",
    createdAt: "2026-03-06",
    tags: ["앱개발", "사이드프로젝트", "반려동물"],
    contact: "petapp@example.com",
    author: "정반려",
  },
];

/**
 * 모집글 목록 조회 (동기).
 * - Supabase 사용 시: 마지막 fetch 결과 캐시 반환 (최초/갱신은 fetchRecruitments 호출 필요)
 * - 미사용 시: localStorage
 */
export function getRecruitments(): Recruitment[] {
  if (isSupabaseConfigured()) return recruitmentsCache;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
    return sampleData;
  }
  return JSON.parse(stored);
}

/**
 * 모집글 목록 원격 갱신 (Supabase 사용 시).
 * - Supabase: 서버에서 조회 후 캐시 갱신, 반환
 * - 미사용 시: getRecruitments() 그대로 반환
 */
export async function fetchRecruitments(): Promise<Recruitment[]> {
  if (isSupabaseConfigured()) {
    const data = await getRecruitmentsFromSupabase();
    recruitmentsCache = data;
    return data;
  }
  return getRecruitments();
}

/**
 * 단일 모집글 최신 조회 (지원자 목록 포함).
 * - 상세 다이얼로그/공유 페이지 열 때 호출해 항상 최신 applicants 반영
 */
export async function fetchRecruitmentById(id: string): Promise<Recruitment | null> {
  const list = await fetchRecruitments();
  return list.find((r) => r.id === id) ?? null;
}

export async function saveRecruitment(recruitment: Recruitment): Promise<void> {
  if (isSupabaseConfigured()) {
    await saveRecruitmentToSupabase(recruitment);
    await fetchRecruitments();
    return;
  }
  const list = getRecruitments();
  list.unshift(recruitment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function updateRecruitment(updated: Recruitment): Promise<void> {
  if (isSupabaseConfigured()) {
    await updateRecruitmentInSupabase(updated);
    await fetchRecruitments();
    return;
  }
  const list = getRecruitments().map((r) => (r.id === updated.id ? updated : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function deleteRecruitment(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await deleteRecruitmentFromSupabase(id);
    await fetchRecruitments();
    return;
  }
  const list = getRecruitments().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const categories: RecruitmentCategory[] = [
  "스터디",
  "프로젝트",
  "동아리",
  "대회/공모전",
  "봉사활동",
  "게임",
  "간술",
  "보드게임",
  "스포츠",
  "기타",
];
