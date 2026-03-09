-- MOJIP 웹 앱 초기 스키마 (Supabase SQL Editor에서 실행 또는 Supabase CLI로 적용)
-- 사용: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 후 Run

-- 모집글
CREATE TABLE IF NOT EXISTS public.recruitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('스터디','프로젝트','동아리','대회/공모전','봉사활동','게임','간술','보드게임','스포츠','기타')),
  status TEXT NOT NULL DEFAULT '모집중' CHECK (status IN ('모집중','모집완료')),
  current_members INT NOT NULL DEFAULT 0,
  max_members INT,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tags JSONB NOT NULL DEFAULT '[]',
  contact TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  access_code TEXT
);

-- 지원자 (모집글 1:N)
CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT,
  phone TEXT,
  affiliation TEXT
);

CREATE INDEX IF NOT EXISTS idx_applicants_recruitment_id ON public.applicants(recruitment_id);

-- 워크스페이스 과제 (workspace_id = recruitment.id)
CREATE TABLE IF NOT EXISTS public.workspace_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  repeat_cycle TEXT NOT NULL DEFAULT 'none' CHECK (repeat_cycle IN ('none','daily','weekly','monthly')),
  start_date DATE NOT NULL,
  due_date DATE,
  assignee TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  completed_by TEXT,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_workspace_id ON public.workspace_tasks(workspace_id);

-- 개인별 히트맵 색상 (워크스페이스별 닉네임-색상)
CREATE TABLE IF NOT EXISTS public.workspace_heatmap_colors (
  workspace_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#22c55e',
  PRIMARY KEY (workspace_id, nickname)
);

-- 익명 읽기/쓰기 허용 (배포 후 인증 도입 시 RLS로 제한 권장)
ALTER TABLE public.recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_heatmap_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recruitments allow all" ON public.recruitments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "applicants allow all" ON public.applicants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "workspace_tasks allow all" ON public.workspace_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "workspace_heatmap_colors allow all" ON public.workspace_heatmap_colors FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.recruitments IS '모집글 (id가 워크스페이스 진입 시 workspace_id로도 사용됨)';
COMMENT ON TABLE public.workspace_tasks IS '워크스페이스 과제 (반복 주기: none/daily/weekly/monthly)';
