import React, { useState, useRef, useEffect } from "react";
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Check, Play, RefreshCw, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  };
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
    <div className="relative group my-4 border border-gray-600 rounded-md">
      {/* Remove debug banner */}
      
      <div className="absolute right-2 top-2 z-10 flex space-x-2">
        {/* Show play button for previewable languages */}
        {isPreviewable && (
          <button
            onClick={() => {
              if (showPreview) {
                runCode(); // Re-run the code
              } else {
                runCode(); // Run for the first time
              }
            }}
            disabled={isRunning}
            className="flex items-center justify-center h-8 w-8 rounded bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={showPreview ? "Rerun code" : "Run code"}
            title={showPreview ? "Rerun code" : "Run code"}
          >
            {isRunning ? <RefreshCw size={16} className="animate-spin" /> : (showPreview ? <RefreshCw size={16} /> : <Play size={16} />)}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center justify-center h-8 w-8 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <div className="absolute top-0 left-0 px-3 py-1 text-xs font-semibold bg-gray-800 text-gray-300 rounded-tl rounded-br">
        {language}
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={true}
        wrapLines={true}
        lineNumberStyle={{ minWidth: '2.5em', textAlign: 'right', marginRight: '1em', color: '#6e7681', userSelect: 'none' }}
        customStyle={{ 
          margin: 0, 
          padding: '2.5rem 1rem 1rem 0', 
          borderRadius: showPreview ? '0.375rem 0.375rem 0 0' : '0.375rem', 
          fontSize: '0.875rem' 
        }}
        className={cn("rounded-md", showPreview ? "rounded-b-none" : "")}
      >
        {value}
      </SyntaxHighlighter>
      
      {showPreview && (
        <div className="relative">
          <button 
            onClick={() => setShowPreview(false)} 
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
            aria-label="Close preview"
          >
            <XCircle size={16} />
          </button>
          <div 
            ref={outputRef}
            className={cn(
              "p-4 bg-gray-950 text-gray-200 rounded-b-md border-t border-gray-800 max-h-60 overflow-y-auto font-mono text-sm",
              hasError ? "border-l-2 border-l-red-500" : ""
            )}
          >
            {previewOutput.length > 0 ? (
              ['html', 'svg', 'css'].includes(language.toLowerCase()) ? (
                <div 
                  className="preview-container" 
                  dangerouslySetInnerHTML={{ __html: previewOutput.join('') }} 
                />
              ) : (
                previewOutput.map((line, index) => (
                  <div key={index} className={cn(
                    "mb-1 whitespace-pre-wrap",
                    line.startsWith("Error:") ? "text-red-400" : 
                    line.startsWith("Warning:") ? "text-yellow-400" : 
                    line.startsWith("Info:") ? "text-blue-400" : "text-green-400"
                  )}>
                    &gt; {line}
                  </div>
                ))
              )
            ) : (
              <div className="text-gray-400">Running code...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  
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
    if (typeof message.content === 'string') {
      // For text-only messages, render with original formatting
      return (
        <div className="prose dark:prose-invert prose-sm md:prose-base text-gray-800 dark:text-gray-300 max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
              h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-1" {...props} />,
              p: ({ node, ...props }) => <p className="my-3" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3" {...props} />,
              li: ({ node, ...props }) => <li className="my-1" {...props} />,
              a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
              em: ({ node, ...props }) => <em className="italic" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4" {...props} />,
              code: ({ node, inline, className, children, ...props }: CodeComponentProps) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeBlock 
                    language={match[1]} 
                    value={String(children).replace(/\n$/, '')} 
                  />
                ) : (
                  <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              table: ({ node, ...props }) => <table className="border-collapse w-full my-4" {...props} />,
              thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
              tbody: ({ node, ...props }) => <tbody {...props} />,
              tr: ({ node, ...props }) => <tr className="border-b border-gray-200 dark:border-gray-700" {...props} />,
              th: ({ node, ...props }) => <th className="text-left p-2 font-bold" {...props} />,
              td: ({ node, ...props }) => <td className="p-2" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    } else {
      // Handle array of content (text + images)
      const textContent = message.content
        .filter(item => item.type === 'text')
        .map(item => (item as {type: 'text', text: string}).text)
        .join('\n');
        
      const imageContents = message.content
        .filter(item => item.type === 'image_url' && item.image_url?.url)
        .map(item => (item as {type: 'image_url', image_url: {url: string}}).image_url.url);
      
      return (
        <>
          {/* Text content */}
          {textContent && (
            <div className="prose dark:prose-invert prose-sm md:prose-base text-gray-800 dark:text-gray-300 max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                  h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-1" {...props} />,
                  p: ({ node, ...props }) => <p className="my-3" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3" {...props} />,
                  li: ({ node, ...props }) => <li className="my-1" {...props} />,
                  a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                  em: ({ node, ...props }) => <em className="italic" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4" {...props} />,
                  code: ({ node, inline, className, children, ...props }: CodeComponentProps) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <CodeBlock 
                        language={match[1]} 
                        value={String(children).replace(/\n$/, '')} 
                      />
                    ) : (
                      <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table: ({ node, ...props }) => <table className="border-collapse w-full my-4" {...props} />,
                  thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
                  tbody: ({ node, ...props }) => <tbody {...props} />,
                  tr: ({ node, ...props }) => <tr className="border-b border-gray-200 dark:border-gray-700" {...props} />,
                  th: ({ node, ...props }) => <th className="text-left p-2 font-bold" {...props} />,
                  td: ({ node, ...props }) => <td className="p-2" {...props} />,
                }}
              >
                {textContent}
              </ReactMarkdown>
            </div>
          )}
          
          {/* Image content */}
          {imageContents.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {imageContents.map((imageSrc, index) => (
                <div key={index} className="relative">
                  <img 
                    src={imageSrc} 
                    alt={`Image ${index + 1}`} 
                    className="rounded-md border border-gray-300 dark:border-gray-700"
                    style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      );
    }
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
              {isUser ? "You" : "Grok"}
            </span>
            
            {!isUser && (
              <div className="ml-2 flex items-center">
                <span className="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-normal">
                  AI
                </span>
              </div>
            )}
            
            {/* Timestamp display */}
            <div className="ml-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock size={12} className="mr-1" />
              <span>{formatTimestamp(message.timestamp)}</span>
            </div>
          </div>
          
          {/* Render message content */}
          {renderContent()}
          
          {/* Message actions - only for assistant messages */}
          {!isUser && (
            <div className="mt-3 flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <button
                onClick={copyToClipboard}
                className="p-1 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                aria-label="Copy to clipboard"
              >
                <Copy size={16} />
                {copied && <span className="ml-1 text-xs">Copied!</span>}
              </button>
              
              <button
                onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
                className={cn(
                  "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700", 
                  feedback === 'like' 
                    ? "text-green-500 dark:text-green-400" 
                    : "hover:text-gray-700 dark:hover:text-gray-200"
                )}
                aria-label="Thumbs up"
              >
                <ThumbsUp size={16} />
              </button>
              
              <button 
                onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
                className={cn(
                  "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700", 
                  feedback === 'dislike' 
                    ? "text-red-500 dark:text-red-400" 
                    : "hover:text-gray-700 dark:hover:text-gray-200"
                )}
                aria-label="Thumbs down"
              >
                <ThumbsDown size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
