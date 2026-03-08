import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Recruitment, Applicant } from "@/lib/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Mail, User, CheckCircle2, XCircle, Phone, Building2, LayoutDashboard, Share2 } from "lucide-react";
import { updateRecruitment } from "@/lib/store";
import { shareRecruitment } from "@/lib/kakao-share";
import { toast } from "sonner";
import ApplyDialog from "./ApplyDialog";

interface Props {
  recruitment: Recruitment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export default function RecruitmentDetailDialog({ recruitment, open, onOpenChange, onUpdated }: Props) {
  const [applyOpen, setApplyOpen] = useState(false);
  const navigate = useNavigate();

  if (!recruitment) return null;

  const isClosed = recruitment.status === "모집완료";
  const progress = recruitment.maxMembers ? (recruitment.currentMembers / recruitment.maxMembers) * 100 : null;
  const applicants = recruitment.applicants || [];

  const toggleStatus = async () => {
    const updated = {
      ...recruitment,
      status: isClosed ? "모집중" as const : "모집완료" as const,
    };
    await updateRecruitment(updated);
    toast.success(isClosed ? "모집이 재개되었습니다." : "모집이 완료되었습니다.");
    onUpdated();
  };

  const handleApply = async (applicant: Applicant) => {
    const updated = {
      ...recruitment,
      currentMembers: recruitment.currentMembers + 1,
      applicants: [...applicants, applicant],
      status: recruitment.maxMembers && recruitment.currentMembers + 1 >= recruitment.maxMembers ? "모집완료" as const : recruitment.status,
    };
    await updateRecruitment(updated);
    toast.success(`${applicant.name}님의 지원이 완료되었습니다!`);
    onUpdated();
  };

  const handleShare = async () => {
    const result = await shareRecruitment(recruitment, { openApply: true });
    if (result === "copy") toast.success("링크가 복사되었습니다. 카카오톡에 붙여넣기 하세요.");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isClosed ? "closed" : "success"}>{recruitment.status}</Badge>
              <Badge variant="secondary">{recruitment.category}</Badge>
            </div>
            <DialogTitle className="text-xl">{recruitment.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-3 pt-1">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{recruitment.author}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{recruitment.createdAt}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{recruitment.description}</p>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> 인원
                </span>
                <span className="font-semibold">
                  {recruitment.maxMembers ? `${recruitment.currentMembers} / ${recruitment.maxMembers}명` : `${recruitment.currentMembers}명 (무제한)`}
                </span>
              </div>
              {progress !== null && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> 마감일
                </span>
                <span className="font-semibold">{recruitment.deadline}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> 연락처
                </span>
                <span className="font-semibold break-all">{recruitment.contact}</span>
              </div>
            </div>

            {applicants.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> 지원자 목록 ({applicants.length}명)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {applicants.map((a) => (
                    <div key={a.id} className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                      <div className="font-medium flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {a.name}
                        <span className="text-xs text-muted-foreground ml-auto">{a.appliedAt}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {a.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{a.email}</span>}
                        {a.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.phone}</span>}
                        {a.affiliation && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{a.affiliation}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recruitment.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {recruitment.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button variant="secondary" size="sm" className="w-full" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                카카오톡으로 공유
              </Button>
              <div className="flex gap-2">
                {!isClosed && (
                  <Button className="flex-1" onClick={() => setApplyOpen(true)} disabled={!!recruitment.maxMembers && recruitment.currentMembers >= recruitment.maxMembers}>
                    <Users className="h-4 w-4 mr-2" />
                    지원하기
                  </Button>
                )}
                <Button variant="outline" onClick={toggleStatus} className="flex-1">
                  {isClosed ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" />모집 재개</>
                  ) : (
                    <><XCircle className="h-4 w-4 mr-2" />모집 완료</>
                  )}
                </Button>
              </div>
              {recruitment.accessCode && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/workspace/${recruitment.id}`);
                  }}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  팀 워크스페이스 입장
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ApplyDialog open={applyOpen} onOpenChange={setApplyOpen} onApply={handleApply} />
    </>
  );
}
