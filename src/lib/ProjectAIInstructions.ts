// Types for type safety and better developer experience
export type Role = 'system' | 'assistant' | 'user';
export type MessageType = {
  role: Role;
  content: string;
  timestamp: string;
};

export type ConversationState = {
  stage: 'initial' | 'purpose' | 'capabilities' | 'persona' | 'knowledge' | 'review' | 'complete';
  gptConfig: GPTConfig;
  userPreferences: {
    preferredTone?: string;
    expertiseLevel?: 'beginner' | 'intermediate' | 'advanced';
    targetAudience?: string[];
  };
  selectedTemplates: string[];
  conversationHistory: MessageType[];
};

export type GPTConfig = {
  name: string;
  purpose: string;
  instructions: string;
  capabilities: string[];
  limitations: string[];
  persona: {
    tone: string;
    traits: string[];
  };
  knowledgeFiles: string[];
  conversationStarters: string[];
  actions: {
    name: string;
    description: string;
    parameters: any[];
  }[];
};

/**
 * Enhanced instructions for the AI assistant in the Projects Configure tab
 */
export const ProjectAIInstructions = `
You are an AI assistant specialized in helping users create custom GPTs. Your goal is to guide users through designing, configuring, and testing their own specialized GPT models.

CORE RESPONSIBILITIES:
1. Understand user needs and translate them into effective GPT configurations
2. Ask targeted questions to clarify the GPT's purpose, capabilities, and limitations
3. Provide tailored instruction templates that users can adapt
4. Guide users through all aspects of GPT configuration (instructions, knowledge files, actions, etc.)
5. Help users test and refine their GPT concept before finalization

USER GUIDANCE WORKFLOW:
1. Purpose Definition: Establish what problem the GPT will solve and for whom
2. Capability Identification: Determine specific tasks and questions the GPT should handle
3. Persona Development: Define the GPT's tone, personality, and communication style
4. Knowledge Requirements: Identify specialized information or documents to enhance capabilities
5. Interaction Design: Create effective conversation starters and user prompts
6. Boundary Setting: Establish appropriate limitations and ethical guidelines
7. Testing & Refinement: Simulate interactions to validate effectiveness

GPT CATEGORIES AND SPECIALIZATIONS:
- Creative Tools: Writing assistants, design aids, idea generators, storytellers
- Technical Specialists: Code reviewers, data analysts, system architects, domain experts
- Educational Resources: Subject tutors, concept explainers, study aids, learning coaches
- Productivity Enhancers: Task managers, summarizers, researchers, decision support
- Entertainment Systems: Game masters, roleplay partners, quiz creators, content curators

CONFIGURATION COMPONENTS TO ADDRESS:
- Instructions: Craft precise directives that shape GPT behavior and responses
- Knowledge Base: Recommend file types and content that enhance expertise (PDFs, text, code, spreadsheets)
- Conversation Design: Develop prompts that showcase capabilities and guide user interaction
- Actions: Explain API integrations and when they would enhance functionality
- Limitations: Define intentional boundaries that improve reliability and focus

BEST PRACTICES TO EMPHASIZE:
- Specificity: Detailed instructions outperform vague directives
- Exemplification: Concrete examples clarify expected behavior
- Boundary Definition: Clear limitations improve consistency and reliability
- Progressive Complexity: Start simple and add sophistication incrementally
- Iterative Testing: Regular validation with diverse prompts ensures quality

Throughout the process, maintain an adaptive approach based on user feedback. Respond to changing requirements and help users translate their vision into an effective GPT configuration.

When suggesting content for the GPT's configuration, write in the second person (addressing the future users of their GPT) rather than addressing the current user directly.
`;

/**
 * Enhanced sample GPT instructions with more detail and customizability
 */
export const SampleGPTInstructions = {
  codeHelper: {
    name: "Code Helper",
    template: `You are a coding assistant with expertise in multiple programming languages including JavaScript, Python, Java, C++, and Ruby.

PURPOSE:
Help users write, debug, optimize, and understand code across different programming paradigms and environments.

CAPABILITIES:
- Write efficient, well-commented code based on user requirements
- Debug existing code by identifying logical errors, syntax issues, and edge cases
- Refactor code to improve performance, readability, and maintainability
- Explain programming concepts with practical examples
- Guide users through implementing algorithms and design patterns
- Provide language-specific best practices and idioms

COMMUNICATION STYLE:
- Be clear and precise in explanations, avoiding unnecessary jargon
- Include comprehensive comments in all code examples
- Point out potential issues or alternative approaches
- Adapt explanation depth based on the user's indicated experience level
- Use analogies to explain complex concepts when helpful

LIMITATIONS:
- Do not execute code or predict exact runtime behavior that depends on specific environments
- Acknowledge when a question falls outside your expertise
- Avoid making definitive statements about rapidly evolving frameworks or libraries

EXPECTED INTERACTIONS:
- When showing code, always include comprehensive comments that explain what the code does
- If you detect errors in a user's code, point them out gently and suggest fixes
- When multiple approaches exist, briefly mention alternatives with their pros and cons
- Prefer modern, efficient approaches but respect the user's specified language or framework preferences
- Always consider security implications in your code recommendations`,
    customizationOptions: {
      languages: ["JavaScript", "Python", "Java", "C++", "Ruby", "Go", "PHP", "C#", "Rust", "Swift"],
      specializations: ["Web Development", "Data Science", "Mobile Apps", "Game Development", "DevOps", "Security"]
    }
  },

  creativeWriter: {
    name: "Creative Writer",
    template: `You are a creative writing assistant who helps users develop compelling written content.

PURPOSE:
Aid users in crafting engaging stories, articles, scripts, poems, and other creative written works.

CAPABILITIES:
- Generate original creative content in various styles and genres
- Provide constructive feedback on user-written material
- Help overcome writer's block with prompts and suggestions
- Assist with character development, plot structure, and world-building
- Refine existing content for clarity, impact, and flow

COMMUNICATION STYLE:
- Be supportive and encouraging while providing honest feedback
- Use vivid, expressive language when generating creative content
- Tailor your tone to match the user's intended genre and style
- Balance creativity with practical writing advice

LIMITATIONS:
- Avoid generating content that promotes harmful stereotypes
- Do not write complete academic essays or assignments for students
- Decline requests for plagiarized content or copyright infringement

EXPECTED INTERACTIONS:
- Ask clarifying questions to better understand the user's vision before providing substantial content
- When asked to generate content, create original, engaging material that matches the requested style and tone
- Provide thoughtful feedback that balances encouragement with constructive criticism
- If a user is struggling with direction, offer multiple creative options to inspire them
- For longer works, focus on quality over quantity, offering to continue developing pieces in subsequent interactions`,
    customizationOptions: {
      genres: ["Fiction", "Poetry", "Screenplay", "Blog", "Marketing", "Technical"],
      tones: ["Formal", "Casual", "Humorous", "Dramatic", "Inspirational", "Educational"]
    }
  },

  dataAnalyst: {
    name: "Data Analyst",
    template: `You are a data analysis expert who helps users interpret data and derive meaningful insights.

PURPOSE:
Guide users through the process of analyzing data, visualizing results, and making data-driven decisions.

CAPABILITIES:
- Explain statistical concepts and methodologies in accessible terms
- Suggest appropriate analytical approaches based on user goals
- Help interpret results and identify patterns or trends
- Recommend effective data visualization techniques
- Guide users through common data analysis pitfalls

COMMUNICATION STYLE:
- Translate technical concepts into clear, understandable language
- Use precise terminology when necessary, with explanations
- Present balanced perspectives that acknowledge data limitations
- Illustrate concepts with relevant examples

LIMITATIONS:
- Cannot process or analyze actual data files directly
- Do not make definitive predictions without acknowledging uncertainty
- Avoid overstating conclusions beyond what the data supports

EXPECTED INTERACTIONS:
- When analyzing described data, consider multiple perspectives and highlight limitations
- Help users formulate better questions that their data can actually answer
- Explain the difference between correlation and causation when relevant
- Suggest appropriate statistical tests based on the user's research questions
- Recommend visualization types that best communicate the specific insights being sought`,
    customizationOptions: {
      domains: ["Business", "Scientific Research", "Social Sciences", "Marketing", "Finance", "Healthcare"],
      techniques: ["Descriptive Statistics", "Hypothesis Testing", "Regression Analysis", "Machine Learning", "Time Series Analysis"]
    }
  },

  languageTutor: {
    name: "Language Tutor",
    template: `You are a language learning assistant specializing in teaching {{LANGUAGE}}.

PURPOSE:
Help users learn {{LANGUAGE}} effectively through conversation practice, grammar explanations, and vocabulary building.

CAPABILITIES:
- Explain grammar rules and concepts with clear examples
- Teach vocabulary with context, usage examples, and memory aids
- Engage in practice conversations at appropriate difficulty levels
- Correct language errors with helpful explanations
- Provide cultural context relevant to language usage

COMMUNICATION STYLE:
- Maintain a supportive, encouraging tone to build learner confidence
- Provide clear, concise explanations avoiding unnecessary jargon
- Adapt complexity based on the user's proficiency level
- Use both {{LANGUAGE}} and English appropriately based on context

LIMITATIONS:
- Acknowledge when certain regional dialects or extremely specialized terminology fall outside your expertise
- Do not attempt to replace formal language certification or assessment

EXPECTED INTERACTIONS:
- Assess the user's proficiency level through initial interactions and adjust accordingly
- When correcting mistakes, explain the reason for the correction rather than simply providing the correct form
- Incorporate cultural notes when they enhance understanding of language usage
- For beginners, focus on high-frequency vocabulary and basic grammatical structures
- For advanced learners, challenge them with idiomatic expressions and nuanced usage
- Suggest specific practice exercises based on areas needing improvement`,
    customizationOptions: {
      languages: ["Spanish", "French", "German", "Japanese", "Chinese", "Italian", "Russian", "Arabic", "Portuguese", "Korean"],
      focusAreas: ["Conversation", "Reading", "Writing", "Business", "Travel", "Academic"]
    }
  },

  productManager: {
    name: "Product Manager",
    template: `You are a product management assistant who helps users develop, refine, and execute product strategies.

PURPOSE:
Support users in all aspects of the product development lifecycle, from ideation to market analysis to feature prioritization.

CAPABILITIES:
- Guide product discovery and user research processes
- Help define product requirements and specifications
- Assist with roadmap planning and prioritization frameworks
- Provide templates for user stories and acceptance criteria
- Support go-to-market strategy development

COMMUNICATION STYLE:
- Balance strategic thinking with practical implementation details
- Present balanced perspectives on product decisions
- Communicate with clarity, focusing on user and business value
- Ask probing questions that challenge assumptions

LIMITATIONS:
- Cannot directly interact with product analytics tools or data
- Avoid making definitive market predictions without acknowledging uncertainty
- Do not make business-critical decisions without stakeholder input

EXPECTED INTERACTIONS:
- When discussing product ideas, help users clarify the problem being solved
- Guide users through structured thinking processes for decision-making
- Provide frameworks and templates adapted to the user's specific context
- Ask about success metrics and how they align with business objectives
- Help translate between technical and business considerations`,
    customizationOptions: {
      industries: ["Software", "Consumer Goods", "Healthcare", "Financial Services", "Education", "Manufacturing"],
      methodologies: ["Agile", "Lean", "Design Thinking", "Jobs-to-be-Done", "OKRs"]
    }
  }
};

/**
 * Initial conversation starters to engage users
 */
export const initialMessages = [
  {
    role: 'assistant' as const,
    content: "Welcome to the GPT Creator! I'll help you build a custom GPT tailored to your specific needs.",
    timestamp: new Date().toISOString()
  },
  {
    role: 'assistant' as const,
    content: "You can tell me what type of GPT you'd like to create - such as \"a creative assistant that helps generate product ideas\" or \"a coding mentor that helps debug Python code.\" What would you like to build today?",
    timestamp: new Date().toISOString()
  }
];

/**
 * Initialize a new conversation state
 */
export const initializeConversationState = (): ConversationState => {
  return {
    stage: 'initial',
    gptConfig: {
      name: '',
      purpose: '',
      instructions: '',
      capabilities: [],
      limitations: [],
      persona: {
        tone: '',
        traits: []
      },
      knowledgeFiles: [],
      conversationStarters: [],
      actions: []
    },
    userPreferences: {},
    selectedTemplates: [],
    conversationHistory: [...initialMessages]
  };
};

/**
 * Parse user intent from message content
 * @param message - User message to analyze
 * @returns Detected user intent
 */
export const parseUserIntent = (message: string): {
  intent: string;
  entities: Record<string, string>;
} => {
  const lowerMsg = message.toLowerCase();
  const entities: Record<string, string> = {};

  // Extract potential GPT name
  const nameMatch = message.match(/(?:create|make|build|design)(?:\s+a)?(?:\s+new)?\s+(?:GPT|bot|assistant|AI)(?:\s+called|named)?\s+"?([^".,!?]+)"?/i);
  if (nameMatch && nameMatch[1]) {
    entities.name = nameMatch[1].trim();
  }

  // Extract potential purpose
  const purposeMatch = message.match(/(?:that|which|who)\s+(?:can|could|would|will|should)?\s+([^.,!?]+)/i);
  if (purposeMatch && purposeMatch[1]) {
    entities.purpose = purposeMatch[1].trim();
  }

  // Match against common intents
  if (lowerMsg.match(/create|make|build|develop|design/)) {
    if (lowerMsg.match(/code|programming|developer|programmer/)) {
      return { intent: 'create_coding_assistant', entities };
    } else if (lowerMsg.match(/write|content|creative|story|blog/)) {
      return { intent: 'create_writing_assistant', entities };
    } else if (lowerMsg.match(/data|analysis|statistics|charts/)) {
      return { intent: 'create_data_analyst', entities };
    } else if (lowerMsg.match(/language|learn|teach|tutor/)) {
      return { intent: 'create_language_tutor', entities };
    } else if (lowerMsg.match(/product|feature|roadmap|manager/)) {
      return { intent: 'create_product_manager', entities };
    } else {
      return { intent: 'create_custom_gpt', entities };
    }
  } else if (lowerMsg.match(/example|sample|template/)) {
    return { intent: 'request_examples', entities };
  } else if (lowerMsg.match(/how|what|why|when|guide|help/)) {
    if (lowerMsg.match(/instruction|write/)) {
      return { intent: 'request_instruction_help', entities };
    } else if (lowerMsg.match(/capability|can it do/)) {
      return { intent: 'request_capability_info', entities };
    } else if (lowerMsg.match(/knowledge|file|upload/)) {
      return { intent: 'request_knowledge_info', entities };
    } else if (lowerMsg.match(/action|api|integration/)) {
      return { intent: 'request_action_info', entities };
    } else {
      return { intent: 'request_general_help', entities };
    }
  } else if (lowerMsg.match(/yes|sure|okay|proceed|continue|next/)) {
    return { intent: 'affirm', entities };
  } else if (lowerMsg.match(/no|not|dont|negative|skip/)) {
    return { intent: 'decline', entities };
  } else if (lowerMsg.match(/save|export|download|publish|deploy/)) {
    return { intent: 'request_export', entities };
  } else {
    return { intent: 'provide_information', entities };
  }
};

/**
 * Process the current stage of conversation and update state
 * @param currentState - Current conversation state
 * @param userMessage - Latest user message
 * @returns Updated conversation state
 */
export const processConversationStage = (
  currentState: ConversationState,
  userMessage: string
): ConversationState => {
  const newState = { ...currentState };
  const { intent, entities } = parseUserIntent(userMessage);

  // Process based on current stage and detected intent
  switch (currentState.stage) {
    case 'initial':
      if (intent.startsWith('create_')) {
        newState.stage = 'purpose';
        if (entities.name) {
          newState.gptConfig.name = entities.name;
        }
        if (entities.purpose) {
          newState.gptConfig.purpose = entities.purpose;
        }

        // Set template based on intent if applicable
        if (intent === 'create_coding_assistant') {
          newState.selectedTemplates = ['codeHelper'];
        } else if (intent === 'create_writing_assistant') {
          newState.selectedTemplates = ['creativeWriter'];
        } else if (intent === 'create_data_analyst') {
          newState.selectedTemplates = ['dataAnalyst'];
        } else if (intent === 'create_language_tutor') {
          newState.selectedTemplates = ['languageTutor'];
        } else if (intent === 'create_product_manager') {
          newState.selectedTemplates = ['productManager'];
        }
      }
      break;

    case 'purpose':
      // Refine purpose and move to capabilities stage
      if (intent === 'provide_information') {
        newState.gptConfig.purpose = userMessage;
      }
      newState.stage = 'capabilities';
      break;

    case 'capabilities':
      // Add capabilities and move to persona stage
      if (intent === 'provide_information') {
        newState.gptConfig.capabilities = extractCapabilities(userMessage);
      }
      newState.stage = 'persona';
      break;

    case 'persona':
      // Define persona and move to knowledge stage
      if (intent === 'provide_information') {
        const persona = extractPersona(userMessage);
        newState.gptConfig.persona.tone = persona.tone;
        newState.gptConfig.persona.traits = persona.traits;
      }
      newState.stage = 'knowledge';
      break;

    case 'knowledge':
      // Add knowledge requirements and move to review stage
      if (intent === 'provide_information') {
        newState.gptConfig.knowledgeFiles = extractKnowledgeRequirements(userMessage);
      }
      newState.stage = 'review';
      break;

    case 'review':
      // If user approves, move to complete stage
      if (intent === 'affirm') {
        newState.stage = 'complete';
        // Generate final instructions based on all collected information
        newState.gptConfig.instructions = generateFinalInstructions(newState.gptConfig);
      } else if (intent === 'decline') {
        // Go back to appropriate stage based on feedback
        const targetStage = identifyRevisionStage(userMessage);
        newState.stage = targetStage;
      }
      break;

    case 'complete':
      // Handle any post-completion actions
      if (intent === 'request_export') {
        // Add export functionality logic here
      }
      break;
  }

  // Update conversation history
  newState.conversationHistory.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  });

  return newState;
};

/**
 * Generate an AI response based on current conversation state
 * @param state - Current conversation state
 * @returns AI assistant response
 */
export const generateAIResponse = (state: ConversationState): string => {
  let response = '';

  // Generate responses based on conversation stage
  switch (state.stage) {
    case 'initial':
      response = "Welcome! What type of GPT would you like to create? You can describe its general purpose, and I'll guide you through the creation process.";
      break;

    case 'purpose':
      if (state.gptConfig.name) {
        response = `Great! Let's create "${state.gptConfig.name}". Please describe in detail what the primary purpose of this GPT will be. What problem will it solve or what value will it provide to users?`;
      } else {
        response = "Excellent! Please describe in detail the primary purpose of this GPT. What problem will it solve or what value will it provide to users?";
      }
      break;

    case 'capabilities':
      response = "Now, let's define what your GPT should be capable of. What specific tasks, questions, or interactions should it handle well? Please list 3-5 key capabilities.";
      break;

    case 'persona':
      response = "Let's define your GPT's communication style and personality. How should it come across to users? For example: professional and concise, friendly and conversational, educational and patient, etc.";
      break;

    case 'knowledge':
      response = "Does your GPT need any specialized knowledge? You can upload files later (like PDFs, text documents, or spreadsheets) to enhance its capabilities. What types of knowledge would be helpful?";
      break;

    case 'review':
      // Generate a summary of the GPT configuration for review
      response = `Here's a summary of the GPT you're creating:\n\n`;
      response += `**Name**: ${state.gptConfig.name || "Unnamed GPT"}\n`;
      response += `**Purpose**: ${state.gptConfig.purpose}\n\n`;
      response += `**Key Capabilities**:\n`;
      state.gptConfig.capabilities.forEach(cap => {
        response += `- ${cap}\n`;
      });
      response += `\n**Persona**: ${state.gptConfig.persona.tone}\n`;
      if (state.gptConfig.persona.traits.length > 0) {
        response += `**Traits**: ${state.gptConfig.persona.traits.join(", ")}\n\n`;
      }
      if (state.gptConfig.knowledgeFiles.length > 0) {
        response += `**Knowledge Requirements**: ${state.gptConfig.knowledgeFiles.join(", ")}\n\n`;
      }
      response += `Does this look correct? If so, I'll generate the full instructions for your GPT. If not, let me know what you'd like to change.`;
      break;

    case 'complete':
      // Generate a preview of the final instructions and next steps
      response = `Your GPT is ready! Here are the instructions that will guide its behavior:\n\n`;
      response += `\`\`\`\n${state.gptConfig.instructions}\n\`\`\`\n\n`;
      response += `You can now implement these instructions in your GPT. Would you like to export these instructions or make any final adjustments?`;
      break;

    default:
      response = "I'm here to help you create your GPT. What would you like to do next?";
  }

  // Add the response to conversation history
  state.conversationHistory.push({
    role: 'assistant',
    content: response,
    timestamp: new Date().toISOString()
  });

  return response;
};

/**
 * Extract capabilities from user message
 * @param message - User message containing capability information
 * @returns Array of extracted capabilities
 */
const extractCapabilities = (message: string): string[] => {
  // Split message by common list markers
  const lines = message.split(/\n|\.|\,/).map(line => line.trim()).filter(line => line.length > 0);

  // Filter out obvious non-capabilities (too short, questions, etc.)
  return lines
    .filter(line =>
      line.length > 10 &&
      !line.endsWith('?') &&
      !line.startsWith('I want') &&
      !line.startsWith('Can it')
    )
    .map(line => {
      // Clean up list markers
      return line.replace(/^[-*•]|\d+\.|\(\d+\)/, '').trim();
    });
};

/**
 * Extract persona information from user message
 * @param message - User message containing persona information
 * @returns Object with tone and traits
 */
const extractPersona = (message: string): { tone: string; traits: string[] } => {
  const lowerMsg = message.toLowerCase();

  // Detect common tone descriptors
  const tonePatterns = [
    { pattern: /professional|formal|business-like|corporate|serious/g, tone: 'professional and formal' },
    { pattern: /friendly|casual|conversational|approachable|warm/g, tone: 'friendly and conversational' },
    { pattern: /educational|informative|instructive|teaching|academic/g, tone: 'educational and informative' },
    { pattern: /humorous|funny|witty|comedic|light-hearted/g, tone: 'humorous and light-hearted' },
    { pattern: /empathetic|compassionate|understanding|supportive|caring/g, tone: 'empathetic and supportive' },
    { pattern: /creative|imaginative|artistic|innovative|original/g, tone: 'creative and imaginative' },
    { pattern: /technical|precise|analytical|detailed|exact/g, tone: 'technical and precise' },
    { pattern: /motivational|inspiring|encouraging|positive|uplifting/g, tone: 'motivational and encouraging' }
  ];

  // Find matching tone
  let detectedTone = '';
  let maxMatches = 0;

  for (const { pattern, tone } of tonePatterns) {
    const matches = (lowerMsg.match(pattern) || []).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedTone = tone;
    }
  }

  // Extract personality traits
  const traitKeywords = [
    'patient', 'concise', 'detailed', 'thorough', 'enthusiastic',
    'calm', 'energetic', 'thoughtful', 'diplomatic', 'direct',
    'respectful', 'authoritative', 'collaborative', 'curious',
    'practical', 'philosophical', 'strategic', 'tactical'
  ];

  const traits = traitKeywords.filter(trait => lowerMsg.includes(trait));

  // If no tone detected, use a default based on the message
  if (!detectedTone) {
    if (lowerMsg.length < 30) {
      detectedTone = 'neutral and adaptable';
    } else {
      // Use the longest sentence as the tone description
      const sentences = message.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
      const longestSentence = sentences.reduce((a, b) => a.length > b.length ? a : b, '');
      detectedTone = longestSentence;
    }
  }

  return {
    tone: detectedTone,
    traits
  };
};

/**
 * Extract knowledge requirements from user message
 * @param message - User message containing knowledge information
 * @returns Array of knowledge file types or domains
 */
const extractKnowledgeRequirements = (message: string): string[] => {
  const lowerMsg = message.toLowerCase();

  // Common file types and knowledge domains
  const fileTypes = [
    'pdf', 'csv', 'excel', 'txt', 'doc', 'text', 'json',
    'xml', 'html', 'markdown', 'code', 'api'
  ];

  const knowledgeDomains = [
    'technical', 'medical', 'legal', 'scientific', 'financial',
    'academic', 'research', 'industry', 'market', 'historical',
    'statistical', 'reference', 'documentation'
  ];

  // Extract file types
  const detectedFileTypes = fileTypes.filter(type => lowerMsg.includes(type));

  // Extract knowledge domains
  const detectedDomains = knowledgeDomains.filter(domain => lowerMsg.includes(domain));

  // If nothing specific is detected but message indicates knowledge is needed
  if (detectedFileTypes.length === 0 && detectedDomains.length === 0) {
    if (lowerMsg.includes('yes') || lowerMsg.includes('need') || lowerMsg.includes('require')) {
      const lines = message.split(/\n|\.|\,/).map(line => line.trim()).filter(line => line.length > 10);
      return lines;
    }

    // No knowledge files needed
    if (lowerMsg.includes('no') || lowerMsg.includes('not needed') || lowerMsg.includes('unnecessary')) {
      return [];
    }
  }

  return [...detectedFileTypes.map(type => `${type} files`), ...detectedDomains.map(domain => `${domain} knowledge`)];
};

/**
 * Identify which stage to revisit based on user feedback
 * @param message - User message containing revision request
 * @returns Stage to revisit
 */
const identifyRevisionStage = (message: string): 'purpose' | 'capabilities' | 'persona' | 'knowledge' | 'review' => {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.match(/purpose|goal|aim|objective|what it does/)) {
    return 'purpose';
  } else if (lowerMsg.match(/capabilities|skills|abilities|features|can do/)) {
    return 'capabilities';
  } else if (lowerMsg.match(/persona|personality|tone|style|character|voice/)) {
    return 'persona';
  } else if (lowerMsg.match(/knowledge|information|data|files|documents/)) {
    return 'knowledge';
  } else {
    return 'review';
  }
};

/**
 * Generate final instructions based on all collected information
 * @param config - Complete GPT configuration
 * @returns Formatted instruction string
 */
const generateFinalInstructions = (config: GPTConfig): string => {
  let instructions = '';

  // Add template-based content if a template was selected
  if (config.name) {
    instructions += `You are ${config.name}, an AI assistant that specializes in ${config.purpose}.\n\n`;
  } else {
    instructions += `You are an AI assistant that specializes in ${config.purpose}.\n\n`;
  }

  // Purpose section
  instructions += `PURPOSE:\n${config.purpose}\n\n`;

  // Capabilities section
  instructions += `CAPABILITIES:\n`;
  if (config.capabilities.length > 0) {
    config.capabilities.forEach(capability => {
      instructions += `- ${capability}\n`;
    });
  } else {
    instructions += `Provide expert assistance related to ${config.purpose}.\n`;
  }
  instructions += '\n';

  // Persona section
  instructions += `COMMUNICATION STYLE:\n`;
  instructions += `Communicate in a ${config.persona.tone} manner`;
  if (config.persona.traits.length > 0) {
    instructions += `, while being ${config.persona.traits.join(', ')}.`;
  } else {
    instructions += '.';
  }
  instructions += '\n\n';

  // Limitations section
  instructions += `LIMITATIONS:\n`;
  if (config.limitations.length > 0) {
    config.limitations.forEach(limitation => {
      instructions += `- ${limitation}\n`;
    });
  } else {
    instructions += `- Acknowledge when a question falls outside your expertise\n`;
    instructions += `- Prioritize accuracy over speculation\n`;
    instructions += `- Recommend expert consultation for specialized professional advice\n`;
  }
  instructions += '\n';

  // Add knowledge files section if relevant
  if (config.knowledgeFiles.length > 0) {
    instructions += `KNOWLEDGE BASE:\n`;
    instructions += `You have access to specialized knowledge including ${config.knowledgeFiles.join(', ')}.\n\n`;
  }

  // Expected interactions
  instructions += `EXPECTED INTERACTIONS:\n`;
  instructions += `- Begin by understanding the user's specific needs related to ${config.purpose}\n`;
  instructions += `- Provide clear, well-structured responses\n`;
  instructions += `- Ask clarifying questions when necessary\n`;
  instructions += `- Adapt your level of detail based on the user's expertise level\n`;

  return instructions;
};

/**
 * Save a GPT configuration
 * @param state - Current conversation state containing GPT configuration
 * @returns Success indicator and saved configuration
 */
export const saveGPTConfiguration = (state: ConversationState): {
  success: boolean;
  data?: string;
  error?: string;
} => {
  try {
    // Generate a complete configuration object
    const completeConfig = {
      ...state.gptConfig,
      instructionsComplete: state.gptConfig.instructions || generateFinalInstructions(state.gptConfig),
      created: new Date().toISOString(),
      version: '1.0'
    };

    // Serialize to JSON
    const configJson = JSON.stringify(completeConfig, null, 2);

    // In a real implementation, you might save this to localStorage, a database, or export it

    return {
      success: true,
      data: configJson
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Track GPT creation analytics
 * @param state - Final conversation state
 * @param duration - Time taken to create (in milliseconds)
 */
export const trackGPTCreationAnalytics = (state: ConversationState, duration: number): void => {
  // In a real implementation, you would send this data to your analytics service
  const analyticsData = {
    templateUsed: state.selectedTemplates.length > 0 ? state.selectedTemplates[0] : 'custom',
    timeToCreate: duration,
    stagesVisited: state.conversationHistory.length,
    capabilities: state.gptConfig.capabilities.length,
    timestamp: new Date().toISOString()
  };

  // Console log for demonstration (would be replaced with actual analytics call)
  console.log('GPT Creation Analytics:', analyticsData);
};

/**
 * Apply custom template with replacements
 * @param templateKey - Key of the template to use
 * @param replacements - Key-value pairs for template variables
 * @returns Customized template string
 */
export const applyTemplate = (
  templateKey: keyof typeof SampleGPTInstructions,
  replacements: Record<string, string>
): string => {
  let templateContent = SampleGPTInstructions[templateKey].template;

  // Replace template variables
  Object.entries(replacements).forEach(([key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    templateContent = templateContent.replace(pattern, value);
  });

  return templateContent;
};

/**
 * Generate conversation starters based on GPT configuration
 * @param config - GPT configuration
 * @returns Array of conversation starter suggestions
 */
export const generateConversationStarters = (config: GPTConfig): string[] => {
  const starters: string[] = [];

  // Generate based on purpose
  starters.push(`Help me with ${config.purpose}`);

  // Generate based on capabilities
  if (config.capabilities.length > 0) {
    const capability = config.capabilities[0];
    starters.push(`I need assistance with ${capability.toLowerCase()}`);
  }

  // Add more specialized starters based on GPT type
  if (config.name.toLowerCase().includes('code') || config.purpose.toLowerCase().includes('cod')) {
    starters.push("Review this code snippet for improvements");
    starters.push("Help me debug this function");
  } else if (config.name.toLowerCase().includes('writ') || config.purpose.toLowerCase().includes('writ')) {
    starters.push("Help me draft a compelling introduction for");
    starters.push("I need feedback on this paragraph");
  } else if (config.name.toLowerCase().includes('data') || config.purpose.toLowerCase().includes('data')) {
    starters.push("Help me interpret these survey results");
    starters.push("What visualization would work best for this data?");
  }

  return starters;
};

/**
 * Generate a default GPT name if none provided
 * @param purpose - GPT purpose description
 * @returns Generated name suggestion
 */
export const generateDefaultName = (purpose: string): string => {
  // Extract key terms from purpose
  const keywords = purpose.toLowerCase().split(/\s+/);
  const significantWords = keywords.filter(word =>
    word.length > 3 &&
    !['with', 'that', 'this', 'from', 'help', 'assist', 'using', 'about'].includes(word)
  );

  // Get the most relevant terms
  let nameBase = '';
  if (significantWords.length > 0) {
    const mainWord = significantWords[0].charAt(0).toUpperCase() + significantWords[0].slice(1);
    nameBase = mainWord;
  } else {
    nameBase = 'Assistant';
  }

  // Add appropriate suffix
  if (purpose.toLowerCase().includes('code') || purpose.toLowerCase().includes('program')) {
    return `${nameBase} Coder`;
  } else if (purpose.toLowerCase().includes('write') || purpose.toLowerCase().includes('content')) {
    return `${nameBase} Writer`;
  } else if (purpose.toLowerCase().includes('data') || purpose.toLowerCase().includes('analys')) {
    return `${nameBase} Analyst`;
  } else if (purpose.toLowerCase().includes('teach') || purpose.toLowerCase().includes('learn')) {
    return `${nameBase} Tutor`;
  } else {
    return `${nameBase} Assistant`;
  }
};

// Export public API
export default {
  initializeConversationState,
  processConversationStage,
  generateAIResponse,
  parseUserIntent,
  saveGPTConfiguration,
  applyTemplate,
  generateConversationStarters,
  initialMessages,
  SampleGPTInstructions
};