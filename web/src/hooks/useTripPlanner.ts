import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trip, Stop } from '../lib/types/planner';
import { MOCK_TRIPS } from '../lib/types/mockData';
import { v4 as uuidv4 } from 'uuid';

interface TripPlannerState {
  trips: Trip[];
  activeTripId: string | null;
  setActiveTrip: (id: string) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  addStop: (tripId: string, stop: Omit<Stop, 'id' | 'order' | 'visited'>) => void;
  updateStop: (tripId: string, stopId: string, updates: Partial<Stop>) => void;
  removeStop: (tripId: string, stopId: string) => void;
  reorderStops: (tripId: string, startIndex: number, endIndex: number) => void;
  toggleStopVisited: (tripId: string, stopId: string) => void;
}

export const useTripPlanner = create<TripPlannerState>()(
  persist(
    (set) => ({
      trips: MOCK_TRIPS, // init with mock data
      activeTripId: MOCK_TRIPS[0].id,

      setActiveTrip: (id) => set({ activeTripId: id }),

      addTrip: (tripData) => set((state) => {
        const newTrip: Trip = {
          ...tripData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          trips: [...state.trips, newTrip],
          activeTripId: newTrip.id,
        };
      }),

      updateTrip: (id, updates) => set((state) => ({
        trips: state.trips.map((trip) =>
          trip.id === id ? { ...trip, ...updates, updatedAt: new Date().toISOString() } : trip
        ),
      })),

      deleteTrip: (id) => set((state) => ({
        trips: state.trips.filter((trip) => trip.id !== id),
        activeTripId: state.activeTripId === id 
          ? (state.trips.filter(t => t.id !== id)[0]?.id || null) 
          : state.activeTripId
      })),

      addStop: (tripId, stopData) => set((state) => ({
        trips: state.trips.map((trip) => {
          if (trip.id === tripId) {
            const newStop: Stop = {
              ...stopData,
              id: uuidv4(),
              order: trip.stops.length,
              visited: false,
            };
            return {
              ...trip,
              stops: [...trip.stops, newStop],
              updatedAt: new Date().toISOString(),
            };
          }
          return trip;
        }),
      })),

      updateStop: (tripId, stopId, updates) => set((state) => ({
        trips: state.trips.map((trip) => {
          if (trip.id === tripId) {
            return {
              ...trip,
              stops: trip.stops.map((s: Stop) => s.id === stopId ? { ...s, ...updates } : s),
              updatedAt: new Date().toISOString(),
            };
          }
          return trip;
        }),
      })),

      removeStop: (tripId, stopId) => set((state) => ({
        trips: state.trips.map((trip) => {
          if (trip.id === tripId) {
            const filteredStops = trip.stops.filter((s) => s.id !== stopId);
            const reorderedStops = filteredStops.map((s: Stop, idx: number) => ({ ...s, order: idx }));
            return {
              ...trip,
              stops: reorderedStops,
              updatedAt: new Date().toISOString(),
            };
          }
          return trip;
        }),
      })),

      reorderStops: (tripId, startIndex, endIndex) => set((state) => ({
        trips: state.trips.map((trip) => {
          if (trip.id === tripId) {
            const newStops = Array.from(trip.stops);
            const [removed] = newStops.splice(startIndex, 1);
            newStops.splice(endIndex, 0, removed);
            
            // update orders
            const reorderedStops = newStops.map((s: Stop, idx: number) => ({ ...s, order: idx }));
            
            return {
              ...trip,
              stops: reorderedStops,
              updatedAt: new Date().toISOString(),
            };
          }
          return trip;
        }),
      })),

      toggleStopVisited: (tripId, stopId) => set((state) => ({
        trips: state.trips.map((trip) => {
          if (trip.id === tripId) {
            return {
              ...trip,
              stops: trip.stops.map((s: Stop) => s.id === stopId ? { ...s, visited: !s.visited } : s),
              updatedAt: new Date().toISOString(),
            };
          }
          return trip;
        }),
      })),
    }),
    {
      name: 'mojip-trip-planner-storage',
    }
  )
);
