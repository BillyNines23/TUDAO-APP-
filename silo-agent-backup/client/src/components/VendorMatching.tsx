import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, DollarSign } from "lucide-react";
import ProgressTracker from "./ProgressTracker";
import logoUrl from "@assets/generated_images/TUDAO_logo_professional_blue_badge_d6d08bf6.png";

interface Vendor {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  pastJobs: string;
  priceRange: number;
  verified: boolean;
}

interface VendorMatchingProps {
  vendors: Vendor[];
  onSelectVendor: (vendorId: string) => void;
}

export default function VendorMatching({ vendors, onSelectVendor }: VendorMatchingProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="flex justify-center">
          <img
            src={logoUrl}
            alt="TUDAO"
            className="h-12 w-12"
            data-testid="img-logo-small"
          />
        </div>

        <ProgressTracker currentStep={6} totalSteps={8} />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              We've found verified providers near you
            </h2>
            <p className="text-sm text-muted-foreground">
              {vendors.length} providers match your requirements
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {vendors.map((vendor) => (
              <Card
                key={vendor.id}
                className="p-6 space-y-4 hover-elevate transition-all"
                data-testid={`card-vendor-${vendor.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {vendor.name}
                      </h3>
                      {vendor.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <img
                            src={logoUrl}
                            alt="Verified"
                            className="h-3 w-3 mr-1"
                          />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium">{vendor.rating}</span>
                      <span className="text-muted-foreground">
                        ({vendor.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: vendor.priceRange }).map((_, i) => (
                      <DollarSign key={i} className="h-4 w-4 text-primary" />
                    ))}
                    {Array.from({ length: 3 - vendor.priceRange }).map((_, i) => (
                      <DollarSign key={i} className="h-4 w-4 text-muted-foreground/30" />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {vendor.pastJobs}
                </p>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onSelectVendor(vendor.id)}
                  data-testid={`button-view-proposal-${vendor.id}`}
                >
                  View Proposal
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
