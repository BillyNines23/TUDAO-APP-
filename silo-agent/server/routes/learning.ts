import { Router } from "express";
import { db } from "../db";
import { completedJobs, type CompletedJob } from "@shared/schema";
import { eq } from "drizzle-orm";
import { calculateAccuracyScore, isHighQualityTrainingExample, generateJobTags } from "../utils/learningMetrics";
import { requireAdmin } from "../routes";

const router = Router();

/**
 * Update a completed job with actual outcomes
 * This is called when a job finishes to record what actually happened
 * 
 * POST /api/learning/update-job-outcome/:jobId
 * Body: {
 *   actualManHours?: number
 *   actualCost?: number (in cents)
 *   materialsUsed?: string
 *   customerRating?: number (1-5)
 *   customerFeedback?: string
 *   issuesEncountered?: string
 * }
 */
router.post("/update-job-outcome/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      actualManHours,
      actualCost,
      materialsUsed,
      customerRating,
      customerFeedback,
      issuesEncountered
    } = req.body;

    // Get existing job to calculate accuracy
    const [existingJob] = await db
      .select()
      .from(completedJobs)
      .where(eq(completedJobs.id, jobId));

    if (!existingJob) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Calculate accuracy score
    const accuracyScore = calculateAccuracyScore(
      { hours: existingJob.estimatedManHours, cost: existingJob.estimatedCost },
      { hours: actualManHours, cost: actualCost }
    );

    // Generate tags based on job characteristics
    const tags = generateJobTags({
      complexity: existingJob.notes?.includes("Complexity:") 
        ? existingJob.notes.split("Complexity:")[1]?.split(".")[0]?.trim()
        : null,
      actualManHours,
      estimatedManHours: existingJob.estimatedManHours,
      accuracyScore,
      serviceDescription: existingJob.serviceDescription
    });

    // Determine if this should be marked as a high-quality training example
    const shouldBeTrainingExample = isHighQualityTrainingExample({
      accuracyScore,
      customerRating,
      issuesEncountered
    });

    // Update job with actual outcomes
    const [updatedJob] = await db
      .update(completedJobs)
      .set({
        actualManHours: actualManHours ?? existingJob.actualManHours,
        actualCost: actualCost ?? existingJob.actualCost,
        materialsUsed: materialsUsed ?? existingJob.materialsUsed,
        customerRating: customerRating ?? existingJob.customerRating,
        customerFeedback: customerFeedback ?? existingJob.customerFeedback,
        issuesEncountered: issuesEncountered ?? existingJob.issuesEncountered,
        accuracyScore,
        tags: tags as any,
        isTrainingExample: shouldBeTrainingExample ? 1 : 0,
        completedAt: new Date()
      })
      .where(eq(completedJobs.id, jobId))
      .returning();

    console.log(`✅ Updated job ${jobId} with actual outcomes. Accuracy: ${accuracyScore?.toFixed(2)}, Training example: ${shouldBeTrainingExample}`);

    res.json({
      success: true,
      job: updatedJob,
      metrics: {
        accuracyScore,
        isTrainingExample: shouldBeTrainingExample,
        tags
      }
    });

  } catch (error) {
    console.error("Error updating job outcome:", error);
    res.status(500).json({ error: "Failed to update job outcome" });
  }
});

/**
 * Submit vendor feedback for a completed job
 * Vendors can report what questions should have been asked upfront
 * 
 * POST /api/learning/vendor-feedback/:jobId
 * Body: {
 *   vendorFeedback?: string
 *   vendorQuestions?: Array<{ question: string, answer: string, askedAt: string }>
 *   issuesEncountered?: string
 * }
 */
router.post("/vendor-feedback/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { vendorFeedback, vendorQuestions, issuesEncountered } = req.body;

    // Get existing job
    const [existingJob] = await db
      .select()
      .from(completedJobs)
      .where(eq(completedJobs.id, jobId));

    if (!existingJob) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Merge new vendor questions with existing ones
    const existingVendorQuestions = (existingJob.vendorQuestions as any[]) || [];
    const mergedVendorQuestions = [...existingVendorQuestions, ...(vendorQuestions || [])];

    // Update job with vendor feedback
    const [updatedJob] = await db
      .update(completedJobs)
      .set({
        vendorFeedback: vendorFeedback ?? existingJob.vendorFeedback,
        vendorQuestions: mergedVendorQuestions.length > 0 ? mergedVendorQuestions as any : null,
        issuesEncountered: issuesEncountered ?? existingJob.issuesEncountered
      })
      .where(eq(completedJobs.id, jobId))
      .returning();

    console.log(`✅ Vendor feedback received for job ${jobId}: ${vendorQuestions?.length || 0} clarifying questions`);

    res.json({
      success: true,
      job: updatedJob,
      newQuestionsCount: vendorQuestions?.length || 0
    });

  } catch (error) {
    console.error("Error submitting vendor feedback:", error);
    res.status(500).json({ error: "Failed to submit vendor feedback" });
  }
});

/**
 * Admin endpoint: Manually mark a job as a high-quality training example
 * 
 * POST /api/learning/mark-training-example/:jobId
 * Body: { isTrainingExample: boolean }
 */
router.post("/mark-training-example/:jobId", requireAdmin, async (req, res) => {
  try {

    const { jobId } = req.params;
    const { isTrainingExample } = req.body;

    const [updatedJob] = await db
      .update(completedJobs)
      .set({
        isTrainingExample: isTrainingExample ? 1 : 0
      })
      .where(eq(completedJobs.id, jobId))
      .returning();

    if (!updatedJob) {
      return res.status(404).json({ error: "Job not found" });
    }

    console.log(`✅ Admin marked job ${jobId} as ${isTrainingExample ? 'training example' : 'regular job'}`);

    res.json({
      success: true,
      job: updatedJob
    });

  } catch (error) {
    console.error("Error marking training example:", error);
    res.status(500).json({ error: "Failed to mark training example" });
  }
});

/**
 * Get learning metrics for admin dashboard
 * Shows how well the AI is improving over time
 * 
 * GET /api/learning/metrics
 */
router.get("/metrics", requireAdmin, async (req, res) => {
  try {

    // Get all completed jobs with actual outcomes
    const jobs = await db
      .select()
      .from(completedJobs)
      .where(eq(completedJobs.dataSource, "actual_completion"));

    // Filter jobs with accuracy scores
    const jobsWithAccuracy = jobs.filter((job: CompletedJob) => job.accuracyScore !== null);

    // Calculate metrics
    const avgAccuracy = jobsWithAccuracy.length > 0
      ? jobsWithAccuracy.reduce((sum: number, job: CompletedJob) => sum + (job.accuracyScore || 0), 0) / jobsWithAccuracy.length
      : null;

    const trainingExamplesCount = jobs.filter((job: CompletedJob) => job.isTrainingExample === 1).length;
    const highRatingCount = jobs.filter((job: CompletedJob) => job.customerRating && job.customerRating >= 4).length;

    // Group by service type
    const byServiceType = jobs.reduce((acc: Record<string, { count: number; avgAccuracy: number; scores: number[] }>, job: CompletedJob) => {
      if (!acc[job.serviceType]) {
        acc[job.serviceType] = { count: 0, avgAccuracy: 0, scores: [] };
      }
      acc[job.serviceType].count++;
      if (job.accuracyScore !== null) {
        acc[job.serviceType].scores.push(job.accuracyScore);
      }
      return acc;
    }, {} as Record<string, { count: number; avgAccuracy: number; scores: number[] }>);

    // Calculate average accuracy per service type
    Object.keys(byServiceType).forEach(serviceType => {
      const stats = byServiceType[serviceType];
      const scores = stats.scores;
      stats.avgAccuracy = scores.length > 0
        ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
        : 0;
    });

    res.json({
      totalJobs: jobs.length,
      jobsWithOutcomes: jobsWithAccuracy.length,
      averageAccuracy: avgAccuracy,
      trainingExamplesCount,
      highRatingCount,
      byServiceType: Object.entries(byServiceType).map(([serviceType, stats]) => ({
        serviceType,
        count: stats.count,
        avgAccuracy: stats.avgAccuracy
      }))
    });

  } catch (error) {
    console.error("Error fetching learning metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

export default router;
