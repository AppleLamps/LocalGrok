import React, { useState, useEffect } from 'react';
import { FileDown, Sparkles, ChevronDown, Menu, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { useChatContext } from '@/contexts/ChatContext';
import html2pdf from 'html2pdf.js';

interface ChatHeaderProps {
  toggleSidebar: () => void;
}

// Type definition for custom bot
interface CustomBot {
  name: string;
  description: string;
  instructions: string;
}

/**
 * ChatHeader component for the top navigation bar with model selection
 */
const ChatHeader = ({ toggleSidebar }: ChatHeaderProps) => {
  const { apiKey } = useSettings();
  const { messages, currentChatId, savedChats } = useChatContext();
  const [isExporting, setIsExporting] = useState(false);
  const [activeCustomBot, setActiveCustomBot] = useState<CustomBot | null>(null);

  // Check if there's an active custom bot on component mount and when messages change
  useEffect(() => {
    const checkForCustomBot = () => {
      const customBotString = sessionStorage.getItem('activeCustomBot');
      if (customBotString) {
        try {
          const botData = JSON.parse(customBotString);
          setActiveCustomBot(botData);
        } catch (error) {
          console.error('Failed to parse custom bot data:', error);
          setActiveCustomBot(null);
        }
      } else {
        setActiveCustomBot(null);
      }
    };
    
    checkForCustomBot();
  }, [messages]); // Re-check when messages change

  // Get chat title for the current chat
  const getChatTitle = () => {
    if (!currentChatId) return "Untitled Chat";
    
    const currentChat = savedChats.find(chat => chat.id === currentChatId);
    return currentChat ? currentChat.title : "Untitled Chat";
  };

  // Function to export chat as PDF
  const exportChatAsPdf = async () => {
    if (isExporting || messages.length === 0) return;
    
    try {
      setIsExporting(true);
      
      // Create a temporary div to render the chat content
      const tempDiv = document.createElement('div');
      tempDiv.className = 'pdf-export';
      
      // Add some styling to the PDF
      tempDiv.innerHTML = `
        <style>
          .pdf-export {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .pdf-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .pdf-header h1 {
            margin-bottom: 5px;
          }
          .pdf-header p {
            color: #666;
            margin-top: 0;
          }
          .message {
            margin-bottom: 20px;
            padding: 10px;
            border-radius: 5px;
          }
          .user-message {
            background-color: #f0f4f8;
          }
          .assistant-message {
            background-color: #f9f9f9;
          }
          .message-role {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .message-content {
            white-space: pre-wrap;
          }
          .system-message {
            display: none;
          }
        </style>
        <div class="pdf-header">
          <h1>${getChatTitle()}</h1>
          <p>Exported on ${new Date().toLocaleString()}</p>
        </div>
      `;
      
      // Add messages to the temp div
      messages.forEach(message => {
        if (message.role === 'system') return; // Skip system messages
        
        const messageContent = typeof message.content === 'string' 
          ? message.content 
          : message.content
              .filter(item => item.type === 'text')
              .map(item => item.text)
              .join('\n');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;
        
        messageDiv.innerHTML = `
          <div class="message-role">${message.role === 'user' ? 'You' : 'Assistant'}</div>
          <div class="message-content">${messageContent}</div>
        `;
        
        tempDiv.appendChild(messageDiv);
      });
      
      // Append temp div to document temporarily
      document.body.appendChild(tempDiv);
      
      // Configure pdf options
      const options = {
        margin: 10,
        filename: `${getChatTitle().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate and download PDF
      await html2pdf().set(options).from(tempDiv).save();
      
      // Remove temp div
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error exporting chat to PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 py-2 px-4 flex items-center justify-between">
      {/* Sidebar menu toggle - visible on all screen sizes */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Active Bot Indicator */}
      <div className="flex-1 flex justify-center items-center">
        {activeCustomBot ? (
          <div className="flex items-center px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
            <Bot size={16} className="mr-2" />
            <span>Active Bot: {activeCustomBot.name}</span>
          </div>
        ) : (
          <div className="flex items-center px-3 py-1 text-gray-500 dark:text-gray-400 text-sm">
            <Bot size={16} className="mr-2" />
            <span>Standard Assistant</span>
          </div>
        )}
      </div>

      {/* Model indicator */}
      <div className="relative">
        <div className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-200 py-1 px-3 rounded-md border border-gray-200 dark:border-gray-700">
          <Sparkles size={16} className="text-green-500 mr-2" />
          <span>Grok-2</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Export PDF button */}
        <button 
          onClick={exportChatAsPdf}
          disabled={isExporting || messages.length === 0}
          className={cn(
            "p-2 rounded-md flex items-center justify-center",
            (isExporting || messages.length === 0) 
              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed" 
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          title={messages.length === 0 ? "No messages to export" : "Export chat as PDF"}
        >
          <FileDown size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader; 