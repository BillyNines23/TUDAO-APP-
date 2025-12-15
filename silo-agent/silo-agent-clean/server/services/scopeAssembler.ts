/**
 * Scope Assembler Service
 * Converts answers into structured scope JSON with estimates
 * Integrated with RAG learning system for improved material cost estimates
 * Uses GPT-4o for narrative scope generation
 */

import { estimatePrice } from './pricingEstimator';
import type { IStorage } from '../storage';
import type { RegionalPricingResult } from './regionalPricing';

export interface NarrativeScope {
  existingConditions: string;
  projectDescription: string;
  scopeOfWork: string[]; // Array of detailed step-by-step procedures
}

export interface ScopeOutput {
  scope: {
    category: string;
    subcategory: string;
    details: Record<string, any>;
    estimatedHours: number; // actual hours (1.5, 2.0, etc.)
    materialsNeeded: string[];
    complexity: 'Low' | 'Medium' | 'High';
    vendorType: string;
    addOnFees?: Array<{name: string; amount: number}>; // amounts in cents
    totalAddOnFees?: number; // total in cents
    hourlyRate?: number; // in cents (base rate)
    estimatedLaborCost?: number; // in cents (includes regional adjustment)
    estimatedMaterialCost?: number; // in cents
    estimatedTotalCost?: number; // in cents (labor + materials + add-ons)
    regionalInfo?: RegionalPricingResult; // regional pricing details
    materialCalculation?: string; // For showing calculation details (e.g., "3.09 cu yds × $65 per yard installed")
    narrative?: NarrativeScope; // Dispute-prevention narrative sections
  };
  summary: string;
}

interface AssembleScopeParams {
  serviceType: string;
  subcategory: string;
  answers: Record<string, any>;
  serviceDescription?: string; // For RAG learning
  storage?: IStorage; // For RAG queries
}

/**
 * Assemble a scope from answers with RAG-enhanced pricing
 */
export async function assembleScope(params: AssembleScopeParams): Promise<ScopeOutput> {
  const { serviceType, subcategory, answers, serviceDescription, storage: storageParam } = params;
  
  console.log(`[assembleScope] Called with serviceType: ${serviceType}, subcategory: ${subcategory}`);
  
  // DETECT SERVICE TYPE (needed for both AWS Claude and local processing paths)
  // Use SUBCATEGORY for precision - only match actual recurring service work
  const serviceSubcategories = [
    'lawn mowing',
    'lawn care',
    'lawn maintenance',
    'general landscaping maintenance',
    'snow removal',
    'snow plowing',
    'residential cleaning',
    'commercial cleaning',
    'house cleaning',
    'office cleaning',
    'gutter cleaning',
    'window washing',
    'pressure washing',
    'pool maintenance',
    'pool cleaning',
    'hvac maintenance',
    'hvac service call',
    'plumbing service call',
    'electrical service call',
    // Plumbing repair service calls (flat-rate, not installation)
    'faucet repair',
    'leak detection',
    'drain cleaning',
    'toilet repair',
    // HVAC repair service calls
    'ac repair',
    'heating repair',
    // Electrical repair service calls
    'outlet repair',
    'switch replacement',
    'light fixture'
  ];
  
  const isServiceWork = serviceSubcategories.some(s => 
    subcategory.toLowerCase().includes(s) || 
    serviceDescription?.toLowerCase().includes(s)
  );
  
  // Differentiate between recurring service work (lawn mowing) and one-time service calls (plumbing repair)
  const recurringServiceSubcategories = [
    'lawn mowing', 'lawn care', 'lawn maintenance', 'snow removal', 'snow plowing',
    'residential cleaning', 'commercial cleaning', 'house cleaning', 'office cleaning',
    'pool maintenance', 'pool cleaning', 'general landscaping maintenance'
  ];
  
  const isRecurringService = recurringServiceSubcategories.some(s => 
    subcategory.toLowerCase().includes(s) || 
    serviceDescription?.toLowerCase().includes(s)
  );
  
  const isOneTimeServiceCall = isServiceWork && !isRecurringService;

  // Extract meaningful details from answers using local logic
  const details = extractDetails(answers);
  console.log(`[assembleScope] Extracted details:`, Object.keys(details));
  
  // DECK BUILDING SPECIAL HANDLING: Extract deck dimensions FIRST before generic production standards
  // Use deck dimension extraction helper (defined later in file)
  const earlyDeckExtraction = await extractDeckDimensionsEarly(serviceType, subcategory, answers, details);
  
  // Try to use production standards for estimation
  let productionStandardEstimate = await tryProductionStandardEstimation(serviceType, subcategory, details);
  console.log(`[assembleScope] Production standard estimate:`, productionStandardEstimate);
  
  // Use calculation from production standards if available
  let materialCalculation = productionStandardEstimate?.materialCalculation;
  
  // SPECIAL MULCH CALCULATION: Convert square footage to cubic yards (fallback if no production standard)
  if (!productionStandardEstimate && serviceType === 'Landscaping' && (subcategory?.toLowerCase().includes('mulch') || serviceDescription?.toLowerCase().includes('mulch'))) {
    const quantityInfo = extractQuantity(details);
    if (quantityInfo && quantityInfo.unit === 'square_feet') {
      // 1 cubic yard covers 162 sq ft at 2-inch depth (industry standard)
      const squareFeet = quantityInfo.quantity;
      const cubicYards = squareFeet / 162;
      const mulchCost = Math.round(cubicYards * 6500); // $65/yard in cents
      
      console.log(`[Mulch Calculation] ${squareFeet} sq ft ÷ 162 = ${cubicYards.toFixed(2)} cu yd × $65 = $${mulchCost/100}`);
      
      // Store calculation for display to customer
      materialCalculation = `${cubicYards.toFixed(2)} cu yds × $65 per yard installed`;
      
      productionStandardEstimate = {
        estimatedHours: 0, // All-in pricing includes labor
        estimatedMaterialCost: mulchCost
      };
      
      // Add to details for summary
      details.calculated_cubic_yards = cubicYards.toFixed(2);
      details.mulch_coverage = `${squareFeet} sq ft at 2" depth`;
    }
  }

  // DECK BUILDING MATERIAL CALCULATION: Use RAG-retrieved formulas to calculate line items
  let deckLineItems: Array<{category: string; item: string; quantity: number; unit: string; unitCost: number; total: number}> = [];
  // EXACT match against canonical deck subcategories (no substring heuristics)
  const DECK_SUBCATEGORIES = new Set(['Build deck', 'Deck Construction', 'Deck Installation', 'Deck Repair']);
  const isDeckBuilding = 
    serviceType === 'Deck Building' || 
    (serviceType === 'Carpentry' && subcategory && DECK_SUBCATEGORIES.has(subcategory));
  
  console.log(`[Deck Detection] serviceType='${serviceType}', subcategory='${subcategory}', isDeck=${isDeckBuilding}`);
  
  if (isDeckBuilding && storageParam) {
    try {
      // Retrieve deck building training data with materialCalculations
      // CRITICAL FIX: Use canonical serviceType (Carpentry) instead of hardcoded 'Deck Building'
      console.log(`[Deck Calculation] Deck project detected: ${serviceType} / ${subcategory}`);
      console.log(`[Deck Calculation] Querying for training data with serviceType: ${serviceType}...`);
      const deckJobs = await storageParam.findSimilarJobs(serviceType, serviceDescription || 'deck', 10);
      console.log(`[Deck Calculation] Found ${deckJobs.length} similar jobs for ${serviceType}`);
      console.log(`[Deck Calculation] Training examples: ${deckJobs.filter(j => j.isTrainingExample === 1).length}`);
      console.log(`[Deck Calculation] With materialCalculations: ${deckJobs.filter(j => j.materialCalculations).length}`);
      
      const deckTrainingData = deckJobs.find(job => job.isTrainingExample === 1 && job.materialCalculations);
      
      if (deckTrainingData && deckTrainingData.materialCalculations) {
        console.log('[Deck Calculation] ✅ Found deck training data with material calculations');
        
        // Extract semantic keys from answers, details, AND serviceDescription
        const semanticContext = extractDeckSemanticKeys(answers, details, serviceDescription);
        console.log('[Deck Calculation] Semantic context:', semanticContext);
        
        // Evaluate formulas and calculate line items
        deckLineItems = calculateDeckMaterials(deckTrainingData.materialCalculations, semanticContext);
        console.log(`[Deck Calculation] Calculated ${deckLineItems.length} line items`);
        
        // Sum up total material cost
        const totalMaterialCost = Math.round(deckLineItems.reduce((sum, item) => sum + item.total, 0) * 100); // Convert to cents
        console.log(`[Deck Calculation] Total material cost: $${totalMaterialCost / 100}`);
        
        // Override production standard estimate with calculated values
        productionStandardEstimate = {
          estimatedHours: semanticContext.deck_sqft ? Math.round(semanticContext.deck_sqft / 12.5) : 32, // ~12.5 sq ft per hour
          estimatedMaterialCost: totalMaterialCost
        };
        
        // Store line items in details for display
        details.deck_line_items = deckLineItems;
        details.deck_total_materials = `$${(totalMaterialCost / 100).toFixed(2)}`;
      }
    } catch (error) {
      console.error('[Deck Calculation] Error calculating deck materials:', error);
      // Continue with fallback estimation if calculation fails
    }
  }
  
  // Estimate hours: use production standard if available (including 0 hours for all-inclusive pricing), otherwise fallback
  const estimatedHours = productionStandardEstimate?.estimatedHours !== undefined 
    ? productionStandardEstimate.estimatedHours 
    : estimateHours(serviceType, subcategory, details);
  
  // Determine materials needed
  const materialsNeeded = determineMaterials(serviceType, subcategory, details);
  
  // Assess complexity
  const complexity = assessComplexity(serviceType, subcategory, details);
  
  // Recommend vendor type
  const vendorType = recommendVendorType(serviceType, subcategory, complexity);
  
  // Check for add-on fees (premium features)
  const addOnFees: Array<{name: string; amount: number}> = [];
  let totalAddOnFees = 0;
  
  // Check if customer selected premium satellite measurement (check once, not for every answer)
  const hasPremiumMeasurement = Object.values(answers).some(value =>
    typeof value === 'string' && value.includes('Auto-measure from address')
  );
  
  if (hasPremiumMeasurement) {
    addOnFees.push({ name: "Satellite Property Measurement", amount: 199 }); // $1.99 in cents
    totalAddOnFees += 199;
  }
  
  // Add mobilization/trip fee for landscaping services
  if (serviceType === 'Landscaping') {
    addOnFees.push({ name: "Mobilization/Trip Fee", amount: 5000 }); // $50.00 in cents
    totalAddOnFees += 5000;
  }
  
  // PRICING: Different logic for one-time service calls, recurring services, and installations
  let pricing;
  
  // ONE-TIME SERVICE CALL: Flat-rate diagnostic pricing ($100-250 total)
  if (isOneTimeServiceCall && complexity === 'Low') {
    console.log(`[Diagnostic Service Call] Low-complexity one-time service call detected: ${serviceType}/${subcategory}`);
    
    // Service call fee: $150 (covers diagnostic and first hour of labor)
    const flatRateLaborCost = 15000; // $150 diagnostic service call fee (in cents)
    
    // Materials: use production standard if available, otherwise $0 (diagnostic only, parts charged separately if needed)
    const materialCost = productionStandardEstimate?.estimatedMaterialCost ?? 0;
    
    const totalCost = flatRateLaborCost + materialCost;
    
    if (materialCost > 0) {
      console.log(`✅ [Diagnostic Service Call] $${flatRateLaborCost/100} service call (diagnostic + first hour) + $${materialCost/100} parts = $${totalCost/100} total`);
    } else {
      console.log(`✅ [Diagnostic Service Call] $${flatRateLaborCost/100} service call (diagnostic + first hour, parts additional if needed)`);
    }
    
    pricing = {
      hourlyRate: 0, // Not applicable for flat-rate diagnostic
      estimatedLaborCost: flatRateLaborCost,
      estimatedMaterialCost: materialCost,
      estimatedTotalCost: totalCost
    };
  }
  // RECURRING SERVICE: Seasonal contract pricing ($1,500-3,000 total)
  else if (isRecurringService) {
    console.log(`[Recurring Service Pricing] Seasonal contract detected: ${serviceType}/${subcategory}`);
    
    // Extract season/frequency info from answers
    const serviceMonths = details.serviceMonths || details.answer_effd1bb5 || [];
    const monthCount = Array.isArray(serviceMonths) ? serviceMonths.length : 9; // Default 9 months (March-Nov)
    
    // Calculate visits based on frequency (weekly = 4x/month, bi-weekly = 2x/month)
    const visitsPerMonth = 4; // Assume weekly for lawn maintenance
    const totalVisits = monthCount * visitsPerMonth;
    
    // Per-visit rate based on lawn size and complexity
    let perVisitRate = 50; // Default $50/visit (in cents: 5000)
    const lawnSize = details.lawnSize || details.answer_1e3d1a40 || '';
    if (lawnSize.toLowerCase().includes('large')) {
      perVisitRate = 65; // $65/visit for large lawns
    } else if (lawnSize.toLowerCase().includes('small')) {
      perVisitRate = 35; // $35/visit for small lawns
    }
    
    // Check if full service (trimming, edging, cleanup) - adds $15/visit
    const serviceLevelStr = typeof details.serviceLevel === 'string' ? details.serviceLevel : '';
    const answer279Str = typeof details.answer_279d6090 === 'string' ? details.answer_279d6090 : '';
    const isFullService = serviceLevelStr.toLowerCase().includes('full') || 
                          answer279Str.toLowerCase().includes('yes');
    if (isFullService) {
      perVisitRate += 15;
    }
    
    const totalLaborCost = totalVisits * perVisitRate * 100; // Convert dollars to cents
    const totalMaterialCost = monthCount * 500; // $5/month for fuel, bags, trimmer line (in cents)
    const totalCost = totalLaborCost + totalMaterialCost;
    
    console.log(`✅ [Recurring Service Pricing] Seasonal contract: ${totalVisits} visits × $${perVisitRate}/visit = $${totalLaborCost/100} labor, Materials $${totalMaterialCost/100}, Total $${totalCost/100}`);
    
    pricing = {
      hourlyRate: 0, // Not applicable for per-visit pricing
      estimatedLaborCost: totalLaborCost,
      estimatedMaterialCost: totalMaterialCost,
      estimatedTotalCost: totalCost
    };
  }
  // INSTALLATION/BUILD WORK: Hourly pricing (varies widely by project)
  else {
    // Use hourly pricing for installations, renovations, and medium/high complexity work
    pricing = await estimatePrice({
      vendorType,
      estimatedHours,
      materialsNeeded,
      complexity,
      serviceType,
      subcategory,
      totalAddOnFees,
      locationAddress: details.propertyAddress, // Pass address for regional pricing
      serviceDescription, // Pass for RAG learning
      storage: storageParam, // Pass storage for RAG queries
      overrideMaterialCost: productionStandardEstimate?.estimatedMaterialCost // Use production standard cost if available
    });
  }
  
  // Generate human-readable summary
  const summary = generateSummary({
    serviceType,
    subcategory,
    details,
    estimatedHours,
    materialsNeeded,
    complexity,
    vendorType,
    addOnFees,
    pricing
  });
  
  // Generate AI-powered narrative scope for dispute prevention
  const narrative = await generateNarrativeScope({
    serviceType,
    subcategory,
    serviceDescription,
    answers,
    details,
    estimatedHours,
    materialsNeeded,
    complexity,
    vendorType,
    estimatedTotalCost: pricing.estimatedTotalCost,
    deckLineItems: details.deck_line_items
  });
  
  return {
    scope: {
      category: serviceType,
      subcategory,
      details,
      estimatedHours,
      materialsNeeded,
      complexity,
      vendorType,
      addOnFees: addOnFees.length > 0 ? addOnFees : undefined,
      totalAddOnFees: totalAddOnFees > 0 ? totalAddOnFees : undefined,
      hourlyRate: pricing.hourlyRate,
      estimatedLaborCost: pricing.estimatedLaborCost,
      estimatedMaterialCost: pricing.estimatedMaterialCost,
      estimatedTotalCost: pricing.estimatedTotalCost,
      regionalInfo: pricing.regionalInfo,
      materialCalculation, // Show calculation for mulch and other all-inclusive items
      narrative: narrative || undefined // Include narrative sections if generated successfully
    },
    summary
  };
}

/**
 * Extract quantity and unit from answers
 */
function extractQuantity(details: Record<string, any>): { quantity: number; unit: string } | null {
  // Look for patterns like "200 feet", "500 sq ft", "50 cubic feet", with support for decimals
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      
      // Cubic feet patterns (check before "feet" to avoid false matches)
      const cubicFeetMatch = lowerValue.match(/(\d+(?:\.\d+)?)\s*(cubic\s*feet|cu\s*ft|cf)/);
      if (cubicFeetMatch) {
        return { quantity: parseFloat(cubicFeetMatch[1]), unit: 'cubic_feet' };
      }
      
      // Cubic meters patterns
      const cubicMetersMatch = lowerValue.match(/(\d+(?:\.\d+)?)\s*(cubic\s*meters?|cubic\s*metres?|cu\s*m|m3|m³)/);
      if (cubicMetersMatch) {
        // Convert cubic meters to cubic feet (1 m³ = 35.3 ft³)
        const cubicMeters = parseFloat(cubicMetersMatch[1]);
        return { quantity: cubicMeters * 35.3, unit: 'cubic_feet' };
      }
      
      // Cubic yards
      const cubicYardsMatch = lowerValue.match(/(\d+(?:\.\d+)?)\s*(cubic\s*yards?|cu\s*yd|yd3|yd³)/);
      if (cubicYardsMatch) {
        return { quantity: parseFloat(cubicYardsMatch[1]), unit: 'cubic_yard' };
      }
      
      // Roofing squares pattern (1 square = 100 sq ft) - check before square feet
      const squaresMatch = lowerValue.match(/(\d+(?:\.\d+)?)\s*(roofing\s*)?squares?(?!\s*(?:feet|ft|meters?|metres?|yards?))/);
      if (squaresMatch) {
        return { quantity: parseFloat(squaresMatch[1]), unit: 'squares' };
      }
      
      // Square meters (convert to square feet)
      const squareMetersMatch = lowerValue.match(/(\d+(?:\.\d+)?)\s*(square\s*meters?|square\s*metres?|sq\s*m|m2|m²)/);
      if (squareMetersMatch) {
        // Convert square meters to square feet (1 m² = 10.764 ft²)
        const squareMeters = parseFloat(squareMetersMatch[1]);
        return { quantity: squareMeters * 10.764, unit: 'square_feet' };
      }
      
      // Lawn size categories (extract midpoint from range)
      const lawnSizeMatch = lowerValue.match(/small.*?(\d+[,\d]*)\s*-\s*(\d+[,\d]*)\s*sq|medium.*?(\d+[,\d]*)\s*-\s*(\d+[,\d]*)\s*sq|large.*?(\d+[,\d]*)\s*-\s*(\d+[,\d]*)\s*sq/);
      if (lawnSizeMatch) {
        const start = parseFloat((lawnSizeMatch[1] || lawnSizeMatch[3] || lawnSizeMatch[5]).replace(/,/g, ''));
        const end = parseFloat((lawnSizeMatch[2] || lawnSizeMatch[4] || lawnSizeMatch[6]).replace(/,/g, ''));
        const midpoint = (start + end) / 2;
        return { quantity: midpoint, unit: 'square_feet' };
      }
      
      // Square feet patterns (with comma support)
      const squareFeetMatch = lowerValue.match(/([\d,]+(?:\.\d+)?)\s*(square\s*feet|sq\s*ft|sf)/);
      if (squareFeetMatch) {
        return { quantity: parseFloat(squareFeetMatch[1].replace(/,/g, '')), unit: 'square_feet' };
      }
      
      // Square yards
      const squareYardsMatch = lowerValue.match(/(\d+(?:\.\d+)?)\s*(square\s*yards?|sq\s*yd)/);
      if (squareYardsMatch) {
        return { quantity: parseFloat(squareYardsMatch[1]), unit: 'square_yard' };
      }
      
      // Linear feet patterns (check after square/cubic to avoid conflicts)
      const linearFeetMatch = lowerValue.match(/(\d+(?:\.\d+)?)\s*(linear\s*feet|feet|ft|linear\s*ft|')/);
      if (linearFeetMatch) {
        return { quantity: parseFloat(linearFeetMatch[1]), unit: 'linear_feet' };
      }
      
      // Just a number followed by "each" or count
      const eachMatch = lowerValue.match(/(\d+(?:\.\d+)?)\s*(each|units?|items?)/);
      if (eachMatch) {
        return { quantity: parseFloat(eachMatch[1]), unit: 'each' };
      }
    }
  }
  
  return null;
}

/**
 * Try to estimate using production standards if available
 */
async function tryProductionStandardEstimation(
  serviceType: string,
  subcategory: string,
  details: Record<string, any>
): Promise<{ estimatedHours: number; estimatedMaterialCost: number; materialCalculation?: string } | null> {
  try {
    console.log(`[Production Standards] Trying estimation for: ${serviceType} / ${subcategory}`);
    
    // Import storage dynamically to avoid circular dependencies
    const { storage } = await import('../storage');
    
    // Get production standards for this service type/subcategory
    const standards = await storage.getProductionStandardsByService(serviceType, subcategory);
    console.log(`[Production Standards] Found ${standards.length} standards for ${serviceType}/${subcategory}`);
    
    if (standards.length === 0) {
      return null;
    }
    
    // Extract quantity from answers
    const quantityInfo = extractQuantity(details);
    console.log(`[Production Standards] Extracted quantity:`, quantityInfo);
    
    if (!quantityInfo) {
      return null; // Can't use production standards without a quantity
    }
    
    // Find matching production standard by unit of measure
    const matchingStandard = standards.find(std => std.unitOfMeasure === quantityInfo.unit);
    console.log(`[Production Standards] Matching standard:`, matchingStandard ? matchingStandard.itemDescription : 'NONE');
    
    if (!matchingStandard) {
      return null; // No matching unit standard
    }
    
    // Calculate estimated hours
    const estimatedHours = matchingStandard.laborHoursPerUnit
      ? matchingStandard.laborHoursPerUnit * quantityInfo.quantity
      : 0;
    
    // Calculate estimated material cost (in cents)
    const estimatedMaterialCost = matchingStandard.materialCostPerUnit
      ? matchingStandard.materialCostPerUnit * quantityInfo.quantity
      : 0;
    
    console.log(`Production standard match found: ${quantityInfo.quantity} ${quantityInfo.unit} = ${estimatedHours} hours, $${estimatedMaterialCost/100} materials`);
    
    // Generate customer-visible calculation string
    const unitPriceDisplay = ((matchingStandard.materialCostPerUnit || 0) / 100).toFixed(2);
    const unitName = getUnitDisplayName(quantityInfo.unit);
    const materialCalculation = matchingStandard.materialCostPerUnit
      ? `${quantityInfo.quantity.toFixed(2)} ${unitName} × $${unitPriceDisplay} per ${unitName}`
      : undefined;
    
    return {
      estimatedHours: Math.round(estimatedHours * 100) / 100, // Round to 2 decimals
      estimatedMaterialCost,
      materialCalculation
    };
  } catch (error) {
    console.error('Error using production standards:', error);
    return null;
  }
}

/**
 * Convert unit of measure to customer-friendly display name
 * Handles both singular and plural forms from extractQuantity() and production standards
 */
function getUnitDisplayName(unit: string): string {
  const unitMap: Record<string, string> = {
    // Linear measurements
    'linear_feet': 'ft',
    'linear_foot': 'ft',
    'feet': 'ft',
    'foot': 'ft',
    
    // Square measurements
    'square_feet': 'sq ft',
    'square_foot': 'sq ft',
    'square_yard': 'sq yd',
    'square_yards': 'sq yd',
    
    // Cubic measurements
    'cubic_yard': 'cu yd',
    'cubic_yards': 'cu yds',
    'cubic_feet': 'cu ft',
    'cubic_foot': 'cu ft',
    
    // Roofing
    'squares': 'squares',
    'square': 'square',
    
    // Time
    'hours': 'hrs',
    'hour': 'hr',
    
    // Count
    'each': 'each',
    'unit': 'unit',
    'units': 'units',
    'item': 'item',
    'items': 'items'
  };
  return unitMap[unit] || unit;
}

/**
 * Extract meaningful details from raw answers
 */
function extractDetails(answers: Record<string, any>): Record<string, any> {
  const details: Record<string, any> = {};
  
  // FIRST: Preserve all raw answer values for quantity extraction
  for (const [key, value] of Object.entries(answers)) {
    // Handle both string answers and object answers {answer: "...", question: "..."}
    const answerValue = typeof value === 'object' && value?.answer ? value.answer : value;
    details[key] = answerValue;
  }
  
  // SECOND: Extract structured fields from values
  for (const [key, value] of Object.entries(answers)) {
    // Extract the actual answer string from nested objects
    const answerValue = typeof value === 'object' && value?.answer ? value.answer : value;
    
    // Try to extract meaningful field names from the value
    if (typeof answerValue === 'string') {
      const lowerValue = answerValue.toLowerCase();
      
      // Look for property address (contains street address with numbers and state abbreviation)
      // Also match city, state format without street number (e.g., "San Francisco, CA" or "Austin, tx")
      if (/\d+.*,.*[A-Za-z]{2}\s*\d{5}/.test(answerValue) || 
          answerValue.match(/\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)/i) ||
          /,\s*[A-Za-z]{2}(\s+\d{5})?$/.test(answerValue)) {
        details.propertyAddress = answerValue;
      }
      
      // HVAC-specific details
      // System type
      if (lowerValue.includes('central') || lowerValue.includes('forced air')) {
        details.hvacSystemType = 'Central forced air';
      } else if (lowerValue.includes('heat pump')) {
        details.hvacSystemType = 'Heat pump';
      } else if (lowerValue.includes('mini split') || lowerValue.includes('ductless')) {
        details.hvacSystemType = 'Ductless mini-split';
      } else if (lowerValue.includes('window') || lowerValue.includes('wall unit')) {
        details.hvacSystemType = 'Window/wall unit';
      }
      
      // System status
      if (lowerValue.includes('completely off') || lowerValue.includes('not running')) {
        details.systemStatus = 'not running';
      } else if (lowerValue.includes('running')) {
        details.systemStatus = 'running';
      }
      
      // Temperature issue
      if (lowerValue.includes('not cooling') || lowerValue.includes('warm air')) {
        details.temperatureIssue = 'not cooling';
      } else if (lowerValue.includes('not heating') || lowerValue.includes('no heat') || lowerValue.includes('cold air') || lowerValue.includes('completely cold')) {
        details.temperatureIssue = 'no heat';
      } else if (lowerValue.includes('not enough') || lowerValue.includes('insufficient')) {
        details.temperatureIssue = 'insufficient output';
      } else if (lowerValue.includes('intermittent')) {
        details.temperatureIssue = 'intermittent';
      }
      
      // Ignition status
      if (lowerValue.includes('can hear') || lowerValue.includes('see ignition') || lowerValue.includes('yes')) {
        if (Object.keys(answers).some(k => answers[k]?.toString().toLowerCase().includes('ignit'))) {
          details.furnaceIgniting = 'yes';
        }
      } else if (lowerValue.includes('nothing happens') || lowerValue.includes('no,')) {
        if (Object.keys(answers).some(k => answers[k]?.toString().toLowerCase().includes('ignit'))) {
          details.furnaceIgniting = 'no';
        }
      }
      
      // Blower status
      if (lowerValue.includes('air is blowing') || lowerValue.includes('yes')) {
        if (Object.keys(answers).some(k => answers[k]?.toString().toLowerCase().includes('blower'))) {
          details.blowerRunning = 'yes';
        }
      } else if (lowerValue.includes('no air')) {
        if (Object.keys(answers).some(k => answers[k]?.toString().toLowerCase().includes('blower'))) {
          details.blowerRunning = 'no';
        }
      }
      
      // Fuel type
      if (lowerValue.includes('natural gas')) {
        details.fuelType = 'Natural gas';
      } else if (lowerValue.includes('propane')) {
        details.fuelType = 'Propane';
      } else if (lowerValue.includes('electric')) {
        details.fuelType = 'Electric';
      } else if (lowerValue.includes('oil')) {
        details.fuelType = 'Oil';
      }
      
      // System age
      if (lowerValue.includes('less than 5') || lowerValue.includes('0-5')) {
        details.systemAge = 'Less than 5 years';
      } else if (lowerValue.includes('5-10')) {
        details.systemAge = '5-10 years';
      } else if (lowerValue.includes('10-15')) {
        details.systemAge = '10-15 years';
      } else if (lowerValue.includes('over 15') || lowerValue.includes('15+')) {
        details.systemAge = 'Over 15 years';
      }
      
      // Location info (plumbing)
      if (lowerValue.includes('kitchen')) {
        details.location = 'Kitchen';
      } else if (lowerValue.includes('bathroom') || lowerValue.includes('bath')) {
        details.location = 'Bathroom';
      } else if (lowerValue.includes('laundry')) {
        details.location = 'Laundry Room';
      }
      
      // Look for leak point info
      if (lowerValue.includes('faucet head') || lowerValue.includes('head')) {
        details.leakPoint = 'Faucet head';
      } else if (lowerValue.includes('under sink') || lowerValue.includes('under')) {
        details.leakPoint = 'Under sink';
      }
      
      // Look for faucet type
      if (lowerValue.includes('single')) {
        details.faucetType = 'Single-handle';
      } else if (lowerValue.includes('double')) {
        details.faucetType = 'Double-handle';
      }
      
      // Look for lawn size - match exact option strings
      // lowerValue already declared above
      if (lowerValue === 'small (under 5,000 sq ft)' || (lowerValue.includes('small') && lowerValue.includes('5,000'))) {
        details.lawnSize = 'Small';
      } else if (lowerValue === 'medium (5,000-10,000 sq ft)' || lowerValue.includes('medium')) {
        details.lawnSize = 'Medium';
      } else if (lowerValue === 'large (10,000-20,000 sq ft)' || (lowerValue.includes('large') && lowerValue.includes('10,000-20,000'))) {
        details.lawnSize = 'Large';
      } else if (lowerValue === 'very large (over 20,000 sq ft / 0.5+ acres)' || lowerValue.includes('very large')) {
        details.lawnSize = 'Very large';
      } else if (lowerValue === 'over 1 acre' || lowerValue.includes('over 1 acre')) {
        details.lawnSize = 'Over 1 acre';
      }
      
      // Look for obstacles
      if (lowerValue.includes('minimal obstacles') || lowerValue === 'minimal obstacles') {
        details.obstacles = 'Minimal';
      } else if (lowerValue.includes('some obstacles') || lowerValue === 'some obstacles') {
        details.obstacles = 'Some';
      } else if (lowerValue.includes('many obstacles') || lowerValue === 'many obstacles') {
        details.obstacles = 'Many';
      } else if (lowerValue.includes('complex terrain') || lowerValue === 'complex terrain') {
        details.obstacles = 'Complex';
      }
      
      // Look for service type (edge trimming)
      if (lowerValue.includes('full service') || lowerValue === 'yes - full service') {
        details.serviceLevel = 'Full service';
      } else if (lowerValue.includes('just mowing') || lowerValue === 'just mowing') {
        details.serviceLevel = 'Mowing only';
      }
      
      // Store raw answer with key
      details[`answer_${key.slice(0, 8)}`] = value;
    }
  }
  
  return details;
}

/**
 * Estimate hours based on service type and details
 */
function estimateHours(serviceType: string, subcategory: string, details: Record<string, any>): number {
  // Plumbing estimates
  if (serviceType === 'Plumbing') {
    if (subcategory === 'Faucet Repair') {
      return details.leakPoint === 'Under sink' ? 2.0 : 1.5;
    }
    if (subcategory === 'Leak Detection') return 2.5;
    if (subcategory === 'Drain Cleaning') return 1.5;
    if (subcategory === 'Toilet Repair') return 1.0;
  }
  
  // HVAC estimates
  if (serviceType === 'HVAC') {
    if (subcategory === 'AC Repair') return 3.0;
    if (subcategory === 'Heating Repair') return 3.0;
    if (subcategory === 'Thermostat Installation') return 1.5;
  }
  
  // Electrical estimates
  if (serviceType === 'Electrical') {
    if (subcategory === 'Outlet Repair') return 1.0;
    if (subcategory === 'Light Fixture') return 1.5;
    if (subcategory === 'Switch Replacement') return 0.5;
    if (subcategory === 'Panel Upgrade') return 6.0;
  }
  
  // Landscaping estimates
  if (serviceType === 'Landscaping') {
    if (subcategory === 'Lawn Maintenance') {
      // Base estimate on lawn size
      let baseHours = 1.0; // default
      
      if (details.lawnSize?.includes('Small')) {
        baseHours = 0.75;
      } else if (details.lawnSize?.includes('Medium')) {
        baseHours = 1.5;
      } else if (details.lawnSize?.includes('Large') && !details.lawnSize?.includes('Very')) {
        baseHours = 2.5;
      } else if (details.lawnSize?.includes('Very large')) {
        baseHours = 4.0;
      } else if (details.lawnSize?.includes('Over 1 acre')) {
        baseHours = 6.0;
      }
      
      // Add time for obstacles
      if (details.obstacles === 'Some') {
        baseHours *= 1.2;
      } else if (details.obstacles === 'Many') {
        baseHours *= 1.4;
      } else if (details.obstacles === 'Complex') {
        baseHours *= 1.6;
      }
      
      // Add time for full service
      if (details.serviceLevel === 'Full service') {
        baseHours *= 1.3;
      }
      
      return Math.round(baseHours * 4) / 4; // Round to nearest 0.25 hours
    }
    if (subcategory === 'Tree Trimming') return 4.0;
    if (subcategory === 'Fence Installation') return 16.0;
  }
  
  // Default
  return 2.0;
}

/**
 * Determine materials needed
 */
function determineMaterials(serviceType: string, subcategory: string, details: Record<string, any>): string[] {
  if (serviceType === 'Plumbing' && subcategory === 'Faucet Repair') {
    return ['O-ring', 'Replacement cartridge', 'Plumber\'s tape'];
  }
  
  if (serviceType === 'Electrical' && subcategory === 'Outlet Repair') {
    return ['New outlet', 'Wire nuts', 'Electrical tape'];
  }
  
  if (serviceType === 'HVAC' && subcategory === 'Thermostat Installation') {
    return ['New thermostat', 'Mounting screws', 'Wire labels'];
  }
  
  if (serviceType === 'Landscaping' && subcategory === 'Lawn Maintenance') {
    const materials = ['Fuel for mower'];
    if (details.serviceLevel === 'Full service') {
      materials.push('Trimmer line', 'Edging blade', 'Bags for clippings');
    }
    return materials;
  }
  
  return ['Standard materials'];
}

/**
 * Assess complexity with flexible matching
 */
function assessComplexity(serviceType: string, subcategory: string, details: Record<string, any>): 'Low' | 'Medium' | 'High' {
  const normalizedSubcategory = subcategory.toLowerCase();
  
  // High complexity services (installations, major replacements, complex repairs)
  const highComplexityPatterns = [
    'panel upgrade', 
    'fence installation', 
    'water heater', 
    'gas line', 
    'main line', 
    'sewer',
    'hvac installation',
    'furnace replacement',
    'ac replacement',
    'unit replacement'
  ];
  if (highComplexityPatterns.some(pattern => normalizedSubcategory.includes(pattern))) {
    return 'High';
  }
  
  // Low complexity services - simple one-time service call repairs
  const lowComplexityPatterns = [
    'switch replacement', 'switch repair',
    'faucet repair', 'faucet replace', 'repair faucet', 'fix faucet',
    'outlet repair', 'outlet replace', 'repair outlet',
    'toilet repair', 'toilet fix', 'repair toilet',
    'drain clean', 'drain clear', 'unclog', 'clog',
    // HVAC simple repairs (one-time service calls)
    'ac repair', 'heating repair', 'furnace repair', 'thermostat'
  ];
  if (lowComplexityPatterns.some(pattern => normalizedSubcategory.includes(pattern))) {
    return 'Low';
  }
  
  // Default to medium
  return 'Medium';
}

/**
 * Recommend vendor type with skill-level flexibility
 */
function recommendVendorType(serviceType: string, subcategory: string, complexity: string): string {
  const normalizedSubcategory = subcategory.toLowerCase();
  
  // High complexity always requires licensed specialist
  if (complexity === 'High') {
    return `Licensed ${serviceType} Specialist`;
  }
  
  // Electrical work - licensed required except for very simple tasks
  if (serviceType === 'Electrical') {
    if (complexity === 'Low') {
      return 'Handyman or Licensed Electrician';
    }
    return 'Licensed Electrician';
  }
  
  // HVAC always requires licensed technician
  if (serviceType === 'HVAC') {
    return 'Licensed HVAC Technician';
  }
  
  // Plumbing - be specific about what requires licensed plumber
  if (serviceType === 'Plumbing') {
    // These require licensed plumber
    const requiresLicense = ['gas', 'water heater', 'main line', 'sewer', 'backflow', 'water line'];
    if (requiresLicense.some(term => normalizedSubcategory.includes(term))) {
      return 'Licensed Plumber';
    }
    
    // Simple repairs - handyman is sufficient
    const handymanOk = ['faucet', 'toilet', 'drain', 'sink', 'garbage disposal', 'unclog', 'leak repair'];
    if (handymanOk.some(term => normalizedSubcategory.includes(term))) {
      return 'Handyman or Licensed Plumber';
    }
    
    // Default for other plumbing
    return 'Licensed Plumber';
  }
  
  // Low complexity - handyman can handle
  if (complexity === 'Low') {
    return 'Handyman';
  }
  
  return `${serviceType} Contractor`;
}

/**
 * Generate human-readable summary with comprehensive details from ALL answers
 */
function generateSummary(data: any): string {
  const { serviceType, subcategory, details, estimatedHours, materialsNeeded, vendorType, pricing } = data;
  
  let summary = `${subcategory}`;
  const descriptionParts: string[] = [];
  
  // HVAC-specific details
  if (serviceType === 'HVAC') {
    const symptoms: string[] = [];
    
    if (details.temperatureIssue === 'no heat') {
      symptoms.push('no heat output');
    } else if (details.temperatureIssue === 'not cooling') {
      symptoms.push('not cooling properly');
    } else if (details.temperatureIssue === 'insufficient output') {
      symptoms.push('insufficient heating/cooling');
    } else if (details.temperatureIssue === 'intermittent') {
      symptoms.push('intermittent operation');
    }
    
    if (details.furnaceIgniting === 'no') symptoms.push('furnace not igniting');
    if (details.blowerRunning === 'no') symptoms.push('blower not running');
    if (details.systemStatus === 'not running') symptoms.push('system completely off');
    
    if (symptoms.length > 0) {
      descriptionParts.push(symptoms.join(', '));
    }
    
    const systemDetails: string[] = [];
    if (details.hvacSystemType) systemDetails.push(details.hvacSystemType);
    if (details.fuelType) systemDetails.push(details.fuelType);
    if (details.systemAge) systemDetails.push(details.systemAge + ' old');
    
    if (systemDetails.length > 0) {
      descriptionParts.push('System: ' + systemDetails.join(', '));
    }
  }
  
  // Plumbing-specific details
  if (serviceType === 'Plumbing') {
    const plumbingParts: string[] = [];
    if (details.location) plumbingParts.push(details.location);
    if (details.leakPoint) plumbingParts.push('leak at ' + details.leakPoint);
    if (details.faucetType) plumbingParts.push(details.faucetType);
    
    if (plumbingParts.length > 0) {
      descriptionParts.push(plumbingParts.join(', '));
    }
  }
  
  // Landscaping-specific details
  if (serviceType === 'Landscaping') {
    const landscapingParts: string[] = [];
    if (details.lawnSize) landscapingParts.push(details.lawnSize + ' lawn');
    if (details.obstacles) landscapingParts.push(details.obstacles + ' obstacles');
    if (details.serviceLevel) landscapingParts.push(details.serviceLevel);
    
    if (landscapingParts.length > 0) {
      descriptionParts.push(landscapingParts.join(', '));
    }
  }
  
  // Extract ALL other meaningful answers (universal approach)
  const answersToInclude: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    // Skip already-processed structured fields
    if (key.startsWith('answer_') && typeof value === 'string' && value.length < 100) {
      // Only include concise, meaningful answers
      if (!value.toLowerCase().includes('not sure') && 
          !value.toLowerCase().includes('n/a') &&
          value.length > 2) {
        answersToInclude.push(value);
      }
    }
  }
  
  // Add description parts to summary
  if (descriptionParts.length > 0) {
    summary += ': ' + descriptionParts.join('. ');
  }
  
  // Add additional answers as context (if not already covered)
  if (answersToInclude.length > 0 && descriptionParts.length === 0) {
    summary += '. Details: ' + answersToInclude.slice(0, 3).join(', ');
  }
  
  summary += `. Estimated ${estimatedHours} hours`;
  
  // Add materials if specific
  if (materialsNeeded.length > 0 && !materialsNeeded.includes('Standard materials')) {
    summary += `. Materials: ${materialsNeeded.join(', ')}`;
  }
  
  summary += `. Recommended: ${vendorType}`;
  
  // Add pricing estimate with service call clarification
  if (pricing) {
    const totalCost = pricing.estimatedTotalCost / 100;
    const laborCost = pricing.estimatedLaborCost / 100;
    const materialCost = pricing.estimatedMaterialCost / 100;
    
    // For flat-rate service calls (hourlyRate = 0), clarify it's diagnostic
    if (pricing.hourlyRate === 0 && estimatedHours <= 2) {
      if (materialCost > 0) {
        summary += `. Service call: $${laborCost.toFixed(2)} (covers diagnostic and first hour of labor) + $${materialCost.toFixed(2)} parts = $${totalCost.toFixed(2)} total`;
      } else {
        summary += `. Service call: $${laborCost.toFixed(2)} (covers diagnostic and first hour of labor, parts additional if needed)`;
      }
    } else {
      summary += `. Estimated total: $${totalCost.toFixed(2)}`;
    }
  }
  
  summary += '.';
  
  return summary;
}

/**
 * Generate narrative scope sections using AI for dispute prevention
 * Creates: Existing Conditions, Project Description, and Scope of Work
 */
async function generateNarrativeScope(params: {
  serviceType: string;
  subcategory: string;
  serviceDescription?: string;
  answers: Record<string, any>;
  details: Record<string, any>;
  estimatedHours: number;
  materialsNeeded: string[];
  complexity: string;
  vendorType: string;
  estimatedTotalCost: number;
  deckLineItems?: any[];
}): Promise<NarrativeScope | null> {
  const {
    serviceType,
    subcategory,
    serviceDescription,
    answers,
    details,
    estimatedHours,
    materialsNeeded,
    complexity,
    vendorType,
    estimatedTotalCost
  } = params;

  // Format answers for AI context
  const formattedAnswers = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  // Format deck line items if available
  let deckLineItemsContext = '';
  if (params.deckLineItems && params.deckLineItems.length > 0) {
    deckLineItemsContext = '\n\nMaterial Line Items:\n' + 
      params.deckLineItems.map(item => 
        `${item.item}: ${item.quantity} ${item.unit} × $${item.unitCost} = $${item.total}`
      ).join('\n');
  }

  const systemPrompt = `You are a TUDAO dispute-prevention scope writer. Your job is to write DETAILED, COMPREHENSIVE scopes that minimize customer-vendor disputes by clearly documenting:

1. EXISTING CONDITIONS - Current state of the site/property
2. PROJECT DESCRIPTION - What will be built and specifications
3. SCOPE OF WORK - Detailed step-by-step procedures

**CRITICAL RULES:**
- Be SPECIFIC and DETAILED - vague scopes cause disputes
- Include code compliance, permits, and building department requirements
- Mention specific materials, measurements, depths, spacing, anchors
- Write step-by-step procedures that a contractor can follow
- Avoid generic statements like "install deck" - be thorough!

**EXAMPLE (Deck Building):**

Existing Conditions:
Due to the addition of a new sliding door (approved by historical district in 2021), the current stairs to the rear entrance of the house do not suit the door. There is also a cement slab patio added by a previous owner.

Project Description:
This project consists of building a brand new, free standing 42" tall wooden non-ledger deck to solve the issue of the currently mismatched stairway and rear entry door. All specs will be to code and can be seen in the attached drawings or SOW. The deck will be stained with a brown waterproof stain. All wood, fasteners, and other materials will be to code.

Scope of Work:
• Cut into concrete and dig holes where needed for total of 8 deck posts and footings at 42" depth to get below frost line and match the foundation depth of the adjacent addition on existing house
• Pour cement footings with centered posts
• Build and attach beams per building department approved design/specs
• Build and attach joists per building department approved design/specs
• Build and attach stairs per building department approved design/specs
• Add flashing and attach deck to house per building department approved design/specs for non-ledger free standing deck
• Attach Balusters with proper hold-down anchors per building department approved design/specs
• Attach 5/4 premium decking
• Attach railings and trim to deck and stair balusters
• Stain with brown waterproof deck stain

Return ONLY valid JSON in this exact format:
{
  "existingConditions": "string describing current state",
  "projectDescription": "string describing what will be built",
  "scopeOfWork": ["step 1", "step 2", "step 3", ...]
}`;

    const userPrompt = `Service Type: ${serviceType}
Subcategory: ${subcategory}
Customer Description: ${serviceDescription || 'Not provided'}

Customer Answers:
${formattedAnswers}

Calculated Details:
- Estimated Hours: ${estimatedHours}
- Materials: ${materialsNeeded.join(', ')}
- Complexity: ${complexity}
- Recommended Vendor: ${vendorType}
- Estimated Total Cost: $${(estimatedTotalCost / 100).toFixed(2)}${deckLineItemsContext}

Generate the three narrative scope sections (JSON only).`;

  try {
    const openai = (await import('openai')).default;
    // Use Replit's AI integration API key (stored as AI_INTEGRATIONS_OPENAI_API_KEY)
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[generateNarrativeScope] No OpenAI API key found');
      return null;
    }
    const client = new openai({ 
      apiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined
    });
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for consistency
      max_tokens: 2000,
      response_format: { type: "json_object" } // Force valid JSON response
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      console.error('[generateNarrativeScope] No content returned from AI');
      return null;
    }

    // Parse JSON response (response_format guarantees valid JSON)
    let narrative: NarrativeScope;
    try {
      narrative = JSON.parse(content);
    } catch (parseError) {
      console.error('[generateNarrativeScope] JSON parse error:', parseError);
      console.error('[generateNarrativeScope] Raw content:', content);
      return null;
    }
    
    // Validate response structure
    if (!narrative.existingConditions || !narrative.projectDescription || !Array.isArray(narrative.scopeOfWork)) {
      console.error('[generateNarrativeScope] Invalid narrative structure:', narrative);
      return null;
    }
    
    if (narrative.scopeOfWork.length === 0) {
      console.error('[generateNarrativeScope] Empty scopeOfWork array');
      return null;
    }

    console.log('[generateNarrativeScope] ✅ Generated narrative with', narrative.scopeOfWork.length, 'SOW steps');
    return narrative;

  } catch (error) {
    console.error('[generateNarrativeScope] Error generating narrative:', error);
    return null; // Fallback to existing summary
  }
}

/**
 * Early deck dimension extraction to prevent wrong production standard matching
 * Extracts deck dimensions BEFORE generic quantity extraction runs
 */
async function extractDeckDimensionsEarly(
  serviceType: string, 
  subcategory: string | undefined, 
  answers: Record<string, any>,
  details: Record<string, any>
): Promise<void> {
  const DECK_SUBCATEGORIES = new Set(['Build deck', 'Deck Construction', 'Deck Installation', 'Deck Repair']);
  const isDeckBuilding = 
    serviceType === 'Deck Building' || 
    (serviceType === 'Carpentry' && subcategory && DECK_SUBCATEGORIES.has(subcategory));
  
  if (!isDeckBuilding) {
    return; // Not a deck project, skip
  }
  
  console.log('[Deck Priority] Deck project detected, extracting dimensions first...');
  
  // Check all answers for dimension patterns like "20 by 16"
  for (const [key, value] of Object.entries(answers)) {
    // Extract answer text - handles both string values and {answer: "text", phase: 2} objects
    const answerText = typeof value === 'string' ? value : (value as any)?.answer;
    
    if (typeof answerText === 'string') {
      const parsed = parseDimensionsFromText(answerText);
      if (parsed && parsed.deck_sqft) {
        console.log(`[Deck Priority] ✅ Found dimensions: ${parsed.deck_width} x ${parsed.deck_length} = ${parsed.deck_sqft} sq ft from "${answerText}"`);
        // Add to details so production standards will use square footage instead of random linear feet
        details.deck_sqft = parsed.deck_sqft;
        details.deck_width = parsed.deck_width;
        details.deck_length = parsed.deck_length;
        return; // Stop after finding first valid dimension
      }
    }
  }
  
  console.warn('[Deck Priority] ⚠️ No deck dimensions found in answers!');
}

/**
 * Helper function to parse dimensions from any text string
 */
function parseDimensionsFromText(text: string): Partial<Record<string, number>> | null {
  const lowerText = text.toLowerCase();
  const parsed: Partial<Record<string, number>> = {};
  
  // Parse dimensions like "20x20", "20 by 16", "14 ft by 22 ft", "20' × 16'"
  const dimensionMatch = lowerText.match(/(\d+)(?:\s*(?:ft|feet|'|")?)?\s*(?:x|×|by)\s*(?:(?:ft|feet|'|")?\s*)?(\d+)/i);
  if (dimensionMatch) {
    parsed.deck_width = parseInt(dimensionMatch[1]);
    parsed.deck_length = parseInt(dimensionMatch[2]);
    parsed.deck_sqft = parsed.deck_width * parsed.deck_length;
    parsed.deck_perimeter = 2 * (parsed.deck_width + parsed.deck_length);
    return parsed;
  }
  
  // Parse square footage directly
  const sqftMatch = lowerText.match(/(\d+)\s*(?:sq|square)\s*(?:ft|feet)/);
  if (sqftMatch) {
    parsed.deck_sqft = parseInt(sqftMatch[1]);
    // Estimate square dimensions if not provided
    const side = Math.sqrt(parsed.deck_sqft);
    parsed.deck_width = side;
    parsed.deck_length = side;
    parsed.deck_perimeter = 2 * (parsed.deck_width + parsed.deck_length);
    return parsed;
  }
  
  return null;
}

/**
 * Extract semantic keys from deck building answers
 * Converts customer answers into calculation-ready variables
 * Searches: serviceDescription, answers, and details (in priority order)
 */
function extractDeckSemanticKeys(
  answers: Record<string, any>, 
  details: Record<string, any>,
  serviceDescription?: string
): Record<string, any> {
  const semanticContext: Record<string, any> = {};
  
  // 1. FIRST: Check serviceDescription (initial user input - highest priority)
  if (serviceDescription) {
    const parsed = parseDimensionsFromText(serviceDescription);
    if (parsed) {
      Object.assign(semanticContext, parsed);
      console.log(`[Deck Semantic] Parsed dimensions from serviceDescription: ${parsed.deck_width} x ${parsed.deck_length} = ${parsed.deck_sqft} sq ft`);
    }
  }
  
  // 2. SECOND: Check raw answers (dynamic question responses)
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === 'string' && !semanticContext.deck_sqft) {
      const parsed = parseDimensionsFromText(value);
      if (parsed) {
        Object.assign(semanticContext, parsed);
        console.log(`[Deck Semantic] Parsed dimensions from answer '${key}': ${parsed.deck_width} x ${parsed.deck_length} = ${parsed.deck_sqft} sq ft`);
      }
    }
  }
  
  // 3. THIRD: Check details (extracted values - lowest priority for dimensions)
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string' && !semanticContext.deck_sqft) {
      const parsed = parseDimensionsFromText(value);
      if (parsed) {
        Object.assign(semanticContext, parsed);
        console.log(`[Deck Semantic] Parsed dimensions from detail '${key}': ${parsed.deck_width} x ${parsed.deck_length} = ${parsed.deck_sqft} sq ft`);
      }
    }
  }
  
  // Continue extracting other semantic keys from ALL sources
  const allTexts = [
    serviceDescription || '',
    ...Object.values(answers).filter(v => typeof v === 'string'),
    ...Object.values(details).filter(v => typeof v === 'string')
  ];
  
  for (const text of allTexts) {
    if (typeof text === 'string') {
      const lowerValue = text.toLowerCase();
      
      // Extract material type
      if (lowerValue.includes('pressure-treated') || lowerValue.includes('treated wood')) {
        semanticContext.deck_material = 'Pressure-treated wood';
      } else if (lowerValue.includes('cedar')) {
        semanticContext.deck_material = 'Cedar';
      } else if (lowerValue.includes('composite') || lowerValue.includes('trex')) {
        semanticContext.deck_material = 'Composite';
      } else if (lowerValue.includes('pvc')) {
        semanticContext.deck_material = 'PVC';
      }
      
      // Extract height
      const heightMatch = lowerValue.match(/(\d+)\s*(?:inch|in|')/);
      if (heightMatch) {
        semanticContext.deck_height = parseInt(heightMatch[1]);
      } else if (lowerValue.includes('ground level')) {
        semanticContext.deck_height = 6;
      } else if (lowerValue.includes('low elevation')) {
        semanticContext.deck_height = 24;
      } else if (lowerValue.includes('mid elevation')) {
        semanticContext.deck_height = 42;
      } else if (lowerValue.includes('high elevation')) {
        semanticContext.deck_height = 72;
      }
      
      // Extract stairs
      if (lowerValue.includes('stair')) {
        if (lowerValue.includes('yes') || lowerValue.includes('need')) {
          semanticContext.stairs = true;
          semanticContext.stair_count = lowerValue.includes('two') ? 2 : 1;
        } else if (lowerValue.includes('no')) {
          semanticContext.stairs = false;
        }
      }
      
      // Extract railings
      if (lowerValue.includes('railing') || lowerValue.includes('rail')) {
        if (lowerValue.includes('yes') || lowerValue.includes('all sides') || lowerValue.includes('need')) {
          semanticContext.railings = true;
        } else if (lowerValue.includes('no')) {
          semanticContext.railings = false;
        }
      }
      
      // Extract heavy load
      if (lowerValue.includes('hot tub') || lowerValue.includes('heavy')) {
        semanticContext.heavy_load = true;
      }
      
      // Extract access difficulty
      if (lowerValue.includes('narrow') || lowerValue.includes('difficult')) {
        semanticContext.access = 'difficult';
      } else {
        semanticContext.access = 'good';
      }
      
      // Extract slope
      if (lowerValue.includes('steep') || lowerValue.includes('sloped')) {
        semanticContext.slope = 'steep';
      }
      
      // Extract lighting
      if (lowerValue.includes('lighting') || lowerValue.includes('outlets')) {
        semanticContext.lighting = true;
        semanticContext.lighting_count = semanticContext.deck_perimeter ? Math.ceil(semanticContext.deck_perimeter / 10) : 8;
      }
    }
  }
  
  // Set defaults if not extracted
  semanticContext.deck_sqft = semanticContext.deck_sqft || 400;
  semanticContext.deck_width = semanticContext.deck_width || 20;
  semanticContext.deck_length = semanticContext.deck_length || 20;
  semanticContext.deck_perimeter = semanticContext.deck_perimeter || 80;
  semanticContext.deck_material = semanticContext.deck_material || 'Pressure-treated wood';
  semanticContext.deck_height = semanticContext.deck_height || 30;
  semanticContext.stairs = semanticContext.stairs !== undefined ? semanticContext.stairs : true;
  semanticContext.stair_count = semanticContext.stair_count || 1;
  semanticContext.railings = semanticContext.railings !== undefined ? semanticContext.railings : true;
  
  return semanticContext;
}

/**
 * Calculate deck materials using formulas and semantic context
 * Returns array of line items with quantities and costs
 */
function calculateDeckMaterials(
  materialCalculations: any,
  semanticContext: Record<string, any>
): Array<{category: string; item: string; quantity: number; unit: string; unitCost: number; total: number}> {
  const lineItems: Array<{category: string; item: string; quantity: number; unit: string; unitCost: number; total: number}> = [];
  
  if (!materialCalculations || !materialCalculations.categories) {
    return lineItems;
  }
  
  for (const category of materialCalculations.categories) {
    // Check if category has a condition
    if (category.condition) {
      const conditionMet = evaluateCondition(category.condition, semanticContext);
      if (!conditionMet) {
        console.log(`[Deck Calculation] Skipping category ${category.name} - condition not met: ${category.condition}`);
        continue;
      }
    }
    
    for (const component of category.components || []) {
      // Check if component has a condition
      if (component.condition) {
        const conditionMet = evaluateCondition(component.condition, semanticContext);
        if (!conditionMet) {
          continue;
        }
      }
      
      try {
        // Evaluate base formula
        let quantity = evaluateFormula(component.baseFormula, semanticContext);
        
        // Apply adjustments if conditions are met
        if (component.adjustments && Array.isArray(component.adjustments)) {
          for (const adjustment of component.adjustments) {
            if (evaluateCondition(adjustment.condition, semanticContext)) {
              quantity = evaluateFormula(adjustment.formula, semanticContext);
              console.log(`[Deck Calculation] Applied adjustment for ${component.key}: ${adjustment.description}`);
              break; // Use first matching adjustment
            }
          }
        }
        
        // Round quantity to reasonable precision
        quantity = Math.ceil(quantity);
        
        // Calculate total cost
        const total = quantity * component.unitCost;
        
        lineItems.push({
          category: category.name,
          item: component.description,
          quantity,
          unit: component.unit,
          unitCost: component.unitCost,
          total
        });
      } catch (error) {
        console.error(`[Deck Calculation] Error calculating ${component.key}:`, error);
      }
    }
  }
  
  return lineItems;
}

/**
 * Safely evaluate a formula string using semantic context
 * Supports basic arithmetic: +, -, *, /, parentheses
 */
function evaluateFormula(formula: string, context: Record<string, any>): number {
  // Replace semantic keys with actual values
  let expression = formula;
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'number') {
      expression = expression.replace(new RegExp(key, 'g'), value.toString());
    }
  }
  
  // Safety check: only allow numbers, operators, parentheses, and decimal points
  if (!/^[\d\s+\-*/.()]+$/.test(expression)) {
    throw new Error(`Invalid formula: ${formula} -> ${expression}`);
  }
  
  // Evaluate using Function constructor (safer than eval)
  try {
    return new Function(`return ${expression}`)();
  } catch (error) {
    console.error(`Formula evaluation error: ${formula} -> ${expression}`, error);
    return 0;
  }
}

/**
 * Evaluate a condition string (e.g., "deck_height >= 36", "stairs == true")
 */
function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  // Replace semantic keys with actual values
  let expression = condition;
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'boolean') {
      expression = expression.replace(new RegExp(key, 'g'), value.toString());
    } else if (typeof value === 'number') {
      expression = expression.replace(new RegExp(key, 'g'), value.toString());
    } else if (typeof value === 'string') {
      expression = expression.replace(new RegExp(key, 'g'), `"${value}"`);
    }
  }
  
  // Safety check: only allow safe comparison operators
  if (!/^[\d\s+\-*/.()>=<!&|"'truefalse]+$/.test(expression)) {
    console.warn(`Invalid condition: ${condition} -> ${expression}`);
    return false;
  }
  
  // Evaluate using Function constructor
  try {
    return new Function(`return ${expression}`)();
  } catch (error) {
    console.error(`Condition evaluation error: ${condition} -> ${expression}`, error);
    return false;
  }
}
