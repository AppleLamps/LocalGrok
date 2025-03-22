import React, { useState, useRef, useEffect } from "react";
<<<<<<< HEAD
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Check, Play, RefreshCw, XCircle, Clock, RotateCw, Image } from "lucide-react";
=======
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Check, Play, RefreshCw, XCircle, Clock, RotateCw } from "lucide-react";
>>>>>>> 112dabca2295b5eb3f9d6c79200bf4cebb65b263
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Custom hook to get the active bot name
const useCustomBotName = () => {
  const [customBotName, setCustomBotName] = useState<string | null>(null);
  
  useEffect(() => {
    const checkForCustomBot = () => {
      const customBotString = sessionStorage.getItem('activeCustomBot');
      if (customBotString) {
        try {
          const botData = JSON.parse(customBotString);
          setCustomBotName(botData.name);
        } catch (error) {
          console.error('Failed to parse custom bot data:', error);
          setCustomBotName(null);
        }
      } else {
        setCustomBotName(null);
      }
    };
    
    checkForCustomBot();
    
    // Check again when session storage changes
    window.addEventListener('storage', checkForCustomBot);
    return () => {
      window.removeEventListener('storage', checkForCustomBot);
    };
  }, []);
  
  return customBotName;
};

interface ChatMessageProps {
  message: {
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
    fileContents?: string; // File contents for file-based messages
    fileNames?: string[]; // File names for file-based messages
    isGeneratingImage?: boolean; // Flag for generating image state
    imagePrompt?: string; // The original image prompt
  };
  onRegenerate?: () => void;
}

// Define a more generic code component props interface
interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewOutput, setPreviewOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  
  // Define which languages can be previewed
  const previewableLanguages = ['javascript', 'js', 'typescript', 'ts', 'html', 'svg', 'css'];
  const isPreviewable = previewableLanguages.includes(language.toLowerCase());
  
  // Effect to scroll to bottom of output when new content is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [previewOutput]);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const runCode = () => {
    setIsRunning(true);
    setHasError(false);
    setPreviewOutput([]);
    
    const languageType = language.toLowerCase();
    
    // Handle HTML and SVG
    if (['html', 'svg'].includes(languageType)) {
      try {
        // Create a safe preview of HTML content
        setPreviewOutput([`<div class="html-preview">${value}</div>`]);
        setShowPreview(true);
      } catch (error) {
        setHasError(true);
        setPreviewOutput([`Rendering error: ${error instanceof Error ? error.message : String(error)}`]);
      } finally {
        setIsRunning(false);
      }
      return;
    }
    
    // Handle CSS
    if (languageType === 'css') {
      try {
        // Show CSS preview with a sample div
        const sampleHTML = `
          <div class="css-preview">
            <style>${value}</style>
            <div class="sample-element">Sample Element with Applied CSS</div>
            <div class="sample-element-alt">Alternative Element</div>
          </div>
        `;
        setPreviewOutput([sampleHTML]);
        setShowPreview(true);
      } catch (error) {
        setHasError(true);
        setPreviewOutput([`Rendering error: ${error instanceof Error ? error.message : String(error)}`]);
      } finally {
        setIsRunning(false);
      }
      return;
    }
    
    // Handle JavaScript/TypeScript
    if (['javascript', 'js', 'typescript', 'ts'].includes(languageType)) {
      // Create a sandbox to run the code
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;
      
      const output: string[] = [];
      
      // Override console methods to capture output
      console.log = (...args) => {
        output.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };
      
      console.error = (...args) => {
        output.push(`Error: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')}`);
      };
      
      console.warn = (...args) => {
        output.push(`Warning: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')}`);
      };
      
      console.info = (...args) => {
        output.push(`Info: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')}`);
      };
      
      try {
        // Execute the JavaScript code
        const result = new Function(value)();
        
        // If the code returns a value, add it to output
        if (result !== undefined) {
          output.push(`Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
        }
        
        // If no output was generated, show a message
        if (output.length === 0) {
          output.push("Code executed successfully (no output)");
        }
        
        setPreviewOutput(output);
        setShowPreview(true);
      } catch (error) {
        setHasError(true);
        setPreviewOutput([`Execution error: ${error instanceof Error ? error.message : String(error)}`]);
        setShowPreview(true);
      } finally {
        // Restore original console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
        setIsRunning(false);
      }
      return;
    }
    
    // For any other languages we don't yet support
    setPreviewOutput(["Preview not available for this language yet"]);
    setShowPreview(true);
    setIsRunning(false);
  };
  
  return (
    <div className="relative rounded-md overflow-hidden my-4 border border-gray-300 dark:border-gray-700">
      <div className="flex items-center justify-between py-1 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
        <span className="font-mono">{language}</span>
        <div className="flex items-center space-x-1">
          {isPreviewable && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              <Play size={14} className={showPreview ? "text-green-500" : ""} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0 }}
      >
        {value}
      </SyntaxHighlighter>
      
      {/* Preview section (if enabled) */}
      {showPreview && (
        <div className="border-t border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between py-1 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
            <span>Output</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Run code again"
              >
                <RefreshCw size={14} className={isRunning ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Close preview"
              >
                <XCircle size={14} />
              </button>
            </div>
          </div>
          
          <div 
            ref={outputRef}
            className="bg-black text-white p-3 font-mono text-sm overflow-auto max-h-[300px]"
            style={{ maxHeight: '300px' }}
          >
            {isRunning ? (
              <div className="text-gray-400">Running code...</div>
            ) : previewOutput.length > 0 ? (
              previewOutput.map((output, i) => (
                <div 
                  key={i} 
                  className={hasError && i === previewOutput.length - 1 ? "text-red-400" : ""}
                  dangerouslySetInnerHTML={{ __html: output }}
                />
              ))
            ) : (
              <div className="text-gray-400">No output</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatMessage = ({ message, onRegenerate }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
<<<<<<< HEAD
  const customBotName = useCustomBotName();
=======
>>>>>>> 112dabca2295b5eb3f9d6c79200bf4cebb65b263
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    if (!(timestamp instanceof Date) && typeof timestamp !== 'string') {
      return '';
    }
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format: HH:MM AM/PM
    return date.toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const copyToClipboard = () => {
    const textContent = typeof message.content === 'string' 
      ? message.content 
      : message.content
         .filter(item => item.type === 'text')
         .map(item => (item as {type: 'text', text: string}).text)
         .join('\n');
    
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Render message content
  const renderContent = () => {
    // Extract content based on type
    let contentToRender = "";
    let imageUrls: string[] = [];
    
    // Handle complex content structure that might include images
    if (typeof message.content === 'string') {
      contentToRender = message.content;
    } else if (Array.isArray(message.content)) {
      // For complex content structure (used in vision model)
      message.content.forEach(item => {
        if (item.type === 'text' && item.text) {
          contentToRender += item.text;
        } else if (item.type === 'image_url' && item.image_url) {
          imageUrls.push(item.image_url.url);
        }
      });
    }
    
    // If message has file contents, render them
    if (message.fileContents) {
      return (
        <div>
          <div className="mb-2">{contentToRender}</div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto max-h-[400px] whitespace-pre-wrap font-mono text-sm">
            {message.fileContents}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Files: {message.fileNames?.join(', ')}
          </div>
        </div>
      );
    }
    
    // Replace any user mentions with styled spans
    const formattedContent = contentToRender.replace(
      /@([a-zA-Z0-9_]+)/g, 
      "<span class='text-blue-500 dark:text-blue-400'>@$1</span>"
    );
    
    return (
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <ReactMarkdown
          components={{
            code: ({node, inline, className, children, ...props}: CodeComponentProps) => {
              const match = /language-(\w+)/.exec(className || '');
              
              if (inline) {
                return (
                  <code className="font-mono bg-gray-100 dark:bg-gray-800 p-0.5 rounded text-sm" {...props}>
                    {String(children).replace(/\n$/, '')}
                  </code>
                );
              }
              
              const language = match ? match[1] : '';
              const value = String(children).replace(/\n$/, '');
              
              if (value.length > 5) {
                return <CodeBlock language={language || 'text'} value={value} />;
              }
              
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            // Add styles to links
            a: ({node, ...props}) => (
              <a 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 dark:text-blue-400 hover:underline" 
                {...props}
              />
            ),
          }}
        >
          {formattedContent}
        </ReactMarkdown>
        
        {/* Display image generation placeholder */}
        {message.isGeneratingImage && (
          <div className="mt-3">
            <div className="relative w-full h-0 pb-[56.25%] bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <Image size={48} className="text-gray-400 dark:text-gray-600 mb-3" />
                  <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded-md mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500 dark:text-gray-400">
                  Generating image of {message.imagePrompt ? <strong>{message.imagePrompt}</strong> : ''}...
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Display images if any */}
        {imageUrls.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-3">
            {imageUrls.map((url, index) => (
              <div key={`img-${index}`} className="relative">
                <img 
                  src={url} 
                  alt={`Generated image ${index + 1}`} 
                  className="rounded-md w-full object-contain bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="w-full py-4 md:py-6 px-4 md:px-6">
      <div className={cn(
        "max-w-3xl mx-auto",
        isUser ? "flex justify-end" : "flex items-start space-x-4 md:space-x-6"
      )}>
        {/* For AI messages, show avatar on left */}
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-500">
              <Bot size={18} className="text-white" />
            </div>
          </div>
        )}
        
        {/* Message content */}
        <div className={cn(
          "min-w-0",
          isUser ? "max-w-[85%]" : "flex-1"
        )}>
          {/* Message header */}
          <div className={cn(
            "flex items-center mb-1 text-sm font-medium",
            isUser && "justify-end" // Right align user message header
          )}>
            {/* For user messages, show avatar inline with name */}
            {isUser && (
              <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-sm bg-gray-300 dark:bg-gray-600">
                <User size={14} className="text-gray-800 dark:text-gray-200" />
              </div>
            )}
            
            <span className="text-gray-900 dark:text-gray-100">
              {isUser ? "You" : (customBotName || "Grok")}
            </span>
            
            {/* Timestamp display */}
            <div className="ml-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock size={12} className="mr-1" />
              <span>{formatTimestamp(message.timestamp)}</span>
            </div>
          </div>

          {/* File content notice */}
          {message.fileContents && (
            <div className="mb-4 p-2 rounded-md bg-gray-100 dark:bg-gray-600/40 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                {message.fileNames && message.fileNames.length > 0 ? (
                  <span>Files: {message.fileNames.join(', ')}</span>
                ) : (
                  <span>File content attached</span>
                )}
              </div>
            </div>
          )}
          
          {/* Render message content */}
          {renderContent()}
          
          {/* Message actions */}
          <div className="mt-3 flex items-center gap-2 text-gray-500 dark:text-gray-400">
<<<<<<< HEAD
            <button 
=======
            <button
>>>>>>> 112dabca2295b5eb3f9d6c79200bf4cebb65b263
              onClick={copyToClipboard}
              className="p-1 hover:text-gray-700 dark:hover:text-gray-200 rounded"
              aria-label="Copy to clipboard"
            >
              <Copy size={16} />
              {copied && <span className="ml-1 text-xs">Copied!</span>}
            </button>
            
            {/* Regenerate button - only for assistant messages */}
            {!isUser && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                aria-label="Regenerate response"
              >
                <RotateCw size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
