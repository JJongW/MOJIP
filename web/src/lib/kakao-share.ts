/**
 * 카카오톡 공유 및 링크 공유 유틸
 * - Kakao JS SDK 사용 시: 카카오톡 공유 창 표시
 * - 미설정 시: Web Share API 또는 클립보드 복사
 */
import type { Recruitment } from "./types";

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js";
const SCRIPT_ID = "kakao-sdk";

/** 공유용 URL 생성 (지원하기 바로 열기 옵션) */
export function getShareUrl(recruitmentId: string, openApply = true): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const path = `/r/${recruitmentId}`;
  return openApply ? `${base}${path}?apply=1` : `${base}${path}`;
}

/** Kakao SDK 로드 후 init (키가 있을 때만) */
function loadKakaoAndInit(): Promise<boolean> {
  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY as string | undefined;
  if (!key?.trim()) return Promise.resolve(false);

  const w = window as Window & { Kakao?: { init: (k: string) => void; isInitialized: () => boolean } };
  if (w.Kakao?.isInitialized?.()) return Promise.resolve(true);

  return new Promise((resolve) => {
    if (document.getElementById(SCRIPT_ID)) {
      w.Kakao?.init?.(key);
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = KAKAO_SDK_URL;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      w.Kakao?.init?.(key);
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export type ShareResult = "kakao" | "navigator" | "copy" | "none";

/**
 * 모집글 공유 실행
 * - Kakao 키 있음: 카카오 공유 창
 * - 없음: Web Share API 시도 후 실패 시 클립보드 복사
 * @returns 사용된 공유 방식 (토스트 메시지 등에 활용)
 */
export async function shareRecruitment(
  recruitment: { id: string; title: string; description: string },
  options: { openApply?: boolean } = {}
): Promise<ShareResult> {
  const { openApply = true } = options;
  const url = getShareUrl(recruitment.id, openApply);
  const title = recruitment.title;
  const text = recruitment.description?.slice(0, 100) ?? title;

  const inited = await loadKakaoAndInit();
  const w = window as Window & {
    Kakao?: {
      Share: {
        sendDefault: (arg: {
          objectType: string;
          content: { title: string; description?: string; imageUrl?: string; link: { webUrl: string; mobileWebUrl: string } };
        }) => Promise<void>;
      };
    };
  };

  if (inited && w.Kakao?.Share?.sendDefault) {
    try {
      await w.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description: text,
          link: { webUrl: url, mobileWebUrl: url },
        },
      });
      return "kakao";
    } catch (e) {
      console.warn("Kakao share failed", e);
    }
  }

  return fallbackShare(title, text, url);
}

async function fallbackShare(title: string, text: string, url: string): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "navigator";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "none";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copy";
  } catch {
    return "none";
  }
}

/** fallbackShare 후 클립보드 복사 성공 여부를 알 수 있게 호출부에서 사용 */
export function copyShareUrlToClipboard(recruitmentId: string, openApply = true): Promise<boolean> {
  const url = getShareUrl(recruitmentId, openApply);
  return navigator.clipboard.writeText(url).then(() => true).catch(() => false);
}
