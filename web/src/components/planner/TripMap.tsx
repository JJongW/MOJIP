import { useEffect, useState, useMemo } from 'react';
import type { Stop, SavedPlace, Trip } from '@/lib/types/planner';
import {
  Map,
  useMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import { useTripPlanner } from '@/hooks/useTripPlanner';

interface TripMapProps {
  activeTrip: Trip;
}

export default function TripMap({ activeTrip }: TripMapProps) {
  const map = useMap('mojip-trip-map-styled');
  const routesLibrary = useMapsLibrary('routes');
  const { activeDayId, setLegs, focusedStopId, setFocusedStop, focusedSavedPlaceId, setFocusedSavedPlace } = useTripPlanner();
  
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [selectedSavedPlace, setSelectedSavedPlace] = useState<SavedPlace | null>(null);

  // Get stops for the active day
  const activeDay = useMemo(() => {
    return activeTrip.days.find(d => d.id === activeDayId) || activeTrip.days[0];
  }, [activeTrip.days, activeDayId]);

  const stops = activeDay?.stops || [];
  const savedPlaces = activeTrip.savedPlaces || [];

  // 1. Initialize Directions components
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#3B82F6', // primary blue
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    setDirectionsRenderer(renderer);

    return () => renderer.setMap(null);
  }, [routesLibrary, map]);

  // 2. Fetch directions for the active day
  useEffect(() => {
    if (!directionsService || !directionsRenderer || stops.length < 2) {
      if (directionsRenderer) directionsRenderer.setDirections({ routes: [] } as any);
      return;
    }

    const origin = { lat: stops[0].lat, lng: stops[0].lng };
    const destination = { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng };
    const waypoints = stops.slice(1, -1).map(stop => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true
    }));

    directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING // Defaulting to driving for now
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        
        // Extract distance and duration for each leg
        const legs = result.routes[0].legs.map(leg => ({
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || ''
        }));
        setLegs(legs);
      }
    });
  }, [directionsService, directionsRenderer, stops]);

  // 3. Fit bounds to stops
  useEffect(() => {
    if (!map || stops.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    stops.forEach(stop => bounds.extend({ lat: stop.lat, lng: stop.lng }));
    map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
  }, [map, stops]);

  // 4. Focus on a specific stop when selected from sidebar
  useEffect(() => {
    if (!map || !focusedStopId) return;
    const stop = stops.find(s => s.id === focusedStopId);
    if (!stop) return;
    map.panTo({ lat: stop.lat, lng: stop.lng });
    map.setZoom(17);
    setSelectedStop(stop);
    setSelectedSavedPlace(null);
    setFocusedStop(null);
  }, [focusedStopId, map, stops]);

  // 5. Focus on a saved place when selected from sidebar
  useEffect(() => {
    if (!map || !focusedSavedPlaceId) return;
    const place = savedPlaces.find(p => p.id === focusedSavedPlaceId);
    if (!place) return;
    map.panTo({ lat: place.lat, lng: place.lng });
    map.setZoom(17);
    setSelectedSavedPlace(place);
    setSelectedStop(null);
    setFocusedSavedPlace(null);
  }, [focusedSavedPlaceId, map, savedPlaces]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Map
        id="mojip-trip-map-styled"
        mapId="mojip-trip-map-styled"
        defaultCenter={{ lat: 34.6687, lng: 135.5013 }}
        defaultZoom={13}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        onClick={() => { setSelectedStop(null); setSelectedSavedPlace(null); }}
      >
        {stops.map((stop) => (
          <AdvancedMarker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            onClick={() => setSelectedStop(stop)}
          >
            <Pin 
              background={stop.visited ? '#94A3B8' : '#3B82F6'} 
              borderColor={stop.visited ? '#64748B' : '#1D4ED8'} 
              glyphColor={'white'}
              scale={1.2}
            >
              <div className="text-white font-bold text-xs">{stop.order + 1}</div>
            </Pin>
          </AdvancedMarker>
        ))}

        {/* Saved place pins */}
        {savedPlaces.map((place) => (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            onClick={() => { setSelectedSavedPlace(place); setSelectedStop(null); }}
          >
            <Pin
              background={'#F97316'}
              borderColor={'#EA580C'}
              glyphColor={'white'}
              scale={0.8}
            />
          </AdvancedMarker>
        ))}

        {/* Saved place InfoWindow */}
        {selectedSavedPlace && (
          <InfoWindow
            position={{ lat: selectedSavedPlace.lat, lng: selectedSavedPlace.lng }}
            onCloseClick={() => setSelectedSavedPlace(null)}
          >
            <div className="p-2 min-w-[150px]">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">가고 싶은 곳</span>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">{selectedSavedPlace.name}</h3>
              {selectedSavedPlace.address && (
                <p className="text-[11px] text-muted-foreground">{selectedSavedPlace.address}</p>
              )}
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block">
                {selectedSavedPlace.category}
              </span>
            </div>
          </InfoWindow>
        )}

        {selectedStop && (
          <InfoWindow
            position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
            onCloseClick={() => setSelectedStop(null)}
          >
            <div className="p-2 min-w-[150px]">
              <h3 className="font-bold text-sm text-foreground mb-1">{selectedStop.name}</h3>
              <p className="text-[11px] text-muted-foreground mb-2">{selectedStop.address}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                  {selectedStop.category}
                </span>
                <span className="text-[10px] text-muted-foreground">{selectedStop.durationMinutes}분 소요</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
