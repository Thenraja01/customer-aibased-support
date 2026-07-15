import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Bot, User, LogOut, ChevronDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  
  { name: "Features", path: "/features" },
  { name: "Industries", path: "/industries" },
  { name: "Pricing", path: "/pricing" },

  { name: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">SupportAI</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location.pathname === link.path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <Button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover shadow-lg p-1">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b mb-1">
                    {user.email}
                    <div className="text-primary font-medium capitalize">{user.role_id}</div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: "ghost" })}>
                Log In
              </Link>
              <Link to="/register" className={buttonVariants({ variant: "ghost" })}>
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t bg-background px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 text-sm font-medium rounded-md",
                location.pathname === link.path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-4 border-t space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  {user.name} ({user.role_id})
                </div>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                  Log In
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className={cn(buttonVariants({ variant: "default" }), "w-full")}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}