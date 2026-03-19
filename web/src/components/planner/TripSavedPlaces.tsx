import { useState } from "react";
import type { Trip } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import SearchPlaces from "./SearchPlaces";
import { ChevronDown, GripVertical, Trash2, MapPin } from "lucide-react";

interface TripSavedPlacesProps {
  trip: Trip;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Attraction: "🏛️",
  Food: "🍽️",
  Cafe: "☕",
  Hotel: "🏨",
  Shopping: "🛍️",
  Airport: "✈️",
  Transit: "🚇",
  Other: "📍",
};

export default function TripSavedPlaces({ trip }: TripSavedPlacesProps) {
  const { addSavedPlace, removeSavedPlace, setFocusedSavedPlace } = useTripPlanner();
  const [collapsed, setCollapsed] = useState(true);

  const savedPlaces = trip.savedPlaces || [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-2 text-left"
      >
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 flex-1">
          <MapPin className="w-4 h-4 text-orange-400" />
          가고 싶은 곳
          {savedPlaces.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">{savedPlaces.length}</span>
          )}
        </h3>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {/* Search */}
          <SearchPlaces
            onSelect={(place) => addSavedPlace(trip.id, place)}
            placeholder="가고 싶은 장소 검색..."
          />

          {/* Hint */}
          {savedPlaces.length > 0 && (
            <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
              <GripVertical className="w-3 h-3" /> 드래그해서 일정에 추가
            </p>
          )}

          {/* Droppable list */}
          <Droppable droppableId="saved-places">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 min-h-[4px] rounded-xl transition-colors ${
                  snapshot.isDraggingOver ? "bg-orange-400/5 ring-1 ring-orange-400/20" : ""
                }`}
              >
                {savedPlaces.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 py-2">
                    장소를 검색해서 저장해두세요
                  </p>
                )}
                {savedPlaces.map((place, index) => (
                  <Draggable key={place.id} draggableId={place.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        onClick={() => setFocusedSavedPlace(place.id)}
                        className={`flex items-center gap-2 p-2.5 bg-card border rounded-xl group transition-shadow cursor-pointer ${
                          snapshot.isDragging ? "shadow-lg ring-1 ring-orange-400/40 scale-[1.02]" : "hover:border-orange-400/30"
                        }`}
                      >
                        <div {...provided.dragHandleProps} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-base leading-none">{CATEGORY_EMOJI[place.category] ?? "📍"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{place.name}</div>
                          {place.address && (
                            <div className="text-[11px] text-muted-foreground truncate">{place.address}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeSavedPlace(trip.id, place.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all text-muted-foreground shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </div>
  );
}
