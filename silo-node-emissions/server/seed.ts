import { DBStorage } from './db-storage';
import type { InsertNode, InsertTelemetrySummary, InsertVerificationTask, InsertRewardsLedger } from '../shared/schema';

async function seed() {
  const storage = new DBStorage();
  
  console.log('Seeding database...');
  
  // Ensure governance params exist
  await storage.getGovernanceParams();
  console.log('✓ Governance params initialized');
  
  // Create 48 Founding nodes (3 identities with 16 nodes each)
  const foundingNodes = [];
  for (let i = 1; i <= 48; i++) {
    const identityGroup = Math.ceil(i / 16);
    const nodeData: InsertNode = {
      licenseId: `F-LICENSE-${i.toString().padStart(4, '0')}`,
      identityId: `IDENTITY-${identityGroup.toString().padStart(8, '0')}`,
      tier: "founding",
      ownerWallet: `0x${Math.random().toString(16).substring(2, 42)}`
    };
    const node = await storage.createNode(nodeData);
    foundingNodes.push(node);
    
    // Add telemetry summary
    const summaryData: InsertTelemetrySummary = {
      licenseId: node.licenseId,
      uptime24h: 98 + Math.random() * 2,
      slaPass: true,
      status: "green"
    };
    await storage.updateTelemetrySummary(summaryData);
  }
  console.log('✓ Created 48 Founding nodes');
  
  // Create 32 Professional nodes
  const professionalNodes = [];
  for (let i = 1; i <= 32; i++) {
    const nodeData: InsertNode = {
      licenseId: `P-LICENSE-${i.toString().padStart(4, '0')}`,
      identityId: `IDENTITY-${(i + 100).toString().padStart(8, '0')}`,
      tier: "professional",
      ownerWallet: `0x${Math.random().toString(16).substring(2, 42)}`
    };
    const node = await storage.createNode(nodeData);
    professionalNodes.push(node);
    
    const summaryData: InsertTelemetrySummary = {
      licenseId: node.licenseId,
      uptime24h: 96 + Math.random() * 3,
      slaPass: Math.random() > 0.1,
      status: Math.random() > 0.1 ? "green" : "amber"
    };
    await storage.updateTelemetrySummary(summaryData);
  }
  console.log('✓ Created 32 Professional nodes');
  
  // Create 30 Verifier nodes
  const verifierNodes = [];
  for (let i = 1; i <= 30; i++) {
    const nodeData: InsertNode = {
      licenseId: `V-LICENSE-${i.toString().padStart(4, '0')}`,
      identityId: `IDENTITY-${(i + 200).toString().padStart(8, '0')}`,
      tier: "verifier",
      ownerWallet: `0x${Math.random().toString(16).substring(2, 42)}`
    };
    const node = await storage.createNode(nodeData);
    verifierNodes.push(node);
    
    const summaryData: InsertTelemetrySummary = {
      licenseId: node.licenseId,
      uptime24h: 94 + Math.random() * 4,
      slaPass: Math.random() > 0.05,
      status: Math.random() > 0.15 ? "green" : Math.random() > 0.5 ? "amber" : "red"
    };
    await storage.updateTelemetrySummary(summaryData);
  }
  console.log('✓ Created 30 Verifier nodes');
  
  // Create verification tasks
  const statuses = ["assigned", "in_progress", "review", "completed", "upheld", "overturned"];
  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
    const wallet = verifierNodes[Math.floor(Math.random() * verifierNodes.length)].ownerWallet;
    
    const taskData: InsertVerificationTask = {
      jobId: `JOB-${i.toString().padStart(6, '0')}`,
      assignedTo: wallet,
      weight: Math.floor(Math.random() * 5) + 1,
      status,
      accuracyScore: status === "upheld" || status === "completed" ? 0.7 + Math.random() * 0.3 : null,
      bountyAmount: status === "upheld" ? (50 * (Math.floor(Math.random() * 5) + 1) * (0.7 + Math.random() * 0.3)) : null,
      evidence: status !== "assigned" ? "Sample evidence data" : null,
      aiAnalysis: status === "completed" || status === "upheld" ? "AI analysis complete" : null
    };
    
    await storage.createVerificationTask(taskData);
  }
  console.log('✓ Created 50 verification tasks');
  
  // Create reward ledger entries for latest epoch
  const epoch = new Date().toISOString().split('T')[0];
  const allNodes = [...foundingNodes, ...professionalNodes, ...verifierNodes];
  
  for (const node of allNodes) {
    const summary = await storage.getTelemetrySummary(node.licenseId);
    if (!summary?.slaPass) continue;
    
    let feuUsed = 0;
    if (node.tier === "founding") feuUsed = 15;
    else if (node.tier === "professional") feuUsed = 8;
    else feuUsed = 1;
    
    const baseReward = feuUsed * (1000000 / 1000);
    const bountyReward = Math.random() * 500;
    
    const rewardData: InsertRewardsLedger = {
      epoch,
      nodeId: node.nodeId,
      feuUsed,
      baseReward,
      bountyReward,
      totalReward: baseReward + bountyReward,
      claimed: Math.random() > 0.3,
      txHash: Math.random() > 0.3 ? `0x${Math.random().toString(16).substring(2, 66)}` : null
    };
    
    await storage.createRewardRecord(rewardData);
  }
  console.log('✓ Created reward ledger entries');
  
  console.log('✅ Database seeded successfully');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
