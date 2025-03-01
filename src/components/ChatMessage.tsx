
import React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  };
  isLatest?: boolean;
}

const ChatMessage = ({ message, isLatest }: ChatMessageProps) => {
  const isUser = message.role === "user";
  
  return (
    <div 
      className={cn(
        "flex gap-4 p-4 rounded-xl animate-in w-full max-w-4xl mx-auto mb-4",
        isUser ? "text-white" : "glass-card"
      )}
    >
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
        isUser ? "bg-accent text-background" : "bg-primary text-white"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center">
          <h3 className="font-medium">
            {isUser ? "You" : "Grok AI"}
          </h3>
          <time className="ml-auto text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        <div className="whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
