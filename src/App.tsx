import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import Transactions from "./pages/Transactions";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            } />
            <Route path="/pos" element={
              <DashboardLayout>
                <POS />
              </DashboardLayout>
            } />
            <Route path="/products" element={
              <DashboardLayout>
                <Products />
              </DashboardLayout>
            } />
            <Route path="/categories" element={
              <DashboardLayout>
                <Categories />
              </DashboardLayout>
            } />
            <Route path="/customers" element={
              <DashboardLayout>
                <Customers />
              </DashboardLayout>
            } />
            <Route path="/transactions" element={
              <DashboardLayout>
                <Transactions />
              </DashboardLayout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
