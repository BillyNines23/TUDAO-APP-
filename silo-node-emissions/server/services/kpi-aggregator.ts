import { storage } from "../storage";
import type { KPIOverview } from "@shared/schema";

export class KPIAggregator {
  async getOverviewKPIs(): Promise<KPIOverview> {
    const nodes = await storage.getAllNodes();
    const summaries = await storage.getAllTelemetrySummaries();
    const tasks = await storage.getAllVerificationTasks();
    const params = await storage.getGovernanceParams();
    
    // Active nodes by tier
    const activeNodes = {
      total: nodes.length,
      byTier: {
        founding: nodes.filter(n => n.tier === "founding").length,
        professional: nodes.filter(n => n.tier === "professional").length,
        verifier: nodes.filter(n => n.tier === "verifier").length
      }
    };
    
    // SLA pass rate
    const passingSla = summaries.filter(s => s.slaPass).length;
    const slaPassRate = summaries.length > 0 ? (passingSla / summaries.length) * 100 : 0;
    
    // Get latest epoch rewards
    const epoch = new Date().toISOString().split('T')[0];
    const rewards = await storage.getRewardsByEpoch(epoch);
    
    const totalEmissions = rewards.reduce((sum, r) => sum + r.totalReward, 0);
    const nrpUtilization = (totalEmissions / params.nrp) * 100;
    
    // Verification stats
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => 
      t.createdAt && new Date(t.createdAt).toISOString().split('T')[0] === today
    );
    
    const assigned = todayTasks.filter(t => t.status === "assigned").length;
    const completed = todayTasks.filter(t => 
      t.status === "completed" || t.status === "upheld" || t.status === "overturned"
    ).length;
    const upheld = todayTasks.filter(t => t.status === "upheld").length;
    const upheldPercent = completed > 0 ? (upheld / completed) * 100 : 0;
    
    // Pending tasks
    const pendingTasks = tasks.filter(t => 
      t.status === "assigned" || t.status === "in_progress" || t.status === "review"
    ).length;
    
    // Emissions by tier
    const emissionsByTier = {
      founding: rewards.filter(r => {
        const node = nodes.find(n => n.nodeId === r.nodeId);
        return node?.tier === "founding";
      }).reduce((sum, r) => sum + r.totalReward, 0),
      professional: rewards.filter(r => {
        const node = nodes.find(n => n.nodeId === r.nodeId);
        return node?.tier === "professional";
      }).reduce((sum, r) => sum + r.totalReward, 0),
      verifier: rewards.filter(r => {
        const node = nodes.find(n => n.nodeId === r.nodeId);
        return node?.tier === "verifier";
      }).reduce((sum, r) => sum + r.totalReward, 0)
    };
    
    // Bounty payouts (mock data for now - would calculate from actual bounty records)
    const bountyPayouts = {
      today: rewards.reduce((sum, r) => sum + r.bountyReward, 0),
      week: rewards.reduce((sum, r) => sum + r.bountyReward, 0) * 7,
      month: rewards.reduce((sum, r) => sum + r.bountyReward, 0) * 30
    };
    
    return {
      activeNodes,
      slaPassRate,
      nrpUtilization,
      pendingTasks,
      verificationsToday: {
        assigned,
        completed,
        upheldPercent
      },
      emissionsToday: {
        total: totalEmissions,
        byTier: emissionsByTier
      },
      bountyPayouts
    };
  }
}

export const kpiAggregator = new KPIAggregator();
