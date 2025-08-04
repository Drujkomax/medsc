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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [language, setLanguage] = useState<'ru' | 'en' | 'uz'>('ru');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Header language={language} onLanguageChange={setLanguage} />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home language={language} />} />
          <Route path="/catalog" element={<Catalog language={language} />} />
          <Route path="/product/:id" element={<ProductDetail language={language} />} />
                <Route path="/services" element={<div className="py-20 text-center">Services Page - Coming Soon</div>} />
                <Route path="/cases" element={<div className="py-20 text-center">Cases Page - Coming Soon</div>} />
                <Route path="/about" element={<div className="py-20 text-center">About Page - Coming Soon</div>} />
                <Route path="/contacts" element={<div className="py-20 text-center">Contacts Page - Coming Soon</div>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer language={language} />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
