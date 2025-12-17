import { randomUUID } from "crypto";
import type {
  Node, InsertNode,
  TelemetryHeartbeat, InsertTelemetryHeartbeat,
  TelemetrySummary, InsertTelemetrySummary,
  VerificationTask, InsertVerificationTask,
  BountyRecord, InsertBountyRecord,
  RewardsLedger, InsertRewardsLedger,
  GovernanceParams, InsertGovernanceParams,
  AlertRecord, InsertAlertRecord,
  NodeWithSummary,
  WhaleIdentity,
  KPIOverview,
  EmissionCalculation,
  ClaimProof
} from "../shared/schema";

export interface IStorage {
  // Node management
  createNode(node: InsertNode): Promise<Node>;
  getNode(nodeId: string): Promise<Node | undefined>;
  getNodeByLicenseId(licenseId: string): Promise<Node | undefined>;
  getAllNodes(): Promise<Node[]>;
  getNodesWithSummary(): Promise<NodeWithSummary[]>;
  getNodesByTier(tier: string): Promise<Node[]>;
  getNodesByIdentity(identityId: string): Promise<Node[]>;
  
  // Telemetry
  recordHeartbeat(heartbeat: InsertTelemetryHeartbeat): Promise<TelemetryHeartbeat>;
  getHeartbeats(licenseId: string, since: Date): Promise<TelemetryHeartbeat[]>;
  updateTelemetrySummary(summary: InsertTelemetrySummary): Promise<TelemetrySummary>;
  getTelemetrySummary(licenseId: string): Promise<TelemetrySummary | undefined>;
  getAllTelemetrySummaries(): Promise<TelemetrySummary[]>;
  
  // Verification tasks
  createVerificationTask(task: InsertVerificationTask): Promise<VerificationTask>;
  getVerificationTask(taskId: string): Promise<VerificationTask | undefined>;
  getAllVerificationTasks(): Promise<VerificationTask[]>;
  updateVerificationTask(taskId: string, updates: Partial<VerificationTask>): Promise<VerificationTask | undefined>;
  getTasksByStatus(status: string): Promise<VerificationTask[]>;
  getTasksByWallet(wallet: string): Promise<VerificationTask[]>;
  
  // Bounties
  recordBounty(bounty: InsertBountyRecord): Promise<BountyRecord>;
  getBountiesByWallet(wallet: string): Promise<BountyRecord[]>;
  getBountiesByEpoch(epoch: string): Promise<BountyRecord[]>;
  
  // Rewards ledger
  createRewardRecord(reward: InsertRewardsLedger): Promise<RewardsLedger>;
  getRewardsByEpoch(epoch: string): Promise<RewardsLedger[]>;
  getRewardsByNode(nodeId: string): Promise<RewardsLedger[]>;
  updateRewardClaimed(id: string, txHash: string): Promise<RewardsLedger | undefined>;
  getAllRewards(): Promise<RewardsLedger[]>;
  
  // Governance
  updateGovernanceParams(params: InsertGovernanceParams): Promise<GovernanceParams>;
  getGovernanceParams(): Promise<GovernanceParams>;
  
  // Alerts
  createAlert(alert: InsertAlertRecord): Promise<AlertRecord>;
  getActiveAlerts(): Promise<AlertRecord[]>;
  resolveAlert(id: string): Promise<AlertRecord | undefined>;
  getAllAlerts(): Promise<AlertRecord[]>;
}

export class MemStorage implements IStorage {
  private nodes: Map<string, Node>;
  private heartbeats: Map<string, TelemetryHeartbeat>;
  private telemetrySummaries: Map<string, TelemetrySummary>;
  private verificationTasks: Map<string, VerificationTask>;
  private bountyRecords: Map<string, BountyRecord>;
  private rewardsLedger: Map<string, RewardsLedger>;
  private governanceParams: GovernanceParams;
  private alerts: Map<string, AlertRecord>;

  constructor() {
    this.nodes = new Map();
    this.heartbeats = new Map();
    this.telemetrySummaries = new Map();
    this.verificationTasks = new Map();
    this.bountyRecords = new Map();
    this.rewardsLedger = new Map();
    this.alerts = new Map();
    
    // Initialize default governance parameters
    this.governanceParams = {
      id: randomUUID(),
      nrp: 1000000,
      feuF: 15,
      feuP: 8,
      feuV: 1,
      slaFounder: 99,
      slaProfessional: 98,
      slaVerifier: 95,
      baseBountyRate: 50,
      jobWeights: { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 },
      dampenerTable: { "1": 1.0, "2": 0.7, "3": 0.5, "4": 0.25 },
      epochLength: 24,
      maxEpochSpend: 1000000,
      updatedAt: new Date()
    };
    
    this.seedMockData();
  }

  private seedMockData() {
    // Create 48 Founding nodes (3 identities with 16 nodes each)
    for (let i = 1; i <= 48; i++) {
      const identityGroup = Math.ceil(i / 16);
      const node: Node = {
        nodeId: randomUUID(),
        licenseId: `F-LICENSE-${i.toString().padStart(4, '0')}`,
        identityId: `IDENTITY-${identityGroup.toString().padStart(8, '0')}`,
        tier: "founding",
        ownerWallet: `0x${Math.random().toString(16).substring(2, 42)}`,
        createdAt: new Date()
      };
      this.nodes.set(node.nodeId, node);
      
      // Add telemetry summary
      const summary: TelemetrySummary = {
        id: randomUUID(),
        licenseId: node.licenseId,
        uptime24h: 98 + Math.random() * 2,
        slaPass: true,
        status: "green",
        lastUpdate: new Date()
      };
      this.telemetrySummaries.set(node.licenseId, summary);
    }
    
    // Create 32 Professional nodes
    for (let i = 1; i <= 32; i++) {
      const node: Node = {
        nodeId: randomUUID(),
        licenseId: `P-LICENSE-${i.toString().padStart(4, '0')}`,
        identityId: `IDENTITY-${(i + 100).toString().padStart(8, '0')}`,
        tier: "professional",
        ownerWallet: `0x${Math.random().toString(16).substring(2, 42)}`,
        createdAt: new Date()
      };
      this.nodes.set(node.nodeId, node);
      
      const summary: TelemetrySummary = {
        id: randomUUID(),
        licenseId: node.licenseId,
        uptime24h: 96 + Math.random() * 3,
        slaPass: Math.random() > 0.1,
        status: Math.random() > 0.1 ? "green" : "amber",
        lastUpdate: new Date()
      };
      this.telemetrySummaries.set(node.licenseId, summary);
    }
    
    // Create 30 Verifier nodes
    for (let i = 1; i <= 30; i++) {
      const node: Node = {
        nodeId: randomUUID(),
        licenseId: `V-LICENSE-${i.toString().padStart(4, '0')}`,
        identityId: `IDENTITY-${(i + 200).toString().padStart(8, '0')}`,
        tier: "verifier",
        ownerWallet: `0x${Math.random().toString(16).substring(2, 42)}`,
        createdAt: new Date()
      };
      this.nodes.set(node.nodeId, node);
      
      const summary: TelemetrySummary = {
        id: randomUUID(),
        licenseId: node.licenseId,
        uptime24h: 94 + Math.random() * 4,
        slaPass: Math.random() > 0.05,
        status: Math.random() > 0.15 ? "green" : Math.random() > 0.5 ? "amber" : "red",
        lastUpdate: new Date()
      };
      this.telemetrySummaries.set(node.licenseId, summary);
    }
    
    // Create some verification tasks
    const verifierLicenses = Array.from(this.nodes.values())
      .filter(n => n.tier === "verifier")
      .map(n => n.ownerWallet);
    
    const statuses = ["assigned", "in_progress", "review", "completed", "upheld", "overturned"];
    for (let i = 1; i <= 50; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const task: VerificationTask = {
        taskId: randomUUID(),
        jobId: `JOB-${i.toString().padStart(6, '0')}`,
        assignedTo: verifierLicenses[Math.floor(Math.random() * verifierLicenses.length)],
        weight: Math.floor(Math.random() * 5) + 1,
        status,
        accuracyScore: status === "upheld" || status === "completed" ? 0.7 + Math.random() * 0.3 : null,
        bountyAmount: status === "upheld" ? (50 * (Math.floor(Math.random() * 5) + 1) * (0.7 + Math.random() * 0.3)) : null,
        evidence: status !== "assigned" ? "Sample evidence data" : null,
        aiAnalysis: status === "completed" || status === "upheld" ? "AI analysis complete" : null,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        completedAt: status === "completed" || status === "upheld" || status === "overturned" ? new Date() : null
      };
      this.verificationTasks.set(task.taskId, task);
    }
    
    // Create reward ledger entries for latest epoch
    const epoch = new Date().toISOString().split('T')[0];
    Array.from(this.nodes.values()).forEach(node => {
      const summary = this.telemetrySummaries.get(node.licenseId);
      if (!summary?.slaPass) return;
      
      let feuUsed = 0;
      if (node.tier === "founding") feuUsed = 15;
      else if (node.tier === "professional") feuUsed = 8;
      else feuUsed = 1;
      
      const baseReward = feuUsed * (1000000 / 1000);
      const bountyReward = Math.random() * 500;
      
      const reward: RewardsLedger = {
        id: randomUUID(),
        epoch,
        nodeId: node.nodeId,
        feuUsed,
        baseReward,
        bountyReward,
        totalReward: baseReward + bountyReward,
        claimed: Math.random() > 0.3,
        txHash: Math.random() > 0.3 ? `0x${Math.random().toString(16).substring(2, 66)}` : null,
        createdAt: new Date()
      };
      this.rewardsLedger.set(reward.id, reward);
    });
  }

  // Node management
  async createNode(insertNode: InsertNode): Promise<Node> {
    const node: Node = {
      ...insertNode,
      nodeId: randomUUID(),
      createdAt: new Date()
    };
    this.nodes.set(node.nodeId, node);
    return node;
  }

  async getNode(nodeId: string): Promise<Node | undefined> {
    return this.nodes.get(nodeId);
  }

  async getNodeByLicenseId(licenseId: string): Promise<Node | undefined> {
    return Array.from(this.nodes.values()).find(n => n.licenseId === licenseId);
  }

  async getAllNodes(): Promise<Node[]> {
    return Array.from(this.nodes.values());
  }

  async getNodesWithSummary(): Promise<NodeWithSummary[]> {
    return Array.from(this.nodes.values()).map(node => ({
      ...node,
      summary: this.telemetrySummaries.get(node.licenseId),
      effectiveFeu: this.calculateEffectiveFeu(node)
    }));
  }

  async getNodesByTier(tier: string): Promise<Node[]> {
    return Array.from(this.nodes.values()).filter(n => n.tier === tier);
  }

  async getNodesByIdentity(identityId: string): Promise<Node[]> {
    return Array.from(this.nodes.values()).filter(n => n.identityId === identityId);
  }

  private calculateEffectiveFeu(node: Node): number {
    if (node.tier !== "founding") {
      return node.tier === "professional" ? 8 : 1;
    }
    
    // Count Founder licenses for this identity
    const identityNodes = Array.from(this.nodes.values())
      .filter(n => n.identityId === node.identityId && n.tier === "founding")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const position = identityNodes.findIndex(n => n.nodeId === node.nodeId) + 1;
    const dampener = position === 1 ? 1.0 : position === 2 ? 0.7 : position === 3 ? 0.5 : 0.25;
    
    return 15 * dampener;
  }

  // Telemetry
  async recordHeartbeat(insertHeartbeat: InsertTelemetryHeartbeat): Promise<TelemetryHeartbeat> {
    const heartbeat: TelemetryHeartbeat = {
      ...insertHeartbeat,
      id: randomUUID(),
      timestamp: new Date()
    };
    this.heartbeats.set(heartbeat.id, heartbeat);
    return heartbeat;
  }

  async getHeartbeats(licenseId: string, since: Date): Promise<TelemetryHeartbeat[]> {
    return Array.from(this.heartbeats.values())
      .filter(h => h.licenseId === licenseId && h.timestamp >= since);
  }

  async updateTelemetrySummary(insertSummary: InsertTelemetrySummary): Promise<TelemetrySummary> {
    const existing = this.telemetrySummaries.get(insertSummary.licenseId);
    const summary: TelemetrySummary = {
      ...insertSummary,
      id: existing?.id || randomUUID(),
      lastUpdate: new Date()
    };
    this.telemetrySummaries.set(insertSummary.licenseId, summary);
    return summary;
  }

  async getTelemetrySummary(licenseId: string): Promise<TelemetrySummary | undefined> {
    return this.telemetrySummaries.get(licenseId);
  }

  async getAllTelemetrySummaries(): Promise<TelemetrySummary[]> {
    return Array.from(this.telemetrySummaries.values());
  }

  // Verification tasks
  async createVerificationTask(insertTask: InsertVerificationTask): Promise<VerificationTask> {
    const task: VerificationTask = {
      ...insertTask,
      taskId: randomUUID(),
      createdAt: new Date(),
      completedAt: null
    };
    this.verificationTasks.set(task.taskId, task);
    return task;
  }

  async getVerificationTask(taskId: string): Promise<VerificationTask | undefined> {
    return this.verificationTasks.get(taskId);
  }

  async getAllVerificationTasks(): Promise<VerificationTask[]> {
    return Array.from(this.verificationTasks.values());
  }

  async updateVerificationTask(taskId: string, updates: Partial<VerificationTask>): Promise<VerificationTask | undefined> {
    const task = this.verificationTasks.get(taskId);
    if (!task) return undefined;
    
    const updated = { ...task, ...updates };
    if (updates.status === "completed" || updates.status === "upheld" || updates.status === "overturned") {
      updated.completedAt = new Date();
    }
    this.verificationTasks.set(taskId, updated);
    return updated;
  }

  async getTasksByStatus(status: string): Promise<VerificationTask[]> {
    return Array.from(this.verificationTasks.values()).filter(t => t.status === status);
  }

  async getTasksByWallet(wallet: string): Promise<VerificationTask[]> {
    return Array.from(this.verificationTasks.values()).filter(t => t.assignedTo === wallet);
  }

  // Bounties
  async recordBounty(insertBounty: InsertBountyRecord): Promise<BountyRecord> {
    const bounty: BountyRecord = {
      ...insertBounty,
      id: randomUUID(),
      createdAt: new Date()
    };
    this.bountyRecords.set(bounty.id, bounty);
    return bounty;
  }

  async getBountiesByWallet(wallet: string): Promise<BountyRecord[]> {
    return Array.from(this.bountyRecords.values()).filter(b => b.wallet === wallet);
  }

  async getBountiesByEpoch(epoch: string): Promise<BountyRecord[]> {
    return Array.from(this.bountyRecords.values()).filter(b => b.epochDate === epoch);
  }

  // Rewards ledger
  async createRewardRecord(insertReward: InsertRewardsLedger): Promise<RewardsLedger> {
    const reward: RewardsLedger = {
      ...insertReward,
      id: randomUUID(),
      createdAt: new Date()
    };
    this.rewardsLedger.set(reward.id, reward);
    return reward;
  }

  async getRewardsByEpoch(epoch: string): Promise<RewardsLedger[]> {
    return Array.from(this.rewardsLedger.values()).filter(r => r.epoch === epoch);
  }

  async getRewardsByNode(nodeId: string): Promise<RewardsLedger[]> {
    return Array.from(this.rewardsLedger.values()).filter(r => r.nodeId === nodeId);
  }

  async updateRewardClaimed(id: string, txHash: string): Promise<RewardsLedger | undefined> {
    const reward = this.rewardsLedger.get(id);
    if (!reward) return undefined;
    
    const updated = { ...reward, claimed: true, txHash };
    this.rewardsLedger.set(id, updated);
    return updated;
  }

  async getAllRewards(): Promise<RewardsLedger[]> {
    return Array.from(this.rewardsLedger.values());
  }

  // Governance
  async updateGovernanceParams(params: InsertGovernanceParams): Promise<GovernanceParams> {
    this.governanceParams = {
      ...params,
      id: this.governanceParams.id,
      updatedAt: new Date()
    };
    return this.governanceParams;
  }

  async getGovernanceParams(): Promise<GovernanceParams> {
    return this.governanceParams;
  }

  // Alerts
  async createAlert(insertAlert: InsertAlertRecord): Promise<AlertRecord> {
    const alert: AlertRecord = {
      ...insertAlert,
      id: randomUUID(),
      createdAt: new Date()
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async getActiveAlerts(): Promise<AlertRecord[]> {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  async resolveAlert(id: string): Promise<AlertRecord | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updated = { ...alert, resolved: true };
    this.alerts.set(id, updated);
    return updated;
  }

  async getAllAlerts(): Promise<AlertRecord[]> {
    return Array.from(this.alerts.values());
  }
}

import { DBStorage } from './db-storage';

// Use database storage
export const storage = new DBStorage();

// Keep MemStorage for reference/testing if needed
// export const storage = new MemStorage();
