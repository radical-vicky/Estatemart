import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

const Navbar = ({ cartCount, onCartClick }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            Estate<span className="text-primary">Mart</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a href="#products" className="text-sm text-muted-foreground hover:text-primary transition-colors">Products</a>
          <a href="#categories" className="text-sm text-muted-foreground hover:text-primary transition-colors">Categories</a>
          <a href="#vendors" className="text-sm text-muted-foreground hover:text-primary transition-colors">Vendors</a>
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
          <Button variant="glow" size="sm" className="hidden md:flex">
            Sign In
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-border px-4 py-4 space-y-3">
          <a href="#products" className="block text-sm text-muted-foreground hover:text-primary">Products</a>
          <a href="#categories" className="block text-sm text-muted-foreground hover:text-primary">Categories</a>
          <a href="#vendors" className="block text-sm text-muted-foreground hover:text-primary">Vendors</a>
          <Button variant="glow" size="sm" className="w-full">Sign In</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
