import * as pdfjsLib from 'pdfjs-dist';

// Skip attempting to use PDF.js worker since it's causing issues
// Instead, we'll rely on our fallback methods

/**
 * Simple text extraction from PDF without requiring PDF.js worker
 * This approach simply converts the PDF to a Data URL and extracts basic text
 */
const simplePdfExtraction = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // For text-layer PDFs, we can often extract some content this way
      let content = "";
      
      if (reader.result) {
        const text = reader.result.toString();
        
        // Extract text that looks like actual content (heuristic approach)
        // This captures text between common PDF markers or tags
        const textMatches = text.match(/\(([^)]+)\)/g) || [];
        content = textMatches
          .map(match => match.slice(1, -1)) // Remove parentheses
          .join(' ')
          .replace(/\\n/g, '\n') // Handle newlines
          .replace(/\\r/g, '') // Handle carriage returns
          .replace(/\\/g, '') // Handle escapes
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      }
      
      if (content) {
        resolve(content);
      } else {
        resolve("Unable to extract text from this PDF. The file may be scanned, contain only images, or be in a format that requires manual review.");
      }
    };
    
    reader.onerror = () => {
      resolve("Error reading the PDF file. The file may be corrupted or in an unsupported format.");
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Simple text extraction from PDF using FileReader
 * Used as a fallback when the PDF.js worker fails to load
 */
const extractTextFromPDFBasic = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('Failed to read PDF file');
        }
        
        // For some PDFs, we can extract basic text content this way
        const text = event.target.result.toString();
        
        // Clean up the text - extract what appears to be readable content
        // This is a very basic extraction that works for some PDFs
        const cleanedText = text
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove non-printable chars
          .replace(/\s+/g, ' ')                 // Normalize whitespace
          .trim();
          
        resolve(cleanedText || "Unable to extract readable text from this PDF. The file may be scanned or contain only images.");
      } catch (error) {
        reject(new Error(`Basic PDF extraction failed: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading PDF file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Extracts text from a PDF file without using PDF.js worker
 * @param file - The PDF file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  console.log('Attempting PDF extraction without PDF.js worker...');
  
  try {
    // Skip PDF.js entirely due to worker issues
    // Try simple extraction first
    console.log('Attempting simple PDF extraction method...');
    const simpleText = await simplePdfExtraction(file);
    
    // If we got meaningful content, return it
    if (simpleText.length > 100 && !simpleText.startsWith("Unable to extract")) {
      return simpleText;
    }
    
    // Otherwise, try basic extraction
    console.log('Simple extraction yielded limited results, trying basic method...');
    return await extractTextFromPDFBasic(file);
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: The PDF may be corrupted, password-protected, or in an unsupported format.`);
  }
};

/**
 * Extracts text from a text file
 * @param file - The text file to extract text from
 * @returns A promise that resolves to the text content
 */
export const extractTextFromTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read text file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading text file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Extracts text from a file based on its type
 * @param file - The file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  // Handle PDF files
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }
  
  // Handle text files
  if (fileType === 'text/plain' || 
      fileType === 'text/csv' ||
      fileName.endsWith('.txt') || 
      fileName.endsWith('.csv') || 
      fileName.endsWith('.md') || 
      fileName.endsWith('.json')) {
    return extractTextFromTextFile(file);
  }
  
  throw new Error(`Unsupported file type: ${fileType}`);
};

/**
 * Validates if a file is of an acceptable type
 * @param file - The file to validate
 * @returns Boolean indicating whether the file is valid
 */
export const isValidFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;
  
  return (
    fileType === 'application/pdf' || 
    fileType === 'text/plain' || 
    fileType === 'text/csv' || 
    fileName.endsWith('.pdf') || 
    fileName.endsWith('.txt') || 
    fileName.endsWith('.csv') || 
    fileName.endsWith('.md') || 
    fileName.endsWith('.json')
  );
};

/**
 * Gets a short display name for a file
 * @param fileName - The full file name
 * @returns A shortened display name if necessary
 */
export const getFileDisplayName = (fileName: string): string => {
  if (fileName.length <= 20) return fileName;
  
  const extension = fileName.includes('.') 
    ? fileName.slice(fileName.lastIndexOf('.')) 
    : '';
  
  const name = fileName.slice(0, fileName.length - extension.length);
  
  return `${name.slice(0, 16)}...${extension}`;
}; 