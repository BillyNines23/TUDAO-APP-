import AppShell from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Clock, User, ArrowRight, ShieldCheck } from "lucide-react";

// Mock Data
const projects = [
  {
    id: 1,
    title: "Emergency Plumbing Fix",
    provider: "Alice Plumber",
    status: "In Progress",
    started: "Today, 9:00 AM",
    escrow: "Funded",
    amount: "$150.00"
  },
  {
    id: 2,
    title: "Living Room Painting",
    provider: "Bob Painter",
    status: "Completed",
    started: "Nov 15, 2025",
    escrow: "Released",
    amount: "$450.00"
  },
  {
    id: 3,
    title: "Electrical Wiring Inspection",
    provider: "Charlie Electric",
    status: "Pending",
    started: "Nov 18, 2025",
    escrow: "Awaiting Funding",
    amount: "$200.00"
  }
];

export default function MyProjects() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-display font-bold">My Projects</h1>
            <Button>
                <FolderOpen className="mr-2 h-4 w-4" /> New Project
            </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <Card key={project.id} className="hover:border-primary/50 transition-colors group">
                    <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant={project.status === 'Completed' ? 'secondary' : project.status === 'In Progress' ? 'default' : 'outline'}>
                                {project.status}
                            </Badge>
                            <span className="font-mono font-bold text-sm">{project.amount}</span>
                        </div>
                        <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
                            {project.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{project.provider}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{project.started}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Escrow: {project.escrow}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full justify-between group-hover:bg-muted">
                            View Details <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
