import { ExternalLink } from "lucide-react";

export default function WizardFooter() {
  const links = [
    { label: "TUDAO Constitution", url: "https://tudao.org/constitution" },
    { label: "Terms", url: "https://tudao.org/terms" },
    { label: "Privacy", url: "https://tudao.org/privacy" },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          {links.map((link, index) => (
            <div key={link.label} className="flex items-center">
              {index > 0 && <span className="mr-4 text-border">|</span>}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1"
                data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
