import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Stop } from '@/lib/types/planner';
import { Utensils, Coffee, MapPin, Bed, ShoppingBag, Plane, Bus } from 'lucide-react';

interface TripMarkerProps {
  stop: Stop;
  isActive?: boolean;
  onClick?: () => void;
}

export default function TripMarker({ stop, isActive, onClick }: TripMarkerProps) {
  const getCategoryConfig = (category: Stop['category']) => {
    switch (category) {
      case 'Food': return { color: 'bg-orange-500', icon: Utensils };
      case 'Cafe': return { color: 'bg-amber-600', icon: Coffee };
      case 'Attraction': return { color: 'bg-rose-500', icon: MapPin };
      case 'Hotel': return { color: 'bg-indigo-500', icon: Bed };
      case 'Shopping': return { color: 'bg-pink-500', icon: ShoppingBag };
      case 'Airport': return { color: 'bg-slate-700', icon: Plane };
      case 'Transit': return { color: 'bg-blue-500', icon: Bus };
      default: return { color: 'bg-primary', icon: MapPin };
    }
  };

  const { color, icon: Icon } = getCategoryConfig(stop.category);

  return (
    <AdvancedMarker
      position={{ lat: stop.lat, lng: stop.lng }}
      onClick={onClick}
      zIndex={isActive ? 100 : stop.order}
    >
      <div className={`
        relative flex items-center justify-center 
        transition-all duration-300 cursor-pointer
        ${isActive ? 'scale-125 z-50' : 'hover:scale-110'}
      `}>
        {/* Custom Premium Pin Design */}
        <div className={`
          flex items-center justify-center rounded-full shadow-md border-2 border-white
          ${stop.visited ? 'bg-muted text-muted-foreground border-muted-foreground/30 w-6 h-6' : color + ' text-white w-8 h-8'}
        `}>
          <Icon className={stop.visited ? "w-3 h-3" : "w-4 h-4"} />
        </div>
        
        {/* Order Badge */}
        {!stop.visited && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {stop.order + 1}
          </div>
        )}
        
        {/* Triangle Pointer */}
        <div className={`
          absolute -bottom-1.5 w-0 h-0 
          border-l-[6px] border-l-transparent 
          border-r-[6px] border-r-transparent 
          border-t-[8px] 
          ${stop.visited ? 'border-t-muted' : color.replace('bg-', 'border-t-')}
        `} />
      </div>
    </AdvancedMarker>
  );
}
