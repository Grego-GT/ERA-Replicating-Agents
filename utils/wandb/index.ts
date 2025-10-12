/**
 * Wandb Inference Integration
 * 
 * This module provides LLM chat/inference functionality using Wandb's inference API.
 * Includes Weave tracing for observability.
 * 
 * Usage:
 * - Import { chat, streamChat } from this file
 * - Make sure WANDB_API_KEY is set in .env
 * - Optionally set WANDB_PROJECT for OpenAI-Project header (format: "team/project")
 * - Initialize Weave with weave.init() to enable tracing
 */

import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { Sema } from "npm:async-sema";
import * as weave from "../weave/index.ts";

// Semaphore: Allow 10 concurrent requests at a time to avoid 503 errors
const sema = new Sema(10);

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Message in a conversation
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Options for chat function
 */
export interface ChatOptions {
  model?: string;
  messages?: ChatMessage[];
  systemPrompt?: string | null;
  /** Optional component name for component-specific URL lookup (e.g., 'director', 'codegen', 'fbi', 'sluggen') */
  component?: string;
}

/**
 * Wandb configuration
 */
interface WandbConfig {
  apiKey: string;
  project?: string;
  inferenceUrl: string;
}

/**
 * Chat completion choice
 */
interface ChatCompletionChoice {
  message: ChatMessage;
  finish_reason?: string;
  index?: number;
}

/**
 * Usage statistics
 */
interface ChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: ChatCompletionChoice[];
  usage?: ChatUsage;
}

/**
 * Chat with history response
 */
export interface ChatWithHistoryResponse {
  response: ChatCompletionResponse;
  assistantMessage: ChatMessage;
  updatedHistory: ChatMessage[];
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get Wandb API configuration from environment
 * Supports component-specific inference URLs and API keys for granular control
 * 
 * @param component - Optional component name (e.g., 'director', 'codegen', 'fbi', 'sluggen')
 * @returns Config object with apiKey, project, and inferenceUrl
 */
function getWandbConfig(component?: string): WandbConfig {
  const project = Deno.env.get('WANDB_PROJECT');
  
  // Component-specific API key lookup with fallback chain:
  // 1. INFERENCE_API_KEY_<COMPONENT> (e.g., INFERENCE_API_KEY_DIRECTOR)
  // 2. INFERENCE_API_KEY (global override)
  // 3. WANDB_API_KEY (default)
  let apiKey: string | undefined;
  
  if (component) {
    const componentKeyKey = `INFERENCE_API_KEY_${component.toUpperCase()}`;
    apiKey = Deno.env.get(componentKeyKey) || Deno.env.get('INFERENCE_API_KEY') || Deno.env.get('WANDB_API_KEY');
  } else {
    apiKey = Deno.env.get('INFERENCE_API_KEY') || Deno.env.get('WANDB_API_KEY');
  }
  
  if (!apiKey) {
    throw new Error('INFERENCE_API_KEY or WANDB_API_KEY not found in environment');
  }
  
  // Component-specific URL lookup with fallback chain:
  // 1. INFERENCE_URL_<COMPONENT> (e.g., INFERENCE_URL_DIRECTOR)
  // 2. INFERENCE_URL (global override)
  // 3. Default Wandb URL
  let inferenceUrl = 'https://api.inference.wandb.ai/v1/chat/completions';
  
  if (component) {
    const componentUrlKey = `INFERENCE_URL_${component.toUpperCase()}`;
    inferenceUrl = Deno.env.get(componentUrlKey) || Deno.env.get('INFERENCE_URL') || inferenceUrl;
  } else {
    inferenceUrl = Deno.env.get('INFERENCE_URL') || inferenceUrl;
  }
  
  return { apiKey, project, inferenceUrl };
}

/**
 * LLM Conversation Handler
 * Sends messages to Wandb Inference API and gets completion
 * Wrapped with weave.op() for full tracing including errors
 * 
 * @param options - Chat options
 * @returns The completion response
 */
async function llmConversation({
  model = Deno.env.get('AI_MODEL') || "Qwen/Qwen3-Coder-480B-A35B-Instruct",
  messages = [],
  systemPrompt = null,
  component
}: ChatOptions): Promise<ChatCompletionResponse> {
  const startTime = Date.now();
  
  // Acquire semaphore token
  await sema.acquire();
  
  console.log(`🤖 Wandb API call starting (model: ${model}${component ? `, component: ${component}` : ''})...`);
  
  try {
    const { apiKey, project, inferenceUrl } = getWandbConfig(component);
    
    // Build messages array
    let fullMessages: ChatMessage[] = [...messages];
    if (systemPrompt && !fullMessages.some(m => m.role === 'system')) {
      fullMessages = [
        { role: 'system', content: systemPrompt },
        ...fullMessages
      ];
    }
    
    // Build request body
    const body: Record<string, unknown> = {
      model,
      messages: fullMessages
    };
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    if (project) {
      headers['OpenAI-Project'] = project;
    }
    
    // Make the API call
    const response = await fetch(inferenceUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      const errorStatus = response.status;
      
      // Log detailed error for Weave trace visibility
      console.error(`❌ Wandb API error (${errorStatus}) after ${duration}ms`);
      console.error(`Error response: ${errorText.substring(0, 500)}`);
      
      sema.release(); // Release on error
      
      // Create enriched error object that Weave can capture in trace
      const errorObj = new Error(`Wandb API error (${errorStatus}): ${errorText}`);
      (errorObj as any).statusCode = errorStatus;
      (errorObj as any).errorResponse = errorText;
      (errorObj as any).duration = duration;
      (errorObj as any).model = model;
      (errorObj as any).messagesCount = fullMessages.length;
      (errorObj as any).timestamp = new Date().toISOString();
      
      throw errorObj;
    }
    
    const data = await response.json() as ChatCompletionResponse;
    
    console.log(`✅ Chat completion received (model: ${model}) in ${duration}ms`);
    if (data.usage?.total_tokens) {
      console.log(`📊 Token usage: ${data.usage.total_tokens} total tokens`);
    }
    
    return data;
    
  } catch (error) {
    const err = error as Error;
    const duration = Date.now() - startTime;
    
    // Enhanced error logging with full context for debugging
    console.error('❌ Chat completion failed:', err.message);
    console.error(`⏱️  Failed after ${duration}ms`);
    
    // Enrich error with metadata for Weave tracing
    if (!(err as any).duration) {
      (err as any).duration = duration;
      (err as any).model = model;
      (err as any).messagesCount = messages.length;
      (err as any).timestamp = new Date().toISOString();
    }
    
    throw err;
  } finally {
    // Always release the semaphore token
    sema.release();
  }
}

/**
 * Chat with an LLM using Wandb Inference API
 * Traced with Weave for observability
 * 
 * @param options - Chat options (see llmConversation for details)
 * @returns The completion response
 */
export const chat = weave.op(llmConversation);

/**
 * Quick Ask LLM
 * Single turn conversation - ask one question, get one answer
 * 
 * @param userMessage - The user's message
 * @param options - Optional parameters
 * @returns The assistant's response content
 */
async function quickAskLLM(userMessage: string, options: ChatOptions = {}): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'user', content: userMessage }
  ];
  
  const response = await chat({
    ...options,
    messages
  });
  
  return response.choices[0].message.content;
}

/**
 * Simplified chat function that returns just the message content
 * Traced with Weave for observability
 */
export const simpleChat = weave.op(quickAskLLM);

/**
 * Continue Multi-Turn Conversation
 * Maintains conversation context across multiple exchanges
 * 
 * @param conversationHistory - Array of previous messages
 * @param newMessage - New user message to add
 * @param options - Optional parameters
 * @returns Response with updated conversation and assistant message
 */
async function continueConversation(
  conversationHistory: ChatMessage[] = [], 
  newMessage: string, 
  options: ChatOptions = {}
): Promise<ChatWithHistoryResponse> {
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: newMessage }
  ];
  
  const response = await chat({
    ...options,
    messages
  });
  
  const assistantMessage = response.choices[0].message;
  
  return {
    response,
    assistantMessage,
    updatedHistory: [
      ...messages,
      assistantMessage
    ]
  };
}

/**
 * Chat with conversation history
 * Traced with Weave for observability
 */
export const chatWithHistory = weave.op(continueConversation);

/**
 * Stream LLM Response
 * Get streaming chat completions for real-time token delivery
 * 
 * @param options - Same as chat() options plus stream: true
 * @returns Stream of completion chunks
 */
async function streamLLMResponse(options: ChatOptions): Promise<ReadableStream<Uint8Array> | null> {
  // Acquire semaphore token
  await sema.acquire();
  
  try {
    const { apiKey, project, inferenceUrl } = getWandbConfig();
    
    const body: Record<string, unknown> = {
      ...options,
      stream: true
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    if (project) {
      headers['OpenAI-Project'] = project;
    }
    
    const response = await fetch(inferenceUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      sema.release(); // Release on error
      throw new Error(`Wandb API error (${response.status}): ${errorText}`);
    }
    
    console.log('✅ Streaming chat started');
    
    // Note: For streaming, you'll need to handle sema.release() when the stream is consumed
    return response.body;
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ Stream chat failed:', err);
    sema.release(); // Release on error
    throw error;
  }
}

/**
 * Stream chat completions
 * Traced with Weave for observability
 */
export const streamChat = weave.op(streamLLMResponse);

/**
 * Run a test chat to verify the integration works
 * 
 * @returns Promise that resolves when tests complete
 */
export async function runWandbTest(): Promise<void> {
  console.log('🚀 Starting Wandb Inference Test with Weave Tracing...\n');
  
  try {
    // Initialize Weave for tracing
    console.log('🔍 Initializing Weave tracing...');
    await weave.init();
    console.log('');
    
    // Test 1: Simple chat
    console.log('📝 Test 1: Simple joke request');
    const joke = await simpleChat('Tell me a joke.');
    console.log('🤖 Response:', joke);
    console.log('');
    
    // Test 2: Chat with system prompt
    console.log('📝 Test 2: Chat with system prompt');
    const response = await chat({
      systemPrompt: 'You are a helpful coding assistant.',
      messages: [
        { role: 'user', content: 'What is the purpose of async/await in JavaScript?' }
      ]
    });
    console.log('🤖 Response:', response.choices[0].message.content);
    console.log('📊 Usage:', response.usage);
    console.log('');
    
    // Test 3: Conversation with history
    console.log('📝 Test 3: Conversation with history');
    let history: ChatMessage[] = [];
    
    const turn1 = await chatWithHistory(history, 'My name is Alice.');
    console.log('👤 User: My name is Alice.');
    console.log('🤖 Assistant:', turn1.assistantMessage.content);
    history = turn1.updatedHistory;
    
    const turn2 = await chatWithHistory(history, 'What is my name?');
    console.log('👤 User: What is my name?');
    console.log('🤖 Assistant:', turn2.assistantMessage.content);
    console.log('');
    
    console.log('✅ All Wandb inference tests completed successfully!');
    console.log('🔍 Check your Weave dashboard for traces: https://wandb.ai/\n');
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ Wandb test failed:', err);
    throw error;
  }
}

