import type { Trip } from "@/lib/types/planner";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, Users, Clock, Navigation } from "lucide-react";
import TripProjectTabs from "./TripProjectTabs";
import TripStopList from "./TripStopList";
import SearchPlaces from "./SearchPlaces";

interface TripSidebarProps {
  activeTrip: Trip;
  className?: string;
}

export default function TripSidebar({ activeTrip, className }: TripSidebarProps) {

  return (
    <div className={`flex flex-col h-full bg-background/80 backdrop-blur-md border-r border-border/50 ${className}`}>
      
      {/* 1. Trip Project Tabs (Sticky Top) */}
      <div className="shrink-0 p-4 border-b border-white/5">
        <TripProjectTabs />
      </div>

      {/* 2. Scrollable Content Area */}
      <ScrollArea className="flex-1 w-full relative">
        <div className="p-4 space-y-6">
          
          {/* Trip Summary Header Header */}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{activeTrip.title}</h1>
              <p className="text-muted-foreground mt-1 text-sm">{activeTrip.summary}</p>
            </div>
            
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
               {activeTrip.startDate && activeTrip.endDate && (
                 <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {format(new Date(activeTrip.startDate), 'MMM d')} - {format(new Date(activeTrip.endDate), 'MMM d')}</span>
               )}
               <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {activeTrip.destination}</span>
               <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1" /> {activeTrip.travelerCount}명</span>
            </div>
            
            {activeTrip.routeSummary && (
              <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl text-sm border border-white/5 backdrop-blur-sm">
                <div className="flex flex-col">
                   <span className="text-muted-foreground text-xs uppercase font-medium">총 소요 시간</span>
                   <span className="font-semibold flex items-center gap-1 mt-0.5"><Clock className="w-4 h-4 text-primary" /> {Math.floor(activeTrip.routeSummary.totalDurationMin / 60)}h {activeTrip.routeSummary.totalDurationMin % 60}m</span>
                </div>
                <div className="w-[1px] h-8 bg-border"></div>
                <div className="flex flex-col">
                   <span className="text-muted-foreground text-xs uppercase font-medium">총 이동 거리</span>
                   <span className="font-semibold flex items-center gap-1 mt-0.5"><Navigation className="w-4 h-4 text-primary" /> {activeTrip.routeSummary.totalDistanceKm} km</span>
                </div>
              </div>
            )}
            
          </div>

          <div className="h-[1px] bg-border w-full" />

          {/* 3. Search Bar */}
          <div className="sticky top-0 z-20 pb-2 bg-background/80 backdrop-blur-md">
            <SearchPlaces tripId={activeTrip.id} />
          </div>

          {/* 4. Stop List Area */}
          <div className="space-y-4">
             <h3 className="font-semibold text-sm flex items-center justify-between">
                루트 및 일정
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{activeTrip.stops.length} 장소</span>
             </h3>
             <TripStopList activeTrip={activeTrip} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
