import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, X, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  vendor_name: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
  phone_number: string;
  mpesa_receipt_number: string | null;
  created_at: string;
  updated_at: string;
  resident_name?: string;
  estate_name?: string;
  house_number?: string;
  landmark?: string;
  delivery_instructions?: string;
  items?: OrderItem[];
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string; description: string }> = {
  pending: { 
    icon: <Clock className="w-4 h-4" />, 
    label: "Pending", 
    className: "text-yellow-500 bg-yellow-500/10",
    description: "Waiting for payment confirmation"
  },
  paid: { 
    icon: <CheckCircle className="w-4 h-4" />, 
    label: "Paid", 
    className: "text-green-500 bg-green-500/10",
    description: "Payment confirmed. Order is being prepared"
  },
  delivered: { 
    icon: <Truck className="w-4 h-4" />, 
    label: "Delivered", 
    className: "text-blue-500 bg-blue-500/10",
    description: "Order has been delivered"
  },
  cancelled: { 
    icon: <XCircle className="w-4 h-4" />, 
    label: "Cancelled", 
    className: "text-red-500 bg-red-500/10",
    description: "Order was cancelled"
  },
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userRole, setUserRole] = useState<string>("customer");

  useEffect(() => {
    fetchUserRole();
    fetchOrders();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserRole(profile.role);
      }
    }
  };

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
      setLoading(false); 
      return; 
    }

    let ordersQuery = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "vendor") {
      ordersQuery = ordersQuery.eq("vendor_id", user.id);
    } else {
      ordersQuery = ordersQuery.eq("user_id", user.id);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      setLoading(false);
      return;
    }

    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("id, product_name, quantity, price, vendor_name")
          .eq("order_id", order.id);
        
        return {
          ...order,
          items: itemsData || [],
        };
      })
    );

    setOrders(ordersWithItems);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (!error) {
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      // Refresh orders to show updated status
      fetchOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${config.className}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getStatusSteps = (status: string) => {
    const steps = [
      { name: "Order Placed", key: "pending" },
      { name: "Payment Confirmed", key: "paid" },
      { name: "Out for Delivery", key: "delivered" },
    ];
    
    let currentStep = 0;
    if (status === "paid") currentStep = 1;
    if (status === "delivered") currentStep = 2;
    
    return { steps, currentStep };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to store</span>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {userRole === "vendor" ? "Orders Received" : "Order History"}
            </h1>
            <p className="text-muted-foreground">
              {userRole === "vendor" 
                ? "Orders placed for your products" 
                : "Track and manage all your orders"}
            </p>
          </div>
          <div className="glass rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold text-primary">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              {userRole === "vendor" 
                ? "When customers buy your products, orders will appear here"
                : "Start shopping to see your orders here"}
            </p>
            <Link to="/">
              <Button variant="glow" className="gap-2">
                {userRole === "vendor" ? "Manage Products" : "Start Shopping"} <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="glass rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                        #{order.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(order.created_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-primary font-mono">KSh {order.total.toLocaleString()}</p>
                  </div>
                </div>

                {/* Delivery Location Preview */}
                {order.estate_name && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{order.estate_name} {order.house_number && `- ${order.house_number}`}</span>
                  </div>
                )}

                <div className="border-t border-border/50 pt-3 mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Items in this order:</p>
                  <div className="flex flex-wrap gap-2">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="text-xs bg-secondary/30 px-2 py-1 rounded">
                        {item.product_name} ×{item.quantity}
                      </span>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-right">
                  <span className="text-xs text-primary flex items-center justify-end gap-1">
                    Click to view details <ArrowLeft className="w-3 h-3 rotate-180" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="glass rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Order Details</h2>
                <p className="text-xs text-muted-foreground font-mono">#{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Timeline */}
              <div className="bg-secondary/30 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-4">Order Status</h3>
                <div className="relative">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                  {(() => {
                    const { steps, currentStep } = getStatusSteps(selectedOrder.status);
                    const progressPercent = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;
                    return (
                      <>
                        <div 
                          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                        <div className="relative flex justify-between">
                          {steps.map((step, idx) => (
                            <div key={step.key} className="text-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-all ${
                                idx <= currentStep 
                                  ? "bg-primary text-primary-foreground shadow-lg" 
                                  : "bg-border text-muted-foreground"
                              }`}>
                                {idx === 0 && <Package className="w-4 h-4" />}
                                {idx === 1 && <CheckCircle className="w-4 h-4" />}
                                {idx === 2 && <Truck className="w-4 h-4" />}
                              </div>
                              <p className={`text-xs font-medium ${idx <= currentStep ? "text-primary" : "text-muted-foreground"}`}>
                                {step.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {statusConfig[selectedOrder.status]?.description || "Processing order"}
                </p>
                
                {/* Vendor Actions */}
                {userRole === "vendor" && selectedOrder.status === "pending" && (
                  <div className="mt-4 pt-3 border-t border-border flex justify-center">
                    <Button 
                      variant="glow" 
                      size="sm"
                      onClick={() => updateOrderStatus(selectedOrder.id, "paid")}
                    >
                      Confirm Payment
                    </Button>
                  </div>
                )}
                
                {userRole === "vendor" && selectedOrder.status === "paid" && (
                  <div className="mt-4 pt-3 border-t border-border flex justify-center">
                    <Button 
                      variant="glow" 
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}
                    >
                      Mark as Delivered
                    </Button>
                  </div>
                )}
              </div>

              {/* Delivery Location */}
              {selectedOrder.resident_name && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Delivery Location
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resident Name:</span>
                      <span className="font-medium text-gray-800">{selectedOrder.resident_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estate:</span>
                      <span className="font-medium text-gray-800">{selectedOrder.estate_name}</span>
                    </div>
                    {selectedOrder.house_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">House/Apt:</span>
                        <span className="font-medium text-gray-800">{selectedOrder.house_number}</span>
                      </div>
                    )}
                    {selectedOrder.landmark && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Landmark:</span>
                        <span className="font-medium text-gray-800">{selectedOrder.landmark}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_instructions && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <span className="text-gray-600">Instructions:</span>
                        <p className="text-gray-800 mt-1 text-sm">{selectedOrder.delivery_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone Number:</span>
                    <span className="font-medium text-gray-800">{selectedOrder.phone_number}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Items Ordered</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50">
                      <div>
                        <p className="font-medium text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Vendor: {item.vendor_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="font-mono text-primary">KSh {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-primary/5 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3">Payment Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-mono">KSh {selectedOrder.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="text-green-600">M-Pesa</span>
                  </div>
                  {selectedOrder.mpesa_receipt_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">M-Pesa Receipt:</span>
                      <span className="font-mono text-primary">{selectedOrder.mpesa_receipt_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Date:</span>
                    <span>{format(new Date(selectedOrder.created_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{format(new Date(selectedOrder.updated_at || selectedOrder.created_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary/20">
                    <span>Total Paid:</span>
                    <span className="text-primary font-mono">KSh {selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;