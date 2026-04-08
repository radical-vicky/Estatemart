import { X, Minus, Plus, ShoppingCart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  onClearCart: () => void;
}

const CartDrawer = ({ open, onClose, items, onUpdateQuantity, onRemove, onClearCart }: CartDrawerProps) => {
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const { toast } = useToast();
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handlePayment = async () => {
    if (!phone || phone.length < 9) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in first", description: "You need an account to place orders.", variant: "destructive" });
      return;
    }

    setPaying(true);

    try {
      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({ user_id: user.id, total, phone_number: phone })
        .select()
        .single();

      if (orderErr || !order) throw new Error(orderErr?.message || "Failed to create order");

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw new Error(itemsErr.message);

      // Trigger M-Pesa STK Push
      const { data: stkData, error: stkErr } = await supabase.functions.invoke("mpesa-stk-push", {
        body: { phone, amount: total, orderId: order.id },
      });

      if (stkErr) throw new Error(stkErr.message);

      if (stkData?.ResponseCode === "0") {
        toast({
          title: "M-Pesa prompt sent!",
          description: `Check your phone (${phone}) to complete payment.`,
        });
        onClearCart();
        onClose();
      } else {
        toast({
          title: "STK Push failed",
          description: stkData?.ResponseDescription || "Try again",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

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
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="M-Pesa phone (0712345678)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border"
                />
              </div>
              <Button variant="glow" className="w-full" size="lg" onClick={handlePayment} disabled={paying}>
                {paying ? "Sending STK Push..." : "Pay with M-Pesa"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
