-- 모집 종료/재개 시 비밀번호 확인용 해시 (제3자 무단 종료 방지)
ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS close_password_hash TEXT;

COMMENT ON COLUMN public.recruitments.close_password_hash IS '모집 종료·재개 시 필요한 비밀번호 SHA-256 해시(hex)';
