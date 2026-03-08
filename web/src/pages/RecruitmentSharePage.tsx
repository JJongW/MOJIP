/**
 * 공유 전용 모집 상세 페이지 (/r/:id?apply=1)
 * - 카카오톡 등으로 링크 공유 시 이 URL로 진입
 * - ?apply=1 이면 지원하기 다이얼로그 자동 오픈
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Mail, User, ArrowLeft, Share2 } from "lucide-react";
import { fetchRecruitments, updateRecruitment } from "@/lib/store";
import { formatDateTimeDisplay } from "@/lib/util";
import { shareRecruitment } from "@/lib/kakao-share";
import type { Recruitment, Applicant } from "@/lib/types";
import { toast } from "sonner";
import ApplyDialog from "@/components/ApplyDialog";

export default function RecruitmentSharePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applyParam = searchParams.get("apply") === "1";

  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const list = await fetchRecruitments();
      const found = list.find((r) => r.id === id) ?? null;
      setRecruitment(found);
      if (found && applyParam) setApplyOpen(true);
    } finally {
      setLoading(false);
    }
  }, [id, applyParam]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async (applicant: Applicant) => {
    if (!recruitment) return;
    const applicants = recruitment.applicants ?? [];
    const updated: Recruitment = {
      ...recruitment,
      currentMembers: recruitment.currentMembers + 1,
      applicants: [...applicants, applicant],
      status:
        recruitment.maxMembers != null && recruitment.currentMembers + 1 >= recruitment.maxMembers
          ? "모집완료"
          : recruitment.status,
    };
    await updateRecruitment(updated);
    toast.success(`${applicant.name}님의 지원이 완료되었습니다!`);
    setApplyOpen(false);
    load();
  };

  const handleShare = async () => {
    if (!recruitment) return;
    const result = await shareRecruitment(recruitment, { openApply: true });
    if (result === "copy") toast.success("링크가 복사되었습니다. 카카오톡에 붙여넣기 하세요.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!recruitment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">모집글을 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>
    );
  }

  const isClosed = recruitment.status === "모집완료";
  const progress =
    recruitment.maxMembers != null
      ? (recruitment.currentMembers / recruitment.maxMembers) * 100
      : null;
  const canApply =
    !isClosed &&
    (recruitment.maxMembers == null || recruitment.currentMembers < recruitment.maxMembers);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            목록
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1.5" />
            카카오톡으로 공유
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={isClosed ? "closed" : "success"}>{recruitment.status}</Badge>
            <Badge variant="secondary">{recruitment.category}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{recruitment.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {recruitment.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {recruitment.createdAt}
            </span>
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{recruitment.description}</p>

          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" /> 인원
              </span>
              <span className="font-semibold">
                {recruitment.maxMembers != null
                  ? `${recruitment.currentMembers} / ${recruitment.maxMembers}명`
                  : `${recruitment.currentMembers}명 (무제한)`}
              </span>
            </div>
            {progress != null && (
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> 마감일
              </span>
              <span className="font-semibold">{formatDateTimeDisplay(recruitment.deadline)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> 연락처
              </span>
              <span className="font-semibold break-all">{recruitment.contact}</span>
            </div>
          </div>

          {recruitment.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {recruitment.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {canApply && (
            <Button className="w-full" size="lg" onClick={() => setApplyOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              지원하기
            </Button>
          )}
        </div>
      </main>

      <ApplyDialog open={applyOpen} onOpenChange={setApplyOpen} onApply={handleApply} accessCode={recruitment.accessCode} />
    </div>
  );
}
