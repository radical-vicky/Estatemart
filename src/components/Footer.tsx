const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-mono font-bold text-xs">E</span>
            </div>
            <span className="font-bold text-foreground">
              Estate<span className="text-primary">Mart</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            © 2026 EstateMart — Group 9 Project. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
