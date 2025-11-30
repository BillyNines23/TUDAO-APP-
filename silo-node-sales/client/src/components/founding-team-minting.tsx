import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Users2, Shield, Eye, Sparkles } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Allocations {
  [role: string]: {
    limit: number;
    minted: number;
  };
}

const roleIcons: { [key: string]: React.ReactNode } = {
  Architect: <Crown className="h-4 w-4" />,
  Regent: <Users2 className="h-4 w-4" />,
  Councilor: <Shield className="h-4 w-4" />,
  Guardian: <Eye className="h-4 w-4" />,
  Oracle: <Sparkles className="h-4 w-4" />,
};

const roleDescriptions: { [key: string]: string } = {
  Architect: "Platform Architect - Operates 1 Node",
  Regent: "Network Regent - Operates 15 Nodes",
  Councilor: "Community Councilor - Operates 15 Nodes",
  Guardian: "Protocol Guardian - Operates 15 Nodes",
  Oracle: "Reserved Oracle - Operates 15 Nodes",
};

export function FoundingTeamMinting() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [memberName, setMemberName] = useState<string>("");

  const { data: allocations, isLoading } = useQuery<Allocations>({
    queryKey: ["/api/admin/founding-team/allocations"],
  });

  const mintMutation = useMutation({
    mutationFn: async (data: { role: string; walletAddress: string; name?: string }) => {
      return await apiRequest("POST", "/api/admin/founding-team/mint", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Founding Team NFT Minted!",
        description: `${selectedRole} NFT minted successfully. TX: ${data.transactionHash.slice(0, 10)}...`,
      });
      // Reset form
      setSelectedRole("");
      setWalletAddress("");
      setMemberName("");
      // Refresh allocations
      queryClient.invalidateQueries({ queryKey: ["/api/admin/founding-team/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/buyers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint founding team NFT",
        variant: "destructive",
      });
    },
  });

  const handleMint = () => {
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select a founding team role",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      toast({
        title: "Invalid Wallet",
        description: "Please enter a valid Ethereum wallet address",
        variant: "destructive",
      });
      return;
    }

    mintMutation.mutate({
      role: selectedRole,
      walletAddress,
      name: memberName || undefined,
    });
  };

  const getRoleAllocation = (role: string) => {
    if (!allocations) return { minted: 0, limit: 0, available: 0 };
    const alloc = allocations[role];
    return {
      minted: alloc.minted,
      limit: alloc.limit,
      available: alloc.limit - alloc.minted,
    };
  };

  const isRoleFull = (role: string) => {
    const alloc = getRoleAllocation(role);
    return alloc.available === 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Founding Team Mints</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading allocations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Founding Team Mints
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Mint free Founder-level NFTs for family members to bootstrap the network
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Allocation Status */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(allocations || {}).map(([role, alloc]) => {
            const available = alloc.limit - alloc.minted;
            const isFull = available === 0;
            
            return (
              <div
                key={role}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isFull ? "bg-muted/50 opacity-60" : "bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  {roleIcons[role]}
                  <div>
                    <p className="text-sm font-medium">{role}</p>
                    <p className="text-xs text-muted-foreground">
                      {alloc.minted}/{alloc.limit} minted
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Minting Form */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="role-select" data-testid="label-role">Founding Team Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role-select" data-testid="select-role">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(allocations || {}).map((role) => {
                  const alloc = getRoleAllocation(role);
                  const full = isRoleFull(role);
                  
                  return (
                    <SelectItem
                      key={role}
                      value={role}
                      disabled={full}
                      data-testid={`option-role-${role.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-2">
                        {roleIcons[role]}
                        <span>{roleDescriptions[role]}</span>
                        {full && <span className="text-xs text-muted-foreground">(Full)</span>}
                        {!full && (
                          <span className="text-xs text-muted-foreground">
                            ({alloc.available} available)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet-input" data-testid="label-wallet">Wallet Address</Label>
            <Input
              id="wallet-input"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              data-testid="input-wallet"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name-input" data-testid="label-name">Member Name (Optional)</Label>
            <Input
              id="name-input"
              placeholder="e.g., Whitney"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              data-testid="input-name"
            />
          </div>

          <Button
            onClick={handleMint}
            disabled={!selectedRole || !walletAddress || mintMutation.isPending}
            className="w-full"
            data-testid="button-mint-founding"
          >
            {mintMutation.isPending ? "Minting NFT..." : "Mint Founding Team NFT"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
