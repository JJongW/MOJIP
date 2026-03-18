import { useState } from "react";
import type { Stop } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { MapPin, Clock, Edit3, Trash2, Check, X, GripVertical } from "lucide-react";

interface TripStopCardProps {
  tripId: string;
  dayId: string;
  stop: Stop;
}

export default function TripStopCard({ tripId, dayId, stop }: TripStopCardProps) {
  const { removeStop, toggleStopVisited, updateStop, setFocusedStop } = useTripPlanner();
  const [isEditing, setIsEditing] = useState(false);
  const [memoValue, setMemoValue] = useState(stop.memo || "");
  const [editingTime, setEditingTime] = useState(false);

  const handleSaveMemo = async () => {
    await updateStop(tripId, dayId, stop.id, { memo: memoValue });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setMemoValue(stop.memo || "");
    setIsEditing(false);
  };

  const handleTimeChange = async (value: string) => {
    await updateStop(tripId, dayId, stop.id, { startTime: value || undefined });
    setEditingTime(false);
  };

  return (
    <div
      onClick={() => setFocusedStop(stop.id)}
      className={`
        relative p-4 border rounded-2xl shadow-sm bg-card flex gap-4 group transition-all duration-300 w-full min-w-0 overflow-hidden cursor-pointer
        ${stop.visited ? 'opacity-50 grayscale-[40%]' : 'hover:border-primary/40 hover:shadow-md'}
      `}
    >
      {/* Drag handle icon (visible on hover) */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Order & Status Badge */}
      <button
        onClick={() => toggleStopVisited(tripId, dayId, stop.id)}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-all border-2
          ${stop.visited
            ? 'bg-muted border-muted-foreground/30 text-muted-foreground'
            : 'bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-sm'
          }
        `}
      >
        {stop.order + 1}
      </button>

      {/* Stop Details */}
      <div className="flex-1 w-full min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-[15px] truncate">{stop.name}</div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveMemo}
                  className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => removeStop(tripId, dayId, stop.id)}
              className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors text-muted-foreground"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="text-[11px] font-medium text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary/60" /> {stop.category}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary/60" /> 예상 {stop.durationMinutes}분
          </span>

          {/* 시간 */}
          {editingTime ? (
            <input
              type="time"
              defaultValue={stop.startTime ?? ""}
              autoFocus
              onBlur={(e) => handleTimeChange(e.target.value)}
              onChange={(e) => { if (e.target.value) handleTimeChange(e.target.value); }}
              className="text-[11px] bg-muted/40 border border-primary/30 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30 w-24"
            />
          ) : stop.startTime ? (
            <button
              onClick={() => setEditingTime(true)}
              className="flex items-center gap-1 text-primary hover:text-primary/70 transition-colors"
            >
              🕐 {stop.startTime}
              <X
                className="w-2.5 h-2.5 opacity-50 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); handleTimeChange(""); }}
              />
            </button>
          ) : (
            <button
              onClick={() => setEditingTime(true)}
              className="flex items-center gap-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <Clock className="w-3 h-3" /> 시간 추가
            </button>
          )}
        </div>

        {isEditing ? (
          <textarea
            autoFocus
            value={memoValue}
            onChange={(e) => setMemoValue(e.target.value)}
            placeholder="이 장소에 대한 메모를 남겨보세요..."
            className="mt-3 w-full text-xs bg-muted/30 p-3 rounded-xl border border-primary/30 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            rows={2}
          />
        ) : stop.memo ? (
          <div className="mt-2.5 text-[13px] bg-muted/30 p-3 rounded-xl border border-border/40 text-muted-foreground/90 font-medium leading-relaxed">
            {stop.memo}
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 text-xs text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" /> 메모 추가
          </button>
        )}
      </div>
    </div>
  );
}
