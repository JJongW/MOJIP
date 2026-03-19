import { useState } from "react";
import type { DayPlan, Stop } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import TripStopCard from "./TripStopCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Car, Bus, PersonStanding, Bike, Plane } from "lucide-react";
import { TRANSPORT_COLORS } from "@/lib/transportMode";
import type { TransportMode } from "@/lib/transportMode";
import type { LegInfo } from "@/lib/types/planner";

interface TripStopListProps {
  tripId: string;
  day: DayPlan;
}

const MODES: TransportMode[] = ['driving', 'transit', 'walking', 'bicycling', 'airplane'];
const MODE_ICONS = {
  driving: Car,
  transit: Bus,
  walking: PersonStanding,
  bicycling: Bike,
  airplane: Plane,
};

interface LegConnectorProps {
  tripId: string;
  dayId: string;
  toStop: Stop;
  legInfo: LegInfo | undefined;
}

function LegConnector({ tripId, dayId, toStop, legInfo }: LegConnectorProps) {
  const { updateStop } = useTripPlanner();
  const mode: TransportMode = toStop.transportMode ?? 'driving';
  const [nameValue, setNameValue] = useState(toStop.transportName ?? '');

  const handleModeChange = (newMode: TransportMode) => {
    const clearName = newMode !== 'transit' && newMode !== 'airplane';
    updateStop(tripId, dayId, toStop.id, {
      transportMode: newMode,
      transportName: clearName ? undefined : toStop.transportName,
    });
  };

  const handleNameBlur = () => {
    updateStop(tripId, dayId, toStop.id, { transportName: nameValue || undefined });
  };

  const showNameInput = mode === 'transit' || mode === 'airplane';
  const placeholder = mode === 'transit'
    ? '노선 / 편명 (예: 지하철 2호선)'
    : '항공편 번호 (예: KE123)';

  return (
    <div className="flex items-start gap-3 py-1.5 px-6 animate-in fade-in slide-in-from-left-2 duration-500">
      {/* Vertical line + mode buttons column */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="w-0.5 h-3 bg-gradient-to-b from-border/60 to-border/30 rounded-full" />
        {/* Mode icon buttons */}
        <div className="flex gap-1">
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m];
            const isActive = mode === m;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  backgroundColor: isActive ? TRANSPORT_COLORS[m] : 'transparent',
                  border: isActive ? 'none' : '1px solid hsl(var(--border))',
                }}
                title={m}
              >
                <Icon
                  className="w-3 h-3"
                  style={{ color: isActive ? 'white' : 'hsl(var(--muted-foreground))' }}
                />
              </button>
            );
          })}
        </div>
        <div className="w-0.5 h-3 bg-gradient-to-b from-border/30 to-border/60 rounded-full" />
      </div>

      {/* Info column */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1 pt-1">
        {/* Distance / duration pill */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80 bg-muted/30 py-1 px-2.5 rounded-full border border-border/40 w-fit">
          <span className="text-foreground">{legInfo?.distance ?? '…'}</span>
          <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
          <span style={{ color: TRANSPORT_COLORS[mode] }}>{legInfo?.duration ?? '…'}</span>
        </div>

        {/* Route name input (transit / airplane only) */}
        {showNameInput && (
          <input
            className="text-[11px] border border-border/50 rounded-lg px-2 py-1 bg-background outline-none focus:ring-1 w-full"
            style={{ '--tw-ring-color': TRANSPORT_COLORS[mode] } as React.CSSProperties}
            placeholder={placeholder}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
          />
        )}
      </div>
    </div>
  );
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

              {index < day.stops.length - 1 && (
                <LegConnector
                  tripId={tripId}
                  dayId={day.id}
                  toStop={day.stops[index + 1]}
                  legInfo={activeDayLegs[index]}
                />
              )}
            </div>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
