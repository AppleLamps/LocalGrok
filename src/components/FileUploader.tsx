import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Loader2, X, FileText, File as FileIcon, AlertCircle, Upload } from 'lucide-react';

// Add this type definition at the top of your file
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Utility function to combine class names conditionally
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// File type definitions
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'text/markdown': ['.md'],
  'application/json': ['.json']
};

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Utility functions for file processing
const isValidFileType = (file: File): boolean => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension) return false;

  const validExtensions = ['.pdf', '.txt', '.csv', '.md', '.json'];
  return validExtensions.includes(`.${fileExtension}`);
};

const getFileDisplayName = (fileName: string): string => {
  // If filename is too long, truncate it
  if (fileName.length > 25) {
    const extension = fileName.split('.').pop();
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    return `${baseName.substring(0, 15)}...${extension ? `.${extension}` : ''}`;
  }
  return fileName;
};

// Utility function to extract text from a file
const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // For PDFs, use PDF.js
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Load PDF.js from CDN if not already loaded
      const loadPdfJs = async () => {
        if (window.pdfjsLib) return window.pdfjsLib;

        return new Promise<typeof window.pdfjsLib>((resolveLib, rejectLib) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
          script.onload = () => {
            // Set worker path
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            resolveLib(window.pdfjsLib);
          };
          script.onerror = () => rejectLib(new Error('Failed to load PDF.js library'));
          document.head.appendChild(script);
        });
      };

      const processPdf = async () => {
        try {
          // Load PDF.js if needed
          const pdfjs = await loadPdfJs();

          // Read the file as an ArrayBuffer
          const fileReader = new FileReader();
          fileReader.onload = async function () {
            try {
              // Load the PDF document
              const arrayBuffer = fileReader.result as ArrayBuffer;
              const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

              // Extract text from each page
              let fullText = "";
              const totalPages = pdf.numPages;

              for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Join all the text items together
                const pageText = textContent.items
                  .map(item => 'str' in item ? item.str : '')
                  .join(' ');

                fullText += `--- Page ${i} ---\n${pageText}\n\n`;
              }

              if (fullText.trim().length < 100) {
                resolve("No text content could be extracted from this PDF. It may be a scanned document or contain only images.");
              } else {
                resolve(fullText);
              }
            } catch (error) {
              console.error("PDF processing error:", error);
              reject(new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`));
            }
          };

          fileReader.onerror = () => reject(new Error('Failed to read PDF file'));
          fileReader.readAsArrayBuffer(file);
        } catch (error) {
          console.error("PDF.js loading error:", error);
          reject(new Error('Failed to load PDF processing library'));
        }
      };

      processPdf();
      return;
    }

    // For text files - unchanged from original
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Type definitions
export interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

interface FileUploaderProps {
  onFileProcess: (files: ProcessedFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: Record<string, string[]>;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileProcess,
  disabled = false,
  maxFiles = 5,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFileTypes = ACCEPTED_FILE_TYPES,
  className = ""
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [fileRejections, setFileRejections] = useState<FileRejection[]>([]);

  // Generate a unique ID for files
  const generateFileId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      setFileRejections(rejectedFiles);

      // Clear rejections after 5 seconds
      setTimeout(() => {
        setFileRejections([]);
      }, 5000);
    }

    // Check if we would exceed max files
    if (files.length + acceptedFiles.length > maxFiles) {
      setProcessingError(`You can only upload up to ${maxFiles} files at a time.`);
      return;
    }

    // Filter out invalid file types and sizes
    const validFiles = acceptedFiles.filter(file => {
      // Check file type
      const isValid = isValidFileType(file);

      // Check file size
      const isValidSize = file.size <= maxFileSize;

      if (!isValid || !isValidSize) {
        if (!isValid) {
          setProcessingError(`File "${file.name}" has an unsupported format. Only PDF, TXT, CSV, MD, and JSON files are supported.`);
        } else if (!isValidSize) {
          setProcessingError(`File "${file.name}" exceeds the maximum file size of ${formatFileSize(maxFileSize)}.`);
        }
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Reset error if we have valid files
    if (processingError) {
      setProcessingError(null);
    }

    // Add the valid files to state
    setFiles(prev => [...prev, ...validFiles]);

    // Process the files
    await processFiles(validFiles);
  }, [files, maxFiles, maxFileSize, processingError]);

  // Setup react-dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open
  } = useDropzone({
    onDrop,
    disabled: disabled || processing || files.length >= maxFiles,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    noClick: false,
    noKeyboard: false
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
            id: generateFileId(),
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

      // Handle failures and warnings
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
    if (processingError) {
      setProcessingError(null);
    }
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

  // Get the number of remaining files that can be uploaded
  const remainingFiles = maxFiles - files.length;

  return (
    <div className={cn("w-full", className)} aria-label="File uploader">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-all",
          "flex flex-col items-center justify-center text-center",
          isDragActive && isDragAccept && "border-green-500 bg-green-50 dark:bg-green-900/10",
          isDragActive && isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/10",
          !isDragActive && "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600",
          (disabled || processing || files.length >= maxFiles) && "opacity-50 cursor-not-allowed",
          !disabled && files.length < maxFiles && !processing && "cursor-pointer",
          "h-28"
        )}
        aria-disabled={disabled || processing || files.length >= maxFiles}
        role="button"
        tabIndex={0}
      >
        <input {...getInputProps()} aria-label="File input" />

        {isDragActive ? (
          isDragAccept ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">Drop the files here ...</p>
          ) : (
            <p className="text-sm text-red-500">Some files are not supported!</p>
          )
        ) : (
          <>
            <Upload size={20} className="mb-2 text-gray-500 dark:text-gray-400" />
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: PDF, TXT, CSV, MD, JSON (max {formatFileSize(maxFileSize)})
            </p>
            {files.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {files.length} / {maxFiles} files
              </p>
            )}
          </>
        )}
      </div>

      {/* File rejection errors */}
      {fileRejections.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">The following files couldn't be added:</p>
            <ul className="list-disc list-inside text-xs mt-1">
              {fileRejections.map(({ file, errors }) => (
                <li key={file.name}>
                  {file.name} - {errors[0].message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Processing error message */}
      {processingError && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{processingError}</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3" aria-live="polite">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded files</h3>
            <button
              onClick={clearFiles}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={processing}
              aria-label="Clear all files"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2" role="list">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
                role="listitem"
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  {file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? (
                    <FileText size={16} className="text-red-500 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <FileIcon size={16} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
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
                  aria-label={`Remove file: ${file.name}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {processing && (
        <div className="mt-3" aria-live="polite">
          <div className="flex items-center">
            <Loader2 size={16} className="animate-spin mr-2 text-blue-500" aria-hidden="true" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Processing files... ({processingProgress}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2" role="progressbar" aria-valuenow={processingProgress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Helpful message when max files is reached */}
      {files.length >= maxFiles && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          Maximum number of files reached. Remove some files to upload more.
        </p>
      )}
    </div>
  );
};

export default FileUploader;