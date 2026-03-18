import type { DayPlan } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import TripStopCard from "./TripStopCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Car } from "lucide-react";

interface TripStopListProps {
  tripId: string;
  day: DayPlan;
}

export default function TripStopList({ tripId, day }: TripStopListProps) {
  const { activeDayLegs } = useTripPlanner();

  return (
    <Droppable droppableId={`day-${day.id}-stops`}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`flex flex-col relative w-full min-w-0 rounded-2xl transition-colors ${
            snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/20" : ""
          }`}
        >
          {day.stops.length === 0 && !snapshot.isDraggingOver && (
            <div className="p-8 text-center border border-dashed rounded-2xl bg-muted/20 text-muted-foreground text-sm">
              아직 추가된 장소가 없습니다.<br />위에서 장소를 검색하거나 저장된 장소를 드래그해보세요.
            </div>
          )}

          {day.stops.map((stop, index) => (
            <div key={stop.id} className="flex flex-col">
              <Draggable draggableId={stop.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transition-shadow mb-0 ${snapshot.isDragging ? 'z-50 shadow-2xl scale-[1.02]' : ''}`}
                  >
                    <TripStopCard tripId={tripId} dayId={day.id} stop={stop} />
                  </div>
                )}
              </Draggable>

              {index < day.stops.length - 1 && activeDayLegs[index] && (
                <div className="flex items-center gap-4 py-2 px-6 animate-in fade-in slide-in-from-left-2 duration-500">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-primary/30 to-primary/10 rounded-full" />
                    <div className="bg-primary/5 p-1 rounded-full border border-primary/10">
                      <Car className="w-3.5 h-3.5 text-primary/70" />
                    </div>
                    <div className="w-0.5 h-4 bg-gradient-to-b from-primary/10 to-primary/30 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground/80 bg-muted/30 py-1.5 px-3 rounded-full border border-border/40">
                    <span className="flex items-center gap-1">
                      <span className="text-foreground">{activeDayLegs[index].distance}</span>
                    </span>
                    <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                    <span className="flex items-center gap-1 text-primary">
                      <span>{activeDayLegs[index].duration}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
