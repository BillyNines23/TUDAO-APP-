import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChooseActionScreen from "@/components/ChooseActionScreen";
import ServiceInputScreen from "@/components/ServiceInputScreen";
import IntentClassificationScreen from "@/components/IntentClassificationScreen";
import SmartScopeWizard from "@/components/SmartScopeWizard";
import ScopePreview from "@/components/ScopePreview";
import VendorMatching from "@/components/VendorMatching";
import ProposalDetails from "@/components/ProposalDetails";
import ConfirmationScreen from "@/components/ConfirmationScreen";
import type { ScopeSession } from "@shared/schema";

type Step = 
  | "welcome"
  | "choose-action"
  | "service-input"
  | "intent-classification"
  | "photo-upload"
  | "scope-wizard"
  | "scope-preview"
  | "vendor-matching"
  | "proposal-details"
  | "confirmation";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ScopeSession | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [intentClassification, setIntentClassification] = useState<{
    intent: "service" | "installation" | "unclear";
    confidence: number;
    reasoning: string;
  } | null>(null);

  const createSessionMutation = useMutation({
    mutationFn: async ({ description, photos, isUrgent }: { description: string; photos: File[]; isUrgent: boolean }) => {
      const res = await apiRequest('POST', '/api/scope-sessions', { 
        serviceDescription: description,
        isUrgent: isUrgent ? 1 : 0
      });
      const session: ScopeSession = await res.json();

      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => formData.append('photos', photo));
        
        await fetch(`/api/scope-sessions/${session.id}/photos`, {
          method: 'POST',
          body: formData,
        });
      }

      return session;
    },
    onSuccess: async (session) => {
      setSessionId(session.id);
      setCurrentSession(session);
      
      // Classify intent using Master Router
      const classificationRes = await apiRequest('POST', `/api/scope-sessions/${session.id}/classify-intent`, {});
      const classification = await classificationRes.json();
      setIntentClassification(classification);
      
      // If intent is clear and confidence is high, auto-set it and skip to wizard
      if (classification.intent !== "unclear" && classification.confidence > 0.8) {
        // CRITICAL: Persist the AI-predicted intent before proceeding to wizard
        await apiRequest('PATCH', `/api/scope-sessions/${session.id}`, {
          serviceIntent: classification.intent,
        });
        setCurrentStep("scope-wizard");
      } else {
        // Show manual selection screen if AI is uncertain
        setCurrentStep("intent-classification");
      }
    },
  });

  const setIntentMutation = useMutation({
    mutationFn: async ({ sessionId, intent }: { sessionId: string; intent: "service" | "installation" }) => {
      const res = await apiRequest('PATCH', `/api/scope-sessions/${sessionId}`, {
        serviceIntent: intent,
      });
      return res.json();
    },
    onSuccess: () => {
      setCurrentStep("scope-wizard");
    },
  });

  const { data: scopeData } = useQuery<{ scope: string }>({
    queryKey: ['/api/scope-sessions', sessionId, 'scope'],
    enabled: currentStep === "scope-preview" && !!sessionId,
  });

  const { data: updatedSession } = useQuery<ScopeSession>({
    queryKey: ['/api/scope-sessions', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/scope-sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      return response.json();
    },
    enabled: currentStep === "scope-preview" && !!sessionId,
  });

  const mockVendors = [
    {
      id: "1",
      name: "Mike's Fence Works",
      rating: 4.9,
      reviewCount: 127,
      pastJobs: "Completed 45+ fence installations and repairs. Specializes in wood and vinyl fencing.",
      priceRange: 2,
      verified: true
    },
    {
      id: "2",
      name: "ProFence Solutions",
      rating: 4.8,
      reviewCount: 89,
      pastJobs: "Expert in commercial and residential fencing. 10+ years experience with all fence types.",
      priceRange: 3,
      verified: true
    },
    {
      id: "3",
      name: "Budget Fence Repair",
      rating: 4.7,
      reviewCount: 156,
      pastJobs: "Fast, affordable fence repairs. Over 200 completed jobs in your area.",
      priceRange: 1,
      verified: true
    },
    {
      id: "4",
      name: "Elite Fencing Co.",
      rating: 4.9,
      reviewCount: 203,
      pastJobs: "Premium fence installation and repair. Licensed and insured with 15+ years experience.",
      priceRange: 3,
      verified: true
    }
  ];

  const handleServiceSubmit = (description: string, photos: File[], isUrgent: boolean) => {
    createSessionMutation.mutate({ description, photos, isUrgent });
  };

  const handleWizardComplete = () => {
    setCurrentStep("scope-preview");
  };

  const acceptScopeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest('POST', `/api/scope-sessions/${sessionId}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      setCurrentStep("vendor-matching");
    },
  });

  const handleAcceptScope = () => {
    if (sessionId) {
      acceptScopeMutation.mutate(sessionId);
    } else {
      setCurrentStep("vendor-matching");
    }
  };

  const handleEditScope = () => {
    console.log("Edit scope - would open inline editor");
  };

  const handleStartOver = () => {
    setCurrentStep("welcome");
    setSessionId(null);
    setCurrentSession(null);
    setSelectedVendorId("");
    setIntentClassification(null);
  };

  const handleSelectIntent = (intent: "service" | "installation") => {
    if (sessionId) {
      setIntentMutation.mutate({ sessionId, intent });
    }
  };

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setCurrentStep("proposal-details");
  };

  const handleSubmitRequest = () => {
    setCurrentStep("confirmation");
  };

  const handleBackToVendors = () => {
    setCurrentStep("vendor-matching");
  };

  const handleNewRequest = () => {
    handleStartOver();
  };

  const selectedVendor = mockVendors.find(v => v.id === selectedVendorId);

  return (
    <>
      {currentStep === "welcome" && (
        <WelcomeScreen onGetStarted={() => setCurrentStep("choose-action")} />
      )}

      {currentStep === "choose-action" && (
        <ChooseActionScreen
          onRequestService={() => setCurrentStep("service-input")}
          onBecomeProvider={() => console.log("Become provider flow - not implemented in Phase 1")}
        />
      )}

      {currentStep === "service-input" && (
        <ServiceInputScreen 
          onSubmit={handleServiceSubmit} 
          isProcessing={createSessionMutation.isPending}
        />
      )}

      {currentStep === "intent-classification" && intentClassification && (
        <IntentClassificationScreen
          onSelectIntent={handleSelectIntent}
          suggestedIntent={intentClassification.intent}
          confidence={intentClassification.confidence}
          reasoning={intentClassification.reasoning}
        />
      )}

      {currentStep === "scope-wizard" && sessionId && (
        <SmartScopeWizard
          sessionId={sessionId}
          onComplete={handleWizardComplete}
        />
      )}

      {currentStep === "scope-preview" && (
        <ScopePreview
          scope={scopeData?.scope || ""}
          structuredScope={updatedSession?.structuredScope as any}
          isUrgent={!!(updatedSession?.isUrgent || currentSession?.isUrgent)}
          urgentFeePercent={(updatedSession?.urgentFeePercent || currentSession?.urgentFeePercent) || 25}
          recommendedProviderType={updatedSession?.recommendedProviderType || currentSession?.recommendedProviderType}
          onAccept={handleAcceptScope}
          onEdit={handleEditScope}
          onStartOver={handleStartOver}
        />
      )}

      {currentStep === "vendor-matching" && (
        <VendorMatching
          vendors={mockVendors}
          onSelectVendor={handleSelectVendor}
        />
      )}

      {currentStep === "proposal-details" && selectedVendor && (
        <ProposalDetails
          vendorName={selectedVendor.name}
          scope={scopeData?.scope || ""}
          cost={480}
          timeWindow="Thursday 9AM"
          onSubmit={handleSubmitRequest}
          onBack={handleBackToVendors}
        />
      )}

      {currentStep === "confirmation" && (
        <ConfirmationScreen onNewRequest={handleNewRequest} />
      )}
    </>
  );
}
