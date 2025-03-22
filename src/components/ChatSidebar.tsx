import React from 'react';
import { Plus, MessageSquare, Trash2, Settings, X, Menu, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import { useChatContext } from '@/contexts/ChatContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface ChatSidebarProps {
  sidebarVisible: boolean;
  formatDate: (date: Date) => string;
  toggleSidebar: () => void;
}

/**
 * ChatSidebar component for displaying chat history and new chat button
 */
const ChatSidebar = ({ sidebarVisible, formatDate, toggleSidebar }: ChatSidebarProps) => {
  const {
    currentChatId,
    savedChats,
    handleStartNewChat,
    loadSavedChat,
    deleteSavedChat
  } = useChatContext();

  const { setSettingsOpen } = useSettings();
  const navigate = useNavigate();

  // Group chats by date for display
  const groupChatsByDate = (): Record<string, typeof savedChats> => {
    const groups: Record<string, typeof savedChats> = {};

    savedChats.sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    ).forEach(chat => {
      const dateKey = formatDate(new Date(chat.lastUpdated));
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(chat);
    });

    return groups;
  };

  const groupedChats = groupChatsByDate();

  return (
    <div className={cn(
      "h-full flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900",
      "transition-all duration-300 ease-in-out",
      !sidebarVisible && "md:opacity-0 md:w-0 md:overflow-hidden"
    )}>
      {/* New Chat Button */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={handleStartNewChat}
          className="flex items-center justify-center flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-full shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
        >
          <Plus size={16} className="mr-2" />
          New chat
        </button>
        {/* Close button - visible on all views */}
        <button
          onClick={toggleSidebar}
          className="ml-2 p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-150"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className="px-3 py-2">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center justify-start w-full px-3 py-2 text-sm rounded-md text-left group transition-colors duration-150 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FolderKanban size={16} className="mr-2" />
          <span>Projects</span>
        </button>
      </div>

      {/* Chats History - FIXED THE NESTED BUTTON ISSUE HERE */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {Object.entries(groupedChats).map(([dateGroup, chats]) => (
            <div key={dateGroup} className="space-y-1">
              <h3 className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {dateGroup}
              </h3>
              {chats.map(chat => (
                <div
                  key={`chat-${chat.id}-${chat.lastUpdated.toString()}`}
                  onClick={() => loadSavedChat(chat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      loadSavedChat(chat.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md text-left group transition-colors duration-150",
                    currentChatId === chat.id
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <MessageSquare size={16} />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent's onClick
                      deleteSavedChat(chat.id, e);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-opacity duration-200"
                    aria-label="Delete chat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom of sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Mobile toggle button - for small screens only when sidebar is closed */}
      {!sidebarVisible && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 left-4 z-50 p-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-200 ease-in-out md:hidden transform hover:scale-105"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatSidebar;
