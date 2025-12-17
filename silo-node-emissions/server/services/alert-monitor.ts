import { storage } from '../storage';
import type { InsertAlertRecord } from '../../shared/schema';

export interface AlertThresholds {
  slaBreachMinNodes: number; // Minimum nodes failing SLA to trigger alert
  verificationBacklog: number; // Number of pending tasks to trigger alert
  nrpUtilization: number; // Percentage (0-100) of NRP utilized to trigger alert
  whaleConcentration: number; // Percentage of total FEU held by top identity
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  slaBreachMinNodes: 5,
  verificationBacklog: 20,
  nrpUtilization: 95,
  whaleConcentration: 15
};

export class AlertMonitor {
  private thresholds: AlertThresholds;

  constructor(thresholds: AlertThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Run all alert checks and create alerts for violations
   */
  async runChecks(): Promise<void> {
    await Promise.all([
      this.checkSLABreaches(),
      this.checkVerificationBacklog(),
      this.checkNRPUtilization(),
      this.checkWhaleConcentration()
    ]);
  }

  /**
   * Check for SLA breaches across the network
   */
  private async checkSLABreaches(): Promise<void> {
    const summaries = await storage.getAllTelemetrySummaries();
    const failedNodes = summaries.filter(s => !s.slaPass);
    
    if (failedNodes.length >= this.thresholds.slaBreachMinNodes) {
      // Check if alert already exists
      const existingAlerts = await storage.getActiveAlerts();
      const hasExisting = existingAlerts.some(a => a.alertType === 'sla_breach');
      
      if (!hasExisting) {
        const alert: InsertAlertRecord = {
          alertType: 'sla_breach',
          severity: 'high',
          message: `${failedNodes.length} nodes failing SLA requirements`,
          metadata: {
            failedCount: failedNodes.length,
            threshold: this.thresholds.slaBreachMinNodes,
            failedLicenses: failedNodes.slice(0, 10).map(n => n.licenseId)
          }
        };
        
        await storage.createAlert(alert);
      }
    } else {
      // Resolve existing SLA breach alerts if condition cleared
      const existingAlerts = await storage.getActiveAlerts();
      const slaAlerts = existingAlerts.filter(a => a.alertType === 'sla_breach');
      for (const alert of slaAlerts) {
        await storage.resolveAlert(alert.id);
      }
    }
  }

  /**
   * Check for verification task backlog
   */
  private async checkVerificationBacklog(): Promise<void> {
    const assignedTasks = await storage.getTasksByStatus('assigned');
    const inProgressTasks = await storage.getTasksByStatus('in_progress');
    const pendingCount = assignedTasks.length + inProgressTasks.length;
    
    if (pendingCount >= this.thresholds.verificationBacklog) {
      const existingAlerts = await storage.getActiveAlerts();
      const hasExisting = existingAlerts.some(a => a.alertType === 'verification_backlog');
      
      if (!hasExisting) {
        const alert: InsertAlertRecord = {
          alertType: 'verification_backlog',
          severity: 'medium',
          message: `High verification backlog: ${pendingCount} pending tasks`,
          metadata: {
            pendingCount,
            assignedCount: assignedTasks.length,
            inProgressCount: inProgressTasks.length,
            threshold: this.thresholds.verificationBacklog
          }
        };
        
        await storage.createAlert(alert);
      }
    } else {
      const existingAlerts = await storage.getActiveAlerts();
      const backlogAlerts = existingAlerts.filter(a => a.alertType === 'verification_backlog');
      for (const alert of backlogAlerts) {
        await storage.resolveAlert(alert.id);
      }
    }
  }

  /**
   * Check for NRP utilization exceeding threshold
   */
  private async checkNRPUtilization(): Promise<void> {
    const governance = await storage.getGovernanceParams();
    const epoch = new Date().toISOString().split('T')[0];
    const rewards = await storage.getRewardsByEpoch(epoch);
    
    const totalEmissions = rewards.reduce((sum, r) => sum + r.totalReward, 0);
    const utilizationPercent = (totalEmissions / governance.nrp) * 100;
    
    if (utilizationPercent >= this.thresholds.nrpUtilization) {
      const existingAlerts = await storage.getActiveAlerts();
      const hasExisting = existingAlerts.some(a => a.alertType === 'nrp_utilization');
      
      if (!hasExisting) {
        const alert: InsertAlertRecord = {
          alertType: 'nrp_utilization',
          severity: 'critical',
          message: `NRP utilization at ${utilizationPercent.toFixed(1)}% - approaching daily limit`,
          metadata: {
            utilizationPercent: utilizationPercent.toFixed(2),
            totalEmissions,
            nrp: governance.nrp,
            threshold: this.thresholds.nrpUtilization
          }
        };
        
        await storage.createAlert(alert);
      }
    } else {
      const existingAlerts = await storage.getActiveAlerts();
      const nrpAlerts = existingAlerts.filter(a => a.alertType === 'nrp_utilization');
      for (const alert of nrpAlerts) {
        await storage.resolveAlert(alert.id);
      }
    }
  }

  /**
   * Check for whale concentration risk
   */
  private async checkWhaleConcentration(): Promise<void> {
    const allNodes = await storage.getAllNodes();
    const summaries = await storage.getAllTelemetrySummaries();
    const summaryMap = new Map(summaries.map(s => [s.licenseId, s]));
    
    // Group nodes by identity
    const identityMap = new Map<string, typeof allNodes>();
    allNodes.forEach(node => {
      const nodes = identityMap.get(node.identityId) || [];
      nodes.push(node);
      identityMap.set(node.identityId, nodes);
    });
    
    // Calculate total effective FEU
    let totalFeu = 0;
    const identityFeu = new Map<string, number>();
    
    for (const [identityId, nodes] of identityMap) {
      const founderNodes = nodes
        .filter(n => n.tier === 'founding')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      let identityTotal = 0;
      
      // Apply dampeners to founder nodes
      founderNodes.forEach((node, index) => {
        const summary = summaryMap.get(node.licenseId);
        if (!summary?.slaPass) return;
        
        const dampener = index === 0 ? 1.0 : index === 1 ? 0.7 : index === 2 ? 0.5 : 0.25;
        identityTotal += 15 * dampener;
      });
      
      // Add professional and verifier nodes
      nodes.forEach(node => {
        if (node.tier === 'founding') return;
        const summary = summaryMap.get(node.licenseId);
        if (!summary?.slaPass) return;
        
        identityTotal += node.tier === 'professional' ? 8 : 1;
      });
      
      identityFeu.set(identityId, identityTotal);
      totalFeu += identityTotal;
    }
    
    // Find top identity
    let maxFeu = 0;
    let topIdentity = '';
    
    for (const [identityId, feu] of identityFeu) {
      if (feu > maxFeu) {
        maxFeu = feu;
        topIdentity = identityId;
      }
    }
    
    const concentrationPercent = totalFeu > 0 ? (maxFeu / totalFeu) * 100 : 0;
    
    if (concentrationPercent >= this.thresholds.whaleConcentration) {
      const existingAlerts = await storage.getActiveAlerts();
      const hasExisting = existingAlerts.some(a => a.alertType === 'whale_concentration');
      
      if (!hasExisting) {
        const alert: InsertAlertRecord = {
          alertType: 'whale_concentration',
          severity: 'medium',
          message: `High whale concentration: Top identity controls ${concentrationPercent.toFixed(1)}% of network power`,
          metadata: {
            concentrationPercent: concentrationPercent.toFixed(2),
            topIdentity,
            topIdentityFeu: maxFeu,
            totalFeu,
            threshold: this.thresholds.whaleConcentration
          }
        };
        
        await storage.createAlert(alert);
      }
    } else {
      const existingAlerts = await storage.getActiveAlerts();
      const whaleAlerts = existingAlerts.filter(a => a.alertType === 'whale_concentration');
      for (const alert of whaleAlerts) {
        await storage.resolveAlert(alert.id);
      }
    }
  }

  /**
   * Get current alert statistics
   */
  async getAlertStats(): Promise<{
    activeCount: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const activeAlerts = await storage.getActiveAlerts();
    
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    activeAlerts.forEach(alert => {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.alertType] = (byType[alert.alertType] || 0) + 1;
    });
    
    return {
      activeCount: activeAlerts.length,
      bySeverity,
      byType
    };
  }
}

export const alertMonitor = new AlertMonitor();
