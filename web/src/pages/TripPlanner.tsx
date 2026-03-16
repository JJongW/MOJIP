import { useEffect, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import TripSidebar from "@/components/planner/TripSidebar";
import TripMap from "@/components/planner/TripMap";

export default function TripPlanner() {
  const { activeTripId, trips } = useTripPlanner();
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  const activeTrip = trips.find(t => t.id === activeTripId) || trips[0];

  useEffect(() => {
    // In actual usage, this should come from VITE_GOOGLE_MAPS_API_KEY
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (key) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setApiKey(key);
    } else {
      console.warn("VITE_GOOGLE_MAPS_API_KEY is missing. Maps will not load.");
    }
  }, []);

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background md:flex-row overflow-hidden">
      {/* Sidebar: Bottom Sheet on Mobile, Left Panel on Desktop */}
      <TripSidebar 
        activeTrip={activeTrip} 
        className="w-full h-1/2 md:h-full md:w-[400px] lg:w-[480px] shrink-0 border-t md:border-t-0 md:border-r bg-card/95 backdrop-blur-xl z-20 shadow-xl order-2 md:order-1" 
      />
      
      {/* Map Content */}
      <div className="flex-1 w-full h-1/2 md:h-full relative bg-muted/20 order-1 md:order-2">
        {apiKey ? (
          <APIProvider apiKey={apiKey} libraries={['places', 'marker']}>
             <TripMap activeTrip={activeTrip} />
          </APIProvider>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-muted-foreground flex-col gap-4">
            <p>Google Maps API Key is required to render the map.</p>
            <p className="text-sm">Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.</p>
          </div>
        )}
      </div>
    </div>
  );
}
