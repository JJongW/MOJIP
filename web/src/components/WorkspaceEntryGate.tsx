import { useState } from "react";
import type { Recruitment } from "@/lib/types";
import { setWorkspaceSession } from "@/lib/workspace-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, User } from "lucide-react";

/** 입장 허용 닉네임 = 작성자 + 지원자 이름 (정해진 닉네임이 아니면 벤) */
function getAllowedNicknames(recruitment: Recruitment): string[] {
  const names = new Set<string>();
  names.add(recruitment.author);
  recruitment.applicants?.forEach((a) => names.add(a.name));
  return Array.from(names);
}

interface Props {
  recruitment: Recruitment;
  onEnter: () => void;
}

export default function WorkspaceEntryGate({ recruitment, onEnter }: Props) {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const allowed = getAllowedNicknames(recruitment);
  const hasAccessCode = !!recruitment.accessCode?.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (hasAccessCode) {
      if (!code.trim()) {
        setError("워크스페이스 코드를 입력해주세요.");
        return;
      }
      if (code.trim() !== recruitment.accessCode) {
        setError("워크스페이스 코드가 올바르지 않습니다.");
        return;
      }
    }

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    const normalizedNick = nickname.trim();
    if (!allowed.includes(normalizedNick)) {
      setError("입장 권한이 없습니다. 허용된 닉네임이 아닙니다.");
      return;
    }

    setWorkspaceSession(recruitment.id, normalizedNick);
    onEnter();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="glass rounded-2xl border-white/10 p-8 w-full max-w-md">
        <h2 className="text-xl font-bold text-foreground mb-1">워크스페이스 입장</h2>
        <p className="text-sm text-muted-foreground mb-6">{recruitment.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasAccessCode && (
            <div className="space-y-2">
              <Label htmlFor="ws-code">워크스페이스 코드 *</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ws-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="참여 코드 입력"
                  className="pl-10 glass border-white/10"
                  autoComplete="off"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="ws-nickname">닉네임 *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ws-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="모집에서 사용한 닉네임"
                className="pl-10 glass border-white/10"
                autoComplete="username"
              />
            </div>
            <p className="text-xs text-muted-foreground">지원 시 사용한 이름 또는 작성자만 입장할 수 있습니다.</p>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            입장하기
          </Button>
        </form>
      </div>
    </div>
  );
}
