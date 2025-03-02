import React from 'react';
import ChatInput from './ChatInput';
import { useChatContext } from '@/contexts/ChatContext';
import { ProcessedFile } from './FileUploader';

/**
 * ChatControls component for handling user input and submission
 */
const ChatControls = () => {
  const { handleSendMessage, isProcessing } = useChatContext();

  // Define a handler that accepts files
  const handleSendWithFiles = (message: string, images: string[], files: ProcessedFile[]) => {
    handleSendMessage(message, images, files);
  };

  return (
    <div className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2">
      <ChatInput 
        onSendMessage={handleSendWithFiles} 
        isProcessing={isProcessing} 
      />
    </div>
  );
};

export default ChatControls; 