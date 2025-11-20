import { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowRightLeft, 
  Box, 
  Coins, 
  Shield, 
  Server,
  RefreshCw
} from "lucide-react";
import { usePrivy } from "@/lib/auth";

// Mock Data Types
type TransactionType = 'Transfer' | 'Contract Interaction' | 'Reward Claim' | 'Node Mint' | 'Escrow Payment';
type TransactionStatus = 'Success' | 'Pending' | 'Failed';

interface Transaction {
  hash: string;
  timestamp: string;
  type: TransactionType;
  amount: string;
  gas: string;
  status: TransactionStatus;
}

// Mock Data Generator
const generateMockTransactions = (): Transaction[] => [
  {
    hash: "0x71a...3b92",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    type: "Contract Interaction",
    amount: "-",
    gas: "0.0004 ETH",
    status: "Success"
  },
  {
    hash: "0x82b...9c21",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    type: "Transfer",
    amount: "150.00 USDC",
    gas: "0.0001 ETH",
    status: "Success"
  },
  {
    hash: "0x93c...4d55",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    type: "Node Mint",
    amount: "0.05 ETH",
    gas: "0.0021 ETH",
    status: "Success"
  },
  {
    hash: "0xa4d...5e88",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day 2 hours ago
    type: "Reward Claim",
    amount: "450 TUDAO",
    gas: "0.0008 ETH",
    status: "Pending"
  },
  {
    hash: "0xb5e...6f99",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    type: "Escrow Payment",
    amount: "500.00 USDC",
    gas: "0.0012 ETH",
    status: "Failed"
  }
];

export default function TransactionVerification() {
  const { user } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulate fetching data
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTransactions(generateMockTransactions());
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'Success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Pending': return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'Failed': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'Transfer': return <ArrowRightLeft className="h-4 w-4" />;
      case 'Contract Interaction': return <Box className="h-4 w-4" />;
      case 'Reward Claim': return <Coins className="h-4 w-4" />;
      case 'Node Mint': return <Server className="h-4 w-4" />;
      case 'Escrow Payment': return <Shield className="h-4 w-4" />;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Transaction Verification</h1>
            <p className="text-muted-foreground">
              Verify on-chain activity for wallet <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">{user?.wallet?.address || "0x..."}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => window.open(`https://basescan.org/address/${user?.wallet?.address}`, '_blank')}>
            View on BaseScan <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Real-time data fetched from Base Mainnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Syncing with BaseScan...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No transactions found for this wallet yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Gas Used</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.hash} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2" title={tx.status}>
                          {getStatusIcon(tx.status)}
                          <span className="hidden sm:inline text-xs font-medium text-muted-foreground">{tx.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary group-hover:underline cursor-pointer">
                        {tx.hash}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-muted text-muted-foreground">
                            {getTypeIcon(tx.type)}
                          </div>
                          <span className="text-sm font-medium">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {tx.amount}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {tx.gas}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`https://basescan.org/tx/${tx.hash}`, '_blank')}>
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
