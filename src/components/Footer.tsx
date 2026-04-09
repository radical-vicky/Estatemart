import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-mono font-bold text-xs">E</span>
            </div>
            <span className="font-bold text-foreground">
              Estate<span className="text-primary">Mart</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/vendor" className="hover:text-primary transition-colors">Vendors</Link>
            <Link to="/orders" className="hover:text-primary transition-colors">Orders</Link>
            <Link to="/auth" className="hover:text-primary transition-colors">Account</Link>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            © 2026 EstateMart — Group 9 Project
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
