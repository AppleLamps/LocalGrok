// Define custom types for chat functionality

// Message role types
export type MessageRole = "system" | "user" | "assistant";

// Content types for messages
export type MessageContentItem = {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail: "high" | "low" | "auto";
  };
};

export type MessageContent = string | MessageContentItem[];

// Interface for messages
export interface MessageInterface {
  role: MessageRole;
  content: MessageContent;
}

// Interface for message requests
export interface MessageRequestInterface {
  model: string;
  messages: MessageInterface[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Types for model selection
export type ModelType = "grok-2-latest" | "grok-2-vision-latest";

// Payload type for vision requests
export interface GPT4VisionPayload {
  model: string;
  messages: MessageInterface[];
  max_tokens: number;
  temperature: number;
  stream: boolean;
} 