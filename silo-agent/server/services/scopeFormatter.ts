/**
 * TUDAO Scope Formatter Service
 * 
 * Transforms raw scope JSON into professional, client-facing proposal documents
 * using the TUDAO Proposal Template.
 */

import OpenAI from 'openai';

// OpenAI client - supports both Replit AI Integrations and direct OpenAI API
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
});

interface FormatterInput {
  scopeJson: any;
  clientName?: string;
  vendorName?: string;
  scopeId: string;
}

const TUDAO_TEMPLATE = `
You are the TUDAO Proposal & Scope Formatter.

Your job is to take the final JSON-generated scope, plus any vendor/client details provided, and generate a clean, professional, client-facing scope document using the TUDAO Proposal Template below.

You MUST format it exactly like a real proposal:
- Clear sections
- Bullet points
- Tables where needed
- Professional wording
- No raw JSON
- Clean, easy to read
- Branded as TUDAO

You MUST follow this template structure:

═══════════════════════════════════════════════
TUDAO SERVICE PROPOSAL & SCOPE OF WORK
═══════════════════════════════════════════════

Prepared for: [Client Name]
Prepared by: [Vendor Name or "TUDAO Verified Vendor"]
Date: [Today's Date]
Scope ID: [Scope ID]

───────────────────────────────────────────────
1. PROJECT OVERVIEW
───────────────────────────────────────────────

[Write a clear, professional 2-3 sentence summary of what the customer needs and what will be done]

───────────────────────────────────────────────
2. SERVICES INCLUDED
───────────────────────────────────────────────

[List all services as bullet points with clear descriptions]
• [Service 1]
• [Service 2]
• [etc.]

───────────────────────────────────────────────
3. MATERIALS INCLUDED
───────────────────────────────────────────────

[If materials are included, list them clearly]
• [Material 1 - Quantity and description]
• [Material 2 - Quantity and description]
• [etc.]

[If no materials: "No materials required - service work only"]

───────────────────────────────────────────────
4. VISIT SCHEDULE / TIMELINE
───────────────────────────────────────────────

[Describe when work will be performed]
• For seasonal contracts: describe visit frequency and duration
• For one-time work: describe completion timeline
• Include any specific scheduling details from the scope

───────────────────────────────────────────────
5. ESTIMATED COSTS
───────────────────────────────────────────────

[Create a clean cost breakdown table]

Labor:               $[amount]
Materials:           $[amount]
Additional Fees:     $[amount if applicable]
                    ─────────
ESTIMATED TOTAL:     $[total]

* This is a fair market estimate based on industry standards.
* Final pricing may vary based on actual conditions and vendor quotes.
* Prices do not include applicable taxes unless otherwise noted.

───────────────────────────────────────────────
6. ADDITIONAL NOTES
───────────────────────────────────────────────

[Include any important details from the scope:]
• Site access requirements
• Irrigation or utility considerations  
• Seasonal considerations
• Any special customer requests or notes

───────────────────────────────────────────────
7. ACCEPTANCE
───────────────────────────────────────────────

This scope of work has been prepared based on the information provided. By accepting this proposal, the client confirms that the scope accurately reflects the desired work.

Next Steps:
• Review this scope carefully
• TUDAO will match you with qualified, verified vendors
• You'll receive competitive bids based on this scope
• Choose your preferred vendor and schedule the work

───────────────────────────────────────────────

Powered by TUDAO - Your Trusted Service Marketplace
═══════════════════════════════════════════════

FORMATTING RULES:
1. Convert ALL raw JSON into complete sentences and bullet points
2. Use professional, friendly language (not technical jargon)
3. Make costs clear and easy to understand
4. Include ALL relevant details from the JSON
5. Never expose raw JSON structures to the client
6. Use the exact template structure above
7. Fill in [Client Name] with provided name or "Valued Customer"
8. Fill in [Vendor Name] with provided name or "TUDAO Verified Vendor"
9. Format dates nicely (e.g., "November 17, 2025")
10. Make it look like a real professional proposal

Return ONLY the formatted proposal text - nothing else.
`;

/**
 * Format raw scope JSON into professional TUDAO proposal
 */
export async function formatScopeProposal(input: FormatterInput): Promise<string> {
  const { scopeJson, clientName = "Valued Customer", vendorName = "TUDAO Verified Vendor", scopeId } = input;

  console.log('[ScopeFormatter] Formatting proposal for scope:', scopeId);

  try {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // CRITICAL FIX: Convert cents to dollars before sending to AI
    // The AI doesn't know that 300000 = $3,000, it thinks it's $300,000
    // assembleScope ALWAYS returns integer cents, so we ALWAYS divide by 100
    const convertCentsToDollars = (value: number | undefined): string | undefined => {
      if (value === undefined || value === null) return undefined;
      // assembleScope always returns cents, so always convert
      return (value / 100).toFixed(2);
    };
    
    const normalizedScope = {
      ...scopeJson,
      estimated_labor_cost: convertCentsToDollars(
        scopeJson.estimated_labor_cost || scopeJson.estimatedLaborCost
      ),
      estimated_material_cost: convertCentsToDollars(
        scopeJson.estimated_material_cost || scopeJson.estimatedMaterialCost
      ),
      estimated_total_cost: convertCentsToDollars(
        scopeJson.estimated_total_cost || scopeJson.estimatedTotalCost
      ),
    };

    console.log('[ScopeFormatter] Converted prices (cents → dollars):', {
      labor: normalizedScope.estimated_labor_cost,
      materials: normalizedScope.estimated_material_cost,
      total: normalizedScope.estimated_total_cost
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: TUDAO_TEMPLATE
        },
        {
          role: 'user',
          content: `Format this scope into a TUDAO proposal:

Client Name: ${clientName}
Vendor Name: ${vendorName}
Today's Date: ${today}
Scope ID: ${scopeId}

Raw Scope JSON:
${JSON.stringify(normalizedScope, null, 2)}

IMPORTANT: The cost fields (estimated_labor_cost, estimated_material_cost, estimated_total_cost) are already in DOLLARS, not cents. Use them directly with dollar signs.`
        }
      ],
      temperature: 0.3, // Low temperature for consistent formatting
    });

    const formattedProposal = completion.choices[0]?.message?.content || '';
    
    if (!formattedProposal) {
      throw new Error('No formatted proposal returned from AI');
    }

    console.log('[ScopeFormatter] ✅ Proposal formatted successfully');
    
    return formattedProposal;

  } catch (error) {
    console.error('[ScopeFormatter] ❌ Error formatting proposal:', error);
    
    // Graceful fallback: return basic formatted version
    return generateFallbackProposal(input);
  }
}

/**
 * Fallback formatter if AI fails - creates basic but clean proposal
 */
function generateFallbackProposal(input: FormatterInput): string {
  const { scopeJson, clientName = "Valued Customer", vendorName = "TUDAO Verified Vendor", scopeId } = input;
  
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Handle both camelCase and snake_case field names for robustness
  const totalCost = (scopeJson.estimated_total_cost || scopeJson.estimatedTotalCost)
    ? `$${((scopeJson.estimated_total_cost || scopeJson.estimatedTotalCost) / 100).toFixed(2)}`
    : 'Contact for quote';
  
  const materialsNeeded = scopeJson.materials_needed || scopeJson.materialsNeeded || [];

  return `
═══════════════════════════════════════════════
TUDAO SERVICE PROPOSAL & SCOPE OF WORK
═══════════════════════════════════════════════

Prepared for: ${clientName}
Prepared by: ${vendorName}
Date: ${today}
Scope ID: ${scopeId}

───────────────────────────────────────────────
1. PROJECT OVERVIEW
───────────────────────────────────────────────

Service Type: ${scopeJson.subcategory || 'Service Request'}
Category: ${scopeJson.category || 'General Services'}

${scopeJson.summary || 'Professional service as described in your request.'}

───────────────────────────────────────────────
2. SERVICES INCLUDED
───────────────────────────────────────────────

${scopeJson.details ? Object.entries(scopeJson.details)
  .map(([key, value]) => `• ${key}: ${value}`)
  .join('\n') : '• Professional service delivery'}

───────────────────────────────────────────────
3. ESTIMATED COSTS
───────────────────────────────────────────────

ESTIMATED TOTAL: ${totalCost}

* This is a fair market estimate based on industry standards.
* Final pricing may vary based on actual conditions.

───────────────────────────────────────────────

Powered by TUDAO - Your Trusted Service Marketplace
═══════════════════════════════════════════════
`.trim();
}
