import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import ErrorBoundary from "@/components/providers/ErrorBoundary";
import { setupGlobalErrorHandling } from "@/utils/globalErrorHandler";
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
import Cases from "./pages/Cases";
import ScrollToTop from "./components/common/ScrollToTop";
import AdminWrapper from "./features/admin/components/AdminWrapper";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const ProductRedirect = () => {
  const { id, slug } = useParams();
  // Redirect old URLs to catalog - product detail will handle fetching
  const productIdentifier = slug || id;
  return <Navigate to={`/catalog/unknown-manufacturer/${productIdentifier}`} replace />;
};

const App = () => {
  const [language, setLanguage] = useState<'ru' | 'en' | 'uz'>('ru');

  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
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
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/catalog/:manufacturerSlug/:productSlug" element={<ProductDetail />} />
                    {/* Legacy redirects for old URL formats */}
                    <Route path="/catalog/products/:slug" element={<ProductRedirect />} />
                    <Route path="/product/:id" element={<ProductRedirect />} />
                    <Route path="/products/:id" element={<ProductRedirect />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/cases" element={<Cases />} />
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
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
