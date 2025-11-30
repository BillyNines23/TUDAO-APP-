import { useState } from "react";
import MPAModal from '../MPAModal';
import { Button } from "@/components/ui/button";

export default function MPAModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open MPA Modal</Button>
      <MPAModal
        open={open}
        onOpenChange={setOpen}
        signerName="John Smith"
        walletAddress="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        onSign={(data) => console.log("Signed:", data)}
      />
    </div>
  );
}
