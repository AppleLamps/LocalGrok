import React, { useState, useRef, useEffect } from 'react';
import { FolderKanban, MoreVertical, Edit, Trash2, MessageSquare, Calendar } from 'lucide-react';
import { Project } from '@/contexts/ProjectsContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    }
  };

  // Navigate to chat with the custom bot instructions
  const handleUseBot = () => {
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('currentChatId');
    sessionStorage.removeItem('activeCustomBot');

    localStorage.setItem('currentCustomBot', JSON.stringify(project));
    navigate('/');
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div
      className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
    >
      {/* Top gradient bar */}
      <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <div className={`bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 p-2.5 rounded-lg mr-4 shadow-sm transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}>
              <FolderKanban className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate max-w-[200px]" title={project.name}>{project.name}</h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <Calendar size={14} className="mr-1.5" />
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              aria-label="Project menu"
              onClick={toggleMenu}
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 w-56 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in-50 slide-in-from-top-5 duration-200">
                <button 
                  onClick={() => {
                    onEdit(project);
                    setShowMenu(false);
                  }} 
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <Edit size={14} className="mr-2" />
                  <span>Edit</span>
                </button>
                <div className="h-px my-1 bg-gray-200 dark:bg-gray-700" />
                <button 
                  onClick={() => {
                    onDelete(project.id);
                    setShowMenu(false);
                  }} 
                  className="flex w-full items-center px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <Trash2 size={14} className="mr-2" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="my-4 border-t border-gray-100 dark:border-gray-700"></div>

        <div className="text-sm text-gray-600 dark:text-gray-300 overflow-hidden mb-3" style={{ minHeight: '4.5rem', maxHeight: '4.5rem' }}>
          <p className="line-clamp-3">{project.description || "No description provided"}</p>
        </div>

        {/* Project details */}
        <div className="mt-3 mb-5 max-h-32 overflow-y-auto">
          {project.conversationStarters && project.conversationStarters.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 mt-2">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Sample prompts:</h4>
              <ul className="space-y-1.5">
                {project.conversationStarters.slice(0, 2).map((starter, index) => (
                  <li key={index} className="text-xs text-gray-600 dark:text-gray-300 flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500 mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="line-clamp-1">{starter}</span>
                  </li>
                ))}
                {project.conversationStarters.length > 2 && (
                  <li className="text-xs text-emerald-500 dark:text-emerald-400 mt-1 cursor-pointer hover:underline">
                    +{project.conversationStarters.length - 2} more prompts
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUseBot}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm font-medium text-sm group"
            aria-label={`Use ${project.name} bot`}
          >
            <MessageSquare size={15} className="transition-transform group-hover:scale-110" />
            <span>Use This Bot</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;