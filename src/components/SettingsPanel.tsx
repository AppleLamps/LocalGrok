import React, { useState, useEffect } from "react";
import { X, Key, Save, AlertCircle, CheckCircle, LucideIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { xaiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string, temperature: number, maxTokens: number) => void;
  temperature?: number;
  maxTokens?: number;
}

const SettingsPanel = ({ 
  isOpen, 
  onClose, 
  apiKey, 
  onSave,
  temperature = 0.7,
  maxTokens = 8192
}: SettingsPanelProps) => {
  const [inputApiKey, setInputApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [temperatureValue, setTemperatureValue] = useState(temperature);
  const [maxTokensValue, setMaxTokensValue] = useState(maxTokens);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setInputApiKey(apiKey);
    setTemperatureValue(temperature);
    setMaxTokensValue(maxTokens);
  }, [apiKey, temperature, maxTokens]);

  const handleSave = () => {
    try {
      onSave(inputApiKey, temperatureValue, maxTokensValue);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const testApiKey = async () => {
    if (!inputApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key to test.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingKey(true);
    try {
      console.log("Testing API key...");
      // Simple test message
      const message = {
        role: "user" as const,
        content: "Hello, this is a test message to verify my API key is working."
      };
      
      // Use a clean, trimmed version of the API key
      const cleanApiKey = inputApiKey.trim();
      await xaiService.sendMessage([message], cleanApiKey);
      
      toast({
        title: "API Key Valid",
        description: "Your API key has been successfully verified!",
        variant: "default",
      });
    } catch (error) {
      let errorMessage = "Failed to verify API key";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "API Key Invalid",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const StatusMessage = ({ status }: { status: typeof saveStatus }) => {
    if (status === "idle") return null;
    
    const config = {
      success: {
        message: "Settings saved successfully",
        className: "text-green-500 dark:text-green-400",
        icon: CheckCircle as LucideIcon,
      },
      error: {
        message: "Failed to save settings",
        className: "text-red-500 dark:text-red-400",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-500/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* API Key Settings */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Model: grok-2-latest
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                This application uses the XAI API with the grok-2-latest model. You'll need to provide your XAI API key below.
              </p>
            </div>
          
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              XAI API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 pr-10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter your XAI API key..."
              />
              <Key size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showApiKey}
                  onChange={() => setShowApiKey(!showApiKey)}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                Show API key
              </label>
              
              <button
                onClick={testApiKey}
                disabled={isTestingKey}
                className={cn(
                  "text-sm px-3 py-1 rounded-md flex items-center gap-1",
                  isTestingKey 
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                )}
              >
                <Zap size={14} />
                {isTestingKey ? "Testing..." : "Test API Key"}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your XAI API key is stored locally on your device and never sent to our servers. You can obtain an API key from the XAI developer portal.
            </p>
            
            {/* Model Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Model Settings
              </h3>
              
              {/* Temperature slider */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Temperature: {temperatureValue.toFixed(1)}
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {temperatureValue < 0.7 ? "More precise" : temperatureValue > 1.3 ? "More creative" : "Balanced"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperatureValue}
                  onChange={(e) => setTemperatureValue(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                </div>
              </div>
              
              {/* Max tokens slider */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Maximum Length: {maxTokensValue.toLocaleString()}
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="1024"
                  max="131072"
                  step="1024"
                  value={maxTokensValue}
                  onChange={(e) => setMaxTokensValue(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1K</span>
                  <span>64K</span>
                  <span>131K</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Temperature controls the randomness of the model's output. Higher values (like 1.5) make output more creative and varied, while lower values (like 0.2) make it more focused and deterministic. Range: 0-2.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Maximum Length controls how many tokens (roughly words) the model will generate in its response. Higher values allow for longer responses, up to 131,072 tokens.
              </p>
            </div>
            
            <StatusMessage status={saveStatus} />
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
