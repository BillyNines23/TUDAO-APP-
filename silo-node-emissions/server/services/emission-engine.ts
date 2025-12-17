import { storage } from "../storage";
import type { EmissionCalculation } from "../../shared/schema";
import { MerkleTree } from "merkletreejs";
import crypto from "crypto";

export class EmissionEngine {
  async calculateDailyEmissions(epoch: string): Promise<EmissionCalculation> {
    const params = await storage.getGovernanceParams();
    const nodes = await storage.getNodesWithSummary();
    
    // Filter nodes that passed SLA
    const eligibleNodes = nodes.filter(node => {
      if (!node.summary) return false;
      
      const requiredSla = node.tier === "founding" ? params.slaFounder :
                          node.tier === "professional" ? params.slaProfessional :
                          params.slaVerifier;
      
      return node.summary.uptime24h >= requiredSla;
    });
    
    // Group Founding nodes by identity for whale dampener
    const identityMap = new Map<string, Array<{ nodeId: string, licenseId: string, createdAt: Date }>>();
    eligibleNodes.forEach(node => {
      if (node.tier === "founding") {
        if (!identityMap.has(node.identityId)) {
          identityMap.set(node.identityId, []);
        }
        identityMap.get(node.identityId)!.push({
          nodeId: node.nodeId,
          licenseId: node.licenseId,
          createdAt: node.createdAt
        });
      }
    });
    
    // Apply whale dampener to Founding nodes
    const dampenerApplied = new Map<string, number>();
    identityMap.forEach((identityNodes, identityId) => {
      // Sort by creation date to determine order
      const sortedNodes = identityNodes.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );
      
      sortedNodes.forEach((node, index) => {
        const position = index + 1;
        let dampener = 1.0;
        
        if (position === 1) dampener = 1.0;
        else if (position === 2) dampener = 0.7;
        else if (position === 3) dampener = 0.5;
        else dampener = 0.25;
        
        dampenerApplied.set(node.nodeId, dampener);
      });
    });
    
    // Calculate total FEU
    let totalFeu = 0;
    eligibleNodes.forEach(node => {
      if (node.tier === "founding") {
        const dampener = dampenerApplied.get(node.nodeId) || 1.0;
        totalFeu += params.feuF * dampener;
      } else if (node.tier === "professional") {
        totalFeu += params.feuP;
      } else {
        totalFeu += params.feuV;
      }
    });
    
    // Calculate reward per FEU
    const rewardPerFeu = totalFeu > 0 ? params.nrp / totalFeu : 0;
    
    // Get all bounties for this epoch once
    const epochBounties = await storage.getBountiesByEpoch(epoch);
    
    // Calculate individual node rewards
    const nodeRewards = eligibleNodes.map(node => {
      let feuUsed = 0;
      
      if (node.tier === "founding") {
        const dampener = dampenerApplied.get(node.nodeId) || 1.0;
        feuUsed = params.feuF * dampener;
      } else if (node.tier === "professional") {
        feuUsed = params.feuP;
      } else {
        feuUsed = params.feuV;
      }
      
      const baseReward = feuUsed * rewardPerFeu;
      
      // Add bounties for this node's wallet
      const nodeBounties = epochBounties.filter(b => {
        // Match bounties to node owner wallet
        const ownerNode = nodes.find(n => n.nodeId === node.nodeId);
        return ownerNode && b.wallet === ownerNode.ownerWallet;
      });
      
      const bountyReward = nodeBounties.reduce((sum, b) => sum + b.amount, 0);
      
      return {
        nodeId: node.nodeId,
        feuUsed,
        baseReward,
        bountyReward,
        totalReward: baseReward + bountyReward
      };
    });
    
    // Generate Merkle tree for claim proofs
    const leaves = nodeRewards.map(reward => 
      crypto.createHash('sha256')
        .update(`${reward.nodeId}:${reward.totalReward}`)
        .digest()
    );
    
    const hashFn = (data: Buffer) => crypto.createHash('sha256').update(data).digest();
    const merkleTree = new MerkleTree(leaves, hashFn, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot().toString('hex');
    
    // Store rewards in ledger
    for (const reward of nodeRewards) {
      await storage.createRewardRecord({
        epoch,
        nodeId: reward.nodeId,
        feuUsed: reward.feuUsed,
        baseReward: reward.baseReward,
        bountyReward: reward.bountyReward,
        totalReward: reward.totalReward,
        claimed: false,
        txHash: null
      });
    }
    
    return {
      epoch,
      totalFeu,
      rewardPerFeu,
      nodeRewards,
      merkleRoot
    };
  }
  
  async generateClaimProof(nodeId: string, epoch: string): Promise<{ proof: string[], merkleRoot: string } | null> {
    const rewards = await storage.getRewardsByEpoch(epoch);
    const nodeReward = rewards.find(r => r.nodeId === nodeId);
    
    if (!nodeReward) return null;
    
    // Regenerate Merkle tree
    const leaves = rewards.map(r => 
      crypto.createHash('sha256')
        .update(`${r.nodeId}:${r.totalReward}`)
        .digest()
    );
    
    const hashFn = (data: Buffer) => crypto.createHash('sha256').update(data).digest();
    const merkleTree = new MerkleTree(leaves, hashFn, { sortPairs: true });
    const leaf = crypto.createHash('sha256')
      .update(`${nodeId}:${nodeReward.totalReward}`)
      .digest();
    
    const proof = merkleTree.getProof(leaf).map(p => p.data.toString('hex'));
    const merkleRoot = merkleTree.getRoot().toString('hex');
    
    return { proof, merkleRoot };
  }
}

export const emissionEngine = new EmissionEngine();
