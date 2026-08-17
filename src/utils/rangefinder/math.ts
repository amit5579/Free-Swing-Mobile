/**
 * Rangefinder Math Utilities
 * Ported from Angular HoleService / RangefinderService
 */

/**
 * Calculates the distance between two GPS coordinates in meters.
 * Uses the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Converts meters to yards.
 */
export function metersToYards(meters: number): number {
  return Math.round(meters * 1.09361);
}

/**
 * Calculates the Haversine distance in yards directly.
 */
export function haversineDistanceYards(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const meters = haversineDistance(lat1, lon1, lat2, lon2);
  return metersToYards(meters);
}

/**
 * Calculates the bearing between two GPS coordinates.
 * Returns bearing in degrees (0 to 360).
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const toDegrees = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const λ1 = toRadians(lon1);
  const λ2 = toRadians(lon2);

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

  let θ = Math.atan2(y, x);
  let bearing = toDegrees(θ);
  
  // Normalize to 0-360
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Calculates a new GPS coordinate given a start point, distance (in yards), and bearing (in degrees).
 */
export function calculateDestinationPoint(
  lat: number,
  lon: number,
  distanceYards: number,
  bearingDegrees: number
): [number, number] {
  const R = 6371e3; // Earth radius in meters
  const distanceMeters = distanceYards / 1.09361;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const toDegrees = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRadians(lat);
  const λ1 = toRadians(lon);
  const θ = toRadians(bearingDegrees);
  const δ = distanceMeters / R;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );

  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );

  return [toDegrees(λ2), toDegrees(φ2)]; // Return [longitude, latitude] for GeoJSON
}
