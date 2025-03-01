
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-6 animate-in">
        <div className="mx-auto bg-destructive/20 rounded-full p-4 w-fit">
          <AlertTriangle size={32} className="text-destructive" />
        </div>
        
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">The page you're looking for doesn't exist</p>
        
        <a 
          href="/" 
          className="flex items-center justify-center gap-2 mt-6 py-2 px-4 glass-card hover:bg-white/10 transition-all w-full"
        >
          <Home size={16} />
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
