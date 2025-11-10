import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEOHead from "@/components/SEO/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SEOHead
        title="Страница не найдена - Med Service Centre"
        description="Страница не найдена. Вернитесь на главную Med Service Centre™ или используйте навигацию, чтобы найти нужное оборудование, сервис и аренду для клиники."
        keywords="404 Med Service Centre, страница не найдена, медицинское оборудование, возврат на главную, аренда медоборудования, сервис клиник"
      />
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
