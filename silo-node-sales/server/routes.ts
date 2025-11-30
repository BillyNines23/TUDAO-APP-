import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBuyerSchema, updateBuyerSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import { SquareClient, SquareEnvironment } from "square";
import { mintNFT, isNFTMintingConfigured, getMinterWalletAddress, checkNFTOwner } from "./nft-minting";

// Stripe integration from blueprint:javascript_stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Square integration for card payments
const TEST_MODE = process.env.TEST_MODE === "true";

if (!process.env.SQUARE_ACCESS_TOKEN) {
  throw new Error('Missing required Square secret: SQUARE_ACCESS_TOKEN');
}

const squareEnvironment = TEST_MODE ? SquareEnvironment.Sandbox : SquareEnvironment.Production;

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: squareEnvironment,
});

// Debug logging (safe - only shows length and first/last chars)
console.log('✅ Square client initialized:');
console.log(`   Environment: ${TEST_MODE ? 'Sandbox (Test)' : 'Production'}`);
const token = process.env.SQUARE_ACCESS_TOKEN || '';
console.log(`   Access Token: ${token.substring(0, 6)}...${token.substring(token.length - 4)} (length: ${token.length})`);
console.log(`   Location ID: ${process.env.VITE_SQUARE_LOCATION_ID}`);

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint to expose test mode status to frontend
  app.get("/api/config", async (req, res) => {
    res.json({
      testMode: TEST_MODE,
      chainId: TEST_MODE ? 84532 : 8453,
      network: TEST_MODE ? "Base Sepolia" : "Base Mainnet",
    });
  });

  // Diagnostic endpoint to verify Square credentials
  app.get("/api/square-diagnostics", async (req, res) => {
    try {
      const response = await squareClient.locations.list();
      const locations = response.locations || [];
      
      res.json({
        success: true,
        accessTokenValid: true,
        locationsFound: locations.length,
        locations: locations.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          status: loc.status,
        })),
        expectedLocationId: process.env.VITE_SQUARE_LOCATION_ID,
        locationMatch: locations.some((loc: any) => loc.id === process.env.VITE_SQUARE_LOCATION_ID),
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      });
    }
  });

  // Generate a unique license ID
  function generateLicenseId(): string {
    const prefix = "NODE-";
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return prefix + random;
  }

  // Helper function to check Founder tier cap (300 nodes)
  async function checkFounderCap(tier: string): Promise<{ allowed: boolean; message?: string; count?: number }> {
    const FOUNDER_CAP = 300;
    
    if (tier !== "Founder") {
      return { allowed: true };
    }
    
    const currentCount = await storage.getActiveCountByTier("Founder");
    
    if (currentCount >= FOUNDER_CAP) {
      return {
        allowed: false,
        message: `Founding Node Pass sold out (${FOUNDER_CAP}/${FOUNDER_CAP}). Only Verifier and Professional tiers available.`,
        count: currentCount,
      };
    }
    
    return {
      allowed: true,
      count: currentCount,
    };
  }

  // Stripe webhook endpoint - Must come before other routes
  // Handles payment_intent.succeeded for creating buyer records
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.warn("STRIPE_WEBHOOK_SECRET not set - webhook signature verification disabled");
      // In development, we can skip verification, but log a warning
      // In production, this should fail
    }

    let event: Stripe.Event;

    try {
      if (endpointSecret && sig) {
        // Verify webhook signature using raw body
        event = stripe.webhooks.constructEvent(
          req.rawBody as Buffer,
          sig,
          endpointSecret
        );
      } else {
        // Development mode - no signature verification
        event = JSON.parse(req.rawBody?.toString() || '{}');
      }
    } catch (err: any) {
      console.error(`⚠️  Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id}`);
          
          const metadata = paymentIntent.metadata;
          
          // CRITICAL: Cap enforcement moved to atomic createBuyerWithCapCheck
          // Note: We return 200 OK even if cap exceeded to prevent Stripe retry storms
          // The atomic method will throw FOUNDER_CAP_EXCEEDED error if limit reached
          
          // CRITICAL: Validate wallet address exists and is not a forbidden address
          if (!metadata.wallet || !metadata.wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
            console.error(`❌ Invalid or missing wallet address in payment intent ${paymentIntent.id}`);
            return res.status(400).json({ 
              error: "Payment metadata missing valid wallet address. NFT cannot be minted." 
            });
          }
          
          // CRITICAL: Block zero address and other forbidden addresses in webhook
          const walletLower = metadata.wallet.toLowerCase();
          const FORBIDDEN_ADDRESSES = [
            "0x0000000000000000000000000000000000000000", // Zero address - NFTs sent here are burned
            "0x000000000000000000000000000000000000dead", // Burn address
          ];
          
          if (FORBIDDEN_ADDRESSES.includes(walletLower)) {
            console.error(`❌ Forbidden wallet address in payment intent ${paymentIntent.id}: ${metadata.wallet}`);
            return res.status(400).json({
              error: "Cannot mint NFT to zero address or burn address. Payment will be refunded.",
              wallet: metadata.wallet,
            });
          }
          
          // Check if buyer already exists (idempotency)
          const existingBuyer = await storage.getBuyerByLicenseId(metadata.licenseId);
          
          if (!existingBuyer) {
            // Determine payment method from metadata or payment_method_types
            const paymentMethodType = metadata.paymentMethodType || 
              (paymentIntent.payment_method_types?.includes("us_bank_account") ? "ach" : "card");
            
            try {
              // ATOMIC: Use createBuyerWithCapCheck to prevent race conditions
              const buyer = await storage.createBuyerWithCapCheck({
                email: metadata.email || null,
                name: metadata.name || null,
              wallet: metadata.wallet,  // CRITICAL: Use real wallet from metadata, not temp wallet
              tier: metadata.tier as "Verifier" | "Professional" | "Founder",
              priceUsd: Math.round(paymentIntent.amount / 100),
              paymentMethod: paymentMethodType as "card" | "ach",
              status: "active",
              licenseId: metadata.licenseId,
              txHash: null, // Will be updated when NFT is minted
              nextStep: null,
              receiptSent: false,
            });
            
            console.log(`✅ Created buyer record for license: ${metadata.licenseId} via ${paymentMethodType}`);
            
            // Mint NFT to the buyer's wallet (only if not already minted)
            if (!buyer.txHash && isNFTMintingConfigured(buyer.tier)) {
              try {
                const txHash = await mintNFT({
                  tier: buyer.tier,
                  recipientAddress: buyer.wallet,
                  licenseId: buyer.licenseId,
                });
                
                // Update buyer record with transaction hash
                await storage.updateBuyer(buyer.id, { txHash });
                console.log(`✅ NFT minted and tx hash updated for license: ${buyer.licenseId}`);
              } catch (mintError: any) {
                console.error(`❌ Failed to mint NFT for license ${buyer.licenseId}:`, mintError.message);
                // Don't fail the webhook - buyer record is already created
                // Admin can manually retry minting later
              }
            } else if (buyer.txHash) {
              console.log(`ℹ️  NFT already minted for license: ${buyer.licenseId} (txHash: ${buyer.txHash})`);
            } else {
              console.warn(`⚠️  NFT minting not configured for ${buyer.tier} tier - skipping mint for license: ${buyer.licenseId}`);
            }
            } catch (capError: any) {
              // CRITICAL: Handle cap exceeded error gracefully
              // Return 200 OK to prevent Stripe retry storms, but log the error
              if (capError.message?.includes('FOUNDER_CAP_EXCEEDED')) {
                console.error(`❌ ${capError.message} - Payment intent: ${paymentIntent.id}`);
                console.error(`⚠️  Manual refund required for payment intent: ${paymentIntent.id}`);
                // TODO: Send alert to admin for manual refund
                // Still return 200 OK to acknowledge webhook receipt
              } else {
                throw capError; // Re-throw non-cap errors
              }
            }
          } else {
            console.log(`ℹ️  Buyer already exists for license: ${metadata.licenseId} (idempotent)`);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          console.log(`❌ Payment failed: ${failedPayment.id}`);
          // Could log to database for analytics
          break;

        default:
          console.log(`ℹ️  Unhandled event type: ${event.type}`);
      }
      
      // Return 200 to acknowledge receipt
      res.json({ received: true });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      // Still return 200 to prevent retry storms
      res.json({ received: true, error: error.message });
    }
  });

  // POST /api/buyers - Create a new buyer record after payment
  app.post("/api/buyers", async (req, res) => {
    try {
      const validatedData = insertBuyerSchema.parse(req.body);
      
      // Generate license ID if not provided
      const buyerData = {
        ...validatedData,
        licenseId: validatedData.licenseId || generateLicenseId(),
      };

      // ATOMIC: Use createBuyerWithCapCheck to prevent race conditions
      const buyer = await storage.createBuyerWithCapCheck(buyerData);
      
      // Mint NFT if payment is complete (not pending_wire) and not already minted
      if (buyer.status === "active" && !buyer.txHash && isNFTMintingConfigured(buyer.tier)) {
        try {
          const txHash = await mintNFT({
            tier: buyer.tier,
            recipientAddress: buyer.wallet,
            licenseId: buyer.licenseId,
          });
          
          // Update buyer record with transaction hash
          await storage.updateBuyer(buyer.id, { txHash });
          console.log(`✅ NFT minted for license: ${buyer.licenseId} (${buyer.paymentMethod})`);
          
          // Return updated buyer with tx hash
          const updatedBuyer = await storage.getBuyerById(buyer.id);
          res.json(updatedBuyer);
          return;
        } catch (mintError: any) {
          console.error(`❌ Failed to mint NFT for license ${buyer.licenseId}:`, mintError.message);
          // Return buyer anyway - admin can retry minting later
        }
      } else if (buyer.txHash) {
        console.log(`ℹ️  NFT already minted for license: ${buyer.licenseId} (idempotent)`);
      } else if (!isNFTMintingConfigured(buyer.tier)) {
        console.warn(`⚠️  NFT minting not configured for ${buyer.tier} tier - skipping mint for license: ${buyer.licenseId}`);
      }
      
      res.json(buyer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error creating buyer:", error);
        res.status(500).json({ error: "Failed to create buyer record" });
      }
    }
  });

  // GET /api/buyers/wallet/:wallet - Get buyer by wallet address
  app.get("/api/buyers/wallet/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const buyer = await storage.getBuyerByWallet(wallet);
      
      if (!buyer) {
        res.status(404).json({ error: "No license found for this wallet" });
        return;
      }

      res.json(buyer);
    } catch (error) {
      console.error("Error fetching buyer:", error);
      res.status(500).json({ error: "Failed to fetch buyer record" });
    }
  });

  // GET /api/buyers/:id - Get buyer by ID
  app.get("/api/buyers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const buyer = await storage.getBuyerById(id);
      
      if (!buyer) {
        res.status(404).json({ error: "Buyer not found" });
        return;
      }

      res.json(buyer);
    } catch (error) {
      console.error("Error fetching buyer:", error);
      res.status(500).json({ error: "Failed to fetch buyer record" });
    }
  });

  // GET /api/buyers/license/:licenseId - Get buyer by license ID
  app.get("/api/buyers/license/:licenseId", async (req, res) => {
    try {
      const { licenseId } = req.params;
      const buyer = await storage.getBuyerByLicenseId(licenseId);
      
      if (!buyer) {
        res.status(404).json({ error: "License not found" });
        return;
      }

      res.json(buyer);
    } catch (error) {
      console.error("Error fetching buyer by license:", error);
      res.status(500).json({ error: "Failed to fetch license record" });
    }
  });

  // PATCH /api/buyers/:id - Update buyer record (e.g., next_step preference)
  app.patch("/api/buyers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedUpdates = updateBuyerSchema.parse(req.body);
      
      const buyer = await storage.updateBuyer(id, validatedUpdates);
      res.json(buyer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error updating buyer:", error);
        res.status(500).json({ error: "Failed to update buyer record" });
      }
    }
  });

  // POST /api/wire-transfer - Submit wire transfer request
  app.post("/api/wire-transfer", async (req, res) => {
    try {
      const wireRequestSchema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        wallet: z.string().optional(), // Optional - will generate embedded wallet if not provided
        tier: z.enum(["Verifier", "Professional", "Founder"]),
        priceUsd: z.number().positive(),
      });

      const validatedData = wireRequestSchema.parse(req.body);
      
      // CRITICAL: Enforce Founding Node cap (300 nodes)
      const capCheck = await checkFounderCap(validatedData.tier);
      if (!capCheck.allowed) {
        return res.status(403).json({
          error: "Tier unavailable",
          message: capCheck.message,
          availableTiers: ["Verifier", "Professional"],
        });
      }
      
      // Generate temporary wallet if customer doesn't have one
      // This will be replaced with Thirdweb embedded wallet later
      const walletAddress = validatedData.wallet && validatedData.wallet.trim() !== "" 
        ? validatedData.wallet 
        : `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`;
      
      // Create buyer record with pending_wire status
      const buyer = await storage.createBuyer({
        email: validatedData.email,
        name: validatedData.name,
        wallet: walletAddress,
        tier: validatedData.tier,
        priceUsd: validatedData.priceUsd,
        paymentMethod: "wire",
        status: "pending_wire",
        licenseId: generateLicenseId(),
        txHash: null,
        nextStep: null,
        receiptSent: false,
      });

      // TODO: Send wire transfer instructions email (when email is enabled)
      // This would include bank details, reference number, etc.

      // Return wire transfer instructions immediately
      const wireInstructions = {
        bankName: process.env.WIRE_BANK_NAME,
        routingNumber: process.env.WIRE_ROUTING_NUMBER,
        accountNumber: process.env.WIRE_ACCOUNT_NUMBER,
        accountName: process.env.WIRE_ACCOUNT_NAME,
        bankAddress: process.env.WIRE_BANK_ADDRESS,
        amount: validatedData.priceUsd,
        referenceNumber: buyer.licenseId,
      };

      res.json({
        success: true,
        licenseId: buyer.licenseId,
        wireInstructions,
        message: "Wire transfer request submitted.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error submitting wire transfer:", error);
        res.status(500).json({ error: "Failed to submit wire transfer request" });
      }
    }
  });

  // POST /api/activate-wire-transfer/:licenseId - Admin endpoint to activate wire transfer and mint NFT
  app.post("/api/activate-wire-transfer/:licenseId", async (req, res) => {
    try {
      const { licenseId } = req.params;
      
      // Get buyer by license ID
      const buyer = await storage.getBuyerByLicenseId(licenseId);
      
      if (!buyer) {
        res.status(404).json({ error: "License not found" });
        return;
      }
      
      if (buyer.status !== "pending_wire") {
        res.status(400).json({ error: "License is not in pending_wire status" });
        return;
      }
      
      // Check if NFT already minted (idempotency for admin retries)
      if (buyer.txHash) {
        console.log(`ℹ️  NFT already minted for license: ${buyer.licenseId} (txHash: ${buyer.txHash})`);
        const updatedBuyer = await storage.getBuyerById(buyer.id);
        res.json(updatedBuyer);
        return;
      }
      
      // ATOMIC: Update status to active with cap check (prevents overflow via manual activation)
      await storage.updateBuyerWithCapCheck(buyer.id, { status: "active" });
      console.log(`✅ Activated wire transfer for license: ${licenseId}`);
      
      // Mint NFT (only if not already minted)
      if (isNFTMintingConfigured(buyer.tier)) {
        try {
          const txHash = await mintNFT({
            tier: buyer.tier,
            recipientAddress: buyer.wallet,
            licenseId: buyer.licenseId,
          });
          
          // Update buyer record with transaction hash
          await storage.updateBuyer(buyer.id, { txHash });
          console.log(`✅ NFT minted for wire transfer license: ${buyer.licenseId}`);
          
          // Return updated buyer
          const updatedBuyer = await storage.getBuyerById(buyer.id);
          res.json(updatedBuyer);
        } catch (mintError: any) {
          console.error(`❌ Failed to mint NFT for license ${buyer.licenseId}:`, mintError.message);
          // Return error - admin should retry
          res.status(500).json({ error: `License activated but NFT minting failed: ${mintError.message}` });
        }
      } else {
        console.warn(`⚠️  NFT minting not configured for ${buyer.tier} tier - wire transfer activated but no NFT minted`);
        const updatedBuyer = await storage.getBuyerById(buyer.id);
        res.json(updatedBuyer);
      }
    } catch (error) {
      console.error("Error activating wire transfer:", error);
      res.status(500).json({ error: "Failed to activate wire transfer" });
    }
  });

  // POST /api/create-payment-intent - Create Stripe payment intent for fiat payments
  // Based on blueprint:javascript_stripe
  // Supports both card and ACH (bank account) payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const schema = z.object({
        tier: z.enum(["Verifier", "Professional", "Founder"]),
        email: z.string().email().optional(),
        name: z.string().optional(),
        wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"), // CRITICAL: Require valid wallet
        paymentMethod: z.enum(["card", "ach"]).default("card"),
      });
      
      const { tier, email, name, wallet, paymentMethod } = schema.parse(req.body);
      
      // CRITICAL: Enforce Founding Node cap (300 nodes)
      const capCheck = await checkFounderCap(tier);
      if (!capCheck.allowed) {
        return res.status(403).json({
          error: "Tier unavailable",
          message: capCheck.message,
          availableTiers: ["Verifier", "Professional"],
        });
      }
      
      if (capCheck.count !== undefined) {
        console.log(`🔢 Founding Node progress: ${capCheck.count}/300 sold`);
      }
      
      // CRITICAL: Block known-bad addresses that cannot receive NFTs
      const walletLower = wallet.toLowerCase();
      const FORBIDDEN_ADDRESSES = [
        "0x0000000000000000000000000000000000000000", // Zero address - NFTs sent here are burned
        "0x000000000000000000000000000000000000dead", // Burn address
      ];
      
      if (FORBIDDEN_ADDRESSES.includes(walletLower)) {
        return res.status(400).json({
          error: "Invalid wallet address",
          message: "Cannot mint NFTs to zero address or burn address. Please use a real wallet you control.",
        });
      }
      
      // Get tier price from config
      const tierPrices = {
        Verifier: parseInt(process.env.VITE_TIER_VERIFIER_PRICE_USD || "500"),
        Professional: parseInt(process.env.VITE_TIER_PROFESSIONAL_PRICE_USD || "5000"),
        Founder: parseInt(process.env.VITE_TIER_FOUNDER_PRICE_USD || "10000"),
      };
      
      const amount = tierPrices[tier];
      
      // Configure payment method types based on selection
      const paymentMethodTypes: string[] = paymentMethod === "ach" 
        ? ["us_bank_account"] 
        : ["card"];
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        payment_method_types: paymentMethodTypes,
        metadata: {
          tier,
          email: email || "",
          name: name || "",
          wallet,  // CRITICAL: Include real wallet address for NFT minting
          licenseId: generateLicenseId(),
          paymentMethodType: paymentMethod,
        },
        description: `TUDAO ${tier} Node Pass License`,
        // For ACH, mandate acceptance is required
        ...(paymentMethod === "ach" && {
          mandate_data: {
            customer_acceptance: {
              type: "online",
              online: {
                ip_address: req.ip || "0.0.0.0",
                user_agent: req.headers["user-agent"] || "unknown",
              },
            },
          },
        }),
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        licenseId: paymentIntent.metadata.licenseId,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: "Error creating payment intent",
        message: error.message 
      });
    }
  });

  // POST /api/confirm-card-payment - Confirm successful payment and retrieve/update buyer record
  // Note: Webhook creates the buyer record; this endpoint retrieves it and updates wallet if needed
  app.post("/api/confirm-card-payment", async (req, res) => {
    try {
      const schema = z.object({
        paymentIntentId: z.string(),
        wallet: z.string(), // This will be the embedded wallet address
      });
      
      const { paymentIntentId, wallet } = schema.parse(req.body);
      
      // Retrieve payment intent from Stripe to verify
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ 
          error: "Payment not completed",
          status: paymentIntent.status 
        });
      }
      
      const metadata = paymentIntent.metadata;
      
      // Determine payment method from metadata
      const paymentMethodType = (metadata.paymentMethodType || "card") as "card" | "ach";
      
      // Check if buyer already exists (webhook may have created it)
      let buyer = await storage.getBuyerByLicenseId(metadata.licenseId);
      
      if (buyer) {
        // Buyer exists from webhook - update wallet address if different
        if (buyer.wallet !== wallet) {
          buyer = await storage.updateBuyer(buyer.id, { wallet });
          console.log(`Updated wallet for license ${metadata.licenseId} to ${wallet}`);
        } else {
          console.log(`Retrieved existing buyer for license ${metadata.licenseId}`);
        }
      } else {
        // Webhook hasn't processed yet - create buyer record
        // ATOMIC: Use createBuyerWithCapCheck to prevent race conditions
        buyer = await storage.createBuyerWithCapCheck({
          email: metadata.email || null,
          name: metadata.name || null,
          wallet, // Use wallet address from frontend
          tier: metadata.tier as "Verifier" | "Professional" | "Founder",
          priceUsd: Math.round(paymentIntent.amount / 100),
          paymentMethod: paymentMethodType,
          status: "active",
          licenseId: metadata.licenseId,
          txHash: null,
          nextStep: null,
          receiptSent: false,
        });
        console.log(`Created buyer record for license ${metadata.licenseId} (confirm endpoint)`);
      }
      
      res.json({ 
        success: true,
        buyer,
        message: "Payment confirmed and license created" 
      });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ 
        error: "Error confirming payment",
        message: error.message 
      });
    }
  });

  // POST /api/square-payment - Process Square card payment
  app.post("/api/square-payment", async (req, res) => {
    try {
      const schema = z.object({
        sourceId: z.string(), // Card token from Square Web Payments SDK
        tier: z.enum(["Verifier", "Professional", "Founder"]),
        amount: z.number(),
        wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
        email: z.string().email().optional(),
        name: z.string().optional(),
      });
      
      const { sourceId, tier, amount, wallet, email, name } = schema.parse(req.body);
      
      // CRITICAL: Enforce Founding Node cap (300 nodes)
      const capCheck = await checkFounderCap(tier);
      if (!capCheck.allowed) {
        return res.status(403).json({
          error: "Tier unavailable",
          message: capCheck.message,
          availableTiers: ["Verifier", "Professional"],
        });
      }
      
      // CRITICAL: Block forbidden addresses
      const walletLower = wallet.toLowerCase();
      const FORBIDDEN_ADDRESSES = [
        "0x0000000000000000000000000000000000000000",
        "0x000000000000000000000000000000000000dead",
      ];
      
      if (FORBIDDEN_ADDRESSES.includes(walletLower)) {
        return res.status(400).json({
          error: "Invalid wallet address",
          message: "Cannot mint NFTs to zero address or burn address.",
        });
      }
      
      const locationId = process.env.VITE_SQUARE_LOCATION_ID;
      if (!locationId) {
        throw new Error('Square location ID not configured');
      }
      
      // Generate unique idempotency key and license ID
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const licenseId = generateLicenseId();
      
      // Debug logging
      console.log(`🔍 Square payment request details:`);
      console.log(`   Location ID: ${locationId}`);
      console.log(`   Amount: $${amount} USD`);
      console.log(`   Tier: ${tier}`);
      console.log(`   Source ID: ${sourceId.substring(0, 10)}...`);
      
      // Create payment with Square
      const response = await squareClient.payments.create({
        sourceId,
        idempotencyKey,
        locationId,
        amountMoney: {
          amount: BigInt(Math.round(amount * 100)), // Convert to cents as BigInt
          currency: 'USD',
        },
        note: `TUDAO ${tier} Node Pass - ${licenseId}`,
      });
      
      if (response.payment?.status === 'COMPLETED') {
        console.log(`💳 Square payment successful: ${response.payment.id}`);
        
        // ATOMIC: Create buyer record with cap check
        const buyer = await storage.createBuyerWithCapCheck({
          email: email || null,
          name: name || null,
          wallet,
          tier,
          priceUsd: amount,
          paymentMethod: "card",
          status: "active",
          licenseId,
          txHash: null,
          nextStep: null,
          receiptSent: false,
        });
        
        console.log(`✅ Created buyer record for license: ${licenseId}`);
        
        // Mint NFT
        if (isNFTMintingConfigured(tier)) {
          try {
            const txHash = await mintNFT({ tier, recipientAddress: wallet, licenseId });
            await storage.updateBuyer(buyer.id, { txHash });
            console.log(`🎨 NFT minted for ${tier} to ${wallet}: ${txHash}`);
          } catch (mintError: any) {
            console.error(`❌ NFT minting failed for license ${licenseId}:`, mintError);
          }
        }
        
        res.json({
          success: true,
          payment: {
            id: response.payment?.id,
            status: response.payment?.status,
          },
          buyer,
          licenseId,
        });
      } else {
        throw new Error(`Payment failed with status: ${response.payment?.status}`);
      }
    } catch (error: any) {
      console.error("Square payment error:", error);
      res.status(500).json({
        error: "Payment failed",
        message: error.message || "An unexpected error occurred",
      });
    }
  });

  // POST /api/test-mint - Test endpoint to mint NFT without payment (TESTING ONLY)
  app.post("/api/test-mint", async (req, res) => {
    try {
      const { wallet, tier } = req.body;
      
      // Validate input
      if (!wallet || !tier) {
        return res.status(400).json({ 
          error: "Missing required fields: wallet and tier" 
        });
      }
      
      if (!["Verifier", "Professional", "Founder"].includes(tier)) {
        return res.status(400).json({ 
          error: "Invalid tier. Must be: Verifier, Professional, or Founder" 
        });
      }
      
      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        return res.status(400).json({ 
          error: "Invalid wallet address format" 
        });
      }
      
      // Check if NFT minting is configured for this tier
      if (!isNFTMintingConfigured(tier)) {
        return res.status(400).json({ 
          error: `NFT minting not configured for ${tier} tier` 
        });
      }
      
      // Generate license ID
      const licenseId = generateLicenseId();
      
      // Get tier price
      const tierPrices = {
        "Verifier": 500,
        "Professional": 5000,
        "Founder": 10000,
      };
      
      // Create test buyer record
      const buyer = await storage.createBuyer({
        email: "test@example.com",
        name: "Test User",
        wallet,
        tier: tier as "Verifier" | "Professional" | "Founder",
        priceUsd: tierPrices[tier as keyof typeof tierPrices],
        paymentMethod: "test",
        status: "active",
        licenseId,
        txHash: null,
        nextStep: null,
        receiptSent: false,
      });
      
      console.log(`🧪 TEST: Created test buyer record for license: ${licenseId}`);
      
      // Mint NFT
      const txHash = await mintNFT({
        tier: buyer.tier,
        recipientAddress: buyer.wallet,
        licenseId: buyer.licenseId,
      });
      
      // Update buyer record with transaction hash
      await storage.updateBuyer(buyer.id, { txHash });
      
      console.log(`🧪 TEST: NFT minted successfully for license: ${licenseId}, txHash: ${txHash}`);
      
      res.json({
        success: true,
        message: "Test NFT minted successfully",
        buyer: {
          ...buyer,
          txHash,
        },
        licenseId,
        txHash,
        explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
      });
      
    } catch (error: any) {
      console.error("🧪 TEST: Error minting test NFT:", error);
      res.status(500).json({ 
        error: "Failed to mint test NFT",
        message: error.message 
      });
    }
  });

  // GET /api/payment-intent/:paymentIntentId - Get payment intent data
  app.get("/api/payment-intent/:paymentIntentId", async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      res.json({
        licenseId: paymentIntent.metadata.licenseId,
        tier: paymentIntent.metadata.tier,
        wallet: paymentIntent.metadata.wallet,
        status: paymentIntent.status,
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to fetch payment intent",
        message: error.message 
      });
    }
  });

  // GET /api/check-nft-owner/:contractAddress/:tokenId - Check who owns an NFT
  app.get("/api/check-nft-owner/:contractAddress/:tokenId", async (req, res) => {
    try {
      const { contractAddress, tokenId } = req.params;
      
      // Check the actual owner on-chain
      const owner = await checkNFTOwner(contractAddress, tokenId);
      
      res.json({
        contractAddress,
        tokenId,
        owner,
        ownerLowercase: owner.toLowerCase(),
        basescanLink: `https://sepolia.basescan.org/token/${contractAddress}?a=${tokenId}`,
        thirdwebLink: `https://thirdweb.com/base-sepolia/${contractAddress}/nfts`,
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to check NFT owner",
        message: error.message 
      });
    }
  });

  // GET /api/minter-info - Get minting wallet info for permission setup
  app.get("/api/minter-info", (req, res) => {
    try {
      const minterAddress = getMinterWalletAddress();
      const chainId = parseInt(process.env.VITE_CHAIN_ID || "84532");
      const networkName = chainId === 8453 ? "Base Mainnet" : "Base Sepolia";
      const explorerBase = chainId === 8453 ? "https://basescan.org" : "https://sepolia.basescan.org";
      
      res.json({
        minterAddress,
        chainId,
        networkName,
        contracts: {
          Verifier: process.env.VITE_CONTRACT_VERIFIER || "NOT SET",
          Professional: process.env.VITE_CONTRACT_PROFESSIONAL || "NOT SET",
          Founder: process.env.VITE_CONTRACT_FOUNDER || "NOT SET",
        },
        explorerLinks: {
          Verifier: `${explorerBase}/address/${process.env.VITE_CONTRACT_VERIFIER}`,
          Professional: `${explorerBase}/address/${process.env.VITE_CONTRACT_PROFESSIONAL}`,
          Founder: `${explorerBase}/address/${process.env.VITE_CONTRACT_FOUNDER}`,
        },
        thirdwebLinks: {
          Verifier: `https://thirdweb.com/base-sepolia/${process.env.VITE_CONTRACT_VERIFIER}`,
          Professional: `https://thirdweb.com/base-sepolia/${process.env.VITE_CONTRACT_PROFESSIONAL}`,
          Founder: `https://thirdweb.com/base-sepolia/${process.env.VITE_CONTRACT_FOUNDER}`,
        },
        instructions: [
          "The transaction is failing with 'Execution Reverted'. Possible causes:",
          "",
          "1. Check if there are lazy-minted NFTs available to claim:",
          "   - Open each Thirdweb link above",
          "   - Go to 'NFTs' tab and check how many are available",
          "",
          "2. Check claim conditions (price, allowlist, etc.):",
          "   - Open the contract in Thirdweb dashboard",
          "   - Go to 'Claim Conditions' tab",
          "   - If there's a price set, the minting wallet needs to pay it",
          "",
          "3. Check permissions:",
          "   - Go to 'Permissions' tab in Thirdweb",
          "   - Make sure the minting wallet has MINTER role",
          "",
          "Minting wallet needs Base Sepolia ETH for gas fees.",
        ],
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to get minter info",
        message: error.message 
      });
    }
  });

  // GET /api/config - Get public configuration (for frontend)
  app.get("/api/config", (req, res) => {
    res.json({
      chainId: parseInt(process.env.VITE_CHAIN_ID || "84532"),
      networkName: process.env.VITE_NETWORK_NAME || "base-sepolia",
      disableCardOnramp: process.env.VITE_DISABLE_CARD_ONRAMP === "true",
      emailDisabled: process.env.VITE_EMAIL_DISABLED === "true",
    });
  });

  // ========================================
  // ADMIN DASHBOARD ROUTES
  // ========================================

  // GET /api/admin/stats - Get dashboard statistics
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const allBuyers = await storage.getAllBuyers();
      
      // Calculate stats
      const totalRevenue = allBuyers.reduce((sum, buyer) => sum + buyer.priceUsd, 0);
      const activeLicenses = allBuyers.filter(b => b.status === "active").length;
      const pendingWires = allBuyers.filter(b => b.status === "pending_wire").length;
      
      // Revenue by tier
      const revenueByTier = {
        Verifier: allBuyers.filter(b => b.tier === "Verifier" && b.status === "active").reduce((sum, b) => sum + b.priceUsd, 0),
        Professional: allBuyers.filter(b => b.tier === "Professional" && b.status === "active").reduce((sum, b) => sum + b.priceUsd, 0),
        Founder: allBuyers.filter(b => b.tier === "Founder" && b.status === "active").reduce((sum, b) => sum + b.priceUsd, 0),
      };
      
      // Licenses by tier
      const licensesByTier = {
        Verifier: allBuyers.filter(b => b.tier === "Verifier" && b.status === "active").length,
        Professional: allBuyers.filter(b => b.tier === "Professional" && b.status === "active").length,
        Founder: allBuyers.filter(b => b.tier === "Founder" && b.status === "active").length,
      };
      
      // Revenue by payment method
      const revenueByPaymentMethod = {
        card: allBuyers.filter(b => b.paymentMethod === "card" && b.status === "active").reduce((sum, b) => sum + b.priceUsd, 0),
        crypto: allBuyers.filter(b => b.paymentMethod === "crypto" && b.status === "active").reduce((sum, b) => sum + b.priceUsd, 0),
        wire: allBuyers.filter(b => b.paymentMethod === "wire" && b.status === "active").reduce((sum, b) => sum + b.priceUsd, 0),
      };
      
      res.json({
        totalRevenue,
        activeLicenses,
        pendingWires,
        revenueByTier,
        licensesByTier,
        revenueByPaymentMethod,
      });
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats", message: error.message });
    }
  });

  // GET /api/admin/buyers - Get all buyers with optional filtering
  app.get("/api/admin/buyers", async (req, res) => {
    try {
      const { status, tier, paymentMethod } = req.query;
      
      let buyers = await storage.getAllBuyers();
      
      // Apply filters
      if (status) {
        buyers = buyers.filter(b => b.status === status);
      }
      if (tier) {
        buyers = buyers.filter(b => b.tier === tier);
      }
      if (paymentMethod) {
        buyers = buyers.filter(b => b.paymentMethod === paymentMethod);
      }
      
      // Sort by created date (newest first)
      buyers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(buyers);
    } catch (error: any) {
      console.error("Error fetching buyers:", error);
      res.status(500).json({ error: "Failed to fetch buyers", message: error.message });
    }
  });

  // POST /api/admin/activate-wire/:licenseId - Activate a pending wire transfer
  app.post("/api/admin/activate-wire/:licenseId", async (req, res) => {
    try {
      const { licenseId } = req.params;
      
      // Get the buyer
      const buyer = await storage.getBuyerByLicenseId(licenseId);
      if (!buyer) {
        return res.status(404).json({ error: "License not found" });
      }
      
      // Verify it's a pending wire transfer
      if (buyer.status !== "pending_wire") {
        return res.status(400).json({ 
          error: "Invalid status", 
          message: `License status is "${buyer.status}". Only pending_wire licenses can be activated.` 
        });
      }
      
      if (buyer.paymentMethod !== "wire") {
        return res.status(400).json({ 
          error: "Invalid payment method", 
          message: `Payment method is "${buyer.paymentMethod}". Only wire transfers can be activated here.` 
        });
      }
      
      // Mint NFT to their wallet
      console.log(`🔨 Admin activating wire transfer for ${licenseId}...`);
      
      const txHash = await mintNFT({
        tier: buyer.tier,
        recipientAddress: buyer.wallet,
        licenseId: buyer.licenseId,
      });
      
      // Update buyer status to active and record transaction hash
      await storage.updateBuyer(buyer.id, {
        status: "active",
        txHash: txHash,
      });
      
      console.log(`✅ Wire transfer ${licenseId} activated! NFT minted: ${txHash}`);
      
      // Return updated buyer
      const updatedBuyer = await storage.getBuyerByLicenseId(licenseId);
      
      res.json({
        success: true,
        message: "Wire transfer activated and NFT minted",
        buyer: updatedBuyer,
        transactionHash: txHash,
      });
    } catch (error: any) {
      console.error(`Error activating wire transfer:`, error);
      res.status(500).json({ 
        error: "Failed to activate wire transfer", 
        message: error.message 
      });
    }
  });

  // GET /api/admin/founding-team/allocations - Get current allocation counts
  app.get("/api/admin/founding-team/allocations", async (req, res) => {
    try {
      const allBuyers = await storage.getAllBuyers();
      const foundingTeam = allBuyers.filter(b => b.paymentMethod === "founding_team" && b.status === "active");
      
      const allocations = {
        Architect: {
          limit: 1,
          minted: foundingTeam.filter(b => b.foundingTeamRole === "Architect").length,
        },
        Regent: {
          limit: 1,
          minted: foundingTeam.filter(b => b.foundingTeamRole === "Regent").length,
        },
        Councilor: {
          limit: 1,
          minted: foundingTeam.filter(b => b.foundingTeamRole === "Councilor").length,
        },
        Guardian: {
          limit: 1,
          minted: foundingTeam.filter(b => b.foundingTeamRole === "Guardian").length,
        },
        Oracle: {
          limit: 1,
          minted: foundingTeam.filter(b => b.foundingTeamRole === "Oracle").length,
        },
      };
      
      res.json(allocations);
    } catch (error: any) {
      console.error("Error fetching founding team allocations:", error);
      res.status(500).json({ error: "Failed to fetch allocations", message: error.message });
    }
  });

  // POST /api/admin/founding-team/mint - Mint a founding team NFT
  app.post("/api/admin/founding-team/mint", async (req, res) => {
    try {
      const { role, walletAddress, name } = req.body;
      
      // Validate role
      const validRoles = ["Architect", "Regent", "Councilor", "Guardian", "Oracle"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid founding team role" });
      }
      
      // Validate wallet address
      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      
      // Check allocation limits
      const allBuyers = await storage.getAllBuyers();
      const foundingTeam = allBuyers.filter(b => b.paymentMethod === "founding_team" && b.status === "active");
      const existingCount = foundingTeam.filter(b => b.foundingTeamRole === role).length;
      
      const limits: { [key: string]: number } = {
        Architect: 1,
        Regent: 1,
        Councilor: 1,
        Guardian: 1,
        Oracle: 1,
      };
      
      if (existingCount >= limits[role]) {
        return res.status(400).json({ 
          error: "Allocation limit reached", 
          message: `${role} allocation is full (${existingCount}/${limits[role]})` 
        });
      }
      
      // Generate license ID
      const licenseId = `FT-${role.toUpperCase().slice(0, 3)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Create buyer record
      const buyer = await storage.createBuyer({
        wallet: walletAddress.toLowerCase(),
        tier: "Founder", // Founding team gets Founder-level access
        priceUsd: 0, // Free for founding team
        paymentMethod: "founding_team",
        licenseId,
        status: "active",
        name: name || `${role} Node`,
        email: null,
        foundingTeamRole: role,
      });
      
      // Mint NFT
      console.log(`🔨 Minting founding team NFT for ${role}...`);
      const txHash = await mintNFT({
        tier: "Founder",
        recipientAddress: walletAddress,
        licenseId,
      });
      
      // Update with transaction hash
      await storage.updateBuyer(buyer.id, {
        txHash: txHash,
      });
      
      console.log(`✅ Founding team NFT minted for ${role}: ${txHash}`);
      
      const updatedBuyer = await storage.getBuyerById(buyer.id);
      
      res.json({
        success: true,
        message: `${role} NFT minted successfully`,
        buyer: updatedBuyer,
        transactionHash: txHash,
      });
    } catch (error: any) {
      console.error("Error minting founding team NFT:", error);
      res.status(500).json({ 
        error: "Failed to mint founding team NFT", 
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
