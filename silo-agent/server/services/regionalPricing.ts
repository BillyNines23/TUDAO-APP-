/**
 * Regional Pricing Service
 * Applies location-based adjustments to labor costs based on local market conditions
 */

interface RegionalMultiplier {
  city: string;
  state: string;
  multiplier: number;
  label: string;
}

/**
 * Regional pricing multipliers based on cost of living and local labor markets
 * Applied to labor costs only (materials are nationally priced)
 */
const REGIONAL_MULTIPLIERS: RegionalMultiplier[] = [
  // High-cost metro areas (+20-30%)
  { city: "San Francisco", state: "CA", multiplier: 1.25, label: "San Francisco premium" },
  { city: "San Jose", state: "CA", multiplier: 1.25, label: "San Jose premium" },
  { city: "Oakland", state: "CA", multiplier: 1.20, label: "Oakland premium" },
  { city: "New York", state: "NY", multiplier: 1.25, label: "NYC premium" },
  { city: "Manhattan", state: "NY", multiplier: 1.30, label: "Manhattan premium" },
  { city: "Brooklyn", state: "NY", multiplier: 1.25, label: "Brooklyn premium" },
  { city: "Los Angeles", state: "CA", multiplier: 1.20, label: "LA premium" },
  { city: "Seattle", state: "WA", multiplier: 1.20, label: "Seattle premium" },
  { city: "Boston", state: "MA", multiplier: 1.20, label: "Boston premium" },
  { city: "Washington", state: "DC", multiplier: 1.20, label: "DC premium" },
  
  // Medium-cost cities (+10-15%)
  { city: "Austin", state: "TX", multiplier: 1.15, label: "Austin premium" },
  { city: "Denver", state: "CO", multiplier: 1.15, label: "Denver premium" },
  { city: "Portland", state: "OR", multiplier: 1.10, label: "Portland premium" },
  { city: "Chicago", state: "IL", multiplier: 1.10, label: "Chicago premium" },
  { city: "Miami", state: "FL", multiplier: 1.10, label: "Miami premium" },
  { city: "San Diego", state: "CA", multiplier: 1.15, label: "San Diego premium" },
  
  // Standard rate cities (0%) - major cities at baseline
  { city: "Dallas", state: "TX", multiplier: 1.00, label: "Standard rate" },
  { city: "Houston", state: "TX", multiplier: 1.00, label: "Standard rate" },
  { city: "Phoenix", state: "AZ", multiplier: 1.00, label: "Standard rate" },
  { city: "Atlanta", state: "GA", multiplier: 1.00, label: "Standard rate" },
  { city: "Philadelphia", state: "PA", multiplier: 1.00, label: "Standard rate" },
  { city: "San Antonio", state: "TX", multiplier: 0.95, label: "Standard rate" },
];

/**
 * State-level defaults for areas not in city list
 * Rural areas within these states get discounts
 */
const STATE_DEFAULTS: Record<string, number> = {
  "CA": 1.10, // California default (high cost)
  "NY": 1.10, // New York default (high cost)
  "MA": 1.10, // Massachusetts default
  "WA": 1.05, // Washington default
  "CO": 1.05, // Colorado default
  "TX": 0.95, // Texas default (lower cost)
  "FL": 0.95, // Florida default
  "AZ": 0.95, // Arizona default
};

/**
 * Default multiplier for rural/unknown areas
 */
const RURAL_DISCOUNT = 0.85; // -15% for rural areas

export interface LocationInfo {
  city?: string;
  state?: string;
  raw: string;
}

export interface RegionalPricingResult {
  multiplier: number;
  label: string;
  adjustmentPercent: number; // e.g., +25 or -15
  appliesTo: string; // "labor only" or "all costs"
}

/**
 * Map full state names to abbreviations
 */
const STATE_NAME_MAP: Record<string, string> = {
  'california': 'CA',
  'texas': 'TX',
  'new york': 'NY',
  'florida': 'FL',
  'illinois': 'IL',
  'pennsylvania': 'PA',
  'ohio': 'OH',
  'georgia': 'GA',
  'north carolina': 'NC',
  'michigan': 'MI',
  'new jersey': 'NJ',
  'virginia': 'VA',
  'washington': 'WA',
  'arizona': 'AZ',
  'massachusetts': 'MA',
  'tennessee': 'TN',
  'indiana': 'IN',
  'missouri': 'MO',
  'maryland': 'MD',
  'wisconsin': 'WI',
  'colorado': 'CO',
  'minnesota': 'MN',
  'south carolina': 'SC',
  'alabama': 'AL',
  'louisiana': 'LA',
  'kentucky': 'KY',
  'oregon': 'OR',
  'oklahoma': 'OK',
  'connecticut': 'CT',
  'utah': 'UT',
  'iowa': 'IA',
  'nevada': 'NV',
  'arkansas': 'AR',
  'mississippi': 'MS',
  'kansas': 'KS',
  'new mexico': 'NM',
  'nebraska': 'NE',
  'west virginia': 'WV',
  'idaho': 'ID',
  'hawaii': 'HI',
  'new hampshire': 'NH',
  'maine': 'ME',
  'montana': 'MT',
  'rhode island': 'RI',
  'delaware': 'DE',
  'south dakota': 'SD',
  'north dakota': 'ND',
  'alaska': 'AK',
  'dc': 'DC',
  'district of columbia': 'DC',
  'vermont': 'VT',
  'wyoming': 'WY',
};

/**
 * Extract state from a text segment
 * Handles both abbreviations (TX, tx) and full names (Texas, texas)
 */
function extractState(text: string): string | undefined {
  if (!text) return undefined;
  
  const trimmed = text.trim();
  
  // Try 2-letter abbreviation first (case insensitive)
  const abbrevMatch = trimmed.match(/\b([A-Za-z]{2})\b/);
  if (abbrevMatch) {
    const upper = abbrevMatch[1].toUpperCase();
    // Verify it's a valid state code by checking if it's in our mappings or state defaults
    if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) {
      return upper;
    }
  }
  
  // Try full state name
  const lowerText = trimmed.toLowerCase();
  for (const [fullName, abbrev] of Object.entries(STATE_NAME_MAP)) {
    if (lowerText.includes(fullName)) {
      return abbrev;
    }
  }
  
  return undefined;
}

/**
 * Parse address string to extract city and state
 * Handles formats like:
 * - "456 Oak Street, Dallas, TX 75201"
 * - "San Francisco, CA"
 * - "Austin, Texas" (full state name)
 * - "123 Main St, Austin, TX 78701, USA" (trailing country)
 * - "denver, co 80202" (mixed case)
 */
export function parseLocation(address: string): LocationInfo {
  if (!address) {
    return { raw: "" };
  }

  // Split by commas and clean up
  const parts = address.split(",").map(p => p.trim());
  
  if (parts.length < 2) {
    return { raw: address };
  }
  
  // Try to find state in the parts (work backwards from end)
  let stateIndex = -1;
  let state: string | undefined;
  
  for (let i = parts.length - 1; i >= 0; i--) {
    state = extractState(parts[i]);
    if (state) {
      stateIndex = i;
      break;
    }
  }
  
  // If no state found, return empty
  if (!state || stateIndex === -1) {
    return { raw: address };
  }
  
  // City is the part before the state
  const cityIndex = stateIndex - 1;
  if (cityIndex < 0) {
    return { raw: address, state };
  }
  
  const city = parts[cityIndex];
  
  return {
    city: city,
    state: state,
    raw: address,
  };
}

/**
 * Get regional pricing multiplier based on location
 * Returns multiplier to apply to labor costs
 */
export function getRegionalMultiplier(location: LocationInfo): RegionalPricingResult {
  // No location info - use standard rate
  if (!location.city && !location.state) {
    return {
      multiplier: 1.00,
      label: "Standard rate",
      adjustmentPercent: 0,
      appliesTo: "labor only",
    };
  }

  // Try to match city + state
  if (location.city && location.state) {
    const match = REGIONAL_MULTIPLIERS.find(
      r => r.city.toLowerCase() === location.city!.toLowerCase() && 
           r.state === location.state
    );
    
    if (match) {
      return {
        multiplier: match.multiplier,
        label: match.label,
        adjustmentPercent: Math.round((match.multiplier - 1) * 100),
        appliesTo: "labor only",
      };
    }
  }

  // Try state-level default
  if (location.state && STATE_DEFAULTS[location.state]) {
    const stateMultiplier = STATE_DEFAULTS[location.state];
    return {
      multiplier: stateMultiplier,
      label: stateMultiplier > 1 ? `${location.state} premium` : `${location.state} rate`,
      adjustmentPercent: Math.round((stateMultiplier - 1) * 100),
      appliesTo: "labor only",
    };
  }

  // Unknown area - assume rural discount
  return {
    multiplier: RURAL_DISCOUNT,
    label: "Rural area discount",
    adjustmentPercent: -15,
    appliesTo: "labor only",
  };
}

/**
 * Apply regional pricing adjustment to labor cost
 */
export function applyRegionalPricing(
  baseLaborCost: number,
  location: LocationInfo
): { adjustedLaborCost: number; regionalInfo: RegionalPricingResult } {
  const regionalInfo = getRegionalMultiplier(location);
  const adjustedLaborCost = Math.round(baseLaborCost * regionalInfo.multiplier);
  
  return {
    adjustedLaborCost,
    regionalInfo,
  };
}

/**
 * Get regional adjustment for display purposes
 * Shows "+25%" or "-15%" etc.
 */
export function getRegionalAdjustmentDisplay(location: LocationInfo): string {
  const { adjustmentPercent, label } = getRegionalMultiplier(location);
  
  if (adjustmentPercent === 0) {
    return "";
  }
  
  const sign = adjustmentPercent > 0 ? "+" : "";
  return `${sign}${adjustmentPercent}% ${label}`;
}
