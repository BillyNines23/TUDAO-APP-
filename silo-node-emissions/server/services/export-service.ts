import { createArrayCsvWriter } from "csv-writer";
import type { IStorage } from "../storage";
import type { Node, TelemetrySummary, VerificationTask, RewardsLedger } from "../../shared/schema";

export class ExportService {
  constructor(private storage: IStorage) {}

  async exportNodesCSV(): Promise<string> {
    const nodes = await this.storage.getAllNodes();
    const telemetrySummaries = await this.storage.getAllTelemetrySummaries();
    
    // Create a map of telemetry by licenseId for quick lookup
    const telemetryMap = new Map<string, TelemetrySummary>();
    for (const summary of telemetrySummaries) {
      telemetryMap.set(summary.licenseId, summary);
    }
    
    // Prepare data rows
    const data = nodes.map((node: Node) => {
      const telemetry = telemetryMap.get(node.licenseId);
      return [
        node.licenseId,
        node.tier,
        node.ownerWallet,
        node.identityId,
        telemetry?.uptime24h !== null && telemetry?.uptime24h !== undefined ? telemetry.uptime24h.toFixed(2) : "0.00",
        telemetry?.slaPass ? "Pass" : "Fail",
        telemetry?.status || "unknown",
        telemetry?.lastUpdate ? telemetry.lastUpdate.toISOString() : "N/A"
      ];
    });

    const csvWriter = createArrayCsvWriter({
      header: [
        "License ID",
        "Tier",
        "Owner Wallet",
        "Identity ID",
        "Uptime 24h (%)",
        "SLA Status",
        "Status",
        "Last Update"
      ],
      path: "/tmp/nodes_export.csv"
    });

    await csvWriter.writeRecords(data);
    return "/tmp/nodes_export.csv";
  }

  async exportEmissionsCSV(epochDate?: string): Promise<string> {
    const rewards = await this.storage.getAllRewards();
    
    // Filter by epoch if provided
    const filteredRewards = epochDate
      ? rewards.filter((r: RewardsLedger) => r.epoch === epochDate)
      : rewards;

    const data = filteredRewards.map((reward: RewardsLedger) => [
      reward.epoch,
      reward.nodeId,
      (reward.feuUsed ?? 0).toFixed(2),
      (reward.baseReward ?? 0).toFixed(2),
      (reward.bountyReward ?? 0).toFixed(2),
      (reward.totalReward ?? 0).toFixed(2),
      reward.claimed ? "Yes" : "No",
      reward.txHash || "N/A"
    ]);

    const csvWriter = createArrayCsvWriter({
      header: [
        "Epoch",
        "Node ID",
        "FEU Used",
        "Base Reward (TUDAO)",
        "Bounty Reward (TUDAO)",
        "Total Reward (TUDAO)",
        "Claimed",
        "TX Hash"
      ],
      path: "/tmp/emissions_export.csv"
    });

    await csvWriter.writeRecords(data);
    return "/tmp/emissions_export.csv";
  }

  async exportVerificationTasksCSV(): Promise<string> {
    const tasks = await this.storage.getAllVerificationTasks();

    const data = tasks.map((task: VerificationTask) => [
      task.taskId,
      task.jobId,
      task.assignedTo || "Unassigned",
      task.weight.toString(),
      task.status,
      task.accuracyScore !== null && task.accuracyScore !== undefined ? task.accuracyScore.toFixed(2) : "N/A",
      task.bountyAmount !== null && task.bountyAmount !== undefined ? task.bountyAmount.toFixed(2) : "N/A",
      task.createdAt ? task.createdAt.toISOString() : "N/A",
      task.completedAt ? task.completedAt.toISOString() : "N/A"
    ]);

    const csvWriter = createArrayCsvWriter({
      header: [
        "Task ID",
        "Job ID",
        "Assigned To",
        "Weight",
        "Status",
        "Accuracy Score",
        "Bounty Amount (TUDAO)",
        "Created At",
        "Completed At"
      ],
      path: "/tmp/verification_tasks_export.csv"
    });

    await csvWriter.writeRecords(data);
    return "/tmp/verification_tasks_export.csv";
  }

  async exportWhaleIdentitiesCSV(): Promise<string> {
    const nodes = await this.storage.getAllNodes();
    
    // Group nodes by identityId
    const identityGroups = new Map<string, Node[]>();
    for (const node of nodes) {
      const existing = identityGroups.get(node.identityId) || [];
      existing.push(node);
      identityGroups.set(node.identityId, existing);
    }

    // Calculate FEU for each identity
    const identityData = Array.from(identityGroups.entries()).map(([identityId, identityNodes]) => {
      let rawFEU = 0;
      let effectiveFEU = 0;
      
      // Sort founding nodes for dampening
      const foundingNodes = identityNodes.filter(n => n.tier === "founding");
      const professionalNodes = identityNodes.filter(n => n.tier === "professional");
      const verifierNodes = identityNodes.filter(n => n.tier === "verifier");
      
      // Apply whale dampener to founding nodes
      foundingNodes.forEach((_, index) => {
        const baseFEU = 15;
        rawFEU += baseFEU;
        
        if (index === 0) effectiveFEU += baseFEU * 1.0;  // 100%
        else if (index === 1) effectiveFEU += baseFEU * 0.7;  // 70%
        else if (index === 2) effectiveFEU += baseFEU * 0.5;  // 50%
        else effectiveFEU += baseFEU * 0.25;  // 25%
      });
      
      // Professional and verifier nodes don't get dampened
      professionalNodes.forEach(() => {
        rawFEU += 8;
        effectiveFEU += 8;
      });
      
      verifierNodes.forEach(() => {
        rawFEU += 1;
        effectiveFEU += 1;
      });

      const dampenerReduction = rawFEU - effectiveFEU;
      const reductionPercent = rawFEU > 0 ? ((dampenerReduction / rawFEU) * 100) : 0;

      return {
        identityId,
        totalNodes: identityNodes.length,
        foundingCount: foundingNodes.length,
        professionalCount: professionalNodes.length,
        verifierCount: verifierNodes.length,
        rawFEU,
        effectiveFEU,
        dampenerReduction,
        reductionPercent
      };
    });

    // Sort by effective FEU descending
    identityData.sort((a, b) => b.effectiveFEU - a.effectiveFEU);

    const data = identityData.map(identity => [
      identity.identityId.substring(0, 16) + "...",
      identity.totalNodes.toString(),
      identity.foundingCount.toString(),
      identity.professionalCount.toString(),
      identity.verifierCount.toString(),
      identity.rawFEU.toFixed(2),
      identity.effectiveFEU.toFixed(2),
      identity.dampenerReduction.toFixed(2),
      identity.reductionPercent.toFixed(1) + "%"
    ]);

    const csvWriter = createArrayCsvWriter({
      header: [
        "Identity ID",
        "Total Nodes",
        "Founding Nodes",
        "Professional Nodes",
        "Verifier Nodes",
        "Raw FEU",
        "Effective FEU",
        "Dampener Reduction",
        "Reduction %"
      ],
      path: "/tmp/whale_identities_export.csv"
    });

    await csvWriter.writeRecords(data);
    return "/tmp/whale_identities_export.csv";
  }
}
