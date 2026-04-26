import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  vendor: string;
  vendor_id?: string | null;
  vendor_name: string;
  image: string;
  additional_images?: string[];
  inStock: boolean;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart, onViewDetails }: ProductCardProps) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("🔵 ProductCard: Add to cart clicked for:", product.name);
    console.log("🔵 ProductCard: onAddToCart function exists:", typeof onAddToCart === "function");
    
    if (typeof onAddToCart === "function") {
      onAddToCart(product);
      console.log("🔵 ProductCard: onAddToCart called successfully");
    } else {
      console.error("🔴 ProductCard: onAddToCart is NOT a function!", onAddToCart);
    }
  };

  return (
    <div 
      className="glass rounded-2xl overflow-hidden group hover:border-glow hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => onViewDetails(product)}
    >
      <div className="aspect-square bg-muted/30 relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/400x400/22c55e/white?text=" + encodeURIComponent(product.name);
          }}
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <span className="font-mono text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 text-[10px] sm:text-xs font-mono px-2 py-1 rounded-full bg-primary/90 text-primary-foreground font-medium">
          {product.category}
        </span>
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2.5 right-2.5 p-2 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          disabled={!product.inStock}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">{product.vendor_name}</p>
          <Eye className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="font-semibold text-sm text-foreground mb-2 truncate">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-base sm:text-lg font-bold text-primary font-mono">KSh {product.price.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;