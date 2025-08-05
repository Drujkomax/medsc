import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Services from "./pages/Services";
import Contacts from "./pages/Contacts";
import NotFound from "./pages/NotFound";

// Admin Components
import RequireAuth from "./features/auth/components/RequireAuth";
import AdminLayout from "./features/admin/components/AdminLayout";
import Dashboard from "./features/admin/pages/Dashboard";
import Clients from "./features/crm/pages/Clients";
import AdminProducts from "./features/products/pages/AdminProducts";
import AdminServices from "./features/admin/pages/AdminServices";
import AdminContacts from "./features/admin/pages/AdminContacts";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => {
  const [language, setLanguage] = useState<'ru' | 'en' | 'uz'>('ru');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Admin Routes - Standalone Layout */}
            <Route path="/admin" element={
              <RequireAuth requiredRole="admin">
                <AdminLayout />
              </RequireAuth>
            }>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="contacts" element={<AdminContacts />} />
            </Route>

            {/* Public Routes - With Header/Footer */}
            <Route path="/*" element={
              <div className="min-h-screen flex flex-col">
                <Header language={language} onLanguageChange={setLanguage} />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home language={language} />} />
                    <Route path="/catalog" element={<Catalog language={language} />} />
                    <Route path="/product/:id" element={<ProductDetail language={language} />} />
                    <Route path="/services" element={<Services language={language} />} />
                    <Route path="/cases" element={<div className="py-20 text-center">Cases Page - Coming Soon</div>} />
                    <Route path="/about" element={<div className="py-20 text-center">About Page - Coming Soon</div>} />
                    <Route path="/contacts" element={<Contacts language={language} />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/login" element={<Auth />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer language={language} />
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
