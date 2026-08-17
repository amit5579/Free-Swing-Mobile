import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { haversineDistanceYards } from '../utils/rangefinder/math';

export interface RangefinderState {
  playerLocation: [number, number] | null; // [longitude, latitude]
  aimLocation: [number, number] | null;    // [longitude, latitude]
  pinLocation: [number, number] | null;    // [longitude, latitude]
  distanceToAim: number | null;
  distanceToPin: number | null;
  aimToPin: number | null;
  isTracking: boolean;
  errorMsg: string | null;
}

export function useRangefinder(initialPinLat?: number, initialPinLng?: number) {
  const [state, setState] = useState<RangefinderState>({
    playerLocation: null,
    aimLocation: null,
    pinLocation: initialPinLat && initialPinLng ? [initialPinLng, initialPinLat] : null,
    distanceToAim: null,
    distanceToPin: null,
    aimToPin: null,
    isTracking: false,
    errorMsg: null,
  });

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Helper to safely set aim location and recalculate distances
  const setAimLocation = useCallback((lng: number, lat: number) => {
    setState((prev) => {
      let distanceToAim = null;
      let aimToPin = null;

      if (prev.playerLocation) {
        distanceToAim = haversineDistanceYards(
          prev.playerLocation[1],
          prev.playerLocation[0],
          lat,
          lng
        );
      }

      if (prev.pinLocation) {
        aimToPin = haversineDistanceYards(
          lat,
          lng,
          prev.pinLocation[1],
          prev.pinLocation[0]
        );
      }

      return {
        ...prev,
        aimLocation: [lng, lat],
        distanceToAim,
        aimToPin,
      };
    });
  }, []);

  const setPinLocation = useCallback((lng: number, lat: number) => {
    setState((prev) => {
      let distanceToPin = null;
      let aimToPin = null;

      if (prev.playerLocation) {
        distanceToPin = haversineDistanceYards(
          prev.playerLocation[1],
          prev.playerLocation[0],
          lat,
          lng
        );
      }

      if (prev.aimLocation) {
        aimToPin = haversineDistanceYards(
          prev.aimLocation[1],
          prev.aimLocation[0],
          lat,
          lng
        );
      }

      return {
        ...prev,
        pinLocation: [lng, lat],
        distanceToPin,
        aimToPin,
      };
    });
  }, []);

  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((prev) => ({ ...prev, errorMsg: 'Permission to access location was denied' }));
        return;
      }

      setState((prev) => ({ ...prev, isTracking: true, errorMsg: null }));

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setState((prev) => {
            let distanceToPin = null;
            let distanceToAim = null;

            if (prev.pinLocation) {
              distanceToPin = haversineDistanceYards(
                latitude,
                longitude,
                prev.pinLocation[1],
                prev.pinLocation[0]
              );
            }

            if (prev.aimLocation) {
              distanceToAim = haversineDistanceYards(
                latitude,
                longitude,
                prev.aimLocation[1],
                prev.aimLocation[0]
              );
            }

            return {
              ...prev,
              playerLocation: [longitude, latitude],
              distanceToPin,
              distanceToAim,
            };
          });
        }
      );
    } catch (error: any) {
      setState((prev) => ({ ...prev, errorMsg: error.message || 'Error tracking location' }));
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    ...state,
    setAimLocation,
    setPinLocation,
    startTracking,
    stopTracking,
  };
}
