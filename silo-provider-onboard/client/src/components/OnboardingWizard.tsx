import { useState, useEffect } from "react";
import WizardHeader from "./WizardHeader";
import WizardFooter from "./WizardFooter";
import AccountStep from "./steps/AccountStep";
import BusinessProfileStep from "./steps/BusinessProfileStep";
import DocumentsStep from "./steps/DocumentsStep";
import CapabilitiesStep from "./steps/CapabilitiesStep";
import PayoutStep from "./steps/PayoutStep";
import LegalStep from "./steps/LegalStep";
import ReviewStep from "./steps/ReviewStep";

const WIZARD_STEPS = [
  { number: 1, label: "Account" },
  { number: 2, label: "Business" },
  { number: 3, label: "Documents" },
  { number: 4, label: "Capabilities" },
  { number: 5, label: "Payout" },
  { number: 6, label: "Legal" },
  { number: 7, label: "Review" },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<any>({
    legalName: "Test Business LLC",
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    if (step) {
      const stepNumber = parseInt(step, 10);
      if (stepNumber >= 1 && stepNumber <= 7) {
        setCurrentStep(stepNumber);
      }
    }
  }, []);

  const handleNext = (stepData?: any) => {
    if (stepData) {
      setApplicationData((prev: any) => ({ ...prev, ...stepData }));
    }
    setCurrentStep((prev) => Math.min(prev + 1, 7));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AccountStep onNext={handleNext} />;
      case 2:
        return <BusinessProfileStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <DocumentsStep onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <CapabilitiesStep onNext={handleNext} onBack={handleBack} />;
      case 5:
        return (
          <PayoutStep
            onNext={handleNext}
            onBack={handleBack}
            walletAddress={applicationData.walletAddress}
          />
        );
      case 6:
        return (
          <LegalStep
            onNext={handleNext}
            onBack={handleBack}
            signerName={applicationData.legalName || "Business Owner"}
            walletAddress={applicationData.walletAddress}
          />
        );
      case 7:
        return (
          <ReviewStep
            onSubmit={() => console.log("Application submitted")}
            onBack={handleBack}
            applicationData={applicationData}
          />
        );
      default:
        return <AccountStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WizardHeader currentStep={currentStep} steps={WIZARD_STEPS} />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        {renderStep()}
      </main>
      <WizardFooter />
    </div>
  );
}
