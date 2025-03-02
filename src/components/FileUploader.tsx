import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, X, FileText, File as FileIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractTextFromFile, isValidFileType, getFileDisplayName } from '@/lib/fileProcessing';

interface FileUploaderProps {
  onFileProcess: (files: ProcessedFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export interface ProcessedFile {
  name: string;
  size: number;
  type: string;
  content: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileProcess, 
  disabled = false,
  maxFiles = 5
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  
  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if we would exceed max files
    if (files.length + acceptedFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files at a time.`);
      return;
    }
    
    // Filter out invalid file types
    const validFiles = acceptedFiles.filter(file => {
      const isValid = isValidFileType(file);
      if (!isValid) {
        alert(`File "${file.name}" has an unsupported format. Only PDF, TXT, CSV, MD, and JSON files are supported.`);
      }
      return isValid;
    });
    
    if (validFiles.length === 0) return;
    
    // Add the valid files to state
    setFiles(prev => [...prev, ...validFiles]);
    
    // Process the files
    processFiles(validFiles);
  }, [files, maxFiles]);
  
  // Setup react-dropzone
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject 
  } = useDropzone({ 
    onDrop,
    disabled: disabled || processing || files.length >= maxFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/markdown': ['.md'],
      'application/json': ['.json']
    }
  });
  
  // Process files and extract content
  const processFiles = async (filesToProcess: File[]) => {
    setProcessing(true);
    setProcessingError(null);
    setProcessingProgress(0);
    
    const processedFiles: ProcessedFile[] = [];
    const failedFiles: string[] = [];
    let pdfWarning = false;
    
    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        
        // Update progress
        setProcessingProgress(Math.round(((i) / filesToProcess.length) * 100));
        
        try {
          // Extract text from file
          const content = await extractTextFromFile(file);
          
          // Check if we got minimal content from a PDF
          if (isPdf && (content.length < 100 || 
              content.includes("Unable to extract text") ||
              content.includes("No text content could be extracted"))) {
            pdfWarning = true;
          }
          
          processedFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            content
          });
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          failedFiles.push(file.name);
          
          // Continue processing other files even if one fails
          continue;
        }
        
        // Update progress again
        setProcessingProgress(Math.round(((i + 1) / filesToProcess.length) * 100));
      }
      
      // If any files failed, show a warning
      if (failedFiles.length > 0) {
        // Check if all failed files are PDFs
        const allPdfs = failedFiles.every(name => 
          name.toLowerCase().endsWith('.pdf')
        );
        
        if (allPdfs) {
          setProcessingError(
            `PDF processing issue: We couldn't process ${failedFiles.length === 1 ? 'this PDF file' : 'these PDF files'}: ${failedFiles.join(', ')}. ` + 
            `Try uploading a text file instead, or a PDF with selectable text rather than scanned content.`
          );
        } else {
          setProcessingError(
            `Warning: Failed to process ${failedFiles.length} file(s): ${failedFiles.join(', ')}. ` + 
            `These files were not included. Please make sure they contain text content and are not corrupted.`
          );
        }
        
        // Remove failed files from the file list
        setFiles(prev => prev.filter(file => !failedFiles.includes(file.name)));
      } else if (pdfWarning && processedFiles.length > 0) {
        // Show a warning if PDF processing was limited but not failed
        setProcessingError(
          `Note: Limited text was extracted from one or more PDF files. ` +
          `If you don't get adequate responses about the PDF content, consider converting it to a text file first.`
        );
      }
      
      // If any files were processed, call the callback
      if (processedFiles.length > 0) {
        onFileProcess(processedFiles);
      } else if (filesToProcess.length > 0) {
        // If we attempted to process files but none succeeded
        if (filesToProcess.every(file => file.name.toLowerCase().endsWith('.pdf'))) {
          setProcessingError(
            `PDF extraction failed: We couldn't extract text from your PDF file(s). ` +
            `This often happens with scanned documents or PDFs that contain only images. ` +
            `Try uploading a PDF with selectable text, or convert your content to a text file first.`
          );
        } else {
          setProcessingError(`Error: Could not process any of the selected files. Please try different files.`);
        }
      }
    } catch (error) {
      console.error('Error processing files:', error);
      
      // Provide a more specific error message for PDF.js worker issues
      if (error instanceof Error && error.message.includes('worker')) {
        setProcessingError(
          `PDF processing error: There was a problem loading the PDF processing library. ` +
          `This may be due to network issues or browser restrictions. ` +
          `Try refreshing the page or using a text file instead.`
        );
      } else {
        setProcessingError(`Error processing files: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setProcessing(false);
      setProcessingProgress(100);
    }
  };
  
  // Remove a file
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    setProcessingError(null);
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <div className="w-full">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all",
          "flex flex-col items-center justify-center text-center",
          isDragActive && isDragAccept && "border-green-500 bg-green-50 dark:bg-green-900/10",
          isDragActive && isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/10",
          !isDragActive && "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600",
          (disabled || processing || files.length >= maxFiles) && "opacity-50 cursor-not-allowed",
          "h-28"
        )}
      >
        <input {...getInputProps()} />
        
        {isDragActive ? (
          isDragAccept ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">Drop the files here ...</p>
          ) : (
            <p className="text-sm text-red-500">Some files are not supported!</p>
          )
        ) : (
          <>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: PDF, TXT, CSV, MD, JSON
            </p>
            {files.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {files.length} / {maxFiles} files
              </p>
            )}
          </>
        )}
      </div>
      
      {/* Error message */}
      {processingError && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{processingError}</span>
        </div>
      )}
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded files</h3>
            <button 
              onClick={clearFiles}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={processing}
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  {file.type === 'application/pdf' ? (
                    <FileText size={16} className="text-red-500 flex-shrink-0" />
                  ) : (
                    <FileIcon size={16} className="text-blue-500 flex-shrink-0" />
                  )}
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={file.name}>
                      {getFileDisplayName(file.name)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  disabled={processing}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Processing indicator */}
      {processing && (
        <div className="mt-3">
          <div className="flex items-center">
            <Loader2 size={16} className="animate-spin mr-2 text-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Processing files... ({processingProgress}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 