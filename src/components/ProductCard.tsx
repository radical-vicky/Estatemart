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
    <div className="glass rounded-xl overflow-hidden group hover:border-glow transition-all duration-300">
      <div className="aspect-square bg-secondary/50 relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="font-mono text-sm text-muted-foreground">Out of Stock</span>
          </div>
        )}
        <span className="absolute top-3 left-3 text-xs font-mono px-2 py-1 rounded-md bg-primary/20 text-primary border border-primary/30">
          {product.category}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground font-mono mb-1">{product.vendor}</p>
        <h3 className="font-semibold text-foreground mb-2">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary font-mono">KSh {product.price}</span>
          <Button
            variant="glow"
            size="icon"
            className="rounded-full w-9 h-9"
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
