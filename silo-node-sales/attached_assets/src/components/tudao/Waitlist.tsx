import React, { useState } from 'react';

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail('');
    }
  };

  return (
    <section className="bg-gradient-to-r from-blue-700 to-blue-900 py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Join the Revolution?
        </h2>
        <p className="text-xl text-blue-100 mb-8 leading-relaxed">
          Whether you're a provider, property owner, or early supporter — join the waitlist to shape the future of decentralized labor.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="px-6 py-4 rounded-lg w-full sm:w-96 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg transition whitespace-nowrap"
          >
            Reserve My Node
          </button>
        </form>
        {submitted && (
          <p className="mt-4 text-green-300 font-semibold">Thank you! You've been added to the waitlist.</p>
        )}
      </div>
    </section>
  );
};

export default Waitlist;
