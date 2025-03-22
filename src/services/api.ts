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

// Max retries for API calls
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second delay between retries

/**
 * Helper to add markdown formatting instructions to messages
 */
const addMarkdownFormattingInstructions = (messages: Message[]): Message[] => {
  const formattingText = "Format your responses using Markdown for better readability when appropriate: use *italics* for emphasis, bullet points and numbered lists where appropriate, and code blocks with syntax highlighting (```language) for code snippets.";

  // Create a copy of the messages to avoid mutating the original
  const updatedMessages = [...messages];

  // Ensure all message contents are strings (X.AI API requirement)
  for (let i = 0; i < updatedMessages.length; i++) {
    if (typeof updatedMessages[i].content !== 'string') {
      console.warn("Converting non-string message content to string", updatedMessages[i]);
      updatedMessages[i] = {
        ...updatedMessages[i],
        content: JSON.stringify(updatedMessages[i].content)
      };
    }
  }

  // Check if a system message exists
  const systemMessageIndex = updatedMessages.findIndex(msg => msg.role === "system");

  if (systemMessageIndex === -1) {
    // Add a new system message if none exists
    updatedMessages.unshift({
      role: "system",
      content: `You are Grok, an AI assistant powered by the grok-2-latest model. You are helpful, concise, and provide accurate information. ${formattingText}`
    });
  } else {
    // Update existing system message if it doesn't already have formatting instructions
    const existingContent = updatedMessages[systemMessageIndex].content;
    if (typeof existingContent === 'string' && !existingContent.includes("Format your responses using Markdown")) {
      updatedMessages[systemMessageIndex].content = `${existingContent} ${formattingText}`;
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

  // Remove any whitespace and check validity
  const cleanKey = apiKey.trim();

  if (cleanKey.length < 10) {
    throw new Error("API Key appears to be invalid (too short)");
  }

  // Make sure the API key doesn't have any additional text like "Bearer "
  // which might be accidentally left in when copying from documentation
  if (cleanKey.toLowerCase().startsWith("bearer ")) {
    return cleanKey.substring(7);
  }

  return cleanKey;
};

/**
 * Creates a safe version of the API key for logging
 */
const getSafeKeyFormat = (apiKey: string): string => {
  const keyLength = apiKey.length;
  return keyLength > 6
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(keyLength - 2)}`
    : '***';
};

/**
 * Helper to introduce delay (for retry logic)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Handles API error responses
 */
const handleApiError = async (response: Response): Promise<never> => {
  let errorText;
  try {
    errorText = await response.text();
    console.error("API Error Response:", errorText);

    let errorMessage;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData?.error?.message ||
        errorData?.error ||
        errorData?.code ||
        `Error: ${response.status} ${response.statusText}`;

      // Add additional helpful context for common errors
      if (response.status === 400) {
        if (errorText.includes("Incorrect API key")) {
          errorMessage = "Incorrect API key format. Please check your API key in settings and ensure it's correctly copied from the X.AI console.";
        }
      }
    } catch (e) {
      errorMessage = `Error: ${response.status} ${response.statusText}`;
      if (errorText && errorText.length < 200) {
        errorMessage += ` - ${errorText}`;
      }
    }

    // Common error code handling
    if (response.status === 401) {
      throw new Error("Authentication failed: Invalid API key. Please check your API key in settings.");
    } else if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else if (response.status >= 500) {
      throw new Error(`Server error (${response.status}). The Grok API service may be experiencing issues.`);
    } else {
      throw new Error(errorMessage);
    }
  } catch (parseError) {
    // If we can't parse the error at all, return a generic message
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
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
      console.log(`Streaming completed with reason: ${parsedData.choices[0].finish_reason}`);
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
    let cleanApiKey: string;

    try {
      cleanApiKey = prepareApiKey(apiKey);
      console.log("Using API key:", getSafeKeyFormat(cleanApiKey));
    } catch (error) {
      console.error("API Key validation error:", error);
      throw new Error(`API Key error: ${error instanceof Error ? error.message : "Invalid API key"}`);
    }

    let retries = 0;
    let lastError: any = null;

    while (retries <= MAX_RETRIES) {
      try {
        // Add markdown formatting instructions
        const formattedMessages = addMarkdownFormattingInstructions(messages);

        const requestBody: ChatCompletionRequest = {
          model: options.model || DEFAULT_OPTIONS.model!,
          messages: formattedMessages,
          temperature: options.temperature || DEFAULT_OPTIONS.temperature,
          max_tokens: options.max_tokens || DEFAULT_OPTIONS.max_tokens,
        };

        console.log("Sending request to XAI API (attempt " + (retries + 1) + "):",
          prepareRequestLog(XAI_API_URL, requestBody));

        const response = await fetch(XAI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cleanApiKey}`,
            "Accept": "application/json"
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          await handleApiError(response);
        }

        const data: ChatCompletionResponse = await response.json();

        // Success!
        if (retries > 0) {
          console.log(`Request succeeded after ${retries} retries`);
        }

        return data.choices[0].message.content;
      } catch (error) {
        lastError = error;
        console.error(`Error calling XAI API (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error);

        // If we've reached max retries, throw the error
        if (retries >= MAX_RETRIES) {
          if (error instanceof Error) {
            throw new Error(`Failed to get response from XAI API: ${error.message}`);
          }
          throw new Error("Failed to get response from XAI API");
        }

        // Otherwise, retry after a delay
        retries++;
        await delay(RETRY_DELAY * retries); // Increase delay with each retry
      }
    }

    // This should never be reached due to the throw in the catch block above
    throw new Error("Failed to get response from XAI API after retries");
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
    let cleanApiKey: string;

    try {
      cleanApiKey = prepareApiKey(apiKey);
      console.log("Using API key for streaming:", getSafeKeyFormat(cleanApiKey));
    } catch (error) {
      console.error("API Key validation error for streaming:", error);
      onError(new Error(`API Key error: ${error instanceof Error ? error.message : "Invalid API key"}`));
      return;
    }

    let streamAborted = false;
    let retries = 0;

    while (retries <= MAX_RETRIES && !streamAborted) {
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

        console.log("Sending streaming request to XAI API (attempt " + (retries + 1) + "):",
          prepareRequestLog(XAI_API_URL, requestBody));

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
            "Authorization": `Bearer ${cleanApiKey}`,
            "Accept": "application/json"
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

            // Log success after retries if needed
            if (retries > 0) {
              console.log(`Streaming succeeded after ${retries} retries`);
            }

            // Successfully completed, return from function
            return;
          }
        } catch (streamError) {
          clearTimeout(streamTimeoutId);
          throw streamError;
        }
      } catch (error) {
        console.error(`Error streaming from XAI API (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error);

        if (streamAborted) {
          return;
        }

        // If we've reached max retries, report the error
        if (retries >= MAX_RETRIES) {
          if (error instanceof Error) {
            onError(error);
          } else {
            onError(new Error("Failed to stream response from XAI API after multiple attempts"));
          }
          return;
        }

        // Otherwise, retry after a delay
        retries++;
        await delay(RETRY_DELAY * retries); // Increase delay with each retry
      }
    }
  },

  /**
   * Call the AI with a message and get a response (simpler interface)
   */
  callAI: async (
    options: {
      messages: { role: string; content: string }[];
      max_tokens?: number;
      temperature?: number;
      projectInstructions?: string;
      model?: string;
    }
  ): Promise<{
    choices: [{ message: { content: string } }];
    quick_replies?: string[];
  }> => {
    // Construct messages array with system instructions if provided
    const messages: Message[] = [];

    // Add system message with project instructions if provided
    if (options.projectInstructions) {
      messages.push({
        role: 'system',
        content: options.projectInstructions as string // Ensure string type
      });
    }

    // Add the regular messages - ensure all content is string type
    messages.push(...options.messages.map(msg => ({
      role: msg.role as MessageRole,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    })));

    // Get API key from localStorage
    const apiKey = localStorage.getItem("apiKey") || "";
    if (!apiKey) {
      throw new Error("API Key is required. Please set your API key in settings.");
    }

    const apiOptions: APIOptions = {
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      model: options.model
    };

    try {
      // Get the response as a string
      const responseContent = await xaiService.sendMessage(messages, apiKey, apiOptions);

      // Return in the format expected by the calling code
      return {
        choices: [{ message: { content: responseContent } }],
        quick_replies: [] // Add any quick replies logic here if needed
      };
    } catch (error) {
      console.error("AI service error:", error);

      // Return a friendly error message in the expected format
      return {
        choices: [{
          message: {
            content: "I'm sorry, I encountered an error while processing your request. Please check your API key and try again."
          }
        }],
        quick_replies: ["Try again", "Check API settings"]
      };
    }
  }
};
