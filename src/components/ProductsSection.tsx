import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./ProductCard";

interface ProductsSectionProps {
  onAddToCart: (product: Product) => void;
}

const ProductsSection = ({ onAddToCart }: ProductsSectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category,
            vendor: p.vendor_name,
            image: p.image_url || "https://images.unsplash.com/photo-1523049673857-eb18f1d85f27?w=400&h=400&fit=crop",
            inStock: p.in_stock,
          }))
        );
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <section id="products" className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <span className="font-mono text-sm text-primary">Popular Items</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Fresh from your estate</h2>
        <p className="text-muted-foreground mb-10 max-w-lg">Browse products from verified vendors right in your neighborhood.</p>

        {loading ? (
          <p className="text-muted-foreground">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No products yet. Vendors can add products from the Vendor Dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsSection;
