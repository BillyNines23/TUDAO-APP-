import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Benefits } from "@/components/landing/Benefits";
import { NodeTiers } from "@/components/landing/NodeTiers";
import { FAQ } from "@/components/landing/FAQ";
import { PaymentMethods } from "@/components/landing/PaymentMethods";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <Benefits />
      <NodeTiers />
      <FAQ />
      <PaymentMethods />
      <Footer />
    </div>
  );
}
