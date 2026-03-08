import type { WorkspaceTask } from "./types";
import { isSupabaseConfigured } from "./supabase";
import {
  getWorkspaceTasksFromSupabase,
  addWorkspaceTaskToSupabase,
  updateWorkspaceTaskInSupabase,
  deleteWorkspaceTaskFromSupabase,
  getHeatmapColorsFromSupabase,
  setHeatmapColorInSupabase,
} from "./supabase-workspace";

const TASKS_KEY = (workspaceId: string) => `workspace_tasks_${workspaceId}`;
const SESSION_KEY = (workspaceId: string) => `workspace_session_${workspaceId}`;
const HEATMAP_COLORS_KEY = (workspaceId: string) => `workspace_heatmap_colors_${workspaceId}`;

export function getWorkspaceSession(workspaceId: string): { nickname: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY(workspaceId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setWorkspaceSession(workspaceId: string, nickname: string): void {
  sessionStorage.setItem(SESSION_KEY(workspaceId), JSON.stringify({ nickname }));
}

export function clearWorkspaceSession(workspaceId: string): void {
  sessionStorage.removeItem(SESSION_KEY(workspaceId));
}

/** Supabase 미사용 시에만 사용. Supabase 사용 시에는 fetch 후 캐시/state 사용 */
export function getWorkspaceTasks(workspaceId: string): WorkspaceTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY(workspaceId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 오늘 날짜 YYYY-MM-DD (로컬) */
function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 주 단위 키: 월요일 시작 주 (월~일) 기준 year-weekIndex */
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + monOffset);
  const y = monday.getFullYear();
  const start = new Date(y, 0, 1);
  const weekNum = Math.floor((monday.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${y}-${weekNum}`;
}

/** 반복 주기 적용: 일일/주간/월간 과제는 새 주기가 되면 자동으로 진행중으로 초기화 */
export function applyRepeatCycleResets(workspaceId: string): void {
  const tasks = getWorkspaceTasks(workspaceId);
  const today = getTodayLocal();
  const todayWeek = getWeekKey(today);
  const todayMonth = today.slice(0, 7);

  const next = tasks.map((t) => {
    if (t.status !== "completed" || t.repeatCycle === "none" || !t.completedAt) return t;
    const completedDate = t.completedAt.slice(0, 10);
    let shouldReset = false;
    if (t.repeatCycle === "daily") {
      shouldReset = completedDate !== today;
    } else if (t.repeatCycle === "weekly") {
      shouldReset = getWeekKey(completedDate) !== todayWeek;
    } else if (t.repeatCycle === "monthly") {
      shouldReset = completedDate.slice(0, 7) !== todayMonth;
    }
    if (!shouldReset) return t;
    return {
      ...t,
      status: "in_progress" as const,
      completedBy: undefined,
      completedAt: undefined,
    };
  });

  const changed = next.some((t, i) => t !== tasks[i]);
  if (changed) saveWorkspaceTasks(workspaceId, next);
}

/** 과제 목록 조회 (반복 주기 자동 초기화 적용 후 반환) - 동기, 로컬 전용 */
export function getWorkspaceTasksWithResets(workspaceId: string): WorkspaceTask[] {
  applyRepeatCycleResets(workspaceId);
  return getWorkspaceTasks(workspaceId);
}

/**
 * 과제 목록 조회 (Supabase 사용 시 비동기).
 * - Supabase: 서버에서 조회 후 반복 주기 리셋 적용, 필요 시 DB 반영 후 반환
 * - 로컬: 동기 결과를 Promise로 반환
 */
export async function getWorkspaceTasksWithResetsAsync(workspaceId: string): Promise<WorkspaceTask[]> {
  if (isSupabaseConfigured()) {
    let tasks = await getWorkspaceTasksFromSupabase(workspaceId);
    const today = getTodayLocal();
    const todayWeek = getWeekKey(today);
    const todayMonth = today.slice(0, 7);
    const next = tasks.map((t) => {
      if (t.status !== "completed" || t.repeatCycle === "none" || !t.completedAt) return t;
      const completedDate = t.completedAt.slice(0, 10);
      let shouldReset = false;
      if (t.repeatCycle === "daily") shouldReset = completedDate !== today;
      else if (t.repeatCycle === "weekly") shouldReset = getWeekKey(completedDate) !== todayWeek;
      else if (t.repeatCycle === "monthly") shouldReset = completedDate.slice(0, 7) !== todayMonth;
      if (!shouldReset) return t;
      return { ...t, status: "in_progress" as const, completedBy: undefined, completedAt: undefined };
    });
    const toReset = next.filter((t, i) => t !== tasks[i]);
    for (const t of toReset) {
      await updateWorkspaceTaskInSupabase(workspaceId, t.id, { status: "in_progress", completedBy: undefined, completedAt: undefined });
    }
    return next;
  }
  return Promise.resolve(getWorkspaceTasksWithResets(workspaceId));
}

function saveWorkspaceTasks(workspaceId: string, tasks: WorkspaceTask[]): void {
  localStorage.setItem(TASKS_KEY(workspaceId), JSON.stringify(tasks));
}

export async function addWorkspaceTaskAsync(
  workspaceId: string,
  task: Omit<WorkspaceTask, "id" | "createdAt" | "status">
): Promise<WorkspaceTask> {
  if (isSupabaseConfigured()) return addWorkspaceTaskToSupabase(workspaceId, task);
  const newTask: WorkspaceTask = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: "in_progress",
  };
  const tasks = getWorkspaceTasks(workspaceId);
  tasks.push(newTask);
  saveWorkspaceTasks(workspaceId, tasks);
  return newTask;
}
export function addWorkspaceTask(workspaceId: string, task: Omit<WorkspaceTask, "id" | "createdAt" | "status">): WorkspaceTask {
  const tasks = getWorkspaceTasks(workspaceId);
  const newTask: WorkspaceTask = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: "in_progress",
  };
  tasks.push(newTask);
  saveWorkspaceTasks(workspaceId, tasks);
  return newTask;
}

export async function updateWorkspaceTaskAsync(
  workspaceId: string,
  taskId: string,
  updates: Partial<Pick<WorkspaceTask, "status" | "completedBy" | "completedAt">>
): Promise<void> {
  if (isSupabaseConfigured()) {
    await updateWorkspaceTaskInSupabase(workspaceId, taskId, updates);
    return;
  }
  updateWorkspaceTask(workspaceId, taskId, updates);
}
export function updateWorkspaceTask(workspaceId: string, taskId: string, updates: Partial<WorkspaceTask>): void {
  const tasks = getWorkspaceTasks(workspaceId).map((t) =>
    t.id === taskId ? { ...t, ...updates } : t
  );
  saveWorkspaceTasks(workspaceId, tasks);
}

export async function deleteWorkspaceTaskAsync(workspaceId: string, taskId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await deleteWorkspaceTaskFromSupabase(workspaceId, taskId);
    return;
  }
  deleteWorkspaceTask(workspaceId, taskId);
}
export function deleteWorkspaceTask(workspaceId: string, taskId: string): void {
  const tasks = getWorkspaceTasks(workspaceId).filter((t) => t.id !== taskId);
  saveWorkspaceTasks(workspaceId, tasks);
}

export async function completeTaskAsync(workspaceId: string, taskId: string, completedBy: string): Promise<void> {
  const completedAt = new Date().toISOString();
  if (isSupabaseConfigured()) {
    await updateWorkspaceTaskInSupabase(workspaceId, taskId, { status: "completed", completedBy, completedAt });
    return;
  }
  completeTask(workspaceId, taskId, completedBy);
}
export function completeTask(workspaceId: string, taskId: string, completedBy: string): void {
  updateWorkspaceTask(workspaceId, taskId, {
    status: "completed",
    completedBy,
    completedAt: new Date().toISOString(),
  });
}

export async function revertTaskAsync(workspaceId: string, taskId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await updateWorkspaceTaskInSupabase(workspaceId, taskId, {
      status: "in_progress",
      completedBy: undefined,
      completedAt: undefined,
    });
    return;
  }
  revertTask(workspaceId, taskId);
}
export function revertTask(workspaceId: string, taskId: string): void {
  updateWorkspaceTask(workspaceId, taskId, {
    status: "in_progress",
    completedBy: undefined,
    completedAt: undefined,
  });
}

/** 과제에서 등장하는 참여자 닉네임 목록 (생성자, 담당자, 완료자). Supabase 사용 시 tasks 인자로 넘긴 목록 기준 */
export function getTaskParticipants(workspaceId: string, tasks?: WorkspaceTask[]): string[] {
  const list = tasks ?? getWorkspaceTasks(workspaceId);
  const set = new Set<string>();
  list.forEach((t) => {
    set.add(t.createdBy);
    if (t.assignee) set.add(t.assignee);
    if (t.completedBy) set.add(t.completedBy);
  });
  return Array.from(set).sort();
}

/** 개인별 히트맵 색상 조회 (Supabase 사용 시 비동기) */
export async function getHeatmapColorsAsync(workspaceId: string): Promise<Record<string, string>> {
  if (isSupabaseConfigured()) return getHeatmapColorsFromSupabase(workspaceId);
  try {
    const raw = localStorage.getItem(HEATMAP_COLORS_KEY(workspaceId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
export function getHeatmapColors(workspaceId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(HEATMAP_COLORS_KEY(workspaceId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setHeatmapColorAsync(workspaceId: string, nickname: string, color: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await setHeatmapColorInSupabase(workspaceId, nickname, color);
    return;
  }
  setHeatmapColor(workspaceId, nickname, color);
}
export function setHeatmapColor(workspaceId: string, nickname: string, color: string): void {
  const colors = getHeatmapColors(workspaceId);
  colors[nickname] = color;
  localStorage.setItem(HEATMAP_COLORS_KEY(workspaceId), JSON.stringify(colors));
}
