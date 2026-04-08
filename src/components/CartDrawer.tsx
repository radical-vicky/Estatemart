import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "./ProductCard";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

const CartDrawer = ({ open, onClose, items, onUpdateQuantity, onRemove }: CartDrawerProps) => {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      {open && <div className="fixed inset-0 bg-background/60 z-40" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 glass-strong transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Your Cart</h2>
              <span className="font-mono text-xs text-muted-foreground">({items.length})</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-4 opacity-30" />
                <p className="font-mono text-sm">Cart is empty</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="glass rounded-lg p-3 flex gap-3">
                  <img src={item.product.image} alt={item.product.name} className="w-16 h-16 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.product.vendor}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-mono font-bold text-sm">KSh {item.product.price * item.quantity}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => item.quantity === 1 ? onRemove(item.product.id) : onUpdateQuantity(item.product.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-mono text-sm w-6 text-center text-foreground">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onUpdateQuantity(item.product.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-primary font-mono">KSh {total}</span>
              </div>
              <Button variant="glow" className="w-full" size="lg">
                Pay with M-Pesa
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
