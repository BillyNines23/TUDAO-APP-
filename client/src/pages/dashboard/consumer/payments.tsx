import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CreditCard, ExternalLink, Download, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Reuse mock data structure or import if shared
const payments = [
    { id: "tx_1", date: "Today, 10:23 AM", desc: "Escrow Deposit - Plumbing", amount: "-$150.00", status: "Pending", type: "out" },
    { id: "tx_2", date: "Nov 15, 2025", desc: "Escrow Release - Painting", amount: "-$450.00", status: "Completed", type: "out" },
    { id: "tx_3", date: "Nov 10, 2025", desc: "Wallet Deposit", amount: "+$1,000.00", status: "Completed", type: "in" },
];

export default function Payments() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-display font-bold">Payments</h1>
            <div className="flex gap-2">
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Funds
                </Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$2,450.00</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">In Escrow</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$150.00</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$842.50</div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Transaction History
                </CardTitle>
                <CardDescription>Recent escrow activity and deposits</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Verify</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>
                                    <div className={`p-2 rounded-full w-8 h-8 flex items-center justify-center ${tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        {tx.type === 'in' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{tx.desc}</TableCell>
                                <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        tx.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                        {tx.status}
                                    </span>
                                </TableCell>
                                <TableCell className={`text-right font-mono ${tx.type === 'in' ? 'text-green-500' : ''}`}>{tx.amount}</TableCell>
                                <TableCell className="text-right">
                                     <Button variant="ghost" size="sm" onClick={() => window.open('https://basescan.org', '_blank')}>
                                        View on BaseScan <ExternalLink className="ml-2 h-3 w-3" />
                                     </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
