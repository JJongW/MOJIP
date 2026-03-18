import { useEffect, useState } from "react";
import TripSidebar from "@/components/planner/TripSidebar";
import TripMap from "@/components/planner/TripMap";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Loader2, Map, CalendarDays } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function TripPlanner() {
  const { trips, activeTripId, fetchTrips, isLoading } = useTripPlanner();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"schedule" | "map">("schedule");

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0];

  if (isLoading && trips.length === 0) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">여행 계획을 불러오고 있습니다...</p>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">여행 계획이 없습니다. 새로운 프로젝트를 시작해보세요!</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      {isMobile ? (
        /* ── 모바일 레이아웃 ── */
        <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-background">
          {/* 콘텐츠 영역 */}
          <div className="flex-1 relative overflow-hidden">
            {/* 지도: 항상 렌더링 (일정 탭에선 숨김) */}
            <div
              className={`absolute inset-0 transition-opacity duration-200 ${
                mobileTab === "map" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <TripMap activeTrip={activeTrip} />
            </div>

            {/* 일정 탭 */}
            <div
              className={`absolute inset-0 transition-opacity duration-200 ${
                mobileTab === "schedule" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <TripSidebar activeTrip={activeTrip} className="w-full border-r-0" />
            </div>
          </div>

          {/* 하단 탭바 */}
          <div
            className="shrink-0 bg-background/95 backdrop-blur-md border-t border-border/50 flex items-stretch"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <button
              onClick={() => setMobileTab("schedule")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                mobileTab === "schedule" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              일정
            </button>
            <div className="w-px bg-border/50 my-2" />
            <button
              onClick={() => setMobileTab("map")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                mobileTab === "map" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Map className="w-5 h-5" />
              지도
            </button>
          </div>
        </div>
      ) : (
        /* ── 데스크톱 레이아웃 ── */
        <div className="flex h-screen w-screen overflow-hidden bg-background">
          <aside className="w-[450px] min-w-[450px] max-w-[450px] h-full shrink-0 z-10 shadow-2xl overflow-hidden bg-background">
            <TripSidebar activeTrip={activeTrip} className="w-full" />
          </aside>
          <main className="flex-1 h-full relative">
            <TripMap activeTrip={activeTrip} />
          </main>
        </div>
      )}
    </APIProvider>
  );
}
