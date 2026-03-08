import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { categories, saveRecruitment } from "@/lib/store";
import type { Recruitment, RecruitmentCategory } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateRecruitmentDialog({ open, onOpenChange, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [maxMembers, setMaxMembers] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tags, setTags] = useState("");
  const [contact, setContact] = useState("");
  const [author, setAuthor] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "제목을 입력해주세요.";
    if (!author.trim()) e.author = "작성자를 입력해주세요.";
    if (!category) e.category = "카테고리를 선택해주세요.";
    if (maxMembers &&parseInt(maxMembers) < 2) e.maxMembers = "2명 이상 입력해주세요.";
    if (!deadline) e.deadline = "마감일을 선택해주세요.";
    if (!description.trim()) e.description = "상세 설명을 입력해주세요.";
    if (!contact.trim()) e.contact = "연락처를 입력해주세요.";
    return e;
  }, [title, author, category, maxMembers, deadline, description, contact]);

  const isValid = Object.keys(errors).length === 0;

  const reset = () => {
    setTitle(""); setDescription(""); setCategory(""); setMaxMembers("");
    setDeadline(""); setTags(""); setContact(""); setAuthor(""); setAccessCode("");
    setTouched({});
  };

  const handleSubmit = async () => {
    setTouched({ title: true, author: true, category: true, maxMembers: true, deadline: true, description: true, contact: true });
    if (!isValid) {
      toast.error("필수 항목을 모두 입력해주세요.", {
        description: Object.values(errors).join(" / "),
      });
      return;
    }
    const recruitment: Recruitment = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category: category as Recruitment["category"],
      status: "모집중",
      currentMembers: 1,
      maxMembers: maxMembers ? parseInt(maxMembers) : null,
      deadline,
      createdAt: new Date().toISOString().split("T")[0],
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      contact: contact.trim(),
      author: author.trim(),
      accessCode: accessCode.trim() || undefined,
    };
    await saveRecruitment(recruitment);
    toast.success("모집글이 등록되었습니다!");
    reset();
    onOpenChange(false);
    onCreated();
  };

  const FieldError = ({ field }: { field: string }) =>
    touched[field] && errors[field] ? (
      <p className="text-xs text-destructive mt-1">{errors[field]}</p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">새 모집글 작성</DialogTitle>
          <DialogDescription>모집에 필요한 정보를 입력해주세요.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => markTouched("title")} placeholder="모집 제목을 입력하세요" maxLength={100} className={touched.title && errors.title ? "border-destructive" : ""} />
            <FieldError field="title" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="author">작성자 *</Label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} onBlur={() => markTouched("author")} placeholder="닉네임 또는 이름" maxLength={50} className={touched.author && errors.author ? "border-destructive" : ""} />
            <FieldError field="author" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>카테고리 *</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); markTouched("category"); }}>
                <SelectTrigger className={touched.category && errors.category ? "border-destructive" : ""}><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: RecruitmentCategory) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError field="category" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max">모집 인원 (미입력 시 무제한)</Label>
              <Input id="max" type="number" min={2} max={100} value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} onBlur={() => markTouched("maxMembers")} placeholder="미입력 시 무제한" className={touched.maxMembers && errors.maxMembers ? "border-destructive" : ""} />
              <FieldError field="maxMembers" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="deadline">모집 마감일 *</Label>
            <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} onBlur={() => markTouched("deadline")} className={touched.deadline && errors.deadline ? "border-destructive" : ""} />
            <FieldError field="deadline" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc">상세 설명 *</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={() => markTouched("description")} placeholder="모집 내용을 자세히 적어주세요" rows={4} maxLength={1000} className={touched.description && errors.description ? "border-destructive" : ""} />
            <FieldError field="description" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="React, TypeScript, 프론트엔드" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact">연락처 *</Label>
            <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} onBlur={() => markTouched("contact")} placeholder="이메일 또는 오픈채팅 링크" maxLength={200} className={touched.contact && errors.contact ? "border-destructive" : ""} />
            <FieldError field="contact" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="accessCode">워크스페이스 참여 코드</Label>
            <Input id="accessCode" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="입력하면 팀 워크스페이스가 활성화됩니다" maxLength={20} />
            <p className="text-xs text-muted-foreground">팀원들이 과제를 관리할 수 있는 워크스페이스가 생성됩니다.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleSubmit} disabled={Object.keys(touched).length > 0 && !isValid} className="disabled:opacity-50">등록하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}