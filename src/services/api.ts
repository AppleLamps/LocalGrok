import { toast } from "@/hooks/use-toast";

// Shared type definitions
type MessageRole = "system" | "user" | "assistant";

type MessageContent = string | {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail: "high" | "low" | "auto";
  };
}[];

interface Message {
  role: MessageRole;
  content: MessageContent;
}

interface APIOptions {
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: Message[];
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

// Configuration
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_OPTIONS: APIOptions = {
  temperature: 0.7,
  max_tokens: 8192,
  model: "grok-2-latest"
};

/**
 * Helper to add markdown formatting instructions to messages
 */
const addMarkdownFormattingInstructions = (messages: Message[]): Message[] => {
  const formattingText = "Format your responses using Markdown for better readability: use **bold** for emphasis, *italics* for emphasis, bullet points for lists, and code blocks when needed. **Avoid using titles, headings, or introductory phrases like 'Chatting Away' or 'Let's get started'. Respond directly to the user's query.**";

  const updatedMessages = [...messages];
  const systemMessageIndex = updatedMessages.findIndex(msg => msg.role === "system");

  if (systemMessageIndex === -1) {
    updatedMessages.unshift({
      role: "system",
      content: You are Grok, an AI assistant powered by the grok-2-latest model. You are helpful, concise, and provide accurate information. ${formattingText}
    });
  } else {
    const existingContent = updatedMessages[systemMessageIndex].content;
    if (typeof existingContent === 'string' && !existingContent.includes("Avoid using titles")) {
      updatedMessages[systemMessageIndex].content = ${existingContent} ${formattingText};
    }
  }

  return updatedMessages;
};

/**
 * Validates and prepares the API key
 */
const prepareApiKey = (apiKey: string): string => {
  if (!apiKey) {
    throw new Error("API Key is required");
  }

  return apiKey.trim();
};

/**
 * Creates a safe version of the API key for logging
 */
const getSafeKeyFormat = (apiKey: string): string => {
  const keyLength = apiKey.length;
  return keyLength > 6
    ? ${apiKey.substring(0, 4)}...${apiKey.substring(keyLength - 2)}
    : '***';
};

/**
 * Handles API error responses
 */
const handleApiError = async (response: Response): Promise<never> => {
  const errorText = await response.text();
  console.error("API Error Response:", errorText);

  let errorMessage;
  try {
    const errorData = JSON.parse(errorText);
    errorMessage = errorData?.error?.message || Error: ${response.status} ${response.statusText};
  } catch (e) {
    errorMessage = Error: ${response.status} ${response.statusText};
  }

  throw new Error(errorMessage);
};

/**
 * Prepares request logs with sensitive data redacted
 */
const prepareRequestLog = (url: string, requestBody: ChatCompletionRequest): string => {
  return JSON.stringify({
    url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  }, null, 2);
};

/**
 * Processes a line from the stream
 */
const processStreamLine = (
  line: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void
): boolean => {
  if (!line.startsWith('data: ')) return false;

  const data = line.substring(6);

  if (data === '[DONE]') {
    onComplete();
    return true;
  }

  try {
    const parsedData = JSON.parse(data);
    const content = parsedData.choices?.[0]?.delta?.content;

    if (content) {
      onChunk(content);
    } else if (parsedData.choices?.[0]?.finish_reason) {
      console.log(Streaming completed with reason: ${parsedData.choices[0].finish_reason});
    }
  } catch (error) {
    console.warn('Error parsing streaming response chunk:', error);
  }

  return false;
};

export const xaiService = {
  /**
   * Send a message to the XAI API and get a response
   */
  sendMessage: async (
    messages: Message[],
    apiKey: string,
    options: APIOptions = {}
  ): Promise<string> => {
    const cleanApiKey = prepareApiKey(apiKey);

    try {
      // Add markdown formatting instructions
      const formattedMessages = addMarkdownFormattingInstructions(messages);

      const requestBody: ChatCompletionRequest = {
        model: options.model || DEFAULT_OPTIONS.model!,
        messages: formattedMessages,
        temperature: options.temperature || DEFAULT_OPTIONS.temperature,
        max_tokens: options.max_tokens || DEFAULT_OPTIONS.max_tokens,
      };

      console.log("Sending request to XAI API:", prepareRequestLog(XAI_API_URL, requestBody));

      const response = await fetch(XAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": Bearer ${cleanApiKey},
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data: ChatCompletionResponse = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling XAI API:", error);

      if (error instanceof Error) {
        throw new Error(Failed to get response from XAI API: ${error.message});
      }

      throw new Error("Failed to get response from XAI API");
    }
  },

  /**
   * Stream a response from the XAI API
   */
  streamResponse: async (
    messages: Message[],
    apiKey: string,
    callbacks: {
      onChunk: (chunk: string) => void,
      onComplete: () => void,
      onError: (error: Error) => void
    },
    options: APIOptions = {}
  ): Promise<void> => {
    const { onChunk, onComplete, onError } = callbacks;
    const cleanApiKey = prepareApiKey(apiKey);
    let streamAborted = false;
    
    try {
      // Add markdown formatting instructions to text messages only
      const formattedMessages = addMarkdownFormattingInstructions(messages);

      const requestBody: ChatCompletionRequest = {
        model: options.model || DEFAULT_OPTIONS.model!,
        messages: formattedMessages,
        temperature: options.temperature || DEFAULT_OPTIONS.temperature,
        max_tokens: options.max_tokens || DEFAULT_OPTIONS.max_tokens,
        stream: true,
      };

      console.log("Sending streaming request to XAI API:", prepareRequestLog(XAI_API_URL, requestBody));

      // Create AbortController for fetch timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        streamAborted = true;
        onError(new Error("Request timed out after 30 seconds"));
      }, 30000); // 30 second timeout
      
      const response = await fetch(XAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": Bearer ${cleanApiKey},
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout once we have a response
      clearTimeout(timeoutId);
      
      if (streamAborted) return;

      if (!response.ok) {
        await handleApiError(response);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = '';
      let streamDone = false;
      let isComplete = false;
      
      // Set a timeout for reading the stream
      const streamTimeoutId = setTimeout(() => {
        streamAborted = true;
        reader.cancel("Stream timeout after 60 seconds").catch(console.error);
        onError(new Error("Stream timed out after 60 seconds"));
      }, 60000); // 60 second timeout

      try {
        while (!streamDone && !streamAborted) {
          const { value, done } = await reader.read();
          streamDone = done;

          if (value) {
            // Decode the chunk and add it to our buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete events in the buffer
            const lines = buffer.split('\n');
            // Keep the last line in the buffer if it's incomplete
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;

              if (processStreamLine(line, onChunk, () => { isComplete = true; })) {
                streamDone = true;
                break;
              }
            }
          }
        }

        // Process any remaining data in the buffer
        if (buffer && !streamAborted) {
          const lines = buffer.split('\n').filter(Boolean);

          for (const line of lines) {
            if (processStreamLine(line, onChunk, () => { isComplete = true; })) {
              break;
            }
          }
        }
        
        // Clear stream timeout
        clearTimeout(streamTimeoutId);
        
        // Only call onComplete if we're not already aborted
        if (!streamAborted) {
          // Final decoding with stream=false to flush any remaining characters
          decoder.decode();
          
          // Always call onComplete at the end of the stream
          onComplete();
        }
      } catch (streamError) {
        clearTimeout(streamTimeoutId);
        throw streamError;
      }
    } catch (error) {
      console.error("Error streaming from XAI API:", error);

      if (!streamAborted) {
        if (error instanceof Error) {
          onError(error);
        } else {
          onError(new Error("Failed to stream response from XAI API"));
        }
      }
    }
  }
};
