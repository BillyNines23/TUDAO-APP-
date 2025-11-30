import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";

export function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer className="bg-slate-950 text-white py-12 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">TUDAO</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Empowering skilled tradespeople through decentralized technology and fair compensation.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="https://docs.tradeuniondao.com/whitepaper" className="hover:text-blue-400 transition" target="_blank" rel="noopener noreferrer">
                  Whitepaper
                </a>
              </li>
              <li>
                <a href="https://docs.tradeuniondao.com/constitution" className="hover:text-blue-400 transition" target="_blank" rel="noopener noreferrer">
                  Constitution
                </a>
              </li>
              <li>
                <a href="#faq-section" className="hover:text-blue-400 transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="https://x.com/dao_tudao" className="hover:text-blue-400 transition inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer" data-testid="footer-link-twitter">
                  <ChevronRight className="w-3 h-3" />
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://discord.com/invite/tvzpAapYPQ" className="hover:text-blue-400 transition inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer" data-testid="footer-link-discord">
                  <ChevronRight className="w-3 h-3" />
                  Discord
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="mailto:contact@tradeuniondao.com" className="hover:text-blue-400 transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="https://tradeuniondao.com/terms" className="hover:text-blue-400 transition" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="https://tradeuniondao.com/legal" className="hover:text-blue-400 transition" target="_blank" rel="noopener noreferrer">
                  Legal Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} TradeUnion DAO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
