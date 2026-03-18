import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trip, Stop, DayPlan, ChecklistItem, WishlistItem } from '../lib/types/planner';
import { MOCK_TRIPS } from '../lib/types/mockData';
import { v4 as uuidv4 } from 'uuid';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  getTripsFromSupabase, 
  saveTripToSupabase, 
  updateTripInSupabase, 
  deleteTripFromSupabase,
  addDayToSupabase,
  removeDayFromSupabase,
  upsertStopsForDay
} from '../lib/supabase-planner';

interface TripPlannerState {
  trips: Trip[];
  activeTripId: string | null;
  activeDayId: string | null;
  activeDayLegs: { distance: string; duration: string }[];
  isLoading: boolean;
  
  // Basic Actions
  setActiveTrip: (id: string | null) => void;
  setActiveDay: (id: string | null) => void;
  setLegs: (legs: { distance: string; duration: string }[]) => void;
  fetchTrips: () => Promise<void>;
  
  // Trip Actions
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'days'>) => Promise<void>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  
  // Day Actions
  addDay: (tripId: string) => Promise<void>;
  removeDay: (tripId: string, dayId: string) => Promise<void>;
  
  // Checklist Actions
  addChecklistItem: (tripId: string, text: string, personIndex?: number) => Promise<void>;
  toggleChecklistItem: (tripId: string, itemId: string) => Promise<void>;
  updateChecklistItem: (tripId: string, itemId: string, text: string) => Promise<void>;
  removeChecklistItem: (tripId: string, itemId: string) => Promise<void>;

  // Wishlist Actions
  addWishlistItem: (tripId: string, text: string, personIndex?: number) => Promise<void>;
  toggleWishlistItem: (tripId: string, itemId: string) => Promise<void>;
  updateWishlistItem: (tripId: string, itemId: string, text: string) => Promise<void>;
  removeWishlistItem: (tripId: string, itemId: string) => Promise<void>;

  // Tip Actions
  updateTip: (tripId: string, index: number, newText: string) => Promise<void>;

  // Traveler Name Actions
  updateTravelerName: (tripId: string, personIndex: number, name: string) => Promise<void>;

  // Stop Actions
  addStop: (tripId: string, dayId: string, stop: Omit<Stop, 'id' | 'order' | 'visited'>) => Promise<void>;
  updateStop: (tripId: string, dayId: string, stopId: string, updates: Partial<Stop>) => Promise<void>;
  removeStop: (tripId: string, dayId: string, stopId: string) => Promise<void>;
  reorderStops: (tripId: string, dayId: string, startIndex: number, endIndex: number) => Promise<void>;
  toggleStopVisited: (tripId: string, dayId: string, stopId: string) => Promise<void>;
}

export const useTripPlanner = create<TripPlannerState>()(
  persist(
    (set, get) => ({
      trips: MOCK_TRIPS as Trip[],
      activeTripId: MOCK_TRIPS[0].id,
      activeDayId: MOCK_TRIPS[0].days[0]?.id || null,
      activeDayLegs: [],
      isLoading: false,

      setActiveTrip: (id) => {
        const trip = get().trips.find(t => t.id === id);
        set({ 
          activeTripId: id,
          activeDayId: trip?.days[0]?.id || null,
          activeDayLegs: [] // Reset legs when switching trip
        });
      },

      setActiveDay: (id) => set({ 
        activeDayId: id,
        activeDayLegs: [] // Reset legs when switching day
      }),

      setLegs: (legs) => set({ activeDayLegs: legs }),

      fetchTrips: async () => {
        if (!isSupabaseConfigured()) return;
        set({ isLoading: true });
        try {
          const trips = await getTripsFromSupabase();
          if (trips.length > 0) {
            set((state) => ({ 
              trips,
              activeTripId: state.activeTripId || trips[0].id,
              activeDayId: state.activeDayId || trips[0].days[0]?.id || null
            }));
          }
        } catch (error) {
          console.error("Failed to fetch trips:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      addTrip: async (tripData) => {
        const firstDayId = uuidv4();
        const newTrip: Trip = {
          ...tripData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          days: [
            {
              id: firstDayId,
              dayNumber: 1,
              stops: [],
            }
          ],
        };

        set((state) => ({
          trips: [...state.trips, newTrip],
          activeTripId: newTrip.id,
          activeDayId: firstDayId
        }));

        if (isSupabaseConfigured()) {
          try {
            await saveTripToSupabase(newTrip);
          } catch (e) { console.error(e); }
        }
      },

      updateTrip: async (id, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id ? { ...trip, ...updates, updatedAt: new Date().toISOString() } : trip
          ),
        }));

        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === id);
          if (trip) {
            try {
              await updateTripInSupabase(trip);
            } catch (e) { console.error(e); }
          }
        }
      },

      deleteTrip: async (id) => {
        set((state) => {
          const nextTrips = state.trips.filter((trip) => trip.id !== id);
          const nextActiveTrip = nextTrips[0] || null;
          return {
            trips: nextTrips,
            activeTripId: state.activeTripId === id ? nextActiveTrip?.id || null : state.activeTripId,
            activeDayId: state.activeTripId === id ? nextActiveTrip?.days[0]?.id || null : state.activeDayId
          };
        });

        if (isSupabaseConfigured()) {
          try {
            await deleteTripFromSupabase(id);
          } catch (e) { console.error(e); }
        }
      },

      addDay: async (tripId) => {
        const newDay: DayPlan = {
          id: uuidv4(),
          dayNumber: 0, // will be updated below
          stops: [],
        };

        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id === tripId) {
              const dayNumber = trip.days.length + 1;
              const updatedDays = [...trip.days, { ...newDay, dayNumber }];
              return { ...trip, days: updatedDays, updatedAt: new Date().toISOString() };
            }
            return trip;
          }),
        }));

        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          const addedDay = trip?.days.find(d => d.id === newDay.id);
          if (trip && addedDay) {
            try {
              await addDayToSupabase(tripId, addedDay);
            } catch (e) { console.error(e); }
          }
        }
      },

      removeDay: async (tripId, dayId) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id === tripId) {
              const filteredDays = trip.days.filter((d) => d.id !== dayId);
              const reorderedDays = filteredDays.map((d, idx) => ({ ...d, dayNumber: idx + 1 }));
              return { ...trip, days: reorderedDays, updatedAt: new Date().toISOString() };
            }
            return trip;
          }),
          activeDayId: state.activeDayId === dayId ? null : state.activeDayId
        }));

        if (isSupabaseConfigured()) {
          try {
            await removeDayFromSupabase(dayId);
          } catch (e) { console.error(e); }
        }
      },

      addChecklistItem: async (tripId, text, personIndex = 0) => {
        const newItem: ChecklistItem = { id: uuidv4(), text, checked: false, personIndex };
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, checklist: [...(trip.checklist || []), newItem], updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      updateChecklistItem: async (tripId, itemId, text) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  checklist: (trip.checklist || []).map((item) =>
                    item.id === itemId ? { ...item, text } : item
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      toggleChecklistItem: async (tripId, itemId) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  checklist: (trip.checklist || []).map((item) =>
                    item.id === itemId ? { ...item, checked: !item.checked } : item
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      removeChecklistItem: async (tripId, itemId) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  checklist: (trip.checklist || []).filter((item) => item.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      addWishlistItem: async (tripId, text, personIndex = 0) => {
        const newItem: WishlistItem = { id: uuidv4(), text, bought: false, personIndex };
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, wishlist: [...(trip.wishlist || []), newItem], updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      updateWishlistItem: async (tripId, itemId, text) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  wishlist: (trip.wishlist || []).map((item) =>
                    item.id === itemId ? { ...item, text } : item
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      toggleWishlistItem: async (tripId, itemId) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  wishlist: (trip.wishlist || []).map((item) =>
                    item.id === itemId ? { ...item, bought: !item.bought } : item
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      removeWishlistItem: async (tripId, itemId) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  wishlist: (trip.wishlist || []).filter((item) => item.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      updateTip: async (tripId, index, newText) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  tips: (trip.tips || []).map((t, i) => i === index ? newText : t),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      updateTravelerName: async (tripId, personIndex, name) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip;
            const names = Array.from(
              { length: trip.travelerCount },
              (_, i) => trip.travelerNames?.[i] ?? (i === 0 ? "나" : `동행 ${i}`)
            );
            names[personIndex] = name;
            return { ...trip, travelerNames: names, updatedAt: new Date().toISOString() };
          }),
        }));
        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          if (trip) { try { await updateTripInSupabase(trip); } catch (e) { console.error(e); } }
        }
      },

      addStop: async (tripId, dayId, stopData) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id === tripId) {
              const updatedDays = trip.days.map((day) => {
                if (day.id === dayId) {
                  const newStop: Stop = {
                    ...stopData,
                    id: uuidv4(),
                    order: day.stops.length,
                    visited: false,
                  };
                  return { ...day, stops: [...day.stops, newStop] };
                }
                return day;
              });
              return { ...trip, days: updatedDays, updatedAt: new Date().toISOString() };
            }
            return trip;
          }),
        }));

        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          const day = trip?.days.find(d => d.id === dayId);
          if (trip && day) {
            try {
              await upsertStopsForDay(tripId, day);
            } catch (e) { console.error(e); }
          }
        }
      },

      updateStop: async (tripId, dayId, stopId, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id === tripId) {
              const updatedDays = trip.days.map((day) => {
                if (day.id === dayId) {
                  return {
                    ...day,
                    stops: day.stops.map((s) => s.id === stopId ? { ...s, ...updates } : s),
                  };
                }
                return day;
              });
              return { ...trip, days: updatedDays, updatedAt: new Date().toISOString() };
            }
            return trip;
          }),
        }));

        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          const day = trip?.days.find(d => d.id === dayId);
          if (trip && day) {
            try {
              await upsertStopsForDay(tripId, day);
            } catch (e) { console.error(e); }
          }
        }
      },

      removeStop: async (tripId, dayId, stopId) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id === tripId) {
              const updatedDays = trip.days.map((day) => {
                if (day.id === dayId) {
                  const filteredStops = day.stops.filter((s) => s.id !== stopId);
                  const reorderedStops = filteredStops.map((s, idx) => ({ ...s, order: idx }));
                  return { ...day, stops: reorderedStops };
                }
                return day;
              });
              return { ...trip, days: updatedDays, updatedAt: new Date().toISOString() };
            }
            return trip;
          }),
        }));

        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          const day = trip?.days.find(d => d.id === dayId);
          if (trip && day) {
            try {
              await upsertStopsForDay(tripId, day);
            } catch (e) { console.error(e); }
          }
        }
      },

      reorderStops: async (tripId, dayId, startIndex, endIndex) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id === tripId) {
              const updatedDays = trip.days.map((day) => {
                if (day.id === dayId) {
                  const newStops = Array.from(day.stops);
                  const [removed] = newStops.splice(startIndex, 1);
                  newStops.splice(endIndex, 0, removed);
                  const reorderedStops = newStops.map((s, idx) => ({ ...s, order: idx }));
                  return { ...day, stops: reorderedStops };
                }
                return day;
              });
              return { ...trip, days: updatedDays, updatedAt: new Date().toISOString() };
            }
            return trip;
          }),
        }));

        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          const day = trip?.days.find(d => d.id === dayId);
          if (trip && day) {
            try {
              await upsertStopsForDay(tripId, day);
            } catch (e) { console.error(e); }
          }
        }
      },

      toggleStopVisited: async (tripId, dayId, stopId) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id === tripId) {
              const updatedDays = trip.days.map((day) => {
                if (day.id === dayId) {
                  return {
                    ...day,
                    stops: day.stops.map((s) => s.id === stopId ? { ...s, visited: !s.visited } : s),
                  };
                }
                return day;
              });
              return { ...trip, days: updatedDays, updatedAt: new Date().toISOString() };
            }
            return trip;
          }),
        }));

        if (isSupabaseConfigured()) {
          const trip = get().trips.find(t => t.id === tripId);
          const day = trip?.days.find(d => d.id === dayId);
          if (trip && day) {
            try {
              await upsertStopsForDay(tripId, day);
            } catch (e) { console.error(e); }
          }
        }
      },
    }),
    {
      name: 'mojip-trip-planner-storage-v2', // v2 to avoid conflicts with old schema
    }
  )
);
