/// <reference types="@types/google.maps" />
import { useEffect, useState, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import type { Category } from "@/lib/types/planner";

interface SearchPlacesProps {
  tripId: string;
}

export default function SearchPlaces({ tripId }: SearchPlacesProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const placesLibrary = useMapsLibrary("places");
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  
  const { addStop } = useTripPlanner();

  useEffect(() => {
    if (!placesLibrary) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setAutocompleteService(new placesLibrary.AutocompleteService());
    // We need a dummy div for PlacesService as it requires a DOM node even if we don't render it directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setPlacesService(new placesLibrary.PlacesService(document.createElement('div')));
  }, [placesLibrary]);

  useEffect(() => {
    if (!autocompleteService || !inputValue.trim()) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPredictions([]);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsSearching(true);
    autocompleteService.getPlacePredictions({ input: inputValue }, (results: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
      setIsSearching(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
      } else {
        setPredictions([]);
      }
    });
  }, [inputValue, autocompleteService]);

  const handleSelectPlace = (placeId: string) => {
    if (!placesService) return;
    
    placesService.getDetails({
      placeId,
      fields: ['name', 'geometry', 'formatted_address', 'types']
    }, (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && result && result.geometry?.location) {
        // Map Google Types to our Categories
        const types = result.types || [];
        let category: Category = 'Attraction';
        if (types.includes('restaurant') || types.includes('food')) category = 'Food';
        if (types.includes('cafe')) category = 'Cafe';
        if (types.includes('lodging')) category = 'Hotel';
        if (types.includes('shopping_mall') || types.includes('store')) category = 'Shopping';
        if (types.includes('airport')) category = 'Airport';
        if (types.includes('transit_station')) category = 'Transit';

        addStop(tripId, {
          name: result.name || 'Unknown Place',
          category,
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address || '',
          placeId,
          durationMinutes: 60, // Default 1 hour
        });
        
        setInputValue("");
        setPredictions([]);
        inputRef.current?.blur();
      }
    });
  };

  return (
    <div className="relative w-full z-50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="장소 검색 (구글 맵) ..."
          className="pl-9 bg-background"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {predictions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-card border rounded-md shadow-lg overflow-hidden flex flex-col max-h-64 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              className="px-4 py-2 text-left text-sm hover:bg-muted/50 border-b last:border-b-0 truncate transition-colors"
              onClick={() => handleSelectPlace(p.place_id)}
            >
              <div className="font-medium">{p.structured_formatting.main_text}</div>
              <div className="text-xs text-muted-foreground truncate">{p.structured_formatting.secondary_text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
