// Environment-driven configuration for TUDAO Node Pass
// All values controlled by env vars - no code edits needed to switch test/mainnet

// Import custom badge images
import verifierBadge from '@assets/TUDAO_Verifier_Node_Badge_1761684263543.png';
import professionalBadge from '@assets/TUDAO_Professional_Node_Badge_1761684263547.png';
import founderBadge from '@assets/TUDAO_Founding_Node_Badge_1761684263549.png';

export const config = {
  // Network configuration
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || "84532"), // 84532 = Base Sepolia, 8453 = Base mainnet
  networkName: import.meta.env.VITE_NETWORK_NAME || "base-sepolia",
  
  // Feature flags
  disableCardOnramp: import.meta.env.VITE_DISABLE_CARD_ONRAMP === "true",
  emailDisabled: import.meta.env.VITE_EMAIL_DISABLED === "true",
  
  // Tier pricing (USD)
  tiers: {
    Verifier: {
      price: parseInt(import.meta.env.VITE_TIER_VERIFIER_PRICE_USD || "500"),
      cap: parseInt(import.meta.env.VITE_INVENTORY_CAP_VERIFIER || "0"),
    },
    Professional: {
      price: parseInt(import.meta.env.VITE_TIER_PROFESSIONAL_PRICE_USD || "5000"),
      cap: parseInt(import.meta.env.VITE_INVENTORY_CAP_PROFESSIONAL || "0"),
    },
    Founder: {
      price: parseInt(import.meta.env.VITE_TIER_FOUNDER_PRICE_USD || "10000"),
      cap: parseInt(import.meta.env.VITE_INVENTORY_CAP_FOUNDER || "300"),
    },
  },
  
  // Compliance text
  founderNote: import.meta.env.VITE_FOUNDER_NON_TRANSFERABLE_NOTE || 
    "Founder nodes are non-transferable until an MVP unlock vote.",
  
  complianceText: "Rewards are policy-based and variable and may change by DAO vote. Founder nodes are non-transferable until an MVP unlock vote. This is not financial, legal, or tax advice.",
  
  // Thirdweb
  thirdwebClientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "",
  contracts: {
    Verifier: import.meta.env.VITE_CONTRACT_VERIFIER || "",
    Professional: import.meta.env.VITE_CONTRACT_PROFESSIONAL || "",
    Founder: import.meta.env.VITE_CONTRACT_FOUNDER || "",
  },
  
  // USDC contracts
  usdc: {
    // Base mainnet USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (official USDC)
    // Base Sepolia: No official USDC exists on testnet
    //   - To test crypto payments on Sepolia, deploy a test ERC20 token and set VITE_USDC_CONTRACT
    //   - Or use Card/ACH/Wire payment methods which work in test mode
    // Production: Use mainnet (chainId 8453) for real USDC payments
    address: import.meta.env.VITE_USDC_CONTRACT || 
      (parseInt(import.meta.env.VITE_CHAIN_ID || "84532") === 8453 
        ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base mainnet USDC (production)
        : ""), // Base Sepolia - no default (must set VITE_USDC_CONTRACT to test ERC20)
  },
  
  // Treasury wallet to receive payments
  treasuryWallet: import.meta.env.VITE_TREASURY_WALLET || "0x0000000000000000000000000000000000000000",
  
  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  },
  
  // On-ramp (mainnet only)
  onramp: {
    provider: import.meta.env.VITE_ONRAMP_PROVIDER || "coinbase_onramp",
    apiKey: import.meta.env.VITE_ONRAMP_API_KEY || "",
  },
  
  // Email (optional)
  email: {
    provider: import.meta.env.VITE_EMAIL_PROVIDER || "resend",
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "support@tradeuniondao.com",
    fromName: import.meta.env.VITE_EMAIL_FROM_NAME || "TUDAO Receipts",
  },
  
  // Asset URLs (S3/CloudFront)
  assets: {
    badges: {
      Verifier: import.meta.env.VITE_ASSETS_BADGE_VERIFIER_URL || verifierBadge,
      Professional: import.meta.env.VITE_ASSETS_BADGE_PROFESSIONAL_URL || professionalBadge,
      Founder: import.meta.env.VITE_ASSETS_BADGE_FOUNDER_URL || founderBadge,
    },
    setupPdf: import.meta.env.VITE_ASSETS_SETUP_PDF_URL || "",
  },
};

// Helper to check if we're in test mode
export const isTestMode = config.chainId === 84532;

// Helper to get network display name
export const getNetworkDisplayName = () => {
  return config.chainId === 84532 ? "Base Sepolia" : "Base";
};

// Helper to format tier price
export const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to truncate wallet address
export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
