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
import * as weave from "./weave.js";

// Semaphore: Allow 10 concurrent requests at a time to avoid 503 errors
const sema = new Sema(10);

/**
 * Get Wandb API configuration from environment
 * 
 * @returns {object} Config object with apiKey and project
 */
function getWandbConfig() {
  const apiKey = Deno.env.get('WANDB_API_KEY');
  const project = Deno.env.get('WANDB_PROJECT');
  
  if (!apiKey) {
    throw new Error('WANDB_API_KEY not found in environment');
  }
  
  return { apiKey, project };
}

/**
 * Chat with an LLM using Wandb Inference API (internal implementation)
 * 
 * @param {object} options - Chat options
 * @param {string} options.model - Model name (default: "Qwen/Qwen3-Coder-480B-A35B-Instruct")
 * @param {Array} options.messages - Array of message objects with role and content
 * @param {string} options.systemPrompt - Optional system prompt (alternative to including in messages)
 * @param {number} options.temperature - Temperature for sampling (optional)
 * @param {number} options.maxTokens - Max tokens to generate (optional)
 * @param {number} options.topP - Top p sampling (optional)
 * @returns {Promise<object>} The completion response
 */
async function chatImpl({
  model = "Qwen/Qwen3-Coder-480B-A35B-Instruct",
  messages = [],
  systemPrompt = null,
  temperature = null,
  maxTokens = null,
  topP = null
}) {
  // Acquire semaphore token
  await sema.acquire();
  
  try {
    const { apiKey, project } = getWandbConfig();
    
    // Build messages array
    let fullMessages = [...messages];
    if (systemPrompt && !fullMessages.some(m => m.role === 'system')) {
      fullMessages = [
        { role: 'system', content: systemPrompt },
        ...fullMessages
      ];
    }
    
    // Build request body
    const body = {
      model,
      messages: fullMessages
    };
    
    // Add optional parameters
    if (temperature !== null) body.temperature = temperature;
    if (maxTokens !== null) body.max_tokens = maxTokens;
    if (topP !== null) body.top_p = topP;
    
    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    if (project) {
      headers['OpenAI-Project'] = project;
    }
    
    // Make the API call
    const response = await fetch('https://api.inference.wandb.ai/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      sema.release(); // Release on error
      throw new Error(`Wandb API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Chat completion received (model: ${model})`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Chat completion failed:', error);
    throw error;
  } finally {
    // Always release the semaphore token
    sema.release();
  }
}

/**
 * Chat with an LLM using Wandb Inference API
 * Traced with Weave for observability
 * 
 * @param {object} options - Chat options (see chatImpl for details)
 * @returns {Promise<object>} The completion response
 */
export const chat = weave.op(chatImpl);

/**
 * Simplified chat function that returns just the message content (internal implementation)
 * 
 * @param {string} userMessage - The user's message
 * @param {object} options - Optional parameters
 * @param {string} options.model - Model name
 * @param {string} options.systemPrompt - System prompt
 * @param {number} options.temperature - Temperature
 * @returns {Promise<string>} The assistant's response content
 */
async function simpleChatImpl(userMessage, options = {}) {
  const messages = [
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
export const simpleChat = weave.op(simpleChatImpl);

/**
 * Chat with conversation history (internal implementation)
 * 
 * @param {Array} conversationHistory - Array of previous messages
 * @param {string} newMessage - New user message to add
 * @param {object} options - Optional parameters
 * @returns {Promise<object>} Response with updated conversation and assistant message
 */
async function chatWithHistoryImpl(conversationHistory = [], newMessage, options = {}) {
  const messages = [
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
export const chatWithHistory = weave.op(chatWithHistoryImpl);

/**
 * Stream chat completions (if supported by the API) (internal implementation)
 * 
 * @param {object} options - Same as chat() options plus stream: true
 * @returns {Promise<ReadableStream>} Stream of completion chunks
 */
async function streamChatImpl(options) {
  // Acquire semaphore token
  await sema.acquire();
  
  try {
    const { apiKey, project } = getWandbConfig();
    
    const body = {
      ...options,
      stream: true
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    if (project) {
      headers['OpenAI-Project'] = project;
    }
    
    const response = await fetch('https://api.inference.wandb.ai/v1/chat/completions', {
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
    console.error('❌ Stream chat failed:', error);
    sema.release(); // Release on error
    throw error;
  }
}

/**
 * Stream chat completions
 * Traced with Weave for observability
 */
export const streamChat = weave.op(streamChatImpl);

/**
 * Run a test chat to verify the integration works
 * 
 * @returns {Promise<void>}
 */
export async function runWandbTest() {
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
    let history = [];
    
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
    console.error('❌ Wandb test failed:', error);
    throw error;
  }
}

// If run directly, execute the test
if (import.meta.main) {
  runWandbTest();
}

