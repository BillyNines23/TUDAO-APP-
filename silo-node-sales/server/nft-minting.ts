import { createThirdwebClient, getContract, sendTransaction, prepareContractCall } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { base, baseSepolia } from "thirdweb/chains";

const TEST_MODE = process.env.TEST_MODE === "true";

const TESTNET_CONTRACTS = {
  Verifier: "0x29baE415087f9d521Aa60e055BE86c8edF13a1CC",
  Professional: "0x6fc238fC491e1B8a8F5B61FaBD871BD64285f6D7",
  Founder: "0xB299F787F6Ec663d2DF34cD62E062919286FDe61",
};

const MAINNET_CONTRACTS = {
  Verifier: process.env.VITE_CONTRACT_VERIFIER || "",
  Professional: process.env.VITE_CONTRACT_PROFESSIONAL || "",
  Founder: process.env.VITE_CONTRACT_FOUNDER || "",
};

const CONTRACT_ADDRESSES = TEST_MODE ? TESTNET_CONTRACTS : MAINNET_CONTRACTS;
const CHAIN_ID = TEST_MODE ? 84532 : 8453;

const THIRDWEB_CLIENT_ID = process.env.VITE_THIRDWEB_CLIENT_ID;
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const MINTER_PRIVATE_KEY_RAW = process.env.THIRDWEB_MINTER_PRIVATE_KEY;
const MINTER_PRIVATE_KEY = MINTER_PRIVATE_KEY_RAW 
  ? (MINTER_PRIVATE_KEY_RAW.startsWith('0x') ? MINTER_PRIVATE_KEY_RAW : `0x${MINTER_PRIVATE_KEY_RAW}`)
  : undefined;

if (!THIRDWEB_CLIENT_ID) {
  throw new Error("VITE_THIRDWEB_CLIENT_ID is not set");
}

if (!THIRDWEB_SECRET_KEY) {
  throw new Error("THIRDWEB_SECRET_KEY is not set - required for server-side operations");
}

console.log("\n" + "=".repeat(60));
if (TEST_MODE) {
  console.log("🧪 TEST MODE ENABLED - Using Base Sepolia Testnet");
} else {
  console.log("🚀 PRODUCTION MODE - Using Base Mainnet");
}
console.log("=".repeat(60));

if (!MINTER_PRIVATE_KEY) {
  console.warn("⚠️  THIRDWEB_MINTER_PRIVATE_KEY is not set - NFT minting will not work");
} else {
  console.log("✅ NFT minting configured:");
  console.log(`   Network: ${TEST_MODE ? 'Base Sepolia (Testnet)' : 'Base Mainnet (Production)'}`);
  console.log(`   Chain ID: ${CHAIN_ID}`);
  console.log(`   Verifier: ${CONTRACT_ADDRESSES.Verifier || 'NOT SET'}`);
  console.log(`   Professional: ${CONTRACT_ADDRESSES.Professional || 'NOT SET'}`);
  console.log(`   Founder: ${CONTRACT_ADDRESSES.Founder || 'NOT SET'}`);
}

const client = createThirdwebClient({
  secretKey: THIRDWEB_SECRET_KEY,
});

const chain = CHAIN_ID === 8453 ? base : baseSepolia;

export interface MintNFTParams {
  tier: "Verifier" | "Professional" | "Founder";
  recipientAddress: string;
  licenseId: string;
}

export async function mintNFT(params: MintNFTParams): Promise<string> {
  const { tier, recipientAddress, licenseId } = params;

  if (!MINTER_PRIVATE_KEY) {
    throw new Error("NFT minting not configured: THIRDWEB_MINTER_PRIVATE_KEY not set");
  }

  const contractAddress = CONTRACT_ADDRESSES[tier];
  if (!contractAddress) {
    throw new Error(`Contract address not configured for tier: ${tier}`);
  }

  // Normalize address to lowercase and validate format
  const normalizedAddress = recipientAddress.toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(normalizedAddress)) {
    throw new Error(`Invalid Ethereum address format: ${recipientAddress}`);
  }

  try {
    const account = privateKeyToAccount({
      client,
      privateKey: MINTER_PRIVATE_KEY,
    });

    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    console.log(`Minting NFT for ${tier} tier to ${normalizedAddress} (License: ${licenseId})`);

    // Call the mint(address to) function on our custom ERC721 contract
    const transaction = prepareContractCall({
      contract,
      method: "function mint(address to) returns (uint256)",
      params: [normalizedAddress],
    });

    const { transactionHash } = await sendTransaction({
      transaction,
      account,
    });

    console.log(`✅ NFT minted successfully for ${tier} tier to ${normalizedAddress}`);
    console.log(`   Transaction hash: ${transactionHash}`);
    console.log(`   License ID: ${licenseId}`);

    return transactionHash;
  } catch (error: any) {
    console.error(`❌ Error minting NFT for ${tier} tier:`, error);
    console.error(`   Recipient: ${normalizedAddress}`);
    console.error(`   Contract: ${contractAddress}`);
    console.error(`   License: ${licenseId}`);
    throw new Error(`Failed to mint NFT: ${error.message}`);
  }
}

export function isNFTMintingConfigured(tier?: "Verifier" | "Professional" | "Founder"): boolean {
  if (!MINTER_PRIVATE_KEY) {
    return false;
  }
  
  // If a specific tier is provided, only check that tier's contract
  if (tier) {
    return !!CONTRACT_ADDRESSES[tier];
  }
  
  // Otherwise, check if at least one tier is configured
  return !!(CONTRACT_ADDRESSES.Verifier || CONTRACT_ADDRESSES.Professional || CONTRACT_ADDRESSES.Founder);
}

export function getMinterWalletAddress(): string {
  if (!MINTER_PRIVATE_KEY) {
    throw new Error("THIRDWEB_MINTER_PRIVATE_KEY not set");
  }
  
  const account = privateKeyToAccount({
    client,
    privateKey: MINTER_PRIVATE_KEY,
  });
  
  return account.address;
}

export async function checkNFTOwner(contractAddress: string, tokenId: string): Promise<string> {
  try {
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    // Read the ownerOf function from the ERC721 contract
    const { readContract } = await import("thirdweb");
    
    const owner = await readContract({
      contract,
      method: "function ownerOf(uint256 tokenId) view returns (address)",
      params: [BigInt(tokenId)],
    });
    
    return owner as string;
  } catch (error: any) {
    throw new Error(`Failed to check NFT owner: ${error.message}`);
  }
}
