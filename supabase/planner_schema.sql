-- ============================================================
-- MOJIP Trip Planner — Supabase SQL Schema
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. trips 테이블
CREATE TABLE IF NOT EXISTS trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  destination     TEXT NOT NULL,
  start_date      DATE,
  end_date        DATE,
  traveler_count  INTEGER NOT NULL DEFAULT 1,
  theme           TEXT,
  summary         TEXT,
  notes           TEXT,
  tips            TEXT[] DEFAULT '{}',
  -- route_summary는 days/stops에서 계산하거나 별도 컬럼으로 저장
  route_total_duration_min  INTEGER,
  route_total_distance_km   NUMERIC(8,2),
  route_transport_mode      TEXT CHECK (route_transport_mode IN ('driving','transit','walking','bicycling')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. trip_days 테이블 (일자별 계획)
CREATE TABLE IF NOT EXISTS trip_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number  INTEGER NOT NULL,  -- 1-based (Day 1, Day 2, ...)
  date        DATE,              -- 실제 날짜 (선택)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, day_number)
);

-- 3. trip_stops 테이블 (장소)
CREATE TABLE IF NOT EXISTS trip_stops (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id           UUID NOT NULL REFERENCES trip_days(id) ON DELETE CASCADE,
  trip_id          UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('Attraction','Food','Cafe','Hotel','Shopping','Airport','Transit','Other')),
  lat              NUMERIC(10,7) NOT NULL,
  lng              NUMERIC(10,7) NOT NULL,
  address          TEXT,
  place_id         TEXT,  -- Google Places placeId
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  memo             TEXT,
  "order"          INTEGER NOT NULL DEFAULT 0,
  visited          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id   ON trip_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_day_id   ON trip_stops(day_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_id  ON trip_stops(trip_id);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trips_updated_at ON trips;
CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS (Row Level Security) — 공개 접근 허용 (인증 추가 전)
-- ============================================================
ALTER TABLE trips      ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_days  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;

-- 임시: 모든 사용자 읽기/쓰기 허용 (추후 auth.uid() 기반으로 변경)
CREATE POLICY "public_all_trips"      ON trips      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_trip_days"  ON trip_days  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_trip_stops" ON trip_stops FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 샘플 데이터 (선택사항 — 테스트용)
-- ============================================================
-- INSERT INTO trips (id, title, destination, start_date, end_date, traveler_count, theme, summary, notes, tips)
-- VALUES (
--   'trip-mock-1',
--   '오사카 식도락 여행',
--   '오사카, 일본',
--   '2023-10-15',
--   '2023-10-18',
--   2,
--   'Food Tour',
--   '도톤보리와 우메다를 아우르는 3박 4일 먹방 투어',
--   '엔화 환전 넉넉히 해갈 것. 유니버셜 스튜디오는 패스.',
--   ARRAY['타코야키는 앗치치혼포', '이치란 라멘은 피크시간 피하기']
-- );
