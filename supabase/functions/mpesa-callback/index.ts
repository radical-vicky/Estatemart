import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Callback received:", JSON.stringify(body));
    
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      console.log("No stkCallback found");
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
    console.log(`Processing callback for ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (ResultCode === 0 && CallbackMetadata) {
      const items = CallbackMetadata.Item as Array<{ Name: string; Value: string | number }>;
      const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value as string;
      const amount = items.find((i) => i.Name === "Amount")?.Value as number;

      console.log(`Payment successful! Receipt: ${receipt}, Amount: ${amount}`);

      await supabase
        .from("orders")
        .update({ 
          status: "paid", 
          mpesa_receipt_number: receipt 
        })
        .eq("mpesa_checkout_request_id", CheckoutRequestID);
        
    } else {
      console.log(`Payment failed: ${ResultDesc}`);
      
      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("mpesa_checkout_request_id", CheckoutRequestID);
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});