import React from 'react';
const NodeTiers: React.FC = () => {
  const nodes = [{
    name: 'Founding Node',
    price: '$10,000',
    badge: 'https://d64gsuwffb70l.cloudfront.net/68cec0ec352edbab2b9157f4_1761239297968_96616789.png',
    features: ['Highest-tier access across the protocol', 'Lifetime access to advanced features and governance rights', 'Strictly limited to 300 total nodes', 'Designed for long-term ecosystem founders and protocol architects'],
    color: 'border-yellow-600',
    label: 'Architect Controlled Unlock'
  }, {
    name: 'Professional Node',
    price: '$5,000',
    badge: 'https://d64gsuwffb70l.cloudfront.net/68cec0ec352edbab2b9157f4_1761239297678_c7112d90.png',
    features: ['Performs regional validation across service categories', 'Expanded governance access and ecosystem engagement', 'Suitable for partners, contractors, or service providers'],
    color: 'border-slate-600'
  }, {
    name: 'Verifier Node',
    price: '$1,000',
    badge: 'https://d64gsuwffb70l.cloudfront.net/68cec0ec352edbab2b9157f4_1761239297255_0033d929.png',
    features: ['Supports protocol integrity and basic validation', 'Access to select governance discussions', 'Ideal for individuals looking to contribute to decentralization'],
    color: 'border-orange-600'
  }];
  return <section id="nodes-section" className="bg-slate-900 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Own a <span className="text-blue-400">TUDAO</span> Node
        </h2>
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {nodes.map(node => <div key={node.name} className={`bg-slate-800 border-t-4 ${node.color} rounded-xl p-6 relative`}>
              {node.label && <div className="absolute -top-3 left-6 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {node.label}
                </div>}
              <img src={node.badge} alt={node.name} className="w-24 h-24 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white text-center mb-2">{node.name}</h3>
              <p className="text-4xl font-bold text-white text-center mb-6">{node.price}</p>
              <ul className="space-y-3 mb-6">
                {node.features.map((feature, idx) => <li key={idx} className="text-slate-300 text-sm leading-relaxed">{feature}</li>)}
              </ul>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition">
                Buy Now
              </button>
            </div>)}
        </div>
        <p className="text-slate-400 text-sm text-center italic">
          *Node ownership does not guarantee financial returns. All rights, features, and participation access are subject to DAO governance and future protocol decisions.
        </p>
      </div>
    </section>;
};
export default NodeTiers;