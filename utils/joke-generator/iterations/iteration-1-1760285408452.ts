/**
 * Iteration 1 - 2025-10-12T16:10:08.452Z
 * Agent: joke-generator
 * Extraction Success: true
 * Execution Success: true
 */

(async () => {
  try {
    // Initialize Weave tracing
    await initWeave('joke-generator');
    
    // Create traced operations with proper namespacing
    const validateTopic = createTracedOp('joke-generator:validate_topic', (topic: string): boolean => {
      return typeof topic === 'string' && topic.trim().length > 0;
    });

    const generateJoke = createTracedOp('joke-generator:generate_joke', async (topic: string): Promise<string> => {
      const prompt = `Tell me a funny joke about ${topic}. Keep it appropriate and clever.`;
      return await wandbChat(prompt, {
        temperature: 0.7,
        maxTokens: 150
      });
    });

    const formatResponse = createTracedOp('joke-generator:format_response', (joke: string) => {
      return {
        success: true,
        joke: joke.trim(),
        timestamp: new Date().toISOString()
      };
    });

    /**
     * Generates a joke about a specific topic using AI
     * @param topic The subject matter for the joke
     * @returns A structured response with the joke or error information
     */
    async function generateJokeAgent(topic: string) {
      try {
        // Validate input
        if (!validateTopic(topic)) {
          return {
            success: false,
            error: 'Invalid topic: must be a non-empty string',
            timestamp: new Date().toISOString()
          };
        }

        // Generate the joke
        const joke = await generateJoke(topic);
        
        // Format and return response
        return formatResponse(joke);
      } catch (error: unknown) {
        const err = error as Error;
        return {
          success: false,
          error: `Failed to generate joke: ${err.message}`,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Example usage
    const result = await generateJokeAgent('programming');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error: unknown) {
    const err = error as Error;
    console.log(JSON.stringify({
      success: false,
      error: `Initialization failed: ${err.message}`,
      timestamp: new Date().toISOString()
    }));
  }
})();