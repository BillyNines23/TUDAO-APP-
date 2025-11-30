# Walmart Landscaping Best Practices Reference

This document contains industry best practices extracted from Walmart's commercial landscaping scope of work. These standards are integrated into the TUDAO AI system through:

1. **Production Standards** (in `production_standards` table)
2. **Service Questions** (in `service_questions` table)
3. **Training Example** (in `completed_jobs` table, ID: 4b9c958c-25e5-49ab-a6ec-fe098ce9b823)

## Key Standards

### Mulch Maintenance
- **Depth**: 4" minimum throughout season (commercial standard, deeper than typical 2-3" residential)
- **Maintenance**: Top-dress with matching color and material as needed
- **Quality**: Kept neat, groomed, and free of weeds

### Tree Pruning Thresholds
- **Under 14 feet**: Annual pruning allowed without approval (remove dead, diseased, broken, dangerous, or crossing branches)
- **14 feet or taller**: Requires written approval before pruning
- **Dead Tree Replacement**: Within 2 weeks if due to contractor negligence

### Service Frequency Options
- Weekly (January-December year-round)
- Every Two Weeks (February-October)
- Three Times per Month (February-November)
- Monthly (February-December)
- Quarterly (seasonal variations: March-October, March-November, April-October, April-November, May-September, May-November)

### Fertilization Standards
- **Frequency**: 3-4 times per year typical for commercial properties
- **Application**: At manufacturer-specified rate during appropriate season
- **Licensing**: Licensed applicator required if state/local regulations require
- **Timing**: No applications within 1 hour of facility opening

### Irrigation System Maintenance
**Minor Repairs (included in maintenance contract):**
- Spray heads and nozzles replacement/adjustment
- Zone controls adjustment
- Main controller programming
- Small leaks in lines, risers, laterals
- System component maintenance

**Major Repairs (separate agreement required):**
- Pump failures
- Major line replacements
- Controller replacements

**Seasonal Services:**
- Winterization (contractor responsibility)
- Spring startup (contractor responsibility)

### Safety & Environmental Protocols
- **Stormwater Protection**: No maintenance activities in stormwater areas, wetlands, retention ponds, ditches, swales, bio-retention areas
- **Slope Mowing**: Only to crest (top) of slope, not side slopes or bottoms
- **Chemical Restrictions**: No chemicals directly or indirectly into stormwater areas
- **Signage**: Warning signs posted during chemical treatments
- **Timing**: Applications when customer presence is minimal
- **Disposal**: All debris to certified green waste facility

### Quality Standards
- **Appearance**: Even, well-groomed, first-class condition
- **Health**: Free from disease and pest concentrations
- **Vigor**: Healthy, vigorous growing condition
- **Cleanliness**: All trash removed from sidewalks, gutters, planted areas
- **Weeding**: Weeds removed/killed weekly as they emerge

## How AI Uses These Standards

The TUDAO AI Scope Engine automatically incorporates these best practices when generating landscaping scopes through:

1. **RAG Retrieval**: `findSimilarJobs()` retrieves the Walmart training example for similar landscaping requests
2. **Production Standards**: Query `production_standards` table for Walmart-specific standards (mulch depth, tree heights, etc.)
3. **Service Questions**: Dynamic questions guide customers to provide information aligned with these standards
4. **Scope Generation**: GPT-5 synthesizes scopes using RAG context, production standards, and quality benchmarks

## Training Data IDs

- **Production Standards**: 8 records added with `source: 'manual'` and notes prefixed with "WALMART STANDARD:"
- **Service Questions**: 9 records for Lawn Maintenance, Tree Pruning, and Mulch Installation
- **Completed Job Template**: ID `4b9c958c-25e5-49ab-a6ec-fe098ce9b823` with `isTrainingExample: 1`

## Usage Notes

When generating landscaping scopes, the AI will:
- Reference 4" mulch depth for commercial properties (vs. 2-3" residential)
- Ask about tree heights and apply 14ft threshold for approval requirements
- Offer appropriate service frequency options based on seasonal needs
- Include safety protocols for chemical applications and stormwater protection
- Specify licensed applicator requirements where applicable
- Differentiate minor vs. major irrigation repairs

These standards ensure TUDAO generates professional, commercially-viable landscaping scopes that meet industry best practices.
