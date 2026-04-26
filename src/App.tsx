import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Vendor from "./pages/Vendor";
import VendorOrders from "./pages/VendorOrders";
// import VendorReviews from "./pages/VendorReviews"; // Comment out until file is created
import Orders from "./pages/Orders";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/install" element={<Install />} />
            
            {/* Vendor Routes */}
            <Route path="/vendor" element={<Vendor />} />
            <Route path="/vendor/orders" element={<VendorOrders />} />
            {/* <Route path="/vendor/reviews" element={<VendorReviews />} /> */}
            
            {/* Customer Routes */}
            <Route path="/orders" element={<Orders />} />
            
            {/* 404 Catch-all - Must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;