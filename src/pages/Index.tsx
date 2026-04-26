import { useState, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import ProductsSection from "@/components/ProductsSection";
import CartDrawer, { CartItem } from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import type { Product } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Guest cart key (for non-logged-in users)
const GUEST_CART_KEY = "estatemart_guest_cart";

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load cart based on auth state
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        // Load user's saved cart
        const userCart = localStorage.getItem(`estatemart_cart_${user.id}`);
        if (userCart) {
          try {
            setCartItems(JSON.parse(userCart));
            console.log("Loaded user cart:", user.id);
          } catch (e) {
            setCartItems([]);
          }
        } else {
          // Check if there's a guest cart to merge
          const guestCart = localStorage.getItem(GUEST_CART_KEY);
          if (guestCart) {
            try {
              const guestItems = JSON.parse(guestCart);
              setCartItems(guestItems);
              // Save to user cart and clear guest
              localStorage.setItem(`estatemart_cart_${user.id}`, guestCart);
              localStorage.removeItem(GUEST_CART_KEY);
              toast({
                title: "Cart Saved",
                description: "Your items have been saved to your account",
              });
            } catch (e) {
              setCartItems([]);
            }
          } else {
            setCartItems([]);
          }
        }
      } else {
        setUserId(null);
        // Load guest cart
        const guestCart = localStorage.getItem(GUEST_CART_KEY);
        if (guestCart) {
          try {
            setCartItems(JSON.parse(guestCart));
            console.log("Loaded guest cart");
          } catch (e) {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
      setIsLoading(false);
    };
    
    loadCart();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        // Merge guest cart into user cart on login
        const guestCart = localStorage.getItem(GUEST_CART_KEY);
        const userCart = localStorage.getItem(`estatemart_cart_${session.user.id}`);
        
        if (guestCart) {
          try {
            const guestItems = JSON.parse(guestCart);
            if (userCart) {
              const userItems = JSON.parse(userCart);
              // Merge carts (combine items)
              const mergedItems = [...userItems];
              guestItems.forEach((guestItem: CartItem) => {
                const existing = mergedItems.find(i => i.product.id === guestItem.product.id);
                if (existing) {
                  existing.quantity += guestItem.quantity;
                } else {
                  mergedItems.push(guestItem);
                }
              });
              setCartItems(mergedItems);
              localStorage.setItem(`estatemart_cart_${session.user.id}`, JSON.stringify(mergedItems));
            } else {
              setCartItems(guestItems);
              localStorage.setItem(`estatemart_cart_${session.user.id}`, guestCart);
            }
            localStorage.removeItem(GUEST_CART_KEY);
            toast({
              title: "Cart Restored",
              description: "Your items have been saved to your account",
            });
          } catch (e) {
            console.error("Error merging cart:", e);
          }
        } else if (userCart) {
          try {
            setCartItems(JSON.parse(userCart));
          } catch (e) {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      } else {
        setUserId(null);
        // Save current cart as guest cart on logout
        if (cartItems.length > 0) {
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
        }
        setCartItems([]);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Save cart based on auth state
  useEffect(() => {
    if (isLoading) return;
    
    if (userId) {
      // Save to user-specific cart
      localStorage.setItem(`estatemart_cart_${userId}`, JSON.stringify(cartItems));
      console.log("Saved user cart:", userId, cartItems.length);
    } else if (cartItems.length > 0) {
      // Save to guest cart
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
      console.log("Saved guest cart:", cartItems.length);
    }
  }, [cartItems, userId, isLoading]);

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        toast({
          title: "Cart Updated",
          description: `${product.name} quantity increased to ${existing.quantity + 1}`,
        });
        return prev.map((item) =>
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart`,
      });
      return [...prev, { product, quantity: 1 }];
    });
  }, [toast]);

  const handleUpdateQuantity = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId 
          ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
          : item
      )
    );
  }, []);

  const handleRemove = useCallback((productId: string) => {
    setCartItems((prev) => {
      const removed = prev.find(item => item.product.id === productId);
      if (removed) {
        toast({
          title: "Removed from Cart",
          description: `${removed.product.name} removed from your cart`,
        });
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  }, [toast]);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
  }, [toast]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <HeroSection />
      <CategoriesSection />
      <ProductsSection onAddToCart={handleAddToCart} />
      <Footer />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
        onClearCart={handleClearCart}
      />
    </div>
  );
};

export default Index;