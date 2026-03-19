import { useEffect, useRef, useState, useMemo } from 'react';
import type { Stop, SavedPlace, Trip, LegInfo } from '@/lib/types/planner';
import { TRANSPORT_COLORS, googleTravelMode } from '@/lib/transportMode';
import type { TransportMode } from '@/lib/transportMode';
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

  const legRenderersRef = useRef<google.maps.DirectionsRenderer[]>([]);
  const airplanePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [selectedSavedPlace, setSelectedSavedPlace] = useState<SavedPlace | null>(null);

  const activeDay = useMemo(() => {
    return activeTrip.days.find(d => d.id === activeDayId) || activeTrip.days[0];
  }, [activeTrip.days, activeDayId]);

  const stops = activeDay?.stops || [];
  const savedPlaces = activeTrip.savedPlaces || [];

  // 1. Initialize DirectionsService
  useEffect(() => {
    if (!routesLibrary) return;
    directionsServiceRef.current = new routesLibrary.DirectionsService();
  }, [routesLibrary]);

  // 2. Per-leg routing
  useEffect(() => {
    if (!map || !routesLibrary) return;

    // Cleanup previous renderers/polylines
    legRenderersRef.current.forEach(r => r.setMap(null));
    airplanePolylinesRef.current.forEach(p => p.setMap(null));
    legRenderersRef.current = [];
    airplanePolylinesRef.current = [];
    setLegs([]);

    if (stops.length < 2 || !directionsServiceRef.current) return;

    let cancelled = false;
    const legsAccumulator: LegInfo[] = new Array(stops.length - 1).fill(null);
    let resolvedCount = 0;

    const checkDone = () => {
      resolvedCount++;
      if (resolvedCount === stops.length - 1 && !cancelled) {
        setLegs(legsAccumulator.filter(Boolean) as LegInfo[]);
      }
    };

    stops.slice(0, -1).forEach((fromStop, i) => {
      const toStop = stops[i + 1];
      const mode: TransportMode = toStop.transportMode ?? 'driving';
      const color = TRANSPORT_COLORS[mode];
      const origin = { lat: fromStop.lat, lng: fromStop.lng };
      const destination = { lat: toStop.lat, lng: toStop.lng };

      if (mode === 'airplane') {
        const polyline = new google.maps.Polyline({
          path: [origin, destination],
          strokeColor: color,
          strokeWeight: 3,
          strokeOpacity: 0,
          icons: [{
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
            offset: '0',
            repeat: '15px'
          }],
          map,
        });
        airplanePolylinesRef.current[i] = polyline;
        legsAccumulator[i] = { distance: '–', duration: '–', mode };
        checkDone();
        return;
      }

      const renderer = new routesLibrary.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: { strokeColor: color, strokeWeight: 5, strokeOpacity: 0.8 }
      });
      legRenderersRef.current[i] = renderer;

      directionsServiceRef.current!.route({
        origin,
        destination,
        travelMode: googleTravelMode(mode),
        ...(mode === 'transit' ? { transitOptions: { departureTime: new Date() } } : {}),
      }, (result, status) => {
        if (cancelled) return;
        if (status === google.maps.DirectionsStatus.OK && result) {
          renderer.setDirections(result);
          const leg = result.routes[0].legs[0];
          legsAccumulator[i] = {
            distance: leg.distance?.text || '–',
            duration: leg.duration?.text || '–',
            mode,
          };
        } else {
          legsAccumulator[i] = { distance: '–', duration: '–', mode };
        }
        checkDone();
      });
    });

    return () => {
      cancelled = true;
      legRenderersRef.current.forEach(r => r.setMap(null));
      airplanePolylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [map, routesLibrary, stops]);

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
