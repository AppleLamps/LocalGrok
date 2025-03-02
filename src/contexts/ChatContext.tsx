import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { xaiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { ProcessedFile } from "@/components/FileUploader";

// Define types that align with the xaiService types
type MessageRole = "system" | "user" | "assistant";
type MessageContentItem = {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail: "high" | "low" | "auto";
  };
};
type MessageContent = string | MessageContentItem[];

// Chat specific types
export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent;
  timestamp: Date;
  fileContents?: string;
  fileNames?: string[];
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

// Context type definitions
interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isProcessing: boolean;
  streamingMessage: Message | null;
  currentChatId: string | null;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
  savedChats: SavedChat[];
  setSavedChats: React.Dispatch<React.SetStateAction<SavedChat[]>>;
  addWelcomeMessage: () => void;
  handleSendMessage: (content: string, images: string[], files?: ProcessedFile[]) => Promise<void>;
  handleStartNewChat: () => void;
  loadSavedChat: (chatId: string) => void;
  deleteSavedChat: (chatId: string, e: React.MouseEvent) => void;
  saveCurrentChat: () => void;
  getChatTitle: (chatMessages: Message[]) => string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
}

// Create context
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Storage keys for consistency
const STORAGE_KEYS = {
  MESSAGES: "chatMessages",
  SAVED_CHATS: "savedChats",
  CURRENT_CHAT_ID: "currentChatId"
};

// Helper functions
const generateId = (prefix: string = ''): string => `${prefix}${Date.now()}`;

const storeInLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error storing ${key} in localStorage:`, error);
  }
};

const retrieveFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

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
  // State
  const [messages, setMessages] = useState<Message[]>(() => 
    retrieveFromLocalStorage<Message[]>(STORAGE_KEYS.MESSAGES, [])
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => 
    localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_ID)
  );
  const [savedChats, setSavedChats] = useState<SavedChat[]>(() => 
    retrieveFromLocalStorage<SavedChat[]>(STORAGE_KEYS.SAVED_CHATS, [])
  );
  
  // Refs
  const streamingContentRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Reset isProcessing on page visibility changes (if browser tab is switched/hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      
      // If the page becomes visible again and we're still in processing state
      // for more than 10 seconds, reset the state
      if (isProcessing) {
        setTimeout(() => {
          setIsProcessing(prev => {
            if (prev) {
              console.log("Resetting stuck isProcessing state");
              return false;
            }
            return prev;
          });
          
          setStreamingMessage(prev => {
            if (prev) {
              console.log("Clearing stuck streamingMessage");
              return null;
            }
            return prev;
          });
        }, 5000);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Fallback timeout to reset processing state if it gets stuck
    let processingTimer: ReturnType<typeof setTimeout> | null = null;
    
    if (isProcessing) {
      processingTimer = setTimeout(() => {
        setIsProcessing(prev => {
          if (prev) {
            console.log("Resetting stuck isProcessing state via fallback timer");
            return false;
          }
          return prev;
        });
        
        setStreamingMessage(prev => {
          if (prev) {
            console.log("Clearing stuck streamingMessage via fallback timer");
            return null;
          }
          return prev;
        });
      }, 60000); // 1 minute timeout
    }
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (processingTimer) clearTimeout(processingTimer);
    };
  }, [isProcessing]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedMessages = retrieveFromLocalStorage<Message[]>(STORAGE_KEYS.MESSAGES, []);
    const savedChatsData = retrieveFromLocalStorage<SavedChat[]>(STORAGE_KEYS.SAVED_CHATS, []);
    const currentChatIdData = localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_ID);

    // Set saved chats
    if (savedChatsData.length > 0) {
      setSavedChats(savedChatsData);
    }

    // Set current chat ID
    if (currentChatIdData) {
      setCurrentChatId(currentChatIdData);
    }

    // Set messages or add welcome message
    if (savedMessages.length > 0) {
      setMessages(savedMessages);

      // Generate new chat ID if needed
      if (!currentChatIdData && savedMessages.length > 1) {
        const newId = generateId('chat-');
        setCurrentChatId(newId);
        localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, newId);
      }
    } else {
      addWelcomeMessage();
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      storeInLocalStorage(STORAGE_KEYS.MESSAGES, messages);
    }
  }, [messages]);

  // Save chats to localStorage
  useEffect(() => {
    if (savedChats.length > 0) {
      storeInLocalStorage(STORAGE_KEYS.SAVED_CHATS, savedChats);
    }
  }, [savedChats]);

  // Scroll to bottom for new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage?.content]);

  // Debug logging for messages
  useEffect(() => {
    if (messages.length > 0) {
      const debugMessages = messages.map(m => ({
        id: m.id,
        role: m.role,
        content: typeof m.content === 'string'
          ? (m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content)
          : 'complex content with images'
      }));
      console.log("Current messages state:", JSON.stringify(debugMessages, null, 2));
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
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT_ID);
  };

  // Get chat title from messages
  const getChatTitle = (chatMessages: Message[]): string => {
    if (chatMessages.length <= 1) return "New Chat";

    // Find first user message
    const firstUserMessage = chatMessages.find(msg => msg.role === "user" && msg.id !== "welcome");
    if (!firstUserMessage) return "New Chat";

    // Extract title from message content
    let title = typeof firstUserMessage.content === 'string'
      ? firstUserMessage.content
      : firstUserMessage.content.find(item => item.type === 'text')?.text || "New Chat";

    // Limit title length
    return title.length > 50 ? `${title.substring(0, 50)}...` : title;
  };

  // Save current chat
  const saveCurrentChat = () => {
    if (messages.length <= 1 || !currentChatId) return;

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
      // Add new chat
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

    // Load selected chat
    setMessages(chatToLoad.messages);
    setCurrentChatId(chatId);
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, chatId);
  };

  // Delete saved chat
  const deleteSavedChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const updatedChats = savedChats.filter(chat => chat.id !== chatId);
    setSavedChats(updatedChats);

    // Start new chat if deleting current chat
    if (chatId === currentChatId) {
      handleStartNewChat();
    }

    toast({
      title: "Chat Deleted",
      description: "The chat has been removed from your history.",
    });
  };

  /**
   * Prepares messages for API call
   */
  const prepareApiMessages = (
    userMessage: Message,
    currentMessageList: Message[],
    shouldUseVisionModel: boolean
  ) => {
    const apiMessages: {
      role: MessageRole;
      content: MessageContent;
    }[] = [];

    // Add system message
    apiMessages.push({
      role: "system",
      content: "You are Grok, an AI assistant. You are helpful, creative, and provide accurate information. Answer questions in a friendly, conversational manner. IMPORTANT: Always address the user's specific question directly without generic greetings. The user has already been welcomed, so focus immediately on their query."
    });

    // Check if this is the first message (only welcome message exists)
    const isFirstMessage = currentMessageList.length === 1 && currentMessageList[0].id === "welcome";

    // Add file context if present
    if (userMessage.fileContents) {
      let fileMessage = "";

      if (userMessage.fileNames?.length === 1) {
        fileMessage = `The user has uploaded a file named "${userMessage.fileNames[0]}". The content of the file is provided below. Use this information to answer their query:\n\n${userMessage.fileContents}`;
      } else if (userMessage.fileNames && userMessage.fileNames.length > 1) {
        fileMessage = `The user has uploaded ${userMessage.fileNames.length} files named: ${userMessage.fileNames.join(", ")}. The content of these files is provided below. Use this information to answer their query:\n\n${userMessage.fileContents}`;
      }

      if (fileMessage) {
        apiMessages.push({
          role: "system",
          content: fileMessage
        });
      }
    }

    if (isFirstMessage) {
      // Add instruction for first message
      apiMessages.push({
        role: "system",
        content: "This is the user's first query. Respond directly to their question without pleasantries or introductions. They have already been greeted."
      });

      // Add user's message
      apiMessages.push({
        role: "user",
        content: userMessage.content
      });
    } else {
      // For regular conversations, add all non-welcome messages
      const historyMessages = currentMessageList
        .filter(msg => msg.id !== "welcome")
        .map(({ role, content }) => {
          // For non-vision models, convert complex content to text
          if (!shouldUseVisionModel && Array.isArray(content)) {
            // Extract text parts
            const textContent = content
              .filter(item => item.type === 'text')
              .map(item => (item as { type: 'text', text: string }).text)
              .join('\n');

            // Add note for images
            const hasImages = content.some(item => item.type === 'image_url');
            return {
              role,
              content: hasImages
                ? `${textContent}\n[This message contained images that are not shown in the history]`
                : textContent
            };
          }

          // For vision model or string content, pass as is
          return { role, content };
        });

      // Add conversation history plus new message
      apiMessages.push(...historyMessages, {
        role: "user",
        content: userMessage.content
      });
    }

    return apiMessages;
  };

  // Handle sending a message
  const handleSendMessage = async (content: string, images: string[] = [], files: ProcessedFile[] = []) => {
    if (!content.trim() && images.length === 0 && files.length === 0) return;

    // Validate API key
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your API key in the settings.",
        variant: "destructive",
      });
      return;
    }

    // Generate message ID
    const id = generateId();

    // Check if vision model should be used
    const shouldUseVisionModel = images.length > 0;

    // Create message content
    let messageContent: MessageContent = content;

    // Format content for images
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

    // Process file information
    const fileContents = files.length > 0
      ? files.map(file => `===== FILE: ${file.name} =====\n\n${file.content}\n\n`).join("\n")
      : "";

    const fileNames = files.map(file => file.name);

    // Create user message
    const userMessage: Message = {
      id,
      role: "user",
      content: messageContent,
      timestamp: new Date(),
      fileContents: fileContents || undefined,
      fileNames: fileNames.length > 0 ? fileNames : undefined,
    };

    // Store current messages
    const currentMessages = [...messages];

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Prepare API messages
      const apiMessages = prepareApiMessages(userMessage, currentMessages, shouldUseVisionModel);

      // Debug logging
      console.log("Final API messages:", JSON.stringify(apiMessages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string'
          ? (m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content)
          : 'complex content with images'
      })), null, 2));

      // Select model
      const modelToUse = shouldUseVisionModel ? "grok-2-vision-latest" : currentModel;

      // Create streaming message placeholder
      const streamingMessageId = generateId('assistant-');
      const initialStreamingMessage: Message = {
        id: streamingMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setStreamingMessage(initialStreamingMessage);
      streamingContentRef.current = "";

      // Use streaming API with API-aligned callback structure
      await xaiService.streamResponse(
        apiMessages,
        apiKey,
        {
          onChunk: (chunk) => {
            // Update content ref
            if (typeof streamingContentRef.current === 'string') {
              streamingContentRef.current += chunk;
            } else {
              streamingContentRef.current = chunk;
            }

            // Update UI
            setStreamingMessage((prev) => {
              if (!prev) return initialStreamingMessage;
              return {
                ...prev,
                content: streamingContentRef.current
              };
            });
          },
          onComplete: () => {
            // Get final content
            const finalContent = streamingContentRef.current;

            // Clear streaming state
            setStreamingMessage(null);
            setIsProcessing(false);
            streamingContentRef.current = "";

            // Create final message
            const finalMessage: Message = {
              id: generateId('assistant-'),
              role: "assistant",
              content: finalContent,
              timestamp: new Date()
            };

            // Add to messages
            setMessages(prev => [...prev, finalMessage]);

            // Handle chat ID and storage
            setTimeout(() => {
              try {
                // Generate ID for new chat
                if (currentChatId === null && currentMessages.length <= 1) {
                  const newChatId = generateId('chat-');
                  setCurrentChatId(newChatId);
                  localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, newChatId);
                }

                // Save updated messages
                storeInLocalStorage(STORAGE_KEYS.MESSAGES, [...messages, finalMessage]);

                // Update saved chats
                if (currentChatId) {
                  saveCurrentChat();
                }
              } catch (err) {
                console.error("Error in onComplete timeout handler:", err);
                // Ensure isProcessing is definitely false
                setIsProcessing(false);
              }
            }, 100);
          },
          onError: (error) => {
            console.error("Stream error:", error);
            setIsProcessing(false);
            setStreamingMessage(null);

            toast({
              title: "Error",
              description: error.message || "Failed to get response from Grok.",
              variant: "destructive",
            });
          }
        },
        {
          temperature,
          max_tokens: maxTokens,
          model: modelToUse
        }
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

    // Save current chat
    saveCurrentChat();

    // Create new chat
    const newId = generateId('chat-');
    setCurrentChatId(newId);
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, newId);

    // Add welcome message
    addWelcomeMessage();
  };

  // Context value
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