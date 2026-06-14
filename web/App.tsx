import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import ErrorBoundary from "@/components/providers/ErrorBoundary";
import PointerEventsGuard from "@/components/providers/PointerEventsGuard";
import { setupGlobalErrorHandling } from "@/utils/globalErrorHandler";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import ScrollToTop from "./components/common/ScrollToTop";

// Code-split: each page (and the whole admin) loads its own chunk on demand,
// instead of shipping one ~2 MB bundle that must download+parse on every load.
const Home = lazy(() => import("./pages/Home"));
const Catalog = lazy(() => import("./pages/Catalog"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Services = lazy(() => import("./pages/Services"));
const Contacts = lazy(() => import("./pages/Contacts"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/Auth"));
const RegisterWithInvite = lazy(() => import("./pages/RegisterWithInvite"));
const CreateFirstDirector = lazy(() => import("./pages/CreateFirstDirector"));
const DirectorRegistration = lazy(() => import("./pages/DirectorRegistration"));
const Cases = lazy(() => import("./pages/Cases"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const About = lazy(() => import("./pages/About"));
const AdminWrapper = lazy(() => import("./features/admin/components/AdminWrapper"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-msc-accent border-t-transparent animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
  const productIdentifier = slug || id;
  return (
    <Navigate
      to={`/catalog/unknown-manufacturer/${productIdentifier}`}
      replace
    />
  );
};

const App = () => {
  const [language, setLanguage] = useState<"ru" | "en" | "uz">("ru");

  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <PointerEventsGuard />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AdminWrapper />
                  </Suspense>
                }
              />

              {/* Public Routes */}
              <Route
                path="/*"
                element={
                  <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1">
                      <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route
                          path="/"
                          element={<Home language={language} />}
                        />
                        <Route
                          path="/setup-director"
                          element={<CreateFirstDirector />}
                        />
                        <Route
                          path="/director-registration"
                          element={<DirectorRegistration />}
                        />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/catalog" element={<Catalog />} />
                        <Route
                          path="/catalog/:manufacturerSlug/:productSlug"
                          element={<ProductDetail />}
                        />
                        <Route
                          path="/catalog/:productSlug"
                          element={<ProductDetail />}
                        />
                        {/* Legacy redirects */}
                        <Route
                          path="/catalog/products/:slug"
                          element={<ProductRedirect />}
                        />
                        <Route
                          path="/product/:id"
                          element={<ProductRedirect />}
                        />
                        <Route
                          path="/products/:id"
                          element={<ProductRedirect />}
                        />
                        <Route path="/services" element={<Services />} />
                        <Route path="/cases" element={<Cases />} />
                        <Route
                          path="/about"
                          element={<About />}
                        />
                        <Route
                          path="/privacy-policy"
                          element={<PrivacyPolicy />}
                        />
                        <Route path="/contacts" element={<Contacts />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      </Suspense>
                    </main>
                    <Footer language={language} />
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
