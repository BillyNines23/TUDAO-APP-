import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="https://d64gsuwffb70l.cloudfront.net/68cec0ec352edbab2b9157f4_1761237194207_47899cd3.png" 
                alt="TUDAO" 
                className="w-10 h-10"
              />
              <h3 className="text-xl font-bold text-blue-400">TUDAO</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Empowering skilled tradespeople through decentralized technology and fair compensation.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="https://tradeuniondao.com/docs/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition">Whitepaper</a></li>
              <li><a href="https://tradeuniondao.com/docs/constitution.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition">Constitution</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 transition">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-2">
              <li><a href="https://x.com/dao_tudao" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition">𝕏 Twitter</a></li>
              <li><a href="https://discord.gg/YourInviteCodeHere" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition">▶ Discord</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-blue-400 transition">Contact</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 transition">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 transition">Legal Disclaimer</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 text-center">
          <p className="text-slate-500 text-sm">© 2024 TradeUnion DAO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
