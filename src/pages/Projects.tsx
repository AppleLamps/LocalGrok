import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Bot, User, Send, Trash2, Calendar, FolderKanban, Eye, MessageSquare, BookOpen, Code, Briefcase, Lightbulb, X, CheckCircle, Save, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useProjects, Project } from '@/contexts/ProjectsContext';
import { initialMessages, SampleGPTInstructions } from '@/lib/ProjectAIInstructions';
import { xaiService } from '@/services/api';

// Interface for chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  quickReplies?: string[];
}

// Define code component props interface
interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Projects: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addProject, getProject, updateProject } = useProjects();
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem("apiKey") || "");
  const [temperature, setTemperature] = useState<number>(parseFloat(localStorage.getItem("temperature") || "0.7"));
  const [maxTokens, setMaxTokens] = useState<number>(parseInt(localStorage.getItem("maxTokens") || "8192"));
  const [currentModel, setCurrentModel] = useState<string>(localStorage.getItem("currentModel") || "grok-2-latest");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'configure'>('configure');
  const [activeRightTab, setActiveRightTab] = useState<'preview' | 'assistant'>('preview');
  const [conversationStarter, setConversationStarter] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [formStep, setFormStep] = useState<'basic' | 'instructions' | 'conversation'>('basic');
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    instructions: string;
    conversationStarters: string[];
  }>({
    name: '',
    description: '',
    instructions: '',
    conversationStarters: [],
  });

  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isEditMode = !!id;

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load project data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const project = getProject(id);
      if (project) {
        setFormData({
          name: project.name,
          description: project.description,
          instructions: project.instructions,
          conversationStarters: project.conversationStarters,
        });
      } else {
        // Project not found, navigate back to list
        navigate('/projects');
      }
    }
  }, [id, getProject, isEditMode, navigate]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Project templates
  const projectTemplates = [
    {
      id: 'coding-assistant',
      name: 'Coding Assistant',
      description: 'A specialized bot that helps with programming tasks, debugging, and code optimization.',
      instructions: 'You are an expert programming assistant. You should help users write, debug, and optimize code. Provide clear explanations with code examples when appropriate. Be knowledgeable about best practices, design patterns, and performance considerations.',
      icon: <Code size={24} className="text-sky-500" />,
      conversationStarters: [
        "Can you help me debug this function?",
        "How do I implement a binary search tree in JavaScript?",
        "What's the best way to handle authentication in a React app?"
      ],
      color: 'from-sky-400 to-blue-500'
    },
    {
      id: 'business-advisor',
      name: 'Business Advisor',
      description: 'An assistant for business strategy, marketing ideas, and entrepreneurial guidance.',
      instructions: 'You are a business consultant with expertise in strategy, marketing, and entrepreneurship. Provide actionable advice, analyze business scenarios, and help create effective plans. Be practical, forward-thinking, and grounded in business fundamentals.',
      icon: <Briefcase size={24} className="text-amber-500" />,
      conversationStarters: [
        "How can I improve my customer acquisition strategy?",
        "What are effective ways to reduce operational costs?",
        "Can you help me create a marketing plan for my new product?"
      ],
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'creative-writer',
      name: 'Creative Writer',
      description: 'A bot that assists with creative writing, story development, and content creation.',
      instructions: 'You are a creative writing assistant with a talent for storytelling, narrative development, and engaging prose. Help users develop characters, plots, and settings. Provide constructive feedback and creative suggestions to improve their writing. Be encouraging and imaginative.',
      icon: <BookOpen size={24} className="text-purple-500" />,
      conversationStarters: [
        "Help me create a compelling character for my novel",
        "I need ideas for a plot twist in my story",
        "Can you help me write a descriptive scene set in a futuristic city?"
      ],
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 'brainstorming-partner',
      name: 'Brainstorming Partner',
      description: 'An assistant that helps generate ideas, think through problems, and explore creative solutions.',
      instructions: 'You are a creative thinking partner specializing in brainstorming and idea generation. Help users explore different perspectives, generate novel ideas, and think outside the box. Encourage divergent thinking and help refine concepts. Be open-minded, encouraging, and constructively critical.',
      icon: <Lightbulb size={24} className="text-yellow-500" />,
      conversationStarters: [
        "I need fresh ideas for my upcoming presentation",
        "Help me brainstorm solutions to this design challenge",
        "What are some creative approaches to team building?"
      ],
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  // Template selection modal component
  const TemplateSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: typeof projectTemplates[0]) => void;
  }> = ({ isOpen, onClose, onSelectTemplate }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 shadow-xl animate-in fade-in-50 slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto relative">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Choose a Template</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close template modal"
            >
              <X className="text-gray-500 dark:text-gray-400" size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400"
              >
                <div className="flex items-start">
                  <div className={`rounded-lg p-3 bg-gradient-to-br ${template.color} bg-opacity-10 mr-4`}>
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-lg truncate">{template.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">{template.description}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Sample prompts:</h4>
                  <ul className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                    {template.conversationStarters.map((starter, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-300 flex items-start">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500 mt-1.5 mr-2 flex-shrink-0"></span>
                        <span className="line-clamp-1">{starter}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 text-right">
                  <button className="inline-flex items-center text-sm text-emerald-500 dark:text-emerald-400 font-medium hover:underline">
                    Use Template <ArrowRightCircle size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Apply template to form data
  const applyTemplate = (template: typeof projectTemplates[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      instructions: template.instructions,
      conversationStarters: [...template.conversationStarters]
    });
    setIsTemplateModalOpen(false);
    setHasUnsavedChanges(true);
  };

  // Basic validation
  const validateField = (name: string, value: string) => {
    let errors = { ...validationErrors };

    if (name === 'name' && !value.trim()) {
      errors.name = 'Name is required';
    } else if (name === 'name') {
      delete errors.name;
    }

    if (name === 'instructions' && value.trim().length < 10) {
      errors.instructions = 'Instructions should be more descriptive';
    } else if (name === 'instructions') {
      delete errors.instructions;
    }

    setValidationErrors(errors);
  };

  // Handle field changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
    setHasUnsavedChanges(true);
  };

  // Calculate textarea heights dynamically
  const getTextareaHeight = (text: string, minRows = 3, maxRows = 10) => {
    const lineHeight = 24; // approx line height in pixels
    const minHeight = minRows * lineHeight;
    const lines = text.split('\n').length;
    const calculatedHeight = Math.min(lines * lineHeight, maxRows * lineHeight);
    return Math.max(minHeight, calculatedHeight);
  };

  // Load draft from localStorage if in create mode
  useEffect(() => {
    if (!isEditMode) {
      const savedDraft = localStorage.getItem('project_draft');
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setFormData(parsedDraft);
          console.log('Loaded project draft from localStorage');
        } catch (error) {
          console.error('Failed to parse project draft:', error);
        }
      }
    }
  }, [isEditMode]);

  // Autosave draft to localStorage
  useEffect(() => {
    if (!isEditMode) {
      const autosaveTimerId = setTimeout(() => {
        if (hasUnsavedChanges) {
          setAutosaveStatus('saving');
          localStorage.setItem('project_draft', JSON.stringify(formData));
          setTimeout(() => {
            setAutosaveStatus('saved');
            setTimeout(() => {
              setAutosaveStatus('idle');
            }, 2000);
          }, 500);
        }
      }, 2000);

      return () => clearTimeout(autosaveTimerId);
    }
  }, [formData, isEditMode, hasUnsavedChanges]);

  // Clear draft on successful submission
  const clearDraft = () => {
    localStorage.removeItem('project_draft');
  };

  // Advance to next step
  const goToNextStep = () => {
    if (formStep === 'basic') {
      setFormStep('instructions');
    } else if (formStep === 'instructions') {
      setFormStep('conversation');
    }
  };

  // Go back to previous step
  const goToPrevStep = () => {
    if (formStep === 'conversation') {
      setFormStep('instructions');
    } else if (formStep === 'instructions') {
      setFormStep('basic');
    }
  };

  // Handle adding conversation starters
  const handleAddConversationStarter = () => {
    if (conversationStarter.trim()) {
      setFormData(prev => ({
        ...prev,
        conversationStarters: [...prev.conversationStarters, conversationStarter.trim()]
      }));
      setConversationStarter('');
      setHasUnsavedChanges(true);
    }
  };

  // Handle removing conversation starters
  const handleRemoveConversationStarter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conversationStarters: prev.conversationStarters.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate all fields first
    let hasErrors = false;
    let newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      hasErrors = true;
    }

    if (formData.instructions.trim().length < 10) {
      newErrors.instructions = 'Instructions should be more descriptive';
      hasErrors = true;
    }

    setValidationErrors(newErrors);

    if (hasErrors) {
      // Scroll to the section with errors
      if (newErrors.name) {
        setFormStep('basic');
      } else if (newErrors.instructions) {
        setFormStep('instructions');
      }
      return;
    }

    const projectData: Project = {
      id: isEditMode ? id! : crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      instructions: formData.instructions,
      conversationStarters: formData.conversationStarters,
      createdAt: isEditMode ? getProject(id!)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditMode) {
      updateProject(id!, projectData);
    } else {
      addProject(projectData);
      // Clear draft after successful creation
      clearDraft();
    }

    navigate('/projects');
  };

  // Handle quick replies
  const handleQuickReply = (reply: string) => {
    // Add the user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: reply,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsLoading(true);

    // Get instructions - ensure it's a string
    const instructions = typeof formData.instructions === 'string' && formData.instructions.trim()
      ? formData.instructions
      : "You are a helpful AI assistant that helps users create custom GPTs. Be friendly, concise, and helpful.";

    // Call the AI service to get a response
    xaiService
      .callAI({
        messages: [...chatMessages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: maxTokens,
        temperature: 0.7, // Use a moderate temperature for better responses
        projectInstructions: instructions,
        model: currentModel,
      })
      .then(response => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.choices[0].message.content,
          timestamp: new Date().toISOString(),
          quickReplies: response.quick_replies || []
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      })
      .catch(error => {
        console.error('AI service error:', error);
        // Show error message in chat
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please make sure your API key is set correctly in settings.',
          timestamp: new Date().toISOString(),
          quickReplies: ["Check settings", "Try again"]
        };
        setChatMessages(prev => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Handle sending a message 
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!chatMessage.trim() || isLoading) return;

    // Add the user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatMessage,
      timestamp: new Date().toISOString()
    };

    // Add a placeholder for the assistant's response that will be updated
    const placeholderMessage: ChatMessage = {
      role: 'assistant',
      content: '...',
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage, placeholderMessage]);
    setChatMessage('');
    setIsLoading(true);

    // Get instructions - ensure it's a string
    const instructions = typeof formData.instructions === 'string' && formData.instructions.trim()
      ? formData.instructions
      : "You are a helpful AI assistant that helps users create custom GPTs. Be friendly, concise, and helpful.";

    // Call the AI service to get a response
    xaiService
      .callAI({
        messages: [...chatMessages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: maxTokens,
        temperature: 0.7,
        projectInstructions: instructions,
        model: currentModel,
      })
      .then(response => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.choices[0].message.content,
          timestamp: new Date().toISOString(),
          quickReplies: response.quick_replies || []
        };

        // Replace the placeholder with the actual response
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = assistantMessage;
          return updated;
        });
      })
      .catch(error => {
        console.error('AI service error:', error);
        // Update the placeholder with the error message
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Sorry, I encountered an error while processing your request. Please make sure your API key is set correctly in settings.',
            timestamp: new Date().toISOString(),
            quickReplies: ["Check settings", "Try again"]
          };
          return updated;
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Track unsaved changes
  useEffect(() => {
    if (isEditMode && id) {
      const project = getProject(id);
      if (project) {
        const hasChanges =
          project.name !== formData.name ||
          project.description !== formData.description ||
          project.instructions !== formData.instructions ||
          JSON.stringify(project.conversationStarters) !== JSON.stringify(formData.conversationStarters);

        setHasUnsavedChanges(hasChanges);
      }
    } else {
      // For new projects, consider changes if any required field is filled
      setHasUnsavedChanges(
        formData.name.trim() !== '' ||
        formData.description.trim() !== '' ||
        formData.instructions.trim() !== '' ||
        formData.conversationStarters.length > 0
      );
    }
  }, [formData, isEditMode, id, getProject]);

  // Handle navigation attempts
  const handleNavigationAttempt = (destination: string) => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
      setPendingNavigation(destination);
    } else {
      navigate(destination);
    }
  };

  // Confirm navigation and discard changes
  const confirmNavigation = () => {
    setShowUnsavedChangesDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  // Cancel navigation and stay on the form
  const cancelNavigation = () => {
    setShowUnsavedChangesDialog(false);
    setPendingNavigation(null);
  };

  // Preview Card component to show how project will look
  const ProjectPreviewCard: React.FC<{ project: Partial<Project> }> = ({ project }) => {
    // Format date to readable format
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md transition-all duration-300">
        {/* Top gradient bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 p-2.5 rounded-lg mr-4 shadow-sm">
                <FolderKanban className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate max-w-[150px]" title={project.name || 'Project Name'}>
                  {project.name || 'Project Name'}
                </h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <Calendar size={14} className="mr-1.5" />
                  <span>Created {formatDate(new Date().toISOString())}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="my-4 border-t border-gray-100 dark:border-gray-700"></div>

          <div className="text-sm text-gray-600 dark:text-gray-300 h-[4.5rem] mb-3 overflow-hidden">
            <p className="line-clamp-3">{project.description || "No description provided"}</p>
          </div>

          {/* Project details */}
          <div className="mt-3 mb-5 max-h-40 overflow-y-auto">
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
                    <li className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
                      +{project.conversationStarters.length - 2} more prompts
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg shadow-sm font-medium text-sm cursor-default group"
            >
              <MessageSquare size={15} className="transition-transform group-hover:scale-110" />
              <span>Use This Bot</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if we're not in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Ctrl/Cmd + S to save project
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (formData.name.trim() && Object.keys(validationErrors).length === 0) {
          handleSubmit();
        }
      }

      // Alt + Right/Left Arrow to navigate between steps
      if (e.altKey) {
        if (e.key === 'ArrowRight' && formStep !== 'conversation') {
          e.preventDefault();
          goToNextStep();
        } else if (e.key === 'ArrowLeft' && formStep !== 'basic') {
          e.preventDefault();
          goToPrevStep();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formStep, formData, validationErrors]);

  // Keyboard shortcut helper component
  const KeyboardShortcut: React.FC<{ keys: string[], description: string }> = ({ keys, description }) => (
    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
      <span className="mr-2">{description}:</span>
      <div className="flex items-center">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="mx-1">+</span>}
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-mono text-xs">{key}</kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Detect if form has errors in current step
  const hasErrorsInCurrentStep = useMemo(() => {
    if (formStep === 'basic' && validationErrors.name) return true;
    if (formStep === 'instructions' && validationErrors.instructions) return true;
    return false;
  }, [formStep, validationErrors]);

  // Status indicator component
  const StatusIndicator: React.FC<{ status: 'idle' | 'saving' | 'saved' }> = ({ status }) => {
    if (status === 'idle') return null;

    return (
      <div className={`flex items-center text-sm ${status === 'saving' ? 'text-amber-500' : 'text-emerald-500'} animate-fade-in`}>
        {status === 'saving' ? (
          <>
            <div className="h-3 w-3 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mr-2"></div>
            <span>Saving draft...</span>
          </>
        ) : (
          <>
            <CheckCircle size={16} className="mr-2" />
            <span>Draft saved</span>
          </>
        )}
      </div>
    );
  };

  // Rendering the project creation UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => handleNavigationAttempt('/projects')}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-2"
                aria-label="Back to Projects"
              >
                <ChevronLeft className="text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Project' : 'Create New Project'}
              </h1>
              {!isEditMode && (
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="ml-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center hover:underline"
                >
                  <span>Use Template</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {!isEditMode && autosaveStatus !== 'idle' && <StatusIndicator status={autosaveStatus} />}
              <button
                onClick={() => handleNavigationAttempt('/projects')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim() || Object.keys(validationErrors).length > 0}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 ${!formData.name.trim() || Object.keys(validationErrors).length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'}`}
              >
                <Save size={16} />
                {isEditMode ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow flex flex-col">
        {/* Progress steps */}
        <div className="mb-6 sticky top-16 bg-gray-50 dark:bg-gray-900 py-3 z-20">
          <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
            <button
              className={`flex flex-col items-center ${formStep === 'basic' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setFormStep('basic')}
              type="button"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${formStep === 'basic' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                1
              </div>
              <span className="text-sm font-medium">Basics</span>
            </button>
            <div className={`h-1 flex-grow mx-2 ${formStep !== 'basic' ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <button
              className={`flex flex-col items-center ${formStep === 'instructions' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setFormStep('instructions')}
              type="button"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${formStep === 'instructions' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500' : formStep === 'conversation' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                2
              </div>
              <span className="text-sm font-medium">Instructions</span>
            </button>
            <div className={`h-1 flex-grow mx-2 ${formStep === 'conversation' ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <button
              className={`flex flex-col items-center ${formStep === 'conversation' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setFormStep('conversation')}
              type="button"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${formStep === 'conversation' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                3
              </div>
              <span className="text-sm font-medium">Conversation</span>
            </button>
          </div>
        </div>

        {/* Main content area - Modified grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
          {/* Left side: Form - Reduced width */}
          <div className="lg:col-span-6 space-y-6">
            {/* Basic Information Section - Step 1 */}
            {formStep === 'basic' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>

                {/* Templates */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start with a template (optional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto pb-2 flex-nowrap hide-scrollbar">
                    {projectTemplates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all duration-200 min-w-[200px]"
                      >
                        <div className="flex items-center mb-2">
                          <div className={`rounded-md p-2 bg-gradient-to-br ${template.color} bg-opacity-10 mr-2`}>
                            {React.cloneElement(template.icon, { size: 18 })}
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{template.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{template.description}</p>
                      </div>
                    ))}
                    <button
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 min-h-[100px] min-w-[200px]"
                    >
                      <Plus size={20} className="mb-1" />
                      <span className="text-sm">View All Templates</span>
                    </button>
                  </div>
                </div>

                {/* Name input */}
                <div className="mb-6">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="What's your GPT called?"
                    className={`w-full h-12 px-4 py-3 border ${validationErrors.name ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500'} rounded-lg shadow-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all`}
                    aria-invalid={!!validationErrors.name}
                    aria-describedby={validationErrors.name ? "name-error" : undefined}
                    required
                  />
                  {validationErrors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                {/* Description textarea with auto-expand */}
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="What does your GPT do? (Optional)"
                      rows={3}
                      style={{ minHeight: '100px', maxHeight: '200px' }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                    />
                    <div className="absolute right-4 bottom-3 text-xs text-gray-400">
                      {formData.description.length}/500
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={goToNextStep}
                    className="flex items-center px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Next: Instructions
                    <ArrowRightCircle size={16} className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Instructions Section - Step 2 */}
            {formStep === 'instructions' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instructions</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Tell your GPT how to behave, what to do, and what not to do.
                </p>

                <div className="mb-6">
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Detailed Instructions <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="instructions"
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      placeholder="Be a helpful assistant that..."
                      rows={8}
                      style={{ minHeight: '200px', maxHeight: '400px' }}
                      className={`w-full px-4 py-3 border ${validationErrors.instructions ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500'} rounded-lg shadow-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all`}
                      aria-invalid={!!validationErrors.instructions}
                      aria-describedby={validationErrors.instructions ? "instructions-error" : undefined}
                    />
                    <div className="absolute right-4 bottom-3 text-xs text-gray-400">
                      {formData.instructions.length}/4000
                    </div>
                  </div>
                  {validationErrors.instructions && (
                    <p id="instructions-error" className="mt-1 text-sm text-red-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      {validationErrors.instructions}
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={goToPrevStep}
                    className="flex items-center px-5 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    <ArrowLeftCircle size={16} className="mr-2" />
                    Back
                  </button>
                  <button
                    onClick={goToNextStep}
                    className={`flex items-center px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm ${validationErrors.instructions ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!!validationErrors.instructions}
                  >
                    Next: Conversation Starters
                    <ArrowRightCircle size={16} className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Starters Section - Step 3 */}
            {formStep === 'conversation' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversation Starters</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add example prompts to help users get started with your GPT.
                </p>

                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a conversation starter..."
                      value={conversationStarter}
                      onChange={(e) => setConversationStarter(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddConversationStarter();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddConversationStarter}
                      disabled={!conversationStarter.trim()}
                      className={`p-2 rounded-lg ${conversationStarter.trim() ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'} transition-colors`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="mt-4 max-h-[300px] overflow-y-auto pr-1">
                    {formData.conversationStarters.length > 0 ? (
                      <div className="space-y-2">
                        {formData.conversationStarters.map((starter, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between group p-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                          >
                            <span className="text-gray-700 dark:text-gray-300 pr-2">{starter}</span>
                            <button
                              onClick={() => handleRemoveConversationStarter(index)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                              aria-label="Remove conversation starter"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400">
                        <MessageSquare size={32} className="mb-2 opacity-50" />
                        <p>No conversation starters added yet</p>
                        <p className="text-xs mt-1">Add prompts to help users get started with your GPT</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={goToPrevStep}
                    className="flex items-center px-5 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    <ArrowLeftCircle size={16} className="mr-2" />
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.name.trim() || Object.keys(validationErrors).length > 0}
                    className={`flex items-center px-5 py-2 rounded-lg transition-colors shadow-sm ${!formData.name.trim() || Object.keys(validationErrors).length > 0 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'}`}
                  >
                    <Save size={16} className="mr-2" />
                    {isEditMode ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right side: Tabbed interface for Preview and AI Assistant */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveRightTab('preview')}
                  className={`px-4 py-3 font-medium text-sm flex items-center ${activeRightTab === 'preview'
                      ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                  <Eye size={16} className="mr-2" />
                  Live Preview
                </button>
                <button
                  onClick={() => setActiveRightTab('assistant')}
                  className={`px-4 py-3 font-medium text-sm flex items-center ${activeRightTab === 'assistant'
                      ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                  <Bot size={16} className="mr-2" />
                  AI Assistant
                </button>
              </div>

              {/* Content container with dynamic height */}
              <div className="p-4">
                {activeRightTab === 'preview' ? (
                  <ProjectPreviewCard project={formData} />
                ) : (
                  <div className="chat-container h-[500px] flex flex-col">
                    {/* Chat messages - taller scrollable area */}
                    <div className="flex-grow overflow-y-auto mb-4 pr-1">
                      {chatMessages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                          <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[85%]`}>
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ml-2' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-2'}`}>
                              {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`px-4 py-3 rounded-2xl chat-message ${message.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                              <ReactMarkdown
                                components={{
                                  code: ({ node, className, children, ...props }) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !(props as any).inline ? (
                                      <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto text-sm">
                                        <code className={match ? `language-${match[1]}` : ''} {...props}>
                                          {String(children).replace(/\n$/, '')}
                                        </code>
                                      </pre>
                                    ) : (
                                      <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>

                              {/* Quick replies */}
                              {message.quickReplies && message.quickReplies.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.quickReplies.map((reply, replyIndex) => (
                                    <button
                                      key={replyIndex}
                                      onClick={() => handleQuickReply(reply)}
                                      className="text-xs px-3 py-1.5 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      {reply}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input area - fixed at bottom */}
                    <form onSubmit={handleSendMessage} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Ask anything about your project..."
                        className="flex-1 py-2 px-3 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={!chatMessage.trim() || isLoading}
                        className={`ml-1 p-2 rounded-md ${chatMessage.trim() && !isLoading ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'} transition-colors`}
                      >
                        {isLoading ? (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-400 border-t-white animate-spin" />
                        ) : (
                          <Send size={16} className="transform rotate-45" />
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom bar with status information only (no keyboard shortcuts) */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4 sticky bottom-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {!isEditMode && autosaveStatus === 'idle' && hasUnsavedChanges && (
              <span className="text-xs text-gray-500 dark:text-gray-400">All changes automatically saved as draft</span>
            )}
            {!isEditMode && autosaveStatus !== 'idle' && <StatusIndicator status={autosaveStatus} />}
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={applyTemplate}
      />

      {/* Unsaved changes confirmation dialog */}
      {showUnsavedChangesDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full mx-4 p-6 shadow-xl animate-in fade-in-50 slide-in-from-bottom-10 duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unsaved Changes</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You have unsaved changes that will be lost if you leave this page. Are you sure you want to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;