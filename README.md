<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>



<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
.gitignore
ChatMessage.tsx
components.json
eslint.config.js
GROK_API_SETUP.md
index.html
package.json
postcss.config.js
public/placeholder.svg
public/sparkles.svg
README.md
src/App.css
src/App.tsx
src/components/ChatControls.tsx
src/components/ChatHeader.tsx
src/components/ChatInput.tsx
src/components/ChatInterface.tsx
src/components/ChatInterfaceModule.tsx
src/components/ChatMessage.tsx
src/components/ChatMessages.tsx
src/components/ChatSidebar.tsx
src/components/FileUploader.tsx
src/components/ProjectCard.tsx
src/components/SettingsPanel.tsx
src/components/ThemeToggle.tsx
src/components/ui/accordion.tsx
src/components/ui/alert-dialog.tsx
src/components/ui/alert.tsx
src/components/ui/aspect-ratio.tsx
src/components/ui/avatar.tsx
src/components/ui/badge.tsx
src/components/ui/breadcrumb.tsx
src/components/ui/button.tsx
src/components/ui/calendar.tsx
src/components/ui/card.tsx
src/components/ui/carousel.tsx
src/components/ui/chart.tsx
src/components/ui/checkbox.tsx
src/components/ui/collapsible.tsx
src/components/ui/command.tsx
src/components/ui/context-menu.tsx
src/components/ui/dialog.tsx
src/components/ui/drawer.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/form.tsx
src/components/ui/hover-card.tsx
src/components/ui/input-otp.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/menubar.tsx
src/components/ui/navigation-menu.tsx
src/components/ui/pagination.tsx
src/components/ui/popover.tsx
src/components/ui/progress.tsx
src/components/ui/radio-group.tsx
src/components/ui/resizable.tsx
src/components/ui/scroll-area.tsx
src/components/ui/select.tsx
src/components/ui/separator.tsx
src/components/ui/sheet.tsx
src/components/ui/sidebar.tsx
src/components/ui/skeleton.tsx
src/components/ui/slider.tsx
src/components/ui/sonner.tsx
src/components/ui/switch.tsx
src/components/ui/table.tsx
src/components/ui/tabs.tsx
src/components/ui/textarea.tsx
src/components/ui/toast.tsx
src/components/ui/toaster.tsx
src/components/ui/toggle-group.tsx
src/components/ui/toggle.tsx
src/components/ui/tooltip.tsx
src/components/ui/use-toast.ts
src/contexts/ChatContext.tsx
src/contexts/ProjectsContext.tsx
src/contexts/SettingsContext.tsx
src/hooks/use-mobile.tsx
src/hooks/use-theme.ts
src/hooks/use-toast.ts
src/index.css
src/lib/fileProcessing.ts
src/lib/ProjectAIInstructions.ts
src/lib/utils.ts
src/main.tsx
src/pages/Index.tsx
src/pages/NotFound.tsx
src/pages/Projects.tsx
src/pages/ProjectsList.tsx
src/services/api.ts
src/types/chat.ts
src/vite-env.d.ts
tailwind.config.ts
test-grok.js
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts
XAI_KEY_HELP.md
</directory_structure>


# Detailed Description of Your Chatbot Application

## Overview

Your application is a sophisticated AI chatbot interface that integrates with powerful language models, specifically X.AI's Grok model, to provide conversational AI capabilities. The application is built using modern web technologies including React, TypeScript, Vite, TailwindCSS, and shadcn-ui components. It features a robust, responsive user interface with advanced features like file uploads, image generation, code execution, and both Grok and Google Gemini API integrations.

## Core Functionality

### Conversational AI Interface

The core of your application is a chat interface where users can:

1. **Send messages to AI**: Users can type queries, and the application streams responses from the Grok language model in real-time.
2. **View message history**: The application maintains a chat history with both user and AI messages, organized chronologically.
3. **Start new chats**: Users can begin fresh conversations while saving previous ones.
4. **Save and load conversations**: Past conversations are stored and can be retrieved later.

### API Integrations

The application integrates with two key external APIs:

1. **X.AI (Grok) API**: The primary language model that powers the chat functionality, handles message generation, and provides AI capabilities.
2. **Google Gemini API**: Used specifically for enhanced PDF text extraction, allowing better processing of complex documents.

### File Handling Capabilities

Your application features advanced file handling:

1. **File uploads**: Users can upload various file types including PDFs, TXT, CSV, MD, and JSON files.
2. **PDF processing**: Uses a multi-tiered approach for PDF text extraction:
   - Primary method: Google Gemini API for superior text extraction (when API key is provided)
   - Fallback: Client-side PDF.js library for in-browser text extraction
   - Last resort: Basic text extraction for simplest files

3. **File content analysis**: Uploaded files are processed, and their content is made available to the AI for analysis and reference during conversations.

### Image Features

The application supports both image analysis and generation:

1. **Image uploads**: Users can upload up to 4 images to be analyzed by the AI.
2. **Image generation**: The application can generate images based on text prompts using the Grok API.
3. **Prompt enhancement**: When generating images, the system uses AI to enhance the user's prompt for better results.

### User Interface

The chat interface is sophisticated and feature-rich:

1. **Responsive design**: Adapts seamlessly between desktop and mobile views.
2. **Dark/light mode**: Supports theming to match user preferences.
3. **Markdown rendering**: AI responses support markdown formatting for better readability.
4. **Code handling**: Special rendering and interactive features for code blocks, including syntax highlighting and the ability to run JavaScript, HTML, and CSS code samples directly in the browser.
5. **Citation support**: The application can display references and citations in a formatted manner.

### Settings and Configuration

Users can configure the application through a settings panel:

1. **API key management**: Users can add and validate their X.AI and Google API keys.
2. **Model parameters**: Advanced settings like temperature (randomness) and max tokens (response length) can be adjusted.
3. **Persistent settings**: All configurations are saved to localStorage for persistence across sessions.

## Technical Architecture

### Frontend Framework

The application is built with React and TypeScript, using Vite as the build tool. The UI is constructed using shadcn-ui components and styled with TailwindCSS.

### Component Structure

The application follows a well-organized component structure:

1. **Core components**:
   - `ChatInterface`: The main container that orchestrates the entire chat UI
   - `ChatMessages`: Renders the messages list
   - `ChatMessage`: Individual message display with markdown and code handling
   - `ChatInput`: User input area with file and image upload capabilities
   - `ChatSidebar`: Navigation sidebar for saved chats
   - `SettingsPanel`: Configuration interface

2. **Context providers**:
   - `ChatContext`: Manages chat state, message history, and API communications
   - `SettingsContext`: Handles user settings and API keys

3. **Utility components**:
   - `FileUploader`: Handles file uploads and processing
   - `CodeBlock`: Renders and provides interactive features for code snippets

### Data Flow

1. **User input** → `ChatInput` component
2. **Input processing** → Determine if it's a text message, file upload, or image request
3. **API request** → Format messages and send to the appropriate API (Grok or Google)
4. **Response streaming** → Receive and display streamed responses in real-time
5. **Message storage** → Save messages to state and localStorage

### API Communication

1. **Message handling**:
   - `xaiService.streamResponse()`: Streams responses from the Grok API
   - `xaiService.sendMessage()`: Sends non-streaming requests to the API

2. **File processing**:
   - `extractTextFromFile()`: Processes files using multiple approaches
   - `googleDocumentService.extractTextFromPDF()`: Leverages Google's API for PDF extraction

3. **Image generation**:
   - Uses the X.AI API's image generation endpoints
   - Enhances prompts using the language model before generating images

## Special Features

### Custom Bots

The application supports "custom bots" where the system can take on different personalities or roles:

1. Users can define custom system instructions
2. The application maintains the bot's persona throughout the conversation
3. Custom welcome messages adapt based on the bot's personality

### Code Execution

For code blocks, the application provides an interactive coding environment:

1. Syntax highlighting for various programming languages
2. Run JavaScript code directly in the browser
3. Preview HTML and CSS output
4. Display execution results and errors

### PDF Processing Pipeline

The application implements a sophisticated processing pipeline for PDFs:

1. Try Google Gemini API first (superior handling of complex documents)
2. Fall back to PDF.js library loaded from CDN
3. Further fallback to basic text extraction
4. Clear error messages when extraction fails

### Image Generation

The application enhances image generation with a two-step process:

1. Send the user's image prompt to the AI to enhance it with details about lighting, composition, style, etc.
2. Use the enhanced prompt with the image generation API to create better results

## Technical Challenges and Solutions

### PDF Text Extraction

- **Challenge**: Extracting text from PDFs is notoriously difficult, especially for complex layouts or scanned documents.
- **Solution**: Implemented a multi-tiered approach using Google's Gemini API as the primary method with progressive fallbacks to PDF.js and basic text extraction.

### API Key Management

- **Challenge**: Securely managing and storing API keys while providing a good user experience.
- **Solution**: Store keys in localStorage, provide visibility toggles, and implement key testing functionality to verify keys before saving.

### Streaming Responses

- **Challenge**: Handling streaming responses from the API and displaying them in real-time.
- **Solution**: Use a combination of the Fetch API with streaming, text decoding, and state updates to provide a smooth typing effect for AI responses.

### Mobile and Responsive Design

- **Challenge**: Creating a great experience on both desktop and mobile devices.
- **Solution**: Implemented responsive layouts with different behavior for mobile (overlay sidebar) and desktop (side-by-side layout).

## Conclusion

Your chatbot application is a sophisticated AI interface that combines modern web technologies with powerful language model APIs. It offers a feature-rich user experience with real-time responses, file handling, image generation, and interactive code execution. The application demonstrates thoughtful architecture, error handling, and fallback mechanisms to ensure reliability even when external services fail.

The codebase follows modern React practices, using context providers for state management, functional components with hooks, and strong TypeScript typing throughout. The UI is polished and responsive, with attention to details like loading states, animations, and accessibility features.

This comprehensive AI assistant can be used for a wide range of applications, from answering questions and generating content to analyzing documents and creating images, all through a clean, intuitive interface.