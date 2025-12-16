/**
 * Sales Tax Service
 * Calculates applicable sales tax for home services based on state and service type
 */

import taxMatrix from '../data/service_taxability_matrix.json';

export interface SalesTaxResult {
  isTaxable: boolean;
  taxRate: number; // as decimal (e.g., 0.0825 for 8.25%)
  taxAmount: number; // in cents
  taxableAmount: number; // in cents (what we're applying tax to)
  regime: string; // "broad", "selective", "no_tax"
  notes?: string;
}

/**
 * Standard sales tax rates by state (as of 2024-2025)
 * These are base state rates - local rates may apply but are not included
 */
const STATE_TAX_RATES: Record<string, number> = {
  'AL': 0.04,    // Alabama 4%
  'AZ': 0.056,   // Arizona 5.6%
  'AR': 0.065,   // Arkansas 6.5%
  'CA': 0.0725,  // California 7.25% (base rate, locals can be much higher)
  'CO': 0.029,   // Colorado 2.9%
  'CT': 0.0635,  // Connecticut 6.35%
  'DC': 0.06,    // DC 6%
  'FL': 0.06,    // Florida 6%
  'GA': 0.04,    // Georgia 4%
  'HI': 0.04,    // Hawaii 4% (GET - General Excise Tax)
  'ID': 0.06,    // Idaho 6%
  'IL': 0.0625,  // Illinois 6.25%
  'IN': 0.07,    // Indiana 7%
  'IA': 0.06,    // Iowa 6%
  'KS': 0.065,   // Kansas 6.5%
  'KY': 0.06,    // Kentucky 6%
  'LA': 0.0445,  // Louisiana 4.45%
  'ME': 0.055,   // Maine 5.5%
  'MD': 0.06,    // Maryland 6%
  'MA': 0.0625,  // Massachusetts 6.25%
  'MI': 0.06,    // Michigan 6%
  'MN': 0.0688,  // Minnesota 6.875%
  'MS': 0.07,    // Mississippi 7%
  'MO': 0.0423,  // Missouri 4.225%
  'NE': 0.055,   // Nebraska 5.5%
  'NV': 0.0685,  // Nevada 6.85%
  'NJ': 0.0663,  // New Jersey 6.625%
  'NM': 0.0513,  // New Mexico 5.125% (GRT)
  'NY': 0.04,    // New York 4%
  'NC': 0.0475,  // North Carolina 4.75%
  'ND': 0.05,    // North Dakota 5%
  'OH': 0.0575,  // Ohio 5.75%
  'OK': 0.045,   // Oklahoma 4.5%
  'PA': 0.06,    // Pennsylvania 6%
  'RI': 0.07,    // Rhode Island 7%
  'SC': 0.06,    // South Carolina 6%
  'SD': 0.045,   // South Dakota 4.5%
  'TN': 0.07,    // Tennessee 7%
  'TX': 0.0625,  // Texas 6.25%
  'UT': 0.0485,  // Utah 4.85%
  'VT': 0.06,    // Vermont 6%
  'VA': 0.053,   // Virginia 5.3%
  'WA': 0.065,   // Washington 6.5%
  'WV': 0.06,    // West Virginia 6%
  'WI': 0.05,    // Wisconsin 5%
  'WY': 0.04,    // Wyoming 4%
  
  // No sales tax states - 0%
  'AK': 0.00,    // Alaska (no state sales tax)
  'DE': 0.00,    // Delaware (no sales tax)
  'MT': 0.00,    // Montana (no sales tax)
  'NH': 0.00,    // New Hampshire (no sales tax)
  'OR': 0.00,    // Oregon (no sales tax)
};

/**
 * Service taxability rules by service type
 * Based on common patterns across states with selective taxability
 */
interface ServiceTaxRule {
  isCommonlyTaxable: boolean; // true if most selective states tax this service
  taxRate?: number; // override default state rate if needed
  notes?: string;
}

const SERVICE_TAX_RULES: Record<string, ServiceTaxRule> = {
  // Plumbing - commonly taxable as repair/installation
  'Plumbing': {
    isCommonlyTaxable: true,
    notes: 'Repair and installation services typically taxable'
  },
  
  // Electrical - commonly taxable as repair/installation
  'Electrical': {
    isCommonlyTaxable: true,
    notes: 'Electrical repair and installation typically taxable'
  },
  
  // HVAC - commonly taxable as repair/installation
  'HVAC': {
    isCommonlyTaxable: true,
    notes: 'HVAC repair and installation typically taxable'
  },
  
  // Landscaping - varies widely, often exempt
  'Landscaping': {
    isCommonlyTaxable: false,
    notes: 'Landscaping services often exempt in many states'
  },
  
  // General labor/repair - commonly taxable
  'General Repair': {
    isCommonlyTaxable: true,
    notes: 'General repair services typically taxable'
  },
};

/**
 * Map state abbreviations to full names for tax matrix lookup
 */
const STATE_ABBREV_TO_NAME: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

/**
 * Get tax regime for a state
 */
function getTaxRegime(state: string): 'broad' | 'selective' | 'no_tax' {
  // Convert state abbreviation to full name if needed
  const stateName = STATE_ABBREV_TO_NAME[state.toUpperCase()] || state;
  
  const jurisdiction = taxMatrix.find(
    j => j.jurisdiction.toUpperCase() === stateName.toUpperCase()
  );
  
  if (!jurisdiction) {
    return 'selective'; // default assumption
  }
  
  if (jurisdiction.service_tax_regime.includes('Broad service tax base')) {
    return 'broad';
  } else if (jurisdiction.service_tax_regime.includes('No general state sales tax')) {
    return 'no_tax';
  } else {
    return 'selective';
  }
}

/**
 * Calculate sales tax for a service
 */
export function calculateSalesTax(params: {
  state?: string;
  serviceType: string;
  subtotal: number; // in cents (labor + materials, before add-ons)
  laborCost: number; // in cents
  materialCost: number; // in cents
}): SalesTaxResult {
  const { state, serviceType, subtotal, laborCost, materialCost } = params;
  
  // No state provided - can't calculate tax
  if (!state) {
    return {
      isTaxable: false,
      taxRate: 0,
      taxAmount: 0,
      taxableAmount: 0,
      regime: 'unknown',
      notes: 'Location not specified'
    };
  }
  
  // Get tax regime for this state
  const regime = getTaxRegime(state);
  
  // No-tax states
  if (regime === 'no_tax') {
    return {
      isTaxable: false,
      taxRate: 0,
      taxAmount: 0,
      taxableAmount: 0,
      regime: 'no_tax',
      notes: `${state} has no general sales tax`
    };
  }
  
  // Get base tax rate for state
  const stateTaxRate = STATE_TAX_RATES[state] || 0;
  
  // Broad-tax states - tax everything
  if (regime === 'broad') {
    const taxAmount = Math.round(subtotal * stateTaxRate);
    return {
      isTaxable: true,
      taxRate: stateTaxRate,
      taxAmount,
      taxableAmount: subtotal,
      regime: 'broad',
      notes: `${state} taxes most services`
    };
  }
  
  // Selective-tax states - depends on service type
  const serviceRule = SERVICE_TAX_RULES[serviceType];
  
  if (!serviceRule || !serviceRule.isCommonlyTaxable) {
    // Service not commonly taxable in selective states
    return {
      isTaxable: false,
      taxRate: 0,
      taxAmount: 0,
      taxableAmount: 0,
      regime: 'selective',
      notes: `${serviceType} services often exempt in ${state}`
    };
  }
  
  // Service is commonly taxable in selective states
  // In most states, both labor and materials are taxable for repair/installation
  const taxableAmount = laborCost + materialCost; // Don't tax add-on fees
  const taxRate = serviceRule.taxRate || stateTaxRate;
  const taxAmount = Math.round(taxableAmount * taxRate);
  
  return {
    isTaxable: true,
    taxRate,
    taxAmount,
    taxableAmount,
    regime: 'selective',
    notes: serviceRule.notes
  };
}

/**
 * Get sales tax info for display purposes
 */
export function getSalesTaxInfo(state?: string): string {
  if (!state) return 'Tax calculated based on service location';
  
  const regime = getTaxRegime(state);
  const rate = STATE_TAX_RATES[state] || 0;
  
  if (regime === 'no_tax') {
    return `${state} has no sales tax`;
  }
  
  if (regime === 'broad') {
    return `${state} applies ${(rate * 100).toFixed(2)}% sales tax to most services`;
  }
  
  return `${state} sales tax rate: ${(rate * 100).toFixed(2)}% (applies to some services)`;
}

/**
 * Check if a specific service/state combination is likely taxable
 */
export function isServiceTaxable(state: string, serviceType: string): boolean {
  const regime = getTaxRegime(state);
  
  if (regime === 'no_tax') return false;
  if (regime === 'broad') return true;
  
  const serviceRule = SERVICE_TAX_RULES[serviceType];
  return serviceRule?.isCommonlyTaxable || false;
}
