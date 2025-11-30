import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  const faqs = [
    { 
      q: 'What is a DAO?', 
      a: 'A DAO (Decentralized Autonomous Organization) is a blockchain-based organization governed by its members through transparent voting and smart contracts.' 
    },
    { 
      q: 'What does owning a node mean?', 
      a: 'Owning a node means you help validate transactions on the TUDAO network and participate in governance decisions. Your node also grants you access to platform features based on your tier level.' 
    },
    { 
      q: 'What payment methods do you accept?', 
      a: 'We accept USDC (on Base blockchain) and international wire transfers. All payments are processed securely.' 
    },
    { 
      q: 'Can I sell or transfer my node later?', 
      a: 'Verifier and Professional nodes are transferable. Founder nodes are non-transferable until an MVP unlock vote by the DAO.' 
    },
    { 
      q: 'What do I earn from my node?', 
      a: 'Node rewards are policy-based and variable, subject to DAO governance. Each node type has different FEU (Functional Equivalent Units) that determine governance weight and potential rewards.' 
    },
    { 
      q: 'How many Founder nodes are available?', 
      a: 'Founder nodes are strictly limited to 300 total. Once sold out, no additional Founder nodes will be minted.' 
    },
  ];

  return (
    <section className="bg-slate-900 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-12">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, idx) => (
            <AccordionItem 
              key={idx} 
              value={`item-${idx}`}
              className="border border-slate-700 rounded-lg px-6 bg-slate-800"
            >
              <AccordionTrigger 
                className="text-left text-lg font-semibold text-white hover:text-blue-400 hover:no-underline"
                data-testid={`faq-trigger-${idx}`}
              >
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 leading-relaxed" data-testid={`faq-content-${idx}`}>
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
