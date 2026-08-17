import { calculateDestinationPoint } from './math';

/**
 * Generates a GeoJSON LineString connecting a list of coordinates.
 * @param coords Array of [longitude, latitude] points
 */
export function createLineString(coords: [number, number][]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
    properties: {},
  };
}

/**
 * Generates a GeoJSON Polygon representing a circle with a given radius (in yards).
 * Used for drawing club distance arcs.
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusYards Radius in yards
 * @param points Number of points to generate (higher = smoother circle)
 */
export function createGeoJSONCircle(
  centerLat: number,
  centerLon: number,
  radiusYards: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  
  for (let i = 0; i < points; i++) {
    const bearing = (i * 360) / points;
    const dest = calculateDestinationPoint(centerLat, centerLon, radiusYards, bearing);
    coords.push(dest);
  }
  
  // Close the polygon
  coords.push([...coords[0]]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: {
      radius: radiusYards,
    },
  };
}

/**
 * Helper to combine multiple features into a FeatureCollection.
 */
export function createFeatureCollection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features,
  };
}
