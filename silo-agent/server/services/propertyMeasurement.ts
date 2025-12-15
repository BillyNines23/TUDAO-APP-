/**
 * Property Measurement Service
 * Integrates with mapping APIs to estimate property/lawn size from address
 */

interface PropertyMeasurement {
  estimatedSquareFeet: number;
  lawnSizeCategory: string; // "Small", "Medium", "Large", "Very large", "Over 1 acre"
  confidence: number; // 0.0 - 1.0
  coordinates?: { lat: number; lng: number };
}

/**
 * Estimate property size from address using Google Maps API
 * 
 * To use this:
 * 1. Get Google Maps API key from https://console.cloud.google.com/
 * 2. Enable: Geocoding API, Maps JavaScript API
 * 3. Add to secrets: GOOGLE_MAPS_API_KEY
 * 
 * Alternative APIs:
 * - Mapbox Geocoding API
 * - Google Earth Engine (free for non-commercial)
 * - County Assessor APIs (pre-calculated lot sizes)
 */
export async function estimatePropertySize(address: string): Promise<PropertyMeasurement | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not set. Skipping automatic property measurement.');
    return null;
  }
  
  try {
    // Step 1: Geocode address to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      console.warn('Geocoding failed:', geocodeData.status);
      return null;
    }
    
    const location = geocodeData.results[0].geometry.location;
    const coordinates = { lat: location.lat, lng: location.lng };
    
    // Step 2: Get property boundaries (requires additional API or parcel data)
    // For MVP: Use rough estimates based on property type
    const placeTypes = geocodeData.results[0].types;
    let estimatedSquareFeet = 7500; // Default: medium property
    let confidence = 0.5;
    
    // Better approach: Use Google Earth Engine or parcel data APIs
    // For now, provide conservative estimates
    if (placeTypes.includes('street_address')) {
      // Residential property - estimate based on region
      estimatedSquareFeet = 8000; // ~0.18 acres
      confidence = 0.6;
    }
    
    // Convert square feet to category
    const lawnSizeCategory = categorizeLawnSize(estimatedSquareFeet);
    
    return {
      estimatedSquareFeet,
      lawnSizeCategory,
      confidence,
      coordinates
    };
    
  } catch (error) {
    console.error('Error estimating property size:', error);
    return null;
  }
}

/**
 * Convert square footage to lawn size category
 */
function categorizeLawnSize(squareFeet: number): string {
  if (squareFeet < 5000) return "Small (under 5,000 sq ft)";
  if (squareFeet < 10000) return "Medium (5,000-10,000 sq ft)";
  if (squareFeet < 20000) return "Large (10,000-20,000 sq ft)";
  if (squareFeet < 43560) return "Very large (over 20,000 sq ft / 0.5+ acres)"; // 43,560 sq ft = 1 acre
  return "Over 1 acre";
}

/**
 * Advanced: Use Google Earth Engine API for precise measurement
 * Requires: Earth Engine account + service account credentials
 * 
 * This would:
 * 1. Get satellite imagery for the property
 * 2. Use ML to detect building footprint
 * 3. Calculate lawn area (lot size - building - driveway)
 * 4. Return exact square footage
 * 
 * See: https://developers.google.com/earth-engine/apidocs/ee-geometry-area
 */
export async function measurePropertyWithSatellite(address: string): Promise<PropertyMeasurement | null> {
  // TODO: Implement Google Earth Engine integration
  // Requires Python/Node.js Earth Engine library
  // Reference: https://developers.google.com/earth-engine/guides/getstarted
  
  console.log('Satellite measurement not yet implemented. Use estimatePropertySize() for now.');
  return null;
}
