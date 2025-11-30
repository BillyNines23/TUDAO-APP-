// Authorized architect wallet addresses - loaded from environment variable
// Format: comma-separated list of addresses
function getArchitectWhitelist(): string[] {
  const whitelist = process.env.ARCHITECT_WHITELIST || "";
  return whitelist
    .split(",")
    .map(addr => addr.trim().toLowerCase())
    .filter(addr => addr.length > 0);
}

export function isAuthorizedArchitect(walletAddress: string): boolean {
  const whitelist = getArchitectWhitelist();
  return whitelist.includes(walletAddress.toLowerCase());
}
