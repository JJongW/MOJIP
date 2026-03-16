import { useTripPlanner } from "@/hooks/useTripPlanner";
import type { Trip } from "@/lib/types/planner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import TripStopList from "./TripStopList";
import SearchPlaces from "./SearchPlaces";

interface TripDayListProps {
  activeTrip: Trip;
}

export default function TripDayList({ activeTrip }: TripDayListProps) {
  const { activeDayId, setActiveDay, addDay, removeDay } = useTripPlanner();

  const activeDay = activeTrip.days.find(d => d.id === activeDayId) || activeTrip.days[0];

  const handleAddDay = () => {
    addDay(activeTrip.id);
  };

  const handleRemoveDay = (dayId: string) => {
    if (activeTrip.days.length <= 1) return;
    if (confirm("이 날의 모든 일정이 삭제됩니다. 정말 삭제할까요?")) {
      removeDay(activeTrip.id, dayId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Day Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {activeTrip.days.map((day) => (
          <div key={day.id} className="relative group shrink-0">
            <button
              onClick={() => setActiveDay(day.id)}
              className={`
                px-4 py-2 text-sm font-semibold rounded-xl transition-all border flex items-center gap-2
                ${activeDayId === day.id || (!activeDayId && day.dayNumber === 1)
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Day {day.dayNumber}
            </button>
            {activeTrip.days.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveDay(day.id); }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-background"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddDay}
          className="rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground h-[38px] px-3 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          일차 추가
        </Button>
      </div>

      {/* active day info & search */}
      {activeDay && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="sticky top-0 z-20 pb-2 bg-background/80 backdrop-blur-md">
            <SearchPlaces tripId={activeTrip.id} dayId={activeDay.id} />
          </div>

          <div className="space-y-4">
             <h3 className="font-semibold text-sm flex items-center justify-between">
                Day {activeDay.dayNumber} 일정
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  {activeDay.stops.length} 장소
                </span>
             </h3>
             <TripStopList tripId={activeTrip.id} day={activeDay} />
          </div>
        </div>
      )}
    </div>
  );
}
