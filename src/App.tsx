import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimpleAuthProvider } from "@/contexts/SimpleAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { initializeStorage } from "@/utils/initSupabaseStorage";
import Index from "./pages/Index";
import SimpleAdminLogin from "./pages/SimpleAdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQueue from "./pages/AdminQueue";
import AdminBorders from "./pages/AdminBorders";
import AdminSettings from "./pages/AdminSettings";
import AdminLogs from "./pages/AdminLogs";
import AdminBilling from "./pages/AdminBilling";
import AdminHistory from "./pages/AdminHistory";
import ContentUpload from "./pages/ContentUpload";
import ThankYou from "./pages/ThankYou";
import PaymentSuccess from "./pages/PaymentSuccess";
import KioskDisplay from "./pages/KioskDisplay";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <SimpleAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin-login" element={<SimpleAdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/queue"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/borders"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminBorders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminBilling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/history"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminHistory />
                </ProtectedRoute>
              }
            />
            <Route path="/upload" element={<ContentUpload />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/kiosk" element={<KioskDisplay />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SimpleAuthProvider>
  </QueryClientProvider>
  );
};

export default App;
