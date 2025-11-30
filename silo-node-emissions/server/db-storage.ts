import { eq, gte, desc, and } from 'drizzle-orm';
import { db } from './db';
import type { IStorage } from './storage';
import type {
  Node, InsertNode,
  TelemetryHeartbeat, InsertTelemetryHeartbeat,
  TelemetrySummary, InsertTelemetrySummary,
  VerificationTask, InsertVerificationTask,
  BountyRecord, InsertBountyRecord,
  RewardsLedger, InsertRewardsLedger,
  GovernanceParams, InsertGovernanceParams,
  AlertRecord, InsertAlertRecord,
  NodeWithSummary
} from '@shared/schema';
import {
  nodes,
  telemetryHeartbeat,
  telemetrySummary,
  verificationTasks,
  bountyRecords,
  rewardsLedger,
  governanceParams,
  alertRecords
} from '@shared/schema';

export class DBStorage implements IStorage {
  // Node management
  async createNode(insertNode: InsertNode): Promise<Node> {
    const [node] = await db.insert(nodes).values(insertNode).returning();
    return node;
  }

  async getNode(nodeId: string): Promise<Node | undefined> {
    const results = await db.select().from(nodes).where(eq(nodes.nodeId, nodeId));
    return results[0];
  }

  async getNodeByLicenseId(licenseId: string): Promise<Node | undefined> {
    const results = await db.select().from(nodes).where(eq(nodes.licenseId, licenseId));
    return results[0];
  }

  async getAllNodes(): Promise<Node[]> {
    return await db.select().from(nodes);
  }

  async getNodesWithSummary(): Promise<NodeWithSummary[]> {
    const allNodes = await db.select().from(nodes);
    const summaries = await db.select().from(telemetrySummary);
    
    const summaryMap = new Map(summaries.map(s => [s.licenseId, s]));
    
    return allNodes.map(node => ({
      ...node,
      summary: summaryMap.get(node.licenseId),
      effectiveFeu: this.calculateEffectiveFeu(node, allNodes)
    }));
  }

  async getNodesByTier(tier: string): Promise<Node[]> {
    return await db.select().from(nodes).where(eq(nodes.tier, tier));
  }

  async getNodesByIdentity(identityId: string): Promise<Node[]> {
    return await db.select().from(nodes).where(eq(nodes.identityId, identityId));
  }

  private calculateEffectiveFeu(node: Node, allNodes: Node[]): number {
    if (node.tier !== "founding") {
      return node.tier === "professional" ? 8 : 1;
    }
    
    // Count Founder licenses for this identity
    const identityNodes = allNodes
      .filter(n => n.identityId === node.identityId && n.tier === "founding")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const position = identityNodes.findIndex(n => n.nodeId === node.nodeId) + 1;
    const dampener = position === 1 ? 1.0 : position === 2 ? 0.7 : position === 3 ? 0.5 : 0.25;
    
    return 15 * dampener;
  }

  // Telemetry
  async recordHeartbeat(insertHeartbeat: InsertTelemetryHeartbeat): Promise<TelemetryHeartbeat> {
    const [heartbeat] = await db.insert(telemetryHeartbeat).values(insertHeartbeat).returning();
    return heartbeat;
  }

  async getHeartbeats(licenseId: string, since: Date): Promise<TelemetryHeartbeat[]> {
    return await db.select()
      .from(telemetryHeartbeat)
      .where(
        and(
          eq(telemetryHeartbeat.licenseId, licenseId),
          gte(telemetryHeartbeat.timestamp, since)
        )
      );
  }

  async updateTelemetrySummary(insertSummary: InsertTelemetrySummary): Promise<TelemetrySummary> {
    // Try to update existing summary first
    const existing = await this.getTelemetrySummary(insertSummary.licenseId);
    
    if (existing) {
      const [updated] = await db.update(telemetrySummary)
        .set({ ...insertSummary, lastUpdate: new Date() })
        .where(eq(telemetrySummary.licenseId, insertSummary.licenseId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(telemetrySummary).values(insertSummary).returning();
      return created;
    }
  }

  async getTelemetrySummary(licenseId: string): Promise<TelemetrySummary | undefined> {
    const results = await db.select().from(telemetrySummary).where(eq(telemetrySummary.licenseId, licenseId));
    return results[0];
  }

  async getAllTelemetrySummaries(): Promise<TelemetrySummary[]> {
    return await db.select().from(telemetrySummary);
  }

  // Verification tasks
  async createVerificationTask(insertTask: InsertVerificationTask): Promise<VerificationTask> {
    const [task] = await db.insert(verificationTasks).values(insertTask).returning();
    return task;
  }

  async getVerificationTask(taskId: string): Promise<VerificationTask | undefined> {
    const results = await db.select().from(verificationTasks).where(eq(verificationTasks.taskId, taskId));
    return results[0];
  }

  async getAllVerificationTasks(): Promise<VerificationTask[]> {
    return await db.select().from(verificationTasks).orderBy(desc(verificationTasks.createdAt));
  }

  async updateVerificationTask(taskId: string, updates: Partial<VerificationTask>): Promise<VerificationTask | undefined> {
    const updateData: any = { ...updates };
    
    if (updates.status === "completed" || updates.status === "upheld" || updates.status === "overturned") {
      updateData.completedAt = new Date();
    }
    
    const [updated] = await db.update(verificationTasks)
      .set(updateData)
      .where(eq(verificationTasks.taskId, taskId))
      .returning();
    return updated;
  }

  async getTasksByStatus(status: string): Promise<VerificationTask[]> {
    return await db.select().from(verificationTasks).where(eq(verificationTasks.status, status));
  }

  async getTasksByWallet(wallet: string): Promise<VerificationTask[]> {
    return await db.select().from(verificationTasks).where(eq(verificationTasks.assignedTo, wallet));
  }

  // Bounties
  async recordBounty(insertBounty: InsertBountyRecord): Promise<BountyRecord> {
    const [bounty] = await db.insert(bountyRecords).values(insertBounty).returning();
    return bounty;
  }

  async getBountiesByWallet(wallet: string): Promise<BountyRecord[]> {
    return await db.select().from(bountyRecords).where(eq(bountyRecords.wallet, wallet));
  }

  async getBountiesByEpoch(epoch: string): Promise<BountyRecord[]> {
    return await db.select().from(bountyRecords).where(eq(bountyRecords.epochDate, epoch));
  }

  // Rewards ledger
  async createRewardRecord(insertReward: InsertRewardsLedger): Promise<RewardsLedger> {
    const [reward] = await db.insert(rewardsLedger).values(insertReward).returning();
    return reward;
  }

  async getRewardsByEpoch(epoch: string): Promise<RewardsLedger[]> {
    return await db.select().from(rewardsLedger).where(eq(rewardsLedger.epoch, epoch));
  }

  async getRewardsByNode(nodeId: string): Promise<RewardsLedger[]> {
    return await db.select().from(rewardsLedger).where(eq(rewardsLedger.nodeId, nodeId));
  }

  async updateRewardClaimed(id: string, txHash: string): Promise<RewardsLedger | undefined> {
    const [updated] = await db.update(rewardsLedger)
      .set({ claimed: true, txHash })
      .where(eq(rewardsLedger.id, id))
      .returning();
    return updated;
  }

  async getAllRewards(): Promise<RewardsLedger[]> {
    return await db.select().from(rewardsLedger);
  }

  // Governance
  async updateGovernanceParams(params: InsertGovernanceParams): Promise<GovernanceParams> {
    // Get existing params
    const existing = await this.getGovernanceParams();
    
    if (existing) {
      const [updated] = await db.update(governanceParams)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(governanceParams.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(governanceParams).values(params).returning();
      return created;
    }
  }

  async getGovernanceParams(): Promise<GovernanceParams> {
    const results = await db.select().from(governanceParams).limit(1);
    if (results.length === 0) {
      // Return default governance params if none exist
      const defaultParams: InsertGovernanceParams = {
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
        maxEpochSpend: 1000000
      };
      const [created] = await db.insert(governanceParams).values(defaultParams).returning();
      return created;
    }
    return results[0];
  }

  // Alerts
  async createAlert(insertAlert: InsertAlertRecord): Promise<AlertRecord> {
    const [alert] = await db.insert(alertRecords).values(insertAlert).returning();
    return alert;
  }

  async getActiveAlerts(): Promise<AlertRecord[]> {
    return await db.select().from(alertRecords).where(eq(alertRecords.resolved, false));
  }

  async resolveAlert(id: string): Promise<AlertRecord | undefined> {
    const [updated] = await db.update(alertRecords)
      .set({ resolved: true })
      .where(eq(alertRecords.id, id))
      .returning();
    return updated;
  }

  async getAllAlerts(): Promise<AlertRecord[]> {
    return await db.select().from(alertRecords).orderBy(desc(alertRecords.createdAt));
  }
}
