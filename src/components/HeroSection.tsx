import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-background/85" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-green" />
            <span className="text-xs font-mono text-muted-foreground">Now serving your estate</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-foreground">Your estate,</span>
            <br />
            <span className="text-gradient-green">delivered.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
            Order groceries, household items, and services from verified vendors within your residential estate. Fast delivery, secure M-Pesa payments.
          </p>

          <div className="flex flex-wrap gap-3 mb-16">
            <Button variant="glow" size="lg" className="gap-2">
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="lg">
              Become a Vendor
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Truck, label: "Estate Delivery", desc: "30 min or less" },
              { icon: Shield, label: "M-Pesa Secure", desc: "STK Push payments" },
              { icon: Zap, label: "Instant Updates", desc: "Real-time tracking" },
            ].map((item) => (
              <div key={item.label} className="glass rounded-xl p-4 flex items-start gap-3 border-glow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
