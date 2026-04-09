import { Apple, Beef, Milk, Package, Croissant, Sparkles } from "lucide-react";

const categories = [
  { name: "Groceries", icon: Apple, color: "from-emerald-500/20 to-emerald-500/5" },
  { name: "Meat", icon: Beef, color: "from-red-500/20 to-red-500/5" },
  { name: "Dairy", icon: Milk, color: "from-blue-500/20 to-blue-500/5" },
  { name: "Essentials", icon: Package, color: "from-amber-500/20 to-amber-500/5" },
  { name: "Bakery", icon: Croissant, color: "from-orange-500/20 to-orange-500/5" },
  { name: "Services", icon: Sparkles, color: "from-purple-500/20 to-purple-500/5" },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <span className="font-mono text-sm text-primary mb-2 block uppercase tracking-wider">Browse by</span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Categories</h2>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="glass rounded-2xl p-4 sm:p-6 text-center cursor-pointer hover:border-glow hover:glow-green transition-all duration-300 group hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <cat.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-xs sm:text-sm text-foreground">{cat.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
