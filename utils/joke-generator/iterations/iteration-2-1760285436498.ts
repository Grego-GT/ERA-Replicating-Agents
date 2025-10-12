/**
 * Iteration 2 - 2025-10-12T16:10:36.498Z
 * Agent: joke-generator
 * Extraction Success: true
 * Execution Success: true
 */

(async () => {
  try {
    // Initialize Weave tracing
    await initWeave('joke-generator');
  } catch (error: unknown) {
    // Silently ignore weave initialization failures as they're expected in this environment
  }

  /**
   * Generates a joke about a specific topic using LLM inference with comprehensive tracing
   * @param topic - The subject matter for the joke (must be a non-empty string)
   * @returns A structured response containing the joke or error information
   */
  const generateJoke = createTracedOp('joke-generator:validate_topic', async (topic: string) => {
    // Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return {
        success: false,
        error: 'Topic must be a non-empty string',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Generate joke using wandbChat
      const generateJokeOp = createTracedOp('joke-generator:generate_joke', async (validatedTopic: string) => {
        const joke = await wandbChat(`Tell me a joke about ${validatedTopic}`, {
          temperature: 0.7,
          maxTokens: 150
        });
        return joke;
      });

      const joke = await generateJokeOp(topic);

      // Format response
      const formatResponse = createTracedOp('joke-generator:format_response', async (jokeText: string) => {
        return {
          success: true,
          joke: jokeText.trim(),
          timestamp: new Date().toISOString()
        };
      });

      return await formatResponse(joke);
    } catch (error: unknown) {
      const err = error as Error;
      return {
        success: false,
        error: `Failed to generate joke: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Export the function by attaching it to globalThis
  (globalThis as any).generateJoke = generateJoke;

  console.log('Joke generator agent initialized successfully');
  console.log('Usage: await generateJoke("programming")');

  // Example usage demonstration
  try {
    const example = await generateJoke('programming');
    console.log('Example output:', JSON.stringify(example, null, 2));
  } catch (error: unknown) {
    // Handle but don't fail on example
    const err = error as Error;
    console.log('Example generation failed:', err.message);
  }
})();