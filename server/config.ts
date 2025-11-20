// Authorized architect wallet addresses
export const ARCHITECT_WHITELIST = [
  // Add your wallet address here
  "YOUR_WALLET_ADDRESS_HERE"
];

export function isAuthorizedArchitect(walletAddress: string): boolean {
  return ARCHITECT_WHITELIST.includes(walletAddress.toLowerCase());
}
