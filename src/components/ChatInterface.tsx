
import React, { useState, useEffect, useRef } from "react";
import { Settings, Plus, Bot, GitBranch, ArrowDown } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SettingsPanel from "./SettingsPanel";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load messages and API key from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    const savedApiKey = localStorage.getItem("apiKey");
    
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Error parsing saved messages", e);
        localStorage.removeItem("chatMessages");
      }
    } else {
      // Add welcome message if no messages exist
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm Grok AI. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  // Handle scroll to bottom for new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if scroll button should be shown
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Add user message
    const userMessage: Message = {
      id,
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    
    try {
      // Check if API key is set
      if (!apiKey) {
        toast({
          title: "API Key Missing",
          description: "Please set your API key in the settings.",
          variant: "destructive",
        });
        setIsProcessing(false);
        setSettingsOpen(true);
        return;
      }
      
      // Mock AI response for now (we'll implement the real API call later)
      setTimeout(() => {
        // Simulate API response
        const aiResponse: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: getAiResponse(content),
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, aiResponse]);
        setIsProcessing(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error sending message", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Mock AI response function (to be replaced with actual API call)
  const getAiResponse = (userInput: string): string => {
    const responses = [
      `I understand you're saying "${userInput}". This is a simulated response for demonstration purposes. In a real implementation, this would connect to an AI API.`,
      `That's an interesting question about "${userInput}". Once you add your API key in settings, I'll provide actual AI-powered responses.`,
      `Thanks for asking about "${userInput}". This interface is currently showing placeholder responses. Configure your API key to enable real AI interactions.`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("apiKey", key);
    toast({
      title: "Settings Saved",
      description: "Your API key has been saved successfully.",
    });
  };

  const handleStartNewChat = () => {
    if (messages.length > 1 && !isProcessing) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm Grok AI. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      {/* Header */}
      <header className="glass-card border-b border-white/10 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-full p-1.5">
            <Bot size={18} className="text-white" />
          </div>
          <h1 className="font-medium">Grok Glass Chat</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartNewChat}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
            disabled={isProcessing || messages.length <= 1}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
          
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>
      
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto py-4 px-4 sm:px-6 space-y-4"
      >
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {messages.map((message, index) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              isLatest={index === messages.length - 1}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-2 bg-primary rounded-full shadow-glow animate-pulse-subtle transition-all hover:bg-primary/90"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}
      
      {/* Input Area */}
      <div className="p-4 sm:p-6">
        <ChatInput onSendMessage={handleSendMessage} isProcessing={isProcessing} />
        
        <div className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <GitBranch size={12} />
          <span>Grok Glass Chat • Built with Lovable</span>
        </div>
      </div>
      
      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
};

export default ChatInterface;
