import { useState, useRef } from "react";
import type { DayPlan, Stop, TransportLeg } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { useIsMobile } from "@/hooks/use-mobile";
import TripStopCard from "./TripStopCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Car, Bus, PersonStanding, Bike, Plane, TrainFront, Plus, X, Search } from "lucide-react";
import { TRANSPORT_COLORS } from "@/lib/transportMode";
import type { TransportMode } from "@/lib/transportMode";
import type { LegInfo } from "@/lib/types/planner";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface TripStopListProps {
  tripId: string;
  day: DayPlan;
}

const MODES: TransportMode[] = ['driving', 'transit', 'subway', 'walking', 'bicycling', 'airplane'];
const MODE_ICONS: Record<TransportMode, React.ElementType> = {
  driving: Car,
  transit: Bus,
  subway: TrainFront,
  walking: PersonStanding,
  bicycling: Bike,
  airplane: Plane,
};

const MODE_LABEL: Partial<Record<TransportMode, string>> = {
  transit: '노선명',
  subway: '호선',
  airplane: '항공편 번호',
};
const MODE_PLACEHOLDER: Partial<Record<TransportMode, string>> = {
  transit: '예: 102번 버스',
  subway: '예: 2호선, JR山手線',
  airplane: '예: KE123, OZ201',
};

function getLegsFromStop(stop: Stop): TransportLeg[] {
  if (stop.transportLegs && stop.transportLegs.length > 0) return stop.transportLegs;
  return [{ mode: stop.transportMode ?? 'driving', name: stop.transportName }];
}

interface LegConnectorProps {
  tripId: string;
  dayId: string;
  fromStop: Stop;
  toStop: Stop;
  legInfo: LegInfo | undefined;
}

function LegConnector({ tripId, dayId, fromStop, toStop, legInfo }: LegConnectorProps) {
  const { updateStop } = useTripPlanner();
  const isMobile = useIsMobile();
  const routesLibrary = useMapsLibrary('routes');
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const [legs, setLegs] = useState<TransportLeg[]>(() => getLegsFromStop(toStop));
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Keep a local ref to avoid stale closure in callbacks
  const legsRef = useRef(legs);
  legsRef.current = legs;

  const representativeMode = legs[0]?.mode ?? 'driving';

  const saveLegs = (newLegs: TransportLeg[]) => {
    setLegs(newLegs);
    updateStop(tripId, dayId, toStop.id, {
      transportLegs: newLegs,
      // Keep legacy fields in sync with first leg for map rendering
      transportMode: newLegs[0]?.mode,
      transportName: newLegs[0]?.name,
    });
  };

  const handleModeChange = (legIdx: number, newMode: TransportMode) => {
    const updated = legs.map((leg, i) => {
      if (i !== legIdx) return leg;
      const clearName = !NAME_INPUT_MODES.includes(newMode);
      return { mode: newMode, name: clearName ? undefined : leg.name };
    });
    saveLegs(updated);
  };

  const handleNameChange = (legIdx: number, name: string) => {
    setLegs(legs.map((leg, i) => i === legIdx ? { ...leg, name } : leg));
  };

  const handleNameBlur = () => {
    saveLegs(legsRef.current);
  };

  const addLeg = () => {
    saveLegs([...legs, { mode: 'transit' }]);
  };

  const removeLeg = (legIdx: number) => {
    const updated = legs.filter((_, i) => i !== legIdx);
    saveLegs(updated.length > 0 ? updated : [{ mode: 'driving' }]);
  };

  const handleAutoDetect = async () => {
    if (!routesLibrary) return;
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new routesLibrary.DirectionsService();
    }
    setIsAutoDetecting(true);
    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsServiceRef.current!.route({
          origin: { lat: fromStop.lat, lng: fromStop.lng },
          destination: { lat: toStop.lat, lng: toStop.lng },
          travelMode: google.maps.TravelMode.TRANSIT,
          transitOptions: { departureTime: new Date() },
        }, (res, status) => {
          if (status === google.maps.DirectionsStatus.OK && res) resolve(res);
          else reject(new Error(status));
        });
      });

      const steps = result.routes[0]?.legs[0]?.steps ?? [];
      const detected: TransportLeg[] = [];

      for (const step of steps) {
        if (step.travel_mode === google.maps.TravelMode.WALKING) continue;
        if (step.travel_mode === google.maps.TravelMode.TRANSIT) {
          const vehicleType = step.transit?.line?.vehicle?.type ?? '';
          let mode: TransportMode = 'transit';
          if (['SUBWAY', 'METRO_RAIL', 'HEAVY_RAIL', 'TRAM'].includes(vehicleType)) {
            mode = 'subway';
          }
          const lineName = step.transit?.line?.short_name ?? step.transit?.line?.name ?? undefined;
          detected.push({ mode, name: lineName });
        }
      }

      if (detected.length > 0) {
        saveLegs(detected);
      }
    } catch {
      // silently fail
    } finally {
      setIsAutoDetecting(false);
    }
  };

  return (
    <div className="flex items-start gap-3 py-1.5 px-6 animate-in fade-in slide-in-from-left-2 duration-500">
      {/* Vertical line column */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-0.5 h-3 bg-gradient-to-b from-border/60 to-border/30 rounded-full" />
        <div className="w-0.5 flex-1 bg-border/20 rounded-full" />
        <div className="w-0.5 h-3 bg-gradient-to-b from-border/30 to-border/60 rounded-full" />
      </div>

      {/* Content column */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1 pt-1 pb-1">
        {/* Each leg row */}
        {legs.map((leg, legIdx) => {
          const Icon = MODE_ICONS[leg.mode];
          const label = MODE_LABEL[leg.mode];
          const placeholder = MODE_PLACEHOLDER[leg.mode];
          const color = TRANSPORT_COLORS[leg.mode];
          return (
            <div key={legIdx} className="flex flex-col gap-1.5">
              {/* Mode icon buttons */}
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5 flex-wrap">
                  {MODES.map((m) => {
                    const MIcon = MODE_ICONS[m];
                    const isActive = leg.mode === m;
                    return (
                      <button
                        key={m}
                        onClick={() => handleModeChange(legIdx, m)}
                        className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'} rounded-full flex items-center justify-center transition-all hover:scale-110`}
                        style={{
                          backgroundColor: isActive ? TRANSPORT_COLORS[m] : 'transparent',
                          border: isActive ? 'none' : '1px solid hsl(var(--border))',
                        }}
                        title={m}
                      >
                        <MIcon
                          className="w-3 h-3"
                          style={{ color: isActive ? 'white' : 'hsl(var(--muted-foreground))' }}
                        />
                      </button>
                    );
                  })}
                </div>
                {legs.length > 1 && (
                  <button
                    onClick={() => removeLeg(legIdx)}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Mode-specific input */}
              {label && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <Icon className="w-3 h-3" style={{ color }} />
                    <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
                  </div>
                  <input
                    className="text-[11px] border rounded-lg px-2 py-1 bg-background outline-none focus:ring-1 w-full"
                    style={{
                      borderColor: `${color}40`,
                      '--tw-ring-color': color,
                    } as React.CSSProperties}
                    placeholder={placeholder}
                    value={leg.name ?? ''}
                    onChange={(e) => handleNameChange(legIdx, e.target.value)}
                    onBlur={handleNameBlur}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Add leg button */}
        <button
          onClick={addLeg}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <Plus className="w-3 h-3" />
          구간 추가
        </button>

        {/* Distance / duration pill + Auto-detect */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-[11px]'} font-bold text-muted-foreground/80 bg-muted/30 py-1 px-2.5 rounded-full border border-border/40`}>
            <span className="text-foreground">{legInfo?.distance ?? '…'}</span>
            <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
            <span style={{ color: TRANSPORT_COLORS[representativeMode] }}>{legInfo?.duration ?? '…'}</span>
          </div>
          <button
            onClick={handleAutoDetect}
            disabled={isAutoDetecting}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border/50 rounded-full px-2 py-0.5 transition-colors disabled:opacity-50"
          >
            <Search className="w-3 h-3" />
            {isAutoDetecting ? '탐색 중…' : '경로 자동 가져오기'}
          </button>
        </div>
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
                  fromStop={stop}
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
