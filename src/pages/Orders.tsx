import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface OrderRow {
  id: string;
  total: number;
  status: string;
  phone_number: string;
  mpesa_receipt_number: string | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, label: "Pending", className: "text-yellow-400" },
  paid: { icon: <CheckCircle className="w-4 h-4" />, label: "Paid", className: "text-primary" },
  cancelled: { icon: <XCircle className="w-4 h-4" />, label: "Cancelled", className: "text-destructive" },
};

const Orders = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to store</span>
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-1">Order History</h1>
        <p className="text-muted-foreground text-sm mb-8">Track your past orders and payment status</p>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No orders yet. Start shopping!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              return (
                <div key={order.id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-mono ${config.className}`}>
                      {config.icon} {config.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-primary font-mono">KSh {order.total}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-mono">{order.phone_number}</p>
                      {order.mpesa_receipt_number && (
                        <p className="text-xs text-primary font-mono">{order.mpesa_receipt_number}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
