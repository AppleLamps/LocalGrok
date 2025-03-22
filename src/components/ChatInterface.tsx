import React, { useState, useEffect } from "react";
import SettingsPanel from "./SettingsPanel";
import ChatHeader from "./ChatHeader";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatControls from "./ChatControls";
import { ChatProvider } from "@/contexts/ChatContext";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

/**
 * Helper consumer component to access settings context
 */
const SettingsConsumer = ({ children }: { children: (settings: ReturnType<typeof useSettings>) => React.ReactNode }) => {
  const settings = useSettings();
  return <>{children(settings)}</>;
};

/**
 * Main ChatInterface component that orchestrates the UI layout
 * This component has been refactored to use smaller component modules 
 * and context providers for better separation of concerns
 */
const ChatInterface: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Set up listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Format date for display in sidebar
  const formatDate = (date: Date): string => {
    const now = new Date();
    const chatDate = new Date(date);
    
    // Check if date is today
    if (chatDate.toDateString() === now.toDateString()) {
      return "Today";
    }
    
    // Check if date is yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (chatDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // Otherwise return formatted date
    return chatDate.toLocaleDateString();
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <SettingsProvider>
      <SettingsConsumer>
        {(settingsProps) => (
          <ChatProvider 
            apiKey={settingsProps.apiKey}
            modelTemperature={settingsProps.modelTemperature}
            maxTokens={settingsProps.maxTokens}
            currentModel="grok-2-latest"
          >
            <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
              {/* Responsive layout with different behavior for mobile and desktop */}
              {isMobile ? (
                // Mobile layout - sidebar is fixed position and overlays
                <>
                  <div className={cn(
                    "fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ease-in-out", 
                    sidebarVisible ? "opacity-100" : "opacity-0 pointer-events-none",
                  )}>
                    {/* Backdrop overlay - clicks outside sidebar close it */}
                    <div 
                      className="absolute inset-0" 
                      onClick={toggleSidebar}
                      aria-hidden="true"
                    ></div>
                  </div>
                  
                  <div className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out",
                    sidebarVisible ? "translate-x-0" : "-translate-x-full"
                  )}>
                    <ChatSidebar 
                      sidebarVisible={sidebarVisible} 
                      formatDate={formatDate} 
                      toggleSidebar={toggleSidebar}
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col h-full transition-margin duration-300 ease-in-out">
                    <ChatHeader toggleSidebar={toggleSidebar} />
                    <ChatMessages />
                    <ChatControls />
                  </div>
                </>
              ) : (
                // Desktop layout - sidebar pushes content
                <>
                  <div className={cn(
                    "transition-all duration-300 ease-in-out",
                    sidebarVisible ? "w-64 shrink-0" : "w-0 shrink-0 overflow-hidden"
                  )}>
                    <ChatSidebar 
                      sidebarVisible={sidebarVisible} 
                      formatDate={formatDate} 
                      toggleSidebar={toggleSidebar}
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col h-full transition-all duration-300 ease-in-out">
                    <ChatHeader toggleSidebar={toggleSidebar} />
                    <ChatMessages />
                    <ChatControls />
                  </div>
                </>
              )}

              {/* Settings Panel - Now using the context value */}
              <SettingsPanel
                isOpen={settingsProps.settingsOpen}
                onClose={() => settingsProps.setSettingsOpen(false)}
                apiKey={settingsProps.apiKey}
                temperature={settingsProps.modelTemperature}
                maxTokens={settingsProps.maxTokens}
                onSave={settingsProps.handleSaveSettings}
              />
            </div>
          </ChatProvider>
        )}
      </SettingsConsumer>
    </SettingsProvider>
  );
};

// Make sure to export as default for compatibility with existing imports
export default ChatInterface; 