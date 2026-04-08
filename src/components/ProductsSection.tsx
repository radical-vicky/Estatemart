import ProductCard, { Product } from "./ProductCard";
import { ShoppingBag } from "lucide-react";

const PRODUCTS: Product[] = [
  { id: "1", name: "Fresh Avocados", price: 150, category: "Groceries", vendor: "Green Basket", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d85f27?w=400&h=400&fit=crop", inStock: true },
  { id: "2", name: "Whole Milk 1L", price: 85, category: "Dairy", vendor: "Estate Dairy", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop", inStock: true },
  { id: "3", name: "Brown Bread", price: 60, category: "Bakery", vendor: "Daily Bakes", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop", inStock: true },
  { id: "4", name: "Free Range Eggs (Tray)", price: 450, category: "Groceries", vendor: "Green Basket", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop", inStock: true },
  { id: "5", name: "Cooking Oil 2L", price: 380, category: "Essentials", vendor: "Quick Mart", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop", inStock: false },
  { id: "6", name: "Tomatoes 1kg", price: 120, category: "Groceries", vendor: "Green Basket", image: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop", inStock: true },
  { id: "7", name: "Chicken Breast 500g", price: 550, category: "Meat", vendor: "Estate Butchery", image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop", inStock: true },
  { id: "8", name: "Sukuma Wiki Bundle", price: 30, category: "Groceries", vendor: "Green Basket", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop", inStock: true },
];

interface ProductsSectionProps {
  onAddToCart: (product: Product) => void;
}

const ProductsSection = ({ onAddToCart }: ProductsSectionProps) => {
  return (
    <section id="products" className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <span className="font-mono text-sm text-primary">Popular Items</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Fresh from your estate</h2>
        <p className="text-muted-foreground mb-10 max-w-lg">Browse products from verified vendors right in your neighborhood.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
