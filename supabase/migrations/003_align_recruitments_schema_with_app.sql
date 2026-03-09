-- 현재 앱 스펙과 DB 스키마를 일치시킴
-- 1) category 허용값 확장
-- 2) deadline/created_at을 날짜+시간 저장 가능하도록 변경

-- 기존 카테고리 체크 제약 제거 후 재생성
ALTER TABLE public.recruitments
  DROP CONSTRAINT IF EXISTS recruitments_category_check;

ALTER TABLE public.recruitments
  ADD CONSTRAINT recruitments_category_check
  CHECK (category IN ('스터디','프로젝트','동아리','대회/공모전','봉사활동','게임','간술','보드게임','스포츠','기타'));

-- DATE로 저장된 기존 데이터는 자정(00:00) 기준으로 유지
ALTER TABLE public.recruitments
  ALTER COLUMN deadline TYPE TIMESTAMPTZ USING deadline::timestamptz;

ALTER TABLE public.recruitments
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
