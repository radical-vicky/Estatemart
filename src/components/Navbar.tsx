import { ShoppingCart, Menu, X, LogOut, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import ThemeToggle from "@/components/ThemeToggle";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

const Navbar = ({ cartCount, onCartClick }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SupaUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass-strong shadow-lg" : "bg-transparent"}`}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-mono font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            Estate<span className="text-primary">Mart</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="#products" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">Products</a>
          <a href="#categories" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">Categories</a>
          <Link to="/vendor" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">Vendor</Link>
          {user && (
            <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium">
              <ClipboardList className="w-3.5 h-3.5" /> Orders
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-mono font-bold">
                {cartCount}
              </span>
            )}
          </Button>
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="glow" size="sm" className="hidden md:flex" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-border px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <a href="#products" className="block text-sm text-muted-foreground hover:text-primary font-medium">Products</a>
          <a href="#categories" className="block text-sm text-muted-foreground hover:text-primary font-medium">Categories</a>
          <Link to="/vendor" className="block text-sm text-muted-foreground hover:text-primary font-medium">Vendor Dashboard</Link>
          {user && (
            <Link to="/orders" className="block text-sm text-muted-foreground hover:text-primary font-medium">Order History</Link>
          )}
          {user ? (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
            </div>
          ) : (
            <Button variant="glow" size="sm" className="w-full" onClick={() => navigate("/auth")}>Sign In</Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
