import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQueue from "./pages/AdminQueue";
import AdminBorders from "./pages/AdminBorders";
import AdminSettings from "./pages/AdminSettings";
import AdminLogs from "./pages/AdminLogs";
import AdminBilling from "./pages/AdminBilling";
import ContentUpload from "./pages/ContentUpload";
import ThankYou from "./pages/ThankYou";
import PaymentSuccess from "./pages/PaymentSuccess";
import KioskDisplay from "./pages/KioskDisplay";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/queue" element={<AdminQueue />} />
            <Route path="/admin/borders" element={<AdminBorders />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/upload" element={<ContentUpload />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/kiosk" element={<KioskDisplay />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
