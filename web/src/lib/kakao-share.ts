/**
 * 카카오톡 공유 및 링크 공유 유틸
 * - Kakao JS SDK 사용 시: 카카오톡 공유 창 표시
 * - 미설정 시: Web Share API 또는 클립보드 복사
 *
 * 공유 시 Kakao.Share.sendCustom({ templateId, templateArgs }) 호출 (공식 예시와 동일).
 * [도구] > [메시지 템플릿]에서 사용자 인자 이름은 KAKAO_TEMPLATE_ARG_KEYS와 동일하게 입력해야 함.
 */
import { formatDateTimeDisplay } from "@/lib/util";

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js";
const KAKAO_SDK_INTEGRITY = "sha384-tJkjbtDbvoxO+diRuDtwRO9JXR7pjWnfjfRn5ePUpl7e7RJCxKCwwnfqUAdXh53p";

/**
 * 카카오 사용자 정의 템플릿에 전달하는 인자 이름 (단일 소스)
 * - 템플릿 빌더에서 사용자 인자를 추가할 때 이 이름을 그대로 복사해 써야 값이 채워짐
 * - 검증: 코드는 이 키만 사용하며, DEV에서 전송 키를 로그로 출력함
 */
export const KAKAO_TEMPLATE_ARG_KEYS = [
  "title",
  "description",
  "url",
  "인원",
  "마감일",
  "카테고리",
  "상태",
  "작성자",
] as const;

export type KakaoTemplateArgs = Record<(typeof KAKAO_TEMPLATE_ARG_KEYS)[number], string>;
const SCRIPT_ID = "kakao-sdk";

/**
 * 공유 시 사용할 베이스 URL (프로덕션 고정용)
 * - VITE_APP_URL 설정 시 해당 URL 사용 (카카오톡에서 링크 클릭 시 올바른 사이트로 이동)
 * - 미설정 시 window.location.origin 사용
 */
function getShareBaseUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined;
  if (envUrl?.trim()) return envUrl.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
}

/** 공유용 URL 생성 (지원하기 바로 열기 옵션) */
export function getShareUrl(recruitmentId: string, openApply = true): string {
  const base = getShareBaseUrl();
  const path = `/r/${recruitmentId}`;
  const fullPath = openApply ? `${path}?apply=1` : path;
  return base ? `${base}${fullPath}` : fullPath;
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
    script.integrity = KAKAO_SDK_INTEGRITY;
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

/** 공유 시 넘길 모집글 정보 (전체 필드 선택적 — 있으면 템플릿에 인원/마감일 등 표시) */
export type ShareRecruitmentInput = {
  id: string;
  title: string;
  description: string;
  author?: string;
  category?: string;
  status?: string;
  currentMembers?: number;
  maxMembers?: number | null;
  deadline?: string;
};

/** 인원 문구 생성 (상세 UI와 동일: "1명 (무제한)" 또는 "2/5명") */
function formatHeadcount(current: number, max: number | null | undefined): string {
  if (max != null && max > 0) return `${current}/${max}명`;
  return `${current}명 (무제한)`;
}

/**
 * 모집글 공유 실행
 * - Kakao 키 있음: 카카오 공유 창
 * - 없음: Web Share API 시도 후 실패 시 클립보드 복사
 * @returns 사용된 공유 방식 (토스트 메시지 등에 활용)
 */
export async function shareRecruitment(
  recruitment: ShareRecruitmentInput,
  options: { openApply?: boolean } = {}
): Promise<ShareResult> {
  const { openApply = true } = options;
  const url = getShareUrl(recruitment.id, openApply);
  const title = recruitment.title;
  const text = recruitment.description?.slice(0, 100) ?? title;

  const inited = await loadKakaoAndInit();
  // 환경 변수 없으면 우리가 만든 템플릿 130396 사용 (항상 커스텀 템플릿 반영)
  const templateId =
    (import.meta.env.VITE_KAKAO_SHARE_TEMPLATE_ID as string)?.trim() || "130396";
  const w = window as Window & {
    Kakao?: {
      Share: {
        sendDefault: (arg: {
          objectType: string;
          content: { title: string; description?: string; imageUrl?: string; link: { webUrl: string; mobileWebUrl: string } };
          buttons?: Array<{ title: string; link: { webUrl: string; mobileWebUrl: string } }>;
        }) => Promise<void>;
        sendCustom: (arg: { templateId: number; templateArgs?: Record<string, string> }) => Promise<void>;
      };
    };
  };

  if (inited && w.Kakao?.Share) {
    try {
      // 사용자 정의 템플릿: templateId(기본 130396)로 sendCustom 호출 → 인원/마감일 등 반영
      if (templateId && w.Kakao.Share.sendCustom) {
        const templateIdNum = Number(templateId);
        if (!Number.isNaN(templateIdNum)) {
          const headcount =
            recruitment.currentMembers != null
              ? formatHeadcount(recruitment.currentMembers, recruitment.maxMembers ?? null)
              : "";
          const templateArgs: KakaoTemplateArgs = {
            title,
            description: text,
            url,
            인원: headcount,
            마감일: formatDateTimeDisplay(recruitment.deadline ?? ""),
            카테고리: recruitment.category ?? "",
            상태: recruitment.status ?? "",
            작성자: recruitment.author ?? "",
          };
          if (import.meta.env.DEV) {
            console.info(
              "[Kakao 공유] 템플릿 사용자 인자 이름(코드에서 전송). 카카오 [메시지 템플릿]에서 아래와 동일하게 입력했는지 확인하세요:",
              [...KAKAO_TEMPLATE_ARG_KEYS]
            );
          }
          await w.Kakao.Share.sendCustom({
            templateId: templateIdNum,
            templateArgs,
          });
          return "kakao";
        }
      }
      // 기본 템플릿(피드): templateId 없거나 sendCustom 실패 시 기존 sendDefault 유지
      if (w.Kakao.Share.sendDefault) {
        await w.Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title,
            description: text,
            link: { webUrl: url, mobileWebUrl: url },
          },
          buttons: [
            { title: "지원하기", link: { webUrl: url, mobileWebUrl: url } },
          ],
        });
        return "kakao";
      }
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
