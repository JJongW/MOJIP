import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜 또는 날짜+시간 문자열을 화면 표시용으로 포맷 (기존 YYYY-MM-DD 호환)
 * - "YYYY-MM-DD" → "YYYY-MM-DD"
 * - "YYYY-MM-DDTHH:mm" 또는 ISO 형식 → "YYYY-MM-DD HH:mm"
 */
export function formatDateTimeDisplay(value: string): string {
  if (!value?.trim()) return value;
  const trimmed = value.trim();
  const tIndex = trimmed.indexOf("T");
  if (tIndex === -1) return trimmed;
  const datePart = trimmed.slice(0, tIndex);
  const timePart = trimmed.slice(tIndex + 1).slice(0, 5);
  return timePart ? `${datePart} ${timePart}` : datePart;
}

const CLOSE_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** 모집 종료/재개용 비밀번호 랜덤 생성 (8자, 혼동 문자 제외) */
export function generateClosePassword(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => CLOSE_PASSWORD_CHARS[b % CLOSE_PASSWORD_CHARS.length]).join("");
}

/** 비밀번호를 SHA-256 해시한 hex 문자열로 반환 (저장용) */
export async function hashClosePassword(plain: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain.trim()));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 입력 비밀번호가 저장된 해시와 일치하는지 검증 */
export async function verifyClosePassword(plain: string, storedHash: string): Promise<boolean> {
  if (!storedHash?.trim()) return false;
  const hash = await hashClosePassword(plain);
  return hash === storedHash;
}
