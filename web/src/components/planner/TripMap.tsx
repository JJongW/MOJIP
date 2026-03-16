/// <reference types="@types/google.maps" />
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Trip } from '@/lib/types/planner';
import { useMemo, useEffect, useState } from 'react';
import TripMarker from './TripMarker';

interface TripMapProps {
  activeTrip: Trip;
}

export default function TripMap({ activeTrip }: TripMapProps) {
  const map = useMap('mojip-trip-map-styled');
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setDirectionsService(new routesLibrary.DirectionsService());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#2563eb', // Primary Blue
        strokeWeight: 4,
        strokeOpacity: 0.8,
      }
    }));
  }, [routesLibrary, map]);

  // Center map on the first stop, or general center if no stops
  const defaultCenter = useMemo(() => {
    if (activeTrip.stops.length > 0) {
      return { lat: activeTrip.stops[0].lat, lng: activeTrip.stops[0].lng };
    }
    return { lat: 34.6937, lng: 135.5023 }; // Osaka
  }, [activeTrip.stops]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || activeTrip.stops.length < 2) {
      directionsRenderer?.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult);
      return;
    }

    const waypoints = activeTrip.stops.slice(1, -1).map(stop => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true
    }));

    const origin = { lat: activeTrip.stops[0].lat, lng: activeTrip.stops[0].lng };
    const destination = { lat: activeTrip.stops[activeTrip.stops.length - 1].lat, lng: activeTrip.stops[activeTrip.stops.length - 1].lng };

    directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.TRANSIT, // Can make this dynamic later
      // Fallback to DRIVING if TRANSIT returns no results, for better UX
      provideRouteAlternatives: false,
    }, (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
      } else {
        // Fallback to Driving
        directionsService.route({
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING 
        }, (res: google.maps.DirectionsResult | null, stat: google.maps.DirectionsStatus) => {
          if (stat === google.maps.DirectionsStatus.OK && res) {
            directionsRenderer.setDirections(res);
          }
        });
      }
    });

  }, [directionsService, directionsRenderer, activeTrip.stops]);

  useEffect(() => {
    if (!map || activeTrip.stops.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    activeTrip.stops.forEach(stop => {
      bounds.extend({ lat: stop.lat, lng: stop.lng });
    });
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [map, activeTrip.stops]);

  return (
    <div className="w-full h-full relative">
      <Map
        mapId="mojip-trip-map-styled"
        defaultCenter={defaultCenter}
        defaultZoom={11}
        disableDefaultUI={true}
        gestureHandling={'greedy'}
      >
        {activeTrip.stops.map(stop => (
          <TripMarker 
            key={stop.id} 
            stop={stop} 
            isActive={false} // We can tie this to a selectedStop state later
          />
        ))}
      </Map>
    </div>
  );
}
