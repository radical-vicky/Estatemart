import { ShoppingCart, Menu, X, LogOut, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

const Navbar = ({ cartCount, onCartClick }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SupaUser | null>(null);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            Estate<span className="text-primary">Mart</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="#products" className="text-sm text-muted-foreground hover:text-primary transition-colors">Products</a>
          <a href="#categories" className="text-sm text-muted-foreground hover:text-primary transition-colors">Categories</a>
          <Link to="/vendor" className="text-sm text-muted-foreground hover:text-primary transition-colors">Vendor Dashboard</Link>
          {user && (
            <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" /> Orders
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="glass" size="icon" className="relative" onClick={onCartClick}>
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-mono">
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
        <div className="md:hidden glass-strong border-t border-border px-4 py-4 space-y-3">
          <a href="#products" className="block text-sm text-muted-foreground hover:text-primary">Products</a>
          <a href="#categories" className="block text-sm text-muted-foreground hover:text-primary">Categories</a>
          <Link to="/vendor" className="block text-sm text-muted-foreground hover:text-primary">Vendor Dashboard</Link>
          {user && (
            <Link to="/orders" className="block text-sm text-muted-foreground hover:text-primary">Order History</Link>
          )}
          {user ? (
            <div className="flex items-center justify-between">
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
