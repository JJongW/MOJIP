import { useState } from "react";
import type { Trip } from "@/lib/types/planner";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, Users, Clock, Navigation, Edit2 } from "lucide-react";
import TripProjectTabs from "./TripProjectTabs";
import TripDayList from "./TripDayList";
import TripEditModal from "./TripEditModal";
import { Button } from "@/components/ui/button";

interface TripSidebarProps {
  activeTrip: Trip;
  className?: string;
}

export default function TripSidebar({ activeTrip, className }: TripSidebarProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className={`flex flex-col h-full bg-background/80 backdrop-blur-md border-r border-border/50 w-[450px] min-w-[450px] max-w-[450px] overflow-hidden ${className}`}>
      
      {/* 1. Trip Project Tabs (Sticky Top) */}
      <div className="shrink-0 p-4 border-b border-white/5">
        <TripProjectTabs />
      </div>

      {/* 2. Scrollable Content Area */}
      <ScrollArea className="flex-1 w-full relative">
        <div className="p-4 pb-20 space-y-6">
          
          {/* Trip Summary Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight truncate">{activeTrip.title}</h1>
                <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{activeTrip.summary}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
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

          {/* 3. Day List & Stop Management */}
          <TripDayList activeTrip={activeTrip} />
        </div>
      </ScrollArea>

      {/* Edit Trip Modal */}
      <TripEditModal 
        trip={activeTrip} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </div>
  );
}
