// GPS Utilities and DHR Waypoint Mapping for TrackGuard DHR

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  kmMarker: string;
  section: string;
  nearestStationName?: string;
  distanceToAlignmentKm?: number;
  isSimulated?: boolean;
}

export interface DHRWaypoint {
  name: string;
  km: number;
  lat: number;
  lng: number;
  section: 'kurseong-ghum' | 'ghum-darjeeling';
}

// Key reference waypoints along the Darjeeling Himalayan Railway (DHR)
export const DHR_WAYPOINTS: DHRWaypoint[] = [
  { name: 'Kurseong Station', km: 51.0, lat: 26.8814, lng: 88.2783, section: 'kurseong-ghum' },
  { name: 'Tung Station', km: 58.0, lat: 26.9247, lng: 88.2612, section: 'kurseong-ghum' },
  { name: 'Dilaram Point', km: 61.2, lat: 26.9450, lng: 88.2680, section: 'kurseong-ghum' },
  { name: 'Sonada Station', km: 64.5, lat: 26.9637, lng: 88.2709, section: 'kurseong-ghum' },
  { name: 'Rongbull Loop', km: 70.0, lat: 26.9850, lng: 88.2750, section: 'kurseong-ghum' },
  { name: 'Jorebungalow', km: 72.8, lat: 27.0040, lng: 88.2620, section: 'kurseong-ghum' },
  { name: 'Ghum Station (Summit)', km: 74.2, lat: 27.0116, lng: 88.2580, section: 'ghum-darjeeling' },
  { name: 'Batasia Loop', km: 78.5, lat: 27.0168, lng: 88.2464, section: 'ghum-darjeeling' },
  { name: 'Darjeeling Station', km: 88.0, lat: 27.0396, lng: 88.2625, section: 'ghum-darjeeling' },
];

/**
 * Calculates Great-Circle distance between two coordinates in kilometers (Haversine formula).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
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
 * Finds the nearest DHR waypoint and distance in km.
 */
export function findNearestWaypoint(
  lat: number,
  lng: number
): { waypoint: DHRWaypoint; distanceKm: number } {
  let minDistance = Infinity;
  let nearest = DHR_WAYPOINTS[0];

  for (const wp of DHR_WAYPOINTS) {
    const dist = calculateDistanceKm(lat, lng, wp.lat, wp.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = wp;
    }
  }

  return { waypoint: nearest, distanceKm: minDistance };
}

/**
 * Estimates nearest km marker on DHR based on current GPS location.
 */
export function estimateKmMarker(lat: number, lng: number): string {
  const { waypoint } = findNearestWaypoint(lat, lng);
  return waypoint.km.toFixed(1);
}

/**
 * Estimates railway section ("kurseong-ghum" or "ghum-darjeeling")
 */
export function estimateSection(lat: number, lng: number): string {
  if (lat >= 27.0116) {
    return 'ghum-darjeeling';
  }
  return 'kurseong-ghum';
}

/**
 * Wrapper around navigator.geolocation.getCurrentPosition
 */
export async function getCurrentPosition(): Promise<GeoLocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser or environment.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const { waypoint, distanceKm } = findNearestWaypoint(latitude, longitude);

        resolve({
          latitude,
          longitude,
          accuracy,
          kmMarker: waypoint.km.toFixed(1),
          section: waypoint.section,
          nearestStationName: waypoint.name,
          distanceToAlignmentKm: Math.round(distanceKm),
          isSimulated: distanceKm > 15,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}
