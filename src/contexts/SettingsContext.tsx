import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

// Context default values
interface SettingsContextType {
  apiKey: string;
  modelTemperature: number;
  maxTokens: number;
  settingsOpen: boolean;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Setters
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  setModelTemperature: React.Dispatch<React.SetStateAction<number>>;
  setMaxTokens: React.Dispatch<React.SetStateAction<number>>;
  
  // Functions
  handleSaveSettings: (key: string, temp: number, tokens: number) => void;
}

// Create context with default values
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for settings
  const [apiKey, setApiKey] = useState("");
  const [modelTemperature, setModelTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { toast } = useToast();
  
  useEffect(() => {
    // Load settings from localStorage
    const storedApiKey = localStorage.getItem('apiKey');
    const storedTemperature = localStorage.getItem('modelTemperature');
    const storedMaxTokens = localStorage.getItem('maxTokens');
    
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      // Automatically open settings panel if no API key is stored
      setSettingsOpen(true);
    }
    
    if (storedTemperature) {
      setModelTemperature(parseFloat(storedTemperature));
    }
    
    if (storedMaxTokens) {
      setMaxTokens(parseInt(storedMaxTokens, 10));
    }
  }, []);
  
  const handleSaveSettings = (key: string, temp: number, tokens: number) => {
    setApiKey(key);
    setModelTemperature(temp);
    setMaxTokens(tokens);
    
    // Save to localStorage
    if (key) {
      localStorage.setItem('apiKey', key);
    }
    
    localStorage.setItem('modelTemperature', temp.toString());
    localStorage.setItem('maxTokens', tokens.toString());
    
    // Close settings after saving
    setSettingsOpen(false);
    
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };
  
  const value = {
    apiKey,
    modelTemperature,
    maxTokens,
    settingsOpen,
    setSettingsOpen,
    
    setApiKey,
    setModelTemperature,
    setMaxTokens,
    
    handleSaveSettings,
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for using the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 