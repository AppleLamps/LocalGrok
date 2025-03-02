import { toast } from "@/hooks/use-toast";

interface ChatCompletionRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string | {
      type: "text" | "image_url";
      text?: string;
      image_url?: {
        url: string;
        detail: "high" | "low" | "auto";
      };
    }[];
  }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatCompletionStreamResponse {
  id: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }[];
}

// Fixed URL to match XAI documentation
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

// Helper to add markdown formatting instructions to messages
const addMarkdownFormattingInstructions = (messages: { 
  role: "system" | "user" | "assistant"; 
  content: string | {
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;
      detail: "high" | "low" | "auto";
    };
  }[];
}[]): void => {
  const formattingText = "Format your responses using Markdown for better readability: use headings (##, ###), **bold** for key points, *italics* for emphasis, bullet points and numbered lists where appropriate, and code blocks with syntax highlighting (```language) for code snippets.";
  
  // Add a system message if none exists
  if (!messages.some(msg => msg.role === "system")) {
    messages.unshift({
      role: "system",
      content: `You are Grok, an AI assistant powered by the grok-2-latest model. You are helpful, concise, and provide accurate information. ${formattingText}`
    });
    return;
  }
  
  // Update existing system message
  const systemMessageIndex = messages.findIndex(msg => msg.role === "system");
  if (systemMessageIndex !== -1) {
    const existingContent = messages[systemMessageIndex].content;
    // Only add formatting instructions if message content is a string
    if (typeof existingContent === 'string' && !existingContent.includes("Format your responses using Markdown")) {
      messages[systemMessageIndex].content = `${existingContent} ${formattingText}`;
    }
  }
};

export const xaiService = {
  /**
   * Send a message to the XAI API and get a response
   */
  sendMessage: async (
    messages: { 
      role: "system" | "user" | "assistant"; 
      content: string | {
        type: "text" | "image_url";
        text?: string;
        image_url?: {
          url: string;
          detail: "high" | "low" | "auto";
        };
      }[];
    }[],
    apiKey: string
  ): Promise<string> => {
    if (!apiKey) {
      throw new Error("API Key is required");
    }

    // Ensure API key is trimmed of any whitespace
    const cleanApiKey = apiKey.trim();
    
    // Log a safe version of the API key for debugging (first 4 chars, last 2 chars)
    const keyLength = cleanApiKey.length;
    const safeKeyFormat = keyLength > 6 
      ? `${cleanApiKey.substring(0, 4)}...${cleanApiKey.substring(keyLength - 2)}`
      : '***';
    console.log(`Using API key format: ${safeKeyFormat}, length: ${keyLength}`);

    try {
      // Add markdown formatting instructions
      addMarkdownFormattingInstructions(messages);
      
      const requestBody: ChatCompletionRequest = {
        model: "grok-2-latest",
        messages,
        temperature: 0.7,
        max_tokens: 8192,
      };

      console.log("Sending request to XAI API:", JSON.stringify({
        url: XAI_API_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Only show authorization header exists, not the actual key
          "Authorization": "Bearer [REDACTED]"
        },
        body: {
          ...requestBody,
          messages: requestBody.messages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string'
              ? (m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content)
              : 'complex content with images'
          }))
        }
      }, null, 2));

      const response = await fetch(XAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanApiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData?.error?.message || `Error: ${response.status} ${response.statusText}`;
        } catch (e) {
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data: ChatCompletionResponse = await response.json();
      
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling XAI API:", error);
      
      // Throw a user-friendly error
      if (error instanceof Error) {
        throw new Error(`Failed to get response from XAI API: ${error.message}`);
      }
      
      throw new Error("Failed to get response from XAI API");
    }
  },

  /**
   * Stream a response from the XAI API
   */
  streamResponse: async (
    messages: { 
      role: "system" | "user" | "assistant"; 
      content: string | {
        type: "text" | "image_url";
        text?: string;
        image_url?: {
          url: string;
          detail: "high" | "low" | "auto";
        };
      }[];
    }[],
    apiKey: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    temperature: number = 0.7,
    maxTokens: number = 8192,
    model: string = "grok-2-latest"
  ): Promise<void> => {
    if (!apiKey) {
      throw new Error("API Key is required");
    }

    // Ensure API key is trimmed of any whitespace
    const cleanApiKey = apiKey.trim();
    
    try {
      // Add markdown formatting instructions to text messages only
      addMarkdownFormattingInstructions(messages);
      
      const requestBody: ChatCompletionRequest = {
        model: model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      };
      
      console.log("Sending streaming request to XAI API:", JSON.stringify({
        url: XAI_API_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Only show authorization header exists, not the actual key
          "Authorization": "Bearer [REDACTED]"
        },
        body: {
          ...requestBody,
          messages: requestBody.messages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string'
              ? (m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content)
              : 'complex content with images'
          }))
        }
      }, null, 2));
      
      // Log the full message history for debugging (with sensitive parts redacted)
      console.log("Full conversation history being sent:", JSON.stringify(
        messages.map((m, i) => ({
          index: i,
          role: m.role,
          // Redact long or complex messages for readability
          content: typeof m.content === 'string'
            ? (m.content.length > 100 ? `${m.content.substring(0, 100)}...` : m.content)
            : 'complex content with images'
        }))
      ));
      
      // Use proper fetch with streaming
      const response = await fetch(XAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanApiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData?.error?.message || `Error: ${response.status} ${response.statusText}`;
        } catch (e) {
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        
        let buffer = '';
        let done = false;
        
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (value) {
            // Decode the chunk and add it to our buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete events in the buffer
            const lines = buffer.split('\n');
            // Keep the last line in the buffer if it's incomplete
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                
                if (data === '[DONE]') {
                  onComplete();
                  return;
                }
                
                try {
                  const parsedData = JSON.parse(data);
                  const content = parsedData.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    onChunk(content);
                  } else if (parsedData.choices?.[0]?.finish_reason) {
                    // Handle finish reason
                    console.log(`Streaming completed with reason: ${parsedData.choices[0].finish_reason}`);
                  } else {
                    // Log any unexpected structure
                    console.log("Stream data without content:", JSON.stringify(parsedData));
                  }
                } catch (error) {
                  console.warn('Error parsing streaming response chunk:', error);
                }
              }
            }
          }
        }
        
        // Process any remaining data in the buffer
        if (buffer) {
          const lines = buffer.split('\n').filter(Boolean);
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              
              if (data !== '[DONE]') {
                try {
                  const parsedData = JSON.parse(data);
                  const content = parsedData.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    onChunk(content);
                  } else if (parsedData.choices?.[0]?.finish_reason) {
                    // Handle finish reason
                    console.log(`Streaming completed with reason: ${parsedData.choices[0].finish_reason}`);
                  } else {
                    // Log any unexpected structure
                    console.log("Final stream data without content:", JSON.stringify(parsedData));
                  }
                } catch (error) {
                  console.warn('Error parsing final stream data:', error);
                }
              }
            }
          }
        }
        
        // Ensure we call complete even if no [DONE] marker was received
        onComplete();
      } else {
        throw new Error("Response body is null");
      }
    } catch (error) {
      console.error("Error streaming from XAI API:", error);
      
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error("Failed to stream response from XAI API"));
      }
    }
  }
}; 