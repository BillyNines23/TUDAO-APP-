/**
 * Utility functions for calculating learning metrics and accuracy scores
 */

/**
 * Calculate accuracy score comparing estimated vs actual values
 * Returns a score from 0.0 (terrible) to 1.0 (perfect)
 * Handles zero values gracefully and caps outlier penalties
 */
export function calculateAccuracyScore(
  estimated: { hours?: number | null; cost?: number | null },
  actual: { hours?: number | null; cost?: number | null }
): number | null {
  const scores: number[] = [];
  
  // Calculate hours accuracy (if both values exist)
  if (estimated.hours !== null && estimated.hours !== undefined && 
      actual.hours !== null && actual.hours !== undefined) {
    
    // Handle perfect zero estimate (e.g., all-inclusive pricing)
    if (estimated.hours === 0 && actual.hours === 0) {
      scores.push(1.0); // Perfect match
    }
    // Handle zero estimate but non-zero actual (scope change)
    else if (estimated.hours === 0 && actual.hours > 0) {
      scores.push(0.0); // Missed the actual labor
    }
    // Handle zero actual but non-zero estimate (rare but possible)
    else if (actual.hours === 0 && estimated.hours > 0) {
      scores.push(0.5); // Over-estimated but not worst case
    }
    // Normal case: both non-zero
    else if (estimated.hours > 0 && actual.hours > 0) {
      const hoursDiff = Math.abs(estimated.hours - actual.hours);
      const denominator = Math.max(estimated.hours, actual.hours);
      // Cap the penalty at 100% difference
      const hoursAccuracy = Math.max(0, 1 - Math.min(1, hoursDiff / denominator));
      scores.push(hoursAccuracy);
    }
  }
  
  // Calculate cost accuracy (if both values exist)
  if (estimated.cost !== null && estimated.cost !== undefined && 
      actual.cost !== null && actual.cost !== undefined) {
    
    // Handle perfect zero estimate
    if (estimated.cost === 0 && actual.cost === 0) {
      scores.push(1.0); // Perfect match
    }
    // Handle zero estimate but non-zero actual
    else if (estimated.cost === 0 && actual.cost > 0) {
      scores.push(0.0); // Missed the actual cost
    }
    // Handle zero actual but non-zero estimate
    else if (actual.cost === 0 && estimated.cost > 0) {
      scores.push(0.5); // Over-estimated but not worst case
    }
    // Normal case: both non-zero
    else if (estimated.cost > 0 && actual.cost > 0) {
      const costDiff = Math.abs(estimated.cost - actual.cost);
      const denominator = Math.max(estimated.cost, actual.cost);
      // Cap the penalty at 100% difference
      const costAccuracy = Math.max(0, 1 - Math.min(1, costDiff / denominator));
      scores.push(costAccuracy);
    }
  }
  
  // Return average if we have any scores
  if (scores.length === 0) {
    return null; // Not enough data to calculate
  }
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Determine if a completed job is high-quality for training
 * High-quality = accurate estimate + good customer rating + no major issues
 */
export function isHighQualityTrainingExample(job: {
  accuracyScore?: number | null;
  customerRating?: number | null;
  issuesEncountered?: string | null;
}): boolean {
  // Must have good accuracy (>= 0.75)
  if (!job.accuracyScore || job.accuracyScore < 0.75) {
    return false;
  }
  
  // Must have high customer rating (4+ stars)
  if (!job.customerRating || job.customerRating < 4) {
    return false;
  }
  
  // Should not have major issues
  if (job.issuesEncountered && job.issuesEncountered.length > 50) {
    return false; // Lots of issues = not ideal training example
  }
  
  return true;
}

/**
 * Extract useful tags from job data for better RAG matching
 */
export function generateJobTags(job: {
  complexity?: string | null;
  actualManHours?: number | null;
  estimatedManHours?: number | null;
  accuracyScore?: number | null;
  serviceDescription?: string | null;
}): string[] {
  const tags: string[] = [];
  
  // Complexity tag
  if (job.complexity) {
    tags.push(job.complexity.toLowerCase());
  }
  
  // Job duration tags
  if (job.actualManHours) {
    if (job.actualManHours < 2) tags.push("quick_fix");
    else if (job.actualManHours > 8) tags.push("multi_day");
  }
  
  // Accuracy tags
  if (job.accuracyScore !== undefined && job.accuracyScore !== null) {
    if (job.accuracyScore >= 0.9) tags.push("accurate_estimate");
    else if (job.accuracyScore < 0.6) tags.push("estimation_challenge");
  }
  
  // Scope change tags
  if (job.estimatedManHours && job.actualManHours) {
    const diff = Math.abs(job.actualManHours - job.estimatedManHours);
    const percentDiff = diff / job.estimatedManHours;
    if (percentDiff > 0.5) tags.push("scope_change");
  }
  
  // Weather/seasonal tags (if mentioned in description)
  if (job.serviceDescription) {
    const desc = job.serviceDescription.toLowerCase();
    if (desc.includes("weather") || desc.includes("rain") || desc.includes("snow")) {
      tags.push("weather_factor");
    }
    if (desc.includes("emergency") || desc.includes("urgent")) {
      tags.push("urgent");
    }
  }
  
  return tags;
}
