import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-8 max-w-md w-full text-center space-y-6 animate-in">
        <div className="mx-auto bg-red-100 dark:bg-red-900/20 rounded-full p-4 w-fit">
          <AlertTriangle size={32} className="text-red-500 dark:text-red-400" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">The page you're looking for doesn't exist</p>
        
        <a 
          href="/" 
          className="flex items-center justify-center gap-2 mt-6 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Home size={16} />
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
