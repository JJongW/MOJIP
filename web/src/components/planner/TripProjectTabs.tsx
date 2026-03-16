import { useTripPlanner } from "@/hooks/useTripPlanner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TripProjectTabs() {
  const { trips, activeTripId, setActiveTrip, addTrip } = useTripPlanner();

  const handleAddNewTrip = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // In a real app we'd open a modal here, for MVP we can just create a dummy "New Trip"
    addTrip({
      title: "새로운 여행",
      destination: "어딘가",
      travelerCount: 1,
      theme: "Free Tour",
      summary: "여행 계획을 세워보세요",
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    });
  };

  return (
    <div className="flex items-center w-full gap-2">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 py-1">
          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => setActiveTrip(trip.id)}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-full transition-all border
                ${
                  activeTripId === trip.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
                }
              `}
            >
              {trip.title}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full shrink-0 w-8 h-8 text-muted-foreground hover:bg-muted/50"
        onClick={handleAddNewTrip}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
