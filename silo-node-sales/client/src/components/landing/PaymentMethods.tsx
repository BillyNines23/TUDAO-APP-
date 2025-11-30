import { Wallet, CreditCard, Building2 } from "lucide-react";

export function PaymentMethods() {
  const methods = [
    {
      icon: Wallet,
      name: 'Crypto (USDC)',
      description: 'Pay with USDC on Base blockchain',
      network: 'Base Network',
    },
    {
      icon: CreditCard,
      name: 'Credit/Debit Card',
      description: 'Secure card payment processing',
      network: 'Instant Processing',
    },
    {
      icon: Building2,
      name: 'Wire Transfer',
      description: 'International bank wire transfer',
      network: '1-3 Business Days',
    },
  ];

  return (
    <section className="bg-slate-800 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Choose Your <span className="text-blue-400">Payment</span> Method
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          We support both crypto-native and traditional payment methods to make purchasing your node as easy as possible.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {methods.map((method) => {
            const Icon = method.icon;
            return (
              <div 
                key={method.name}
                className="bg-slate-900 rounded-xl p-6 text-center hover:bg-slate-850 transition-colors"
              >
                <div className="bg-blue-600/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{method.name}</h3>
                <p className="text-slate-300 mb-2">{method.description}</p>
                <p className="text-sm text-slate-500">{method.network}</p>
              </div>
            );
          })}
        </div>
        
        <p className="text-slate-400 text-sm text-center mt-8 italic">
          All payments are processed securely. NFT will be minted to your wallet upon successful payment.
        </p>
      </div>
    </section>
  );
}
