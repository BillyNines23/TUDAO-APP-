import React from 'react';
import Hero from './tudao/Hero';
import About from './tudao/About';
import Benefits from './tudao/Benefits';
import NodeTiers from './tudao/NodeTiers';
import FAQ from './tudao/FAQ';
import PaymentMethod from './tudao/PaymentMethod';
import Waitlist from './tudao/Waitlist';
import Footer from './tudao/Footer';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <Benefits />
      <NodeTiers />
      <FAQ />
      <PaymentMethod />
      <Waitlist />
      <Footer />
    </div>
  );
};

export default AppLayout;

