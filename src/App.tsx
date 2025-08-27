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
import AuthPage from "./pages/Auth";
import RegisterWithInvite from "./pages/RegisterWithInvite";
import CreateFirstDirector from "./pages/CreateFirstDirector";
import DirectorRegistration from "./pages/DirectorRegistration";

// Admin Components
import AdminWrapper from "./features/admin/components/AdminWrapper";


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
                    <Route path="/admin/*" element={<AdminWrapper />} />

            {/* Public Routes - With Header/Footer */}
            <Route path="/*" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home language={language} />} />
                    <Route path="/setup-director" element={<CreateFirstDirector />} />
                    <Route path="/director-registration" element={<DirectorRegistration />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/catalog" element={<Catalog language={language} />} />
                    <Route path="/product/:id" element={<ProductDetail language={language} />} />
                    <Route path="/services" element={<Services language={language} />} />
                    <Route path="/cases" element={<div className="py-20 text-center">Cases Page - Coming Soon</div>} />
                    <Route path="/about" element={<div className="py-20 text-center">About Page - Coming Soon</div>} />
                    <Route path="/contacts" element={<Contacts language={language} />} />
                    
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
