import { useTripPlanner } from "@/hooks/useTripPlanner";
import type { Trip } from "@/lib/types/planner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import TripStopList from "./TripStopList";
import TripSavedPlaces from "./TripSavedPlaces";
import SearchPlaces from "./SearchPlaces";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

interface TripDayListProps {
  activeTrip: Trip;
}

export default function TripDayList({ activeTrip }: TripDayListProps) {
  const { activeDayId, setActiveDay, addDay, removeDay, addStop, reorderStops, moveToSchedule, moveToSaved } = useTripPlanner();

  const activeDay = activeTrip.days.find(d => d.id === activeDayId) || activeTrip.days[0];

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId === 'saved-places' && destination.droppableId.startsWith('day-')) {
      // 저장된 장소 → 일정으로 이동
      const dayId = destination.droppableId.replace(/^day-/, '').replace(/-stops$/, '');
      moveToSchedule(activeTrip.id, dayId, draggableId);
    } else if (source.droppableId.startsWith('day-') && destination.droppableId === 'saved-places') {
      // 일정 → 가고 싶은 곳으로 이동
      const dayId = source.droppableId.replace(/^day-/, '').replace(/-stops$/, '');
      moveToSaved(activeTrip.id, dayId, draggableId);
    } else if (
      source.droppableId === destination.droppableId &&
      source.droppableId.startsWith('day-')
    ) {
      // 같은 날 내 순서 변경
      const dayId = source.droppableId.replace(/^day-/, '').replace(/-stops$/, '');
      reorderStops(activeTrip.id, dayId, source.index, destination.index);
    }
  };

  const handleAddDay = () => addDay(activeTrip.id);

  const handleRemoveDay = (dayId: string) => {
    if (activeTrip.days.length <= 1) return;
    if (confirm("이 날의 모든 일정이 삭제됩니다. 정말 삭제할까요?")) {
      removeDay(activeTrip.id, dayId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* 가고 싶은 곳 */}
        <TripSavedPlaces trip={activeTrip} />

        <div className="h-[1px] bg-border w-full" />

        {/* Day Tabs */}
        <div className="w-full overflow-hidden">
          <div
            className="overflow-x-auto overflow-y-visible pb-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
          >
            <div className="flex items-center gap-2 pb-2 w-max">
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
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-background z-10"
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
                className="rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground h-[38px] px-3 shrink-0 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">일차 추가</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Active day */}
        {activeDay && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="sticky top-0 z-20 pb-2 bg-background/80 backdrop-blur-md">
              <SearchPlaces
                onSelect={(place) => addStop(activeTrip.id, activeDay.id, place)}
                placeholder="장소 검색 (구글 맵) ..."
              />
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
    </DragDropContext>
  );
}
