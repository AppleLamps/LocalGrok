import React from 'react';
import ChatMessage from './ChatMessage';
import { useChatContext } from '@/contexts/ChatContext';

/**
 * ChatMessages component responsible for displaying all messages in the conversation
 * Including both completed messages and streaming message
 */
const ChatMessages = () => {
  const { 
    messages, 
    streamingMessage, 
    messagesEndRef, 
    messagesContainerRef
  } = useChatContext();

  // Combine actual messages with streaming message for display
  const displayMessages = streamingMessage 
    ? [...messages, streamingMessage]
    : messages;

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto bg-white dark:bg-gray-800"
    >
      <div className="pb-32">
        {displayMessages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        <div ref={messagesEndRef} className="h-20" />
      </div>
    </div>
  );
};

export default ChatMessages; 