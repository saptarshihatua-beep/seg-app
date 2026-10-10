/**
 * Geographic Polygon and Spatial Geometry Utilities
 * Implements Ray-Casting Algorithm for Point-in-Polygon (PIP) and Haversine Distance
 */

/**
 * Standardizes raw coordinate input into an array of {lat, lng} objects.
 * Supports:
 * 1) Array of objects: [{lat: 38.893, lng: -104.801}, ...]
 * 2) Array of tuples: [[38.893, -104.801], ...]
 * 3) Comma-separated string from original Ashish Korpe prototype:
 *    "38.894143,-104.800769,38.893867,-104.801091,38.893178,-104.799760,38.893445,-104.799589"
 */
function parsePolygonCoordinates(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(pt => {
      if (Array.isArray(pt)) {
        return { lat: parseFloat(pt[0]), lng: parseFloat(pt[1]) };
      }
      return { lat: parseFloat(pt.lat || pt.latitude), lng: parseFloat(pt.lng || pt.longitude) };
    });
  }

  if (typeof raw === 'string') {
    // Check if JSON
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsePolygonCoordinates(parsed);
      } catch (e) {
        // Fall through to comma-separated
      }
    }

    // Comma-separated lat,lng pairs
    const parts = trimmed.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    const points = [];
    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        points.push({ lat: parts[i], lng: parts[i + 1] });
      }
    }
    return points;
  }

  return [];
}

/**
 * Ray-Casting algorithm to check if a point is inside a polygon.
 * @param {Object} point - {lat, lng}
 * @param {Array<Object>} polygon - Array of {lat, lng}
 * @returns {boolean} true if point is inside
 */
function isPointInPolygon(point, polygon) {
  if (!point || !polygon || polygon.length < 3) return false;

  const lat = point.lat;
  const lng = point.lng;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;

    // Check intersection with horizontal ray
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
function haversineDistanceMeters(coord1, coord2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes the center/centroid of a polygon
 */
function getPolygonCentroid(polygon) {
  if (!polygon || polygon.length === 0) return { lat: 0, lng: 0 };
  let sumLat = 0;
  let sumLng = 0;
  for (const pt of polygon) {
    sumLat += pt.lat;
    sumLng += pt.lng;
  }
  return {
    lat: Number((sumLat / polygon.length).toFixed(6)),
    lng: Number((sumLng / polygon.length).toFixed(6))
  };
}

module.exports = {
  parsePolygonCoordinates,
  isPointInPolygon,
  haversineDistanceMeters,
  getPolygonCentroid
};
