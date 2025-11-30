import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emissionEngine } from "./services/emission-engine";
import { verificationAI } from "./services/verification-ai";
import { whaleDetector } from "./services/whale-detector";
import { kpiAggregator } from "./services/kpi-aggregator";
import { alertMonitor } from "./services/alert-monitor";
import { ExportService } from "./services/export-service";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize export service
  const exportService = new ExportService(storage);
  
  // Public Node APIs
  
  // Get node status and uptime
  app.get("/api/nodes/status", async (req, res) => {
    try {
      const { licenseId } = req.query;
      
      if (licenseId) {
        const node = await storage.getNodeByLicenseId(licenseId as string);
        if (!node) {
          return res.status(404).json({ error: "Node not found" });
        }
        
        const summary = await storage.getTelemetrySummary(licenseId as string);
        return res.json({ ...node, summary });
      }
      
      const nodes = await storage.getNodesWithSummary();
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch node status" });
    }
  });
  
  // Record telemetry heartbeat
  app.post("/api/telemetry/heartbeat", async (req, res) => {
    try {
      const { licenseId } = req.body;
      
      if (!licenseId) {
        return res.status(400).json({ error: "License ID required" });
      }
      
      const heartbeat = await storage.recordHeartbeat({ licenseId });
      
      // Update telemetry summary (simplified - would calculate from last 24h of heartbeats)
      const node = await storage.getNodeByLicenseId(licenseId);
      if (node) {
        const params = await storage.getGovernanceParams();
        const requiredSla = node.tier === "founding" ? params.slaFounder :
                           node.tier === "professional" ? params.slaProfessional :
                           params.slaVerifier;
        
        // Simulate uptime calculation (in production, calculate from actual heartbeats)
        const uptime = 98 + Math.random() * 2;
        const slaPass = uptime >= requiredSla;
        const status = uptime >= 99 ? "green" : uptime >= 95 ? "amber" : "red";
        
        await storage.updateTelemetrySummary({
          licenseId,
          uptime24h: uptime,
          slaPass,
          status
        });
      }
      
      res.json(heartbeat);
    } catch (error) {
      res.status(500).json({ error: "Failed to record heartbeat" });
    }
  });
  
  // Get verification tasks
  app.get("/api/verification/tasks", async (req, res) => {
    try {
      const { status, wallet } = req.query;
      
      if (status) {
        const tasks = await storage.getTasksByStatus(status as string);
        return res.json(tasks);
      }
      
      if (wallet) {
        const tasks = await storage.getTasksByWallet(wallet as string);
        return res.json(tasks);
      }
      
      const tasks = await storage.getAllVerificationTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
  
  // Submit verification evidence
  app.post("/api/verification/submit", async (req, res) => {
    try {
      const { taskId, evidence } = req.body;
      
      if (!taskId || !evidence) {
        return res.status(400).json({ error: "Task ID and evidence required" });
      }
      
      const task = await storage.getVerificationTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Analyze evidence with AI
      const aiResult = await verificationAI.analyzeEvidence(evidence, task.weight);
      
      // Calculate bounty if valid
      const params = await storage.getGovernanceParams();
      const bountyAmount = aiResult.isValid ? 
        verificationAI.calculateBounty(params.baseBountyRate, task.weight, aiResult.accuracyScore) : 0;
      
      // Update task
      const updated = await storage.updateVerificationTask(taskId, {
        status: aiResult.isValid ? "upheld" : "overturned",
        evidence,
        aiAnalysis: aiResult.analysis,
        accuracyScore: aiResult.accuracyScore,
        bountyAmount
      });
      
      // Record bounty if upheld
      if (aiResult.isValid && bountyAmount > 0) {
        const epoch = new Date().toISOString().split('T')[0];
        await storage.recordBounty({
          taskId,
          wallet: task.assignedTo,
          amount: bountyAmount,
          epochDate: epoch
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Failed to submit verification" });
    }
  });
  
  // Get epoch rewards
  app.get("/api/rewards/epoch/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const rewards = await storage.getRewardsByEpoch(id);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });
  
  // Generate claim proof
  app.post("/api/rewards/claim", async (req, res) => {
    try {
      const { nodeId, epoch } = req.body;
      
      if (!nodeId || !epoch) {
        return res.status(400).json({ error: "Node ID and epoch required" });
      }
      
      const proof = await emissionEngine.generateClaimProof(nodeId, epoch);
      
      if (!proof) {
        return res.status(404).json({ error: "No rewards found for this node and epoch" });
      }
      
      res.json(proof);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate claim proof" });
    }
  });
  
  // Get governance parameters
  app.get("/api/governance", async (req, res) => {
    try {
      const params = await storage.getGovernanceParams();
      res.json(params);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch governance params" });
    }
  });
  
  // Get top whale identities
  app.get("/api/governance/top-identities", async (req, res) => {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 10;
      const identities = await whaleDetector.getTopIdentities(limitNum);
      res.json(identities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch whale identities" });
    }
  });
  
  // Admin Dashboard APIs
  
  // Get overview KPIs
  app.get("/api/admin/kpi/overview", async (req, res) => {
    try {
      const kpis = await kpiAggregator.getOverviewKPIs();
      res.json(kpis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch KPIs" });
    }
  });
  
  // Get nodes with filtering
  app.get("/api/admin/nodes", async (req, res) => {
    try {
      const { tier, status, search } = req.query;
      
      let nodes = await storage.getNodesWithSummary();
      
      // Apply filters
      if (tier && tier !== "all") {
        nodes = nodes.filter(n => n.tier === tier);
      }
      
      if (status && status !== "all") {
        nodes = nodes.filter(n => n.summary?.status === status);
      }
      
      if (search) {
        const searchLower = (search as string).toLowerCase();
        nodes = nodes.filter(n => 
          n.licenseId.toLowerCase().includes(searchLower) ||
          n.ownerWallet.toLowerCase().includes(searchLower)
        );
      }
      
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nodes" });
    }
  });
  
  // Get verification stats
  app.get("/api/admin/verification/stats", async (req, res) => {
    try {
      const tasks = await storage.getAllVerificationTasks();
      
      const stats = {
        total: tasks.length,
        byStatus: {
          assigned: tasks.filter(t => t.status === "assigned").length,
          inProgress: tasks.filter(t => t.status === "in_progress").length,
          review: tasks.filter(t => t.status === "review").length,
          completed: tasks.filter(t => t.status === "completed").length,
          upheld: tasks.filter(t => t.status === "upheld").length,
          overturned: tasks.filter(t => t.status === "overturned").length
        },
        avgAccuracy: tasks.filter(t => t.accuracyScore !== null)
          .reduce((sum, t) => sum + (t.accuracyScore || 0), 0) / 
          tasks.filter(t => t.accuracyScore !== null).length || 0,
        totalBounties: tasks.reduce((sum, t) => sum + (t.bountyAmount || 0), 0)
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verification stats" });
    }
  });
  
  // Get emissions by epoch
  app.get("/api/admin/emissions/epoch", async (req, res) => {
    try {
      const { epoch } = req.query;
      const epochId = epoch || new Date().toISOString().split('T')[0];
      
      const rewards = await storage.getRewardsByEpoch(epochId as string);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emissions" });
    }
  });
  
  // Get whale analysis
  app.get("/api/admin/governance/whales", async (req, res) => {
    try {
      const identities = await whaleDetector.getTopIdentities(10);
      const risks = await whaleDetector.detectConcentrationRisks();
      
      res.json({
        identities,
        risks
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch whale data" });
    }
  });
  
  // Get active alerts
  app.get("/api/admin/alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });
  
  // Run alert checks
  app.post("/api/admin/alerts/check", async (req, res) => {
    try {
      await alertMonitor.runChecks();
      const stats = await alertMonitor.getAlertStats();
      res.json({
        message: "Alert checks completed",
        stats
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to run alert checks" });
    }
  });
  
  // Resolve an alert
  app.post("/api/admin/alerts/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      const alert = await storage.resolveAlert(id);
      
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });
  
  // Export reports - Generate and download CSV files
  app.post("/api/admin/reports/export", async (req, res) => {
    try {
      const { reportType, epochDate } = req.body;
      
      let filePath: string;
      let filename: string;
      
      switch (reportType) {
        case "nodes":
          filePath = await exportService.exportNodesCSV();
          filename = `nodes_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case "emissions":
          filePath = await exportService.exportEmissionsCSV(epochDate);
          filename = `emissions_export_${epochDate || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case "verification":
          filePath = await exportService.exportVerificationTasksCSV();
          filename = `verification_tasks_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case "whales":
          filePath = await exportService.exportWhaleIdentitiesCSV();
          filename = `whale_identities_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          return res.status(400).json({ error: "Invalid report type" });
      }
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream the file to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      // Clean up temp file after sending
      fileStream.on('end', () => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: "Failed to export report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
