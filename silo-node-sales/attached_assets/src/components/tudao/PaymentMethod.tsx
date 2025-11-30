import React, { useState } from 'react';

const PaymentMethod: React.FC = () => {
  const [selected, setSelected] = useState('AVAX');

  return (
    <section className="bg-slate-800 py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Choose <span className="text-blue-400">Payment</span> Method
        </h2>
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setSelected('AVAX')}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              selected === 'AVAX' 
                ? 'bg-red-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            AVAX
          </button>
          <button
            onClick={() => setSelected('USDC')}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              selected === 'USDC' 
                ? 'bg-red-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            USDC <span className="text-sm">(on Avalanche)</span>
          </button>
        </div>
        <p className="text-slate-400 text-sm">Selected: <span className="font-semibold">{selected}</span></p>
      </div>
    </section>
  );
};

export default PaymentMethod;
