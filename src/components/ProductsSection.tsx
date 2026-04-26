import { useState, useEffect, useMemo } from "react";
import ProductCard, { Product } from "./ProductCard";
import ProductModal from "./ProductModal";
import { ShoppingBag, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductsSectionProps {
  onAddToCart: (product: Product) => void;
}

const categories = ["All", "Groceries", "Dairy", "Bakery", "Meat", "Essentials", "Beverages", "Household"];

const ProductsSection = ({ onAddToCart }: ProductsSectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        toast({ title: "Error loading products", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const formattedProducts: Product[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category: p.category || "General",
          vendor: p.vendor_name || "EstateMart Vendor",
          vendor_id: p.vendor_id,
          vendor_name: p.vendor_name || "EstateMart Vendor",
          image: p.image_url || "https://images.unsplash.com/photo-1523049673857-eb18f1d85f27?w=400&h=400&fit=crop",
          additional_images: p.additional_images || [],
          inStock: p.in_stock !== false,
          description: p.description || "",
        }));
        setProducts(formattedProducts);
        console.log("Products loaded:", formattedProducts.length);
      } else {
        console.log("No products found");
        setProducts([]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({ title: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (product: Product) => {
    console.log("Viewing product details:", product.name);
    setSelectedProduct(product);
    setModalOpen(true);
  };

  // FIXED: This function now properly calls onAddToCart AND shows notification
  const handleAddToCart = (product: Product) => {
    console.log("Adding to cart:", product.name);
    
    // Call the parent's add to cart function (updates cart state)
    if (onAddToCart) {
      onAddToCart(product);
    }
    
    // Show success notification
    toast({
      title: "Added to Cart",
      description: `${product.name} added to your cart`,
    });
  };

  const handleAddMultipleToCart = (product: Product, quantity: number) => {
    console.log(`Adding ${quantity}x ${product.name} to cart from modal`);
    for (let i = 0; i < quantity; i++) {
      if (onAddToCart) {
        onAddToCart(product);
      }
    }
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added to your cart`,
    });
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.vendor_name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  if (loading) {
    return (
      <section id="products" className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-muted-foreground">Loading products...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="products" className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm text-primary">Popular Items</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Fresh from your estate</h2>
          <p className="text-muted-foreground mb-6 max-w-lg">
            Browse products from verified vendors right in your neighborhood. ({products.length} products available)
          </p>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products or vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground glow-green"
                      : "glass text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">
                {products.length === 0
                  ? "No products yet. Vendors can add products from the Vendor Dashboard."
                  : "No products match your search. Try a different keyword."}
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {filtered.length} of {products.length} products
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddToCart={handleAddMultipleToCart}
      />
    </>
  );
};

export default ProductsSection;