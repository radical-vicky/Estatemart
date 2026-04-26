import { useState, useEffect } from "react";
import { X, Smartphone, Loader2, CheckCircle, XCircle, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface STKPushModalProps {
  orderId: string;
  phoneNumber: string;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receipt?: string) => void;
  onCancel: () => void;
}

export const STKPushModal = ({
  orderId,
  phoneNumber,
  amount,
  isOpen,
  onClose,
  onSuccess,
  onCancel,
}: STKPushModalProps) => {
  const [status, setStatus] = useState<"processing" | "success" | "failed" | "cancelled">("processing");
  const [receipt, setReceipt] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(120); // Increased to 120 seconds (2 minutes)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startPolling();
      startCountdown();
    }
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, [isOpen, orderId]);

  const startPolling = () => {
    let attempts = 0;
    const maxAttempts = 40; // Increased to 40 attempts (120 seconds)

    const interval = setInterval(async () => {
      attempts++;
      
      const { data: order, error } = await supabase
        .from("orders")
        .select("status, mpesa_receipt_number")
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Polling error:", error);
        return;
      }

      console.log(`Polling attempt ${attempts}: Order status = ${order?.status}`);

      if (order?.status === "paid") {
        setStatus("success");
        setReceipt(order.mpesa_receipt_number || "");
        stopPolling();
        stopCountdown();
        setTimeout(() => {
          onSuccess(order.mpesa_receipt_number || undefined);
        }, 2000);
      } else if (order?.status === "cancelled") {
        setStatus("cancelled");
        setErrorMessage("Payment was cancelled.");
        stopPolling();
        stopCountdown();
      } else if (order?.status === "failed") {
        setStatus("failed");
        setErrorMessage("Payment failed. Please try again.");
        stopPolling();
        stopCountdown();
      }

      if (attempts >= maxAttempts && order?.status !== "paid") {
        setStatus("failed");
        setErrorMessage("Payment timeout. Please try again.");
        stopPolling();
        stopCountdown();
      }
    }, 3000);

    setPollingInterval(interval);
  };

  const startCountdown = () => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (status === "processing") {
            setStatus("failed");
            setErrorMessage("Payment timed out. Please try again.");
            stopPolling();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const stopCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
  };

  const handleCancelPayment = async () => {
    setStatus("cancelled");
    stopPolling();
    stopCountdown();
    
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);
    
    setTimeout(() => {
      onCancel();
      onClose();
    }, 1500);
  };

  const handleRetry = () => {
    setStatus("processing");
    setTimeLeft(120);
    setErrorMessage("");
    startPolling();
    startCountdown();
  };

  const handleClose = () => {
    stopPolling();
    stopCountdown();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`px-6 py-4 ${
          status === "processing" ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
          status === "success" ? "bg-gradient-to-r from-green-500 to-emerald-600" :
          "bg-gradient-to-r from-red-500 to-rose-600"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-white" />
              <h2 className="text-white font-bold text-lg">M-Pesa Payment</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          {status === "processing" && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center animate-pulse">
                  <Smartphone className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Check Your Phone</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                STK Push sent to <span className="font-semibold">{phoneNumber}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Enter your M-Pesa PIN to pay <span className="font-bold">KSh {amount.toLocaleString()}</span>
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Time remaining:</span>
                  <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400">{formatTime(timeLeft)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(timeLeft / 120) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handleCancelPayment}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Cancel Payment
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Don't see the prompt? Make sure your phone has network connection.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                KSh {amount.toLocaleString()} has been deducted from your M-Pesa account
              </p>
              {receipt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Receipt: <span className="font-mono font-semibold text-green-600 dark:text-green-400">{receipt}</span>
                </p>
              )}
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </>
          )}

          {(status === "failed" || status === "cancelled") && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  {status === "cancelled" ? (
                    <Ban className="w-10 h-10 text-red-600 dark:text-red-400" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                {status === "cancelled" ? "Payment Cancelled" : "Payment Failed"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {errorMessage || (status === "cancelled" 
                  ? "You cancelled the payment. No charges were made." 
                  : "Please try again.")}
              </p>
              {status === "failed" && (
                <button
                  onClick={handleRetry}
                  className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors mb-2"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};