import AppShell from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, Receipt, Star } from "lucide-react";

const history = [
  { id: 1, title: "Living Room Painting", provider: "Bob Painter", date: "Nov 15, 2025", amount: "$450.00", rating: 5 },
  { id: 2, title: "Garage Door Repair", provider: "FixIt Fast", date: "Oct 22, 2025", amount: "$120.00", rating: 4 },
  { id: 3, title: "Garden Cleanup", provider: "Green Thumbs", date: "Sep 10, 2025", amount: "$300.00", rating: 5 },
];

export default function History() {
  return (
    <AppShell>
       <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">History</h1>

        <div className="space-y-4">
            {history.map((item) => (
                <Card key={item.id}>
                    <div className="flex flex-col md:flex-row items-center">
                        <CardHeader className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <CardTitle>{item.title}</CardTitle>
                                <span className="font-mono font-bold md:hidden">{item.amount}</span>
                            </div>
                            <CardDescription className="flex items-center gap-4">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {item.date}</span>
                                <span>{item.provider}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6 md:pb-0 md:pr-6 flex items-center gap-6">
                            <div className="hidden md:block text-right">
                                <div className="font-mono font-bold text-lg">{item.amount}</div>
                                <div className="flex items-center text-yellow-500 text-xs justify-end">
                                    {[...Array(item.rating)].map((_, i) => (
                                        <Star key={i} className="h-3 w-3 fill-current" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                                    <Receipt className="mr-2 h-4 w-4" /> Receipt
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                                    <Download className="mr-2 h-4 w-4" /> Scope
                                </Button>
                            </div>
                        </CardContent>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
