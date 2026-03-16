import type { DayPlan } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import TripStopCard from "./TripStopCard";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

interface TripStopListProps {
  tripId: string;
  day: DayPlan;
}

export default function TripStopList({ tripId, day }: TripStopListProps) {
  const { reorderStops } = useTripPlanner();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    reorderStops(tripId, day.id, result.source.index, result.destination.index);
  };

  if (day.stops.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-2xl bg-muted/20 text-muted-foreground text-sm">
        아직 추가된 장소가 없습니다.<br/>위에서 장소를 검색해보세요.
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`day-${day.id}-stops`}>
        {(provided) => (
          <div 
            {...provided.droppableProps} 
            ref={provided.innerRef}
            className="flex flex-col gap-4"
          >
            {day.stops.map((stop, index) => (
              <Draggable key={stop.id} draggableId={stop.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transition-shadow ${snapshot.isDragging ? 'z-50 shadow-2xl scale-[1.02]' : ''}`}
                  >
                    <TripStopCard tripId={tripId} dayId={day.id} stop={stop} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
