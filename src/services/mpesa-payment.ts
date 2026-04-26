import { supabase } from '@/integrations/supabase/client';

// Set to true for development without actual M-Pesa
// Set to false when you have deployed Edge Functions and have M-Pesa credentials
const USE_MOCK_PAYMENT = false;

interface InitiatePaymentParams {
  phoneNumber: string;
  amount: number;
  orderId: string;
}

interface PaymentStatusResponse {
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  receipt?: string;
}

/**
 * Initiate an M-Pesa STK Push payment
 * Uses mock mode by default for development
 */
export async function initiateMpesaPayment({ phoneNumber, amount, orderId }: InitiatePaymentParams): Promise<{ success: boolean; message: string; checkoutRequestId?: string }> {
  
  // MOCK MODE - For development without real M-Pesa
  if (USE_MOCK_PAYMENT) {
    console.log("🔵 MOCK MODE: Initiating payment", { phoneNumber, amount, orderId });
    
    // Simulate successful STK push - update order after 3 seconds
    setTimeout(async () => {
      console.log("🔵 MOCK MODE: Updating order to paid", orderId);
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid', 
          mpesa_receipt_number: `MOCK-${Date.now()}` 
        })
        .eq('id', orderId);
      
      if (error) {
        console.error("🔴 MOCK MODE: Error updating order", error);
      } else {
        console.log("🟢 MOCK MODE: Order updated to paid successfully");
      }
    }, 3000);
    
    return {
      success: true,
      message: "STK Push sent successfully (MOCK MODE)",
      checkoutRequestId: `MOCK-${Date.now()}`,
    };
  }
  
  // REAL M-PESA MODE - Requires Edge Functions deployed
  try {
    console.log("🔵 REAL MODE: Initiating payment", { phoneNumber, amount, orderId });
    
    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: { phone: phoneNumber, amount, orderId },
    });
    
    console.log("Edge function response:", { data, error });
    
    if (error) {
      console.error("Edge function error:", error);
      throw new Error(error.message);
    }
    
    const isSuccess = data?.ResponseCode === '0';
    
    return {
      success: isSuccess,
      message: data?.CustomerMessage || (isSuccess ? 'STK Push sent successfully' : data?.errorMessage || 'Payment initiation failed'),
      checkoutRequestId: data?.CheckoutRequestID,
    };
  } catch (error) {
    console.error('Payment initiation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initiate payment. Please check your connection.',
    };
  }
}

/**
 * Check the status of a payment by polling the database
 */
export async function checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status, mpesa_receipt_number')
      .eq('id', orderId)
      .single();
    
    if (error) throw new Error(error.message);
    
    return {
      status: data.status as 'pending' | 'paid' | 'failed' | 'cancelled',
      receipt: data.mpesa_receipt_number,
    };
  } catch (error) {
    console.error('Status check error:', error);
    return { status: 'pending' };
  }
}

/**
 * Poll payment status until completed or timeout
 * @param orderId - The order ID to check
 * @param onUpdate - Callback function called on each status update
 * @param maxAttempts - Maximum number of polling attempts (default: 30)
 * @param intervalSeconds - Seconds between each poll (default: 3)
 */
export async function pollPaymentStatus(
  orderId: string,
  onUpdate: (status: string, receipt?: string) => void,
  maxAttempts: number = 30,
  intervalSeconds: number = 3
): Promise<{ completed: boolean; receipt?: string }> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const { status, receipt } = await checkPaymentStatus(orderId);
    
    onUpdate(status, receipt);
    
    if (status === 'paid') {
      return { completed: true, receipt };
    }
    
    if (status === 'failed' || status === 'cancelled') {
      return { completed: false };
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
    attempts++;
  }
  
  return { completed: false };
}

/**
 * Get payment status for an order (one-time check)
 */
export async function getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
  return checkPaymentStatus(orderId);
}

/**
 * Manually update order status to paid (for testing or admin)
 */
export async function manualMarkAsPaid(orderId: string, receiptNumber?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'paid', 
        mpesa_receipt_number: receiptNumber || `MANUAL-${Date.now()}` 
      })
      .eq('id', orderId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking order as paid:', error);
    return false;
  }
}

// Export the mock mode status for debugging
export const isMockMode = USE_MOCK_PAYMENT;