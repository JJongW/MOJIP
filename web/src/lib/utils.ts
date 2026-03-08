import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind 클래스 병합 유틸 (shadcn/ui 표준). 충돌 시 tailwind-merge로 후자 우선 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
