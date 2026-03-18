import { useState } from "react";
import type { Trip } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { Plus, Trash2, Check } from "lucide-react";

interface TripChecklistProps {
  trip: Trip;
}

export default function TripChecklist({ trip }: TripChecklistProps) {
  const { addChecklistItem, toggleChecklistItem, removeChecklistItem } = useTripPlanner();
  const [inputValue, setInputValue] = useState("");

  const handleAdd = async () => {
    const text = inputValue.trim();
    if (!text) return;
    await addChecklistItem(trip.id, text);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAdd();
    }
  };

  const checklist = trip.checklist || [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        🎒 준비물
        {checklist.length > 0 && (
          <span className="text-xs text-muted-foreground font-normal">
            {checklist.filter(i => i.checked).length}/{checklist.length}
          </span>
        )}
      </h3>

      {checklist.length === 0 && (
        <p className="text-xs text-muted-foreground/60 py-2">준비물을 추가해보세요</p>
      )}

      <div className="space-y-1.5">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 group py-1"
          >
            <button
              onClick={() => toggleChecklistItem(trip.id, item.id)}
              className={`
                w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                ${item.checked
                  ? "bg-primary border-primary text-white"
                  : "border-border hover:border-primary/60"
                }
              `}
            >
              {item.checked && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            </button>
            <span
              className={`flex-1 text-sm transition-all ${
                item.checked ? "line-through opacity-50 text-muted-foreground" : "text-foreground"
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => removeChecklistItem(trip.id, item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all text-muted-foreground"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="준비물 추가..."
          className="flex-1 text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
