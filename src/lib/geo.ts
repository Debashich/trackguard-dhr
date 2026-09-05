// ============================================
// DHR WAYPOINTS & HAVERSINE GEO ENGINE
// Reference: docs/trackguard_dhr_complete_blueprint.md (Section 5.4)
// ============================================

import { GeoLocationResult } from './types';

export interface DHRWaypoint {
  id: string;
  name: string;
  kmMarker: number;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  section: 'kurseong-ghum' | 'ghum-darjeeling';
}

// Official UNESCO DHR Alignment Milestones (88 km alignment)
export const DHR_WAYPOINTS: DHRWaypoint[] = [
  {
    id: 'kurseong',
    name: 'Kurseong Station',
    kmMarker: 51.0,
    latitude: 26.8814,
    longitude: 88.2783,
    altitudeMeters: 1483,
    section: 'kurseong-ghum',
  },
  {
    id: 'tung',
    name: 'Tung Station',
    kmMarker: 58.0,
    latitude: 26.9247,
    longitude: 88.2612,
    altitudeMeters: 1728,
    section: 'kurseong-ghum',
  },
  {
    id: 'dilaram',
    name: 'Dilaram Point',
    kmMarker: 61.2,
    latitude: 26.9450,
    longitude: 88.2680,
    altitudeMeters: 1810,
    section: 'kurseong-ghum',
  },
  {
    id: 'sonada',
    name: 'Sonada Station',
    kmMarker: 64.5,
    latitude: 26.9637,
    longitude: 88.2709,
    altitudeMeters: 1996,
    section: 'kurseong-ghum',
  },
  {
    id: 'rongbull',
    name: 'Rongbull Loop',
    kmMarker: 70.0,
    latitude: 26.9850,
    longitude: 88.2750,
    altitudeMeters: 2110,
    section: 'kurseong-ghum',
  },
  {
    id: 'jorebungalow',
    name: 'Jorebungalow',
    kmMarker: 72.8,
    latitude: 27.0040,
    longitude: 88.2620,
    altitudeMeters: 2200,
    section: 'kurseong-ghum',
  },
  {
    id: 'ghum',
    name: 'Ghum Station Summit',
    kmMarker: 74.2,
    latitude: 27.0116,
    longitude: 88.2580,
    altitudeMeters: 2258,
    section: 'kurseong-ghum',
  },
  {
    id: 'batasia',
    name: 'Batasia Loop',
    kmMarker: 78.5,
    latitude: 27.0168,
    longitude: 88.2464,
    altitudeMeters: 2145,
    section: 'ghum-darjeeling',
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling Station',
    kmMarker: 88.0,
    latitude: 27.0396,
    longitude: 88.2625,
    altitudeMeters: 2073,
    section: 'ghum-darjeeling',
  },
];

/**
 * Pure Haversine formula calculation over Earth radius of 6,371 km
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest DHR railway milestone to a coordinate pair
 */
export function findNearestWaypoint(
  lat: number,
  lng: number
): { waypoint: DHRWaypoint; distanceKm: number } {
  let nearest = DHR_WAYPOINTS[0];
  let minDistance = calculateDistanceKm(lat, lng, nearest.latitude, nearest.longitude);

  for (let i = 1; i < DHR_WAYPOINTS.length; i++) {
    const dist = calculateDistanceKm(lat, lng, DHR_WAYPOINTS[i].latitude, DHR_WAYPOINTS[i].longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = DHR_WAYPOINTS[i];
    }
  }

  return { waypoint: nearest, distanceKm: minDistance };
}

/**
 * Returns estimated kilometer marker string formatted to one decimal place
 */
export function estimateKmMarker(lat: number, lng: number): string {
  const { waypoint } = findNearestWaypoint(lat, lng);
  return waypoint.kmMarker.toFixed(1);
}

/**
 * Assigns sector: south of Ghum Summit (27.0116°N) is 'kurseong-ghum', north is 'ghum-darjeeling'
 */
export function estimateSection(lat: number, _lng: number): 'kurseong-ghum' | 'ghum-darjeeling' {
  return lat <= 27.0116 ? 'kurseong-ghum' : 'ghum-darjeeling';
}

/**
 * Retrieves device GPS coordinates with high accuracy.
 * If away from DHR alignment (>15 km) or if GPS is unavailable, safely falls back
 * to a simulated DHR station location so offline hackathon testing works seamlessly.
 */
export async function getCurrentPosition(simulatedStationId?: string): Promise<GeoLocationResult> {
  // If explicitly requesting a simulated station
  if (simulatedStationId) {
    const station = DHR_WAYPOINTS.find((w) => w.id === simulatedStationId) || DHR_WAYPOINTS[0];
    return {
      latitude: station.latitude,
      longitude: station.longitude,
      accuracy: 5,
      kmMarker: station.kmMarker.toFixed(1),
      section: station.section,
      nearestWaypointName: station.name,
      distanceToTrackKm: 0,
      isSimulated: true,
    };
  }

  // Attempt real browser geolocation
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy || 10;
      const { waypoint, distanceKm } = findNearestWaypoint(lat, lng);

      // If user is within 15 km of DHR alignment, use real GPS
      if (distanceKm <= 15) {
        return {
          latitude: lat,
          longitude: lng,
          accuracy,
          kmMarker: waypoint.kmMarker.toFixed(1),
          section: estimateSection(lat, lng),
          nearestWaypointName: waypoint.name,
          distanceToTrackKm: distanceKm,
          isSimulated: false,
        };
      }

      // If user is far from the Himalayas (e.g. testing at home or conference center),
      // simulate closest milestone or default to Kurseong Station
      return {
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        accuracy: 12,
        kmMarker: waypoint.kmMarker.toFixed(1),
        section: waypoint.section,
        nearestWaypointName: `${waypoint.name} (Simulated)`,
        distanceToTrackKm: 0,
        isSimulated: true,
      };
    } catch {
      // On Geolocation rejection or timeout, fall back to Kurseong
    }
  }

  // Default fallback milestone
  const defaultStation = DHR_WAYPOINTS[0];
  return {
    latitude: defaultStation.latitude,
    longitude: defaultStation.longitude,
    accuracy: 15,
    kmMarker: defaultStation.kmMarker.toFixed(1),
    section: defaultStation.section,
    nearestWaypointName: `${defaultStation.name} (Fallback)`,
    distanceToTrackKm: 0,
    isSimulated: true,
  };
}
