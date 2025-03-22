import React, { useState, useEffect } from 'react';
import { Plus, Search, FolderKanban, ChevronLeft, LayoutGrid, List, Trash2, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '@/contexts/ProjectsContext';
import ProjectCard from '@/components/ProjectCard';

const ProjectsList: React.FC = () => {
  const { projects, deleteProject } = useProjects();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'updated'>('updated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortDirection === 'asc'
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleSortChange = (newSortBy: 'name' | 'updated') => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const handleNewProject = () => {
    navigate('/projects/create');
  };

  const handleEditProject = (projectId: string) => {
    navigate(`/projects/edit/${projectId}`);
  };

  const handleDeleteProject = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id: string) => {
    deleteProject(id);
    setShowDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top navigation bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-2">
                <ChevronLeft className="text-gray-600 dark:text-gray-300" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Projects</h1>
            </div>
            <button
              onClick={handleNewProject}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-md shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
            >
              <Plus size={16} className="mr-2" />
              {!isMobile && "New Project"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and View Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-16 bg-gray-50 dark:bg-gray-900 py-3 z-10">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors"
              aria-label="Search projects"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* Sort Controls */}
            <div className="relative">
              <select
                className="pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                value={`${sortBy}-${sortDirection}`}
                onChange={(e) => {
                  const [newSortBy, newSortDirection] = e.target.value.split('-') as ['name' | 'updated', 'asc' | 'desc'];
                  setSortBy(newSortBy);
                  setSortDirection(newSortDirection);
                }}
                aria-label="Sort projects"
              >
                <option value="updated-desc">Recently Updated</option>
                <option value="updated-asc">Oldest Updated</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors`}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors`}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        <div className="min-h-[60vh] pb-16">
          {sortedProjects.length > 0 ? (
            <div
              className={viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col space-y-4"
              }
            >
              {sortedProjects.map(project => (
                <div key={project.id} className="relative group">
                  <ProjectCard
                    project={project}
                    onEdit={() => handleEditProject(project.id)}
                    onDelete={() => handleDeleteProject(project.id)}
                  />

                  {/* Delete confirmation overlay */}
                  {showDeleteConfirm === project.id && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-6 z-20 animate-in fade-in-50 shadow-xl">
                      <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete this project?</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs">
                        This action cannot be undone. All associated data will be permanently removed.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => cancelDelete()}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => confirmDelete(project.id)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                    <FolderKanban className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No projects yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">Create your first project to get started building custom bots for your specific needs</p>
                  <button
                    onClick={handleNewProject}
                    className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
                  >
                    <Plus size={18} className="mr-2" />
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No matching projects</h3>
                  <p className="text-gray-500 dark:text-gray-400">Try a different search term or create a new project</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating action button for mobile */}
        {isMobile && sortedProjects.length > 0 && (
          <button
            onClick={handleNewProject}
            className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-full shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 z-30"
            aria-label="New Project"
          >
            <Plus size={24} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;