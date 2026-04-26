import { X, Minus, Plus, ShoppingCart, Phone, MapPin, Trash2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "./ProductCard";
import Receipt from "./Receipt";
import DeliveryForm from "./DeliveryForm";
import { STKPushModal } from "@/components/STKPushModal";
import { initiateMpesaPayment } from "@/services/mpesa-payment";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface VendorGroup {
  vendorName: string;
  vendorId: string | null;
  items: CartItem[];
  subtotal: number;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onClearCart: () => void;
}

const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const CartDrawer = ({ open, onClose, items, onUpdateQuantity, onRemove, onClearCart }: CartDrawerProps) => {
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showSTKModal, setShowSTKModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [receiptClosed, setReceiptClosed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCurrentUser(data.user);
    });
  }, []);

  const groupItemsByVendor = (items: CartItem[]): VendorGroup[] => {
    const groups: Record<string, VendorGroup> = {};
    
    items.forEach(item => {
      const vendorKey = (item.product.vendor_id && isValidUUID(item.product.vendor_id)) 
        ? item.product.vendor_id 
        : item.product.vendor_name;
      
      if (!groups[vendorKey]) {
        groups[vendorKey] = {
          vendorName: item.product.vendor_name || item.product.vendor,
          vendorId: item.product.vendor_id || null,
          items: [],
          subtotal: 0,
        };
      }
      groups[vendorKey].items.push(item);
      groups[vendorKey].subtotal += item.product.price * item.quantity;
    });
    
    return Object.values(groups);
  };

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const vendorGroups = groupItemsByVendor(items);
  const deliveryFee = 1;
  const grandTotal = total + deliveryFee;

  const hasSelfProducts = (): boolean => {
    if (!currentUser) return false;
    return items.some(item => item.product.vendor_id === currentUser.id);
  };

  const getCheckoutItems = (): CartItem[] => {
    if (!currentUser) return items;
    return items.filter(item => item.product.vendor_id !== currentUser.id);
  };

  const handleProceedToDelivery = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      toast({ title: "Please sign in first", description: "You need an account to place orders.", variant: "destructive" });
      return;
    }

    if (hasSelfProducts()) {
      toast({ 
        title: "Cannot Checkout", 
        description: "Please remove your own products from the cart before proceeding.", 
        variant: "destructive" 
      });
      return;
    }

    setShowDeliveryForm(true);
  };

  const handleLocationConfirmed = (location: any) => {
    setDeliveryLocation(location);
    setShowDeliveryForm(false);
    toast({ 
      title: "Delivery Location Saved", 
      description: `${location.estate_name} - ${location.house_number || "No house number"}` 
    });
  };

  const handleQuantityEdit = (productId: string, currentQuantity: number) => {
    setEditingQuantity(productId);
    setQuantityInput(currentQuantity.toString());
  };

  const handleQuantitySubmit = (productId: string) => {
    const newQuantity = parseInt(quantityInput);
    if (isNaN(newQuantity) || newQuantity < 1) {
      toast({ title: "Invalid quantity", description: "Quantity must be at least 1", variant: "destructive" });
      setEditingQuantity(null);
      return;
    }
    
    const item = items.find(i => i.product.id === productId);
    if (item) {
      const delta = newQuantity - item.quantity;
      if (delta !== 0) {
        onUpdateQuantity(productId, delta);
      }
    }
    setEditingQuantity(null);
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    onRemove(productId);
    toast({
      title: "Item Removed",
      description: `${productName} removed from your cart`,
    });
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    
    if (confirm(`Remove all ${items.length} items from your cart?`)) {
      onClearCart();
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
      });
    }
  };

  const processPayment = async () => {
    const checkoutItems = getCheckoutItems();
    
    if (checkoutItems.length === 0) {
      toast({ title: "Cannot Checkout", description: "No valid items to checkout. Please remove your own products.", variant: "destructive" });
      return;
    }

    if (!phone || phone.length < 9) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }

    if (!deliveryLocation) {
      toast({ title: "Missing delivery location", description: "Please provide your delivery address", variant: "destructive" });
      setShowDeliveryForm(true);
      return;
    }

    setPaying(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      const checkoutGroups = groupItemsByVendor(checkoutItems);
      
      const orders = [];
      for (const group of checkoutGroups) {
        const validVendorId = isValidUUID(group.vendorId) ? group.vendorId : null;
        
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({ 
            user_id: authUser.id,
            total: group.subtotal + deliveryFee,
            phone_number: phone,
            status: "pending",
            payment_method: "M-Pesa",
            vendor_id: validVendorId,
            vendor_name: group.vendorName,
            resident_name: deliveryLocation.resident_name,
            estate_name: deliveryLocation.estate_name,
            house_number: deliveryLocation.house_number,
            landmark: deliveryLocation.landmark,
            delivery_instructions: deliveryLocation.delivery_instructions,
            delivery_fee: deliveryFee,
            subtotal: group.subtotal
          })
          .select()
          .single();

        if (orderErr) throw new Error(orderErr.message);
        if (!order) throw new Error("Failed to create order");

        const orderItems = group.items.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          price: item.product.price * item.quantity,
          vendor_id: validVendorId,
          vendor_name: group.vendorName
        }));

        const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
        if (itemsErr) throw new Error(itemsErr.message);

        orders.push({ ...order, items: group.items, vendorName: group.vendorName });
      }

      const primaryOrder = orders[0];
      const checkoutTotal = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const totalWithDelivery = checkoutTotal + deliveryFee;
      
      // Store order data for receipt
      setLastOrder({
        id: primaryOrder.id,
        items: checkoutItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price * item.quantity,
          vendor: item.product.vendor_name || item.product.vendor
        })),
        total: totalWithDelivery,
        phoneNumber: phone,
        date: new Date().toISOString(),
        vendorGroups: checkoutGroups,
        deliveryLocation: deliveryLocation,
      });
      
      // Initiate M-Pesa payment
      const paymentResult = await initiateMpesaPayment({
        phoneNumber: phone,
        amount: totalWithDelivery,
        orderId: primaryOrder.id,
      });
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.message);
      }
      
      // Show STK Push Modal
      setCurrentOrderId(primaryOrder.id);
      setPaymentAmount(totalWithDelivery);
      setPaymentPhone(phone);
      setShowSTKModal(true);
      
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({ title: "Checkout error", description: err.message, variant: "destructive" });
      setPaying(false);
    }
  };

  const handleSTKSuccess = (receipt?: string) => {
    console.log("STK Success, showing receipt");
    setShowSTKModal(false);
    setShowReceipt(true);
    setReceiptClosed(false); // Reset receipt closed flag
    onClearCart();
    setDeliveryLocation(null);
    setPhone("");
    setPaying(false);
    
    toast({
      title: "Payment Successful!",
      description: receipt ? `Receipt: ${receipt}` : "Your order has been confirmed",
    });
  };

  const handleSTKCancel = () => {
    setShowSTKModal(false);
    setPaying(false);
    toast({ 
      title: "Payment Cancelled", 
      description: "You cancelled the payment. No charges were made.",
    });
  };

  const handleCloseReceipt = () => {
    console.log("Closing receipt - setting receiptClosed to true");
    setReceiptClosed(true);
    setShowReceipt(false);
    setPaying(false);
    setLastOrder(null);
    setCurrentOrderId(null);
  };

  const isOwnProduct = (product: Product): boolean => {
    return currentUser ? product.vendor_id === currentUser.id : false;
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-background/60 z-40" onClick={onClose} />}
      
      {/* Receipt Modal - Only show if not closed */}
      {showReceipt && lastOrder && !receiptClosed && (
        <div 
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseReceipt();
            }
          }}
        >
          <Receipt
            orderId={lastOrder.id}
            items={lastOrder.items}
            total={lastOrder.total}
            phoneNumber={lastOrder.phoneNumber}
            date={lastOrder.date}
            type="buyer"
            userName={user?.email?.split('@')[0] || "Valued Customer"}
            userEmail={user?.email || undefined}
            deliveryFee={deliveryFee}
            deliveryLocation={lastOrder.deliveryLocation}
            onClose={handleCloseReceipt}
          />
        </div>
      )}

      {/* STK Push Modal */}
      {showSTKModal && (
        <STKPushModal
          orderId={currentOrderId || ""}
          phoneNumber={paymentPhone}
          amount={paymentAmount}
          isOpen={showSTKModal}
          onClose={() => setShowSTKModal(false)}
          onSuccess={handleSTKSuccess}
          onCancel={handleSTKCancel}
        />
      )}

      {/* Delivery Form Modal */}
      {showDeliveryForm && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <DeliveryForm 
            onLocationConfirmed={handleLocationConfirmed}
            onClose={() => setShowDeliveryForm(false)}
          />
        </div>
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 glass-strong transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Your Cart</h2>
              <span className="font-mono text-xs text-muted-foreground">({items.length} items)</span>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearAll}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Clear All
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-4 opacity-30" />
                <p className="font-mono text-sm">Your cart is empty</p>
                <p className="text-xs mt-2">Add items from the products section</p>
              </div>
            ) : (
              <>
                {deliveryLocation && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-800 dark:text-green-300">Delivery Location:</p>
                        <p className="text-xs text-green-700 dark:text-green-400">
                          {deliveryLocation.estate_name} {deliveryLocation.house_number && `- ${deliveryLocation.house_number}`}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">Resident: {deliveryLocation.resident_name}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-green-600"
                        onClick={() => setDeliveryLocation(null)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}

                {hasSelfProducts() && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-300">Cannot Checkout</p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                          You have your own products in the cart. Please remove them to proceed with checkout.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {vendorGroups.map((group) => (
                  <div key={group.vendorId || group.vendorName} className="space-y-2">
                    <div className="flex items-center justify-between px-2 pb-1 border-b border-border/50">
                      <span className="font-semibold text-sm text-primary flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {group.vendorName}
                        {currentUser && group.vendorId === currentUser.id && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Your Store</span>
                        )}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        KSh {group.subtotal.toLocaleString()}
                      </span>
                    </div>
                    
                    {group.items.map((item) => {
                      const ownProduct = isOwnProduct(item.product);
                      
                      return (
                        <div key={item.product.id} className={`glass rounded-lg p-3 ${ownProduct ? 'border-red-200 bg-red-50/30' : ''}`}>
                          <div className="flex gap-3">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-16 h-16 rounded-md object-cover" 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">KSh {item.product.price} each</p>
                              {ownProduct && (
                                <p className="text-[10px] text-red-500 mt-1">You cannot purchase your own product</p>
                              )}
                              
                              <div className="flex items-center justify-between mt-2">
                                {editingQuantity === item.product.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={quantityInput}
                                      onChange={(e) => setQuantityInput(e.target.value)}
                                      className="w-20 h-8 text-center"
                                      min="1"
                                      autoFocus
                                    />
                                    <Button 
                                      size="sm" 
                                      variant="glow" 
                                      onClick={() => handleQuantitySubmit(item.product.id)}
                                      className="h-8 px-2"
                                    >
                                      Update
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => setEditingQuantity(null)}
                                      className="h-8 px-2"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="w-7 h-7" 
                                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                                      disabled={ownProduct}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <button
                                      onClick={() => !ownProduct && handleQuantityEdit(item.product.id, item.quantity)}
                                      className={`font-mono text-sm w-8 text-center ${ownProduct ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:text-primary hover:underline'}`}
                                      disabled={ownProduct}
                                    >
                                      {item.quantity}
                                    </button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="w-7 h-7" 
                                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                                      disabled={ownProduct}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:text-destructive/80"
                                  onClick={() => handleRemoveItem(item.product.id, item.product.name)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t border-border space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono">KSh {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee:</span>
                  <span className="font-mono">KSh {deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-muted-foreground font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary font-mono">KSh {grandTotal.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-mono">Payment will be sent to:</p>
                {vendorGroups.map((group) => (
                  <div key={group.vendorId || group.vendorName} className="flex justify-between pl-2">
                    <span>{group.vendorName}</span>
                    <span className="font-mono">KSh {group.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {!deliveryLocation ? (
                <Button 
                  variant="glow" 
                  className="w-full gap-2" 
                  size="lg" 
                  onClick={handleProceedToDelivery}
                  disabled={hasSelfProducts()}
                >
                  <MapPin className="w-4 h-4" /> Set Delivery Location
                </Button>
              ) : (
                <>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="M-Pesa phone (0712345678)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 bg-secondary/50 border-border"
                    />
                  </div>
                  <Button 
                    variant="glow" 
                    className="w-full" 
                    size="lg" 
                    onClick={processPayment} 
                    disabled={paying || hasSelfProducts()}
                  >
                    {paying ? "Processing..." : "Pay with M-Pesa"}
                  </Button>
                </>
              )}
              
              {hasSelfProducts() && (
                <p className="text-xs text-center text-red-500">
                  Please click the trash icon to remove your own products from cart
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;