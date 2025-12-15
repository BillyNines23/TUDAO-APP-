/**
 * Pricing Estimator Service
 * Calculates labor and material costs to help customers understand fair pricing
 * Integrates with RAG learning system to improve estimates based on historical job data
 */

import { parseLocation, applyRegionalPricing, type LocationInfo, type RegionalPricingResult } from './regionalPricing';
import type { IStorage } from '../storage';

export interface PricingEstimate {
  hourlyRate: number; // in cents (base rate before regional adjustment)
  estimatedLaborCost: number; // in cents (includes regional adjustment)
  estimatedMaterialCost: number; // in cents
  estimatedTotalCost: number; // in cents (labor + materials + add-ons)
  regionalInfo?: RegionalPricingResult; // regional pricing details
}

interface EstimatePriceParams {
  vendorType: string;
  estimatedHours: number;
  materialsNeeded: string[];
  complexity: 'Low' | 'Medium' | 'High';
  serviceType: string;
  subcategory: string;
  totalAddOnFees?: number; // in cents
  locationAddress?: string; // customer address for regional pricing
  serviceDescription?: string; // service description for RAG learning
  storage?: IStorage; // storage instance for RAG queries
  overrideMaterialCost?: number; // override material cost from production standards (in cents)
}

/**
 * Market-based hourly rates by vendor type (in cents)
 * Based on 2024-2025 market research for home services
 */
const HOURLY_RATES: Record<string, number> = {
  // Licensed specialists (highest rates)
  'Licensed Electrician': 9500,          // $95/hr
  'Licensed Plumber': 8500,              // $85/hr
  'Licensed HVAC Technician': 10000,     // $100/hr
  'Licensed Electrical Specialist': 9500,
  'Licensed Plumbing Specialist': 8500,
  'Licensed HVAC Specialist': 10000,
  
  // General contractors (mid-range)
  'Plumbing Contractor': 7500,           // $75/hr
  'Electrical Contractor': 7500,
  'HVAC Contractor': 8500,
  'Landscaping Contractor': 6500,        // $65/hr
  
  // Handyman services (lower rates for simple repairs)
  'Handyman': 4000,                      // $40/hr
  'Handyman or Licensed Plumber': 4000,  // $40/hr (handyman rate for simple plumbing)
  'Handyman or Licensed Electrician': 4000, // $40/hr (handyman rate for simple electrical)
  
  // Default fallback
  'General Contractor': 7000,            // $70/hr
};

/**
 * Material cost estimation by service type and complexity
 * Returns estimated material cost in cents
 * 
 * NOTE: These are baseline estimates that improve over time through the RAG learning system.
 * As completed jobs are added to the training database, the AI learns actual material costs
 * and adjusts estimates accordingly. This provides a reasonable starting point while the
 * system builds knowledge from real-world data.
 */
const MATERIAL_COSTS: Record<string, {low: number; medium: number; high: number}> = {
  // Plumbing Services
  'Plumbing': {
    low: 2500,      // $25 - basic parts (O-rings, washers, tape)
    medium: 7500,   // $75 - cartridges, valves, pipes
    high: 20000,    // $200 - major fixtures, extensive piping
  },
  
  // Electrical Services
  'Electrical': {
    low: 1500,      // $15 - outlets, switches, wire nuts
    medium: 5000,   // $50 - fixtures, breakers, wiring
    high: 50000,    // $500 - panel upgrades, extensive rewiring
  },
  
  // HVAC Services
  'HVAC': {
    low: 5000,      // $50 - filters, thermostats, small parts
    medium: 15000,  // $150 - motors, capacitors, refrigerant
    high: 100000,   // $1000 - compressors, full unit replacement
  },
  
  // Landscaping & Yard Work
  'Landscaping': {
    low: 3000,      // $30 - fuel, trimmer line, small plants
    medium: 10000,  // $100 - fertilizer, mulch, shrubs
    high: 40000,    // $400 - sod, trees, major landscape materials
  },
  
  // Doors & Entry Systems
  'Door Repair': {
    low: 3000,      // $30 - hinges, screws, weatherstripping
    medium: 8000,   // $80 - lockset, door closer, threshold
    high: 15000,    // $150 - full hardware set, security upgrades
  },
  'Door Installation': {
    low: 15000,     // $150 - basic hollow core interior door
    medium: 40000,  // $400 - solid wood interior or standard exterior
    high: 120000,   // $1,200 - premium exterior, security door, custom
  },
  
  // Windows
  'Window Repair': {
    low: 2000,      // $20 - glazing, weatherstripping, caulk
    medium: 8000,   // $80 - window hardware, balance springs
    high: 25000,    // $250 - glass pane replacement, frame repair
  },
  'Window Installation': {
    low: 25000,     // $250 - small single-pane window
    medium: 60000,  // $600 - standard double-pane window
    high: 150000,   // $1,500 - large/specialty/energy-efficient windows
  },
  
  // Roofing
  'Roofing': {
    low: 8000,      // $80 - shingles for small patch, flashing
    medium: 30000,  // $300 - materials for modest roof section
    high: 200000,   // $2,000 - major roof section or premium materials
  },
  
  // Siding
  'Siding': {
    low: 10000,     // $100 - small repair section, trim
    medium: 40000,  // $400 - moderate siding replacement
    high: 150000,   // $1,500 - large area or premium materials
  },
  
  // Painting
  'Painting': {
    low: 4000,      // $40 - small room, basic paint
    medium: 12000,  // $120 - average room, quality paint, supplies
    high: 40000,    // $400 - large area, premium paint, prep materials
  },
  
  // Drywall
  'Drywall': {
    low: 3000,      // $30 - small patch, compound, tape
    medium: 15000,  // $150 - several sheets, compound, supplies
    high: 60000,    // $600 - large area, multiple rooms
  },
  
  // Flooring
  'Flooring': {
    low: 15000,     // $150 - small area, basic materials
    medium: 50000,  // $500 - average room, mid-grade materials
    high: 200000,   // $2,000 - large area, premium materials (hardwood, tile)
  },
  
  // Carpentry & Woodworking
  'Carpentry': {
    low: 5000,      // $50 - lumber, fasteners for small project
    medium: 20000,  // $200 - materials for shelving, trim, etc.
    high: 80000,    // $800 - custom cabinetry materials, extensive trim
  },
  
  // Appliance Services
  'Appliance Repair': {
    low: 2000,      // $20 - small parts, seals, filters
    medium: 8000,   // $80 - motors, pumps, control boards
    high: 30000,    // $300 - compressors, major components
  },
  'Appliance Installation': {
    low: 3000,      // $30 - hardware, hoses, connections
    medium: 10000,  // $100 - venting, electrical connections, mounting
    high: 40000,    // $400 - gas lines, complex venting, custom install
  },
  
  // Fencing & Decking
  'Fence': {
    low: 20000,     // $200 - small section repair, basic materials
    medium: 60000,  // $600 - moderate fence section, mid-grade materials
    high: 200000,   // $2,000 - large section, premium materials (vinyl, composite)
  },
  'Deck': {
    low: 30000,     // $300 - small deck repair, pressure-treated lumber
    medium: 80000,  // $800 - moderate deck section, quality lumber
    high: 250000,   // $2,500 - large deck, premium materials (composite, exotic wood)
  },
  
  // Masonry & Concrete
  'Masonry': {
    low: 8000,      // $80 - mortar, small brick/block repair
    medium: 30000,  // $300 - moderate materials for walls, steps
    high: 100000,   // $1,000 - extensive work, specialty materials
  },
  'Concrete': {
    low: 10000,     // $100 - concrete for small patch, sealer
    medium: 40000,  // $400 - moderate pour, rebar, forms
    high: 150000,   // $1,500 - large pour, decorative concrete, extensive prep
  },
  
  // Cleaning Services
  'Cleaning': {
    low: 3000,      // $30 - cleaning supplies, basic products
    medium: 8000,   // $80 - quality supplies, specialty products
    high: 20000,    // $200 - extensive supplies, specialty equipment
  },
  
  // Moving & Hauling
  'Moving': {
    low: 5000,      // $50 - packing supplies, boxes
    medium: 15000,  // $150 - comprehensive packing materials
    high: 40000,    // $400 - specialty packing, crating
  },
  
  // Insulation
  'Insulation': {
    low: 8000,      // $80 - small area, basic insulation
    medium: 30000,  // $300 - moderate area, quality insulation
    high: 100000,   // $1,000 - large area, premium/spray foam
  },
  
  // Gutter Services
  'Gutters': {
    low: 5000,      // $50 - cleaning supplies, small repairs
    medium: 20000,  // $200 - gutter sections, downspouts, fasteners
    high: 80000,    // $800 - complete gutter system, guards, premium materials
  },
};

/**
 * Get hourly rate for a vendor type
 */
function getHourlyRate(vendorType: string): number {
  return HOURLY_RATES[vendorType] || HOURLY_RATES['General Contractor'];
}

/**
 * Estimate material costs based on service type and complexity
 * 
 * Uses RAG learning system to learn from historical job data.
 * Queries similar past jobs and uses their actual material costs to improve estimates.
 * Falls back to baseline costs for new service types with no historical data.
 */
async function estimateMaterialCost(
  serviceType: string,
  complexity: 'Low' | 'Medium' | 'High',
  materialsNeeded: string[],
  serviceDescription: string,
  storage: IStorage
): Promise<number> {
  // Try to match service type (case-insensitive, partial matching)
  let costs = MATERIAL_COSTS[serviceType];
  
  // If no exact match, try partial match (e.g., "Door" matches "Door Installation")
  if (!costs) {
    const serviceTypeLower = serviceType.toLowerCase();
    const matchingKey = Object.keys(MATERIAL_COSTS).find(key => 
      key.toLowerCase().includes(serviceTypeLower) || 
      serviceTypeLower.includes(key.toLowerCase())
    );
    if (matchingKey) {
      costs = MATERIAL_COSTS[matchingKey];
    }
  }
  
  // Fallback for unknown service types (more realistic than old $20-$100)
  // These will be replaced by RAG-learned costs as historical data accumulates
  if (!costs) {
    costs = { low: 8000, medium: 25000, high: 80000 }; // $80, $250, $800
  }
  
  // Select base cost by complexity
  let baseCost = costs.medium; // default
  if (complexity === 'Low') baseCost = costs.low;
  if (complexity === 'High') baseCost = costs.high;
  
  // RAG LEARNING: Query similar historical jobs to learn actual material costs
  // Only if storage is available (backwards compatibility with routes that don't have storage)
  if (storage) {
    try {
      const similarJobs = await storage.findSimilarJobs(serviceType, serviceDescription, 5);
      
      if (similarJobs.length > 0) {
        // Extract actual material costs from completed jobs
        // Parse the originalScope JSON to get material costs when available
        const materialCosts: number[] = [];
        
        for (const job of similarJobs) {
          if (job.originalScope && typeof job.originalScope === 'object') {
            const scope = job.originalScope as any;
            if (scope.estimatedMaterialCost && typeof scope.estimatedMaterialCost === 'number') {
              const cost = scope.estimatedMaterialCost;
              
              // DATA VALIDATION: Only include reasonable costs
              // Filter out invalid data: negative, zero, or wildly unrealistic values
              // Min: $5 (500 cents), Max: $50,000 (5,000,000 cents) for materials
              if (cost > 500 && cost < 5000000) {
                materialCosts.push(cost);
              }
            }
          }
        }
        
        // If we have historical material cost data, use it to refine the estimate
        if (materialCosts.length > 0) {
          // Use median instead of mean to reduce impact of outliers
          const sortedCosts = materialCosts.sort((a, b) => a - b);
          const median = sortedCosts.length % 2 === 0
            ? (sortedCosts[sortedCosts.length / 2 - 1] + sortedCosts[sortedCosts.length / 2]) / 2
            : sortedCosts[Math.floor(sortedCosts.length / 2)];
          
          console.log(`RAG Learning: Found ${materialCosts.length} similar jobs with valid material costs. Median: $${median / 100}`);
          
          // ADAPTIVE BLEND: More historical data = more confidence
          // 1-2 jobs: 30% historical, 70% baseline (low confidence)
          // 3-4 jobs: 50% historical, 50% baseline (medium confidence)
          // 5+ jobs: 70% historical, 30% baseline (high confidence)
          let historicalWeight = 0.3; // default for 1-2 jobs
          if (materialCosts.length >= 5) {
            historicalWeight = 0.7; // high confidence
          } else if (materialCosts.length >= 3) {
            historicalWeight = 0.5; // medium confidence
          }
          
          const baselineWeight = 1 - historicalWeight;
          baseCost = Math.round(median * historicalWeight + baseCost * baselineWeight);
          
          console.log(`RAG blend: ${(historicalWeight * 100).toFixed(0)}% historical (${materialCosts.length} jobs), ${(baselineWeight * 100).toFixed(0)}% baseline`);
        }
      }
    } catch (error) {
      console.error("Error querying similar jobs for material cost learning:", error);
      // Fall through to use baseline costs
    }
  }
  
  // Adjust based on number of materials (more materials = higher cost)
  const materialCount = materialsNeeded.length;
  if (materialCount <= 1) {
    baseCost *= 0.7; // Single material = simpler job
  } else if (materialCount >= 4) {
    baseCost *= 1.3; // Many materials = more complex
  }
  
  return Math.round(baseCost);
}

/**
 * Calculate complete pricing estimate with regional adjustments and RAG learning
 */
export async function estimatePrice(params: EstimatePriceParams): Promise<PricingEstimate> {
  const {
    vendorType,
    estimatedHours,
    materialsNeeded,
    complexity,
    serviceType,
    totalAddOnFees = 0,
    locationAddress,
    serviceDescription = '',
    storage,
    overrideMaterialCost
  } = params;
  
  // Calculate base hourly rate (before regional adjustment)
  const hourlyRate = getHourlyRate(vendorType);
  
  // Calculate base labor cost (hours × hourly rate)
  const baseLaborCost = Math.round(estimatedHours * hourlyRate);
  
  // Apply regional pricing adjustment to labor cost
  let estimatedLaborCost = baseLaborCost;
  let regionalInfo: RegionalPricingResult | undefined;
  let state: string | undefined;
  
  if (locationAddress) {
    const location = parseLocation(locationAddress);
    state = location.state;
    const regionalResult = applyRegionalPricing(baseLaborCost, location);
    estimatedLaborCost = regionalResult.adjustedLaborCost;
    regionalInfo = regionalResult.regionalInfo;
  }
  
  // Calculate material cost: use production standard override if available, otherwise RAG/baseline
  let estimatedMaterialCost: number;
  if (overrideMaterialCost !== undefined) {
    // Production standards provide the most accurate material costs
    estimatedMaterialCost = overrideMaterialCost;
    console.log(`Using production standard material cost: $${estimatedMaterialCost/100}`);
  } else if (storage && serviceDescription) {
    // Try RAG learning from historical jobs
    estimatedMaterialCost = await estimateMaterialCost(
      serviceType,
      complexity,
      materialsNeeded,
      serviceDescription,
      storage
    );
  } else {
    // Fallback to baseline calculation without RAG learning
    let costs = MATERIAL_COSTS[serviceType] || { low: 8000, medium: 25000, high: 80000 };
    let baseCost = costs.medium;
    if (complexity === 'Low') baseCost = costs.low;
    if (complexity === 'High') baseCost = costs.high;
    
    const materialCount = materialsNeeded.length;
    if (materialCount <= 1) baseCost *= 0.7;
    else if (materialCount >= 4) baseCost *= 1.3;
    
    estimatedMaterialCost = Math.round(baseCost);
  }
  
  // Calculate total (labor + materials + add-on fees)
  // Note: Vendors are responsible for including any applicable taxes in their final quotes
  const estimatedTotalCost = estimatedLaborCost + estimatedMaterialCost + totalAddOnFees;
  
  return {
    hourlyRate,
    estimatedLaborCost,
    estimatedMaterialCost,
    estimatedTotalCost,
    regionalInfo
  };
}

/**
 * Get pricing context for display (helpful explanations)
 */
export function getPricingContext(vendorType: string, complexity: string): string {
  const rate = getHourlyRate(vendorType);
  const rateDisplay = `$${(rate / 100).toFixed(0)}`;
  
  let context = `Estimated ${vendorType} rate: ${rateDisplay}/hr`;
  
  if (complexity === 'High') {
    context += ' (complex job requiring specialized expertise)';
  } else if (complexity === 'Low') {
    context += ' (straightforward repair)';
  }
  
  return context;
}
