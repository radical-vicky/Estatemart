import { Apple, Beef, Milk, Package, Croissant, Sparkles } from "lucide-react";

const categories = [
  { name: "Groceries", icon: Apple, count: 24 },
  { name: "Meat", icon: Beef, count: 8 },
  { name: "Dairy", icon: Milk, count: 12 },
  { name: "Essentials", icon: Package, count: 18 },
  { name: "Bakery", icon: Croissant, count: 6 },
  { name: "Services", icon: Sparkles, count: 5 },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="py-20">
      <div className="container mx-auto px-4">
        <span className="font-mono text-sm text-primary mb-2 block">Browse by</span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">Categories</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="glass rounded-xl p-6 text-center cursor-pointer hover:border-glow hover:glow-green transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <cat.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{cat.count} items</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
