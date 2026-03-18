import { useState } from "react";
import type { Trip } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { Plus, Trash2, ExternalLink, Lightbulb, Pencil, Check, X } from "lucide-react";

interface TripTipsProps {
  trip: Trip;
}

const isUrl = (s: string) => /^https?:\/\//i.test(s);

export default function TripTips({ trip }: TripTipsProps) {
  const { updateTrip, updateTip } = useTripPlanner();
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const tips = trip.tips || [];

  const handleAdd = async () => {
    const text = inputValue.trim();
    if (!text) return;
    await updateTrip(trip.id, { tips: [...tips, text] });
    setInputValue("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = async (index: number) => {
    await updateTrip(trip.id, { tips: tips.filter((_, i) => i !== index) });
  };

  const startEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setEditValue(text);
  };

  const saveEdit = async (index: number) => {
    const text = editValue.trim();
    if (text) await updateTip(trip.id, index, text);
    setEditingIndex(null);
  };

  const cancelEdit = () => setEditingIndex(null);

  const handleEditKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      saveEdit(index);
    }
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        💡 꿀팁 &amp; 참고링크
      </h3>

      {tips.length === 0 && (
        <p className="text-xs text-muted-foreground/60 py-1">팁이나 참고 URL을 추가해보세요</p>
      )}

      <div className="space-y-1">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-start gap-2 group py-1">
            <span className="shrink-0 mt-1 text-muted-foreground/60">
              {isUrl(tip) ? (
                <ExternalLink className="w-3.5 h-3.5 text-primary/60" />
              ) : (
                <Lightbulb className="w-3.5 h-3.5 text-yellow-500/70" />
              )}
            </span>

            {editingIndex === index ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, index)}
                onBlur={() => saveEdit(index)}
                className="flex-1 text-xs bg-muted/40 border border-primary/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <div className="flex-1 min-w-0 pt-0.5">
                {isUrl(tip) ? (
                  <a
                    href={tip}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all text-xs"
                  >
                    {tip}
                  </a>
                ) : (
                  <span className="text-foreground/80 break-words text-xs">{tip}</span>
                )}
              </div>
            )}

            <div className={`flex gap-0.5 shrink-0 ${editingIndex === index ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
              {editingIndex === index ? (
                <>
                  <button onClick={() => saveEdit(index)} className="p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-colors text-muted-foreground">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(index, tip)} className="p-1 hover:bg-muted hover:text-foreground rounded-md transition-colors text-muted-foreground">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleRemove(index)} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-muted-foreground">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="팁 또는 https://... 추가"
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
