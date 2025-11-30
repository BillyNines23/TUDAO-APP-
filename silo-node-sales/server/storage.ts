import { type Buyer, type InsertBuyer, type UpdateBuyer, buyers } from "@shared/schema";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, desc, and, count, sql as drizzleSql } from 'drizzle-orm';

export interface IStorage {
  createBuyer(buyer: InsertBuyer): Promise<Buyer>;
  createBuyerWithCapCheck(buyer: InsertBuyer, cap?: number): Promise<Buyer>;
  getBuyerByWallet(wallet: string): Promise<Buyer | null>;
  getBuyerById(id: string): Promise<Buyer | null>;
  getBuyerByLicenseId(licenseId: string): Promise<Buyer | null>;
  updateBuyer(id: string, updates: UpdateBuyer): Promise<Buyer>;
  updateBuyerWithCapCheck(id: string, updates: UpdateBuyer, cap?: number): Promise<Buyer>;
  getAllBuyers(): Promise<Buyer[]>;
  getActiveCountByTier(tier: string): Promise<number>;
}

export class DrizzleStorage implements IStorage {
  private db;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    console.log("Initializing Drizzle with PostgreSQL database");
    const sql = neon(databaseUrl);
    this.db = drizzle(sql);
  }

  async createBuyer(insertBuyer: InsertBuyer): Promise<Buyer> {
    try {
      const [buyer] = await this.db
        .insert(buyers)
        .values(insertBuyer)
        .returning();
      
      if (!buyer) {
        throw new Error("Failed to create buyer: no data returned");
      }
      
      return buyer;
    } catch (error: any) {
      throw new Error(`Failed to create buyer: ${error.message}`);
    }
  }

  async getBuyerByWallet(wallet: string): Promise<Buyer | null> {
    try {
      const [buyer] = await this.db
        .select()
        .from(buyers)
        .where(eq(buyers.wallet, wallet))
        .orderBy(desc(buyers.createdAt))
        .limit(1);
      
      return buyer || null;
    } catch (error: any) {
      throw new Error(`Failed to get buyer: ${error.message}`);
    }
  }

  async getBuyerById(id: string): Promise<Buyer | null> {
    try {
      const [buyer] = await this.db
        .select()
        .from(buyers)
        .where(eq(buyers.id, id))
        .limit(1);
      
      return buyer || null;
    } catch (error: any) {
      throw new Error(`Failed to get buyer: ${error.message}`);
    }
  }

  async getBuyerByLicenseId(licenseId: string): Promise<Buyer | null> {
    try {
      const [buyer] = await this.db
        .select()
        .from(buyers)
        .where(eq(buyers.licenseId, licenseId))
        .limit(1);
      
      return buyer || null;
    } catch (error: any) {
      throw new Error(`Failed to get buyer: ${error.message}`);
    }
  }

  async updateBuyer(id: string, updates: UpdateBuyer): Promise<Buyer> {
    try {
      const [buyer] = await this.db
        .update(buyers)
        .set(updates)
        .where(eq(buyers.id, id))
        .returning();
      
      if (!buyer) {
        throw new Error("Buyer not found");
      }
      
      return buyer;
    } catch (error: any) {
      throw new Error(`Failed to update buyer: ${error.message}`);
    }
  }

  async getAllBuyers(): Promise<Buyer[]> {
    try {
      const allBuyers = await this.db
        .select()
        .from(buyers)
        .orderBy(desc(buyers.createdAt));
      
      return allBuyers;
    } catch (error: any) {
      throw new Error(`Failed to get buyers: ${error.message}`);
    }
  }

  async getActiveCountByTier(tier: string): Promise<number> {
    try {
      // Use raw SQL for count query to avoid type issues
      const result = await this.db.execute<{ count: number }>(
        drizzleSql`SELECT COUNT(*)::int as count FROM buyers WHERE tier = ${tier} AND status = 'active'`
      );
      
      return result.rows[0]?.count || 0;
    } catch (error: any) {
      throw new Error(`Failed to count active ${tier} buyers: ${error.message}`);
    }
  }

  async createBuyerWithCapCheck(insertBuyer: InsertBuyer, cap: number = 300): Promise<Buyer> {
    try {
      // ATOMIC: Use single connection for lock + count + insert
      // PostgreSQL advisory locks are session-scoped, so everything must use the same connection
      const sql = neon(process.env.DATABASE_URL!);
      
      if (insertBuyer.tier === "Founder") {
        // Execute entire operation within single transaction on same connection
        await sql`BEGIN`;
        
        try {
          // Acquire advisory lock for Founder tier
          await sql`SELECT pg_advisory_xact_lock(hashtext('founder_tier_cap'))`;
          
          // Check count (lock is held, so this is atomic)
          const countResult = await sql`
            SELECT COUNT(*)::int as count 
            FROM buyers 
            WHERE tier = 'Founder' AND status = 'active'
          `;
          
          const currentCount = countResult[0]?.count || 0;
          
          if (currentCount >= cap) {
            // Don't ROLLBACK here - let catch block handle it
            throw new Error(`FOUNDER_CAP_EXCEEDED: ${currentCount}/${cap} Founding Nodes sold`);
          }
          
          // Insert buyer using same connection (critical for atomicity)
          const insertResult = await sql`
            INSERT INTO buyers (
              email, name, wallet, tier, price_usd, payment_method, 
              status, license_id, tx_hash, next_step, receipt_sent
            ) VALUES (
              ${insertBuyer.email}, 
              ${insertBuyer.name}, 
              ${insertBuyer.wallet}, 
              ${insertBuyer.tier}, 
              ${insertBuyer.priceUsd}, 
              ${insertBuyer.paymentMethod}, 
              ${insertBuyer.status}, 
              ${insertBuyer.licenseId}, 
              ${insertBuyer.txHash}, 
              ${insertBuyer.nextStep}, 
              ${insertBuyer.receiptSent}
            )
            RETURNING *
          `;
          
          await sql`COMMIT`;
          
          const buyer = insertResult[0] as Buyer;
          if (!buyer) {
            throw new Error("Failed to create buyer: no data returned");
          }
          
          return buyer;
        } catch (txError) {
          await sql`ROLLBACK`;
          throw txError;
        }
      } else {
        // Non-Founder tiers don't need cap check, use regular insert
        const result = await this.db
          .insert(buyers)
          .values(insertBuyer)
          .returning();
        
        const buyer = result[0];
        if (!buyer) {
          throw new Error("Failed to create buyer: no data returned");
        }
        
        return buyer;
      }
    } catch (error: any) {
      throw new Error(`Failed to create buyer: ${error.message}`);
    }
  }

  async updateBuyerWithCapCheck(id: string, updates: UpdateBuyer, cap: number = 300): Promise<Buyer> {
    try {
      // Get current buyer to check tier and current status
      const currentBuyer = await this.getBuyerById(id);
      if (!currentBuyer) {
        throw new Error("Buyer not found");
      }
      
      // If changing status to 'active' for Founder tier, check cap atomically
      if (updates.status === "active" && currentBuyer.tier === "Founder" && currentBuyer.status !== "active") {
        // ATOMIC: Use single connection for lock + count + update
        const sql = neon(process.env.DATABASE_URL!);
        
        await sql`BEGIN`;
        
        try {
          // Acquire advisory lock
          await sql`SELECT pg_advisory_xact_lock(hashtext('founder_tier_cap'))`;
          
          // Check count (lock is held, so this is atomic)
          const countResult = await sql`
            SELECT COUNT(*)::int as count 
            FROM buyers 
            WHERE tier = 'Founder' AND status = 'active'
          `;
          
          const currentCount = countResult[0]?.count || 0;
          
          if (currentCount >= cap) {
            // Don't ROLLBACK here - let catch block handle it
            throw new Error(`FOUNDER_CAP_EXCEEDED: Cannot activate - ${currentCount}/${cap} Founding Nodes sold`);
          }
          
          // Update buyer using same connection (critical for atomicity)
          const updateResult = await sql`
            UPDATE buyers 
            SET status = ${updates.status}
            WHERE id = ${id}
            RETURNING *
          `;
          
          await sql`COMMIT`;
          
          const buyer = updateResult[0] as Buyer;
          if (!buyer) {
            throw new Error("Buyer not found");
          }
          
          return buyer;
        } catch (txError) {
          await sql`ROLLBACK`;
          throw txError;
        }
      }
      
      // For non-Founder or non-status-changing updates, use normal update
      return this.updateBuyer(id, updates);
    } catch (error: any) {
      throw new Error(`Failed to update buyer: ${error.message}`);
    }
  }
}

export const storage = new DrizzleStorage();
