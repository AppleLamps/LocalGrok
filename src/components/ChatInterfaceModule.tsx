import React, { useState } from "react";
import SettingsPanel from "./SettingsPanel";
import ChatHeader from "./ChatHeader";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatControls from "./ChatControls";
import { ChatProvider } from "@/contexts/ChatContext";
import { SettingsProvider, useSettingsContext } from "@/contexts/SettingsContext";

/**
 * Helper consumer component to access settings context
 */
const SettingsConsumer = ({ children }: { children: (settings: ReturnType<typeof useSettingsContext>) => React.ReactNode }) => {
  const settings = useSettingsContext();
  return <>{children(settings)}</>;
};

/**
 * Main ChatInterface component that orchestrates the UI layout
 * This component has been refactored to use smaller component modules 
 * and context providers for better separation of concerns
 */
export function ChatInterface() {
  const [sidebarVisible, setSidebarVisible] = useState(true);

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
            temperature={settingsProps.temperature}
            maxTokens={settingsProps.maxTokens}
            currentModel={settingsProps.currentModel}
          >
            <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
              {/* Sidebar */}
              <ChatSidebar 
                sidebarVisible={sidebarVisible} 
                formatDate={formatDate} 
              />

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Bar with Model Selection */}
                <ChatHeader toggleSidebar={toggleSidebar} />

                {/* Messages Area */}
                <ChatMessages />

                {/* Input Area */}
                <ChatControls />
              </div>

              {/* Settings Panel */}
              <SettingsPanel
                isOpen={settingsProps.settingsOpen}
                onClose={() => settingsProps.setSettingsOpen(false)}
                apiKey={settingsProps.apiKey}
                temperature={settingsProps.temperature}
                maxTokens={settingsProps.maxTokens}
                onSave={settingsProps.handleSaveSettings}
              />
            </div>
          </ChatProvider>
        )}
      </SettingsConsumer>
    </SettingsProvider>
  );
}

export default ChatInterface; 