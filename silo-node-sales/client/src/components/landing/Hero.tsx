import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function Hero() {
  const scrollToNodes = () => {
    const element = document.getElementById('nodes-section');
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-20 relative">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        {/* TODO: Replace with local logo asset when available */}
        <img 
          src="https://d64gsuwffb70l.cloudfront.net/68cec0ec352edbab2b9157f4_1761238550294_67ea91c0.jpeg" 
          alt="TUDAO Logo" 
          className="w-48 h-48 mx-auto mb-8 rounded-full shadow-2xl"
        />
        
        <h1 className="text-5xl md:text-7xl font-bold">
          For Those Who <br />
          <span className="text-blue-400">Do the Work</span>
        </h1>
        
        <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          A decentralized labor platform where customers and skilled workers connect directly — powered by AI, smart contracts, and mutual transparency.
        </p>
        
        <Button 
          onClick={scrollToNodes}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-6 text-lg"
          data-testid="button-buy-node"
        >
          Buy a Node
          <ChevronDown className="ml-2 h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-slate-400" />
      </div>
    </section>
  );
}
