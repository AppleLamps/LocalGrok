import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

// Define the settings context type
interface SettingsContextType {
  // Settings state
  apiKey: string;
  temperature: number;
  maxTokens: number;
  currentModel: string;
  settingsOpen: boolean;
  
  // Setters
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  setTemperature: React.Dispatch<React.SetStateAction<number>>;
  setMaxTokens: React.Dispatch<React.SetStateAction<number>>;
  setCurrentModel: React.Dispatch<React.SetStateAction<string>>;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Functions
  handleSaveSettings: (key: string, temp: number, tokens: number) => void;
}

// Create the context
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Settings provider props
interface SettingsProviderProps {
  children: ReactNode;
}

// Create the provider component
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [apiKey, setApiKey] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [currentModel, setCurrentModel] = useState("grok-2-latest");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("apiKey");
    const savedTemperature = localStorage.getItem("temperature");
    const savedMaxTokens = localStorage.getItem("maxTokens");
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    if (savedTemperature) {
      try {
        setTemperature(parseFloat(savedTemperature));
      } catch (e) {
        console.error("Error parsing saved temperature", e);
      }
    }

    if (savedMaxTokens) {
      try {
        setMaxTokens(parseInt(savedMaxTokens));
      } catch (e) {
        console.error("Error parsing saved max tokens", e);
      }
    }
  }, []);

  // Save settings function
  const handleSaveSettings = (key: string, temp: number, tokens: number) => {
    setApiKey(key);
    setTemperature(temp);
    setMaxTokens(tokens);
    
    localStorage.setItem("apiKey", key);
    localStorage.setItem("temperature", temp.toString());
    localStorage.setItem("maxTokens", tokens.toString());
    
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  // Create the context value
  const contextValue: SettingsContextType = {
    apiKey,
    temperature,
    maxTokens,
    currentModel,
    settingsOpen,
    setApiKey,
    setTemperature,
    setMaxTokens,
    setCurrentModel,
    setSettingsOpen,
    handleSaveSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for using the settings context
export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}; 