import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { xaiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { ProcessedFile } from "@/components/FileUploader";

// Define types
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | {
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;
      detail: "high" | "low" | "auto";
    };
  }[];
  timestamp: Date;
  fileContents?: string; // Optional field to store file contents
  fileNames?: string[]; // Optional field to store file names
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

// Context type definitions
interface ChatContextType {
  // Messages state
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  
  // Processing state
  isProcessing: boolean;
  
  // Streaming message state
  streamingMessage: Message | null;
  
  // Current chat state
  currentChatId: string | null;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Chat history state
  savedChats: SavedChat[];
  setSavedChats: React.Dispatch<React.SetStateAction<SavedChat[]>>;
  
  // Functions
  addWelcomeMessage: () => void;
  handleSendMessage: (content: string, images: string[], files?: ProcessedFile[]) => Promise<void>;
  handleStartNewChat: () => void;
  loadSavedChat: (chatId: string) => void;
  deleteSavedChat: (chatId: string, e: React.MouseEvent) => void;
  saveCurrentChat: () => void;
  getChatTitle: (chatMessages: Message[]) => string;
  
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
}

// Create context
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Context provider
interface ChatProviderProps {
  children: ReactNode;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  currentModel: string;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ 
  children, 
  apiKey, 
  temperature, 
  maxTokens,
  currentModel
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const streamingContentRef = useRef<string | any[]>("");
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load messages, saved chats from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    const savedChatsData = localStorage.getItem("savedChats");
    const currentChatIdData = localStorage.getItem("currentChatId");
    
    // Load saved chats
    if (savedChatsData) {
      try {
        setSavedChats(JSON.parse(savedChatsData));
      } catch (e) {
        console.error("Error parsing saved chats", e);
        localStorage.removeItem("savedChats");
      }
    }
    
    // Load current chat ID
    if (currentChatIdData) {
      setCurrentChatId(currentChatIdData);
    }
    
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        
        // If this is a new session and we have messages but no currentChatId,
        // generate a new ID for the current conversation
        if (!currentChatIdData && parsedMessages.length > 1) {
          const newId = `chat-${Date.now()}`;
          setCurrentChatId(newId);
          localStorage.setItem("currentChatId", newId);
        }
      } catch (e) {
        console.error("Error parsing saved messages", e);
        localStorage.removeItem("chatMessages");
        addWelcomeMessage();
      }
    } else {
      // Add welcome message if no messages exist
      addWelcomeMessage();
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);
  
  // Save saved chats to localStorage whenever they change
  useEffect(() => {
    if (savedChats.length > 0) {
      localStorage.setItem("savedChats", JSON.stringify(savedChats));
    }
  }, [savedChats]);

  // Handle scroll to bottom for new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage?.content]);

  // Debug current message state
  useEffect(() => {
    if (messages.length > 0) {
      console.log("Current messages state:", JSON.stringify(messages.map(m => ({
        id: m.id,
        role: m.role,
        content: typeof m.content === 'string' 
          ? (m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content) 
          : 'complex content with images'
      })), null, 2));
    }
  }, [messages]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Add welcome message
  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: "# Welcome to Grok\n\nI'm an AI assistant. How can I help you today?",
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setCurrentChatId(null);
    localStorage.removeItem("currentChatId");
  };

  // Get chat title from messages
  const getChatTitle = (chatMessages: Message[]): string => {
    if (chatMessages.length <= 1) return "New Chat";
    
    // Find first user message
    const firstUserMessage = chatMessages.find(msg => msg.role === "user" && msg.id !== "welcome");
    if (!firstUserMessage) return "New Chat";
    
    // Extract the title from the message content
    let title = typeof firstUserMessage.content === 'string' 
      ? firstUserMessage.content 
      : firstUserMessage.content.find(item => item.type === 'text')?.text || "New Chat";
    
    // Limit title length
    return title.substring(0, 50) + (title.length > 50 ? "..." : "");
  };

  // Save current chat
  const saveCurrentChat = () => {
    // Only save if we have more than just the welcome message
    if (messages.length <= 1 || !currentChatId) return;
    
    // Check if this chat is already saved
    const existingChatIndex = savedChats.findIndex(chat => chat.id === currentChatId);
    const chatTitle = getChatTitle(messages);
    
    if (existingChatIndex >= 0) {
      // Update existing chat
      const updatedChats = [...savedChats];
      updatedChats[existingChatIndex] = {
        ...updatedChats[existingChatIndex],
        title: chatTitle,
        messages: [...messages],
        lastUpdated: new Date()
      };
      setSavedChats(updatedChats);
    } else {
      // Add new chat to saved chats
      setSavedChats(prev => [
        ...prev,
        {
          id: currentChatId,
          title: chatTitle,
          messages: [...messages],
          lastUpdated: new Date()
        }
      ]);
    }
  };

  // Load saved chat
  const loadSavedChat = (chatId: string) => {
    if (isProcessing) return;
    
    const chatToLoad = savedChats.find(chat => chat.id === chatId);
    if (!chatToLoad) return;
    
    // Save current chat before switching
    saveCurrentChat();
    
    // Load the selected chat
    setMessages(chatToLoad.messages);
    setCurrentChatId(chatId);
    localStorage.setItem("currentChatId", chatId);
  };
  
  // Delete saved chat
  const deleteSavedChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering chat selection
    
    const updatedChats = savedChats.filter(chat => chat.id !== chatId);
    setSavedChats(updatedChats);
    
    // If we're deleting the current chat, start a new one
    if (chatId === currentChatId) {
      handleStartNewChat();
    }
    
    toast({
      title: "Chat Deleted",
      description: "The chat has been removed from your history.",
    });
  };

  // Handle sending a message
  const handleSendMessage = async (content: string, images: string[] = [], files: ProcessedFile[] = []) => {
    if (!content.trim() && images.length === 0 && files.length === 0) return;
    
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Determine if we should use vision model based on presence of images
    const shouldUseVisionModel = images.length > 0;
    
    // Create content array for message with images
    let messageContent: string | {
      type: "text" | "image_url";
      text?: string;
      image_url?: {
        url: string;
        detail: "high" | "low" | "auto";
      };
    }[] = content;
    
    // If there are images, format content as array with text and images
    if (shouldUseVisionModel) {
      messageContent = [
        {
          type: "text",
          text: content || "Describe these images"
        },
        ...images.map(imgBase64 => ({
          type: "image_url" as const,
          image_url: {
            url: imgBase64,
            detail: "high" as const
          }
        }))
      ];
    }
    
    // Process file content information
    let fileContents = "";
    let fileNames: string[] = [];
    
    if (files && files.length > 0) {
      fileContents = files.map(file => 
        `===== FILE: ${file.name} =====\n\n${file.content}\n\n`
      ).join("\n");
      
      fileNames = files.map(file => file.name);
    }
    
    // Add user message
    const userMessage: Message = {
      id,
      role: "user",
      content: messageContent,
      timestamp: new Date(),
      fileContents: fileContents || undefined,
      fileNames: fileNames.length > 0 ? fileNames : undefined,
    };
    
    // Store current messages for comparison
    const currentMessages = [...messages];
    
    // Add the user message to the UI
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
        return;
      }
      
      // Create actual message history for API (exclude welcome message)
      let apiMessages = [];
      
      // Select the right model based on whether we have images
      const modelToUse = shouldUseVisionModel ? "grok-2-vision-latest" : currentModel;
      
      // First, add the system message
      apiMessages.push({
        role: "system" as const,
        content: "You are Grok, an AI assistant. You are helpful, creative, and provide accurate information. Answer questions in a friendly, conversational manner. IMPORTANT: Always address the user's specific question directly without generic greetings. The user has already been welcomed, so focus immediately on their query."
      });
      
      // If this is the first user message (only welcome message exists)
      if (currentMessages.length === 1 && currentMessages[0].id === "welcome") {
        console.log("First message detected - using special handling");
        
        // If there are files, add context about them
        if (fileContents) {
          let fileMessage = "";
          
          if (fileNames.length === 1) {
            fileMessage = `The user has uploaded a file named "${fileNames[0]}". The content of the file is provided below. Use this information to answer their query:\n\n${fileContents}`;
          } else if (fileNames.length > 1) {
            fileMessage = `The user has uploaded ${fileNames.length} files named: ${fileNames.join(", ")}. The content of these files is provided below. Use this information to answer their query:\n\n${fileContents}`;
          }
          
          if (fileMessage) {
            apiMessages.push({
              role: "system" as const,
              content: fileMessage
            });
          }
        }
        
        // Add instruction about first message
        apiMessages.push({
          role: "system" as const,
          content: "This is the user's first query. Respond directly to their question without pleasantries or introductions. They have already been greeted."
        });
        
        // Add user's message
        apiMessages.push({
          role: "user" as const,
          content: messageContent
        });
      } else {
        // For regular conversations, add all non-welcome messages
        // Need to handle both string content and object content messages
        const historyMessages = currentMessages
          .filter(msg => msg.id !== "welcome")
          .map(({ role, content, fileContents }) => {
            // For non-vision models, convert complex content to text
            if (!shouldUseVisionModel && Array.isArray(content)) {
              // Extract just the text parts of complex content
              const textContent = content
                .filter(item => item.type === 'text')
                .map(item => (item as {type: 'text', text: string}).text)
                .join('\n');
              
              // Also add a note that there were images
              const hasImages = content.some(item => item.type === 'image_url');
              const finalContent = hasImages 
                ? `${textContent}\n[This message contained images that are not shown in the history]`
                : textContent;
                
              return {
                role: role as "user" | "assistant" | "system",
                content: finalContent
              };
            }
            
            // For vision model or simple string content, pass as is
            return {
              role: role as "user" | "assistant" | "system",
              content
            };
          });
        
        // If there are files, add context about them
        if (fileContents) {
          let fileMessage = "";
          
          if (fileNames.length === 1) {
            fileMessage = `The user has uploaded a file named "${fileNames[0]}". The content of the file is provided below. Use this information to answer their query:\n\n${fileContents}`;
          } else if (fileNames.length > 1) {
            fileMessage = `The user has uploaded ${fileNames.length} files named: ${fileNames.join(", ")}. The content of these files is provided below. Use this information to answer their query:\n\n${fileContents}`;
          }
          
          if (fileMessage) {
            apiMessages.push({
              role: "system" as const,
              content: fileMessage
            });
          }
        }
        
        // Add history plus new message
        apiMessages = [...apiMessages, ...historyMessages, {
          role: "user" as const,
          content: messageContent
        }];
      }
      
      // Debug info
      console.log("Final API messages:", JSON.stringify(apiMessages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' 
          ? (m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content) 
          : 'complex content with images'
      })), null, 2));
      
      // Create streaming message placeholder
      const streamingMessageId = `assistant-${Date.now()}`;
      const initialStreamingMessage: Message = {
        id: streamingMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      
      setStreamingMessage(initialStreamingMessage);
      
      // Use streaming API to get response chunks with user's temperature and max_tokens settings
      await xaiService.streamResponse(
        apiMessages,
        apiKey,
        // Handle each chunk of the response
        (chunk) => {
          // Update the ref with the latest content
          if (typeof streamingContentRef.current === 'string') {
            streamingContentRef.current += chunk;
          } else {
            streamingContentRef.current = chunk;
          }
          
          // Update the streaming message state for UI display
          setStreamingMessage((prev) => {
            if (!prev) return initialStreamingMessage;
            return {
              ...prev,
              content: typeof prev.content === 'string' ? 
                streamingContentRef.current : 
                streamingContentRef.current
            };
          });
        },
        // Handle when the response is complete
        () => {
          // Get the final content from our ref
          const finalContent = streamingContentRef.current;
          
          // Clear the streaming state
          setStreamingMessage(null);
          setIsProcessing(false);
          
          // Reset the ref
          streamingContentRef.current = "";
          
          // Create the final assistant message
          const finalMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: finalContent,
            timestamp: new Date()
          };
          
          // Add it to the messages array
          setMessages(prev => [...prev, finalMessage]);
          
          // Save changes
          setTimeout(() => {
            // If this is a new chat, generate a title and save it
            if (currentChatId === null && currentMessages.length <= 1) {
              const newChatId = `chat-${Date.now()}`;
              setCurrentChatId(newChatId);
              localStorage.setItem("currentChatId", newChatId);
            }
            
            // Save to localStorage
            localStorage.setItem("chatMessages", JSON.stringify([...messages, finalMessage]));
            
            // Update saved chats
            if (currentChatId) {
              saveCurrentChat();
            }
          }, 100);
        },
        // Handle errors in the stream
        (error) => {
          console.error("Stream error:", error);
          setIsProcessing(false);
          setStreamingMessage(null);
          toast({
            title: "Error",
            description: error.message || "Failed to get response from Grok.",
            variant: "destructive",
          });
        },
        temperature,
        maxTokens,
        modelToUse
      );
      
    } catch (error) {
      console.error("Error sending message:", error);
      setIsProcessing(false);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message to Grok.",
        variant: "destructive",
      });
    }
  };

  // Start a new chat
  const handleStartNewChat = () => {
    if (isProcessing) return;
    
    // Save current chat before starting a new one
    saveCurrentChat();
    
    // Start new chat
    const newId = `chat-${Date.now()}`;
    setCurrentChatId(newId);
    localStorage.setItem("currentChatId", newId);
    
    // Use the same detailed welcome message as the initial one
    console.log("Creating new chat with detailed welcome message");
    addWelcomeMessage();
  };

  // Provide the context value
  const contextValue: ChatContextType = {
    messages,
    setMessages,
    isProcessing,
    streamingMessage,
    currentChatId,
    setCurrentChatId,
    savedChats,
    setSavedChats,
    addWelcomeMessage,
    handleSendMessage,
    handleStartNewChat,
    loadSavedChat,
    deleteSavedChat,
    saveCurrentChat,
    getChatTitle,
    messagesEndRef,
    messagesContainerRef,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook for using the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 