import { useEffect } from "react";
import TripSidebar from "@/components/planner/TripSidebar";
import TripMap from "@/components/planner/TripMap";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Loader2 } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function TripPlanner() {
  const { trips, activeTripId, fetchTrips, isLoading } = useTripPlanner();

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
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <aside className="w-[450px] min-w-[450px] max-w-[450px] flex-basis-[450px] h-full shrink-0 z-10 shadow-2xl overflow-hidden bg-background">
          <TripSidebar activeTrip={activeTrip} className="w-full" />
        </aside>
        <main className="flex-1 h-full relative">
          <TripMap activeTrip={activeTrip} />
        </main>
      </APIProvider>
    </div>
  );
}
