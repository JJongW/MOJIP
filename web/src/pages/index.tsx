import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Filter } from "lucide-react";
import RecruitmentCard from "@/components/RecruitmentCard";
import CreateRecruitmentDialog from "@/components/CreateRecruitmentDialog";
import RecruitmentDetailDialog from "@/components/RecruitmentDetailDialog";
import { fetchRecruitments, categories } from "@/lib/store";
import type { Recruitment, RecruitmentCategory, RecruitmentStatus } from "@/lib/types";

type StatusFilter = "전체" | RecruitmentStatus;

const Index = () => {
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<RecruitmentCategory | "전체">("전체");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Recruitment | null>(null);

  const refresh = useCallback(async () => {
    const list = await fetchRecruitments();
    setRecruitments(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    return recruitments.filter((r) => {
      const matchSearch = !search || r.title.includes(search) || r.description.includes(search) || r.tags.some((t) => t.includes(search));
      const matchCategory = categoryFilter === "전체" || r.category === categoryFilter;
      const matchStatus = statusFilter === "전체" || r.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [recruitments, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: recruitments.length,
    open: recruitments.filter((r) => r.status === "모집중").length,
    closed: recruitments.filter((r) => r.status === "모집완료").length,
  }), [recruitments]);

  return (
    <div className="min-h-screen">
      {/* Header: 글래스모피즘 (backdrop-blur + 반투명 + 테두리) */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img src="/favicon-32x32.png" alt="" className="h-6 w-6" aria-hidden />
            <h1 className="text-xl font-bold">모여봐요 종원의숲</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            새 모집글
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Stats: 글래스 카드 */}
        <section className="grid grid-cols-3 gap-4 max-w-md">
          <div className="glass rounded-xl p-4 text-center transition-colors duration-200 hover:bg-white/[0.08]">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">전체</p>
          </div>
          <div className="glass rounded-xl p-4 text-center transition-colors duration-200 hover:bg-white/[0.08]">
            <p className="text-2xl font-bold text-primary">{stats.open}</p>
            <p className="text-xs text-muted-foreground mt-1">모집중</p>
          </div>
          <div className="glass rounded-xl p-4 text-center transition-colors duration-200 hover:bg-white/[0.08]">
            <p className="text-2xl font-bold text-closed">{stats.closed}</p>
            <p className="text-xs text-muted-foreground mt-1">완료</p>
          </div>
        </section>

        {/* Search & Filters: 검색창 글래스, 필터 버튼 글래스(비선택 시) */}
        <section className="space-y-4">
          <div className="relative max-w-md glass rounded-md border border-white/10 overflow-hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목, 설명, 태그로 검색..."
              className="pl-10 border-0 bg-transparent focus-visible:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            {/* Category */}
            {(["전체", ...categories] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors duration-200 cursor-pointer ${
                  categoryFilter === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "glass text-muted-foreground border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                }`}
              >
                {c}
              </button>
            ))}
            <span className="text-muted-foreground/60 mx-1">|</span>
            {/* Status */}
            {(["전체", "모집중", "모집완료"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors duration-200 cursor-pointer ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "glass text-muted-foreground border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Grid */}
        {filtered.length > 0 ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <RecruitmentCard key={r.id} recruitment={r} onView={setDetailItem} />
            ))}
          </section>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">검색 결과가 없습니다</p>
            <p className="text-sm mt-1">다른 키워드나 필터로 검색해보세요.</p>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <CreateRecruitmentDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refresh} />
      <RecruitmentDetailDialog
        key={detailItem?.id}
        recruitment={detailItem}
        open={!!detailItem}
        onOpenChange={(open) => !open && setDetailItem(null)}
        onUpdated={async () => {
          const list = await fetchRecruitments();
          setRecruitments(list);
          setDetailItem(list.find((r) => r.id === detailItem?.id) ?? null);
        }}
      />
    </div>
  );
};

export default Index;
