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

interface PlaceDetail {
  name: string;
  photoUrl?: string;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  address?: string;
  phoneNumber?: string;
  googleMapsUrl?: string;
}

export default function TripMap({ activeTrip }: TripMapProps) {
  const map = useMap('mojip-trip-map-styled');
  const routesLibrary = useMapsLibrary('routes');
  const placesLibrary = useMapsLibrary('places');
  const { activeDayId, setLegs, focusedStopId, setFocusedStop, focusedSavedPlaceId, setFocusedSavedPlace } = useTripPlanner();

  const legRenderersRef = useRef<google.maps.DirectionsRenderer[]>([]);
  const airplanePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [selectedSavedPlace, setSelectedSavedPlace] = useState<SavedPlace | null>(null);
  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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

  // 2. Initialize PlacesService
  useEffect(() => {
    if (!placesLibrary) return;
    placesServiceRef.current = new placesLibrary.PlacesService(document.createElement('div'));
  }, [placesLibrary]);

  // 3. Per-leg routing
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
      const mode: TransportMode =
        toStop.transportLegs?.[0]?.mode ?? toStop.transportMode ?? 'driving';
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

  // 4. Fit bounds to stops
  useEffect(() => {
    if (!map || stops.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    stops.forEach(stop => bounds.extend({ lat: stop.lat, lng: stop.lng }));
    map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
  }, [map, stops]);

  // 5. Focus on a specific stop when selected from sidebar
  useEffect(() => {
    if (!map || !focusedStopId) return;
    const stop = stops.find(s => s.id === focusedStopId);
    if (!stop) return;
    map.panTo({ lat: stop.lat, lng: stop.lng });
    map.setZoom(17);
    setSelectedStop(stop);
    setSelectedSavedPlace(null);
    setFocusedStop(null);
    if (stop.placeId) fetchPlaceDetail(stop.placeId, stop.name);
  }, [focusedStopId, map, stops]);

  // 6. Focus on a saved place when selected from sidebar
  useEffect(() => {
    if (!map || !focusedSavedPlaceId) return;
    const place = savedPlaces.find(p => p.id === focusedSavedPlaceId);
    if (!place) return;
    map.panTo({ lat: place.lat, lng: place.lng });
    map.setZoom(17);
    setSelectedSavedPlace(place);
    setSelectedStop(null);
    setFocusedSavedPlace(null);
    if (place.placeId) fetchPlaceDetail(place.placeId, place.name);
  }, [focusedSavedPlaceId, map, savedPlaces]);

  const fetchPlaceDetail = (placeId: string, fallbackName: string) => {
    if (!placesServiceRef.current) return;
    setPlaceDetail(null);
    setIsLoadingDetail(true);
    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ['name', 'photos', 'rating', 'user_ratings_total',
                 'opening_hours', 'formatted_address', 'formatted_phone_number', 'url'],
      },
      (result, status) => {
        setIsLoadingDetail(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          setPlaceDetail({
            name: result.name ?? fallbackName,
            photoUrl: result.photos?.[0]?.getUrl({ maxWidth: 600 }),
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
            openNow: result.opening_hours?.isOpen(),
            address: result.formatted_address,
            phoneNumber: result.formatted_phone_number,
            googleMapsUrl: result.url,
          });
        }
      }
    );
  };

  const InfoWindowContent = ({ name, category, durationMinutes, isSavedPlace }: {
    name: string;
    category?: string;
    durationMinutes?: number;
    isSavedPlace?: boolean;
  }) => {
    if (isLoadingDetail) {
      return (
        <div className="min-w-[240px] max-w-[280px] animate-pulse">
          <div className="h-[120px] bg-gray-200 rounded mb-2" />
          <div className="px-1 pb-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        </div>
      );
    }

    if (placeDetail) {
      return (
        <div className="min-w-[240px] max-w-[280px]">
          {placeDetail.photoUrl && (
            <img
              src={placeDetail.photoUrl}
              alt={placeDetail.name}
              className="w-full h-[160px] object-cover rounded-t"
            />
          )}
          <div className="p-2 space-y-1">
            {isSavedPlace && (
              <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">가고 싶은 곳</span>
            )}
            <p className="font-bold text-sm text-gray-900">{placeDetail.name}</p>
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              {placeDetail.rating !== undefined && (
                <span className="text-amber-500 font-semibold">★ {placeDetail.rating.toFixed(1)}</span>
              )}
              {placeDetail.userRatingsTotal !== undefined && (
                <span className="text-gray-500">({placeDetail.userRatingsTotal.toLocaleString()})</span>
              )}
              {placeDetail.openNow !== undefined && (
                <>
                  {(placeDetail.rating !== undefined || placeDetail.userRatingsTotal !== undefined) && (
                    <span className="text-gray-400">•</span>
                  )}
                  <span className={placeDetail.openNow ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {placeDetail.openNow ? '영업중' : '마감'}
                  </span>
                </>
              )}
            </div>
            {placeDetail.address && (
              <p className="text-xs text-gray-600 flex gap-1">
                <span>📍</span>
                <span>{placeDetail.address}</span>
              </p>
            )}
            {placeDetail.phoneNumber && (
              <p className="text-xs text-gray-600 flex gap-1">
                <span>📞</span>
                <span>{placeDetail.phoneNumber}</span>
              </p>
            )}
            {placeDetail.googleMapsUrl && (
              <a
                href={placeDetail.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline block mt-1"
              >
                Google Maps에서 보기 →
              </a>
            )}
          </div>
        </div>
      );
    }

    // Fallback UI (no placeId or fetch failed)
    return (
      <div className="p-2 min-w-[180px] max-w-[280px]">
        {isSavedPlace && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">가고 싶은 곳</span>
          </div>
        )}
        <p className="font-bold text-sm text-gray-900 mb-1">{name}</p>
        {category && (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold inline-block">
            {category}
          </span>
        )}
        {durationMinutes !== undefined && (
          <p className="text-xs text-gray-500 mt-1">{durationMinutes}분 소요</p>
        )}
      </div>
    );
  };

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
            onClick={() => {
              setSelectedStop(stop);
              setSelectedSavedPlace(null);
              setPlaceDetail(null);
              if (stop.placeId) fetchPlaceDetail(stop.placeId, stop.name);
            }}
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
            onClick={() => {
              setSelectedSavedPlace(place);
              setSelectedStop(null);
              setPlaceDetail(null);
              if (place.placeId) fetchPlaceDetail(place.placeId, place.name);
            }}
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
            onCloseClick={() => { setSelectedSavedPlace(null); setPlaceDetail(null); }}
          >
            <InfoWindowContent
              name={selectedSavedPlace.name}
              category={selectedSavedPlace.category}
              isSavedPlace
            />
          </InfoWindow>
        )}

        {selectedStop && (
          <InfoWindow
            position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
            onCloseClick={() => { setSelectedStop(null); setPlaceDetail(null); }}
          >
            <InfoWindowContent
              name={selectedStop.name}
              category={selectedStop.category}
              durationMinutes={selectedStop.durationMinutes}
            />
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
