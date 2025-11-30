import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { config, formatPrice } from "@/lib/config";
import { Badge } from "@/components/ui/badge";

export function NodeTiers() {
  const [, setLocation] = useLocation();

  const nodes = [
    {
      name: 'Founder',
      tier: 'Founder' as const,
      price: formatPrice(config.tiers.Founder.price),
      badge: config.assets.badges.Founder,
      features: [
        'Highest-tier access across the protocol',
        'Lifetime access to advanced features and governance rights',
        'Strictly limited to 300 total nodes',
        'Designed for long-term ecosystem founders and protocol architects'
      ],
      color: 'border-yellow-600',
      label: 'Architect Controlled Unlock',
      feuPoints: 15,
    },
    {
      name: 'Professional',
      tier: 'Professional' as const,
      price: formatPrice(config.tiers.Professional.price),
      badge: config.assets.badges.Professional,
      features: [
        'Performs regional validation across service categories',
        'Expanded governance access and ecosystem engagement',
        'Suitable for partners, contractors, or service providers'
      ],
      color: 'border-slate-600',
      feuPoints: 7,
    },
    {
      name: 'Verifier',
      tier: 'Verifier' as const,
      price: formatPrice(config.tiers.Verifier.price),
      badge: config.assets.badges.Verifier,
      features: [
        'Supports protocol integrity and basic validation',
        'Access to select governance discussions',
        'Ideal for individuals looking to contribute to decentralization'
      ],
      color: 'border-orange-600',
      feuPoints: 1,
    },
  ];

  const handleBuyNode = (tier: 'Verifier' | 'Professional' | 'Founder') => {
    setLocation(`/checkout?tier=${tier}`);
  };

  return (
    <section id="nodes-section" className="bg-slate-900 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Own a <span className="text-blue-400">TUDAO</span> Node
        </h2>
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {nodes.map(node => (
            <div 
              key={node.name} 
              className={`bg-slate-800 border-t-4 ${node.color} rounded-xl p-6 relative hover-elevate`}
            >
              {node.label && (
                <Badge className="absolute -top-3 left-6 bg-orange-500 hover:bg-orange-500 text-white text-xs px-3 py-1 font-semibold">
                  {node.label}
                </Badge>
              )}
              <img 
                src={node.badge} 
                alt={node.name} 
                className="w-24 h-24 mx-auto mb-4" 
              />
              <h3 className="text-2xl font-bold text-white text-center mb-2">{node.name} Node</h3>
              <p className="text-4xl font-bold text-white text-center mb-2">{node.price}</p>
              <p className="text-sm text-slate-400 text-center mb-6">{node.feuPoints} FEU</p>
              <ul className="space-y-3 mb-6 min-h-[180px]">
                {node.features.map((feature, idx) => (
                  <li key={idx} className="text-slate-300 text-sm leading-relaxed flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => handleBuyNode(node.tier)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold"
                data-testid={`button-buy-${node.tier.toLowerCase()}`}
              >
                Buy Now
              </Button>
            </div>
          ))}
        </div>
        <p className="text-slate-400 text-sm text-center italic max-w-4xl mx-auto">
          *Node ownership does not guarantee financial returns. All rights, features, and participation access are subject to DAO governance and future protocol decisions.
        </p>
      </div>
    </section>
  );
}
