// Authorized architect wallet addresses
export const ARCHITECT_WHITELIST = [
  "0x91ab951ab5c31a0d475d3539099c09d7fc307a75"
];

export function isAuthorizedArchitect(walletAddress: string): boolean {
  return ARCHITECT_WHITELIST.includes(walletAddress.toLowerCase());
}
