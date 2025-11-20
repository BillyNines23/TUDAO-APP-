import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Clock, User, ArrowRight, ShieldCheck } from "lucide-react";
import { useTudao } from "@/lib/tudao-context";

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  escrowStatus: string;
  amount: string;
  startedAt?: string;
  providerId?: string;
}

export default function MyProjects() {
  const { userId } = useTudao();
  
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/projects/consumer/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
    enabled: !!userId
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-display font-bold">My Projects</h1>
            <Button>
                <FolderOpen className="mr-2 h-4 w-4" /> New Project
            </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No projects yet.</p>
            <Button>Create Your First Project</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: Project) => (
                  <Card key={project.id} className="hover:border-primary/50 transition-colors group">
                      <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                              <Badge variant={project.status === 'completed' ? 'secondary' : project.status === 'in_progress' ? 'default' : 'outline'}>
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
                              <span>{project.providerId || 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{project.startedAt ? new Date(project.startedAt).toLocaleDateString() : 'Not started'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              <span>Escrow: {project.escrowStatus}</span>
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
        )}
      </div>
    </AppShell>
  );
}
