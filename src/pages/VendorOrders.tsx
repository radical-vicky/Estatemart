import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Printer, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Receipt from "@/components/Receipt";

interface OrderItemWithDetails {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  price: number;
  orders: {
    user_id: string;
    status: string;
    phone_number: string;
    created_at: string;
    total: number;
    users?: { email: string };
  };
}

const VendorOrders = () => {
  const [orders, setOrders] = useState<OrderItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVendorOrders();
  }, []);

  const fetchVendorOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get order items for this vendor's products
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        id,
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        price,
        orders!inner (
          user_id,
          status,
          phone_number,
          created_at,
          total
        )
      `)
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false, foreignTable: "orders" });

    if (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error loading orders", variant: "destructive" });
    } else if (data) {
      // Fetch user emails separately
      const ordersWithEmails = await Promise.all(
        (data as any[]).map(async (item) => {
          const { data: userData } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", item.orders.user_id)
            .single();
          
          return {
            ...item,
            orders: {
              ...item.orders,
              user_email: userData?.email || "Customer"
            }
          };
        })
      );
      setOrders(ordersWithEmails as any);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    
    if (!error) {
      toast({ title: `Order marked as ${status}` });
      fetchVendorOrders();
    } else {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const showOrderReceipt = (order: OrderItemWithDetails) => {
    // Group items from same order
    const orderItems = orders.filter(o => o.order_id === order.order_id);
    const receiptItems = orderItems.map(item => ({
      name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      vendor: "Your Store"
    }));
    
    setSelectedOrder({
      id: order.order_id,
      items: receiptItems,
      total: order.orders.total,
      phoneNumber: order.orders.phone_number,
      date: order.orders.created_at,
    });
    setShowReceipt(true);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      pending: { icon: <Clock className="w-3 h-3" />, label: "Pending", className: "text-yellow-400 bg-yellow-400/10" },
      paid: { icon: <CheckCircle className="w-3 h-3" />, label: "Paid", className: "text-green-400 bg-green-400/10" },
      cancelled: { icon: <XCircle className="w-3 h-3" />, label: "Cancelled", className: "text-red-400 bg-red-400/10" },
      delivered: { icon: <CheckCircle className="w-3 h-3" />, label: "Delivered", className: "text-blue-400 bg-blue-400/10" },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${c.className}`}>
        {c.icon} {c.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/vendor" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Orders Received</h1>
            <p className="text-muted-foreground text-sm">Orders placed for your products</p>
          </div>
          <div className="glass rounded-lg px-3 py-1.5">
            <span className="text-xs font-mono text-muted-foreground">Total Orders: {orders.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground mb-2">No orders yet</p>
            <p className="text-xs text-muted-foreground">When customers buy your products, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(
              orders.reduce((acc, order) => {
                if (!acc[order.order_id]) {
                  acc[order.order_id] = {
                    id: order.order_id,
                    items: [],
                    total: order.orders.total,
                    phone_number: order.orders.phone_number,
                    status: order.orders.status,
                    created_at: order.orders.created_at,
                    customer_email: (order.orders as any).user_email,
                  };
                }
                acc[order.order_id].items.push(order);
                return acc;
              }, {} as Record<string, any>)
            ).map(([orderId, orderGroup]) => (
              <div key={orderId} className="glass rounded-xl p-4 hover:border-primary/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 pb-2 border-b border-border/50">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">
                        Order #{orderId.slice(0, 8)}
                      </span>
                      {getStatusBadge(orderGroup.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(orderGroup.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="glass"
                      onClick={() => showOrderReceipt(orderGroup.items[0])}
                      className="h-8"
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    {orderGroup.status === "pending" && (
                      <Button 
                        size="sm" 
                        variant="glow"
                        onClick={() => updateOrderStatus(orderId, "paid")}
                        className="h-8"
                      >
                        Mark Paid
                      </Button>
                    )}
                    {orderGroup.status === "paid" && (
                      <Button 
                        size="sm" 
                        variant="glow"
                        onClick={() => updateOrderStatus(orderId, "delivered")}
                        className="h-8 bg-blue-500 hover:bg-blue-600"
                      >
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {orderGroup.items.map((item: OrderItemWithDetails) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{item.product_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">×{item.quantity}</span>
                      </div>
                      <span className="font-mono text-primary text-sm">
                        KSh {item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Customer: {orderGroup.customer_email || orderGroup.phone_number}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Phone: {orderGroup.phone_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-primary font-mono">
                      KSh {orderGroup.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal for Vendor */}
      {showReceipt && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full max-h-[90vh] overflow-y-auto rounded-xl">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10 bg-white/20 hover:bg-white/30"
              onClick={() => setShowReceipt(false)}
            >
              <XCircle className="w-4 h-4 text-white" />
            </Button>
            <Receipt
              orderId={selectedOrder.id}
              items={selectedOrder.items}
              total={selectedOrder.total}
              phoneNumber={selectedOrder.phoneNumber}
              date={selectedOrder.date}
              type="seller"
              vendorName="Your Store"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;