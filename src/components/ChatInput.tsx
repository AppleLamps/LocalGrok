import React, { useState, FormEvent, useRef, useEffect } from "react";
import { Send, Plus, X, Image as ImageIcon, Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import FileUploader, { ProcessedFile } from "./FileUploader";

interface ChatInputProps {
  onSendMessage: (message: string, images: string[], files: ProcessedFile[]) => void;
  isProcessing: boolean;
}

const ChatInput = ({ onSendMessage, isProcessing }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<{file: File, preview: string}[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if ((input.trim() || selectedImages.length > 0 || processedFiles.length > 0) && !isProcessing) {
      // Convert images to base64 strings
      const imageBase64Strings = selectedImages.map(img => img.preview);
      
      onSendMessage(input.trim(), imageBase64Strings, processedFiles);
      setInput("");
      setSelectedImages([]);
      setProcessedFiles([]);
      setShowFileUploader(false);
    }
  };

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    if (selectedImages.length + files.length > 4) {
      alert("You can only upload up to 4 images.");
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MiB
      
      if (!isValidType) {
        alert(`File "${file.name}" has an invalid format. Only JPG/JPEG and PNG are supported.`);
      }
      if (!isValidSize) {
        alert(`File "${file.name}" exceeds the maximum size of 10MiB.`);
      }
      
      return isValidType && isValidSize;
    });
    
    // Process valid files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImages(prev => [
            ...prev, 
            { file, preview: e.target!.result as string }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove selected image
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Trigger file input click
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle processed files from FileUploader
  const handleFilesProcessed = (files: ProcessedFile[]) => {
    setProcessedFiles(files);
    
    // Add a warning for PDFs with limited content
    const pdfsWithLimitedContent = files.filter(file => 
      (file.name.toLowerCase().endsWith('.pdf') && 
       (file.content.length < 300 || 
        file.content.includes("Unable to extract") || 
        file.content.includes("No text content")))
    );
    
    if (pdfsWithLimitedContent.length > 0) {
      // Auto-focus and suggest a prompt about the PDF content
      setInput(prev => prev || "What can you tell me about this document?");
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  };
  
  // Toggle file uploader visibility
  const toggleFileUploader = () => {
    setShowFileUploader(prev => !prev);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form 
        onSubmit={handleSubmit}
        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow overflow-hidden"
      >
        <div className="flex flex-col">
          {/* File uploader section */}
          {showFileUploader && (
            <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-600">
              <FileUploader 
                onFileProcess={handleFilesProcessed} 
                disabled={isProcessing}
                maxFiles={3}
              />
            </div>
          )}
          
          {/* Image preview area */}
          {selectedImages.length > 0 && (
            <div className="px-3 pt-3 flex flex-wrap gap-2">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative">
                  <img 
                    src={img.preview} 
                    alt={`Preview ${index}`} 
                    className="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-gray-800 dark:bg-gray-600 text-white rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File attachment summary */}
          {processedFiles.length > 0 && (
            <div className="px-3 pt-3">
              <div className="flex items-center p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-md">
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <span className="font-medium">{processedFiles.length} file{processedFiles.length !== 1 ? 's' : ''}</span> attached
                  
                  {/* Show a note about PDFs */}
                  {processedFiles.some(file => file.name.toLowerCase().endsWith('.pdf')) && (
                    <span className="block text-xs mt-1">
                      Note: PDF text extraction may be limited. For best results, ask specific questions about the content.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="px-3 pt-3 pb-2 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={processedFiles.length > 0 
                ? "Ask a question about the attached file(s)..." 
                : "Message Grok..."
              }
              disabled={isProcessing}
              className={cn(
                "w-full resize-none py-1 px-0 max-h-[200px] min-h-[24px]",
                "bg-transparent border-0 focus:ring-0 focus:outline-none text-base",
                "text-gray-700 dark:text-gray-200",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                isProcessing && "opacity-70"
              )}
              rows={1}
            />
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-600 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Image upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                multiple
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
              />
              <button 
                type="button"
                onClick={handleImageButtonClick}
                disabled={selectedImages.length >= 4 || isProcessing}
                className={cn(
                  "p-1.5 rounded-md",
                  "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-600",
                  (selectedImages.length >= 4 || isProcessing) && "opacity-50 cursor-not-allowed"
                )}
                title={selectedImages.length >= 4 ? "Maximum of 4 images allowed" : "Add images"}
              >
                <ImageIcon size={16} />
              </button>
              
              {/* File upload */}
              <button
                type="button"
                onClick={toggleFileUploader}
                disabled={isProcessing}
                className={cn(
                  "p-1.5 rounded-md flex items-center gap-1",
                  "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-600",
                  showFileUploader && "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
                title="Attach files (PDF, TXT, CSV, etc.)"
              >
                <Paperclip size={16} />
                {showFileUploader ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              {/* File and image counters */}
              {selectedImages.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedImages.length}/4 images
                </span>
              )}
              {processedFiles.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  {processedFiles.length} files
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Grok may produce inaccurate information
              </div>
              
              <button
                type="submit"
                disabled={(!input.trim() && selectedImages.length === 0 && processedFiles.length === 0) || isProcessing}
                className={cn(
                  "p-1.5 rounded-lg transition-colors ml-2",
                  (input.trim() || selectedImages.length > 0 || processedFiles.length > 0) && !isProcessing 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 opacity-50 cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                <Send size={16} className={(input.trim() || selectedImages.length > 0 || processedFiles.length > 0) && !isProcessing ? "rotate-0" : "rotate-45"} />
              </button>
            </div>
          </div>
        </div>
      </form>
      
      {isProcessing && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-150"></div>
          <span className="ml-1">Grok is thinking...</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
