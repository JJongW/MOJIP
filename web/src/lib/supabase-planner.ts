/**
 * Trip Planner — Supabase 데이터 레이어
 * supabase-recruitments.ts 패턴을 동일하게 따릅니다.
 */
import { supabase } from "./supabase";
import type { Trip, DayPlan, Stop, Category, RouteSummary, ChecklistItem, WishlistItem } from "./types/planner";

// ─────────────────────────────────────────────
// DB Row Types
// ─────────────────────────────────────────────

type DbTrip = {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  traveler_count: number;
  theme: string | null;
  summary: string | null;
  notes: string | null;
  tips: string[] | null;
  checklist: ChecklistItem[] | null;
  wishlist: WishlistItem[] | null;
  route_total_duration_min: number | null;
  route_total_distance_km: number | null;
  route_transport_mode: string | null;
  created_at: string;
  updated_at: string;
};

type DbTripDay = {
  id: string;
  trip_id: string;
  day_number: number;
  date: string | null;
  created_at: string;
};

type DbTripStop = {
  id: string;
  day_id: string;
  trip_id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string | null;
  place_id: string | null;
  duration_minutes: number;
  memo: string | null;
  order: number;
  visited: boolean;
  created_at: string;
};

// ─────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────

function toStop(row: DbTripStop): Stop {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    lat: row.lat,
    lng: row.lng,
    address: row.address ?? undefined,
    placeId: row.place_id ?? undefined,
    durationMinutes: row.duration_minutes,
    memo: row.memo ?? undefined,
    order: row.order,
    visited: row.visited,
  };
}

function toDayPlan(row: DbTripDay, stops: Stop[]): DayPlan {
  return {
    id: row.id,
    dayNumber: row.day_number,
    date: row.date ?? undefined,
    stops,
  };
}

function toTrip(row: DbTrip, days: DayPlan[]): Trip {
  const routeSummary: RouteSummary | undefined =
    row.route_total_duration_min != null && row.route_total_distance_km != null
      ? {
          totalDurationMin: row.route_total_duration_min,
          totalDistanceKm: Number(row.route_total_distance_km),
          transportMode: (row.route_transport_mode ?? "driving") as RouteSummary["transportMode"],
        }
      : undefined;

  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    travelerCount: row.traveler_count,
    theme: row.theme ?? undefined,
    summary: row.summary ?? undefined,
    notes: row.notes ?? undefined,
    tips: row.tips ?? undefined,
    checklist: row.checklist ?? undefined,
    wishlist: row.wishlist ?? undefined,
    days,
    routeSummary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export async function getTripsFromSupabase(): Promise<Trip[]> {
  if (!supabase) return [];

  const { data: tripRows, error: tripErr } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  if (tripErr) throw tripErr;
  if (!tripRows?.length) return [];

  const tripIds = tripRows.map((t) => t.id);

  const { data: dayRows, error: dayErr } = await supabase
    .from("trip_days")
    .select("*")
    .in("trip_id", tripIds)
    .order("day_number", { ascending: true });

  if (dayErr) throw dayErr;

  const { data: stopRows, error: stopErr } = await supabase
    .from("trip_stops")
    .select("*")
    .in("trip_id", tripIds)
    .order("order", { ascending: true });

  if (stopErr) throw stopErr;

  // Group stops by day_id
  const stopsByDay = (stopRows ?? []).reduce<Record<string, Stop[]>>((acc, s) => {
    const dayId = s.day_id;
    if (!acc[dayId]) acc[dayId] = [];
    acc[dayId].push(toStop(s as DbTripStop));
    return acc;
  }, {});

  // Group days by trip_id
  const daysByTrip = (dayRows ?? []).reduce<Record<string, DayPlan[]>>((acc, d) => {
    const tripId = d.trip_id;
    if (!acc[tripId]) acc[tripId] = [];
    acc[tripId].push(toDayPlan(d as DbTripDay, stopsByDay[d.id] ?? []));
    return acc;
  }, {});

  return tripRows.map((t) => toTrip(t as DbTrip, daysByTrip[t.id] ?? []));
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function saveTripToSupabase(trip: Trip): Promise<void> {
  if (!supabase) return;

  const { error: tripErr } = await supabase.from("trips").insert({
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    start_date: trip.startDate ?? null,
    end_date: trip.endDate ?? null,
    traveler_count: trip.travelerCount,
    theme: trip.theme ?? null,
    summary: trip.summary ?? null,
    notes: trip.notes ?? null,
    tips: trip.tips ?? null,
    checklist: trip.checklist ?? null,
    wishlist: trip.wishlist ?? null,
    route_total_duration_min: trip.routeSummary?.totalDurationMin ?? null,
    route_total_distance_km: trip.routeSummary?.totalDistanceKm ?? null,
    route_transport_mode: trip.routeSummary?.transportMode ?? null,
    created_at: trip.createdAt,
    updated_at: trip.updatedAt,
  });
  if (tripErr) throw tripErr;

  // Insert days + stops
  for (const day of trip.days) {
    await _upsertDay(trip.id, day);
  }
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateTripInSupabase(trip: Trip): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("trips")
    .update({
      title: trip.title,
      destination: trip.destination,
      start_date: trip.startDate ?? null,
      end_date: trip.endDate ?? null,
      traveler_count: trip.travelerCount,
      theme: trip.theme ?? null,
      summary: trip.summary ?? null,
      notes: trip.notes ?? null,
      tips: trip.tips ?? null,
      checklist: trip.checklist ?? null,
      wishlist: trip.wishlist ?? null,
      route_total_duration_min: trip.routeSummary?.totalDurationMin ?? null,
      route_total_distance_km: trip.routeSummary?.totalDistanceKm ?? null,
      route_transport_mode: trip.routeSummary?.transportMode ?? null,
    })
    .eq("id", trip.id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// DAY CRUD
// ─────────────────────────────────────────────

async function _upsertDay(tripId: string, day: DayPlan): Promise<void> {
  if (!supabase) return;

  await supabase.from("trip_days").upsert({
    id: day.id,
    trip_id: tripId,
    day_number: day.dayNumber,
    date: day.date ?? null,
  });

  // Clear existing stops for this day, then re-insert
  await supabase.from("trip_stops").delete().eq("day_id", day.id);

  if (day.stops.length > 0) {
    const { error } = await supabase.from("trip_stops").insert(
      day.stops.map((s) => ({
        id: s.id,
        day_id: day.id,
        trip_id: tripId,
        name: s.name,
        category: s.category,
        lat: s.lat,
        lng: s.lng,
        address: s.address ?? null,
        place_id: s.placeId ?? null,
        duration_minutes: s.durationMinutes,
        memo: s.memo ?? null,
        order: s.order,
        visited: s.visited,
      }))
    );
    if (error) throw error;
  }
}

export async function addDayToSupabase(tripId: string, day: DayPlan): Promise<void> {
  if (!supabase) return;
  await _upsertDay(tripId, day);
}

export async function removeDayFromSupabase(dayId: string): Promise<void> {
  if (!supabase) return;
  // trip_stops cascade deletes on trip_days delete
  const { error } = await supabase.from("trip_days").delete().eq("id", dayId);
  if (error) throw error;
}

export async function upsertStopsForDay(tripId: string, day: DayPlan): Promise<void> {
  if (!supabase) return;
  await _upsertDay(tripId, day);
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteTripFromSupabase(tripId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
}
