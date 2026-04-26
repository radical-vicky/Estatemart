import { useRef, useState } from "react";
import { Printer, Download, X, Share2, Check, MapPin, Package, Store, Truck, CreditCard, Calendar, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  vendor: string;
}

interface ReceiptProps {
  orderId: string;
  items: ReceiptItem[];
  total: number;
  phoneNumber: string;
  date: string;
  type: "buyer" | "seller";
  vendorName?: string;
  userName?: string;
  userEmail?: string;
  deliveryFee?: number;
  deliveryLocation?: {
    resident_name: string;
    estate_name: string;
    house_number: string;
    landmark: string;
    delivery_instructions: string;
  };
  onClose?: () => void;
}

const Receipt = ({ 
  orderId, 
  items, 
  total, 
  phoneNumber, 
  date, 
  type, 
  vendorName, 
  userName,
  userEmail,
  deliveryFee = 50,
  deliveryLocation,
  onClose 
}: ReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const subtotal = total - deliveryFee;
  const systemCommission = subtotal * 0.05;
  const vat = systemCommission * 0.16;
  const vendorEarnings = subtotal - systemCommission - vat;

  const itemsByVendor = items.reduce((acc, item) => {
    if (!acc[item.vendor]) acc[item.vendor] = [];
    acc[item.vendor].push(item);
    return acc;
  }, {} as Record<string, ReceiptItem[]>);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>EstateMart Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; background: #f5f5f5; }
              .receipt { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 16px; margin-bottom: 20px; }
              .logo { width: 50px; height: 50px; background: #22c55e; border-radius: 12px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; }
              .logo span { color: white; font-size: 24px; font-weight: bold; }
              h1 { color: #22c55e; font-size: 20px; margin: 0; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .items-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
              .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
              .grand-total { font-weight: bold; font-size: 18px; color: #22c55e; border-top: 2px solid #22c55e; padding-top: 10px; margin-top: 10px; }
              .footer { text-align: center; font-size: 11px; color: #666; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="receipt">${receiptRef.current?.innerHTML}</div>
            <script>window.print(); window.onafterprint = () => window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleShare = async () => {
    const receiptText = `ESTATEMART RECEIPT\nOrder: ${orderId.slice(0, 12)}\nTotal: KSh ${total.toLocaleString()}\nThank you for shopping with EstateMart!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'EstateMart Receipt', text: receiptText });
        toast({ title: "Shared!" });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`EstateMart Receipt\nOrder: ${orderId.slice(0, 12)}\nTotal: KSh ${total}\nDate: ${new Date(date).toLocaleString()}`);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const html = receiptRef.current?.innerHTML;
    const blob = new Blob([`<html><head><title>Receipt-${orderId.slice(0,8)}</title></head><body>${html}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatemart-receipt-${orderId.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!" });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
      {/* Header - No red button, just title */}
      <div className="bg-green-600 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Receipt</h2>
            <p className="text-green-100 text-xs">#{orderId.slice(0, 12)}</p>
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div ref={receiptRef} className="p-5 max-h-[70vh] overflow-y-auto">
        {/* Store Info */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">ESTATEMART</h1>
          <p className="text-xs text-gray-500">Your Estate, Delivered</p>
          <div className={`inline-block text-xs px-3 py-1 rounded-full mt-2 font-medium ${
            type === "buyer" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
          }`}>
            {type === "buyer" ? "CUSTOMER COPY" : "VENDOR COPY"}
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">Order Date:</span>
            <span className="text-xs font-medium text-gray-700">{new Date(date).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">Payment:</span>
            <span className="text-xs font-medium text-green-600">M-Pesa</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Phone size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">Phone:</span>
            <span className="text-xs font-medium text-gray-700">{phoneNumber}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-green-50 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{type === "buyer" ? "Customer:" : "Store:"}</span>
            <span className="text-sm font-semibold text-gray-800">
              {type === "buyer" ? (userName || "Customer") : (vendorName || "Vendor")}
            </span>
          </div>
          {userEmail && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Email:</span>
              <span className="text-xs text-gray-600">{userEmail}</span>
            </div>
          )}
        </div>

        {/* Delivery Location */}
        {deliveryLocation && (
          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-blue-500" />
              <span className="text-xs font-semibold text-blue-800">Delivery Location</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Resident:</span>
                <span className="font-medium text-gray-800">{deliveryLocation.resident_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estate:</span>
                <span className="text-gray-700">{deliveryLocation.estate_name}</span>
              </div>
              {deliveryLocation.house_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">House:</span>
                  <span className="text-gray-700">{deliveryLocation.house_number}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        {Object.entries(itemsByVendor).map(([vendor, vendorItems]) => (
          <div key={vendor} className="mb-4">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-200">
              <Store size={14} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">{vendor}</span>
            </div>
            {vendorItems.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2">
                <div>
                  <span className="text-sm text-gray-800">{item.name}</span>
                  <span className="text-xs text-gray-400 ml-2">x{item.quantity}</span>
                </div>
                <span className="text-sm font-mono font-semibold text-gray-800">
                  KSh {item.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-mono">KSh {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery Fee</span>
            <span className="font-mono">KSh {deliveryFee.toLocaleString()}</span>
          </div>
          
          {type === "seller" && (
            <>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="flex justify-between text-sm text-orange-600">
                <span>Commission (5%)</span>
                <span>-KSh {systemCommission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-purple-600">
                <span>VAT (16%)</span>
                <span>-KSh {vat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-green-700 pt-2">
                <span>Your Earnings</span>
                <span>KSh {vendorEarnings.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
            </>
          )}
          
          <div className="flex justify-between text-lg font-bold pt-2">
            <span className="text-gray-800">TOTAL</span>
            <span className="text-green-600 font-mono">KSh {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400">✓ Official Proof of Delivery</p>
          <p className="text-xs text-green-600 font-medium mt-2">Thank you for supporting local vendors!</p>
          <p className="text-[10px] text-gray-400 mt-3">EstateMart • estatemart.com</p>
        </div>
      </div>

      {/* Action Buttons - Close button is now here */}
      <div className="border-t border-gray-100 p-4 bg-gray-50 flex gap-2">
        <button onClick={handlePrint} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <Printer size={16} /> Print
        </button>
        <button onClick={handleDownload} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <Download size={16} /> Save
        </button>
        <button onClick={handleShare} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          {copied ? "Copied" : "Share"}
        </button>
        <button onClick={handleClose} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <X size={16} /> Close
        </button>
      </div>
    </div>
  );
};

export default Receipt;