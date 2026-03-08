/**
 * 모집/지원자 Supabase 데이터 레이어
 * - store.ts에서 isSupabaseConfigured()일 때 이 모듈 사용
 */
import { supabase } from "./supabase";
import type { Recruitment, Applicant } from "./types";

type DbRecruitment = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  current_members: number;
  max_members: number | null;
  deadline: string;
  created_at: string;
  tags: string[];
  contact: string;
  author: string;
  access_code: string | null;
  close_password_hash: string | null;
};

type DbApplicant = {
  id: string;
  recruitment_id: string;
  name: string;
  applied_at: string;
  email: string | null;
  phone: string | null;
  affiliation: string | null;
};

function toRecruitment(r: DbRecruitment, applicants: Applicant[]): Recruitment {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category as Recruitment["category"],
    status: r.status as Recruitment["status"],
    currentMembers: r.current_members,
    maxMembers: r.max_members,
    deadline: r.deadline,
    createdAt: r.created_at,
    tags: Array.isArray(r.tags) ? r.tags : [],
    contact: r.contact,
    author: r.author,
    accessCode: r.access_code ?? undefined,
    closePasswordHash: r.close_password_hash ?? undefined,
    applicants,
  };
}

function toApplicant(a: DbApplicant): Applicant {
  return {
    id: a.id,
    name: a.name,
    appliedAt: a.applied_at,
    email: a.email ?? undefined,
    phone: a.phone ?? undefined,
    affiliation: a.affiliation ?? undefined,
  };
}

export async function getRecruitmentsFromSupabase(): Promise<Recruitment[]> {
  if (!supabase) return [];

  const { data: rows, error } = await supabase
    .from("recruitments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map((r) => r.id);
  const { data: applicantRows, error: appError } = await supabase
    .from("applicants")
    .select("*")
    .in("recruitment_id", ids);

  if (appError) throw appError;
  const applicantsByRec = (applicantRows ?? []).reduce<Record<string, Applicant[]>>((acc, a) => {
    const recId = a.recruitment_id;
    if (!acc[recId]) acc[recId] = [];
    acc[recId].push(toApplicant(a as DbApplicant));
    return acc;
  }, {});

  return rows.map((r) => toRecruitment(r as DbRecruitment, applicantsByRec[r.id] ?? []));
}

/** 새 모집글 저장 (id는 Supabase에서 생성, 저장 후 목록 갱신으로 반영) */
export async function saveRecruitmentToSupabase(recruitment: Recruitment): Promise<void> {
  if (!supabase) return;

  const { data: inserted, error } = await supabase
    .from("recruitments")
    .insert({
      title: recruitment.title,
      description: recruitment.description,
      category: recruitment.category,
      status: recruitment.status,
      current_members: recruitment.currentMembers,
      max_members: recruitment.maxMembers,
      deadline: recruitment.deadline,
      created_at: recruitment.createdAt,
      tags: recruitment.tags,
      contact: recruitment.contact,
      author: recruitment.author,
      access_code: recruitment.accessCode ?? null,
      close_password_hash: recruitment.closePasswordHash ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  const recId = (inserted as { id: string }).id;

  const applicants = recruitment.applicants ?? [];
  if (applicants.length > 0) {
    const { error: appErr } = await supabase.from("applicants").insert(
      applicants.map((a) => ({
        recruitment_id: recId,
        name: a.name,
        applied_at: a.appliedAt,
        email: a.email ?? null,
        phone: a.phone ?? null,
        affiliation: a.affiliation ?? null,
      }))
    );
    if (appErr) throw appErr;
  }
}

export async function updateRecruitmentInSupabase(updated: Recruitment): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("recruitments")
    .update({
      title: updated.title,
      description: updated.description,
      category: updated.category,
      status: updated.status,
      current_members: updated.currentMembers,
      max_members: updated.maxMembers,
      deadline: updated.deadline,
      tags: updated.tags,
      contact: updated.contact,
      author: updated.author,
      access_code: updated.accessCode ?? null,
      close_password_hash: updated.closePasswordHash ?? null,
    })
    .eq("id", updated.id);

  if (error) throw error;

  const applicants = updated.applicants ?? [];
  await supabase.from("applicants").delete().eq("recruitment_id", updated.id);
  if (applicants.length > 0) {
    const { error: appErr } = await supabase.from("applicants").insert(
      applicants.map((a) => ({
        recruitment_id: updated.id,
        name: a.name,
        applied_at: a.appliedAt,
        email: a.email ?? null,
        phone: a.phone ?? null,
        affiliation: a.affiliation ?? null,
      }))
    );
    if (appErr) throw appErr;
  }
}

export async function deleteRecruitmentFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("recruitments").delete().eq("id", id);
  if (error) throw error;
}
