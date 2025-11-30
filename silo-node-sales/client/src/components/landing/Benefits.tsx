export function Benefits() {
  const benefits = [
    { num: 1, text: 'Earn rewards from real-world service transactions' },
    { num: 2, text: 'Help maintain transparency and trust on the network' },
    { num: 3, text: 'Gain early access to future DAO voting rights' },
    { num: 4, text: 'Priority participation in platform expansion and partner programs' }
  ];

  return (
    <section className="bg-muted/50 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Become a Validator Node Owner
        </h2>
        <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
          TUDAO runs on a distributed node network. By owning a node, you help validate service transactions, support protocol integrity, and participate in governance and feature access — as defined by the DAO.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <div 
              key={benefit.num} 
              className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl flex items-start gap-4"
            >
              <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 font-bold">
                {benefit.num}
              </div>
              <p className="text-lg pt-1">{benefit.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
