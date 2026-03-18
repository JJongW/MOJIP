import { useState } from "react";
import type { Trip } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { Plus, Trash2, ShoppingBag, Pencil, Check, X, ChevronDown } from "lucide-react";

interface TripWishlistProps {
  trip: Trip;
}

const getPersonLabel = (index: number, names?: string[]) =>
  names?.[index]?.trim() || (index === 0 ? "나" : `동행 ${index}`);

export default function TripWishlist({ trip }: TripWishlistProps) {
  const { addWishlistItem, toggleWishlistItem, updateWishlistItem, removeWishlistItem, updateTravelerName } = useTripPlanner();
  const [inputValue, setInputValue] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [collapsed, setCollapsed] = useState(true);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [tabEditValue, setTabEditValue] = useState("");

  const wishlist = trip.wishlist || [];
  const travelerCount = trip.travelerCount ?? 1;
  const filtered = wishlist.filter(item => (item.personIndex ?? 0) === selectedPerson);

  const handleAdd = async () => {
    const text = inputValue.trim();
    if (!text) return;
    await addWishlistItem(trip.id, text, selectedPerson);
    setInputValue("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAdd();
    }
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditValue(text);
  };

  const saveEdit = async (id: string) => {
    const text = editValue.trim();
    if (text) await updateWishlistItem(trip.id, id, text);
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const startTabEdit = (i: number) => {
    setEditingTabIndex(i);
    setTabEditValue(getPersonLabel(i, trip.travelerNames));
  };
  const saveTabName = async (i: number) => {
    const name = tabEditValue.trim();
    if (name) await updateTravelerName(trip.id, i, name);
    setEditingTabIndex(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      saveEdit(id);
    }
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-2 text-left"
      >
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 flex-1">
          <ShoppingBag className="w-4 h-4 text-pink-400" /> 사고 싶은 거
          {wishlist.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {wishlist.filter(i => i.bought).length}/{wishlist.length}
            </span>
          )}
        </h3>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {!collapsed && <>

      {/* Person Tabs */}
      {travelerCount > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {Array.from({ length: travelerCount }, (_, i) => (
            <div key={i} className="shrink-0">
              {editingTabIndex === i ? (
                <input
                  autoFocus
                  value={tabEditValue}
                  onChange={(e) => setTabEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); saveTabName(i); }
                    if (e.key === "Escape") setEditingTabIndex(null);
                  }}
                  onBlur={() => saveTabName(i)}
                  className="text-xs px-3 py-1.5 rounded-full border border-pink-400/50 bg-background focus:outline-none w-20"
                />
              ) : (
                <button
                  onClick={() => setSelectedPerson(i)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all group/tab ${
                    selectedPerson === i
                      ? "bg-pink-400 text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {getPersonLabel(i, trip.travelerNames)}
                  <Pencil
                    className={`w-2.5 h-2.5 opacity-0 group/tab-hover:opacity-70 transition-opacity ${selectedPerson === i ? "hover:opacity-100" : ""}`}
                    onClick={(e) => { e.stopPropagation(); startTabEdit(i); }}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground/60 py-1">사고 싶은 아이템을 추가해보세요</p>
      )}

      <div className="space-y-1">
        {filtered.map((item) => (
          <div key={item.id} className="flex items-start gap-2 group py-1">
            <button
              onClick={() => toggleWishlistItem(trip.id, item.id)}
              className={`w-[18px] h-[18px] mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                item.bought
                  ? "bg-pink-400 border-pink-400 text-white"
                  : "border-border hover:border-pink-400/60"
              }`}
            >
              {item.bought && (
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {editingId === item.id ? (
              <textarea
                autoFocus
                rows={1}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                onBlur={() => saveEdit(item.id)}
                className="flex-1 text-xs bg-muted/40 border border-pink-400/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-pink-400/20 resize-none"
              />
            ) : (
              <span
                className={`flex-1 text-sm transition-all whitespace-pre-wrap ${
                  item.bought ? "line-through opacity-50 text-muted-foreground" : "text-foreground"
                }`}
              >
                {item.text}
              </span>
            )}

            <div className={`flex gap-0.5 ${editingId === item.id ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
              {editingId === item.id ? (
                <>
                  <button onClick={() => saveEdit(item.id)} className="p-1 hover:bg-pink-400/10 hover:text-pink-400 rounded-md transition-colors text-muted-foreground">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(item.id, item.text)} className="p-1 hover:bg-muted hover:text-foreground rounded-md transition-colors text-muted-foreground">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeWishlistItem(trip.id, item.id)} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-muted-foreground">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          rows={1}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={travelerCount > 1 ? `${getPersonLabel(selectedPerson, trip.travelerNames)} 아이템 추가...` : "아이템 추가..."}
          className="flex-1 text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400/40 transition-all placeholder:text-muted-foreground/50 resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="p-2 bg-pink-400/10 hover:bg-pink-400/20 text-pink-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      </>}
    </div>
  );
}
