import type { Stop } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { MapPin, Clock, Edit3, Trash2 } from "lucide-react";

interface TripStopCardProps {
  tripId: string;
  stop: Stop;
}

export default function TripStopCard({ tripId, stop }: TripStopCardProps) {
  const { removeStop, toggleStopVisited } = useTripPlanner();

  return (
    <div 
      className={`
        relative p-4 border rounded-xl shadow-sm bg-card flex gap-4 group transition-all
        ${stop.visited ? 'opacity-60 grayscale-[50%]' : 'hover:border-primary/40'}
      `}
    >
      {/* Order & Status Badge */}
      <button 
        onClick={() => toggleStopVisited(tripId, stop.id)}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-medium text-sm transition-colors border-2
          ${stop.visited ? 'bg-muted border-muted-foreground/30 text-muted-foreground' : 'bg-primary/10 border-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary'}
        `}
      >
        {stop.order + 1}
      </button>

      {/* Stop Details */}
      <div className="flex-1 w-full min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-base truncate">{stop.name}</div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-muted rounded text-muted-foreground"><Edit3 className="w-4 h-4" /></button>
            <button 
              onClick={() => removeStop(tripId, stop.id)}
              className="p-1 hover:bg-destructive/10 hover:text-destructive rounded text-muted-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {stop.category}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 예상 {stop.durationMinutes}분</span>
        </div>
        
        {stop.memo && (
          <div className="mt-3 text-sm bg-muted/40 p-2.5 rounded-lg border border-border/50 text-muted-foreground">
            {stop.memo}
          </div>
        )}
      </div>
    </div>
  );
}
