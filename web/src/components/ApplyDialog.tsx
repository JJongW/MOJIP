import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutDashboard } from "lucide-react";
import type { Applicant } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (applicant: Applicant) => void;
  /** 워크스페이스가 있는 모집글일 때 입장 코드 (있으면 지원 완료 후 안내 모달 표시) */
  accessCode?: string;
}

export default function ApplyDialog({ open, onOpenChange, onApply, accessCode }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [workspaceCodeModalOpen, setWorkspaceCodeModalOpen] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const applicant: Applicant = {
      id: `app-${Date.now()}`,
      name: name.trim(),
      appliedAt: new Date().toISOString().split("T")[0],
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      affiliation: affiliation.trim() || undefined,
    };
    onApply(applicant);
    setName("");
    setEmail("");
    setPhone("");
    setAffiliation("");
    if (accessCode?.trim()) {
      setWorkspaceCodeModalOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleWorkspaceCodeComplete = () => {
    setWorkspaceCodeModalOpen(false);
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>지원하기</DialogTitle>
          <DialogDescription>참여 정보를 입력해주세요.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="apply-name">이름 / 닉네임 *</Label>
            <Input
              id="apply-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 또는 닉네임"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="apply-email">이메일</Label>
            <Input
              id="apply-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="apply-phone">연락처</Label>
            <Input
              id="apply-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="apply-affiliation">소속</Label>
            <Input
              id="apply-affiliation"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="학교, 회사, 동아리 등"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            지원하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={workspaceCodeModalOpen} onOpenChange={() => {}}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            워크스페이스 입장 코드
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-1">
              <p className="text-foreground">
                지원이 완료되었습니다. 팀 워크스페이스 입장 시 아래 코드를 사용하세요.
              </p>
              <p className="rounded-md bg-muted px-3 py-2 font-mono text-lg tracking-wider">
                {accessCode}
              </p>
              <p className="text-sm text-muted-foreground">
                모집글 상세에서 「팀 워크스페이스 입장」 시 이 코드를 입력하면 됩니다.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleWorkspaceCodeComplete}>완료</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
