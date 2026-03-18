export interface SavedPlace {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  personIndex?: number;
}

export interface WishlistItem {
  id: string;
  text: string;
  bought: boolean;
  personIndex?: number;
}

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

export interface LegInfo {
  distance: string;
  duration: string;
}

export interface DayPlan {
  id: string;       // uuid
  dayNumber: number; // 1-based
  date?: string;    // ISO date string (e.g. "2023-10-15")
  stops: Stop[];
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
  checklist?: ChecklistItem[];
  wishlist?: WishlistItem[];
  travelerNames?: string[];
  savedPlaces?: SavedPlace[];
  days: DayPlan[];    // Day-based itinerary
  routeSummary?: RouteSummary;
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
}
