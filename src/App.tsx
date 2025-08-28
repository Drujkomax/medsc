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



const queryClient = new QueryClient();

const App = () => {
  const [language, setLanguage] = useState<'ru' | 'en' | 'uz'>('ru');

  // Debug log to check language value
  console.log('Current language:', language);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>

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
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/cases" element={<div className="py-20 text-center">Cases Page - Coming Soon</div>} />
                    <Route path="/about" element={<div className="py-20 text-center">About Page - Coming Soon</div>} />
                    <Route path="/contacts" element={<Contacts />} />
                    
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
