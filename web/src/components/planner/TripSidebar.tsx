import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Trip } from "@/lib/types/planner";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { MapPin, Calendar, Users, Clock, Navigation, Edit2, ChevronLeft } from "lucide-react";
import TripProjectTabs from "./TripProjectTabs";
import TripDayList from "./TripDayList";
import TripEditModal from "./TripEditModal";
import TripChecklist from "./TripChecklist";
import TripWishlist from "./TripWishlist";
import TripTips from "./TripTips";
import { Button } from "@/components/ui/button";

interface TripSidebarProps {
  activeTrip: Trip;
  className?: string;
}

type ActiveTab = 'schedule' | 'prepare';

export default function TripSidebar({ activeTrip, className }: TripSidebarProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className={`flex flex-col h-full bg-background/80 backdrop-blur-md border-r border-border/50 overflow-hidden ${className}`}>

      {/* 1. Trip Project Tabs (Sticky Top) with Back Button */}
      <div className={`shrink-0 ${isMobile ? 'p-3' : 'p-4'} border-b border-white/5`}>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-muted/50 -ml-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            홈
          </button>
        </div>
        <TripProjectTabs />
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className={`${isMobile ? 'p-3 pb-24' : 'p-4 pb-20'} space-y-4`}>

          {/* Trip Summary Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold tracking-tight truncate`}>{activeTrip.title}</h1>
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

          {/* Internal Tab Navigation */}
          <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`
                flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-all
                ${activeTab === 'schedule'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              📅 일정
            </button>
            <button
              onClick={() => setActiveTab('prepare')}
              className={`
                flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-all
                ${activeTab === 'prepare'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              🎒 준비·팁
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'schedule' ? (
            <TripDayList activeTrip={activeTrip} />
          ) : (
            <div className="space-y-6">
              <TripChecklist trip={activeTrip} />
              <div className="h-[1px] bg-border w-full" />
              <TripWishlist trip={activeTrip} />
              <div className="h-[1px] bg-border w-full" />
              <TripTips trip={activeTrip} />
            </div>
          )}
        </div>
      </div>

      {/* Edit Trip Modal */}
      <TripEditModal
        trip={activeTrip}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
