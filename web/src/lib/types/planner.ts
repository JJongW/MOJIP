export type Category = 
  | 'Attraction'
  | 'Food'
  | 'Cafe'
  | 'Hotel'
  | 'Shopping'
  | 'Airport'
  | 'Transit'
  | 'Other';

export interface RouteSummary {
  totalDurationMin: number;
  totalDistanceKm: number;
  transportMode: 'driving' | 'transit' | 'walking' | 'bicycling';
}

export interface Stop {
  id: string; // uuid
  name: string;
  category: Category;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string; // from Google Places
  durationMinutes: number; // estimated stay
  memo?: string;
  order: number;
  visited: boolean;
}

export interface Trip {
  id: string; // uuid
  title: string;
  destination: string; // City or Region
  startDate?: string; // ISO date string
  endDate?: string;
  travelerCount: number;
  theme?: string; // e.g. "Food Tour"
  summary?: string; // One line summary
  notes?: string; 
  tips?: string[];
  stops: Stop[];
  routeSummary?: RouteSummary;
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
}
