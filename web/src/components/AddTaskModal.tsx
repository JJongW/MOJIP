import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkspaceTask, TaskRepeatCycle } from "@/lib/types";

const REPEAT_OPTIONS: { value: TaskRepeatCycle; label: string }[] = [
  { value: "none", label: "반복 없음" },
  { value: "daily", label: "매일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
];

const ASSIGNEE_NONE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  createdBy: string;
  participantNames: string[];
  addTask: (task: Omit<WorkspaceTask, "id" | "createdAt" | "status">) => void | Promise<void>;
}

export default function AddTaskModal({
  open,
  onOpenChange,
  onAdded,
  createdBy,
  participantNames,
  addTask,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repeatCycle, setRepeatCycle] = useState<TaskRepeatCycle>("none");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState(ASSIGNEE_NONE);

  const reset = () => {
    setTitle("");
    setDescription("");
    setRepeatCycle("none");
    setStartDate("");
    setDueDate("");
    setAssignee(ASSIGNEE_NONE);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;
    await addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      repeatCycle,
      startDate: startDate || new Date().toISOString().slice(0, 16),
      dueDate: dueDate || undefined,
      assignee: assignee === ASSIGNEE_NONE ? undefined : assignee,
      createdBy,
    });
    reset();
    onOpenChange(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">새 과제 추가</DialogTitle>
          <DialogDescription className="text-center">
            팀원들이 수행할 과제를 추가하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">과제 제목 *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="과제 제목"
              className="border-white/10 bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">설명</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 설명 (선택)"
              rows={3}
              className="border-white/10 bg-white/5 resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>반복 주기</Label>
            <Select value={repeatCycle} onValueChange={(v) => setRepeatCycle(v as TaskRepeatCycle)}>
              <SelectTrigger className="border-white/10 bg-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPEAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-start">시작 날짜·시간</Label>
              <Input
                id="task-start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">마감일·시간</Label>
              <Input
                id="task-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-white/10 bg-white/5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>담당자 (선택)</Label>
            <Select value={assignee} onValueChange={(v) => setAssignee(v)}>
              <SelectTrigger className="border-white/10 bg-white/5">
                <SelectValue placeholder="담당자 이름 (선택)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ASSIGNEE_NONE}>선택 안 함</SelectItem>
                {participantNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={() => handleSubmit()} disabled={!title.trim()}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
