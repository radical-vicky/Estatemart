import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  vendor: string;
  image: string;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <div className="glass rounded-2xl overflow-hidden group hover:border-glow hover:-translate-y-1 transition-all duration-300">
      <div className="aspect-square bg-muted/30 relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <span className="font-mono text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 text-[10px] sm:text-xs font-mono px-2 py-1 rounded-full bg-primary/90 text-primary-foreground font-medium">
          {product.category}
        </span>
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mb-0.5 truncate">{product.vendor}</p>
        <h3 className="font-semibold text-sm text-foreground mb-2 truncate">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-base sm:text-lg font-bold text-primary font-mono">KSh {product.price.toLocaleString()}</span>
          <Button
            variant="glow"
            size="icon"
            className="rounded-full w-8 h-8 sm:w-9 sm:h-9"
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
