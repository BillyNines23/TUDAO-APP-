import React from 'react';
const Hero: React.FC = () => {
  const scrollToNodes = () => {
    const element = document.getElementById('nodes-section');
    element?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-20">
      <img src="https://d64gsuwffb70l.cloudfront.net/68cec0ec352edbab2b9157f4_1761238550294_67ea91c0.jpeg" alt="TUDAO Logo" className="w-48 h-48 mb-8 animate-fade-in" />
      <h1 className="text-5xl md:text-6xl font-bold text-center mb-6">
        For Those Who <br />
        <span className="text-blue-400">Do the Work</span>
      </h1>
      <p className="text-lg md:text-xl text-slate-300 text-center max-w-3xl mb-10 leading-relaxed">
        A decentralized labor platform where customers and skilled workers connect directly — powered by AI, smart contracts, and mutual transparency.
      </p>
      <button onClick={scrollToNodes} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all transform hover:scale-105">
        Buy a Node
      </button>
    </section>;
};
export default Hero;