
import React, { useState, useEffect } from "react";
import { X, Key, Save, AlertCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

const SettingsPanel = ({ isOpen, onClose, apiKey, onSaveApiKey }: SettingsPanelProps) => {
  const [inputApiKey, setInputApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    setInputApiKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    try {
      onSaveApiKey(inputApiKey);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const StatusMessage = ({ status }: { status: typeof saveStatus }) => {
    if (status === "idle") return null;
    
    const config = {
      success: {
        message: "Settings saved successfully",
        className: "text-green-400",
        icon: AlertCircle as LucideIcon,
      },
      error: {
        message: "Failed to save settings",
        className: "text-red-400",
        icon: AlertCircle as LucideIcon,
      },
    }[status];
    
    return (
      <div className={cn("flex items-center gap-1 mt-2 text-sm", config.className)}>
        <config.icon size={14} />
        <span>{config.message}</span>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div 
        className={cn(
          "glass-card p-6 max-w-md w-full transform transition-all duration-300",
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm text-muted-foreground mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                className="w-full glass-input rounded-lg py-2 px-3 pr-10 text-sm"
                placeholder="Enter your API key..."
              />
              <Key size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-1">
              <label className="flex items-center text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showApiKey}
                  onChange={() => setShowApiKey(!showApiKey)}
                  className="mr-2 h-3 w-3"
                />
                Show API key
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your API key is stored locally on your device and never sent to our servers.
            </p>
            <StatusMessage status={saveStatus} />
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
