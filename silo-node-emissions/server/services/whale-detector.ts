import { storage } from "../storage";
import type { WhaleIdentity } from "../../shared/schema";

export class WhaleDetector {
  async getTopIdentities(limit: number = 10): Promise<WhaleIdentity[]> {
    const nodes = await storage.getAllNodes();
    const params = await storage.getGovernanceParams();
    
    // Group nodes by identity
    const identityMap = new Map<string, WhaleIdentity>();
    
    for (const node of nodes) {
      if (!identityMap.has(node.identityId)) {
        identityMap.set(node.identityId, {
          identityId: node.identityId,
          nodeCount: 0,
          rawFeu: 0,
          effectiveFeu: 0,
          dampenerApplied: 0,
          nodes: []
        });
      }
      
      const identity = identityMap.get(node.identityId)!;
      identity.nodeCount++;
      identity.nodes.push(node);
    }
    
    // Calculate FEU for each identity
    const identities = Array.from(identityMap.values());
    
    for (const identity of identities) {
      // Sort Founding nodes by creation date
      const founderNodes = identity.nodes
        .filter(n => n.tier === "founding")
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      const professionalNodes = identity.nodes.filter(n => n.tier === "professional");
      const verifierNodes = identity.nodes.filter(n => n.tier === "verifier");
      
      // Calculate raw FEU (without dampening)
      identity.rawFeu = 
        founderNodes.length * params.feuF +
        professionalNodes.length * params.feuP +
        verifierNodes.length * params.feuV;
      
      // Calculate effective FEU (with dampening)
      let effectiveFeu = 0;
      
      // Apply dampener to Founding nodes
      founderNodes.forEach((node, index) => {
        const position = index + 1;
        let dampener = 1.0;
        
        if (position === 1) dampener = 1.0;
        else if (position === 2) dampener = 0.7;
        else if (position === 3) dampener = 0.5;
        else dampener = 0.25;
        
        effectiveFeu += params.feuF * dampener;
      });
      
      // No dampening for Professional and Verifier
      effectiveFeu += professionalNodes.length * params.feuP;
      effectiveFeu += verifierNodes.length * params.feuV;
      
      identity.effectiveFeu = effectiveFeu;
      
      // Calculate average dampener applied
      if (identity.rawFeu > 0) {
        identity.dampenerApplied = effectiveFeu / identity.rawFeu;
      } else {
        identity.dampenerApplied = 1.0;
      }
    }
    
    // Sort by effective FEU (descending) and return top N
    return identities
      .sort((a, b) => b.effectiveFeu - a.effectiveFeu)
      .slice(0, limit);
  }
  
  async detectConcentrationRisks(): Promise<Array<{ type: string, message: string, severity: string }>> {
    const topIdentities = await this.getTopIdentities(10);
    const risks: Array<{ type: string, message: string, severity: string }> = [];
    
    if (topIdentities.length === 0) return risks;
    
    const totalEffectiveFeu = topIdentities.reduce((sum, id) => sum + id.effectiveFeu, 0);
    const topIdentityShare = topIdentities[0].effectiveFeu / totalEffectiveFeu;
    
    // Check for excessive concentration
    if (topIdentityShare > 0.15) {
      risks.push({
        type: "WHALE_CONCENTRATION",
        message: `Top identity controls ${(topIdentityShare * 100).toFixed(1)}% of effective FEU (threshold: 15%)`,
        severity: "warning"
      });
    }
    
    // Check for identities with many Founding nodes
    const highCountIdentities = topIdentities.filter(id => {
      const founderCount = id.nodes.filter(n => n.tier === "founding").length;
      return founderCount > 10;
    });
    
    if (highCountIdentities.length > 0) {
      risks.push({
        type: "HIGH_NODE_COUNT",
        message: `${highCountIdentities.length} identities hold more than 10 Founding licenses`,
        severity: "info"
      });
    }
    
    return risks;
  }
}

export const whaleDetector = new WhaleDetector();
