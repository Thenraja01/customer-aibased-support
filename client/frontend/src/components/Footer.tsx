import { Link } from "react-router-dom";
import { Bot } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

const footerLinks = {
  Product: [
    { name: "Services", path: "/services" },
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
    { name: "Case Studies", path: "/case-studies" },
  ],
  Company: [
    { name: "About Us", path: "/about" },
    { name: "Blog", path: "/blog" },
    { name: "Contact", path: "/contact" },
    { name: "FAQ", path: "/faq" },
  ],
  Legal: [
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Terms of Service", path: "/terms" },
  ],
};

export default function Footer() {
  const { settings } = useAppSettings();
  const appName = settings?.app_name || "SupportAI";

  return (
    <footer className="border-t bg-muted/40 dark:bg-gradient-to-b dark:from-background dark:to-background/80 dark:border-white/[0.06]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo?.url ? (
                <img src={settings.logo.url} alt={appName} className="h-6 w-auto" />
              ) : (
                <Bot className="h-6 w-6 text-primary" />
              )}
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {appName}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {settings?.marketing?.footer_text || "Transforming customer service with AI-powered automation for businesses worldwide."}
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t dark:border-white/[0.06] text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {appName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
