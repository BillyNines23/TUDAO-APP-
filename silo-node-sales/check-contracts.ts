import { createThirdwebClient, getContract } from "thirdweb";
import { base } from "thirdweb/chains";

const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

const addresses = [
  "0x0e639f17c7be3f779ba0f98b2443a6849373a15",
  "0x6c5378386cc7c449610d6290188a61d2c0350bc",
  "0x1136c28c49a2bb79c1044911ac0e01c73568b997",
];

async function checkContracts() {
  console.log("Checking contract names on Base mainnet...\n");
  
  for (const address of addresses) {
    try {
      const contract = getContract({
        client,
        chain: base,
        address,
      });
      
      // Call the name() function
      const response = await fetch(
        `https://base.blockscout.com/api?module=contract&action=getabi&address=${address}`
      );
      const data = await response.json();
      
      console.log(`Address: ${address}`);
      console.log(`Status: ${data.status === "1" ? "Verified" : "Not verified"}`);
      console.log("---");
    } catch (error) {
      console.error(`Error checking ${address}:`, error);
    }
  }
}

checkContracts().catch(console.error);
