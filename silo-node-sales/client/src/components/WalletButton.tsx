import { ConnectButton } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb";
import { config } from "@/lib/config";
import { base, baseSepolia } from "thirdweb/chains";

export function WalletButton() {
  const chain = config.chainId === 84532 ? baseSepolia : base;

  return (
    <ConnectButton
      client={thirdwebClient}
      chain={chain}
      connectButton={{
        label: "Connect Wallet",
        className: "min-h-9",
      }}
      data-testid="button-connect-wallet"
    />
  );
}
