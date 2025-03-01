
import React, { useState, FormEvent, useRef, useEffect } from "react";
import { Send, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatInput = ({ onSendMessage, isProcessing }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  }, [input]);

  // Handle Enter key to submit form (with shift+enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="p-4 glass-card relative max-w-4xl w-full mx-auto mt-4"
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Grok AI..."
          disabled={isProcessing}
          className={cn(
            "w-full py-3 px-4 pr-12 rounded-xl resize-none max-h-[200px] overflow-y-auto",
            "glass-input focus:outline-none",
            isProcessing && "opacity-70"
          )}
          rows={1}
        />
        
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className={cn(
            "absolute right-3 bottom-3 text-white p-1 rounded-full transition-all duration-200",
            input.trim() && !isProcessing 
              ? "text-primary hover:text-accent" 
              : "text-muted-foreground opacity-50"
          )}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
      
      {isProcessing && (
        <div className="text-xs text-muted-foreground mt-2 flex items-center animate-pulse">
          <div className="w-2 h-2 bg-primary rounded-full mr-1 animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full mr-1 animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse delay-200"></div>
          Grok is thinking...
        </div>
      )}
    </form>
  );
};

export default ChatInput;
