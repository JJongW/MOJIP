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
