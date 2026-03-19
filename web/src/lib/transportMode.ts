export type TransportMode = 'driving' | 'transit' | 'subway' | 'walking' | 'bicycling' | 'airplane';

export const TRANSPORT_COLORS: Record<TransportMode, string> = {
  driving:   '#3B82F6',  // blue
  transit:   '#10B981',  // emerald (버스)
  subway:    '#6366F1',  // indigo (지하철/전차)
  walking:   '#F97316',  // orange
  bicycling: '#EAB308',  // yellow
  airplane:  '#8B5CF6',  // purple
};

export function googleTravelMode(mode: TransportMode): google.maps.TravelMode {
  switch (mode) {
    case 'transit':   return google.maps.TravelMode.TRANSIT;
    case 'subway':    return google.maps.TravelMode.TRANSIT;
    case 'walking':   return google.maps.TravelMode.WALKING;
    case 'bicycling': return google.maps.TravelMode.BICYCLING;
    default:          return google.maps.TravelMode.DRIVING;
  }
}
