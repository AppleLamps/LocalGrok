
import React from "react";
import ChatInterface from "@/components/ChatInterface";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Gradient circles */}
        <div className="absolute top-1/4 -left-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        
        {/* Glass panel */}
        <div className="absolute inset-0 bg-gradient-dark opacity-90" />
      </div>
      
      {/* Main content */}
      <ChatInterface />
    </div>
  );
};

export default Index;
