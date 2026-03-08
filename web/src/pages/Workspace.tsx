import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getRecruitments } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getWorkspaceSession,
  setWorkspaceSession,
  clearWorkspaceSession,
  getWorkspaceTasksWithResets,
  getWorkspaceTasksWithResetsAsync,
  addWorkspaceTask,
  addWorkspaceTaskAsync,
  deleteWorkspaceTask,
  deleteWorkspaceTaskAsync,
  completeTask,
  completeTaskAsync,
  revertTask,
  revertTaskAsync,
  getTaskParticipants,
  getHeatmapColors,
  getHeatmapColorsAsync,
  setHeatmapColor,
  setHeatmapColorAsync,
} from "@/lib/workspace-store";
import type { WorkspaceTask } from "@/lib/types";
import WorkspaceEntryGate from "@/components/WorkspaceEntryGate";
import AddTaskModal from "@/components/AddTaskModal";
import IndividualHeatmap from "@/components/IndividualHeatmap";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ArrowLeft, Plus, Trophy, RotateCcw, Trash2, CheckCircle2, Circle } from "lucide-react";

/** 인원별 히트맵 기본 색상 (순서대로 적용, 저장된 값이 없을 때 사용) */
const HEATMAP_PALETTE = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const Workspace = () => {
  const { id } = useParams<{ id: string }>();
  const recruitments = getRecruitments();
  const recruitment = id ? recruitments.find((r) => r.id === id) : null;

  const [sessionNickname, setSessionNickname] = useState<string | null>(() =>
    id ? getWorkspaceSession(id)?.nickname ?? null : null
  );
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [heatmapColors, setHeatmapColors] = useState<Record<string, string>>({});

  const refreshTasks = useCallback(async () => {
    if (!id) return;
    const list = isSupabaseConfigured()
      ? await getWorkspaceTasksWithResetsAsync(id)
      : getWorkspaceTasksWithResets(id);
    setTasks(list);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    refreshTasks();
  }, [id, refreshTasks]);

  useEffect(() => {
    if (!id) return;
    if (isSupabaseConfigured()) {
      getHeatmapColorsAsync(id).then(setHeatmapColors);
    } else {
      setHeatmapColors(getHeatmapColors(id));
    }
  }, [id]);

  const handleEnter = useCallback(() => {
    if (id) setSessionNickname(getWorkspaceSession(id)?.nickname ?? null);
    refreshTasks();
  }, [id, refreshTasks]);

  const handleLogout = useCallback(() => {
    if (id) {
      clearWorkspaceSession(id);
      setSessionNickname(null);
    }
  }, [id]);

  const handleHeatmapColorChange = useCallback(
    async (nick: string, color: string) => {
      if (!id) return;
      if (isSupabaseConfigured()) await setHeatmapColorAsync(id, nick, color);
      else setHeatmapColor(id, nick, color);
      setHeatmapColors((prev) => ({ ...prev, [nick]: color }));
    },
    [id]
  );

  if (!recruitment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass rounded-2xl px-8 py-10 text-center border-white/10 max-w-md">
          <p className="text-muted-foreground mb-4">해당 모집글을 찾을 수 없습니다.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // accessCode 없으면 바로 입장 (기존 링크로 들어온 경우)
  const needsEntry = recruitment.accessCode
    ? !sessionNickname
    : !sessionNickname;

  if (needsEntry && recruitment.accessCode) {
    return (
      <WorkspaceEntryGate
        recruitment={recruitment}
        onEnter={handleEnter}
      />
    );
  }

  // accessCode 없을 때 첫 방문: 닉네임만 입력받고 입장 (작성자 또는 지원자만 허용)
  if (needsEntry && !recruitment.accessCode) {
    const allowed = [recruitment.author, ...(recruitment.applicants?.map((a) => a.name) ?? [])];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-xl font-bold mb-2">워크스페이스 입장</h2>
          <p className="text-sm text-muted-foreground mb-4">닉네임을 입력하세요. (작성자 또는 지원자만 입장 가능)</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const nick = (e.currentTarget.elements.namedItem("nickname") as HTMLInputElement)?.value?.trim();
              if (!nick) return;
              if (!allowed.includes(nick)) {
                alert("입장 권한이 없습니다.");
                return;
              }
              setWorkspaceSession(recruitment.id, nick);
              handleEnter();
            }}
            className="space-y-4"
          >
            <input
              name="nickname"
              placeholder="닉네임"
              className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-foreground"
              autoComplete="username"
            />
            <Button type="submit" className="w-full">입장하기</Button>
          </form>
        </div>
      </div>
    );
  }

  const currentUser = sessionNickname ?? "";
  const participants = getTaskParticipants(id!, tasks);
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const completed = tasks.filter((t) => t.status === "completed");

  const handleAddTask = async (task: Omit<WorkspaceTask, "id" | "createdAt" | "status">) => {
    if (!id) return;
    if (isSupabaseConfigured()) await addWorkspaceTaskAsync(id, task);
    else addWorkspaceTask(id, task);
    await refreshTasks();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="목록으로"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <LayoutDashboard className="h-5 w-5 text-primary shrink-0" />
            <div>
              <h1 className="text-lg font-bold truncate max-w-[180px] sm:max-w-none">{recruitment.title}</h1>
              <p className="text-xs text-muted-foreground">{currentUser}님으로 참여 중</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-white/10">
              나가기
            </Button>
            <Button size="sm" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              새 과제
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* 요약 카드 */}
        <section className="grid grid-cols-3 gap-4 max-w-md">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">전체 과제</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{inProgress.length}</p>
            <p className="text-xs text-muted-foreground mt-1">진행중</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-success">{completed.length}</p>
            <p className="text-xs text-muted-foreground mt-1">완료</p>
          </div>
        </section>

        {/* 개인별 히트맵만 (전체 활동 히트맵 제거) */}
        {participants.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">개인별 활동</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {participants.map((nick, idx) => (
                <IndividualHeatmap
                  key={nick}
                  nickname={nick}
                  tasks={tasks}
                  color={heatmapColors[nick] ?? HEATMAP_PALETTE[idx % HEATMAP_PALETTE.length]}
                  onColorChange={(c) => handleHeatmapColorChange(nick, c)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 진행중인 과제 */}
        <section className="glass rounded-xl p-6 border-white/10">
          <h2 className="text-sm font-semibold text-foreground mb-4">■ 진행중인 과제</h2>
          {inProgress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>모든 과제를 완료했습니다!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {inProgress.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  currentUser={currentUser}
                  onComplete={async () => {
                    if (isSupabaseConfigured()) await completeTaskAsync(id!, t.id, currentUser);
                    else completeTask(id!, t.id, currentUser);
                    await refreshTasks();
                  }}
                  onRevert={async () => {
                    if (isSupabaseConfigured()) await revertTaskAsync(id!, t.id);
                    else revertTask(id!, t.id);
                    await refreshTasks();
                  }}
                  onDelete={async () => {
                    if (isSupabaseConfigured()) await deleteWorkspaceTaskAsync(id!, t.id);
                    else deleteWorkspaceTask(id!, t.id);
                    await refreshTasks();
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        {/* 완료된 과제 */}
        <section className="glass rounded-xl p-6 border-white/10 border-l-4 border-l-success/60">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" aria-hidden />
            <span>완료된 과제</span>
            {completed.length > 0 && (
              <span className="text-xs font-normal text-success bg-success/15 px-2 py-0.5 rounded-full">{completed.length}건</span>
            )}
          </h2>
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">완료된 과제가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {completed.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  currentUser={currentUser}
                  onComplete={() => {}}
                  onRevert={async () => {
                    if (isSupabaseConfigured()) await revertTaskAsync(id!, t.id);
                    else revertTask(id!, t.id);
                    await refreshTasks();
                  }}
                  onDelete={async () => {
                    if (isSupabaseConfigured()) await deleteWorkspaceTaskAsync(id!, t.id);
                    else deleteWorkspaceTask(id!, t.id);
                    await refreshTasks();
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <AddTaskModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdded={refreshTasks}
        createdBy={currentUser}
        participantNames={participants.length > 0 ? participants : [currentUser]}
        addTask={handleAddTask}
      />
    </div>
  );
};

function TaskRow({
  task,
  currentUser,
  onComplete,
  onRevert,
  onDelete,
}: {
  task: WorkspaceTask;
  currentUser: string;
  onComplete: () => void;
  onRevert: () => void;
  onDelete: () => void;
}) {
  const isOwn = task.createdBy === currentUser || task.assignee === currentUser;
  const isCompleted = task.status === "completed";

  return (
    <li className={`flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0 ${isCompleted ? "bg-success/5 rounded-lg -mx-1 px-2" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" aria-hidden />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" aria-hidden />
          )}
          <p className={`font-medium truncate ${isCompleted ? "text-foreground/90" : "text-foreground"}`}>{task.title}</p>
          {isCompleted && (
            <span className="shrink-0 text-xs font-medium text-success bg-success/15 px-2 py-0.5 rounded" title="완료됨">
              완료
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 ml-7">
          {task.dueDate ? `마감 -${task.dueDate}` : ""}
          {task.assignee && (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-primary/60 mx-1.5 align-middle" />
              {task.assignee}
            </>
          )}
        </p>
        {task.status === "completed" && task.completedBy && task.completedAt && (
          <p className="text-xs text-success/90 mt-0.5 ml-7">
            {task.completedBy}님 완료 · {task.completedAt.slice(0, 10)} · 활동 히트맵에 반영됨
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {task.status === "in_progress" && isOwn && (
          <Button
            size="sm"
            className="h-9 px-4 bg-success hover:bg-success/90 text-success-foreground border-0 font-medium cursor-pointer"
            onClick={onComplete}
            title="이 과제를 완료 처리합니다. 완료 시 활동 히트맵에 바로 반영됩니다."
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
            완료
          </Button>
        )}
        {task.status === "completed" && isOwn && (
          <button
            type="button"
            onClick={onRevert}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
            title="되돌리기"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        {isOwn && (
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-white/5 transition-colors cursor-pointer"
            title="삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

export default Workspace;
