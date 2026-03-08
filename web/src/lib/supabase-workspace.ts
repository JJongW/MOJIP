/**
 * 워크스페이스 과제·히트맵 색상 Supabase 데이터 레이어
 * workspace_id = recruitment.id (UUID 문자열)
 */
import { supabase } from "./supabase";
import type { WorkspaceTask } from "./types";

type DbTask = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  repeat_cycle: string;
  start_date: string;
  due_date: string | null;
  assignee: string | null;
  created_by: string;
  created_at: string;
  status: string;
  completed_by: string | null;
  completed_at: string | null;
};

function toTask(row: DbTask): WorkspaceTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    repeatCycle: row.repeat_cycle as WorkspaceTask["repeatCycle"],
    startDate: row.start_date,
    dueDate: row.due_date ?? undefined,
    assignee: row.assignee ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    status: row.status as WorkspaceTask["status"],
    completedBy: row.completed_by ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export async function getWorkspaceTasksFromSupabase(workspaceId: string): Promise<WorkspaceTask[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("workspace_tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => toTask(r as DbTask));
}

export async function addWorkspaceTaskToSupabase(
  workspaceId: string,
  task: Omit<WorkspaceTask, "id" | "createdAt" | "status">
): Promise<WorkspaceTask> {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("workspace_tasks")
    .insert({
      workspace_id: workspaceId,
      title: task.title,
      description: task.description ?? null,
      repeat_cycle: task.repeatCycle,
      start_date: task.startDate,
      due_date: task.dueDate ?? null,
      assignee: task.assignee ?? null,
      created_by: task.createdBy,
      status: "in_progress",
    })
    .select()
    .single();

  if (error) throw error;
  return toTask(data as DbTask);
}

export async function updateWorkspaceTaskInSupabase(
  workspaceId: string,
  taskId: string,
  updates: Partial<Pick<WorkspaceTask, "status" | "completedBy" | "completedAt">>
): Promise<void> {
  if (!supabase) return;

  const row: Record<string, unknown> = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.completedBy !== undefined) row.completed_by = updates.completedBy;
  if (updates.completedAt !== undefined) row.completed_at = updates.completedAt;

  const { error } = await supabase
    .from("workspace_tasks")
    .update(row)
    .eq("workspace_id", workspaceId)
    .eq("id", taskId);

  if (error) throw error;
}

export async function deleteWorkspaceTaskFromSupabase(workspaceId: string, taskId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("workspace_tasks")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", taskId);
  if (error) throw error;
}

export async function getHeatmapColorsFromSupabase(workspaceId: string): Promise<Record<string, string>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("workspace_heatmap_colors")
    .select("nickname, color")
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  const out: Record<string, string> = {};
  (data ?? []).forEach((r: { nickname: string; color: string }) => {
    out[r.nickname] = r.color;
  });
  return out;
}

export async function setHeatmapColorInSupabase(
  workspaceId: string,
  nickname: string,
  color: string
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("workspace_heatmap_colors").upsert(
    { workspace_id: workspaceId, nickname, color },
    { onConflict: "workspace_id,nickname" }
  );
  if (error) throw error;
}
