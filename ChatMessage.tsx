import React, { useState, useRef, useEffect } from "react";
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Check, Play, RefreshCw, XCircle, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Utility function for merging class names
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =========================================
// Type Definitions
// =========================================

/**
 * Represents a single chat message with metadata
 */
interface ChatMessageData {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | ContentPart[];
  timestamp: Date;
}

/**
 * Represents a part of the message content (text or image)
 */
interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail: "high" | "low" | "auto";
  };
}

/**
 * Props for the ChatMessage component
 */
interface ChatMessageProps {
  message: ChatMessageData;
}

/**
 * Props for the markdown code component
 */
interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Props for the CodeBlock component
 */
interface CodeBlockProps {
  language: string;
  value: string;
}

/**
 * Props for a message action button
 */
interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  isActive?: boolean;
  label: string;
  className?: string;
  activeClass?: string;
}

/**
 * Languages that can be previewed in the code block
 */
const PREVIEWABLE_LANGUAGES = ['javascript', 'js', 'typescript', 'ts', 'html', 'svg', 'css'];

// =========================================
// Utility Functions
// =========================================

/**
 * Formats a timestamp for display
 * @param timestamp - The timestamp to format
 * @returns A formatted time string (HH:MM AM/PM)
 */
const formatTimestamp = (timestamp: Date): string => {
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

/**
 * Extracts text content from a message
 * @param content - The message content (string or ContentPart[])
 * @returns The extracted text content
 */
const extractTextContent = (content: string | ContentPart[]): string => {
  if (typeof content === 'string') {
    return content;
  }
  
  return content
    .filter(item => item.type === 'text')
    .map(item => (item as {type: 'text', text: string}).text)
    .join('\n');
};

/**
 * Extracts image URLs from a message
 * @param content - The message content (ContentPart[])
 * @returns Array of image URLs
 */
const extractImageUrls = (content: ContentPart[]): string[] => {
  return content
    .filter(item => item.type === 'image_url' && item.image_url?.url)
    .map(item => (item as {type: 'image_url', image_url: {url: string}}).image_url.url);
};

// =========================================
// Component: ActionButton
// =========================================

/**
 * Reusable action button component
 */
const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  icon, 
  activeIcon, 
  isActive = false, 
  label, 
  className = "", 
  activeClass = "" 
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        className,
        isActive && activeClass
      )}
      aria-label={label}
      title={label}
    >
      {isActive && activeIcon ? activeIcon : icon}
    </button>
  );
};

// =========================================
// Component: CodeBlock
// =========================================

/**
 * Renders a syntax-highlighted code block with execution capabilities
 */
const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewOutput, setPreviewOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  
  // Check if the language is previewable
  const isPreviewable = PREVIEWABLE_LANGUAGES.includes(language.toLowerCase());
  
  // Effect to scroll to bottom of output when new content is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [previewOutput]);
  
  /**
   * Copies code to clipboard
   */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  /**
   * Runs the code and displays the output
   */
  const runCode = () => {
    setIsRunning(true);
    setHasError(false);
    setPreviewOutput([]);
    
    const languageType = language.toLowerCase();
    
    // Handle different language types
    if (['html', 'svg'].includes(languageType)) {
      executeHtmlCode();
    } else if (languageType === 'css') {
      executeCssCode();
    } else if (['javascript', 'js', 'typescript', 'ts'].includes(languageType)) {
      executeJavaScriptCode();
    } else {
      // Unsupported language
      setPreviewOutput(["Preview not available for this language yet"]);
      setShowPreview(true);
      setIsRunning(false);
    }
  };
  
  /**
   * Executes HTML or SVG code
   */
  const executeHtmlCode = () => {
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
  };
  
  /**
   * Executes CSS code
   */
  const executeCssCode = () => {
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
  };
  
  /**
   * Executes JavaScript or TypeScript code
   */
  const executeJavaScriptCode = () => {
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
  };
  
  /**
   * Renders the preview output based on language type
   */
  const renderPreviewOutput = () => {
    if (previewOutput.length === 0) {
      return <div className="text-gray-400">Running code...</div>;
    }
    
    if (['html', 'svg', 'css'].includes(language.toLowerCase())) {
      return (
        <div 
          className="preview-container" 
          dangerouslySetInnerHTML={{ __html: previewOutput.join('') }} 
        />
      );
    }
    
    return previewOutput.map((line, index) => (
      <div key={index} className={cn(
        "mb-1 whitespace-pre-wrap",
        line.startsWith("Error:") ? "text-red-400" : 
        line.startsWith("Warning:") ? "text-yellow-400" : 
        line.startsWith("Info:") ? "text-blue-400" : "text-green-400"
      )}>
        &gt; {line}
      </div>
    ));
  };
  
  return (
    <div className="relative group my-4 border dark:border-gray-700 border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div className="absolute right-2 top-2 z-10 flex space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
        {/* Run/Rerun button for previewable languages */}
        {isPreviewable && (
          <ActionButton
            onClick={() => runCode()}
            icon={showPreview ? <RefreshCw size={16} /> : <Play size={16} />}
            activeIcon={<RefreshCw size={16} className="animate-spin" />}
            isActive={isRunning}
            label={showPreview ? "Rerun code" : "Run code"}
            className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600/90 hover:bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 backdrop-blur-sm transition-colors"
          />
        )}
        
        {/* Copy button */}
        <ActionButton
          onClick={handleCopy}
          icon={<Copy size={16} />}
          activeIcon={<Check size={16} />}
          isActive={copied}
          label="Copy code"
          className="flex items-center justify-center h-8 w-8 rounded-md bg-gray-700/80 hover:bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 backdrop-blur-sm transition-colors"
        />
      </div>
      
      {/* Language indicator */}
      <div className="absolute top-0 left-0 px-3 py-1 text-xs font-medium bg-gray-800/90 text-gray-300 rounded-br backdrop-blur-sm">
        {language}
      </div>
      
      {/* Code syntax highlighter */}
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={true}
        wrapLines={true}
        lineNumberStyle={{ 
          minWidth: '2.5em', 
          textAlign: 'right', 
          marginRight: '1em', 
          color: '#6e7681', 
          userSelect: 'none',
          borderRight: '1px solid #343434',
          paddingRight: '0.5em'
        }}
        customStyle={{ 
          margin: 0, 
          padding: '2.5rem 1rem 1rem 0', 
          borderRadius: showPreview ? '0.5rem 0.5rem 0 0' : '0.5rem', 
          fontSize: '0.875rem',
          backgroundColor: '#0d1117' // GitHub dark theme background
        }}
        className={cn("rounded-lg", showPreview ? "rounded-b-none" : "")}
      >
        {value}
      </SyntaxHighlighter>
      
      {/* Preview output area */}
      {showPreview && (
        <div className="relative transition-all">
          <ActionButton 
            onClick={() => setShowPreview(false)}
            icon={<XCircle size={16} />}
            label="Close preview"
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-200 transition-colors"
          />
          <div 
            ref={outputRef}
            className={cn(
              "p-4 bg-gray-950 text-gray-200 rounded-b-lg border-t border-gray-800 max-h-60 overflow-y-auto font-mono text-sm",
              hasError ? "border-l-2 border-l-red-500" : ""
            )}
          >
            {renderPreviewOutput()}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================
// Component: MessageHeader
// =========================================

/**
 * Renders the header of a chat message
 */
interface MessageHeaderProps {
  isUser: boolean;
  timestamp: Date;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ isUser, timestamp }) => {
  return (
    <div className={cn(
      "flex items-center mb-1 text-sm font-medium",
      isUser && "justify-end" // Right align user message header
    )}>
      {/* User avatar */}
      {isUser && (
        <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-sm bg-gray-300 dark:bg-gray-600">
          <User size={14} className="text-gray-800 dark:text-gray-200" />
        </div>
      )}
      
      {/* Name */}
      <span className="text-gray-900 dark:text-gray-100">
        {isUser ? "You" : "Grok"}
      </span>
      
      {/* AI badge */}
      {!isUser && (
        <div className="ml-2 flex items-center">
          <span className="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-normal">
            AI
          </span>
        </div>
      )}
      
      {/* Timestamp */}
      <div className="ml-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
        <Clock size={12} className="mr-1" />
        <span>{formatTimestamp(timestamp)}</span>
      </div>
    </div>
  );
};

// =========================================
// Component: MessageContent
// =========================================

/**
 * Renders the content of a chat message with markdown support
 */
interface MessageContentProps {
  content: string | ContentPart[];
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  /**
   * Custom markdown components configuration
   */
  const markdownComponents = {
    h1: (props: any) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
    h2: (props: any) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
    h3: (props: any) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
    h4: (props: any) => <h4 className="text-base font-bold mt-3 mb-1" {...props} />,
    p: (props: any) => <p className="my-3" {...props} />,
    ul: (props: any) => <ul className="list-disc pl-6 my-3" {...props} />,
    ol: (props: any) => <ol className="list-decimal pl-6 my-3" {...props} />,
    li: (props: any) => <li className="my-1" {...props} />,
    a: (props: any) => <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />,
    strong: (props: any) => <strong className="font-bold" {...props} />,
    em: (props: any) => <em className="italic" {...props} />,
    blockquote: (props: any) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4" {...props} />,
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock 
          language={match[1]} 
          value={String(children).replace(/\n$/, '')} 
        />
      ) : (
        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-sm rounded-md font-mono border border-gray-200 dark:border-gray-700" {...props}>
          {children}
        </code>
      );
    },
    table: (props: any) => <table className="border-collapse w-full my-4 rounded-lg overflow-hidden" {...props} />,
    thead: (props: any) => <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" {...props} />,
    tbody: (props: any) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props} />,
    tr: (props: any) => <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" {...props} />,
    th: (props: any) => <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300" {...props} />,
    td: (props: any) => <td className="p-3" {...props} />,
  };
  
  if (typeof content === 'string') {
    // For text-only messages
    return (
      <div className="prose dark:prose-invert prose-sm md:prose-base text-gray-800 dark:text-gray-300 max-w-none math-content">
        <ReactMarkdown 
          components={markdownComponents}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  } else {
    // Handle array of content (text + images)
    const textContent = extractTextContent(content);
    const imageUrls = extractImageUrls(content);
    
    return (
      <>
        {/* Text content */}
        {textContent && (
          <div className="prose dark:prose-invert prose-sm md:prose-base text-gray-800 dark:text-gray-300 max-w-none math-content">
            <ReactMarkdown 
              components={markdownComponents}
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {textContent}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Image content */}
        {imageUrls.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {imageUrls.map((imageSrc, index) => (
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

// =========================================
// Component: MessageActions
// =========================================

/**
 * Renders action buttons for assistant messages
 */
interface MessageActionsProps {
  content: string | ContentPart[];
}

const MessageActions: React.FC<MessageActionsProps> = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  
  /**
   * Copies message content to clipboard
   */
  const copyToClipboard = () => {
    const textContent = extractTextContent(content);
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="mt-3 flex items-center gap-2 text-gray-500 dark:text-gray-400">
      {/* Copy button */}
      <ActionButton
        onClick={copyToClipboard}
        icon={<Copy size={16} />}
        label="Copy to clipboard"
        className="p-1 hover:text-gray-700 dark:hover:text-gray-200 rounded"
      />
      {copied && <span className="ml-1 text-xs">Copied!</span>}
      
      {/* Thumbs up button */}
      <ActionButton
        onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
        icon={<ThumbsUp size={16} />}
        isActive={feedback === 'like'}
        label="Thumbs up"
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
        activeClass="text-green-500 dark:text-green-400"
      />
      
      {/* Thumbs down button */}
      <ActionButton
        onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
        icon={<ThumbsDown size={16} />}
        isActive={feedback === 'dislike'}
        label="Thumbs down"
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
        activeClass="text-red-500 dark:text-red-400"
      />
    </div>
  );
};

// =========================================
// Main Component: ChatMessage
// =========================================

/**
 * Main component that renders a chat message
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  
  return (
    <div className="w-full py-4 md:py-6 px-4 md:px-6">
      <div className={cn(
        "max-w-3xl mx-auto",
        isUser ? "flex justify-end" : "flex items-start space-x-4 md:space-x-6"
      )}>
        {/* AI avatar */}
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-500">
              <Bot size={18} className="text-white" />
            </div>
          </div>
        )}
        
        {/* Message content container */}
        <div className={cn(
          "min-w-0",
          isUser ? "max-w-[85%]" : "flex-1"
        )}>
          {/* Message header */}
          <MessageHeader isUser={isUser} timestamp={message.timestamp} />
          
          {/* Message content */}
          <MessageContent content={message.content} />
          
          {/* Message actions - only for assistant messages */}
          {!isUser && <MessageActions content={message.content} />}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 