import { Star, User, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConstitutionCard from "@/components/ConstitutionCard";

const MOCK_OPPORTUNITIES = [
  {
    id: "1",
    timeAgo: "4 hr ago",
    title: "Interior Painting",
    budgetMin: 400,
    budgetMax: 600,
  },
  {
    id: "2",
    timeAgo: "5 hr ago",
    title: "Plumbing Repair",
    budgetMin: 150,
    budgetMax: 300,
  },
  {
    id: "3",
    timeAgo: "8 hr ago",
    title: "Deck Construction",
    budgetMin: 800,
    budgetMax: 1200,
  },
];

const MOCK_ACTIVE_JOBS = [
  {
    id: "1",
    title: "Fence Repair – 6ft Panels",
    clientName: "Jocob W.",
    clientLocation: "Columbus, OH",
    status: "Ongoing" as const,
    escrowStatus: "Escrow Funding" as const,
    fundingType: "escrow" as const,
    escrowAmount: 2150,
  },
  {
    id: "2",
    title: "Fence Repair – 6ft Panels",
    clientName: "Jocob W.",
    clientLocation: "Columbus, OH",
    status: "Futulend" as const,
    escrowStatus: "Partially funded" as const,
    fundingType: "partial" as const,
    awaitingMilestone: true,
  },
];

const MOCK_TRUST_DATA = {
  score: 4.7,
  daoRating: "DAO rating",
  escrowEarnings: 2150,
  pending: 750,
  lifetimeTokens: 1250,
};

export default function VendorDashboard() {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-white font-bold text-2xl tracking-tight">
                <span className="text-white">TT</span>
                <span className="ml-1">TUDAO</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm font-mono">0x1234 ...A678</span>
              <span className="text-slate-400 text-sm">Wallet:</span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="rounded-full bg-slate-700 hover:bg-slate-600"
                data-testid="button-profile"
              >
                <User className="w-5 h-5 text-slate-300" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl">New Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {MOCK_OPPORTUNITIES.map((opp) => (
                  <Card 
                    key={opp.id} 
                    className="bg-slate-900 border-slate-700 hover-elevate active-elevate-2"
                    data-testid={`card-opportunity-${opp.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-400 mb-2">{opp.timeAgo}</div>
                      <h4 className="text-white font-medium mb-2">{opp.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          ${opp.budgetMin} – ${opp.budgetMax}
                        </span>
                        <Button 
                          size="sm" 
                          className="bg-slate-700 hover:bg-slate-600 text-white"
                          data-testid={`button-submit-bid-${opp.id}`}
                        >
                          Submit Bid
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {MOCK_ACTIVE_JOBS.map((job) => (
                  <Card 
                    key={job.id} 
                    className="bg-slate-900 border-slate-700"
                    data-testid={`card-active-job-${job.id}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="text-white font-medium mb-2">{job.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <User className="w-4 h-4" />
                          <span>
                            {job.clientName} - {job.clientLocation}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className="ml-auto bg-blue-900/40 text-blue-300 border-blue-800"
                          >
                            {job.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-slate-400">{job.escrowStatus}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto text-slate-400 hover:text-white h-auto p-0"
                          data-testid={`button-view-scope-${job.id}`}
                        >
                          View Scope
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-white h-auto p-0 flex items-center gap-1"
                          data-testid={`button-view-scope-details-${job.id}`}
                        >
                          View Scope
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="ml-auto bg-slate-700 hover:bg-slate-600 text-white"
                          data-testid={`button-mark-milestone-${job.id}`}
                        >
                          Mark Milestone Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl">Trust & Earnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Trust score</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{MOCK_TRUST_DATA.score}</span>
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="text-sm text-slate-400 mt-1">{MOCK_TRUST_DATA.daoRating}</div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="text-sm text-slate-400 mb-1">Escrow Earnings</div>
                  <div className="text-3xl font-bold text-white">
                    ${MOCK_TRUST_DATA.escrowEarnings.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Pending</div>
                  <div className="text-3xl font-bold text-white">
                    ${MOCK_TRUST_DATA.pending.toLocaleString()}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="text-sm text-slate-400 mb-1">Lifetime TUDAO Tokens</div>
                  <div className="text-3xl font-bold text-white">
                    {MOCK_TRUST_DATA.lifetimeTokens.toLocaleString()}
                  </div>
                </div>

                <Button 
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white mt-4"
                  data-testid="button-ask-tu-agent"
                >
                  Ask the TU Agent
                </Button>
              </CardContent>
            </Card>

            <ConstitutionCard />
          </div>
        </div>
      </div>
    </div>
  );
}
