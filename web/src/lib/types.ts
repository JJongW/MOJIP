export type RecruitmentCategory = 
  | "스터디" 
  | "프로젝트" 
  | "동아리" 
  | "대회/공모전" 
  | "봉사활동" 
  | "기타";

export type RecruitmentStatus = "모집중" | "모집완료";

/** 지원자 정보 (상세 다이얼로그·지원하기 폼에서 사용) */
export interface Applicant {
  id: string;
  name: string;
  appliedAt: string;
  email?: string;
  phone?: string;
  affiliation?: string;
}

export interface Recruitment {
  id: string;
  title: string;
  description: string;
  category: RecruitmentCategory;
  status: RecruitmentStatus;
  currentMembers: number;
  /** 무제한 모집 시 null */
  maxMembers: number | null;
  deadline: string;
  createdAt: string;
  tags: string[];
  contact: string;
  author: string;
  /** 팀 워크스페이스 참여 코드 (선택) */
  accessCode?: string;
  /** 지원자 목록 (상세에서만 사용) */
  applicants?: Applicant[];
}

/** 과제 반복 주기 */
export type TaskRepeatCycle = "none" | "daily" | "weekly" | "monthly";

/** 워크스페이스 과제 (팀 단위) */
export interface WorkspaceTask {
  id: string;
  title: string;
  description?: string;
  repeatCycle: TaskRepeatCycle;
  startDate: string; // YYYY-MM-DD
  dueDate?: string;
  assignee?: string; // 닉네임
  createdBy: string; // 닉네임
  createdAt: string; // ISO
  status: "in_progress" | "completed";
  completedBy?: string;
  completedAt?: string; // ISO
}
