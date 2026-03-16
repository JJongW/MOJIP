import type { Trip } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import TripStopCard from "./TripStopCard";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

interface TripStopListProps {
  activeTrip: Trip;
}

export default function TripStopList({ activeTrip }: TripStopListProps) {
  const { reorderStops } = useTripPlanner();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    reorderStops(activeTrip.id, result.source.index, result.destination.index);
  };

  if (activeTrip.stops.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl bg-muted/30 text-muted-foreground text-sm">
        아직 추가된 장소가 없습니다.<br/>위에서 장소를 검색해보세요.
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="trip-stops">
        {(provided) => (
          <div 
            {...provided.droppableProps} 
            ref={provided.innerRef}
            className="flex flex-col gap-3"
          >
            {activeTrip.stops.map((stop, index) => (
              <Draggable key={stop.id} draggableId={stop.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${snapshot.isDragging ? 'z-50 opacity-90' : ''}`}
                  >
                    <TripStopCard tripId={activeTrip.id} stop={stop} />
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
