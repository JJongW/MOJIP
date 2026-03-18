import { useState } from "react";
import type { Trip } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { Plus, Trash2, ShoppingBag } from "lucide-react";

interface TripWishlistProps {
  trip: Trip;
}

export default function TripWishlist({ trip }: TripWishlistProps) {
  const { addWishlistItem, toggleWishlistItem, removeWishlistItem } = useTripPlanner();
  const [inputValue, setInputValue] = useState("");

  const wishlist = trip.wishlist || [];

  const handleAdd = async () => {
    const text = inputValue.trim();
    if (!text) return;
    await addWishlistItem(trip.id, text);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-pink-400" /> 사고 싶은 거
        {wishlist.length > 0 && (
          <span className="text-xs text-muted-foreground font-normal">
            {wishlist.filter(i => i.bought).length}/{wishlist.length}
          </span>
        )}
      </h3>

      {wishlist.length === 0 && (
        <p className="text-xs text-muted-foreground/60 py-2">사고 싶은 아이템을 추가해보세요</p>
      )}

      <div className="space-y-1.5">
        {wishlist.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 group py-1">
            <button
              onClick={() => toggleWishlistItem(trip.id, item.id)}
              className={`
                w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                ${item.bought
                  ? "bg-pink-400 border-pink-400 text-white"
                  : "border-border hover:border-pink-400/60"
                }
              `}
            >
              {item.bought && (
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-sm transition-all ${
                item.bought ? "line-through opacity-50 text-muted-foreground" : "text-foreground"
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => removeWishlistItem(trip.id, item.id)}
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
          placeholder="아이템 추가..."
          className="flex-1 text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400/40 transition-all placeholder:text-muted-foreground/50"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="p-2 bg-pink-400/10 hover:bg-pink-400/20 text-pink-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
