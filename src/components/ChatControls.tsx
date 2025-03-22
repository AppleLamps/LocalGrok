import React from 'react';
import ChatInput from './ChatInput';
import { useChatContext } from '@/contexts/ChatContext';
import { ProcessedFile } from './FileUploader';

/**
 * ChatControls component for handling user input and submission
 */
const ChatControls: React.FC = () => {
  const { handleSendMessage, isProcessing, updateMessageWithImage } = useChatContext();

  // Define a handler that accepts files
  const handleSendWithFiles = (
    message: string, 
    images: string[], 
    files: ProcessedFile[], 
    isBotGenerated?: boolean, 
    isImageRequest?: boolean,
    customMessageId?: string,
    isGeneratingImage?: boolean,
    imagePrompt?: string
  ) => {
    handleSendMessage(message, images, files, isBotGenerated, isImageRequest, customMessageId, isGeneratingImage, imagePrompt);
  };

  return (
    <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
      <ChatInput 
        onSendMessage={handleSendWithFiles} 
        onUpdateMessageWithImage={updateMessageWithImage}
        isProcessing={isProcessing} 
      />
    </div>
  );
};

export default ChatControls; 