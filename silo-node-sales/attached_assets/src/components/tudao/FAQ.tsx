import React, { useState } from 'react';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(4);

  const faqs = [
    { q: 'What is a DAO?', a: 'A DAO (Decentralized Autonomous Organization) is a blockchain-based organization governed by its members through transparent voting and smart contracts.' },
    { q: 'What does owning a node mean?', a: 'Owning a node means you help validate transactions on the TUDAO network and participate in governance decisions.' },
    { q: 'Do I need to know crypto to participate?', a: 'Basic understanding is helpful, but we provide guides and support to help you get started with the platform.' },
    { q: 'Can I sell or transfer my node later?', a: 'Yes, most node types are transferable. Check specific node tier details for transfer restrictions.' },
    { q: 'What do I earn from my node?', a: 'Each node type comes with a token emission rate and governance weight. Emissions details will be released in the whitepaper.' }
  ];

  return (
    <section className="bg-slate-900 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-slate-700 pb-4">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-white hover:text-blue-400 transition"
              >
                {faq.q}
                <span className="text-2xl">{openIndex === idx ? '−' : '+'}</span>
              </button>
              {openIndex === idx && (
                <p className="mt-3 text-slate-300 leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
