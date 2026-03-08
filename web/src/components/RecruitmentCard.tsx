import type { Recruitment } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";

interface Props {
  recruitment: Recruitment;
  onView: (r: Recruitment) => void;
}

const categoryColors: Record<string, string> = {
  "스터디": "bg-accent text-accent-foreground",
  "프로젝트": "bg-primary/20 text-primary",
  "동아리": "bg-warning/20 text-warning",
  "대회/공모전": "bg-destructive/20 text-destructive",
  "봉사활동": "bg-success/20 text-success",
  "게임": "bg-secondary text-secondary-foreground",
  "기타": "bg-muted text-muted-foreground",
};

export default function RecruitmentCard({ recruitment, onView }: Props) {
  const isClosed = recruitment.status === "모집완료";
  const progress = recruitment.maxMembers ? (recruitment.currentMembers / recruitment.maxMembers) * 100 : null;

  return (
    <Card
      className={`glass group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-white/10 hover:bg-white/[0.08] ${
        isClosed ? "opacity-70" : ""
      }`}
      onClick={() => onView(recruitment)}
    >
      {isClosed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <Badge variant="closed" className="text-sm px-4 py-1.5 shadow-md">모집완료</Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[recruitment.category] || categoryColors["기타"]}`}>
            {recruitment.category}
          </span>
          {!isClosed && (
            <Badge variant="success" className="text-xs">모집중</Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-snug line-clamp-2">{recruitment.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {recruitment.description}
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {recruitment.maxMembers ? `${recruitment.currentMembers}/${recruitment.maxMembers}명` : `${recruitment.currentMembers}명 (무제한)`}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              ~{recruitment.deadline}
            </span>
          </div>
          {progress !== null && (
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {recruitment.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
              #{tag}
            </span>
          ))}
          {recruitment.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">+{recruitment.tags.length - 2}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
